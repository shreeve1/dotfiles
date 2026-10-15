<!-- Trimmed subset of the upstream common category; only skills vendored under this folder. -->
# common Skills Index

## File Match (auto-check against the file you are editing)

| Skill | Keywords |
| ----- | -------- |
| common-best-practices | solid, kiss, dry, yagni, naming, conventions, refactor, clean code |
| common-code-review | review, pr, critique, analyze code |
| common-documentation | comment, docstring, readme, documentation |
| common-error-handling | error handling, exception, try catch, error response, error code, throw |
| common-git-collaboration | commit, branch, merge, pull-request, git |
| common-performance-engineering | performance, optimize, profile, scalability, latency, throughput, memory leak, bottleneck |
| common-security-standards | security, encrypt, authenticate, authorize |
| common-debugging | debug, fix bug, crash, error, exception, troubleshooting |

> Load matched rules: `common/<skill>/RULES.md`. Load all that match.
>
> Upstream ships 48 common skills; this folder vendors only the eight relevant to post-work cleanup.
> The full upstream category is behind `scripts/refresh-standards.sh` if this set changes.
>
> **Known un-vendored pointers.** Three vendored files link to upstream siblings this folder does not vendor:
> `common-code-review/RULES.md` → `../common-tdd/`, `common-code-review/references/lenses.md` →
> `../common-security-audit/`, `common-code-review/references/report.md` → `../common-skill-creator/`. When a
> pointer does not resolve, note it and continue; do not chase the skill.
