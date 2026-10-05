#!/usr/bin/env python3
"""Struggle review: where did Paperclip agents spend requests finding their way?

Reads Pi run transcripts (~/.pi/paperclips/*.jsonl). One assistant turn = one model
request. A turn is flagged when it failed (a tool result isError), went looking for
something (find/grep -R/readlink/openapi/Paperclip server source), retried a stale
browser ref, or dumped the environment. Runs of 2+ flagged turns in a row are the
places to fix: give the agent the exact command, path or URL in the skill it reads.

Secrets are redacted in the output; never paste raw transcript text anywhere.

Usage:
  python3 struggle.py                       # runs from the last 24h
  python3 struggle.py --since 2026-10-04T20:00 [--agent Voice]
  python3 struggle.py FILE.jsonl ...
"""
import argparse
import glob
import json
import os
import re
from datetime import datetime, timedelta, timezone

DIR = os.path.expanduser("~/.pi/paperclips")
AGENTS = {
    "5b6b545b": "Dispatcher", "d7c6f21e": "Halo Admin", "e0e3216e": "Identity & M365",
    "5eaa9ad4": "Network & Security", "8e002cee": "Voice", "c2eef6f8": "Service Desk Lead",
    "9a7148b2": "Reviewer", "9a3c86ed": "Librarian", "b20b76ec": "Endpoint",
}
DISCOVERY = re.compile(
    r"\bfind\s|grep\s+-\w*R|\breadlink\b|\brealpath\b|openapi|node_modules/@paperclipai|"
    r"__describe__|\bls\s+-?\w*\s*/home|which\s")
ENV_DUMP = re.compile(r"\bprintenv\b|\benv\s*\|")
SECRET = re.compile(
    r"eyJ[\w\-.]+|((?:SECRET|KEY|TOKEN|PASSWORD|DATABASE_URL)\w*=)\S+|[A-Za-z0-9_\-]{40,}")


def redact(text: str) -> str:
    return SECRET.sub(lambda m: (m.group(1) or "") + "…", text)


def summarize(args: dict) -> str:
    if not isinstance(args, dict):
        return str(args)
    for key in ("command", "path", "url", "pattern"):
        if args.get(key):
            return str(args[key])
    return json.dumps(args)


def review(path: str) -> None:
    turns = []  # one per model request: {"calls": [...], "tags": set(), "why": str}
    by_call = {}
    with open(path, errors="replace") as fh:
        lines = fh.readlines()
    for line in lines:
        msg = json.loads(line).get("message") or {}
        if msg.get("role") == "assistant":
            turn = {"calls": [], "tags": set(), "why": ""}
            for part in msg.get("content") or []:
                if part.get("type") == "toolCall":
                    call = f"{part.get('name')}: {summarize(part.get('arguments'))}"
                    turn["calls"].append(call)
                    by_call[part.get("id")] = (turn, call)
                    for tag, rx in (("search", DISCOVERY), ("env-dump", ENV_DUMP)):
                        if rx.search(call):
                            turn["tags"].add(tag)
                            turn["why"] = turn["why"] or call
            turns.append(turn)
        elif msg.get("role") == "toolResult" and msg.get("toolCallId") in by_call:
            turn, call = by_call[msg["toolCallId"]]
            if "not in the latest snapshot" in str(msg.get("content")):
                turn["tags"].add("stale-ref")
            elif msg.get("isError"):
                turn["tags"].add("failed")
            else:
                continue
            turn["why"] = turn["why"] or call
    name = os.path.basename(path)
    agent = AGENTS.get(name[25:33], name[25:33])
    flagged = sum(1 for t in turns if t["tags"])
    print(f"\n## {name[:19]} {agent}: {len(turns)} requests, {flagged} flagged")
    streak = []
    for turn in turns + [{"calls": [], "tags": set(), "why": ""}]:
        if turn["tags"]:
            streak.append(turn)
            continue
        if len(streak) >= 2 or any("env-dump" in t["tags"] for t in streak):
            print(f"  streak of {len(streak)} requests:")
            for t in streak:
                print(f"    [{','.join(sorted(t['tags']))}] "
                      + redact(t["why"])[:120].replace("\n", " "))
        streak = []


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("files", nargs="*")
    parser.add_argument("--since", help="UTC, e.g. 2026-10-04T20:00 (default: 24h ago)")
    parser.add_argument("--agent", help="agent name, e.g. Voice")
    args = parser.parse_args()
    files = args.files
    if not files:
        since = args.since or (datetime.now(timezone.utc) - timedelta(hours=24)).strftime("%Y-%m-%dT%H:%M")
        stamp = since.replace(":", "-")
        files = [f for f in sorted(glob.glob(f"{DIR}/*.jsonl")) if os.path.basename(f) >= stamp]
    if args.agent:
        files = [f for f in files if AGENTS.get(os.path.basename(f)[25:33]) == args.agent]
    for f in files:
        review(f)


if __name__ == "__main__":
    main()
