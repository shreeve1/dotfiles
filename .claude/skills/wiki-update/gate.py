#!/usr/bin/env python3
"""Deterministic bounding gates for the wiki-update skill's CLAIMS.md registry.

Prose gates get skipped under pressure; these exit non-zero so the workflow
cannot write past them. Operates only on the existing wiki files (CLAIMS.md,
plus a CLAIMS-cold.md archive it owns) — no parallel store.

Per-write (run via `check`, one candidate at a time):
  validate  typed slot: kind in the fixed set, required fields present
  admit     earn your place: impact must state counterfactual value
  dedup     near-duplicate -> merge into the existing claim, never variant
  supersede declared conflict -> replace old with timestamps, don't coexist
  budget    over cap -> name the eviction victim; eviction precedes the add

Scheduled:
  demote      hot/cold split: low-hit/stale active claims -> CLAIMS-cold.md
  consolidate snapshot -> apply merge/prune plan -> eval -> keep only if pass
              rate held AND size dropped, else revert
  eval        run the wiki/eval/*.eval slice, report pass rate
  audit       re-check budget + schema over the live file (the verify-step bite)

stdlib only. CLAIMS.md is the source of truth; this never invents a DB.
"""
import argparse
import json
import re
import shutil
import sys
from datetime import date
from difflib import SequenceMatcher
from pathlib import Path

KINDS = {"gotcha", "decision", "config-fact", "runbook-step"}
CONFIDENCES = {"high", "medium", "low"}
COLS = ["ID", "Kind", "Claim", "Source", "Page", "Confidence", "Status",
        "Created", "Hits", "Superseded", "Impact", "Notes"]

# Tunables (env-overridable in the workflow if a project needs different limits).
BUDGET = 40          # max active claims in the hot file before eviction is forced
DEDUP_RATIO = 0.82   # claim-text similarity at/above this = near-duplicate
RESTATE_RATIO = 0.70 # impact this similar to the claim = not a real justification
COLD_HITS = 1        # demote active claims with hits <= this ...
COLD_AGE_DAYS = 120  # ... that are also older than this
MAINT_EVERY = 20     # writes between scheduled-maintenance prompts

BOILERPLATE = {
    "", "n/a", "na", "none", "fyi", "background", "for reference", "good to know",
    "general context", "context", "useful", "general knowledge", "misc",
}
TODAY = date.today().isoformat()


# ---------- CLAIMS.md parsing / serialising ----------

def parse(path: Path):
    """Return (preamble_lines, rows, footer_lines). Rows are dicts keyed by COLS.

    Tolerates the legacy 7-column layout: missing columns get defaults so old
    rows still count toward budget and can be evicted/migrated on next write.
    """
    if not path.exists():
        return ["# Claims Registry", ""], [], []
    lines = path.read_text().splitlines()
    header_idx = next((i for i, ln in enumerate(lines)
                       if ln.strip().startswith("| ID")), None)
    if header_idx is None:
        return lines, [], []
    header = [c.strip() for c in lines[header_idx].strip().strip("|").split("|")]
    rows, last_row = [], header_idx
    for i in range(header_idx + 1, len(lines)):
        ln = lines[i].strip()
        if re.match(r"^\|\s*C-\d+", ln):
            cells = [c.strip() for c in ln.strip("|").split("|")]
            row = {c: "" for c in COLS}
            for name, val in zip(header, cells):
                if name in row:
                    row[name] = val
            row.setdefault("Status", "active")
            if not row["Hits"]:
                row["Hits"] = "0"
            rows.append(row)
            last_row = i
        elif re.match(r"^\|\s*-+", ln):  # markdown separator row, skip
            continue
    return lines[:header_idx], rows, lines[last_row + 1:]


def serialize(preamble, rows, footer):
    out = list(preamble)
    out.append("| " + " | ".join(COLS) + " |")
    out.append("|" + "|".join(["---"] * len(COLS)) + "|")
    for r in rows:
        out.append("| " + " | ".join((r.get(c, "") or "").replace("\n", " ")
                                      for c in COLS) + " |")
    out.extend(footer if footer else ["", _footer_note()])
    return "\n".join(out).rstrip() + "\n"


