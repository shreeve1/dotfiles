#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RRALPH="$ROOT/bin/rralph"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

pass_count=0
GATE_OUT="$TMPDIR/gate.out"
GATE_ERR="$TMPDIR/gate.err"

write_validation() {
	local path="$1" status="$2"
	cat >"$path" <<EOF2
---
status: $status
---

# Validation
EOF2
}

write_review() {
	local path="$1" status="$2" critical="$3" blockers="$4"
	cat >"$path" <<EOF2
---
status: $status
severity: { critical: $critical, important: 0, suggestion: 0 }
blockers_count: $blockers
---

# Review
EOF2
}

write_review_block_style() {
	local path="$1" status="$2" critical="$3" blockers="$4"
	cat >"$path" <<EOF2
---
status: $status
severity:
  critical: $critical
  important: 0
  suggestion: 0
blockers_count: $blockers
---

# Review
EOF2
}

run_gate() {
	RRALPH_INTERNAL_GATE_CHECK=1 \
		RRALPH_TEST_VALIDATION="${1:-}" \
		RRALPH_TEST_REVIEW="${2:-}" \
		bash "$RRALPH" "${@:3}"
}

expect_allow() {
	local name="$1" validation="$2" review="$3"
	shift 3
	: >"$GATE_OUT"
	: >"$GATE_ERR"
	if run_gate "$validation" "$review" "$@" >"$GATE_OUT" 2>"$GATE_ERR"; then
		pass_count=$((pass_count + 1))
	else
		echo "FAIL allow: $name" >&2
		cat "$GATE_ERR" >&2 || true
		exit 1
	fi
}

expect_block() {
	local name="$1" validation="$2" review="$3"
	shift 3
	: >"$GATE_OUT"
	: >"$GATE_ERR"
	if run_gate "$validation" "$review" "$@" >"$GATE_OUT" 2>"$GATE_ERR"; then
		echo "FAIL block: $name" >&2
		cat "$GATE_OUT" >&2 || true
		exit 1
	else
		pass_count=$((pass_count + 1))
	fi
}

validation_ok="$TMPDIR/validation-ok.md"
validation_bad="$TMPDIR/validation-bad.md"
validation_comment="$TMPDIR/validation-comment.md"
review_ok="$TMPDIR/review-ok.md"
review_needs="$TMPDIR/review-needs.md"
review_requesting="$TMPDIR/review-requesting.md"
review_critical="$TMPDIR/review-critical.md"
review_blockers="$TMPDIR/review-blockers.md"
review_block_style="$TMPDIR/review-block-style.md"

write_validation "$validation_ok" complete
write_validation "$validation_bad" needs_changes
cat >"$validation_comment" <<'EOF2'
---
status: complete # inline comments should be ignored
---

status: needs_changes
EOF2
write_review "$review_ok" approved 0 0
write_review "$review_needs" needs_changes 0 0
write_review "$review_requesting" requesting_changes 0 0
write_review "$review_critical" approved 1 0
write_review "$review_blockers" approved 0 2
write_review_block_style "$review_block_style" approved 0 0

expect_allow "approved review + complete validation" "$validation_ok" "$review_ok"
expect_allow "frontmatter header parsing handles comments and block severity" "$validation_comment" "$review_block_style"
expect_block "needs_changes review blocks" "$validation_ok" "$review_needs"
expect_block "requesting_changes review blocks" "$validation_ok" "$review_requesting"
expect_block "needs_changes validation blocks" "$validation_bad" "$review_ok"
expect_block "missing validation blocks" "$TMPDIR/missing-validation.md" "$review_ok"
expect_block "missing review blocks" "$validation_ok" "$TMPDIR/missing-review.md"
expect_block "critical count blocks" "$validation_ok" "$review_critical"
expect_block "blockers_count blocks" "$validation_ok" "$review_blockers"
expect_allow "--ungated allows failed gate" "$validation_bad" "$review_needs" --ungated
if RPIV_UNGATED=1 run_gate "$validation_bad" "$review_needs" >"$GATE_OUT" 2>"$GATE_ERR"; then
	pass_count=$((pass_count + 1))
else
	echo "FAIL allow: RPIV_UNGATED allows failed gate" >&2
	cat "$GATE_ERR" >&2 || true
	exit 1
fi

if grep -q "RPIV_UNGATED=%q" "$RRALPH"; then
	pass_count=$((pass_count + 1))
else
	echo "FAIL env forwarding: RPIV_UNGATED not forwarded" >&2
	exit 1
fi

if grep -q 'FROM_STEP" = code-review.*FROM_STEP" = commit' "$RRALPH" && grep -q 'REVIEW="$(newest .rpiv/artifacts/reviews)' "$RRALPH"; then
	pass_count=$((pass_count + 1))
else
	echo "FAIL resume: --from code-review/commit must reuse prior artifacts" >&2
	exit 1
fi

printf 'rralph gating tests passed (%d checks)\n' "$pass_count"
