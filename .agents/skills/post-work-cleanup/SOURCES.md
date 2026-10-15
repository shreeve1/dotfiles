# Standards Sources

## Upstream

- Repo: `https://github.com/HoangNguyen0403/agent-skills-standard`
- Pinned commit: `4bb499408a18f87f0efc5bf89325dec61432b54f`
- License: MIT, Copyright (c) 2026 Hoang Nguyen (see `references/standards/LICENSE`)

Vendored from `skills/` (the standards registry), not `.agents/skills/` (generated agent assets).

## Vendored

| Category | Skills |
| --- | --- |
| `python` | python-language, python-best-practices, python-error-handling, python-tooling, python-testing, python-security, python-architecture, python-async-runtime, python-database, + `references/framework-map.md` |
| `typescript` | typescript-language, typescript-best-practices, typescript-tooling, typescript-security |
| `javascript` | javascript-language, javascript-best-practices, javascript-tooling |
| `common` | common-best-practices, common-error-handling, common-performance-engineering, common-security-standards, common-code-review, common-documentation, common-debugging, common-git-collaboration |

Each upstream `SKILL.md` is stored as `RULES.md`. The top-level `SKILL.md` already shields `references/`
from discovery — pi treats a directory containing `SKILL.md` as a skill root and stops recursing
(`skills.js`), so nested `SKILL.md` files would not be discovered anyway. The rename is a defensive
convention, not a requirement: it keeps the rule files inert if the folder layout ever changes. The
frontmatter (including `triggers`) is kept.

## Authored locally

Upstream has no PowerShell or shell category. `powershell/` and `shell/` are authored in this workspace,
seeded from the local `powershell-expert` and `powershell-code-review` skills and first principles.

`references/deterministic.md`, `references/standards/_INDEX.md` and the trimmed `common/_INDEX.md` are local.

## Excluded

- Upstream `scripts/`, `assets/` (draw.io fixtures) and `evals/` — build/test material, not rules.
- Framework categories (react, nestjs, angular, flutter, swiftui, android, spring-boot, laravel, …),
  `cybersecurity`, `product-management`, `quality-engineering`, `specialists` — out of scope for a cleanup
  sweep in this workspace.
- `common/_INDEX.md` is trimmed to the eight vendored skills; the upstream file lists all 48.

## Refresh

Run `scripts/refresh-standards.sh` to re-vendor from a pinned commit. Update the commit in that script to
move the pin.

## Committing these files

The workspace pre-commit secret scan flags example lines in
`common/common-security-standards/` and `typescript/typescript-security/` (`os.environ["API_KEY"]`, a zod
`password` schema, TS type signatures, a commented placeholder). They are documentation, not credentials.
Confirm each hit is one of these examples, then commit **only that commit** with `--no-verify`; keep every
other check and do not "fix" the upstream examples.

## Known un-vendored pointers

Three vendored files link to upstream siblings this skill does not vendor: `common-code-review/RULES.md` →
`../common-tdd/`, `common-code-review/references/lenses.md` → `../common-security-audit/`,
`common-code-review/references/report.md` → `../common-skill-creator/`. Vendoring them would cascade
(`common-security-audit` → `common-architecture-audit`), so they are left as documented dead links; the
loader notes and skips a pointer that does not resolve.
