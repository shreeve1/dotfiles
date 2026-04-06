# Benchmarks — Full Development Team

Each benchmark tests one aspect of the team's harness quality. The meta-agent uses these to hill-climb on agent definitions.

## Format

```
benchmark-name/
  instruction.md   — The scenario or task given to the agent
  verifier.md      — Scoring rubric, target agent, required elements
  context.md       — Optional: simulated codebase context or supporting material
```

## How Benchmarks Are Evaluated

1. The meta-agent reads the target agent's .md definition
2. It simulates what that agent would produce given the instruction
3. It scores the simulation against the verifier rubric
4. Scores are 0–5 per criterion, weighted and averaged

## Adding Benchmarks

Create a new directory with `instruction.md` and `verifier.md`. The verifier must specify:
- `target:` — which agent definition to test
- `context:` — which additional team files to load (optional)
- Scoring criteria with 0–5 scale descriptions
- Required elements checklist
- Anti-patterns list

## Benchmark Independence

Each benchmark must test a general capability, not a specific edge case. If a benchmark can only be passed by adding a specific keyword or rule to an agent definition, it's a bad benchmark.
