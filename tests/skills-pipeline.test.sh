#!/usr/bin/env bash
# End-to-end alignment check across the skills and the runtime. Follows the
# instructions the skills give, in order, on a throwaway repo, and checks that
# what one skill writes the next skill and the runtime accept:
#
#   setup-matt-pocock-skills (scaffold)  ->  to-spec  ->  to-tickets (template)
#   -> /triage (swap a label)  ->  /kanban archive  ->  ralph-loop  ->  gralph
#
# The skill text itself is the source: the scaffold commands and the ticket
# template are EXTRACTED from the SKILL.md / template files, not retyped here, so
# editing a skill so it no longer produces a valid board fails this test.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SK="$ROOT/.agents/skills"
BS="$SK/kanban/board.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

command -v jq >/dev/null 2>&1 || {
  echo "FAIL: jq is required" >&2
  exit 1
}

PASS=0
FAILN=0
ok() { PASS=$((PASS + 1)); }
fail() {
  FAILN=$((FAILN + 1))
  echo "FAIL: $1" >&2
  if [ -n "${2-}" ]; then echo "  $2" >&2; fi
}
expect_eq() { if [ "$2" = "$3" ]; then ok; else fail "$1" "want '$2' got '$3'"; fi; }

REPO="$TMP/repo"
mkdir -p "$REPO"
cd "$REPO"
git init -q -b main
git config user.name test
git config user.email test@example.com
echo init >README
git add README
git commit -qm init

# --- 1. setup skill: run the scaffold block it documents -----------------------
awk '/^Record the choice in `docs\/agents\/issue-tracker.md`/{f=1} f&&/^```bash/{c=1;next} c&&/^```/{exit} c' \
  "$SK/setup-matt-pocock-skills/SKILL.md" >"$TMP/scaffold.sh"
[ -s "$TMP/scaffold.sh" ] && ok || fail "setup skill documents a scaffold block"
bash "$TMP/scaffold.sh"
for d in issues archive specs maps; do [ -d ".kanban/$d" ] && ok || fail "scaffold creates .kanban/$d"; done
[ -f .kanban/progress.md ] && ok || fail "scaffold creates progress.md"
echo "keep me" >>.kanban/progress.md
bash "$TMP/scaffold.sh"
grep -q 'keep me' .kanban/progress.md && ok || fail "scaffold is idempotent (progress.md preserved)"
if "$BS" --board .kanban validate >/dev/null; then ok; else fail "scaffolded board validates"; fi
expect_eq "scaffolded board has no tickets" "[]" "$("$BS" --board .kanban json)"
git add -A
git commit -qm scaffold

# --- 1b. an empty scaffold must survive a clone (git does not track empty dirs) ---
git clone -q "$REPO" "$TMP/clone"
for d in issues archive specs maps; do [ -d "$TMP/clone/.kanban/$d" ] && ok || fail "clone keeps .kanban/$d"; done
if out="$("$BS" --board "$TMP/clone/.kanban" validate 2>&1)"; then ok; else fail "a cloned empty board validates" "$out"; fi
expect_eq "a cloned empty board has no tickets" "[]" "$("$BS" --board "$TMP/clone/.kanban" json)"
# Even if only some directories survive (an older scaffold without issues/.gitkeep),
# progress.md must not be read as a ticket.
rm -rf "$TMP/old" && mkdir -p "$TMP/old/.kanban/archive" && printf '# P\n' >"$TMP/old/.kanban/progress.md"
if out="$("$BS" --board "$TMP/old/.kanban" validate 2>&1)"; then ok; else fail "a board whose issues/ was lost in a clone still validates" "$out"; fi

# --- 2. to-spec: a local spec is a document in specs/, never in issues/ ----------
SLUG=my-spec
printf '# Spec\n\n## Problem Statement\n\nx\n' >".kanban/specs/$SLUG.md"
[ -z "$(find .kanban/issues -name '*.md')" ] && ok || fail "spec is not in issues/"
expect_eq "a spec file does not become a ticket" "[]" "$("$BS" --board .kanban json)"