def _footer_note():
    return ("Claim IDs use the next available zero-padded integer in `C-0001` "
            "format. Schema and bounding gates enforced by `gate.py`.")


def next_id(wiki, *extra_rows):
    """Next free ID across BOTH hot and cold files — reusing a demoted claim's
    ID would silently rewrite the citation that points at it."""
    rows = list(extra_rows)
    for name in ("CLAIMS.md", "CLAIMS-cold.md"):
        _, r, _ = parse(wiki / name)
        rows += r
    nums = [int(re.findall(r"\d+", x["ID"])[0]) for x in rows if x["ID"]]
    return f"C-{(max(nums) + 1) if nums else 1:04d}"


def active(rows):
    return [r for r in rows if r["Status"] in ("active", "")]


def age_days(row):
    try:
        return (date.today() - date.fromisoformat(row["Created"])).days
    except ValueError:
        return 9999  # unknown/legacy date = maximally stale


def score(row):
    """Eviction/demotion value: hits dominate, age erodes. Lower = drop first.

    ponytail: Hits is never auto-incremented — recording reads needs query-time
    instrumentation (a hook on wiki reads) that does not exist yet. Until then
    Hits stays whatever a MERGE manually bumps it to, so eviction is effectively
    stale-first. Upgrade path: a read hook that bumps Hits, or drop the column.
    """
    try:
        hits = int(row["Hits"] or 0)
    except ValueError:
        hits = 0
    return hits * 10 - age_days(row) * 0.1


def ratio(a, b):
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


# ---------- state (write counter for scheduled cadence) ----------

def state_path(wiki):
    return wiki / ".gate-state.json"


def bump_writes(wiki, n=1):
    p = state_path(wiki)
    st = json.loads(p.read_text()) if p.exists() else {}
    st["writes_since_maint"] = st.get("writes_since_maint", 0) + n
    p.write_text(json.dumps(st, indent=2))
    return st["writes_since_maint"]


def reset_writes(wiki):
    p = state_path(wiki)
    st = json.loads(p.read_text()) if p.exists() else {}
    st["writes_since_maint"] = 0
    st["last_maint"] = TODAY
    p.write_text(json.dumps(st, indent=2))


# ---------- per-write gates ----------

def gate_check(wiki, entry):
    """Run all per-write gates against one candidate. Returns a verdict dict."""
    path = wiki / "CLAIMS.md"
    _, rows, _ = parse(path)
    acts = active(rows)
    fails = []

    # 1. typed slot
    if entry.get("kind") not in KINDS:
        fails.append(f"kind must be one of {sorted(KINDS)}; got {entry.get('kind')!r}")
    if entry.get("confidence") not in CONFIDENCES:
        fails.append(f"confidence must be one of {sorted(CONFIDENCES)}")
    for f in ("claim", "source", "impact"):
        if not (entry.get(f) or "").strip():
            fails.append(f"required field '{f}' is empty")
    piped = [f for f in ("claim", "source", "page", "impact", "notes")
             if "|" in (entry.get(f) or "")]
    if piped:
        fails.append(f"fields {piped} contain '|', which breaks the markdown "
                     "table row; reword to drop the pipe")
    if fails:
        return {"verdict": "REJECT", "gate": "validate", "reasons": fails}

    claim, impact = entry["claim"].strip(), entry["impact"].strip()

    # 2. admission filter — earn your place
    if impact.lower().strip(".") in BOILERPLATE or len(impact) < 15:
        return {"verdict": "REJECT", "gate": "admit",
                "reasons": [f"impact {impact!r} states no counterfactual value "
                            "(would knowing this have changed the run's outcome?)"]}
    if ratio(impact, claim) > RESTATE_RATIO:
        return {"verdict": "REJECT", "gate": "admit",
                "reasons": ["impact merely restates the claim; give the "
                            "failure it would have prevented or speedup it gives"]}

    # 4. supersede (declared) — checked before dedup so a conflict replaces
    sup = entry.get("supersedes")
    if sup:
        target = next((r for r in rows if r["ID"] == sup), None)
        if not target:
            return {"verdict": "REJECT", "gate": "supersede",
                    "reasons": [f"supersedes {sup} but no such claim exists"]}
        return {"verdict": "SUPERSEDE", "gate": "supersede", "target": sup,
                "instruction": (f"mark {sup} status=superseded, set its Superseded={TODAY}; "
                                f"add new claim Created={TODAY}, "
                                f"Notes 'supersedes {sup}'")}

    # 3. dedup on write
    dups = sorted(((ratio(claim, r["Claim"]), r) for r in acts),
                  key=lambda t: -t[0])
    if dups and dups[0][0] >= DEDUP_RATIO:
        r = dups[0][1]
        return {"verdict": "MERGE", "gate": "dedup", "target": r["ID"],
                "similarity": round(dups[0][0], 3),
                "instruction": (f"near-duplicate of {r['ID']} ({round(dups[0][0],3)}); "
                                f"merge into {r['ID']} (refine claim/source/impact, "
                                "bump Hits), do NOT add a variant row")}

    # 5. hard budget cap — eviction is a precondition of the add
    nid = next_id(wiki, *rows)
    if len(acts) >= BUDGET:
        victim = min(acts, key=score)
        return {"verdict": "EVICT_FIRST", "gate": "budget",
                "active": len(acts), "budget": BUDGET, "new_id": nid,
                "evict": victim["ID"], "evict_score": round(score(victim), 2),
                "instruction": (f"budget {BUDGET} reached ({len(acts)} active). "
                                f"Demote lowest-value claim {victim['ID']} "
                                f"(score {round(score(victim),2)}) to CLAIMS-cold.md "
                                f"via `gate.py demote --force {victim['ID']}` "
                                f"BEFORE adding {nid}")}

    return {"verdict": "ADMIT", "gate": "all", "new_id": nid,
            "row": _row_from_entry(nid, entry),
            "instruction": f"all gates pass; write {nid}"}


