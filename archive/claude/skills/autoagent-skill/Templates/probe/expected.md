# Assertions the small model's output must satisfy. verify.sh scores
# passed/total. Author FUZZY (concepts, not exact phrasing) — see
# ~/.claude/skills/autoagent-skill/References/verifier-patterns.md
#
#   +pat    output MUST contain pat        (case-insensitive substring)
#   -pat    output must NOT contain pat    (case-insensitive, inverted)
#   ~regex  output MUST match regex        (case-insensitive grep -E)
#   # / blank line -> skipped

# Example — skill requires extracting items, not summarizing (commented so
# a copy-paste author doesn't get phantom assertions scored against real output):
# -summary|summarize
# ~extract|pull|list|items?