# --- 3. to-tickets: fill the template extracted from the skill ------------------
awk '/<local-ticket-template>/{f=1;next} /<\/local-ticket-template>/{f=0} f' "$SK/to-tickets/SKILL.md" |
  awk '/^```markdown/{c=1;next} c&&/^```/{exit} c' >"$TMP/template.md"
[ -s "$TMP/template.md" ] && ok || fail "to-tickets documents a local ticket template"

# Pre-existing archived work forces the global-id rule to matter.
mkdir -p .kanban/archive/2026-07-14
printf -- '---\nid: 40\ntitle: old\nstatus: done\nblocked_by: []\ncreated: 2026-07-14\n---\n' >.kanban/archive/2026-07-14/040-old.md

next_id() { # the rule the skill states: highest id in issues/ AND archive/ (recursive) + 1
  find .kanban/issues .kanban/archive -name '*.md' -exec sed -n 's/^id: *//p' {} + | sort -n | tail -1 | awk '{print $1+1}'
}
publish() { # id title blocked_by labels
  local id="$1" title="$2" blocked="$3" labels="$4"
  sed -e "s/<next global id>/$id/" -e "s/<Ticket title>/$title/" -e "s/<spec-slug>/$SLUG/" \
    -e "s/<today, YYYY-MM-DD>/2026-10-14/" -e "s/^blocked_by: \[\]/blocked_by: $blocked/" \
    -e "s/^labels: .*/labels: $labels/" \
    -e 's/\[<path prefix>, <path prefix>\]/[src\/]/' \
    -e 's/`one repo-correct command that proves the ticket is done`/`test -f out.txt`/' \
    "$TMP/template.md" >".kanban/issues/$(printf '%03d' "$id")-$(echo "$title" | tr 'A-Z ' 'a-z-').md"
}
A="$(next_id)"
expect_eq "first new id skips archived ids" "41" "$A"
publish "$A" "First" '[]' '[ready-for-agent]'
B="$(next_id)"
expect_eq "second id follows" "42" "$B"
publish "$B" "Second" "[$A]" '[ready-for-agent]'
C="$(next_id)"
publish "$C" "Held" '[]' '[needs-triage]'

if out="$("$BS" --board .kanban validate 2>&1)"; then ok; else fail "published tickets validate" "$out"; fi
expect_eq "to-tickets output: only the unblocked ready ticket is eligible" "41" "$("$BS" --board .kanban eligible | cut -f1 | tr '\n' ' ' | sed 's/ $//')"
expect_eq "held (needs-triage) ticket is waiting, not eligible" "1" "$("$BS" --board .kanban counts | sed -n 's/^waiting_triage=//p')"
expect_eq "--spec selects all three of the spec's tickets" "41 42 43" "$("$BS" --board .kanban --spec "$SLUG" json | jq -r '.[].id' | tr '\n' ' ' | sed 's/ $//')"

# --- 4. /triage: release the held ticket by swapping the label (status untouched)
f=".kanban/issues/043-held.md"
sed -i 's/^labels: \[needs-triage\]/labels: [ready-for-agent]/' "$f"
expect_eq "triage swap leaves status alone" "pending" "$(sed -n 's/^status: //p' "$f" | head -1)"
expect_eq "released ticket is now eligible" "41 43" "$("$BS" --board .kanban eligible | cut -f1 | tr '\n' ' ' | sed 's/ $//')"
sed -i 's/^labels: \[ready-for-agent\]/labels: [ready-for-agent, needs-info]/' "$f"
expect_eq "two state labels = conflict, not eligible" "41" "$("$BS" --board .kanban eligible | cut -f1 | tr '\n' ' ' | sed 's/ $//')"
if "$BS" --board .kanban validate >/dev/null 2>&1; then fail "validate flags the conflict"; else ok; fi
sed -i 's/^labels: .*/labels: [ready-for-agent]/' "$f"
git add -A
git commit -qm "tickets"

