---
name: personalize-harness-pi
description: Analyze a project, research current harness best practices, synthesize a gap-driven Harness Profile, then generate and verify a project-local Pi personal harness extension at .pi/extensions/personal-harness.ts. Covers touched-file checks, deferred project checks, scenario checks, safety blockers, and architecture guidance. Also supports reusing an existing Harness Profile artifact.
argument-hint: "[--profile-only] [--no-web] [target-path | .rpiv/artifacts/research/*.md]"
allowed-tools: Agent, Read, Write, Bash(*), Grep, Glob
shell-timeout: 60
---

# Personalize Harness Pi

Analyze a project, research current harness best practices, synthesize a Harness Profile, then generate a project-local Pi extension from that profile. This is Pi-native: no Claude hook JSON, no shell hook settings, no global Pi settings edits from the generator.

The skill is **universal** — it never hard-codes one project's rules. It discovers what a target repo needs from that repo's manifests, scripts, CI, docs, and installed tools, compares those needs against what the generated extension can enforce, and synthesizes project-local sensors to close the gaps. Local repository evidence always decides concrete commands, paths, and rules; web research only informs default posture for a detected stack.

This skill owns the research phase. Do **not** tell the user to run `/skill:research` as a prerequisite. Reuse an existing Harness Profile artifact only when the user explicitly passes one.

## Gap-driven model

Earlier versions of this skill could only represent per-file syntax/formatter/lint checks plus lightweight guidance and a git reminder. That cannot express several universal harness needs:

- **Project checks** — TypeScript `tsc`, framework build, or test commands are project-level, not per-file parse checks, and are too slow/broad for every write.
- **Scenario checks** — Playwright/e2e smoke tests are expensive and need controlled timing, so they belong in manual/pre-git surfaces, not edit-time middleware.
- **Architecture guidance** — architecture mistakes need project-specific decision context, not generic linting.
- **Safety blockers** — live-service/deploy/secret safety requires real command/path blockers, not reminder text.

The skill discovers these categories from any repo and maps each to a `selected` / `selected_if_json` / `skipped` / `not_detected` profile entry with explicit reasons. These are universal categories, not Symphony-specific requirements.

### Design constraints

- Local repo evidence wins over web research. Web research may recommend standard patterns, but every selected command must exist in the target repo (manifest/script) or PATH and have safe timing/posture.
- Fast syntax checks can remain blocking after writes.
- Project checks default to **advisory** unless the repo proves a clean baseline and the profile marks them `blocking` at a timing that can actually block. `agentEnd` checks are **always** message/advisory-only because Pi `agent_end` handlers cannot block tool execution; blocking project checks must run during `tool_result` write-result handling or `beforeGit` `tool_call` handling.
- Expensive scenario checks default to `manual`/advisory and must never run on every write.
- Safety blockers default to `blocking` only when derived from explicit local docs or from universal sensitive-path rules such as `.env` writes.
- Generated output remains a single project-local `.pi/extensions/personal-harness.ts` file. Never add target-repo dependencies just to support the harness.

## Input

`$ARGUMENTS` — optional flags and target:

- empty — analyze current working directory, research best practices, write profile, generate extension
- `<target-path>` — analyze that project root, research best practices, write profile, generate extension
- `.rpiv/artifacts/research/*.md` — reuse an existing artifact containing `## Harness Profile`, then generate extension
- `--profile-only` — analyze/research and write the Harness Profile artifact, but do not generate extension
- `--no-web` — skip external web research and rely on local repo/tool evidence only

## Metadata

```!
node "${SKILL_DIR}/../_shared/now.mjs"
echo
node "${SKILL_DIR}/../_shared/git-context.mjs"
echo
node "${SKILL_DIR}/../_shared/list-recent.mjs" .rpiv/artifacts/research 4
```

- `now.mjs` (line 1) — `<iso>\t<slug>` tab-separated. Use `<slug>` for a newly written profile artifact filename.
- Use `root:` from metadata as default target repo when `$ARGUMENTS` omits a path.
- Use `author:` for generated artifact frontmatter.

## Flow

1. Resolve mode and target → 2. Analyze repo → 3. Research best practices → 4. Synthesize/write Harness Profile (incl. Gap Analysis) → 5. Validate Harness Profile → 6. Build generated extension profile literal → 7. Write `.pi/extensions/personal-harness.ts` → 8. Verify load/dry checks → 9. Report generated path, gap mitigations, and skipped sensors

## Step 1: Resolve mode and target

1. Parse flags:
   - `--profile-only` means stop after Step 4.
   - `--no-web` means skip external web research in Step 3 and record that skip.
2. If `$ARGUMENTS` contains a path under `.rpiv/artifacts/research/` ending in `.md`, run in **reuse mode**:
   - Read the artifact fully.
   - Confirm frontmatter has `status: complete` or `status: ready`.
   - Confirm it contains `## Harness Profile`.
   - Skip Steps 2-4 and proceed to Step 5.
3. Otherwise run in **facilitator mode**:
   - Resolve target repo from the remaining path argument, or metadata `root:` if no path was provided.
   - Target repo must resolve to an absolute directory.
   - Create `.rpiv/artifacts/research/` if missing before writing the profile artifact.

## Step 2: Analyze repo

Treat the codebase as the primary source of truth. Do not ask the user to run another skill.

Run local probes from `<target_repo>`. The probe must surface validation surfaces, expensive-check surfaces, operational-safety surfaces, and architecture docs — not only formatter/lint tools:

```bash
pwd
git rev-parse --show-toplevel 2>/dev/null || true
git status --short 2>/dev/null || true

# Manifests, tool configs, agent guidance, and architecture docs.
find . -maxdepth 3 \( \
  -name 'package.json' -o -name 'tsconfig*.json' -o -name 'pyproject.toml' -o -name 'go.mod' \
  -o -name 'Cargo.toml' -o -name 'deno.json' -o -name 'biome.json' -o -name 'eslint.config.*' \
  -o -name '.eslintrc*' -o -name 'prettier.config.*' -o -name '.prettierrc*' \
  -o -name 'AGENTS.md' -o -name 'CLAUDE.md' -o -name 'architecture.md' -o -name 'ARCHITECTURE.md' \
  -o -name 'CONTRIBUTING.md' -o -name 'README.md' \) \
  -not -path './node_modules/*' -not -path './.git/*' | sort

# CI files, build/test configs, service/deploy docs, container + task runners, env templates.
find . -maxdepth 3 \( \
  -path './.github/workflows/*' -o -name '.gitlab-ci.yml' -o -name 'azure-pipelines.yml' \
  -o -name 'Jenkinsfile' -o -name '.circleci' -o -name 'next.config.*' -o -name 'vite.config.*' \
  -o -name 'vitest.config.*' -o -name 'jest.config.*' -o -name 'playwright.config.*' \
  -o -name 'Dockerfile' -o -name 'docker-compose*.y*ml' -o -name 'compose.y*ml' \
  -o -name 'Makefile' -o -name 'justfile' -o -name 'Justfile' -o -name 'Taskfile.y*ml' \
  -o -name '.env.example' -o -name '.env.sample' -o -name '.env.template' \
  -o -name 'DEPLOY*.md' -o -name 'OPERATIONS*.md' -o -name 'RUNBOOK*.md' -o -name 'SECURITY.md' \) \
  -not -path './node_modules/*' -not -path './.git/*' | sort

# Architecture/decision docs from common locations.
find . -maxdepth 4 \( -path '*/docs/adr/*' -o -path '*/docs/architecture/*' \
  -o -path './.rpiv/guidance/*/architecture.md' -o -path './.rpiv/guidance/architecture.md' \
  -o -path '*/wiki/*.md' \) -not -path './node_modules/*' -not -path './.git/*' 2>/dev/null | sort

# Package scripts (the canonical source of project-level check commands).
[ -f package.json ] && { echo "--- package.json scripts ---"; jq -r '.scripts // {} | to_entries[] | "\(.key): \(.value)"' package.json 2>/dev/null; }
[ -f Makefile ] && { echo "--- Makefile targets ---"; grep -E '^[a-zA-Z0-9_.-]+:' Makefile | sed 's/:.*//' | sort -u; }
[ -f justfile ] || [ -f Justfile ] && { echo "--- just recipes ---"; just --list 2>/dev/null || true; }

# Installed tools (PATH + repo-local bins). Project/scenario checks may only select tools proven here.
for t in jq node npm pnpm yarn bun npx deno tsc prettier eslint biome ruff black shfmt gofmt rustfmt shellcheck pytest go cargo playwright; do
  command -v "$t" >/dev/null 2>&1 && echo "have:$t=$(command -v "$t")" || echo "miss:$t"
done
for b in tsc prettier eslint biome vitest jest playwright next; do
  [ -x "./node_modules/.bin/$b" ] && echo "have-local:$b=./node_modules/.bin/$b"
done

git ls-files '*.ts' '*.tsx' '*.js' '*.mjs' '*.cjs' '*.json' '*.sh' '*.bash' '*.zsh' '*.py' '*.go' '*.rs' '*.md' 2>/dev/null | sed 's/.*\.//' | sort | uniq -c || true
```

