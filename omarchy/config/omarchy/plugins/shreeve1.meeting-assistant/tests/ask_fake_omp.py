#!/usr/bin/env python3
"""Fake `omp --mode rpc` that replays tests/fixtures/ask_turn.jsonl.

Usage: ask_fake_omp.py <scenario.json>

Measured from ask_turn.jsonl: ready/extension_ui_request/advisor_cost_changed come
first, then available_commands_update x2 and the get_available_commands
response; a prompt is acked before agent_start; a run ends with agent_end,
prompt_result, session_settled.
Measured from ask_busy_send.jsonl (real omp 18.6.3): a followUp prompt sent while a
run streams is acked after a queue_update; it is delivered after the current
reply as turn_start + user message_start/message_end (its exact text) + its
assistant message; there is ONE agent_start, ONE agent_end, then one
prompt_result per prompt in the order queued prompts, then the first prompt,
then ONE session_settled.
Measured from ask_abort_restore.jsonl (real omp 18.6.3): abort_and_restore_queue sent
while a run streams with queued follow-ups gives queue_update followUp=[], the cut-off
assistant message_end + turn_end, agent_end, then the response (it echoes an id only
if the request had one) whose data lists the undelivered follow-ups as {"text":...},
then prompt_result "aborted" for the queued prompts in order and then the running
prompt, then session_settled. The queued prompts never run; a later prompt runs normally.
Inferred (NOT in any fixture): old-runtime rejection (restore_reject) and that prompts
starting with "/" record no user message.

Scenario keys (all optional):
  drop_marker       bool   remove meeting-assistant-ask-context from the command list
  frame_delay       float  seconds slept before every turn frame
  delta_delay       float  seconds slept before every text_delta
  thin              bool   keep only agent_start, turn_start, user message_start/end,
                           text_delta, tool_execution_*, agent_end, prompt_result,
                           session_settled
  no_tools          bool   each prompt replies with the text message only (the shape of
                           ask_busy_send.jsonl) instead of tool call then text
  deltas            list   replace the fixture text_delta by one text_delta per entry
  local_output      object prompt text -> string or list of strings: the command_output text(s)
                           a local builtin prompt emits (default: "output of <command>")
  replies           object prompt text -> list of deltas, overriding "deltas" for that prompt
  string_content    bool   user message content is a plain string instead of text parts
  result_status     object prompt text -> prompt_result status (default "completed")
  hang_after        int    first prompt: stop streaming after N counted frames
  hang_release      "followup"  hang ends when a followUp prompt arrives (abort always ends it)
  exit_after        int    first prompt: exit(1) after N counted frames
  invalid_line_at   int    first prompt: write a non-JSON line before counted frame N
  prompt_fail       bool   answer prompt with success:false
  leak_after_abort  bool   emit one more text_delta after the abort arrives, before agent_end
  restore_reject    bool   answer abort_and_restore_queue with success:false and no data (older omp)
  exit_on_abort     bool   exit(1) when abort_and_restore_queue arrives, without replying
  first_launch      object scenario overrides applied only to the first launch of this scenario dir

Counted frames exclude turn_start and user message frames, so the indices above
are stable whether or not a prompt records a user message.
"""

import json
import os
import sys
import threading
import time

HERE = os.path.dirname(os.path.abspath(__file__))
FIXTURE = os.path.join(HERE, "fixtures", "ask_turn.jsonl")
MARKER = "meeting-assistant-ask-context"
THIN_TYPES = (
    "agent_start",
    "turn_start",
    "tool_execution_start",
    "tool_execution_end",
    "agent_end",
    "prompt_result",
    "session_settled",
)

scenario_path = sys.argv[1]
scenario_dir = os.path.dirname(os.path.abspath(scenario_path))
with open(scenario_path, encoding="utf-8") as fh:
    scenario = json.load(fh)
with open(FIXTURE, encoding="utf-8") as fh:
    FRAMES = [json.loads(line) for line in fh if line.strip()]

AGENT_START = FRAMES[7]
TURN_WITH_TOOLS = FRAMES[8:38]
TURN_TEXT_ONLY = FRAMES[8:11] + FRAMES[32:38]
AGENT_END = FRAMES[38]
EXTENSION_FRAME = FRAMES[39]

