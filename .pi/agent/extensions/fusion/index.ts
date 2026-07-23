/**
 * fusion — opt-in Pi orchestration mode.
 *
 * Shrinks the parent's tool surface so it owns intent / architecture / spec /
 * diff review / verification, while cheap fresh-context children do discovery
 * (scout), external facts (researcher), file mutations (worker), and risk-based
 * review (reviewer). See docs/adr/0002-fusion-mode.md in this dotfiles repo.
 *
 * --- Hardcoded fallback is OFF ---
 *   No session loaded: off
 *   No --fusion flag: off
 *   No global default-on config: off
 *
 *   On this machine the user-level config at
 *   $XDG_CONFIG_HOME/fusion/config.json (defaultMode: "on") flips the
 *   default to on; this file holds the only knob and no other opt-in
 *   configuration is read from it.
 *
 * --- Child processes are unaffected ---
 *   The extension self-disables when PI_SUBAGENT_CHILD=1 is set in the
 *   environment. Children inherit their role's tools from
 *   settings.json subagents.agentOverrides; Fusion's parent-only rules
 *   never apply inside a child.
 *
 * --- Persistence ---
 *   /fusion on|off writes a custom session entry (customType
 *   "fusion-state"). On session resume the latest such entry is the
 *   truth, ahead of CLI flag and global config. This is the same pattern
 *   plan-mode uses (`examples/extensions/plan-mode/index.ts`).
 *
 * --- Tool interception ---
 *   At every before_agent_start while active, exact-allowlist the parent
 *   tools. At every tool_call on the `subagent` tool while active,
 *   enforce role + context + output + model-pinning rules recursively
 *   over single / parallel / chain / append-step execution modes.
 *
 * --- Bash policy ---
 *   Conservative cross-language read-only Git + standard deterministic
 *   verification commands are globally permitted. Dangerous shell
 *   metacharacters and unsafe modes are always rejected; dangerous-mode
 *   denies win over the global allowlist. Per-project exact-match
 *   overrides live in trusted <project>/.pi/fusion.json
 *   `allowedCommands: ["exact full command string", ...]`.
 *
 * --- Outputs ---
 *   Pure helpers are exported (isSafeBash, validateSubagentCall, etc.)
 *   so tests can exercise them without the runtime.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join } from "node:path";
import type {
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";

// --- child-env detection --------------------------------------------------

export const SUBAGENT_CHILD_ENV = "PI_SUBAGENT_CHILD";

export function isChildProcess(env: Record<string, string | undefined> | NodeJS.ProcessEnv = process.env): boolean {
	return env[SUBAGENT_CHILD_ENV] === "1";
}

// --- state ---------------------------------------------------------------

export const FUSION_STATE_CUSTOM = "fusion-state";

export interface FusionState {
	enabled: boolean;
	toolsBeforeFusion?: string[];
}

export const MODE_ON = "on" as const;
export const MODE_OFF = "off" as const;
export type FusionMode = typeof MODE_ON | typeof MODE_OFF;

export function normalizeMode(value: unknown): FusionMode | undefined {
	return value === MODE_ON || value === MODE_OFF ? value : undefined;
}

// --- global default config ------------------------------------------------

const GLOBAL_CONFIG_BASENAME = "fusion/config.json";

/**
 * Locate $XDG_CONFIG_HOME/fusion/config.json, falling back to
 * ~/.config/fusion/config.json. Honors the XDG spec on every Unix-y
 * platform. CWD independence is the whole point: the parent reads the
 * user-level config before any project context loads.
 */
export function globalConfigPath(): string {
	const xdg = process.env.XDG_CONFIG_HOME && process.env.XDG_CONFIG_HOME.trim();
	const base = xdg && isAbsolute(xdg) ? xdg : join(homedir(), ".config");
	return join(base, GLOBAL_CONFIG_BASENAME);
}

/**
 * Read the global default mode. Returns "on", "off", or undefined if
 * the config is absent or malformed (treated as off).
 *
 * The schema is intentionally tiny: { defaultMode?: "on" | "off" }.
 * No role / model / tool knobs live here; per-role config stays in
 * settings.json so the source of truth for orchestration mapping stays
 * in one place. Reading is permissive: extra keys are ignored, missing
 * file is undefined (treated as off).
 */