Read relevant manifests/config files found by the probe. If `<target_repo>` differs from the session cwd, read files using absolute paths under `<target_repo>`. For large repos, read only top-level manifests and tool configs first. Read CI workflows, package scripts, and any deploy/runbook docs closely — they are the evidence source for project checks, scenario checks, and safety rules.

Spawn at least one `codebase-analyzer` agent to inspect harness-relevant repo shape. Paste the local probe output into the agent prompt:

```text
Analyze this repo for a gap-driven Pi personal harness profile. Use <target_repo> as root; cite files relative to that root. Identify:
- languages, package/tool configs, and likely write/edit file types;
- safe per-file syntax/formatter/lint commands;
- VALIDATION GAPS that per-file checks cannot cover — project-level typecheck/build/test commands (from package scripts, Makefile, justfile, CI), their working directory, and how long they take;
- EXPENSIVE CHECKS such as e2e/Playwright/integration suites that should be manual or pre-git only, with the command and config file;
- ARCHITECTURE DOCS / decision records (ADRs, architecture.md, wiki, CONTRIBUTING) and which touched paths they apply to;
- OPERATIONAL SAFETY RULES from deploy/runbook/security docs and CI — commands or paths that are dangerous to run or modify (live services, deploys, secrets, vendored/generated dirs);
- CANDIDATE BLOCKERS — concrete bash patterns or path globs worth blocking, each with the local doc/evidence that justifies it.
For every recommendation return selected / selected_if_json / skipped / not_detected with evidence from files and command probes. Selected commands MUST already exist in package scripts, Makefile/justfile, CI, or as an installed tool from the probe. Do not write files.
Target repo: <target_repo>
Probe output:
<probe output>
```

If `.pi/`, `.rpiv/guidance/`, existing extension files, service/deploy docs, or CI config exist, spawn `integration-scanner` to map how guidance, CI, deploy surfaces, and Pi extension surfaces are wired:

```text
Map how this repo wires validation, CI, deploy/operational surfaces, agent guidance, and any existing Pi/Claude extensions. Identify what already enforces checks (CI jobs, pre-commit hooks, husky), where guidance docs live and what they cover, and which operational commands/paths the docs treat as sensitive. Cite files relative to <target_repo>. Do not write files.
```

## Step 3: Research best practices

Unless `--no-web` is set, spawn one `web-search-researcher` agent in parallel with codebase analysis or immediately after probes:

```text
Research current best practices for AI-agent edit/commit harnesses in 2026, including BOTH fast edit-time gates AND deferred project-level validation. For each detected stack from the repo probe (<languages/tools>), recommend:
- per-file syntax/format/lint posture (edit-time, blocking vs advisory);
- project-level type/build/test posture — and WHEN such a check should run: at edit time, end of turn, pre-git, CI/manual, or never (with reasoning about cost and signal);
- expensive scenario/e2e posture (Playwright, integration) — almost always manual or pre-git, never per-write;
- safety posture for destructive shell commands, secret files, and deploy actions.
Prefer primary docs for: Node --check, jq, bash -n, Prettier, ESLint/Biome, Ruff/Black, shfmt/shellcheck, gofmt, rustfmt, tsc --noEmit, Next/Vite build, vitest/jest/pytest, Playwright. Include URLs. For each, state the recommended TIMING (afterWrite | agentEnd | beforeGit | manual) and POSTURE (advisory | blocking).
Web research may PROPOSE command families and posture, but it must not assert that a specific command exists in this repo — local manifests/scripts/installed tools decide that.
```

If web search is unavailable or skipped, continue with local evidence and record `web_best_practices: skipped — --no-web set or web search unavailable` in the profile.

## Step 4: Synthesize and write Harness Profile

Merge local probes, analysis agents, and web-best-practice findings into a Harness Profile artifact. The profile is both audit trail and generator input.

### Synthesis rules

1. Prefer repo evidence over generic best practices.
2. Mark a command `selected` only when the tool exists in PATH or repo-local `node_modules/.bin`, and the command is safe for its declared timing.
3. Web research may propose command families and posture, but a `selected` command must come from local manifests/scripts (`package.json` scripts, Makefile, justfile, CI) or an installed tool proven by the probe. If web suggests a check the repo cannot run, mark it `not_detected` with the missing tool/script as the reason.
4. Mark unavailable tools `not_detected` with reason. Mark plausible but intentionally omitted tools `skipped` with reason. Preserve all reasons.
5. Syntax checks default to `blocking`. Formatters default to fail-open. Lint defaults to advisory unless the repo already enforces it cleanly and the profile explicitly says `blocking`.
6. Project checks default to `agentEnd` advisory. Promote to `beforeGit` blocking only with clean-baseline proof (see selection rules below).
7. Scenario checks default to `manual`. Promote to `beforeGit` only when deterministic, bounded, and repo evidence calls it normal pre-merge validation.
8. Safety blockers default to `blocking` when derived from explicit local docs or universal sensitive-path rules; otherwise `skipped` with reason.
9. Include write-capable tools that can be gated (`write`, `edit`, `ast_grep_replace` with `apply: true`) and skipped reasons for write-capable tools that do not expose per-file paths.

### Timing and posture vocabulary

All project, scenario, and safety entries use this shared vocabulary so the contract and generated extension agree:

- **Timing** — `afterWrite` (during write-result handling), `agentEnd` (end of a user prompt, advisory-only), `beforeGit` (when `git commit`/`git push` is detected, can block), `manual` (never auto-run; surfaced as advisory only).
- **Posture** — `advisory` (report only, never fails the tool or blocks the command) or `blocking` (fails the write result or blocks the bash command). `blocking` posture is honored only at `afterWrite` and `beforeGit`; at `agentEnd` a `blocking` posture is downgraded to advisory because Pi `agent_end` cannot block, and the profile must say so in the entry's reason.

### Gap categories

Evaluate every universal gap category, even when the answer is `not_detected`:

1. touched-file syntax
2. formatter
3. lint
4. project typecheck/build/test
5. scenario / e2e
6. architecture / context guidance
7. operational safety (live service / deploy)
8. secrets / protected paths
9. git / preflight
10. unsupported write tools (tools that cannot expose a per-file path)

### Selection rules

- **Project checks (cat 4):** choose `agentEnd` advisory by default, or `beforeGit` when the check belongs to normal pre-merge validation. Require clean-baseline proof (run the command once, or cite CI proving it passes on `main`) before `blocking`. Keep broad/slow commands advisory. Every project check requires `cwd`, command, args, timeout, trigger globs/extensions, timing, and posture. Mark a project check `skipped`/`not_detected` with the specific reason when it is too slow for any automatic timing, its tool is missing from PATH/`node_modules/.bin`, its package script / Make / just target does not exist, or it is too broad to bind to a trigger — and record that reason in the Gap Analysis residual risk.
- **Scenario checks (cat 5):** default to `manual`; allow `beforeGit` only when the command is deterministic, bounded, and repo evidence (CI, runbook, package script named like `e2e:ci`) says it is normal pre-merge validation. Same required fields as project checks plus a `reason`.
- **Architecture guidance (cat 6):** prefer small docs or reference-only pointers to docs; avoid injecting huge wiki/ADR/README content unless scoped to touched paths. Choose `full`, `reference`, or `scoped` injection mode.
- **Safety blockers (cat 7, 8):** derive project-specific blockers from local docs; always include universal sensitive-path protections (`.env*` writes, secret file reads, dependency/vendor writes, destructive shell commands) unless explicitly skipped with reason. Every safety entry requires tool scope (`bash`, `read`, `write`, `edit`, `ast_grep_replace`), a match pattern (anchored/escaped bash regex) or path/glob, the operation, a reason, and a default `blocking` posture.