def _row_from_entry(nid, entry):
    return {
        "ID": nid, "Kind": entry["kind"], "Claim": entry["claim"].strip(),
        "Source": entry["source"].strip(), "Page": entry.get("page", "").strip(),
        "Confidence": entry["confidence"], "Status": "active",
        "Created": TODAY, "Hits": "0", "Superseded": "",
        "Impact": entry["impact"].strip(), "Notes": entry.get("notes", "").strip(),
    }


def cmd_check(args):
    wiki = Path(args.wiki)
    entry = json.loads(Path(args.entry).read_text() if args.entry != "-"
                       else sys.stdin.read())
    v = gate_check(wiki, entry)
    print(json.dumps(v, indent=2))
    if v["verdict"] == "ADMIT":
        if args.apply:
            path = wiki / "CLAIMS.md"
            pre, rows, foot = parse(path)
            rows.append(v["row"])
            path.write_text(serialize(pre, rows, foot))
            n = bump_writes(wiki)
            print(f"# applied {v['new_id']}; writes_since_maint={n}"
                  + ("  >>> maintenance due (demote/consolidate)" if n >= MAINT_EVERY else ""))
        return 0
    return 3  # any non-ADMIT verdict blocks the write


# ---------- scheduled gates ----------

def cmd_demote(args):
    wiki = Path(args.wiki)
    path, cold = wiki / "CLAIMS.md", wiki / "CLAIMS-cold.md"
    pre, rows, foot = parse(path)
    # A claim an eval case depends on is by definition hot; never auto-demote it.
    protected = {r["ID"] for r in rows
                 for _, exp in load_eval(wiki)
                 if r["ID"] in exp or (exp and exp in r["Claim"])}
    if args.force:
        picked = [r for r in rows if r["ID"] in set(args.force) and r["Status"] != "cold"]
        clash = protected & {r["ID"] for r in picked}
        if clash:
            print(f"# WARNING: force-demoting eval-referenced claim(s) {sorted(clash)} "
                  "will break the eval slice", file=sys.stderr)
    else:
        picked = [r for r in active(rows)
                  if r["ID"] not in protected
                  and int(r["Hits"] or 0) <= COLD_HITS and age_days(r) > COLD_AGE_DAYS]
    if not picked:
        print(json.dumps({"demoted": [], "note": "nothing met cold criteria"}))
        return 0
    ids = {r["ID"] for r in picked}
    cpre, crows, cfoot = parse(cold) if cold.exists() else (
        ["# Claims Registry — Cold Archive", "",
         "Demoted low-traffic claims. NOT loaded by default; search explicitly."], [], [])
    for r in picked:
        r["Status"] = "cold"
    crows.extend(picked)
    cold.write_text(serialize(cpre, crows, cfoot))
    path.write_text(serialize(pre, [r for r in rows if r["ID"] not in ids], foot))
    print(json.dumps({"demoted": sorted(ids), "cold_file": str(cold)}, indent=2))
    return 0