launch_file = os.path.join(scenario_dir, "launches")
try:
    with open(launch_file, encoding="utf-8") as fh:
        launches = int(fh.read() or "0") + 1
except FileNotFoundError:
    launches = 1
with open(launch_file, "w", encoding="utf-8") as fh:
    fh.write(str(launches))
if launches == 1:
    scenario.update(scenario.get("first_launch", {}))
with open(os.path.join(scenario_dir, "pid"), "w", encoding="utf-8") as fh:
    fh.write(str(os.getpid()))

out_lock = threading.Lock()
followups = []
state = {"running": False, "turns": 0, "gen": 0, "delivered": [], "first_id": None}
received = open(os.path.join(scenario_dir, "received.jsonl"), "a", encoding="utf-8", buffering=1)


def write_raw(text):
    sys.stdout.write(text + "\n")
    sys.stdout.flush()


def emit(obj):
    with out_lock:
        write_raw(json.dumps(obj))


def commands_frame(frame):
    frame = json.loads(json.dumps(frame))
    holder = frame["data"] if "data" in frame else frame
    if scenario.get("drop_marker"):
        holder["commands"] = [c for c in holder["commands"] if c.get("name") != MARKER]
    elif MARKER not in {c.get("name") for c in holder["commands"]}:
        holder["commands"].append({"name": MARKER, "description": "ask context"})
    return frame


def queue_update(texts):
    return {"type": "queue_update", "steering": [], "followUp": list(texts)}


def prompt_frames(text):
    frames = []
    source = TURN_TEXT_ONLY if scenario.get("no_tools") else TURN_WITH_TOOLS
    pieces = scenario.get("replies", {}).get(text, scenario.get("deltas"))
    for src in source:
        frame = json.loads(json.dumps(src))
        kind = frame.get("type")
        sub = (frame.get("assistantMessageEvent") or {}).get("type")
        role = (frame.get("message") or {}).get("role")
        if role == "user":
            if text.startswith("/"):
                continue
            frame["message"]["content"] = text if scenario.get("string_content") else [{"type": "text", "text": text}]
        elif scenario.get("thin") and not (kind in THIN_TYPES or sub == "text_delta"):
            continue
        if sub == "text_delta" and pieces:
            for piece in pieces:
                clone = json.loads(json.dumps(frame))
                clone["assistantMessageEvent"]["delta"] = piece
                frames.append(clone)
            continue
        frames.append(frame)
    return frames


def gate(count, gen):
    if scenario.get("hang_after") == count:
        while state["gen"] == gen:
            if scenario.get("hang_release") == "followup" and followups:
                break
            time.sleep(0.01)
    if scenario.get("exit_after") == count:
        os._exit(1)


def play(frames, first, gen):
    delay = float(scenario.get("frame_delay", 0))
    delta_delay = float(scenario.get("delta_delay", 0))
    count = 0
    for frame in frames:
        counted = first and frame.get("type") != "turn_start" and (frame.get("message") or {}).get("role") != "user"
        if counted:
            gate(count, gen)
        if delay:
            time.sleep(delay)
        if delta_delay and (frame.get("assistantMessageEvent") or {}).get("type") == "text_delta":
            time.sleep(delta_delay)
        with out_lock:
            if state["gen"] != gen:
                return None
            if counted and scenario.get("invalid_line_at") == count:
                write_raw("{this is not json")
            write_raw(json.dumps(frame))
        if counted:
            count += 1
    return count


def run(first_id, first_text, first, gen):
    delivered = []
    texts = {first_id: first_text}
    state.update(delivered=delivered, first_id=first_id)
    count = play([AGENT_START] + prompt_frames(first_text), first, gen)
    if count is None:
        return
    if first:
        gate(count, gen)
    while True:
        with out_lock:
            if state["gen"] != gen:
                return
            if not followups:
                frames = [AGENT_END]
                if not scenario.get("thin"):
                    frames.append(EXTENSION_FRAME)
                frames += [
                    {
                        "type": "prompt_result",
                        "id": prompt_id,
                        "agentInvoked": True,
                        "status": scenario.get("result_status", {}).get(texts[prompt_id], "completed"),
                        "sessionSettled": True,
                    }
                    for prompt_id in delivered + [first_id]
                ]
                frames.append({"type": "session_settled"})
                for frame in frames:
                    write_raw(json.dumps(frame))
                state["running"] = False
                return
            next_id, next_text = followups.pop(0)
            write_raw(json.dumps(queue_update(text for _, text in followups)))
        delivered.append(next_id)
        texts[next_id] = next_text
        if play(prompt_frames(next_text), False, gen) is None:
            return