Write artifact:

```text
.rpiv/artifacts/research/<slug>_personalize-harness-pi.md
```

### Required artifact shape

```markdown
---
date: <iso>
author: <author>
repository: <repo-name>
topic: "personalize-harness-pi"
tags: [research, codebase, pi, harness]
status: complete
---

# Research: personalize-harness-pi

## Summary
<repo analysis + best-practice synthesis>

## Local Probe Evidence
<commands/files/tool detection, with file refs where applicable>

## External Best-Practice Findings
<web findings or skipped reason>

## Harness Profile

### Profile Metadata

### Detected Languages and Tools

### Syntax Check Commands

### Formatter Commands

### Lint Commands

### Project Check Commands
<project-level typecheck/build/test. Each row: selected|selected_if_json|skipped|not_detected,
 plus cwd, command, args, timeout, trigger extensions/globs, timing (afterWrite|agentEnd|beforeGit),
 posture (advisory|blocking), and reason/condition.>

### Scenario Check Commands
<expensive e2e/integration. Each row: selected|skipped|not_detected, plus cwd, command, args,
 timeout, trigger extensions/globs, timing (manual|beforeGit), posture, and reason.>

### Safety Rules
<command/path blockers. Each row: selected|skipped|not_detected, plus tool scope, match pattern
 or path/glob, operation, posture (default blocking), and reason.>

### Architecture Guidance
<docs/decisions to surface. Each row: selected|skipped|not_detected, plus relativePath, label,
 appliesTo (touched-path scope or root), injection mode (full|reference|scoped), and reason.>

### Touched-File Guidance Locations

### Prompt Advisories

### Git Preflight Reminders
<reminder text plus whether beforeGit project/scenario checks run first.>

### Blocking and Advisory Posture

### Gap Analysis
<one row per gap category (1-10 above). Each row: category, local evidence, web evidence
 (or "none"), selected mitigation, skipped alternatives, residual risk.>

### Smoke-Test Commands
```

Then continue using this newly written artifact as the Harness Profile source unless `--profile-only` was set.

If `--profile-only` was set, report the artifact path and stop.

## Step 5: Validate Harness Profile

Treat the Harness Profile as the source of truth after Step 4. Do not probe tools or invent commands during generation.

Required profile groups:

- Profile Metadata
- Detected Languages and Tools
- Syntax Check Commands
- Formatter Commands
- Lint Commands
- Project Check Commands
- Scenario Check Commands
- Safety Rules
- Architecture Guidance
- Touched-File Guidance Locations
- Prompt Advisories
- Git Preflight Reminders
- Blocking and Advisory Posture
- Gap Analysis
- Smoke-Test Commands

Validation rules:

1. `target_repo` must resolve to an absolute directory. If absent, use metadata `root:`.
2. `runtime_output` must equal `.pi/extensions/personal-harness.ts`.
3. Every Harness Profile entry row for languages, tools, checks, formatters, lint, project checks, scenario checks, safety rules, architecture guidance, guidance locations, prompt advisories, git reminders, or smoke tests must contain one of `selected`, `selected_if_json`, `skipped`, or `not_detected`. Do not apply this rule to headings or explanatory prose.
4. Every `selected` entry must include enough command/text/config to generate from it.
5. Every `skipped`, `not_detected`, or `selected_if_json` entry must include a reason or condition; missing reasons fail validation.
6. Every `selected` syntax command must identify a language, command, and blocking posture.
7. Formatter entries may be `not_detected`; generated extension must treat them as no-op/fail-open.
8. Lint entries may be `not_detected`; generated extension must treat lint as advisory unless posture explicitly says `blocking`.
9. Every `selected` project check and scenario check must include `cwd`, command, args, timeout, trigger globs/extensions, timing, and posture. `agentEnd` entries must declare advisory posture (or note the blocking→advisory downgrade in their reason). `beforeGit` entries may be blocking.
10. Every `selected` safety rule must include tool scope (`bash`, `read`, `write`, `edit`, or `ast_grep_replace`), a match pattern or path/glob, the operation, a reason, and a posture (default `blocking`).
11. Every `selected` architecture guidance entry must include `relativePath`, `label`, `appliesTo`, and an injection mode (`full`, `reference`, or `scoped`).
12. Guidance entries (touched-file and architecture) may be `not_detected`; generated extension must still include guidance support, but generated `guidanceFiles`/`architectureGuidance` arrays are empty.
13. Prompt advisory entries marked `selected` become before-agent-start advisory text.
14. Git reminder entries marked `selected` become bash `git commit` / `git push` detector reminders; if the profile says beforeGit project/scenario checks run first, `gitPreflight.runProjectChecks` must be true.
15. The Gap Analysis section must contain one row per universal gap category (1-10); each row must name a selected mitigation OR a `skipped`/`not_detected` reason and a residual risk.
16. Smoke commands must be explicit in profile. Record load smoke, isolated load smoke, syntax dry checks, safety dry checks, project-check trigger dry checks, manual scenario listing checks, and guidance dry selections in `smokeTests`.

Stop on validation failure with a concise list of missing or contradictory profile fields. Do not continue with guessed defaults.

## Step 6: Build generated extension profile literal

Translate selected/skipped profile entries into this TypeScript object shape. Include skipped reasons so the generated extension and final report stay inspectable. Backward-compatible fields (`syntaxChecks`, `formatters`, `lintChecks`, `guidanceFiles`, `promptAdvisories`, `gitReminder`, `smokeTests`, `skipped`) are preserved so existing profile artifacts remain understandable; new gap-driven fields are additive.

```typescript
type CheckTiming = "afterWrite" | "agentEnd" | "beforeGit" | "manual";
type HarnessPosture = "advisory" | "blocking";

interface ProjectCheckSpec {
  id: string;
  command: string;
  args: string[];
  cwd: string;                 // relative to target repo root ("" = root)
  timeoutMs: number;
  triggerExtensions: string[]; // e.g. [".ts", ".tsx"]; empty = always when timing fires
  triggerGlobs: string[];      // e.g. ["web/frontend/**"]; relative to repo root
  timing: CheckTiming;         // afterWrite | agentEnd | beforeGit
  posture: HarnessPosture;     // agentEnd is advisory-only regardless
  label?: string;
}

interface ScenarioCheckSpec extends ProjectCheckSpec {
  timing: CheckTiming;         // manual | beforeGit
  reason: string;
}

interface SafetyRuleSpec {
  id: string;
  tools: string[];             // bash | read | write | edit | ast_grep_replace
  match?: string;              // anchored/escaped regex string for bash commands
  paths?: string[];            // path or glob (relative to repo root) for file tools
  operation: string;           // human-readable operation being blocked
  reason: string;
  posture: "blocking" | "advisory";
}

interface ArchitectureGuidanceSpec {
  relativePath: string;
  label: string;
  appliesTo: string;           // "" or "." = root/session; otherwise touched-path prefix
  mode: "full" | "reference" | "scoped";
}

interface GitPreflightSpec {
  enabled: boolean;
  posture: HarnessPosture;
  text: string;
  runProjectChecks: boolean;   // run beforeGit project + scenario checks before the reminder
}

interface GeneratedHarnessProfile {
  sourceArtifact: string;
  targetRepo: string;
  outputPath: string;
  syntaxChecks: Array<{
    id: string;
    extensions: string[];
    command: string;
    args: string[];
    timeoutMs: number;
    posture: "blocking";
  }>;
  formatters: Array<{
    id: string;
    extensions: string[];
    command: string;
    args: string[];
    timeoutMs: number;
  }>;
  lintChecks: Array<{
    id: string;
    extensions: string[];
    command: string;
    args: string[];
    timeoutMs: number;
    posture: "advisory" | "blocking";
  }>;
  projectChecks: ProjectCheckSpec[];
  scenarioChecks: ScenarioCheckSpec[];
  safetyRules: SafetyRuleSpec[];
  guidanceFiles: Array<{
    relativePath: string;
    appliesTo: string;
    label: string;
  }>;
  architectureGuidance: ArchitectureGuidanceSpec[];
  promptAdvisories: string[];
  gitReminder: {
    enabled: boolean;
    posture: "advisory" | "blocking";
    text: string;
  };
  gitPreflight: GitPreflightSpec;
  smokeTests: {
    loadSmoke: boolean;
    isolatedLoadSmoke: boolean;
    syntaxDryChecks: string[];
    safetyDryChecks: string[];
    projectCheckDryChecks: string[];
    manualScenarioListing: boolean;
    guidanceDry: boolean;
  };
  skipped: Array<{ area: string; reason: string }>;
}
```

