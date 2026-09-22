"""advisor — a second-model watchdog for Hermes Agent.

A Hermes port of the DeepSeek Harness ``dsh-goal-keeper`` / ``dsh-mini-advisor``
plugin. Each turn, a second (advisor) model reviews the slice of transcript
produced since the last review and, when something matters — a bug, a security
hole, a wrong turn, or a premature "done" — injects one short, weighable
advisory note into the primary agent's current turn.

How it maps onto Hermes primitives (all verified against the installed
``hermes-agent`` source, not assumed):

* Trigger + injection: the ``pre_llm_call`` hook. It fires at the top of every
  turn with ``conversation_history=list(messages)`` and any returned
  ``{"context": ...}`` is injected into *this* turn's user message — ephemeral,
  never persisted, and cache-safe (system prompt stays byte-stable). That single
  hook is both our "review the latest slice" trigger and our advice channel, so
  unlike the dsh version there is no cross-turn injection state to juggle.
* Second-model call: ``ctx.llm.complete_structured(...)``. Zero-config — it runs
  against whatever provider/model the user is currently on, with host-owned auth.
  Optionally pin a cheaper advisor model via a registered auxiliary ``task`` (see
  README / config notes below).
* Per-session toggle: ``ctx.register_command`` → ``/advisor on|off|status``.

Config (``config.yaml`` → ``plugins.entries.advisor.settings``, all optional):

    plugins:
      enabled: [advisor]
      entries:
        advisor:
          settings:
            enabled: true          # global default; /advisor overrides per session
            min_delta_chars: 40     # skip reviews smaller than this
            max_delta_chars: 12000  # cap transcript slice fed to the advisor
            persona: "<override the reviewing persona>"

To run the advisor on a *different* (e.g. cheaper) model than the user's active
one, register it as an auxiliary task and point config at it:

    auxiliary:
      advisor:
        provider: openrouter
        model: anthropic/claude-3-5-haiku

The plugin registers the ``advisor`` auxiliary task; when configured it is used,
otherwise the call falls through to the user's active model (no override, no
trust-gate grant required).
"""

from __future__ import annotations

import json
import logging
import threading
from typing import Any, Dict, List, Optional

logger = logging.getLogger("hermes.plugins.advisor")

# ---------------------------------------------------------------------------
# Static prompt material
# ---------------------------------------------------------------------------

DEFAULT_PERSONA = (
    "You are a rigorous advisor watching a coding agent. Speak up only when "
    "something matters: a bug, a security hole, a wrong turn, or a premature "
    '"done". Keep advice concrete and short.'
)

# Harness mechanics the advisor must not get wrong. The advisor model reviews a
# Hermes transcript but has no Hermes knowledge of its own, so without these it
# invents plausible-sounding remedies. Wrong advice delivered confidently is
# worse than silence, so state the few mechanics advisories most often turn on.
# (Ported and re-grounded for Hermes' actual tool surface.)
HARNESS_FACTS = "\n".join(
    [
        "Facts about this agent's harness — advise within them, and never invent "
        "a tool or capability not listed here:",
        "- Subagents (delegated tasks) run in isolated contexts and return one "
        "final summary. You cannot see their intermediate work; a rising event "
        "count means a child is alive, not that it is making progress.",
        "- Ending a turn while subagents run is CORRECT: the runtime wakes the "
        "agent when they settle. Waiting is a legitimate action; never advise "
        "polling in a loop to stay busy.",
        "- Background processes (background terminal runs) are managed with the "
        "process tool (poll/wait/log), NOT the same thing as subagents — don't "
        "conflate the two or cross their APIs.",
        "- The agent edits files through patch/write_file tools and runs "
        "builds/tests through the terminal. 'Done' should mean real tool output "
        "was produced, not that a plan or stub was written.",
        "- You are an advisor, not the operator. You cannot call tools, run "
        "commands, or edit files. Your only lever is one short note.",
    ]
)

REVIEW_INSTRUCTIONS = "\n".join(
    [
        "You are watching the latest slice of a coding-agent transcript below.",
        "Your job is to keep the primary agent on track toward its objective "
        "until it is genuinely done.",
        'When something matters — a bug, a security hole, a wrong turn, or a '
        'premature "done" — set should_advise=true and give ONE concrete note '
        "(one or two sentences) plus a severity (nit | concern | blocker).",
        "Pick the single most important thing and say only that; do not bundle "
        "several concerns into one note.",
        "If nothing needs saying, set should_advise=false and leave note empty.",
        "",
        HARNESS_FACTS,
    ]
)

# Structured-output schema for the advisor's verdict.
ADVICE_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "properties": {
        "should_advise": {
            "type": "boolean",
            "description": "True only when there is something concrete worth telling the agent.",
        },
        "severity": {
            "type": "string",
            "enum": ["nit", "concern", "blocker"],
            "description": "How much this matters.",
        },
        "note": {
            "type": "string",
            "description": "The concrete advice, one or two sentences. Empty when should_advise is false.",
        },
    },
    "required": ["should_advise"],
    "additionalProperties": False,
}