export function readGlobalDefaultMode(path: string = globalConfigPath()): FusionMode | undefined {
	if (!existsSync(path)) return undefined;
	let raw: string;
	try {
		raw = readFileSync(path, "utf8");
	} catch {
		return undefined;
	}
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return undefined;
	}
	if (!parsed || typeof parsed !== "object") return undefined;
	const mode = (parsed as Record<string, unknown>).defaultMode;
	return normalizeMode(mode);
}

/**
 * Write the global default mode. No-op when there is no change; mkdirs
 * the parent dir so the typical "first-time-on" write succeeds without
 * a manual touch.
 */
export function writeGlobalDefaultMode(mode: FusionMode, path: string = globalConfigPath()): boolean {
	const current = readGlobalDefaultMode(path);
	if (current === mode) return true;
	const dir = dirname(path);
	try {
		mkdirSync(dir, { recursive: true });
	} catch {
		return false;
	}
	try {
		writeFileSync(path, JSON.stringify({ defaultMode: mode }, null, 2) + "\n", { mode: 0o600 });
		return true;
	} catch {
		return false;
	}
}

// --- parent tool allowlist ------------------------------------------------

export const PARENT_ALLOWED_TOOLS = [
	"read",
	"bash",
	"lsp_diagnostics",
	"subagent",
	"subagent_wait",
	"subagent_supervisor",
	"todo",
	"advisor",
] as const;

export type ParentAllowedTool = typeof PARENT_ALLOWED_TOOLS[number];

const PARENT_ALLOWED_SET = new Set<string>(PARENT_ALLOWED_TOOLS);

export function isParentAllowedTool(name: string): boolean {
	return PARENT_ALLOWED_SET.has(name);
}

/**
 * Returns the exact parent tool allowlist, optionally unioned with a
 * caller-provided list of extras. Extras are deduped and never replace
 * a parent-allowed tool.
 */
export function parentToolAllowlist(extras: readonly string[] = []): string[] {
	const seen = new Set<string>(PARENT_ALLOWED_TOOLS);
	for (const name of extras) {
		if (!seen.has(name)) seen.add(name);
	}
	return [...seen];
}

/**
 * Apply the parent allowlist to the active tools. The base set is
 * exactly the parent-allowed set; the optional `extras` are unioned in
 * but never replace the base. When Fusion disables, the caller
 * supplies the pre-Fusion snapshot.
 */
export function applyParentAllowlist(pi: { getActiveTools: () => string[]; setActiveTools: (n: string[]) => void }, extras: readonly string[] = []): void {
	pi.setActiveTools(parentToolAllowlist(extras));
}

// --- bash policy ---------------------------------------------------------

// Globally-allowed verification / Git commands. Conservative by design;
// project-specific oddities go in trusted .pi/fusion.json. Each entry
// matches an EXACT complete command substring (anchored-or-end).
export const GLOBAL_BASH_ALLOWLIST: string[] = [
	// read-only Git inspection
	"git status",
	"git diff",
	"git show",
	"git log",

	// deterministic verification, conservative forms
	"cargo test",
	"cargo build",
	"go test",
	"go build",
	"go vet",
	"make test",
	"make build",
	"make lint",
	"npm test",
	"npm run",
	"pnpm test",
	"pnpm run",
	"yarn test",
	"yarn run",
	"pytest",
	"python -m pytest",
	"ruff check",
	"mypy",
	"tsc",
	"eslint",
	"biome",
	"prettier --check",
];