Command translation rules:

- `jq . <file>` → `{ command: "jq", args: [".", "{file}"] }`
- `node --check <file>` → `{ command: "node", args: ["--check", "{file}"] }`
- `bash -n <file>` → `{ command: "bash", args: ["-n", "{file}"] }`
- Prettier-style formatters → `{ command: "prettier", args: ["--write", "--log-level=silent", "{file}"] }`
- ESLint-style advisory lint → `{ command: "eslint", args: ["--no-fix", "{file}"] }`

Project/scenario command translation (note `cwd`, no `{file}` substitution — these run project-wide, not per file):

- root `tsc --noEmit` → `{ command: "npx", args: ["tsc", "--noEmit"], cwd: "" }`
- subdir build with pnpm → `{ command: "pnpm", args: ["--dir", "web/frontend", "build"], cwd: "" }` (or `{ command: "pnpm", args: ["build"], cwd: "web/frontend" }`)
- subdir test with npm → `{ command: "npm", args: ["--prefix", "app", "test"], cwd: "" }` (or `{ command: "npm", args: ["test"], cwd: "app" }`)
- Playwright e2e (manual) → `{ command: "npx", args: ["playwright", "test"], cwd: "", timing: "manual" }`
- Make/just target → `{ command: "make", args: ["typecheck"], cwd: "" }`

Prefer the explicit-`cwd` form (`cwd: "web/frontend"`, plain args) when the package manager supports being run from the subdirectory; use the `--dir`/`--prefix` form when the command must run from repo root.

For the current dotfiles profile, the generated profile should include JSON, JavaScript, and shell syntax checks; no formatter or lint checks; no project or scenario checks (`not_detected` with reason); universal `.env`-write and secret-read safety rules; no architecture guidance beyond reference pointers if present; selected prompt advisories; advisory git reminder; selected load/isolated/syntax/safety smoke tests; skipped reasons for unavailable formatter/lint/project/scenario tools.

## Step 7: Write `.pi/extensions/personal-harness.ts`

1. Create `<target_repo>/.pi/extensions/` if missing.
2. If `personal-harness.ts` exists and contains `Generated by personalize-harness-pi`, back it up to `personal-harness.ts-bak-<UTC-stamp>` before overwriting.
3. If `personal-harness.ts` exists and lacks that marker, stop and report that a human-owned extension already exists.
4. Write this generated extension with `<GENERATED_PROFILE_LITERAL>` replaced by the complete generated profile literal from Step 6.

