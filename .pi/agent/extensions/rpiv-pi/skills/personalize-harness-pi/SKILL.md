---
name: personalize-harness-pi
description: Generate a project-local Pi personal harness extension from a research Harness Profile artifact. Reads explicit selected/skipped profile entries, writes .pi/extensions/personal-harness.ts, and runs load/dry verification.
argument-hint: "[.rpiv/artifacts/research/*.md]"
allowed-tools: Read, Write, Bash(*), Grep, Glob
disable-model-invocation: true
shell-timeout: 10
---

# Personalize Harness Pi

Generate a project-local Pi extension from a completed harness-profile research artifact. This is Pi-native: no Claude hook JSON, no shell hook settings, no global Pi settings edits from the generator.

## Input

`$ARGUMENTS` — path to a completed `.rpiv/artifacts/research/*.md` artifact containing `## Harness Profile`.

## Metadata

```!
node "${SKILL_DIR}/../_shared/git-context.mjs"
echo
node "${SKILL_DIR}/../_shared/list-recent.mjs" .rpiv/artifacts/research 4
```

Use `root:` from metadata as default target repo if the profile omits `target_repo`. Use `author:` only for generated comments if needed.

## Flow

1. Resolve profile artifact → 2. Read and validate Harness Profile → 3. Build generated extension profile literal → 4. Write `.pi/extensions/personal-harness.ts` → 5. Verify load/dry checks → 6. Report generated path and skipped sensors

## Step 1: Resolve profile artifact

1. If `$ARGUMENTS` contains a path under `.rpiv/artifacts/research/` ending in `.md`, read it fully.
2. If `$ARGUMENTS` is empty, choose the newest recent research artifact whose filename or topic contains `personalize-harness-pi`.
3. If no artifact is available, stop with:

   ```text
   No personalize-harness-pi research artifact found. Run /research from the discover artifact first.
   ```

4. Confirm the artifact frontmatter has `status: complete` or `status: ready`.
5. Confirm the artifact contains `## Harness Profile`.

## Step 2: Validate Harness Profile

Treat the Harness Profile as the source of truth. Do not probe tools or invent commands during generation.

Required profile groups:

- Profile Metadata
- Detected Languages and Tools
- Syntax Check Commands
- Formatter Commands
- Lint Commands
- Touched-File Guidance Locations
- Prompt Advisories
- Git Preflight Reminders
- Blocking and Advisory Posture
- Smoke-Test Commands

Validation rules:

1. `target_repo` must resolve to an absolute directory. If absent, use metadata `root:`.
2. `runtime_output` must equal `.pi/extensions/personal-harness.ts`.
3. Every language/tool/check line must contain one of `selected`, `selected_if_json`, `skipped`, or `not_detected`.
4. Every `selected` entry must include enough command/text/config to generate from it.
5. Every `skipped`, `not_detected`, or `selected_if_json` entry must include a reason or condition; missing reasons fail validation.
6. Every `selected` syntax command must identify a language, command, and blocking posture.
7. Formatter entries may be `not_detected`; generated extension must treat them as no-op/fail-open.
8. Lint entries may be `not_detected`; generated extension must treat lint as advisory unless posture explicitly says `blocking`.
9. Guidance entries may be `not_detected`; generated extension must still include guidance support, but generated `guidanceFiles` is empty.
10. Prompt advisory entries marked `selected` become before-agent-start advisory text.
11. Git reminder entries marked `selected` become bash `git commit` / `git push` detector reminders.
12. Smoke commands must be explicit in profile. Always include load smoke and isolated load smoke if selected.

Stop on validation failure with a concise list of missing or contradictory profile fields. Do not continue with guessed defaults.

## Step 3: Build generated extension profile literal

Translate selected/skipped profile entries into this TypeScript object shape. Include skipped reasons so the generated extension and final report stay inspectable.