# --- 5. ralph-loop works the spec; gralph agrees on the same set ----------------
BIN="$TMP/bin"
mkdir -p "$BIN" "$TMP/home/.cache"
cat >"$BIN/tmux" <<'EOF'
#!/usr/bin/env bash
case "${1-}" in new-session) eval "${*: -1}" </dev/null ;; has-session) exit 1 ;; esac
exit 0
EOF
cat >"$BIN/omp" <<'EOF'
#!/usr/bin/env bash
prompt=""; while [ $# -gt 0 ]; do [ "$1" = "-p" ] && { prompt="$2"; shift; }; shift; done
path="$(printf '%s' "$prompt" | sed -n 's/.*Operate only on ticket \([^ ]*\) (issue #\([0-9]*\)).*/\1/p' | head -1)"
id="$(printf '%s' "$prompt" | sed -n 's/.*Operate only on ticket \([^ ]*\) (issue #\([0-9]*\)).*/\2/p' | head -1)"
[ -n "$path" ] || { echo "RALPH_RESULT: NO_WORK"; exit 0; }
echo "$id" >>"$WORKER_LOG"
touch out.txt
sed -i 's/^status: pending$/status: done/' "$path"
git add -A >/dev/null 2>&1; git commit -qm "feat(#$id): stub" >/dev/null 2>&1
echo "RALPH_RESULT: DONE #$id"
EOF
chmod +x "$BIN/tmux" "$BIN/omp"
: >"$TMP/workers"
env HOME="$TMP/home" PATH="$BIN:$PATH" WORKER_LOG="$TMP/workers" RALPH_MODEL=stub \
  bash "$SK/ralph/ralph-loop.sh" --force --unattended --sleep-interval 0 --no-checkpoint-dirty --spec "$SLUG" omp pipe >"$TMP/loop.out" 2>&1 || true
expect_eq "ralph-loop worked the spec's tickets in dependency order" "41 42 43" "$(tr '\n' ' ' <"$TMP/workers" | sed 's/ $//')"
expect_eq "board.sh agrees everything is now done" "3" "$("$BS" --board .kanban counts | sed -n 's/^done=//p')"
expect_eq "nothing left eligible" "0" "$("$BS" --board .kanban counts | sed -n 's/^eligible=//p')"

# --- 6. /kanban archive: moving done tickets must not break dependents ----------
mkdir -p ".kanban/archive/2026-10-14"
git mv .kanban/issues/041-first.md .kanban/archive/2026-10-14/
if out="$("$BS" --board .kanban validate 2>&1)"; then ok; else fail "board still validates after archiving a blocker" "$out"; fi
printf -- '---\nid: 44\ntitle: After\nstatus: pending\nlabels: [ready-for-agent]\nblocked_by: [41]\nspec: %s\ncreated: 2026-10-14\n---\n' "$SLUG" >.kanban/issues/044-after.md
expect_eq "a ticket blocked by an ARCHIVED done ticket is eligible" "44" "$("$BS" --board .kanban eligible | cut -f1)"
expect_eq "next id still skips archived ids" "45" "$(next_id)"

# --- 7. gralph reads the same board the same way ----------------------------------
git add -A
git commit -qm archive
"$ROOT/bin/gralph" "$SLUG" --board .kanban --spec "$SLUG" --dry-run --verify true >/dev/null 2>"$TMP/gralph.err" && ok || fail "gralph plans the skill-written board" "$(cat "$TMP/gralph.err")"
M=".gralph/runs/$SLUG/manifest.json"
expect_eq "gralph and board.sh agree on what is eligible" "$("$BS" --board .kanban --spec "$SLUG" eligible | cut -f1 | tr '\n' ' ' | sed 's/ $//')" \
  "$(jq -r '[.children[] | select(.classification=="eligible") | .number] | join(" ")' "$M")"

echo "skills-pipeline: $PASS passed, $FAILN failed"
[ "$FAILN" -eq 0 ]