```typescript
// @ts-nocheck
// Generated by personalize-harness-pi. Edit the Harness Profile artifact first, then regenerate.
import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

type CheckTiming = "afterWrite" | "agentEnd" | "beforeGit" | "manual";
type HarnessPosture = "advisory" | "blocking";

type CommandSpec = {
  id: string;
  extensions: string[];
  command: string;
  args: string[];
  timeoutMs: number;
};

type CommandResult = { ok: boolean; stdout: string; stderr: string; error?: string };

type LintSpec = CommandSpec & { posture: HarnessPosture };
type SyntaxSpec = CommandSpec & { posture: "blocking" };

type ProjectCheckSpec = {
  id: string;
  command: string;
  args: string[];
  cwd: string;
  timeoutMs: number;
  triggerExtensions: string[];
  triggerGlobs: string[];
  timing: CheckTiming;
  posture: HarnessPosture;
  label?: string;
};

type ScenarioCheckSpec = ProjectCheckSpec & { reason: string };

type SafetyRuleSpec = {
  id: string;
  tools: string[];
  match?: string;
  paths?: string[];
  operation: string;
  reason: string;
  posture: "blocking" | "advisory";
};

type ArchitectureGuidanceSpec = {
  relativePath: string;
  label: string;
  appliesTo: string;
  mode: "full" | "reference" | "scoped";
};

type GuidanceSpec = {
  relativePath: string;
  appliesTo: string;
  label: string;
};

type HarnessProfile = {
  sourceArtifact: string;
  targetRepo: string;
  outputPath: string;
  syntaxChecks: SyntaxSpec[];
  formatters: CommandSpec[];
  lintChecks: LintSpec[];
  projectChecks: ProjectCheckSpec[];
  scenarioChecks: ScenarioCheckSpec[];
  safetyRules: SafetyRuleSpec[];
  guidanceFiles: GuidanceSpec[];
  architectureGuidance: ArchitectureGuidanceSpec[];
  promptAdvisories: string[];
  gitReminder: {
    enabled: boolean;
    posture: HarnessPosture;
    text: string;
  };
  gitPreflight: {
    enabled: boolean;
    posture: HarnessPosture;
    text: string;
    runProjectChecks: boolean;
  };
  smokeTests: {
    loadSmoke: boolean;
    isolatedLoadSmoke: boolean;
    syntaxDryChecks: string[];
    safetyDryChecks: string[];
    projectCheckDryChecks: string[];
    manualScenarioListing: boolean;
    guidanceDry: boolean;
  };
  skipped: Array<{ area: string; reason: string }>;
};

const PROFILE: HarnessProfile = <GENERATED_PROFILE_LITERAL>;

const MSG_GUIDANCE = "personal-harness/guidance";
const MSG_GIT = "personal-harness/git";
const MSG_PROJECT = "personal-harness/project-check";
const MSG_SCENARIO = "personal-harness/scenario";
const MSG_SAFETY = "personal-harness/safety";
const WRITE_TOOLS = new Set(["write", "edit", "ast_grep_replace"]);
const TOUCH_TOOLS = new Set(["read", "write", "edit", "ast_grep_replace"]);
const injectedGuidance = new Set<string>();
const analyzedStates = new Set<string>();
// Touched-file tracking for this user prompt (drives agentEnd / beforeGit project + scenario checks).
const touchedRelPaths = new Set<string>();
const touchedExtensions = new Set<string>();

export default function personalHarness(pi: ExtensionAPI): void {
  registerPersonalHarness(pi);
}

function registerPersonalHarness(pi: ExtensionAPI): void {
  pi.on("session_start", async (_event, ctx) => onSessionStart(ctx, pi));
  pi.on("session_compact", async (_event, ctx) => onSessionCompact(ctx, pi));
  pi.on("agent_start", async (_event, _ctx) => {
    touchedRelPaths.clear();
    touchedExtensions.clear();
  });
  pi.on("tool_call", async (event, ctx) => onToolCall(event, ctx, pi));
  // tool_result overloads vary across Pi versions; keep generated extension self-contained.
  (pi as any).on("tool_result", async (event: any, ctx: any) => onToolResult(event, ctx, pi));
  pi.on("before_agent_start", async (event) => onBeforeAgentStart(event));
  pi.on("agent_end", async (_event, ctx) => onAgentEnd(ctx, pi));
}

async function onSessionStart(ctx: { cwd: string }, pi: ExtensionAPI): Promise<void> {
  injectedGuidance.clear();
  analyzedStates.clear();
  touchedRelPaths.clear();
  touchedExtensions.clear();
  injectRootGuidance(ctx.cwd, pi);
}

async function onSessionCompact(ctx: { cwd: string }, pi: ExtensionAPI): Promise<void> {
  injectedGuidance.clear();
  analyzedStates.clear();
  injectRootGuidance(ctx.cwd, pi);
}

async function onBeforeAgentStart(event: { systemPrompt: string }): Promise<{ systemPrompt: string } | undefined> {
  const content = buildPromptAdvisory();
  if (!content) return undefined;
  return {
    systemPrompt: `${event.systemPrompt}\n\n${content}`,
  };
}

async function onAgentEnd(ctx: { cwd: string; hasUI?: boolean; ui?: any }, pi: ExtensionAPI): Promise<void> {
  // agent_end CANNOT block. Run agentEnd project checks and surface failures as advisory only.
  const failures = await runProjectChecksForTiming("agentEnd", ctx.cwd, pi);
  for (const failure of failures) {
    pi.sendMessage({
      customType: MSG_PROJECT,
      content: formatAdvisoryFailure(`project check (agentEnd, ${failure.spec.posture === "blocking" ? "blocking-requested→advisory" : "advisory"})`, failure.spec.id, failure.spec.cwd || ".", failure.result),
      display: true,
    });
  }
  // Surface manual scenario checks whose triggers were touched — listed, never executed.
  for (const spec of PROFILE.scenarioChecks) {
    if (spec.timing !== "manual") continue;
    if (!checkTriggered(spec)) continue;
    pi.sendMessage({
      customType: MSG_SCENARIO,
      content: formatScenarioAdvisory(spec),
      display: true,
    });
  }
  if (ctx.hasUI && ctx.ui) ctx.ui.setStatus("personal-harness", undefined);
}

async function onToolCall(event: { toolName: string; input: Record<string, unknown> }, ctx: { cwd: string }, pi: ExtensionAPI) {
  // 1. Safety blockers run FIRST, before guidance injection and git handling — fail fast, deterministic.
  const safety = checkSafetyRules(event.toolName, event.input, ctx.cwd);
  if (safety) {
    if (safety.posture === "blocking") {
      return { block: true, reason: safety.reason };
    }
    pi.sendMessage({ customType: MSG_SAFETY, content: safety.reason, display: true });
  }

  if (TOUCH_TOOLS.has(event.toolName)) {
    injectTouchedGuidance(event, ctx.cwd, pi);
  }

  if (isGitCommitOrPushAttempt(event.toolName, event.input)) {
    // 2. beforeGit project + scenario checks run BEFORE any git reminder; blocking posture can block here.
    if (PROFILE.gitPreflight.runProjectChecks) {
      const blocked = await runBeforeGitBlockingChecks(ctx.cwd, pi);
      if (blocked) return { block: true, reason: blocked };
    }
    if (PROFILE.gitReminder.enabled) {
      if (PROFILE.gitReminder.posture === "blocking") {
        return { block: true, reason: PROFILE.gitReminder.text };
      }
      pi.sendMessage({ customType: MSG_GIT, content: PROFILE.gitReminder.text, display: false });
    }
  }
}

async function onToolResult(event: { toolCallId?: string; toolName: string; input: Record<string, unknown>; content?: Array<{ type: string; text?: string }>; isError?: boolean }, ctx: { cwd: string }, pi: ExtensionAPI) {
  if (!isWriteResultTool(event.toolName, event.input)) return;
  if (event.isError) return;

  const filePaths = resolveTouchedPaths(event.input, ctx.cwd).filter(
    (filePath) => existsSync(filePath) && isRegularFile(filePath) && isInsideProject(filePath, ctx.cwd) && !isExternalOrVendor(filePath, ctx.cwd),
  );
  if (filePaths.length === 0) return;

  // Track touched files/extensions so agentEnd/beforeGit checks only run when relevant.
  for (const filePath of filePaths) {
    const rel = relative(ctx.cwd, filePath).split(sep).join("/");
    touchedRelPaths.add(rel);
    const dot = rel.lastIndexOf(".");
    if (dot >= 0) touchedExtensions.add(rel.slice(dot));
  }

  const originalContent = Array.isArray(event.content) ? event.content : [];
  const notices: string[] = [];

  for (const filePath of filePaths) {
    const stateKey = buildStateKey(event.toolCallId, filePath);
    if (analyzedStates.has(stateKey)) continue;
    analyzedStates.add(stateKey);

    const syntaxFailure = await firstSyntaxFailure(pi, filePath, ctx.cwd);
    if (syntaxFailure) {
      return {
        content: [...originalContent, { type: "text", text: formatBlockingFailure("syntax", syntaxFailure.spec.id, filePath, syntaxFailure.result) }],
        isError: true,
      };
    }

    let formatterRan = false;
    for (const spec of matchingSpecs(PROFILE.formatters, filePath)) {
      const result = await runSpec(pi, spec, filePath, ctx.cwd);
      if (result.ok) formatterRan = true;
      if (!result.ok) {
        notices.push(formatAdvisoryFailure("formatter", spec.id, filePath, result));
      }
    }

    if (formatterRan) {
      const postFormatSyntaxFailure = await firstSyntaxFailure(pi, filePath, ctx.cwd);
      if (postFormatSyntaxFailure) {
        return {
          content: [...originalContent, { type: "text", text: formatBlockingFailure("post-format syntax", postFormatSyntaxFailure.spec.id, filePath, postFormatSyntaxFailure.result) }],
          isError: true,
        };
      }
    }

    for (const spec of matchingSpecs(PROFILE.lintChecks, filePath)) {
      const result = await runSpec(pi, spec, filePath, ctx.cwd);
      if (!result.ok && spec.posture === "blocking") {
        return {
          content: [...originalContent, { type: "text", text: formatBlockingFailure("lint", spec.id, filePath, result) }],
          isError: true,
        };
      }
      if (!result.ok) {
        notices.push(formatAdvisoryFailure("lint", spec.id, filePath, result));
      }
    }

    if (existsSync(filePath)) analyzedStates.add(buildStateKey(event.toolCallId, filePath));
  }

  // afterWrite project checks: blocking posture patches the write result as failed; advisory adds a notice.
  for (const spec of PROFILE.projectChecks) {
    if (spec.timing !== "afterWrite") continue;
    if (!specTriggeredByPaths(spec, filePaths, ctx.cwd)) continue;
    const result = await runProjectSpec(pi, spec, ctx.cwd);
    if (!result.ok && spec.posture === "blocking") {
      return {
        content: [...originalContent, { type: "text", text: formatBlockingFailure("project check", spec.id, spec.cwd || ".", result) }],
        isError: true,
      };
    }
    if (!result.ok) {
      notices.push(formatAdvisoryFailure("project check", spec.id, spec.cwd || ".", result));
    }
  }

  if (notices.length === 0) return;
  return {
    content: [...originalContent, { type: "text", text: notices.join("\n\n") }],
  };
}

// ---------------------------------------------------------------------------
// Safety blockers (deterministic; no model/web/UI calls).
// ---------------------------------------------------------------------------

function checkSafetyRules(toolName: string, input: Record<string, unknown>, cwd: string): { reason: string; posture: "blocking" | "advisory" } | undefined {
  for (const rule of PROFILE.safetyRules) {
    if (!rule.tools.includes(toolName)) continue;

    if (toolName === "bash") {
      const command = readBashCommand(input);
      if (command && rule.match && safeRegex(rule.match)?.test(command)) {
        return { reason: formatSafetyReason(rule, command), posture: rule.posture };
      }
      continue;
    }

    if (toolName === "ast_grep_replace" && input.apply !== true) continue;
    const paths = resolveTouchedPaths(input, cwd);
    for (const filePath of paths) {
      if (pathMatchesSafetyRule(rule, filePath, cwd)) {
        return { reason: formatSafetyReason(rule, relative(cwd, filePath).split(sep).join("/")), posture: rule.posture };
      }
    }
  }
  return undefined;
}

function pathMatchesSafetyRule(rule: SafetyRuleSpec, filePath: string, cwd: string): boolean {
  if (!rule.paths || rule.paths.length === 0) return false;
  // Resolve symlinks for existing paths; for new writes, resolve the deepest existing ancestor.
  const resolved = hardenedResolve(filePath);
  const root = hardenedResolve(cwd);
  // Block any symlink escape outside the project root for write-capable tools.
  if (rule.tools.some((t) => WRITE_TOOLS.has(t)) && !isInsideResolved(resolved, root)) {
    return true;
  }
  const rel = relative(root, resolved).split(sep).join("/");
  const relRaw = relative(cwd, filePath).split(sep).join("/");
  return rule.paths.some((pattern) => globMatch(pattern, rel) || globMatch(pattern, relRaw));
}

// Resolve the realpath of the deepest existing ancestor, then re-append the missing tail.
// This catches new-file writes through a symlinked parent directory.
function hardenedResolve(target: string): string {
  let current = resolve(target);
  const tail: string[] = [];
  // Walk up until an existing path is found.
  // Bounded by filesystem depth; the loop terminates at the root.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (existsSync(current)) {
      try {
        const real = realpathSync(current);
        return tail.length ? join(real, ...tail.reverse()) : real;
      } catch {
        return tail.length ? join(current, ...tail.reverse()) : current;
      }
    }
    const parent = dirname(current);
    if (parent === current) return target; // reached root, nothing existed
    tail.push(current.slice(parent.length + 1));
    current = parent;
  }
}

function isInsideResolved(resolvedPath: string, resolvedRoot: string): boolean {
  const rel = relative(resolvedRoot, resolvedPath);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

function safeRegex(pattern: string): RegExp | undefined {
  try {
    return new RegExp(pattern);
  } catch {
    return undefined;
  }
}

// Minimal glob: supports ** (any path), * (any non-separator run), and literal segments.
function globMatch(pattern: string, candidate: string): boolean {
  const normalized = pattern.replace(/^\.\//, "").replace(/\/$/, "");
  const specials = ".+^${}()|[]\\";
  let out = "";
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (ch === "*") {
      if (normalized[i + 1] === "*") {
        out += ".*";
        i++;
      } else {
        out += "[^/]*";
      }
    } else if (specials.includes(ch)) {
      out += `\\${ch}`;
    } else {
      out += ch;
    }
  }
  const regex = safeRegex(`^${out}(?:/.*)?$`);
  return regex ? regex.test(candidate) : candidate === normalized;
}

function readBashCommand(input: unknown): string {
  if (!input || typeof input !== "object") return "";
  const raw = input as { command?: unknown; cmd?: unknown };
  return typeof raw.command === "string" ? raw.command : typeof raw.cmd === "string" ? raw.cmd : "";
}

function formatSafetyReason(rule: SafetyRuleSpec, subject: string): string {
  return `personal-harness safety: ${rule.operation} blocked (${rule.id}). ${rule.reason} [${subject}]`;
}

// ---------------------------------------------------------------------------
// Deferred project + scenario checks.
// ---------------------------------------------------------------------------

async function runProjectChecksForTiming(timing: CheckTiming, cwd: string, pi: ExtensionAPI): Promise<Array<{ spec: ProjectCheckSpec; result: CommandResult }>> {
  const failures: Array<{ spec: ProjectCheckSpec; result: CommandResult }> = [];
  for (const spec of PROFILE.projectChecks) {
    if (spec.timing !== timing) continue;
    if (!checkTriggered(spec)) continue;
    const result = await runProjectSpec(pi, spec, cwd);
    if (!result.ok) failures.push({ spec, result });
  }
  return failures;
}

async function runBeforeGitBlockingChecks(cwd: string, pi: ExtensionAPI): Promise<string | undefined> {
  // Project checks first, then non-manual scenario checks; both honor blocking posture here.
  const specs: ProjectCheckSpec[] = [
    ...PROFILE.projectChecks.filter((s) => s.timing === "beforeGit"),
    ...PROFILE.scenarioChecks.filter((s) => s.timing === "beforeGit"),
  ];
  const blockers: string[] = [];
  for (const spec of specs) {
    if (!checkTriggered(spec)) continue;
    const result = await runProjectSpec(pi, spec, cwd);
    if (result.ok) continue;
    if (spec.posture === "blocking") {
      blockers.push(formatBlockingFailure("pre-git check", spec.id, spec.cwd || ".", result));
    } else {
      pi.sendMessage({ customType: MSG_PROJECT, content: formatAdvisoryFailure("pre-git check", spec.id, spec.cwd || ".", result), display: true });
    }
  }
  return blockers.length ? blockers.join("\n\n") : undefined;
}

// Triggered when no triggers are configured (always at its timing) OR a touched extension/glob matched.
function checkTriggered(spec: ProjectCheckSpec): boolean {
  const hasTriggers = spec.triggerExtensions.length > 0 || spec.triggerGlobs.length > 0;
  if (!hasTriggers) return true;
  for (const ext of spec.triggerExtensions) {
    if (touchedExtensions.has(ext)) return true;
  }
  for (const glob of spec.triggerGlobs) {
    for (const rel of touchedRelPaths) {
      if (globMatch(glob, rel)) return true;
    }
  }
  return false;
}

function specTriggeredByPaths(spec: ProjectCheckSpec, filePaths: string[], cwd: string): boolean {
  const hasTriggers = spec.triggerExtensions.length > 0 || spec.triggerGlobs.length > 0;
  if (!hasTriggers) return true;
  for (const filePath of filePaths) {
    const rel = relative(cwd, filePath).split(sep).join("/");
    const dot = rel.lastIndexOf(".");
    const ext = dot >= 0 ? rel.slice(dot) : "";
    if (ext && spec.triggerExtensions.includes(ext)) return true;
    if (spec.triggerGlobs.some((glob) => globMatch(glob, rel))) return true;
  }
  return false;
}

async function runProjectSpec(pi: ExtensionAPI, spec: ProjectCheckSpec, cwd: string): Promise<CommandResult> {
  const specCwd = spec.cwd ? resolve(cwd, spec.cwd) : cwd;
  try {
    const result = await pi.exec(spec.command, spec.args, { cwd: specCwd, timeout: spec.timeoutMs });
    const code = typeof (result as { code?: unknown }).code === "number" ? (result as { code: number }).code : 0;
    const killed = Boolean((result as { killed?: unknown }).killed);
    return {
      ok: code === 0 && !killed,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
      error: code === 0 && !killed ? undefined : `exit code ${code}${killed ? " (killed)" : ""}`,
    };
  } catch (error) {
    const anyError = error as { stdout?: string; stderr?: string; message?: string };
    return { ok: false, stdout: anyError.stdout ?? "", stderr: anyError.stderr ?? "", error: anyError.message ?? String(error) };
  }
}

function formatScenarioAdvisory(spec: ScenarioCheckSpec): string {
  const cmd = [spec.command, ...spec.args].join(" ");
  return [
    `personal-harness scenario check available (manual — NOT auto-run): ${spec.id}`,
    `Run when ready: (cd ${spec.cwd || "."} && ${cmd})`,
    spec.reason,
  ].filter(Boolean).join("\n");
}

// ---------------------------------------------------------------------------
// Existing per-file syntax / formatter / lint pipeline.
// ---------------------------------------------------------------------------

function isWriteResultTool(toolName: string, input: Record<string, unknown>): boolean {
  if (!WRITE_TOOLS.has(toolName)) return false;
  if (toolName === "ast_grep_replace") return input.apply === true;
  return true;
}

function resolveTouchedPaths(input: Record<string, unknown>, cwd: string): string[] {
  const paths: string[] = [];
  const raw = input.file_path ?? input.path;
  if (typeof raw === "string" && raw.length > 0) paths.push(resolveMaybeRelative(raw, cwd));

  const rawPaths = input.paths;
  if (Array.isArray(rawPaths)) {
    for (const item of rawPaths) {
      if (typeof item === "string" && item.length > 0) paths.push(resolveMaybeRelative(item, cwd));
    }
  }

  return [...new Set(paths)];
}

function resolveMaybeRelative(filePath: string, cwd: string): string {
  return isAbsolute(filePath) ? filePath : resolve(cwd, filePath);
}

async function firstSyntaxFailure(pi: ExtensionAPI, filePath: string, cwd: string): Promise<{ spec: SyntaxSpec; result: CommandResult } | undefined> {
  for (const spec of matchingSpecs(PROFILE.syntaxChecks, filePath)) {
    const result = await runSpec(pi, spec, filePath, cwd);
    if (!result.ok) return { spec, result };
  }
}

function buildStateKey(toolCallId: string | undefined, filePath: string): string {
  const stat = statSync(filePath);
  return `${toolCallId ?? "unknown"}:${filePath}:${stat.mtimeMs}:${stat.size}`;
}

function isRegularFile(filePath: string): boolean {
  try {
    return statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function isInsideProject(filePath: string, cwd: string): boolean {
  const rel = relative(cwd, filePath);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

function isExternalOrVendor(filePath: string, cwd: string): boolean {
  if (!isInsideProject(filePath, cwd)) return true;
  const rel = relative(cwd, filePath).split(sep).join("/");
  return rel.includes("/node_modules/") || rel.startsWith("node_modules/") || rel.includes("/.git/") || rel.startsWith(".git/");
}

function matchingSpecs<T extends CommandSpec>(specs: readonly T[], filePath: string): T[] {
  return specs.filter((spec) => spec.extensions.some((ext) => filePath.endsWith(ext)));
}

async function runSpec(pi: ExtensionAPI, spec: CommandSpec, filePath: string, cwd: string): Promise<CommandResult> {
  const args = spec.args.map((arg) => (arg === "{file}" ? filePath : arg));
  try {
    const result = await pi.exec(spec.command, args, { cwd, timeout: spec.timeoutMs });
    const code = typeof (result as { code?: unknown }).code === "number" ? (result as { code: number }).code : 0;
    const killed = Boolean((result as { killed?: unknown }).killed);
    return {
      ok: code === 0 && !killed,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
      error: code === 0 && !killed ? undefined : `exit code ${code}${killed ? " (killed)" : ""}`,
    };
  } catch (error) {
    const anyError = error as { stdout?: string; stderr?: string; message?: string };
    return {
      ok: false,
      stdout: anyError.stdout ?? "",
      stderr: anyError.stderr ?? "",
      error: anyError.message ?? String(error),
    };
  }
}

function formatBlockingFailure(kind: string, id: string, filePath: string, result: { stdout: string; stderr: string; error?: string }): string {
  const details = [result.stderr, result.stdout, result.error].filter(Boolean).join("\n").trim();
  return [`personal-harness ${kind} check failed: ${id}`, `Location: ${filePath}`, details].filter(Boolean).join("\n");
}

function formatAdvisoryFailure(kind: string, id: string, filePath: string, result: { stdout: string; stderr: string; error?: string }): string {
  const details = [result.stderr, result.stdout, result.error].filter(Boolean).join("\n").trim();
  return [`personal-harness ${kind} advisory: ${id} did not complete.`, `Location: ${filePath}`, details].filter(Boolean).join("\n");
}

function buildPromptAdvisory(): string {
  if (PROFILE.promptAdvisories.length === 0) return "";
  // Reference-only pointers to architecture docs are listed here so the model can read them on demand
  // instead of dumping large doc content into every prompt. Full/scoped guidance is injected separately.
  const refs = PROFILE.architectureGuidance
    .filter((g) => g.mode === "reference")
    .map((g) => `- ${g.label}: ${g.relativePath}`);
  const lines = ["## Personal Harness Advisory", ...PROFILE.promptAdvisories.map((item) => `- ${item}`)];
  if (refs.length) {
    lines.push("", "Architecture references (read with the read tool only when relevant):", ...refs);
  }
  return lines.join("\n");
}

function isGitCommitOrPushAttempt(toolName: string, input: unknown): boolean {
  if (toolName !== "bash") return false;
  const command = readBashCommand(input);
  return /(^|\s|&&|;|\|)git\s+(commit|push)(\s|$)/i.test(command);
}

// ---------------------------------------------------------------------------
// Guidance injection (touched-file + architecture).
// ---------------------------------------------------------------------------

function injectRootGuidance(cwd: string, pi: ExtensionAPI): void {
  for (const spec of PROFILE.guidanceFiles.filter((item) => item.appliesTo === "" || item.appliesTo === ".")) {
    injectGuidanceFile(cwd, spec.relativePath, spec.label, "auto-loaded at session start", "full", pi);
  }
  for (const spec of PROFILE.architectureGuidance.filter((item) => item.appliesTo === "" || item.appliesTo === ".")) {
    if (spec.mode === "scoped") continue; // scoped entries inject only on touch
    injectGuidanceFile(cwd, spec.relativePath, spec.label, "auto-loaded at session start", spec.mode, pi);
  }
}

function injectTouchedGuidance(event: { toolName: string; input: Record<string, unknown> }, cwd: string, pi: ExtensionAPI): void {
  for (const touched of resolveTouchedPaths(event.input, cwd)) {
    if (!isInsideProject(touched, cwd)) continue;
    const relTouched = relative(cwd, touched).split(sep).join("/");
    for (const spec of PROFILE.guidanceFiles) {
      const appliesTo = spec.appliesTo.replace(/^\.\//, "").replace(/\/$/, "");
      if (appliesTo && relTouched !== appliesTo && !relTouched.startsWith(`${appliesTo}/`)) continue;
      injectGuidanceFile(cwd, spec.relativePath, spec.label, `auto-loaded because ${event.toolName} touched ${relTouched}`, "full", pi);
    }
    for (const spec of PROFILE.architectureGuidance) {
      const appliesTo = spec.appliesTo.replace(/^\.\//, "").replace(/\/$/, "");
      if (!appliesTo) continue; // root entries handled at session start
      if (relTouched !== appliesTo && !relTouched.startsWith(`${appliesTo}/`)) continue;
      injectGuidanceFile(cwd, spec.relativePath, spec.label, `auto-loaded because ${event.toolName} touched ${relTouched}`, spec.mode, pi);
    }
  }
}

function injectGuidanceFile(cwd: string, relativePath: string, label: string, trigger: string, mode: "full" | "reference" | "scoped", pi: ExtensionAPI): void {
  const key = relativePath.split(sep).join("/");
  if (injectedGuidance.has(key)) return;
  const absolute = join(cwd, relativePath);
  if (!isInsideProject(absolute, cwd)) return;
  if (!existsSync(absolute)) return;
  injectedGuidance.add(key);
  if (mode === "reference") {
    // Reference-only: point at the doc, do not dump its content.
    pi.sendMessage({
      customType: MSG_GUIDANCE,
      content: [
        `[personal-harness guidance — reference material, NOT a task. ${trigger}.`,
        `Read ${relativePath} with the read tool only if directly relevant to the current request.]`,
        "",
        `## Personal Harness Guidance: ${label} (reference) → ${relativePath}`,
      ].join("\n"),
      display: shouldDisplayDebug(pi),
    });
    return;
  }
  const content = readFileSync(absolute, "utf-8");
  pi.sendMessage({
    customType: MSG_GUIDANCE,
    content: wrapGuidance(label, content, trigger),
    display: shouldDisplayDebug(pi),
  });
}