# Wrapper mirrors the dsh advisory envelope: severity + an explicit reminder
# that the advice is weighable, not an order.
ADVISORY_TEMPLATE = (
    '<advisory advisor="advisor" severity="{severity}" '
    'guidance="weigh this, do not blindly obey">{note}</advisory>'
)


# ---------------------------------------------------------------------------
# Transcript rendering
# ---------------------------------------------------------------------------

def _render_message(msg: Dict[str, Any]) -> str:
    """Flatten one OpenAI-shape message into reviewable plain text."""
    role = str(msg.get("role", "") or "")
    parts: List[str] = []

    content = msg.get("content")
    if isinstance(content, str):
        if content.strip():
            parts.append(content.strip())
    elif isinstance(content, list):
        for block in content:
            if not isinstance(block, dict):
                continue
            btype = block.get("type")
            if btype in ("text", "input_text", "output_text"):
                text = block.get("text")
                if isinstance(text, str) and text.strip():
                    parts.append(text.strip())
            elif btype in ("image", "input_image"):
                parts.append("[image]")
            elif btype in ("tool_result", "tool-result"):
                out = block.get("content") or block.get("output")
                if isinstance(out, str) and out.strip():
                    parts.append(out.strip())

    # Assistant tool calls (OpenAI `tool_calls` shape).
    tool_calls = msg.get("tool_calls")
    if isinstance(tool_calls, list):
        for call in tool_calls:
            if not isinstance(call, dict):
                continue
            fn = call.get("function") or {}
            name = fn.get("name") or call.get("name") or "tool"
            args = fn.get("arguments")
            if isinstance(args, (dict, list)):
                try:
                    args = json.dumps(args)
                except Exception:
                    args = str(args)
            args = str(args or "")
            if len(args) > 600:
                args = args[:600] + "…"
            parts.append(f"[calls {name}] {args}")

    if not parts:
        return ""
    label = {
        "user": "USER",
        "assistant": "AGENT",
        "tool": "TOOL",
        "system": "SYSTEM",
    }.get(role, role.upper() or "MSG")
    return f"{label}: " + "\n".join(parts)


def render_delta(
    messages: List[Dict[str, Any]],
    cursor: int,
    max_chars: int,
) -> "tuple[str, int]":
    """Render messages[cursor:] to text, returning (text, next_cursor).

    ``next_cursor`` always advances to ``len(messages)`` so already-reviewed
    content is never replayed, even when the slice is skipped as too short. The
    system prompt (index 0, role=system) is skipped — it is byte-stable and not
    part of the evolving transcript.
    """
    n = len(messages)
    start = max(cursor, 0)
    rendered: List[str] = []
    for msg in messages[start:n]:
        if not isinstance(msg, dict):
            continue
        if msg.get("role") == "system":
            continue
        piece = _render_message(msg)
        if piece:
            rendered.append(piece)
    text = "\n\n".join(rendered)
    if len(text) > max_chars:
        # Keep the tail — the most recent activity is what the advisor weighs.
        text = "…\n\n" + text[-max_chars:]
    return text, n


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

def _get_setting(ctx, key: str, default: Any) -> Any:
    """Read one ``plugins.entries.advisor.settings.<key>`` value.

    Uses the plugin-relative ``ctx.get_config`` seam; falls back to the default
    if the API or the key is absent.
    """
    getter = getattr(ctx, "get_config", None)
    if not callable(getter):
        return default
    try:
        value = getter(key, default)
    except Exception:
        return default
    return default if value is None else value


def _as_bool(value: Any, default: bool) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in ("1", "true", "yes", "on")
    return default


def _as_int(value: Any, default: int) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


# ---------------------------------------------------------------------------
# Plugin entrypoint
# ---------------------------------------------------------------------------

