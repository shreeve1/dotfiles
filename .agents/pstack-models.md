# pstack model configuration (omp). One line per role. Values are omp agents in ~/.omp/agent/agents/.
# pstack-opus = @slow, pstack-sol = @advisor, pstack-glm = @task. `inherit-parent` = default task agent.
# budget: set per agent via thinkingLevel frontmatter (unset = role default)
feature, refactoring: pstack-glm
bug-fix: pstack-glm
perf-issue: pstack-glm
hillclimb: pstack-glm
judgment and prose: pstack-opus
hardest tasks: pstack-opus
how explorer: pstack-glm
how explainer: pstack-opus
why investigators: pstack-glm
why synthesizer: pstack-opus
reflect tooling: pstack-sol
reflect judgment, divergent, synthesizer: pstack-opus
arena runners: pstack-opus, pstack-sol, pstack-glm
arena cross-judge pool: pstack-opus, pstack-sol, pstack-glm
swarm workers: pstack-glm
architect runners: pstack-opus, pstack-sol, pstack-glm
interrogate reviewers: pstack-opus, pstack-sol, pstack-glm
