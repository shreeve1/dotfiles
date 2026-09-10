# Explore via the code graph before grep

When `graphify-out/graph.json` exists in the working repo, treat it as the
first lookup for structural questions — where something is, what calls or
depends on it, how the codebase is organised, what a symbol means — instead of
starting with grep/glob.

- Find impact/dependents: `graphify affected "<symbol>"`
- Understand a symbol + neighbours: `graphify explain "<symbol>"`
- Answer a "how does X work" question: `graphify query "<question>"`
- Architectural hubs: `graphify god-nodes`

Fall through to grep/glob when there is no `graphify-out/graph.json`, when the
graph has no hit, or for exact string/line-level matches (grep is better at
those). Load the full `graphify` skill only for building or refreshing a graph.