function shouldDisplayDebug(pi: ExtensionAPI): boolean {
  return Boolean((pi as unknown as { getFlag?: (name: string) => unknown }).getFlag?.("debug"));
}

function wrapGuidance(label: string, content: string, trigger: string): string {
  return [
    `[personal-harness guidance — reference material, NOT a task. ${trigger}.`,
    "Consult only if directly relevant to the user's current request; otherwise ignore.]",
    "",
    `## Personal Harness Guidance: ${label}`,
    "",
    content,
  ].join("\n");
}
```

## Step 8: Verify

Run these checks from `<target_repo>` after writing the extension:

1. File exists:

   ```bash
   test -f .pi/extensions/personal-harness.ts
   ```

2. Generated marker, type-check suppression, and default export exist:

   ```bash
   grep -q "@ts-nocheck" .pi/extensions/personal-harness.ts
   grep -q "Generated by personalize-harness-pi" .pi/extensions/personal-harness.ts
   grep -q "export default function personalHarness" .pi/extensions/personal-harness.ts
   ```

3. Load smoke when `PROFILE.smokeTests.loadSmoke` is true. Use an offline load-only command so verification proves extension loading without hanging on model execution:

   ```bash
   PI_OFFLINE=1 pi --no-session -e ./.pi/extensions/personal-harness.ts --list-models haiku >/dev/null
   ```

4. Isolated load smoke when `PROFILE.smokeTests.isolatedLoadSmoke` is true. Disable auto-discovered extensions and use offline load-only mode:

   ```bash
   PI_OFFLINE=1 pi --no-session --no-extensions -e ./.pi/extensions/personal-harness.ts --list-models haiku >/dev/null
   ```

   The load smoke must pass even when `projectChecks`, `scenarioChecks`, and `safetyRules` are all empty (a minimal profile must still load). Confirm with an empty-arrays profile if the target selected none.

   Optional prompt smoke may be run after load-only smoke passes, but a prompt timeout is inconclusive unless the output shows an extension import/runtime error:

   ```bash
   pi --no-session --no-extensions -e ./.pi/extensions/personal-harness.ts -p "harness load smoke test"
   ```

5. Syntax dry checks when `PROFILE.smokeTests.syntaxDryChecks` is non-empty, using temporary files generated from the matching `PROFILE.syntaxChecks` entries:

   ```bash
   tmpdir=$(mktemp -d)
   # For each selected syntax spec, create a minimal valid temp file with a matching extension,
   # replace `{file}` in that spec's args with the temp file, and run the spec command.
   printf '{"ok":true}\n' > "$tmpdir/harness.json"
   printf 'const ok = true;\n' > "$tmpdir/harness.js"
   printf '#!/usr/bin/env bash\necho ok\n' > "$tmpdir/harness.sh"
   jq . "$tmpdir/harness.json"
   node --check "$tmpdir/harness.js"
   bash -n "$tmpdir/harness.sh"
   rm -rf "$tmpdir"
   ```

6. Safety dry checks when `PROFILE.smokeTests.safetyDryChecks` is non-empty. Confirm each selected safety rule fires on a SAFE synthetic input and does not fire on a benign one — never touch real secrets/services:

   ```bash
   tmpdir=$(mktemp -d)
   # Protected-path write: a path matching a write/edit rule glob must be reported blocked.
   # Protected-path read: a path matching a read rule glob must be reported blocked.
   # Symlink escape: ln -s /etc "$tmpdir/escape"; a write under "$tmpdir/escape/x" must be blocked.
   # Blocked bash command: a string matching a bash rule's anchored regex must be reported blocked.
   # Benign command/path: a non-matching command and an ordinary source file must pass.
   ln -s /etc "$tmpdir/escape" 2>/dev/null || true
   echo "verify (using a mocked ExtensionAPI harness, not a live commit) that:"
   echo " - write to .env / $tmpdir/escape/x is blocked"
   echo " - read of a configured secret path is blocked"
   echo " - a configured destructive bash command is blocked"
   echo " - a benign 'echo ok' and ordinary src write pass"
   rm -rf "$tmpdir"
   ```

7. Project-check trigger dry checks when `PROFILE.smokeTests.projectCheckDryChecks` is non-empty. Using a mocked `ExtensionAPI` event harness (no live Pi), verify that:
   - an `agentEnd` project check runs only after a touched file matched its trigger extension/glob, and its failure is advisory/message-only (never marks a tool result failed, never blocks);
   - a `beforeGit` project check runs when `git commit`/`git push` is detected, before the git reminder, and a blocking failure blocks the git bash command;
   - no project check runs when no relevant file was touched.

8. Manual scenario listing check when `PROFILE.smokeTests.manualScenarioListing` is true. Confirm manual scenario checks are LISTED in the agent-end advisory/report when their triggers were touched, and are never auto-executed.

9. Guidance dry check when `PROFILE.smokeTests.guidanceDry` is true:
   - If profile selected `full`/`scoped` guidance paths, run the dry check with Pi debug-visible mode enabled, read/write/edit a matching sample path in a disposable temp project, and confirm `personal-harness/guidance` appears in Pi transcript or debug output for matching paths and does NOT appear for non-matching paths.
   - If profile selected `reference` guidance, confirm the prompt advisory lists the path without dumping the doc content.
   - If profile has no guidance paths, report skipped reason and confirm no-op.

Do not mark generation complete if selected guidance, safety, or project-check dry checks fail.
Do not mark generation complete if offline load-only smoke fails. Formatter/lint/project/scenario dry checks may be skipped when the profile marks the relevant tools `not_detected`; report those skipped reasons.

If writing `.pi/extensions/personal-harness.ts` in a non-TypeScript repo triggers LSP diagnostics for Node/Pi type resolution, treat them as non-blocking when both load smokes pass. Do not install `@types/node`, add package manifests, or mutate target repo dependencies just to satisfy generated extension editor diagnostics.

### Profile validation examples

- **Mixed Python + Next/TypeScript repo:** expect selected JSON/JS/TS syntax checks; a `selected` project typecheck (`npx tsc --noEmit`, `agentEnd` advisory, triggers `.ts`/`.tsx`) and/or `pnpm --dir web build` (`beforeGit`, advisory unless CI proves clean); a `manual` Playwright scenario check; `selected` safety rules for `.env*` writes and any deploy command named in a runbook; `reference`-mode architecture guidance for a large `docs/architecture/`. Gap Analysis must show all 10 categories with mitigation or reason.
- **Simple script/config repo:** expect selected shell/JSON syntax checks; project and scenario checks `not_detected` (no build/test tooling) with reasons; universal `.env`-write/secret-read safety rules `selected`; architecture guidance `not_detected`; Gap Analysis still covers all 10 categories.

## Step 9: Report

Print:

```text
personalize-harness-pi done.