// Globally denied dangerous modes regardless of the allowlist:
//   shell chaining / pipes / redirects / subshells / newlines
//   package install/update/publish
//   fix / write modes for formatters and linters
//   snapshot update modes
//   mutating Git commands
//   unrestricted interpreters
const SHELL_METACHARACTERS = /[;|&`$()<>\\!\n\r\\]/;
const REDIRECT_TOKENS = /(>>|>[^>&]|<<)/;

const DANGEROUS_FRAGMENTS: { label: string; pattern: RegExp }[] = [
	{ label: "package install/update/publish", pattern: /\b(npm|pnpm|yarn)\s+(install|i|add|update|upgrade|global|publish|uninstall|remove)\b/ },
	{ label: "pip / uv install", pattern: /\b(pip|uv|pipx)\s+(install|uninstall)\b/ },
	{ label: "cargo install", pattern: /\bcargo\s+install\b/ },
	{ label: "formatter fix mode", pattern: /\b(prettier|biome|black|autopep8|gofmt|gofmt-s|standardjs|standard)\s+.*--write\b/ },
	{ label: "formatter fix flag", pattern: /\b(prettier|biome|black|autopep8|standardjs|standard)\s+-w\b/ },
	{ label: "eslint fix mode", pattern: /\beslint\s+.*--fix\b/ },
	{ label: "ruff fix mode", pattern: /\bruff\s+check\s+.*--fix\b/ },
	{ label: "snapshot update", pattern: /\b(snapshots?|snap)\s+(update|u|--update|-u)\b/ },
	{ label: "jest snapshot update", pattern: /\bjest\s+.*-u\b/ },
	{ label: "vitest snapshot update", pattern: /\bvitest\s+.*-u\b/ },
	{ label: "mutating git command", pattern: /\bgit\s+(commit|checkout|reset|revert|merge|rebase|push|pull|fetch|clone|stash|branch|tag|cherry-pick|switch|restore|rm|mv|clean|am)\b/ },
	{ label: "git write-to-file", pattern: /\bgit\s+(config\s+--global\s+--replace|log\s+.*>|show\s+.*>\s)/ },
	{ label: "tee / output redirect", pattern: /\b(tee|cat\s+.*>)\b/ },
	{ label: "unrestricted interpreter", pattern: /^\s*(bash|sh|zsh|ksh|fish|python|python3|node|nodejs|ruby|perl|lua|pwsh|powershell)\s*$/ },
];

// Safe tail tokens. Each entry must be a SHORT, deterministic, no-arg flag OR
// a flag-with-arg pattern. Anything outside this list (or the rev/path list
// below) fails the safety gate. The list is intentionally narrow; unusual
// commands go in trusted .pi/fusion.json.
const OK_TRAILING_FLAGS: RegExp[] = [
	/^--json$/,
	/^--porcelain(?:=[a-z0-9]+)?$/,
	/^--oneline$/,
	/^--stat$/,
	/^--shortstat$/,
	/^--name-only$/,
	/^--name-status$/,
	/^--cached$/,
	/^--staged$/,
	/^--no-color$/,
	/^--color=never$/,
	/^--no-pager$/,
	/^--max-count=\d+$/,
	/^--max-count\s+\d+$/,
	/^--pretty=[a-zA-Z][\w.-]*$/,
	/^--first-parent$/,
	/^--no-merges$/,
	/^--abbrev-commit$/,
	/^--graph$/,
	/^--no-decorate$/,
	/^--all-match$/,
	/^--release$/,
	/^--noEmit$/,
	/^--check$/,
	/^--no-write$/,
	/^--no-fix$/,
	/^--isolated$/,
	/^--strict$/,
	/^--ignore$/,
	/^-n\s+\d+$/,
	/^-n\d+$/,
	/^-q$/,
	/^--quiet$/,
	/^-p$/,
	/^--patch$/,
];

const ARG_REV = /^[A-Fa-f0-9]{4,}$|^HEAD(~[0-9]+|\^[0-9]*)?$|^refs\/[\w./-]+$|^[\w.-]+\/[\w./-]+$/;
const ARG_PATH_REV = /^.{0,2}\/?[\w./-]+$/;
const ARG_FLAG_VALUE = /^--?[a-zA-Z][\w.-]*=[^ ]+$/;

function isSafeTailToken(token: string): boolean {
	if (OK_TRAILING_FLAGS.some((re) => re.test(token))) return true;
	if (ARG_REV.test(token)) return true;
	if (ARG_FLAG_VALUE.test(token)) return true;
	if (ARG_PATH_REV.test(token)) return true;
	return false;
}

function findDangerousFragment(cmd: string): string | undefined {
	for (const { label, pattern } of DANGEROUS_FRAGMENTS) {
		if (pattern.test(cmd)) return label;
	}
	return undefined;
}

/** Match the full head of the command against a globally-allowed head; remaining
 * tokens must each be a safe flag / revision / path / value. Any token outside
 * the safe list makes the command not globally-allowed. */
function matchesGlobalHead(cmd: string, head: string): boolean {
	const idx = cmd.indexOf(head);
	if (idx !== 0) return false;
	const rest = cmd.slice(head.length);
	if (rest === "") return true;
	if (rest[0] !== " ") return false; // mid-word, e.g. "git difftool"
	const tailTokens = rest.slice(1).trim().split(/\s+/);
	if (tailTokens.length === 0) return true;
	for (const t of tailTokens) {
		if (!isSafeTailToken(t)) return false;
	}
	return true;
}

/**
 * Decide whether `cmd` is acceptable under Fusion's Bash policy.
 * Order: dangerous-mode deny first (wins over allowlist), then
 * shell-metacharacter deny, then global allowlist, then trusted
 * project override (exact complete command match), then deny.
 *
 * Pure: takes `projectAllowed` so tests can drive it without FS.
 */
export function isSafeBash(
	cmd: string,
	options: { projectAllowed?: readonly string[] } = {},
): { ok: true } | { ok: false; reason: string } {
	const raw = String(cmd ?? "");
	const normalized = raw.trim();
	if (!normalized) return { ok: false, reason: "empty command" };
	if (SHELL_METACHARACTERS.test(normalized)) {
		return { ok: false, reason: "shell metacharacter (chaining / pipes / redirects / substitution / newline)" };
	}
	if (REDIRECT_TOKENS.test(normalized)) {
		return { ok: false, reason: "redirects are blocked" };
	}
	const dangerous = findDangerousFragment(normalized);
	if (dangerous) {
		return { ok: false, reason: `dangerous mode: ${dangerous}` };
	}
	for (const allow of GLOBAL_BASH_ALLOWLIST) {
		if (matchesGlobalHead(normalized, allow)) return { ok: true };
	}
	const projectAllowed = options.projectAllowed ?? [];
	for (const allow of projectAllowed) {
		if (normalized === allow) return { ok: true };
	}
	return { ok: false, reason: "not in global allowlist; trusted .pi/fusion.json override required" };
}

// --- project override (.pi/fusion.json) -----------------------------------

const PROJECT_CONFIG_FILENAME = "fusion.json";
const PROJECT_CONFIG_DIR = ".pi";

/** Load trusted-project exact-match Bash overrides. Returns [] when
 * the file is absent, the project is not trusted, the JSON is malformed,
 * or the schema is wrong. The parser is intentionally narrow — the only
 * schema is `{ allowedCommands: string[] }`. */
export function loadProjectBashOverride(
	cwd: string,
	options: { trusted: boolean; readFile?: (path: string) => string | undefined },
): string[] {
	if (!options.trusted) return [];
	const path = join(cwd, PROJECT_CONFIG_DIR, PROJECT_CONFIG_FILENAME);
	let raw: string | undefined;
	try {
		raw = options.readFile ? options.readFile(path) : readFileSync(path, "utf8");
	} catch {
		return [];
	}
	if (raw == null) return [];
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return [];
	}
	if (!parsed || typeof parsed !== "object") return [];
	const list = (parsed as Record<string, unknown>).allowedCommands;
	if (!Array.isArray(list)) return [];
	return list.filter((v): v is string => typeof v === "string" && v.length > 0);
}

// --- subagent interception -----------------------------------------------

/** Execution modes allowed by Fusion: scout / researcher / worker / reviewer. */
export const ALLOWED_EXECUTION_ROLES = new Set(["scout", "researcher", "worker", "reviewer"]);

/** Management actions that are read-only for the parent to keep using. */
export const ALLOWED_READ_ACTIONS = new Set([
	"list",
	"get",
	"models",
	"status",
	"doctor",
	"schedule-list",
	"schedule-status",
	"watchdog.status",
	"watchdog.check",
	"watchdog.recommend-model",
]);

/** Management actions that mutate agent definitions/models — blocked while active. */
export const BLOCKED_MUTATION_ACTIONS = new Set([
	"create",
	"update",
	"delete",
	"eject",
	"disable",
	"enable",
	"reset",
	"watchdog.configure",
	"grant-spawn-budget",
	"schedule", // schedule is execution-deferred; safer to keep session-local
]);

const ROLES_THAT_ALLOW_OUTPUT = new Set(["worker"]);

export interface SubagentCallArgs {
	agent?: string;
	task?: string;
	action?: string;
	tasks?: unknown[];
	chain?: unknown[];
	appendStep?: unknown[];
	output?: unknown;
	model?: unknown;
	context?: string;
	thinking?: unknown;
	[key: string]: unknown;
}

export interface NormalizedExecStep {
	agent: string;
	model?: string;
	thinking?: string | false;
	output?: unknown;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
	return !!v && typeof v === "object" && !Array.isArray(v);
}

function disallowedModelOrThinkingKeys(value: Record<string, unknown>): string[] {
	const out: string[] = [];
	for (const key of ["model", "thinking"]) {
		if (value[key] !== undefined) out.push(key);
	}
	return out;
}

function validateExecStep(step: unknown, path: string, errors: string[]): void {
	if (!isPlainObject(step)) {
		errors.push(`${path}: expected object`);
		return;
	}
	const agent = step.agent;
	if (typeof agent !== "string" || !ALLOWED_EXECUTION_ROLES.has(agent)) {
		errors.push(`${path}: agent must be one of scout|researcher|worker|reviewer (got ${JSON.stringify(agent)})`);
	}
	const offending = disallowedModelOrThinkingKeys(step);
	if (offending.length > 0) {
		errors.push(`${path}: ${offending.join(", ")} override(s) blocked; role models come from settings`);
	}
}

/**
 * Validate and normalize a new execution subagent call so it conforms
 * to Fusion:
 *   - execution role limited to scout/researcher/worker/reviewer
 *   - context forced to "fresh" (overrides caller fork)
 *   - model/thinking overrides stripped (settings is the source of truth)
 *   - output forced to false for non-worker roles
 *   - top-level model/thinking overrides stripped
 *
 * Returns either { block: true, reason } or { args: mutatedCopy,
 * contextForced, outputForced }. The mutation is also applied in place
 * when `mutate` is true so the caller can hand the result straight to
 * execute.
 */
export function validateAndNormalizeSubagentCall(
	argsIn: unknown,
	mutate = true,
): { ok: true; args: SubagentCallArgs; contextForced: boolean; outputForced: boolean } | { ok: false; reason: string } {
	if (!isPlainObject(argsIn)) {
		return { ok: false, reason: "subagent: argument must be an object" };
	}
	const args: SubagentCallArgs = { ...(argsIn as SubagentCallArgs) };

	// Management actions: allow read-only, block mutations, block
	// execution-shaped calls that fell through.
	if (typeof args.action === "string") {
		if (BLOCKED_MUTATION_ACTIONS.has(args.action)) {
			return { ok: false, reason: `subagent: action=${args.action} is blocked while Fusion is active (mutates agent definitions/models)` };
		}
		if (!ALLOWED_READ_ACTIONS.has(args.action)) {
			// unknown / not in the read-allowlist: reject conservatively
			return { ok: false, reason: `subagent: action=${args.action} is not in the read-only management allowlist while Fusion is active` };
		}
		// Read-only management action: no execution interception needed.
		// Strip top-level model/thinking for safety (settings owns them).
		delete (args as Record<string, unknown>).model;
		delete (args as Record<string, unknown>).thinking;
		return { ok: true, args, contextForced: false, outputForced: false };
	}

	let contextForced = false;
	let outputForced = false;
	const errors: string[] = [];

	// Top-level single execution
	if (typeof args.agent === "string") {
		validateExecStep(args as Record<string, unknown>, "agent", errors);
		if (!ROLES_THAT_ALLOW_OUTPUT.has(args.agent)) {
			if (args.output !== undefined) {
				delete (args as Record<string, unknown>).output;
				outputForced = true;
			}
		}
	}

	// Top-level parallel tasks
	if (Array.isArray(args.tasks)) {
		(args.tasks as unknown[]).forEach((t, idx) => {
			if (!isPlainObject(t)) {
				errors.push(`tasks[${idx}]: expected object`);
				return;
			}
			validateExecStep(t, `tasks[${idx}]`, errors);
			const agentVal = t.agent;
			if (typeof agentVal !== "string" || !ROLES_THAT_ALLOW_OUTPUT.has(agentVal)) {
				if (t.output !== undefined) {
					delete (t as Record<string, unknown>).output;
					outputForced = true;
				}
			}
		});
	}

	// Recursive chain walk (only arrays of chain steps carry execution)
	if (Array.isArray(args.chain)) {
		walkChain(args.chain as unknown[], "chain", errors);
	}

	// append-step: also execution; same rules
	if (Array.isArray(args.appendStep)) {
		walkChain(args.appendStep as unknown[], "appendStep", errors);
	}

	if (errors.length > 0) {
		return { ok: false, reason: "subagent validation failed:\n  - " + errors.join("\n  - ") };
	}

	if (args.context !== "fresh") {
		args.context = "fresh";
		contextForced = true;
	}

	// Force output:false for any single execution that wasn't worker
	if (typeof args.agent === "string" && !ROLES_THAT_ALLOW_OUTPUT.has(args.agent) && args.output === undefined) {
		args.output = false;
		outputForced = true;
	}

	// Strip top-level overrides
	if ("model" in args) {
		delete (args as Record<string, unknown>).model;
	}
	if ("thinking" in args) {
		delete (args as Record<string, unknown>).thinking;
	}

	if (mutate) {
		Object.assign(argsIn as Record<string, unknown>, args);
	}
	return { ok: true, args, contextForced, outputForced };
}

function walkChain(steps: unknown[], path: string, errors: string[]): void {
	steps.forEach((step, idx) => {
		const stepPath = `${path}[${idx}]`;
		if (!isPlainObject(step)) {
			errors.push(`${stepPath}: expected object`);
			return;
		}
		// chain steps can have either an `agent` (sequential) or a
		// `parallel` array (static parallel) or both (`expand`+`parallel`).
		if (step.agent !== undefined) {
			validateExecStep(step, `${stepPath}`, errors);
			const agentVal = step.agent;
			if (typeof agentVal !== "string" || !ROLES_THAT_ALLOW_OUTPUT.has(agentVal)) {
				if (step.output !== undefined) {
					delete (step as Record<string, unknown>).output;
				}
			}
		}
		const parallel = step.parallel;
		if (Array.isArray(parallel)) {
			parallel.forEach((task, pIdx) => {
				if (!isPlainObject(task)) {
					errors.push(`${stepPath}.parallel[${pIdx}]: expected object`);
					return;
				}
				validateExecStep(task, `${stepPath}.parallel[${pIdx}]`, errors);
				const agentVal = task.agent;
				if (typeof agentVal !== "string" || !ROLES_THAT_ALLOW_OUTPUT.has(agentVal)) {
					if (task.output !== undefined) {
						delete (task as Record<string, unknown>).output;
					}
				}
			});
		}
	});
}

// --- session-state restore ------------------------------------------------

export function readLatestFusionState(entries: unknown[]): FusionState | undefined {
	if (!Array.isArray(entries)) return undefined;
	for (let i = entries.length - 1; i >= 0; i--) {
		const e = entries[i] as { type?: string; customType?: string; data?: unknown };
		if (!e || e.type !== "custom" || e.customType !== FUSION_STATE_CUSTOM) continue;
		const data = e.data;
		if (!data || typeof data !== "object") continue;
		const enabled = (data as Record<string, unknown>).enabled;
		if (enabled === true || enabled === false) {
			const tools = (data as Record<string, unknown>).toolsBeforeFusion;
			return {
				enabled,
				toolsBeforeFusion: Array.isArray(tools) ? (tools.filter((v): v is string => typeof v === "string")) : undefined,
			};
		}
	}
	return undefined;
}

// --- workflow guidance injected by Fusion --------------------------------

export const FUSION_GUIDANCE_HEADER = "[FUSION MODE ACTIVE]";
export const FUSION_GUIDANCE_BODY = [
	"You are the parent in Fusion orchestration. The parent tool surface is",
	"intentionally small: read, bash (restricted), lsp_diagnostics, subagent,",
	"subagent_wait, subagent_supervisor, todo, advisor (exception only). Discovery",
	"and execution go through children.",
	"",
	"Roles and defaults:",
	"- scout (minimax/MiniMax-M3, low): pre-work code discovery. Read-only.",
	"- researcher (deepseek/deepseek-v4-flash, medium): current external facts.",
	"  Read-only.",
	"- worker (minimax/MiniMax-M3, low): the single writer in a cwd. Receives",
	"  Objective / Files / Interfaces / Constraints / Verification.",
	"- reviewer (deepseek/deepseek-v4-flash, low): risk-based review only",
	"  (security, auth, migrations, public APIs, data loss, substantial logic).",
	"  Read-only — no bash; the parent verifies.",
	"",
	"Worker delegation contract: every worker delegation MUST carry all five:",
	"1. Objective — one sentence; what success looks like.",
	"2. Files — exact paths the worker may read and may write.",
	"3. Interfaces — schemas, types, function signatures.",
	"4. Constraints — what to avoid, what 'smallest correct change' means here.",
	"5. Verification — the deterministic check the parent will run after.",
	"",
	"Retry ladder (no blind loops, no model switching):",
	"1. First miss: resume the same persisted worker session with precise correction.",
	"2. Second miss: parent supplies the exact verbatim patch; worker applies it.",
	"3. Dictated patch still fails: stop retrying and revise the parent's plan.",
	"",
	"One writer per cwd. Parallel writers require isolated git worktrees.",
	"",
	"Use advisor() only when stuck, when errors keep recurring, when evidence",
	"is conflicting, or when about to change approach or take an unusually",
	"risky decision. Don't pre-call it.",
].join("\n");
export const FUSION_GUIDANCE_FULL = `${FUSION_GUIDANCE_HEADER}\n${FUSION_GUIDANCE_BODY}\n`;

// --- extension entry point -----------------------------------------------

export default function fusionExtension(pi: ExtensionAPI): void {
	// Child processes: do nothing. The child has its own tool surface
	// from settings.json agentOverrides; Fusion's parent-only rules are
	// never applied inside the child.
	if (isChildProcess()) return;

	let enabled = false;
	let toolsBeforeFusion: string[] | undefined;

	// Cached at session_start; user keeps it as a single source of
	// truth for "what would non-Fusion look like?" — but we ALWAYS read
	// the live tools array at apply time anyway (a tool registered
	// later cannot leak into the Fusion set).
	const defaultFromConfig = readGlobalDefaultMode();

	pi.registerFlag("fusion", {
		description: "Start the session in Fusion mode",
		type: "boolean",
		default: false,
	});

	// --- commands --------------------------------------------------------

	pi.registerCommand("fusion", {
		description: "Fusion mode controls: /fusion on | off | status | default on|off",
		handler: async (args, ctx) => {
			const trimmed = String(args ?? "").trim().toLowerCase();
			if (trimmed === "" || trimmed === "status") {
				if (ctx.hasUI) {
					ctx.ui.notify(
						`fusion: ${enabled ? "on" : "off"} (default: ${defaultFromConfig ?? "off"})`,
						"info",
					);
				}
				return;
			}
			if (trimmed === "on" || trimmed === "off") {
				setEnabled(trimmed === "on", ctx);
				return;
			}
			if (trimmed.startsWith("default")) {
				const rest = trimmed.replace(/^default\s+/, "").trim();
				if (rest === "on" || rest === "off") {
					const ok = writeGlobalDefaultMode(rest);
					if (ctx.hasUI) {
						ctx.ui.notify(
							ok
								? `fusion: global default = ${rest}`
								: `fusion: failed to write ${globalConfigPath()}`,
							ok ? "info" : "error",
						);
					}
					return;
				}
				if (ctx.hasUI) ctx.ui.notify("fusion default: use `on` or `off`", "error");
				return;
			}
			if (ctx.hasUI) ctx.ui.notify("fusion: unknown args — try `on`, `off`, `status`, `default on|off`", "error");
		},
	});

	function persistState(): void {
		pi.appendEntry(FUSION_STATE_CUSTOM, {
			enabled,
			toolsBeforeFusion,
		});
	}

	function setEnabled(next: boolean, ctx: ExtensionContext): void {
		if (next === enabled) return;
		enabled = next;
		if (enabled) {
			// Snapshot only on the rising edge; on the falling edge we
			// restore the earlier snapshot directly.
			if (toolsBeforeFusion === undefined) {
				toolsBeforeFusion = pi.getActiveTools();
			}
		}
		applyNow(ctx);
		persistState();
		if (ctx.hasUI) {
			ctx.ui.notify(
				enabled ? "Fusion on (parent tool surface shrunk)" : "Fusion off (tools restored)",
				"info",
			)
		}
	}

	function applyNow(ctx: ExtensionContext): void {
		if (enabled) {
			applyParentAllowlist(pi);
		} else if (toolsBeforeFusion !== undefined) {
			pi.setActiveTools(toolsBeforeFusion);
			toolsBeforeFusion = undefined;
		}
		ctx.ui.setStatus("fusion", enabled ? ctx.ui.theme.fg("warning", "fusion") : undefined);
	}

	// --- session_start: restore state + apply -----------------------------

	pi.on("session_start", async (event, ctx) => {
		// Precedence: latest fusion-state entry > --fusion > global default > off.
		const entries = ctx.sessionManager.getEntries();
		const persisted = readLatestFusionState(entries);
		if (persisted) {
			enabled = persisted.enabled;
			toolsBeforeFusion = persisted.toolsBeforeFusion;
		} else if (pi.getFlag("fusion") === true) {
			enabled = true;
		} else if (defaultFromConfig === MODE_ON) {
			enabled = true;
		}
		// On enable for the first time, snapshot the pre-Fusion tools.
		if (enabled && toolsBeforeFusion === undefined) {
			toolsBeforeFusion = pi.getActiveTools();
		}
		applyNow(ctx);
	});

	// --- before_agent_start: ensure allowlist is current every turn -----

	pi.on("before_agent_start", async (_event, ctx) => {
		if (!enabled) return;
		// Reapply so any tool registered LATER cannot leak into the
		// Fusion parent surface (defensive — pi.setActiveTools is
		// authoritative).
		const active = pi.getActiveTools();
		const wanted = parentToolAllowlist();
		const filtered = active.filter((t) => wanted.includes(t));
		if (filtered.length !== active.length || filtered.length !== wanted.length) {
			pi.setActiveTools(wanted);
		}
		// Inject guidance every turn so /resume doesn't lose it.
		return {
			message: {
				customType: "fusion-guidance",
				content: FUSION_GUIDANCE_FULL,
				display: false,
			},
		};
	});

	// --- bash tool_call: gate exact policy -------------------------------

	pi.on("tool_call", async (event, ctx) => {
		if (!enabled) return;
		const toolName = event && (event as { toolName?: string }).toolName;
		if (toolName !== "bash") return;
		const input = (event as { input?: unknown }).input;
		const command = input && typeof input === "object" && "command" in input
			? String((input as Record<string, unknown>).command ?? "")
			: "";
		const projectAllowed = loadProjectBashOverride(
			ctx.cwd,
			{ trusted: !!ctx.isProjectTrusted && ctx.isProjectTrusted() },
		);
		const verdict = isSafeBash(command, { projectAllowed });
		if (!verdict.ok) {
			return { block: true, reason: `fusion bash policy: ${verdict.reason}. Add an exact-match entry to .pi/fusion.json if this is a legit project-level command.` };
		}
	});

	// --- subagent tool_call: gate role/context/output/model --------------

	pi.on("tool_call", async (event, ctx) => {
		if (!enabled) return;
		const toolName = event && (event as { toolName?: string }).toolName;
		if (toolName !== "subagent") return;
		const input = (event as { input?: unknown }).input;
		if (!input || typeof input !== "object") return;
		const verdict = validateAndNormalizeSubagentCall(input, true);
		if (!verdict.ok) {
			return { block: true, reason: verdict.reason };
		}
		// Surface the context-flip / output-flip in the TUI so the user
		// can see when Fusion coerced their call. Non-UI runs are
		// silent — no notify channel available.
		if (ctx.hasUI && (verdict.contextForced || verdict.outputForced)) {
			const bits: string[] = [];
			if (verdict.contextForced) bits.push("context→fresh");
			if (verdict.outputForced) bits.push("output→false");
			ctx.ui.notify(`fusion coerced subagent: ${bits.join(", ")}`, "info");
		}
	});
}