def handle_abort(msg):
    if scenario.get("exit_on_abort"):
        os._exit(1)
    with out_lock:
        reply = {"type": "response", "command": "abort_and_restore_queue"}
        if "id" in msg:
            reply["id"] = msg["id"]
        if scenario.get("restore_reject"):
            reply.update(success=False, error="Unknown command")
        else:
            reply.update(success=True, data={"steering": [], "followUp": [{"text": text} for _, text in followups]})
        if not state["running"]:
            write_raw(json.dumps(reply))
            return
        state["gen"] += 1
        if scenario.get("leak_after_abort"):
            write_raw(json.dumps({"type": "message_update", "assistantMessageEvent": {"type": "text_delta", "contentIndex": 0, "delta": "LEAK"}}))
        if followups:
            write_raw(json.dumps(queue_update([])))
        if not scenario.get("thin"):
            write_raw(json.dumps(FRAMES[36]))
            write_raw(json.dumps(FRAMES[37]))
        write_raw(json.dumps(AGENT_END))
        write_raw(json.dumps(reply))
        queued_ids = [prompt_id for prompt_id, _ in followups]
        for prompt_id in queued_ids + state["delivered"] + [state["first_id"]]:
            write_raw(json.dumps({"type": "prompt_result", "id": prompt_id, "agentInvoked": True, "status": "aborted", "sessionSettled": True}))
        write_raw(json.dumps({"type": "session_settled"}))
        followups.clear()
        state["running"] = False


def ack(msg):
    return {"id": msg.get("id"), "type": "response", "command": "prompt", "success": True}


LOCAL_COMMANDS = ("/dirs", "/context", "/tools", "/jobs", "/changelog")


def is_local(text):
    return text.split(None, 1)[:1] in ([c] for c in LOCAL_COMMANDS)


def handle_local(msg, text):
    output = scenario.get("local_output", {}).get(text, "output of " + text.split(None, 1)[0])
    pieces = [output] if isinstance(output, str) else list(output)
    with out_lock:
        for piece in pieces:
            write_raw(json.dumps({"type": "command_output", "text": piece}))
        write_raw(
            json.dumps(
                {"id": msg.get("id"), "type": "response", "command": "prompt", "success": True, "data": {"agentInvoked": False}}
            )
        )


def handle_prompt(msg):
    if scenario.get("prompt_fail"):
        emit({"id": msg.get("id"), "type": "response", "command": "prompt", "success": False, "error": "rejected"})
        return
    text = msg.get("message", "")
    if is_local(text):
        handle_local(msg, text)
        return
    with out_lock:
        if msg.get("streamingBehavior") == "followUp" and state["running"]:
            followups.append((msg.get("id"), text))
            write_raw(json.dumps(queue_update(t for _, t in followups)))
            write_raw(json.dumps(ack(msg)))
            return
        write_raw(json.dumps(ack(msg)))
        state["running"] = True
        state["turns"] += 1
        threading.Thread(target=run, args=(msg.get("id"), text, state["turns"] == 1, state["gen"]), daemon=True).start()


def handle(msg):
    kind = msg.get("type")
    if kind == "get_available_commands":
        emit(commands_frame(FRAMES[3]))
        emit(commands_frame(FRAMES[4]))
        response = commands_frame(FRAMES[5])
        response["id"] = msg.get("id")
        emit(response)
    elif kind == "prompt":
        handle_prompt(msg)
    elif kind == "abort_and_restore_queue":
        handle_abort(msg)


for index in (0, 1, 2):
    emit(FRAMES[index])
for raw in sys.stdin.buffer:
    text = raw.decode("utf-8")
    received.write(text if text.endswith("\n") else text + "\n")
    try:
        message = json.loads(text)
    except ValueError:
        continue
    if isinstance(message, dict):
        handle(message)