def load_eval(wiki):
    d = wiki / "eval"
    cases = []
    if d.exists():
        for f in sorted(d.glob("*.eval")):
            for ln in f.read_text().splitlines():
                ln = ln.strip()
                if not ln or ln.startswith("#"):
                    continue
                q, _, exp = ln.partition("|||")
                if exp.strip():
                    cases.append((q.strip(), exp.strip()))
    return cases


def run_eval(wiki, text=None):
    """A case passes if its expected token is still retrievable in the hot file.

    The eval asserts load-bearing claims survive maintenance. Pruning one a case
    depends on drops the pass rate -> consolidation reverts.
    """
    if text is None:
        text = (wiki / "CLAIMS.md").read_text()
    cases = load_eval(wiki)
    results = [(q, exp, exp in text) for q, exp in cases]
    passed = sum(1 for *_, ok in results if ok)
    return passed, len(results), results


def cmd_eval(args):
    wiki = Path(args.wiki)
    p, total, results = run_eval(wiki)
    for q, exp, ok in results:
        print(f"  [{'PASS' if ok else 'FAIL'}] {q}  (expect: {exp})")
    print(json.dumps({"passed": p, "total": total,
                      "rate": round(p / total, 3) if total else None}))
    return 0 if total and p == total else (0 if total == 0 else 1)


def cmd_consolidate(args):
    """Gated rewrite: snapshot -> apply plan -> eval -> keep iff pass held AND
    size dropped, else revert. An ungated rewrite is how a wiki loses the detail
    that mattered; the gate is mandatory."""
    wiki = Path(args.wiki)
    path = wiki / "CLAIMS.md"
    plan = json.loads(Path(args.plan).read_text())
    if not load_eval(wiki):
        print(json.dumps({"result": "REFUSED", "reason":
                          "no eval slice (wiki/eval/*.eval) — consolidation cannot "
                          "verify it kept load-bearing claims; add eval cases first"},
                         indent=2))
        return 6
    bak = path.with_suffix(".md.snapshot")
    shutil.copy2(path, bak)  # snapshot (file copy: safe even on a dirty tree)

    base_pass, base_total, _ = run_eval(wiki)
    pre, rows, foot = parse(path)
    before_size = len(active(rows))
    by_id = {r["ID"]: r for r in rows}

    # resolve contradictions: loser superseded by winner
    for loser, winner in plan.get("resolve", []):
        if loser in by_id:
            by_id[loser]["Status"] = "superseded"
            by_id[loser]["Superseded"] = TODAY
            by_id[loser]["Notes"] = (by_id[loser]["Notes"] + f" superseded by {winner}").strip()
    # merge: drop the merged-away ids (keeper assumed already refined)
    drop = set(plan.get("prune", []))
    for keep, gone, *rest in plan.get("merge", []):
        drop.update(gone)
        if rest and keep in by_id:
            by_id[keep]["Claim"] = rest[0]
    new_rows = [r for r in rows if r["ID"] not in drop]

    candidate = serialize(pre, new_rows, foot)
    after_pass, after_total, _ = run_eval(wiki, text=candidate)
    after_size = len(active(new_rows))

    kept = (after_pass >= base_pass) and (after_size < before_size)
    verdict = {
        "base_pass": f"{base_pass}/{base_total}", "after_pass": f"{after_pass}/{after_total}",
        "size_before": before_size, "size_after": after_size,
        "pass_held": after_pass >= base_pass, "size_dropped": after_size < before_size,
    }
    if kept:
        path.write_text(candidate)
        reset_writes(wiki)
        bak.unlink()
        verdict["result"] = "KEPT"
    else:
        shutil.copy2(bak, path)  # revert
        bak.unlink()
        verdict["result"] = "REVERTED"
        verdict["reason"] = ("eval pass rate dropped" if after_pass < base_pass
                             else "size did not drop")
    print(json.dumps(verdict, indent=2))
    return 0 if kept else 4