```typescript
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
  guidanceFiles: Array<{
    relativePath: string;
    appliesTo: string;
    label: string;
  }>;
  promptAdvisories: string[];
  gitReminder: {
    enabled: boolean;
    posture: "advisory" | "blocking";
    text: string;
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

For the current dotfiles profile, generated profile should include JSON, JavaScript, and shell syntax checks; no formatter or lint checks; no guidance files; selected prompt advisories; advisory git reminder; skipped reasons for unavailable formatter/lint/guidance tools.

## Step 4: Write `.pi/extensions/personal-harness.ts`

1. Create `<target_repo>/.pi/extensions/` if missing.
2. If `personal-harness.ts` exists and contains `Generated by personalize-harness-pi`, back it up to `personal-harness.ts-bak-<UTC-stamp>` before overwriting.
3. If `personal-harness.ts` exists and lacks that marker, stop and report that a human-owned extension already exists.
4. Write this generated extension with `PROFILE` replaced by the complete generated profile literal from Step 3.

```typescript
// Generated by personalize-harness-pi. Edit the Harness Profile artifact first, then regenerate.
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

type HarnessPosture = "advisory" | "blocking";

type CommandSpec = {
  id: string;
  extensions: string[];
  command: string;
  args: string[];
  timeoutMs: number;
};

type LintSpec = CommandSpec & { posture: HarnessPosture };
type SyntaxSpec = CommandSpec & { posture: "blocking" };

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
  guidanceFiles: GuidanceSpec[];
  promptAdvisories: string[];
  gitReminder: {
    enabled: boolean;
    posture: HarnessPosture;
    text: string;
  };
  skipped: Array<{ area: string; reason: string }>;
};

const PROFILE: HarnessProfile = <GENERATED_PROFILE_LITERAL>;

const MSG_GUIDANCE = "personal-harness/guidance";
const MSG_GIT = "personal-harness/git";
const WRITE_TOOLS = new Set(["write", "edit"]);
const TOUCH_TOOLS = new Set(["read", "write", "edit"]);
const injectedGuidance = new Set<string>();

export default function personalHarness(pi: ExtensionAPI): void {
  registerPersonalHarness(pi);
}

function registerPersonalHarness(pi: ExtensionAPI): void {
  pi.on("session_start", async (_event, ctx) => onSessionStart(ctx, pi));
  pi.on("session_compact", async (_event, ctx) => onSessionCompact(ctx, pi));
  pi.on("tool_call", async (event, ctx) => onToolCall(event, ctx, pi));
  // tool_result overloads vary across Pi versions; keep generated extension self-contained.
  (pi as any).on("tool_result", async (event: any, ctx: any) => onToolResult(event, ctx, pi));
  pi.on("before_agent_start", async (event) => onBeforeAgentStart(event));
  pi.on("agent_end", async (_event, ctx) => {
    if (ctx.hasUI) ctx.ui.setStatus("personal-harness", undefined);
  });
}

async function onSessionStart(ctx: { cwd: string }, pi: ExtensionAPI): Promise<void> {
  injectedGuidance.clear();
  injectRootGuidance(ctx.cwd, pi);
}

async function onSessionCompact(ctx: { cwd: string }, pi: ExtensionAPI): Promise<void> {
  injectedGuidance.clear();
  injectRootGuidance(ctx.cwd, pi);
}

async function onBeforeAgentStart(event: { systemPrompt: string }): Promise<{ systemPrompt: string } | undefined> {
  const content = buildPromptAdvisory();
  if (!content) return undefined;
  return {
    systemPrompt: `${event.systemPrompt}\n\n${content}`,
  };
}

async function onToolCall(event: { toolName: string; input: Record<string, unknown> }, ctx: { cwd: string }, pi: ExtensionAPI) {
  if (TOUCH_TOOLS.has(event.toolName)) {
    injectTouchedGuidance(event, ctx.cwd, pi);
  }

  if (isGitCommitOrPushAttempt(event.toolName, event.input) && PROFILE.gitReminder.enabled) {
    if (PROFILE.gitReminder.posture === "blocking") {
      return { block: true, reason: PROFILE.gitReminder.text };
    }
    pi.sendMessage({ customType: MSG_GIT, content: PROFILE.gitReminder.text, display: false });
  }
}

