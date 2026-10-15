#!/usr/bin/env bash
# The shepherd and merge skills are prose that agents execute. Check the commands in
# them carry the scope the skill itself says they must (review finding 6), and that
# the slug rule is stated the same way everywhere (finding 10).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SK="$ROOT/.agents/skills"
PASS=0; FAILN=0
ok() { PASS=$((PASS + 1)); }
fail() { FAILN=$((FAILN + 1)); echo "FAIL: $1" >&2; if [ -n "${2-}" ]; then echo "  $2" >&2; fi; }

SH="$SK/tralph-shepherd/SKILL.md"

# Every command that (re)launches the loop or tralph must carry $SPEC_ARGS.
while IFS= read -r line; do
  case "$line" in
    *'$SPEC_ARGS'*) ok ;;
    *) fail "shepherd launch command is unscoped" "$line" ;;
  esac
done < <(grep -nE 'ralph-loop\.sh [^$]*tmux|tralph --jobs' "$SH" | grep -E 'zsh -lic|proj=' )
n="$(grep -cE 'zsh -lic .*(ralph-loop\.sh|tralph)' "$SH")"
[ "$n" -ge 3 ] && ok || fail "expected >=3 shepherd launch commands, found $n"

# No board-wide blocked scan: scans must go through board.sh or a spec-aware helper.
if grep -nE "grep -l '\^status: blocked\\$' \.kanban/issues/\*\.md" "$SH" >/dev/null; then
  fail "shepherd still enumerates blocked tickets board-wide" "$(grep -nE "grep -l '\^status: blocked\\$' \.kanban/issues/\*\.md" "$SH" | head -3)"
else ok; fi
grep -q 'blocked_files()' "$SH" && ok || fail "shepherd defines a scoped blocked_files helper"

# The slug rule is stated the same everywhere: not all digits.
for f in "$SK/to-spec/SKILL.md" "$SK/setup-matt-pocock-skills/issue-tracker-local.md" "$SK/tralph-shepherd/SKILL.md"; do
  if grep -qiE 'not all digits|not purely numeric|never all digits|must contain a letter' "$f"; then ok; else fail "slug rule (not all digits) stated in $(basename "$(dirname "$f")")/$(basename "$f")"; fi
done

# --- spec + session trail (workers and reviewers must be able to find the spec) ---
TT="$SK/to-tickets/SKILL.md"
KB="$SK/kanban/SKILL.md"
RS="$SK/ralph/SKILL.md"
TS="$SK/to-spec/SKILL.md"
GD="$SK/grill-with-docs/SKILL.md"

# to-tickets: the local template carries a Spec pointer in the body and a session breadcrumb
# in the frontmatter, and says the pointer is allowed despite the no-file-paths rule.
grep -qE '^## Spec' "$TT" && ok || fail "to-tickets local template has a '## Spec' section"
grep -qE '^session: ' "$TT" && ok || fail "to-tickets local template has a session: frontmatter line"
grep -qiE 'spec path.*(exception|allowed)|exception.*spec' "$TT" && ok || fail "to-tickets says the spec pointer is an exception to the no-file-paths rule"
grep -q 'PI_SESSION_ID' "$TT" && ok || fail "to-tickets says where the session id comes from (PI_SESSION_ID)"
grep -qiE 'omit.*session|session.*omit' "$TT" && ok || fail "to-tickets says to omit session when no id is available"

# kanban: the schema documents session and says it is a human breadcrumb, not read by workers
grep -qE '^\| `session`' "$KB" && ok || fail "kanban schema table documents session"
grep -qiE 'session.*(breadcrumb|never read|not read)' "$KB" && ok || fail "kanban says session is a human breadcrumb"

# ralph per-ticket reviewer contract checks the diff against the spec
grep -qiE 'contradict.*spec|spec.*(Out of Scope|decisions)' "$RS" && ok || fail "ralph reviewer contract checks the diff against the spec"
grep -qE '^   7\. ' "$RS" && ok || fail "ralph reviewer contract has a 7th check"

# to-spec records where the grill happened and what it decided
grep -qE '^session: ' "$TS" && ok || fail "to-spec spec template has a session: frontmatter line"
grep -qiE '^## Decisions from the grill' "$TS" && ok || fail "to-spec spec template has a 'Decisions from the grill' section"
grep -qiE 'no.*(grill|decisions).*(conversation|context)|fresh session' "$TS" && ok || fail "to-spec says what to do when the conversation holds no grill decisions"

# grill-with-docs hands over to to-spec instead of ending in the conversation
grep -q 'to-spec' "$GD" && ok || fail "grill-with-docs names to-spec as the next step"
grep -qiE 'same session|decisions' "$GD" && ok || fail "grill-with-docs tells the user to run to-spec in the same session or record decisions"

# shepherd tells the user to run finish-spec when the run report says the spec is complete
grep -q 'Spec complete' "$SH" && grep -q '/finish-spec' "$SH" && ok || fail "shepherd surfaces the report's 'Spec complete' section and /finish-spec"

# tralph-merge lands a deferred batch by hand, which is exactly when the run report skips
# its 'Spec complete' section (it is written only for a merged finish); the merge skill must
# do the same completeness check and name /finish-spec itself.
TM="$SK/tralph-merge/SKILL.md"
grep -q 'spec-done' "$TM" && ok || fail "tralph-merge checks board.sh spec-done after a manual landing"
grep -q '/finish-spec' "$TM" && ok || fail "tralph-merge tells the user to run /finish-spec"

# ralph's Implement step (the --jobs 1 worker) tells the worker to read the ticket's spec
# BEFORE building, like gralph's prompt does; before this only the reviewer ever saw it.
impl_step="$(sed -n '/^### 3\. Implement/,/^### 4\./p' "$RS")"
if printf '%s' "$impl_step" | grep -qiE 'spec:.*(\.kanban/specs|read)|read.*\.kanban/specs'; then ok; else fail "ralph Implement step tells the worker to read the ticket's spec first"; fi
if printf '%s' "$impl_step" | grep -qiE 'BLOCKED'; then ok; else fail "ralph Implement step says to report BLOCKED when ticket and spec disagree"; fi

# session: must name a host you can actually ssh to. `hostname` prints n8n on the machine
# reached as itan8n, so the skills must map it; recovery (where transcripts live, how to
# search by id) is documented once, in the kanban skill, and the other two skills point there.
grep -qE 'n8n.*itan8n|itan8n.*n8n' "$KB" && ok || fail "kanban maps hostname n8n to the itan8n ssh alias"
grep -qE 'sessions/' "$KB" && ok || fail "kanban says where session transcripts live"
# match the id in the FILE NAME: grep -rl on the id also returns any other transcript that merely
# mentions it (found while checking this: head -1 picked the wrong session)
grep -qE "find .*-name .*<session id>" "$KB" && ok || fail "kanban finds a transcript by file name (find -name), not by grepping every transcript for the id"
if grep -qE 'grep -rl "<session id>"' "$KB"; then fail "kanban must not locate a transcript with grep -rl on the id (matches transcripts that only mention it)"; else ok; fi
for f in "$TS" "$TT"; do
  grep -qiE 'kanban.*(session|ssh alias)|ssh alias' "$f" && ok || fail "$(basename "$(dirname "$f")") points at the kanban skill for the session host and recovery"
done
if grep -qiE 'name the grill session so you can recover' "$TS"; then fail "to-spec no longer promises recovery that the breadcrumb does not enable"; else ok; fi

echo "skills-text: $PASS passed, $FAILN failed"
[ "$FAILN" -eq 0 ]