def cmd_audit(args):
    """Re-check budget + schema over the live file. Wired into the workflow's
    Verification step so a hand-edit that bypassed `check` still fails the run."""
    wiki = Path(args.wiki)
    _, rows, _ = parse(wiki / "CLAIMS.md")
    acts = active(rows)
    problems = []
    if len(acts) > BUDGET:
        problems.append(f"over budget: {len(acts)} active > {BUDGET}")
    for r in rows:
        if r["Status"] in ("active", "") and r["Kind"] and r["Kind"] not in KINDS:
            problems.append(f"{r['ID']} bad kind {r['Kind']!r}")
        if r["Status"] in ("active", "") and r["Confidence"] and r["Confidence"] not in CONFIDENCES:
            problems.append(f"{r['ID']} bad confidence {r['Confidence']!r}")
    st = json.loads(state_path(wiki).read_text()) if state_path(wiki).exists() else {}
    due = st.get("writes_since_maint", 0) >= MAINT_EVERY
    print(json.dumps({"active": len(acts), "budget": BUDGET, "problems": problems,
                      "maintenance_due": due}, indent=2))
    return 0 if not problems else 5


def cmd_migrate(args):
    """Rewrite CLAIMS.md (and CLAIMS-cold.md if present) into the canonical
    12-column schema. `parse` already tolerates a narrow/legacy table and fills
    missing columns with defaults; `serialize` always emits the 12-column header.
    So this is just parse->serialize: legacy rows survive, new columns appear
    blank (Kind/Impact left for a later gated touch to fill), Hits defaults to 0.
    Idempotent — an already-canonical file re-serializes byte-identically and is
    left untouched. This is the upgrade path for wikis created before the schema
    was widened (the cause of mixed-width tables that corrupt gated writes)."""
    wiki = Path(args.wiki)
    changed = []
    for name in ("CLAIMS.md", "CLAIMS-cold.md"):
        p = wiki / name
        if not p.exists():
            continue
        before = p.read_text()
        pre, rows, foot = parse(p)
        after = serialize(pre, rows, foot)
        if after != before:
            p.write_text(after)
            changed.append(name)
    print(json.dumps({"migrated": changed,
                      "note": "already canonical; nothing to do" if not changed
                      else "rewrote to 12-column schema"}, indent=2))
    return 0