async function onToolResult(event: { toolName: string; input: Record<string, unknown>; content?: Array<{ type: string; text?: string }>; isError?: boolean }, ctx: { cwd: string }, pi: ExtensionAPI) {
  if (!WRITE_TOOLS.has(event.toolName)) return;
  if (event.isError) return;

  const filePath = resolveTouchedPath(event.input, ctx.cwd);
  if (!filePath) return;
  if (!existsSync(filePath)) return;
  if (!isInsideProject(filePath, ctx.cwd)) return;
  if (isExternalOrVendor(filePath, ctx.cwd)) return;

  const originalContent = Array.isArray(event.content) ? event.content : [];
  const notices: string[] = [];

  for (const spec of matchingSpecs(PROFILE.syntaxChecks, filePath)) {
    const result = await runSpec(pi, spec, filePath, ctx.cwd);
    if (!result.ok) {
      return {
        content: [...originalContent, { type: "text", text: formatBlockingFailure("syntax", spec.id, filePath, result) }],
        isError: true,
      };
    }
  }

  for (const spec of matchingSpecs(PROFILE.formatters, filePath)) {
    const result = await runSpec(pi, spec, filePath, ctx.cwd);
    if (!result.ok) {
      notices.push(formatAdvisoryFailure("formatter", spec.id, filePath, result));
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

  if (notices.length === 0) return;
  return {
    content: [...originalContent, { type: "text", text: notices.join("\n\n") }],
  };
}

function resolveTouchedPath(input: Record<string, unknown>, cwd: string): string | undefined {
  const raw = input.file_path ?? input.path;
  if (typeof raw !== "string" || raw.length === 0) return undefined;
  return isAbsolute(raw) ? raw : resolve(cwd, raw);
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

async function runSpec(pi: ExtensionAPI, spec: CommandSpec, filePath: string, cwd: string): Promise<{ ok: boolean; stdout: string; stderr: string; error?: string }> {
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
  return [`personal-harness ${kind} check failed: ${id}`, `File: ${filePath}`, details].filter(Boolean).join("\n");
}

function formatAdvisoryFailure(kind: string, id: string, filePath: string, result: { stdout: string; stderr: string; error?: string }): string {
  const details = [result.stderr, result.stdout, result.error].filter(Boolean).join("\n").trim();
  return [`personal-harness ${kind} advisory: ${id} did not complete.`, `File: ${filePath}`, details].filter(Boolean).join("\n");
}

function buildPromptAdvisory(): string {
  if (PROFILE.promptAdvisories.length === 0) return "";
  return ["## Personal Harness Advisory", ...PROFILE.promptAdvisories.map((item) => `- ${item}`)].join("\n");
}

function isGitCommitOrPushAttempt(toolName: string, input: unknown): boolean {
  if (toolName !== "bash") return false;
  if (!input || typeof input !== "object") return false;
  const raw = input as { command?: unknown; cmd?: unknown };
  const command = typeof raw.command === "string" ? raw.command : typeof raw.cmd === "string" ? raw.cmd : "";
  return /(^|\s|&&|;|\|)git\s+(commit|push)(\s|$)/i.test(command);
}

function injectRootGuidance(cwd: string, pi: ExtensionAPI): void {
  for (const spec of PROFILE.guidanceFiles.filter((item) => item.appliesTo === "" || item.appliesTo === ".")) {
    injectGuidanceFile(cwd, spec, "auto-loaded at session start", pi);
  }
}

function injectTouchedGuidance(event: { toolName: string; input: Record<string, unknown> }, cwd: string, pi: ExtensionAPI): void {
  const touched = resolveTouchedPath(event.input, cwd);
  if (!touched) return;
  if (!isInsideProject(touched, cwd)) return;
  const relTouched = relative(cwd, touched).split(sep).join("/");
  for (const spec of PROFILE.guidanceFiles) {
    const appliesTo = spec.appliesTo.replace(/^\.\//, "").replace(/\/$/, "");
    if (appliesTo && relTouched !== appliesTo && !relTouched.startsWith(`${appliesTo}/`)) continue;
    injectGuidanceFile(cwd, spec, `auto-loaded because ${event.toolName} touched ${relTouched}`, pi);
  }
}

function injectGuidanceFile(cwd: string, spec: GuidanceSpec, trigger: string, pi: ExtensionAPI): void {
  const key = spec.relativePath.split(sep).join("/");
  if (injectedGuidance.has(key)) return;
  const absolute = join(cwd, spec.relativePath);
  if (!isInsideProject(absolute, cwd)) return;
  if (!existsSync(absolute)) return;
  const content = readFileSync(absolute, "utf-8");
  injectedGuidance.add(key);
  pi.sendMessage({
    customType: MSG_GUIDANCE,
    content: wrapGuidance(spec.label, content, trigger),
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

## Step 5: Verify

Run these checks from `<target_repo>` after writing the extension:

1. File exists:

   ```bash
   test -f .pi/extensions/personal-harness.ts
   ```

2. Generated marker and default export exist:

   ```bash
   grep -q "Generated by personalize-harness-pi" .pi/extensions/personal-harness.ts
   grep -q "export default function personalHarness" .pi/extensions/personal-harness.ts
   ```

3. Load smoke when profile selected `load_smoke`:

   ```bash
   pi --no-session -e ./.pi/extensions/personal-harness.ts -p "harness load smoke test"
   ```

4. Isolated load smoke when profile selected `isolated_load_smoke`:

   ```bash
   pi --no-session --no-extensions -e ./.pi/extensions/personal-harness.ts -p "harness load smoke test"
   ```

5. Syntax dry checks for selected commands using temporary files:

   ```bash
   tmpdir=$(mktemp -d)
   printf '{"ok":true}\n' > "$tmpdir/harness.json"
   printf 'const ok = true;\n' > "$tmpdir/harness.js"
   printf '#!/usr/bin/env bash\necho ok\n' > "$tmpdir/harness.sh"
   jq . "$tmpdir/harness.json"
   node --check "$tmpdir/harness.js"
   bash -n "$tmpdir/harness.sh"
   rm -rf "$tmpdir"
   ```

6. Guidance dry check:
   - If profile selected guidance paths, run the dry check with Pi debug-visible mode enabled, read/write/edit a matching sample path in a disposable temp project, and confirm `personal-harness/guidance` appears in Pi transcript or debug output.
   - If profile has no guidance paths, report skipped reason and confirm no-op.

Do not mark generation complete if selected guidance dry checks fail.
Do not mark generation complete if load smoke fails. Formatter/lint dry checks may be skipped when profile marks tools `not_detected`; report those skipped reasons.

## Step 6: Report

Print:

```text
personalize-harness-pi done.

Generated:
- <target_repo>/.pi/extensions/personal-harness.ts

Verification:
- load smoke: pass|fail|skipped
- isolated load smoke: pass|fail|skipped
- syntax dry checks: pass|fail|skipped
- guidance dry: pass|fail|skipped

Skipped:
- <area>: <reason>

Next:
- Run /reload inside Pi in <target_repo>.
- Edit the Harness Profile artifact first, then re-run this skill to regenerate.
```

## Important Notes

- Generated output is project-local. Do not edit `.pi/agent/settings.json`, `.pi/agent/settings.json.template`, or global package configuration during generation.
- Do not probe tools or infer commands during generation; research/profile owns detection.
- Preserve skipped/not-detected reasons in the generated profile literal and final report.
- Back up only previously generated `personal-harness.ts`; stop before overwriting human-owned files.
- Syntax checks are blocking by default because they are high signal.
- Formatters fail open and never mark the tool result as failed solely due to formatter failure.
- Lint and git are advisory unless the profile explicitly sets `posture: blocking`.
- Touched-file guidance is reference material, not a task.
- Support both `path` and `file_path` tool inputs for read/edit/write/write-result sensors.
