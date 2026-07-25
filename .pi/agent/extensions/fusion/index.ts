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

export function isChildProcess(
	env: Record<string, string | undefined> | NodeJS.ProcessEnv = process.env,
): boolean {
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
export function readGlobalDefaultMode(
	path: string = globalConfigPath(),
): FusionMode | undefined {
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
export function writeGlobalDefaultMode(
	mode: FusionMode,
	path: string = globalConfigPath(),
): boolean {
	const current = readGlobalDefaultMode(path);
	if (current === mode) return true;
	const dir = dirname(path);
	try {
		mkdirSync(dir, { recursive: true });
	} catch {
		return false;
	}
	try {
		writeFileSync(path, JSON.stringify({ defaultMode: mode }, null, 2) + "\n", {
			mode: 0o600,
		});
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

export type ParentAllowedTool = (typeof PARENT_ALLOWED_TOOLS)[number];

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
export function applyParentAllowlist(
	pi: { getActiveTools: () => string[]; setActiveTools: (n: string[]) => void },
	extras: readonly string[] = [],
): void {
	pi.setActiveTools(parentToolAllowlist(extras));
}

// --- bash policy ---------------------------------------------------------

// Globally-allowed verification / Git commands. Conservative by design;
// project-specific oddities go in trusted .pi/fusion.json. Each entry
// matches an EXACT complete command substring (anchored-or-end). Only
// reads and deterministic verification are allowed at the global level;
// project overrides must be exact complete command strings — no regex,
// no prefix matching, no shell wrappers.
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
	{
		label: "package install/update/publish",
		pattern:
			/\b(npm|pnpm|yarn)\s+(install|i|add|update|upgrade|global|publish|uninstall|remove)\b/,
	},
	{
		label: "pip / uv install",
		pattern: /\b(pip|uv|pipx)\s+(install|uninstall)\b/,
	},
	{ label: "cargo install", pattern: /\bcargo\s+install\b/ },
	{
		label: "formatter fix mode",
		pattern:
			/\b(prettier|biome|black|autopep8|gofmt|gofmt-s|standardjs|standard)\s+.*--write\b/,
	},
	{
		label: "formatter fix flag",
		pattern: /\b(prettier|biome|black|autopep8|standardjs|standard)\s+-w\b/,
	},
	{ label: "eslint fix mode", pattern: /\beslint\s+.*--fix\b/ },
	{ label: "ruff fix mode", pattern: /\bruff\s+check\s+.*--fix\b/ },
	{
		label: "snapshot update",
		pattern: /\b(snapshots?|snap)\s+(update|u|--update|-u)\b/,
	},
	{ label: "jest snapshot update", pattern: /\bjest\s+.*-u\b/ },
	{ label: "vitest snapshot update", pattern: /\bvitest\s+.*-u\b/ },
	{
		label: "mutating git command",
		pattern:
			/\bgit\s+(commit|checkout|reset|revert|merge|rebase|push|pull|fetch|clone|stash|branch|tag|cherry-pick|switch|restore|rm|mv|clean|am)\b/,
	},
	{
		label: "git write-to-file",
		pattern: /\bgit\s+(config\s+--global\s+--replace|log\s+.*>|show\s+.*>\s)/,
	},
	{ label: "tee / output redirect", pattern: /\b(tee|cat\s+.*>)\b/ },
	{
		label: "unrestricted interpreter",
		pattern:
			/^\s*(bash|sh|zsh|ksh|fish|python|python3|node|nodejs|ruby|perl|lua|pwsh|powershell)\s*$/,
	},
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
	/^--max-count$/,
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
	/^-n$/,
	/^-n\d+$/,
	/^-q$/,
	/^--quiet$/,
	/^-p$/,
	/^--patch$/,
];

const ARG_REV =
	/^[A-Fa-f0-9]{4,}$|^HEAD(~[0-9]+|\^[0-9]*)?$|^refs\/[\w./-]+$|^[\w.-]+\/[\w./-]+$/;
const ARG_PATH_REV = /^(?:\.{1,2}\/|\/)?[\w.][\w./-]*\/?$/;

function isSafeTailToken(token: string): boolean {
	// Only explicitly listed flags/revs/paths pass. Generic --name=value
	// is NOT accepted — every flag must be in OK_TRAILING_FLAGS so the
	// per-command surface stays small and auditable.
	if (OK_TRAILING_FLAGS.some((re) => re.test(token))) return true;
	if (ARG_REV.test(token)) return true;
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
 * Order: dangerous-mode deny first (wins over every allowlist), then
 * shell-metacharacter deny, then redirect deny, then global allowlist,
 * then trusted project override (exact complete command match), then deny.
 *
 * Dangerous-mode denies ALWAYS win — a command like `npm install` is
 * rejected even if it would otherwise match the global `npm run` head
 * or a project override. Same for project overrides.
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
	// Dangerous-mode deny FIRST: package install/update/publish, fix
	// modes, mutating Git, etc. always lose — even if a project override
	// would otherwise grant them. This is the settled Fusion precedence.
	const dangerous = findDangerousFragment(normalized);
	if (dangerous) {
		return { ok: false, reason: `dangerous mode: ${dangerous}` };
	}
	if (SHELL_METACHARACTERS.test(normalized)) {
		return {
			ok: false,
			reason:
				"shell metacharacter (chaining / pipes / redirects / substitution / newline)",
		};
	}
	if (REDIRECT_TOKENS.test(normalized)) {
		return { ok: false, reason: "redirects are blocked" };
	}
	for (const allow of GLOBAL_BASH_ALLOWLIST) {
		if (matchesGlobalHead(normalized, allow)) return { ok: true };
	}
	const projectAllowed = options.projectAllowed ?? [];
	for (const allow of projectAllowed) {
		if (normalized === allow) return { ok: true };
	}
	return {
		ok: false,
		reason:
			"not in global allowlist; trusted .pi/fusion.json override required",
	};
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
	options: {
		trusted: boolean;
		readFile?: (path: string) => string | undefined;
	},
): string[] {
	if (!options.trusted) return [];
	const path = join(cwd, PROJECT_CONFIG_DIR, PROJECT_CONFIG_FILENAME);
	let raw: string | undefined;
	try {
		raw = options.readFile
			? options.readFile(path)
			: readFileSync(path, "utf8");
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
export const ALLOWED_EXECUTION_ROLES = new Set([
	"scout",
	"researcher",
	"worker",
	"reviewer",
]);

/** Read-only management actions the parent can keep using while Fusion is active. */
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

/** Async-control actions on existing children. These operate on a run by id
 * (or runId) and never spawn new execution. They are NOT management; they
 * are control operations and Fusion allows them so the parent can steer
 * / pause / stop / revive children it already started. */
export const ALLOWED_CONTROL_ACTIONS = new Set([
	"interrupt",
	"stop",
	"resume",
	"steer",
]);

/** append-step is execution-shaped: it appends a chain step to a running
 * run. Special-cased before the generic management rejection so its
 * chain:[...] is validated by the same execution rules (role + context
 * + output + model-pinning). */
export const APPEND_STEP_ACTION = "append-step";

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
	"schedule-cancel",
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

/** Deep clone via JSON round-trip. The subagent input is a plain JSON
 * object that already has to pass through the runtime serializer, so
 * `JSON.parse(JSON.stringify(x))` is the correct tool here. Tests rely
 * on this to assert that `mutate=false` never touches nested fields. */
function deepClone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

function disallowedModelOrThinkingKeys(
	value: Record<string, unknown>,
): string[] {
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
		errors.push(
			`${path}: agent must be one of scout|researcher|worker|reviewer (got ${JSON.stringify(agent)})`,
		);
	}
	const offending = disallowedModelOrThinkingKeys(step);
	if (offending.length > 0) {
		errors.push(
			`${path}: ${offending.join(", ")} override(s) blocked; role models come from settings`,
		);
	}
}

/** Validate a chain `parallel` value: either an ARRAY of static parallel
 * tasks, or ONE object (dynamic parallel template). Returns the validated
 * parallel in place via the same recursion rules. */
function normalizeParallel(
	parallel: unknown,
	path: string,
	errors: string[],
	outputForcedRef: { value: boolean },
): void {
	if (Array.isArray(parallel)) {
		parallel.forEach((task, pIdx) => {
			if (!isPlainObject(task)) {
				errors.push(`${path}[${pIdx}]: expected object`);
				return;
			}
			validateExecStep(task, `${path}[${pIdx}]`, errors);
			if (shouldForceOutputFalse(task)) {
				task.output = false;
				outputForcedRef.value = true;
			}
		});
		return;
	}
	if (isPlainObject(parallel)) {
		// Single dynamic parallel template object.
		validateExecStep(parallel, path, errors);
		if (shouldForceOutputFalse(parallel)) {
			parallel.output = false;
			outputForcedRef.value = true;
		}
		return;
	}
	errors.push(`${path}: expected array or single dynamic template object`);
}

/** True when this step's role is not worker AND output is undefined or a
 * string. Workers are the only role that may keep `output: "..."`; every
 * other role (and any unset role) must end with `output: false` so the
 * built-in context.md / research.md files never land in a project root. */
function shouldForceOutputFalse(step: Record<string, unknown>): boolean {
	const agent = step.agent;
	if (typeof agent === "string" && ROLES_THAT_ALLOW_OUTPUT.has(agent)) {
		return false;
	}
	return true;
}

/**
 * Validate and normalize a subagent call so it conforms to Fusion:
 *   - execution role limited to scout/researcher/worker/reviewer
 *   - context forced to "fresh" (overrides caller fork)
 *   - model/thinking overrides stripped (settings is the source of truth)
 *   - output forced to false for non-worker roles at every nesting level
 *   - chain parallel can be an array OR one dynamic template object
 *   - allowed control actions: interrupt, stop, resume, steer
 *   - append-step (action='append-step', id/runId, chain:[...]) is
 *     execution-shaped and validated as such
 *   - read-only management actions may pass; mutations are blocked
 *
 * Returns either { ok: false, reason } or { ok: true, args, contextForced,
 * outputForced }. When mutate=true, the original input is also updated
 * in place so the caller can hand `argsIn` directly to execute.
 */
export function validateAndNormalizeSubagentCall(
	argsIn: unknown,
	mutate = true,
):
	| {
			ok: true;
			args: SubagentCallArgs;
			contextForced: boolean;
			outputForced: boolean;
	  }
	| { ok: false; reason: string } {
	if (!isPlainObject(argsIn)) {
		return { ok: false, reason: "subagent: argument must be an object" };
	}

	// Action branches: the call has a top-level action. Resolve whether
	// it is allowed (read-only / control), execution-shaped (append-step),
	// or mutation (blocked).
	if (typeof (argsIn as Record<string, unknown>).action === "string") {
		const action = (argsIn as Record<string, unknown>).action as string;

		// 1. Mutation actions: hard-block.
		if (BLOCKED_MUTATION_ACTIONS.has(action)) {
			return {
				ok: false,
				reason: `subagent: action=${action} is blocked while Fusion is active (mutates agent definitions/models)`,
			};
		}

		// 2. append-step: execution-shaped — its chain:[one step] is validated
		// using the same execution rules. top-level model/thinking are
		// REJECTED (settings is the source of truth, same as execution).
		// Per the schema, append-step carries exactly one chain step.
		if (action === APPEND_STEP_ACTION) {
			const a = argsIn as Record<string, unknown>;
			// append-step is execution → reject top-level model/thinking.
			const topOffenders = disallowedModelOrThinkingKeys(a);
			if (topOffenders.length > 0) {
				return {
					ok: false,
					reason: `subagent: action=append-step rejects top-level ${topOffenders.join(", ")} override(s); role models come from settings`,
				};
			}
			if (typeof a.id !== "string" && typeof a.runId !== "string") {
				return {
					ok: false,
					reason: `subagent: action=append-step requires id or runId (target run)`,
				};
			}
			if (!Array.isArray(a.chain)) {
				return {
					ok: false,
					reason: `subagent: action=append-step requires chain: [...]`,
				};
			}
			if (a.chain.length !== 1) {
				return {
					ok: false,
					reason: `subagent: action=append-step requires exactly one chain step (got ${a.chain.length})`,
				};
			}
			const errors: string[] = [];
			const outRef = { value: false };
			// Walk via a deep copy when mutate=false so the caller's input
			// is never mutated (we don't strip — we rejected top-level).
			const chainCopy = mutate ? (a.chain as unknown[]) : deepClone(a.chain);
			walkChain(chainCopy, "chain", errors, outRef);
			if (errors.length > 0) {
				return {
					ok: false,
					reason: "subagent validation failed:\n  - " + errors.join("\n  - "),
				};
			}
			const normalized: Record<string, unknown> = mutate ? a : deepClone(a);
			normalized.chain = chainCopy;
			// Settings owns models → strip top-level model/thinking from
			// the normalized copy (mutate=false path also gets a clean copy).
			delete normalized.model;
			delete normalized.thinking;
			return {
				ok: true,
				args: normalized as SubagentCallArgs,
				contextForced: false,
				outputForced: outRef.value,
			};
		}

		// 3. Async-control actions: interrupt / stop / resume / steer.
		// These target an existing run by id/runId and never spawn new
		// execution. They are allowed while Fusion is active.
		if (ALLOWED_CONTROL_ACTIONS.has(action)) {
			// Always return a normalized copy with model/thinking stripped
			// (settings owns them). mutate=true also removes them from the
			// original input; mutate=false leaves the original untouched.
			if (mutate) {
				delete (argsIn as Record<string, unknown>).model;
				delete (argsIn as Record<string, unknown>).thinking;
			}
			const args: SubagentCallArgs = {
				...(argsIn as SubagentCallArgs),
			};
			delete (args as Record<string, unknown>).model;
			delete (args as Record<string, unknown>).thinking;
			return { ok: true, args, contextForced: false, outputForced: false };
		}

		// 4. Read-only management actions.
		if (ALLOWED_READ_ACTIONS.has(action)) {
			if (mutate) {
				delete (argsIn as Record<string, unknown>).model;
				delete (argsIn as Record<string, unknown>).thinking;
			}
			const args: SubagentCallArgs = {
				...(argsIn as SubagentCallArgs),
			};
			delete (args as Record<string, unknown>).model;
			delete (args as Record<string, unknown>).thinking;
			return { ok: true, args, contextForced: false, outputForced: false };
		}

		// 5. Unknown / non-allowed action: reject conservatively.
		return {
			ok: false,
			reason: `subagent: action=${action} is not in the allowed management/control set while Fusion is active (allowed: ${[
				...(ALLOWED_READ_ACTIONS as Set<string>),
				...(ALLOWED_CONTROL_ACTIONS as Set<string>),
				APPEND_STEP_ACTION,
			].join(", ")})`,
		};
	}

	// --- execution branches (no top-level action) ---------------------

	// Use a deep copy when mutate=false so the caller's nested
	// tasks[] / chain[] / parallel[] are never mutated by normalization
	// (output coercion, context forcing, model/thinking stripping).
	const working = mutate
		? (argsIn as Record<string, unknown>)
		: deepClone(argsIn);
	const args: SubagentCallArgs = working as SubagentCallArgs;
	let contextForced = false;
	const outputForcedRef = { value: false };
	const errors: string[] = [];

	// Top-level single execution
	if (typeof args.agent === "string") {
		validateExecStep(args as Record<string, unknown>, "agent", errors);
		if (shouldForceOutputFalse(args as Record<string, unknown>)) {
			if (args.output !== false) {
				args.output = false;
				outputForcedRef.value = true;
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
			if (shouldForceOutputFalse(t)) {
				if (t.output !== false) {
					t.output = false;
					outputForcedRef.value = true;
				}
			}
		});
	}

	// Recursive chain walk
	if (Array.isArray(args.chain)) {
		walkChain(args.chain as unknown[], "chain", errors, outputForcedRef);
	}

	// append-step (legacy top-level field, not under action)
	if (Array.isArray(args.appendStep)) {
		walkChain(
			args.appendStep as unknown[],
			"appendStep",
			errors,
			outputForcedRef,
		);
	}

	if (errors.length > 0) {
		return {
			ok: false,
			reason: "subagent validation failed:\n  - " + errors.join("\n  - "),
		};
	}

	if (args.context !== "fresh") {
		args.context = "fresh";
		contextForced = true;
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
	return {
		ok: true,
		args,
		contextForced,
		outputForced: outputForcedRef.value,
	};
}

function walkChain(
	steps: unknown[],
	path: string,
	errors: string[],
	outputForcedRef: { value: boolean },
): void {
	steps.forEach((step, idx) => {
		const stepPath = `${path}[${idx}]`;
		if (!isPlainObject(step)) {
			errors.push(`${stepPath}: expected object`);
			return;
		}
		// Sequential step carries agent + task.
		if (step.agent !== undefined) {
			validateExecStep(step, stepPath, errors);
			if (shouldForceOutputFalse(step)) {
				if (step.output !== false) {
					step.output = false;
					outputForcedRef.value = true;
				}
			}
		}
		// parallel can be an ARRAY (static) or ONE object (dynamic template).
		if (step.parallel !== undefined) {
			normalizeParallel(
				step.parallel,
				`${stepPath}.parallel`,
				errors,
				outputForcedRef,
			);
		}
	});
}

// --- session-state restore ------------------------------------------------

export function readLatestFusionState(
	entries: unknown[],
): FusionState | undefined {
	if (!Array.isArray(entries)) return undefined;
	for (let i = entries.length - 1; i >= 0; i--) {
		const e = entries[i] as {
			type?: string;
			customType?: string;
			data?: unknown;
		};
		if (!e || e.type !== "custom" || e.customType !== FUSION_STATE_CUSTOM)
			continue;
		const data = e.data;
		if (!data || typeof data !== "object") continue;
		const enabled = (data as Record<string, unknown>).enabled;
		if (enabled === true || enabled === false) {
			// Wholesale reject a corrupt snapshot: every entry must be a
			// non-empty string and the array must be non-empty. We do NOT
			// return a partial subset — a partial subset silently disabled
			// tools in earlier revisions. Returns undefined for tools so
			// the caller falls through to the default-on path.
			const tools = (data as Record<string, unknown>).toolsBeforeFusion;
			let cleanTools: string[] | undefined;
			if (Array.isArray(tools)) {
				const allValid =
					tools.length > 0 &&
					(tools as unknown[]).every(
						(v) => typeof v === "string" && v.length > 0,
					);
				cleanTools = allValid ? (tools as string[]) : undefined;
			}
			return { enabled, toolsBeforeFusion: cleanTools };
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
	"Role models and thinking levels are configured in `settings.json` `subagents.agentOverrides`; this extension never hardcodes them.",
	"",
	"Roles and defaults:",
	"",
	"- scout: pre-work code discovery. Read-only.",
	"- researcher: current external facts. Read-only.",
	"- worker: the single writer in a cwd. Receives Objective / Files / Interfaces / Constraints / Verification.",
	"- reviewer: risk-based review only (security, auth, migrations, public APIs, data loss, substantial logic). Read-only — no bash; the parent verifies.",
	"",
	"Session-efficiency rules:",
	"- no duplicate parent discovery: parent never redoes discovery scout already produced.",
	"- scout repo-only and worker for remote operations: scout reads the repo only; external facts and remote operations flow through researcher/worker, never through the parent.",
	"- stop after first Bash-policy block or known role-config failure: a deny is a deny; parent does not retry around it.",
	"- bounded child budgets: every delegation carries a verifiable scope/budget up front.",
	"- return control for long async: parent returns with status, never blocks on long children.",
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
		description:
			"Fusion mode controls: /fusion on | off | status | default on|off",
		handler: async (args, ctx) => {
			const trimmed = String(args ?? "")
				.trim()
				.toLowerCase();
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
				if (ctx.hasUI)
					ctx.ui.notify("fusion default: use `on` or `off`", "error");
				return;
			}
			if (ctx.hasUI)
				ctx.ui.notify(
					"fusion: unknown args — try `on`, `off`, `status`, `default on|off`",
					"error",
				);
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
				enabled
					? "Fusion on (parent tool surface shrunk)"
					: "Fusion off (tools restored)",
				"info",
			);
		}
	}

	function applyNow(ctx: ExtensionContext): void {
		if (enabled) {
			applyParentAllowlist(pi);
		} else if (toolsBeforeFusion !== undefined) {
			pi.setActiveTools(toolsBeforeFusion);
			toolsBeforeFusion = undefined;
		}
		ctx.ui.setStatus(
			"fusion",
			enabled ? ctx.ui.theme.fg("warning", "fusion") : undefined,
		);
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
		if (
			filtered.length !== active.length ||
			filtered.length !== wanted.length
		) {
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
		const command =
			input && typeof input === "object" && "command" in input
				? String((input as Record<string, unknown>).command ?? "")
				: "";
		const projectAllowed = loadProjectBashOverride(ctx.cwd, {
			trusted: !!ctx.isProjectTrusted && ctx.isProjectTrusted(),
		});
		const verdict = isSafeBash(command, { projectAllowed });
		if (!verdict.ok) {
			return {
				block: true,
				reason: `fusion bash policy: ${verdict.reason}. Add an exact-match entry to .pi/fusion.json if this is a legit project-level command.`,
			};
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
