#!/usr/bin/env python3
"""Score verifier models against the 5-case scope-gate matrix.

Runs each (model x case x trial) through replay.py with the SHIPPED prompt
(USE_BRIDGE=1 DISTILL=1), parses `VERDICT: PASS/REVISE`, and prints per-model
accuracy vs expected + per-case stability. This is the hand-run comparison
matrix (deepseek 18/18 vs gpt-5.6-terra ~13/18) made into one command.

Usage:
  bench.py                       # default models, N=3 trials
  bench.py deepseek-v4-pro openai-codex/gpt-5.6-terra
  N=5 bench.py <slot> ...
Slots with "/" route through the Pi bridge; a bare name = deepseek direct.
"""
import os, re, sys, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
SESS = os.path.expanduser("~/.omnigent/pi-native")

# The 5-case matrix (PIMOA contributes two cuts -> 6 rows). Each: label, session
# hash-dir, jsonl filename, turn index, cut steps, expected verdict.
MATRIX = [
    ("HIDE",     "10c688e6725c900efe6d0de29d499d7a", "2026-07-14T03-12-27-171Z_019f5e9c-9223-7ab9-ae27-a066d33a6696.jsonl", 0, 30, "REVISE"),
    ("PIMOA@30", "5ed0392b1c0a2a1da9dd0bbdeae4ac94", "2026-07-13T22-11-21-421Z_019f5d88-e8cd-729f-b773-3092ec693e2e.jsonl", 1, 30, "PASS"),
    ("PIMOA@40", "5ed0392b1c0a2a1da9dd0bbdeae4ac94", "2026-07-13T22-11-21-421Z_019f5d88-e8cd-729f-b773-3092ec693e2e.jsonl", 1, 40, "REVISE"),
    ("REVIEW",   "b81d86ade9b58091fdf7cc1df847e370", "2026-07-13T23-15-03-678Z_019f5dc3-3b7e-7047-9c85-6b36a780f23b.jsonl", 0, 30, "PASS"),
    ("WIKI",     "31e4a665310b626659a0a86aab95baaa", "2026-07-13T20-36-18-171Z_019f5d31-e27b-7869-80db-47ef2147722a.jsonl", 0, 30, "PASS"),
    ("CAVE",     "a9114d5b1d0dc5ca8ca093a403c9aa67", "2026-07-14T01-15-50-234Z_019f5e31-ce5a-73ed-a1c0-b88b6a69e699.jsonl", 1, 30, "PASS"),
]
DEFAULT_MODELS = ["deepseek-v4-pro", "openai-codex/gpt-5.6-terra"]

def verdict_of(model, hash_dir, fname, turn, cut):
    """One replay run -> 'PASS' | 'REVISE' | '?'."""
    session = os.path.join(SESS, hash_dir, "sessions", fname)
    env = {**os.environ, "USE_BRIDGE": "1", "DISTILL": "1",
           "VERIFIER": "deepseek" if "/" not in model else model}
    out = subprocess.run(
        [sys.executable, os.path.join(HERE, "replay.py"), session, str(turn), str(cut)],
        capture_output=True, text=True, env=env,
    ).stdout
    m = re.search(r"VERDICT:\s*(PASS|REVISE)", out)
    return m.group(1) if m else "?"

def majority(verdicts):
    p, r = verdicts.count("PASS"), verdicts.count("REVISE")
    return "PASS" if p > r else "REVISE" if r > p else "?"

if __name__ == "__main__":
    models = sys.argv[1:] or DEFAULT_MODELS
    n = int(os.environ.get("N", "3"))
    print(f"=== pi-duo verifier bench: N={n} trials, {len(MATRIX)} cases ===\n")
    summary = []
    for model in models:
        print(model)
        correct = 0
        for label, hd, fn, turn, cut, exp in MATRIX:
            trials = [verdict_of(model, hd, fn, turn, cut) for _ in range(n)]
            got = majority(trials)
            hits = trials.count(got)
            ok = got == exp
            correct += ok
            mark = "✓" if ok else "✗"
            print(f"  {label:<10} exp {exp:<6} got {got:<6} {hits}/{n}  {mark}  {trials}")
        print(f"  ACCURACY {correct}/{len(MATRIX)}\n")
        summary.append((model, correct))
    print("=== summary ===")
    for model, correct in summary:
        print(f"  {model:<30} {correct}/{len(MATRIX)}")