Generated:
- <profile_artifact_path>
- <target_repo>/.pi/extensions/personal-harness.ts

Gap mitigations:
- <category>: <selected mitigation> (timing/posture)   # one line per addressed gap category

Selected project checks:
- <id>: <command> (cwd=<cwd>, timing=<timing>, posture=<posture>, triggers=<ext/glob>)

Manual scenario checks (listed, not auto-run):
- <id>: <command> (cwd=<cwd>) — <reason>

Safety blockers:
- <id>: <tool scope> <match/paths> — <operation> (<posture>)

Verification:
- load smoke: pass|fail|skipped
- isolated load smoke: pass|fail|skipped
- prompt smoke: pass|fail|timeout|skipped
- syntax dry checks: pass|fail|skipped
- safety dry checks: pass|fail|skipped
- project-check trigger dry checks: pass|fail|skipped
- manual scenario listing: pass|fail|skipped
- guidance dry: pass|fail|skipped

Residual skipped gaps:
- <area>: <reason>

Next:
- Run /reload inside Pi in <target_repo>.
- Edit the Harness Profile artifact first, then re-run this skill to regenerate or pass the artifact path explicitly.

Rollback:
- If generated behavior is too aggressive, edit the Harness Profile artifact and regenerate,
  or delete <target_repo>/.pi/extensions/personal-harness.ts to remove the harness entirely.
  A prior generated file is preserved as personal-harness.ts-bak-<UTC-stamp>.