def register(ctx) -> None:
    # Register an auxiliary task so operators MAY pin a cheaper advisor model in
    # `auxiliary.advisor`. Best-effort: older cores may lack the method.
    reg_aux = getattr(ctx, "register_auxiliary_task", None)
    if callable(reg_aux):
        try:
            reg_aux(
                "advisor",
                display_name="Advisor",
                description="Second-model turn reviewer for the advisor plugin.",
            )
        except Exception as exc:
            logger.debug("advisor: register_auxiliary_task failed: %s", exc)

    # Per-session review cursor over the message list, an in-flight guard so one
    # session never runs two advisor calls at once, the last note (to suppress
    # immediate repeats), and per-session on/off overrides for /advisor.
    cursors: Dict[str, int] = {}
    reviewing: set[str] = set()
    last_notes: Dict[str, str] = {}
    enabled_by_session: Dict[str, bool] = {}
    lock = threading.Lock()

    def _global_enabled() -> bool:
        return _as_bool(_get_setting(ctx, "enabled", True), True)

    def _is_enabled(session_id: str) -> bool:
        with lock:
            override = enabled_by_session.get(session_id)
        return override if override is not None else _global_enabled()

    # -- /advisor on|off|status ------------------------------------------------
    def _advisor_command(raw_args: str) -> str:
        arg = (raw_args or "").strip().lower()
        # The hook keys everything by session_id, but the command handler has no
        # session in scope. We apply the toggle to every currently-tracked
        # session; in a single CLI session that is exactly the active one.
        if arg in ("on", "enable", "enabled"):
            with lock:
                targets = set(cursors) | set(enabled_by_session)
                for sid in targets or {"__default__"}:
                    enabled_by_session[sid] = True
            return "advisor: on for this session."
        if arg in ("off", "disable", "disabled"):
            with lock:
                targets = set(cursors) | set(enabled_by_session)
                for sid in targets or {"__default__"}:
                    enabled_by_session[sid] = False
            return "advisor: off for this session — no reviews or advice."
        # status
        gdefault = _global_enabled()
        with lock:
            overrides = {k: v for k, v in enabled_by_session.items()}
        if overrides:
            state = "on" if any(overrides.values()) else "off"
            src = "session override"
        else:
            state = "on" if gdefault else "off"
            src = "global default"
        return (
            f"advisor: {state} ({src}). "
            f"Global default is {'on' if gdefault else 'off'}. "
            "Use /advisor on | /advisor off to change this session."
        )

    try:
        ctx.register_command(
            name="advisor",
            handler=_advisor_command,
            description="Toggle the advisor for this session (on | off | status).",
            args_hint="on | off | status",
        )
    except Exception as exc:
        logger.debug("advisor: register_command failed: %s", exc)

    # -- the review, on every turn --------------------------------------------
    def _pre_llm_call(**kwargs) -> Optional[Dict[str, str]]:
        session_id = str(kwargs.get("session_id") or "")
        if not session_id:
            return None

        # Only interactive coding sessions benefit; skip subagent children so we
        # don't advise-storm delegated work (they carry a parent_session_id).
        if str(kwargs.get("parent_session_id") or ""):
            return None

        if not _is_enabled(session_id):
            return None

        with lock:
            if session_id in reviewing:
                return None
            reviewing.add(session_id)
        try:
            min_delta = _as_int(_get_setting(ctx, "min_delta_chars", 40), 40)
            max_delta = _as_int(_get_setting(ctx, "max_delta_chars", 12000), 12000)
            persona = _get_setting(ctx, "persona", None)
            if not isinstance(persona, str) or not persona.strip():
                persona = DEFAULT_PERSONA

            history = kwargs.get("conversation_history")
            if not isinstance(history, list) or not history:
                return None

            with lock:
                cursor = cursors.get(session_id, 0)
            text, next_cursor = render_delta(history, cursor, max_delta)
            # Advance the cursor even when we skip, so skipped content is not
            # replayed on the next turn.
            with lock:
                cursors[session_id] = next_cursor

            if not text.strip() or len(text.strip()) < min_delta:
                return None

            try:
                result = ctx.llm.complete_structured(
                    instructions=REVIEW_INSTRUCTIONS,
                    input=[{"type": "text", "text": text}],
                    json_schema=ADVICE_SCHEMA,
                    schema_name="advisor.verdict",
                    system_prompt=persona,
                    task="advisor",
                    temperature=0.0,
                    max_tokens=400,
                    purpose="advisor.review",
                )
            except Exception as exc:
                # A dead advisor (no adapter, timeout, bad config) must never
                # break the primary turn — fail open, log, move on.
                logger.warning("advisor: llm call failed: %s", exc)
                return None

            parsed = getattr(result, "parsed", None)
            if not isinstance(parsed, dict):
                return None
            if not parsed.get("should_advise"):
                return None
            note = str(parsed.get("note") or "").strip()
            if not note:
                return None
            severity = str(parsed.get("severity") or "concern").strip().lower()
            if severity not in ("nit", "concern", "blocker"):
                severity = "concern"

            # Suppress an identical back-to-back note.
            with lock:
                if last_notes.get(session_id) == note:
                    return None
                last_notes[session_id] = note

            advisory = ADVISORY_TEMPLATE.format(severity=severity, note=note)
            logger.info(
                "advisor: injected %s advisory into session %s", severity, session_id
            )
            return {"context": advisory}
        finally:
            with lock:
                reviewing.discard(session_id)

    ctx.register_hook("pre_llm_call", _pre_llm_call)

    # Clean up per-session state so long-lived processes don't leak maps.
    def _cleanup(**kwargs) -> None:
        session_id = str(kwargs.get("session_id") or "")
        if not session_id:
            return
        with lock:
            cursors.pop(session_id, None)
            last_notes.pop(session_id, None)
            enabled_by_session.pop(session_id, None)
            reviewing.discard(session_id)

    ctx.register_hook("on_session_reset", _cleanup)
    ctx.register_hook("on_session_finalize", _cleanup)