def cmd_selftest(args):
    """Build a throwaway wiki and assert every gate fires. No framework; the one
    runnable check that proves the gates still bite after edits."""
    import tempfile
    global BUDGET
    tmp = Path(tempfile.mkdtemp(prefix="gate-selftest-"))
    try:
        (tmp / "eval").mkdir()
        (tmp / "CLAIMS.md").write_text(
            "# Claims Registry\n\n"
            "| " + " | ".join(COLS) + " |\n"
            "|" + "|".join(["---"] * len(COLS)) + "|\n"
            "| C-0001 | config-fact | Default engine is pi. | bin/rralph |  | high | active | 2024-01-01 | 5 |  | Wrong engine wastes a full run. | s |\n"
            "| C-0002 | gotcha | Do not attach to the live pane. | mon |  | high | active | 2024-01-01 | 3 |  | Attaching derails the run. | s |\n")
        (tmp / "eval" / "c.eval").write_text("q1 ||| Default engine is pi\n")
        ns = lambda **k: argparse.Namespace(wiki=str(tmp), **k)

        good = {"kind": "decision", "claim": "Adopt a cold archive tier.",
                "source": "gate.py", "confidence": "high",
                "impact": "Without it the hot file grows unbounded and dilutes queries."}
        assert gate_check(tmp, good)["verdict"] == "ADMIT", "good claim should ADMIT"
        assert gate_check(tmp, {**good, "kind": "musing"})["gate"] == "validate", "bad kind"
        assert gate_check(tmp, {**good, "impact": "good to know"})["gate"] == "admit", "boilerplate impact"
        assert gate_check(tmp, {**good, "claim": "a | b"})["gate"] == "validate", "pipe in field"
        assert gate_check(tmp, {**good, "claim": "Default engine is pi.",
                                "kind": "config-fact"})["verdict"] == "MERGE", "near-dup -> MERGE"
        assert gate_check(tmp, {**good, "supersedes": "C-9999"})["gate"] == "supersede", "bad supersede"

        old, BUDGET = BUDGET, 2
        try:
            assert gate_check(tmp, good)["verdict"] == "EVICT_FIRST", "over budget -> EVICT_FIRST"
        finally:
            BUDGET = old

        (tmp / "p_bad.json").write_text(json.dumps({"prune": ["C-0001"]}))
        assert cmd_consolidate(ns(plan=str(tmp / "p_bad.json"))) == 4, "eval-breaking prune reverts"
        (tmp / "p_ok.json").write_text(json.dumps({"prune": ["C-0002"]}))
        assert cmd_consolidate(ns(plan=str(tmp / "p_ok.json"))) == 0, "safe prune kept"
        assert "Do not attach" not in (tmp / "CLAIMS.md").read_text(), "C-0002 should be gone"
        assert "Default engine is pi" in (tmp / "CLAIMS.md").read_text(), "C-0001 must survive"

        # migrate: a legacy 7-column file widens to the canonical 12-column schema
        leg = tmp / "leg"
        leg.mkdir()
        (leg / "CLAIMS.md").write_text(
            "# Claims Registry\n\n"
            "| ID | Claim | Source | Page | Confidence | Status | Notes |\n"
            "|----|-------|--------|------|------------|--------|-------|\n"
            "| C-0001 | Legacy claim. | src |  | medium | active | n |\n")
        cmd_migrate(argparse.Namespace(wiki=str(leg)))
        head = next(l for l in (leg / "CLAIMS.md").read_text().splitlines()
                    if l.strip().startswith("| ID"))
        assert head.count("|") == 13, "migrated header should have 12 columns"
        assert "Legacy claim." in (leg / "CLAIMS.md").read_text(), "legacy row preserved"
        assert gate_check(leg, good)["verdict"] == "ADMIT", "migrated file accepts gated writes"
        first = (leg / "CLAIMS.md").read_text()
        cmd_migrate(argparse.Namespace(wiki=str(leg)))
        assert (leg / "CLAIMS.md").read_text() == first, "migrate is idempotent"

        # consolidate refuses when there is no eval slice to verify against
        noeval = tmp / "noeval"
        noeval.mkdir()
        shutil.copy2(tmp / "CLAIMS.md", noeval / "CLAIMS.md")
        (noeval / "p.json").write_text(json.dumps({"prune": ["C-0001"]}))
        assert cmd_consolidate(argparse.Namespace(
            wiki=str(noeval), plan=str(noeval / "p.json"))) == 6, "no-eval consolidation refused"

        print("selftest OK — all gates fired")
        return 0
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--wiki", default="wiki", help="wiki root (default: wiki)")
    sub = ap.add_subparsers(dest="cmd", required=True)

    c = sub.add_parser("check", help="run per-write gates on one candidate (JSON)")
    c.add_argument("entry", help="path to candidate JSON, or - for stdin")
    c.add_argument("--apply", action="store_true", help="write the row if ADMIT")
    c.set_defaults(fn=cmd_check)

    d = sub.add_parser("demote", help="hot/cold split")
    d.add_argument("--force", nargs="+", metavar="ID", help="force-demote these IDs")
    d.set_defaults(fn=cmd_demote)

    e = sub.add_parser("eval", help="run the eval slice")
    e.set_defaults(fn=cmd_eval)

    co = sub.add_parser("consolidate", help="gated merge/prune (snapshot+eval+revert)")
    co.add_argument("plan", help="path to plan JSON")
    co.set_defaults(fn=cmd_consolidate)

    a = sub.add_parser("audit", help="budget+schema check (verify-step bite)")
    a.set_defaults(fn=cmd_audit)

    mi = sub.add_parser("migrate", help="rewrite CLAIMS.md to the canonical 12-column schema")
    mi.set_defaults(fn=cmd_migrate)

    s = sub.add_parser("selftest", help="assert every gate fires (no framework)")
    s.set_defaults(fn=cmd_selftest)

    args = ap.parse_args()
    sys.exit(args.fn(args))


if __name__ == "__main__":
    main()