```

## Important Notes

- Generated output is project-local. Do not edit `.pi/agent/settings.json`, `.pi/agent/settings.json.template`, target package manifests, or global package configuration during generation.
- Probe tools during facilitator mode only. During generation, do not probe tools or infer commands; the Harness Profile owns detection. Selected commands must already exist in local manifests/scripts or as installed tools; web research never authorizes a command the repo cannot run.
- Preserve skipped/not-detected reasons in the generated profile literal and final report.
- Back up only previously generated `personal-harness.ts`; stop before overwriting human-owned files.
- Syntax checks are blocking by default because they are high signal.
- Formatters fail open and never mark the tool result as failed solely due to formatter failure; syntax checks rerun after a successful formatter.
- Lint and git are advisory unless the profile explicitly sets `posture: blocking`.
- Project checks default to `agentEnd` advisory. `agentEnd` checks can NEVER block — Pi `agent_end` accepts no blocking return value; surface failures as messages only. Blocking project checks must run at `afterWrite` (via `tool_result` result patches) or `beforeGit` (via `tool_call` block).
- Scenario checks default to `manual` and are surfaced as advisories, never auto-executed; only deterministic, bounded, repo-sanctioned scenarios may be promoted to `beforeGit`.
- Safety blockers run first in `tool_call`, are deterministic, and never call the model, web, or interactive UI. Universal sensitive-path protections (`.env*` writes, secret reads, dependency/vendor writes, destructive shell commands) are included unless explicitly skipped with reason. Path rules harden against symlink escapes via realpath of the deepest existing ancestor.
- Architecture guidance can be injected `full`, `reference` (pointer only — preferred for large docs/wikis/ADR dirs), or `scoped` (only when a matching path is touched). Guidance is reference material, not a task; the reference-material wrapper is preserved. Avoid duplicating high-priority project instructions Pi already loaded.
- Touched-file guidance is reference material, not a task.
- Support both `path` and `file_path` tool inputs for read/edit/write/write-result sensors.
- Include known write-capable tools that expose concrete file paths, currently `write`, `edit`, and `ast_grep_replace` with `apply: true`; profile skipped reasons must call out write-capable tools that only expose directory/project scopes and cannot be gated per changed file.
