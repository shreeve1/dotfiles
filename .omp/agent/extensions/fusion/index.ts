/**
 * fusion — opt-in omp orchestration mode.
 *
 * Shrinks the orchestrator's tool surface so it owns intent / architecture /
 * spec / diff review / verification, while cheap fresh-context children do
 * discovery (scout), external facts (librarian/researcher), file mutations
 * (task/worker), and risk-based review (reviewer). See docs/adr/0006-omp-fusion.md
 * in this dotfiles repo.
 *
 * --- Hardcoded fallback is OFF ---
 *   No session loaded: off
 *   No --fusion flag: off
 *   No repo-tracked default-on config: off
 *
 *   On this machine the repo-tracked default at
 *   <repo>/.omp/agent/fusion.json ({"defaultMode": "on"}) flips the default
 *   to on; the file lives inside the dotfiles repo so `git pull` reproduces
 *   the orchestration default on every machine with no local setup.
 *
 * --- In-process children are unaffected ---
 *   omp runs child subagents in-process via createAgentSession; every
 *   session re-imports this extension module with a fresh module instance
 *   (verified: legacy-pi-compat.ts nextLegacyPiLoadTag/mtime= re-import).
 *   The first session to claim the orchestrator role writes its session id
 *   into process.env[OMP_FUSION_ORCHESTRATOR_SID]; every later in-process
 *   module instance sees a different session id and self-disables. This
 *   replaces pi's PI_SUBAGENT_CHILD=1 env claim — children share the parent
 *   PID/env, so the previous mechanism was insufficient there too.
 *
 * --- Persistence ---
 *   /fusion on|off writes a custom session entry (customType "fusion-state").
 *   On session resume the latest such entry is the truth, ahead of CLI flag
 *   and repo default. omp's CustomEntry shape matches pi: { type: "custom",
 *   customType, data } (session-entries.d.ts:130).
 *
 * --- Tool interception ---
 *   At every before_agent_start while active, exact-allowlist the
 *   orchestrator tools. Withholding bash/edit/write is the entire
 *   enforcement; there is no per-call gate.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type {
	ExtensionAPI,
	ExtensionContext,
} from "@oh-my-pi/pi-coding-agent";

// --- orchestrator tool allowlist -----------------------------------------

export const ORCHESTRATOR_ALLOWED_TOOLS = ["read", "task", "todo", "hub"] as const;

// --- child detection (in-process) ----------------------------------------

const CLAIM_ENV = "OMP_FUSION_ORCHESTRATOR_SID";

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

// --- repo-tracked default config -----------------------------------------

/**
 * Resolve the repo-tracked default config path:
 *   <repo>/.omp/agent/fusion.json
 *
 * The extension lives at <repo>/.omp/agent/extensions/fusion/index.ts;
 * `import.meta.dir` is the file's own directory (verified symlink-resolved
 * under omp's Bun loader at legacy-pi-compat.ts), so ../.. lands on
 * <repo>/.omp/agent. Because ~/.omp/agent -> <repo>/.omp/agent, this
 * resolves to the tracked file on disk regardless of where omp was
 * launched.
 */
export function repoFusionJsonPath(): string {
	const meta: { dir?: unknown; url?: unknown } =
		(import.meta as { dir?: unknown; url?: unknown }) ?? {};
	const fromDir =
		typeof meta.dir === "string" && meta.dir.length > 0 ? meta.dir : undefined;
	const dir =
		fromDir ??
		(typeof meta.url === "string"
			? dirname(dirname(new URL(".", meta.url).pathname))
			: undefined);
	if (!dir) {
		throw new Error("omp fusion: cannot resolve extension directory");
	}
	return join(dir, "..", "..", "fusion.json");
}

/**
 * Read the repo-tracked default mode. Returns "on", "off", or undefined if
 * the config is absent or malformed (treated as off).
 *
 * Schema is intentionally tiny: { defaultMode?: "on" | "off" }. No role /
 * model / tool knobs live here; per-role config stays in config.yml so
 * the source of truth for orchestration mapping stays in one place.
 * Reading is permissive: extra keys are ignored, missing file is
 * undefined (treated as off).
 */
export function readDefaultMode(
	path: string = repoFusionJsonPath(),
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
 * Write the repo-tracked default mode. No-op when there is no change;
 * mkdirs the parent dir so the typical "first-time-on" write succeeds
 * without a manual touch.
 *
 * This file is a tracked, non-secret repo file — no mode:0o600.
 */
export function writeDefaultMode(
	mode: FusionMode,
	path: string = repoFusionJsonPath(),
): boolean {
	const current = readDefaultMode(path);
	if (current === mode) return true;
	const dir = dirname(path);
	try {
		mkdirSync(dir, { recursive: true });
	} catch {
		return false;
	}
	try {
		writeFileSync(path, JSON.stringify({ defaultMode: mode }, null, 2) + "\n");
		return true;
	} catch {
		return false;
	}
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
	"You are the orchestrator in omp Fusion. You coordinate and verify; all discovery",
	"and all mutation happen through delegated subagents via the `task` tool.",
	"",
	"Roles (models are pinned in config.yml — never override per call):",
	"- scout: read-only codebase discovery. Delegate discovery here; never redo it yourself.",
	"- planner: for changes spanning multiple files, interfaces/contracts/schemas,",
	"  migrations, or non-trivial sequencing, delegate a planner BEFORE any worker.",
	"  Its returned plan is the worker's spec. Trivial single-file edits may skip it —",
	"  state the one-line reason when you do.",
	"- task (worker): the ONLY writer. One worker per file set; concurrent workers in",
	"  one cwd must get disjoint file sets. Every worker delegation carries all five:",
	"  Objective (one sentence), Files (exact read/write paths), Interfaces (signatures,",
	"  types, schemas), Constraints (what to avoid; smallest correct change), and",
	"  Verification (the deterministic check to run after).",
	"- reviewer: independent risk review of a completed diff (security, auth,",
	"  migrations, public APIs, data loss, substantial multi-file logic). Never the",
	"  worker that wrote the code. Run one before finalizing such changes.",
	"",
	"Retry ladder (no blind loops, no model switching): first miss → resume the same",
	"worker with a precise correction; second miss → hand the worker the exact patch;",
	"still failing → stop and revise the plan.",
	"",
	"Use hub to coordinate and to wait on async subagents; return control for long work",
	"rather than blocking.",
].join("\n");
export const FUSION_GUIDANCE_FULL = `${FUSION_GUIDANCE_HEADER}\n${FUSION_GUIDANCE_BODY}\n`;

// --- extension entry point -----------------------------------------------

export default function fusionExtension(pi: ExtensionAPI): void {
	// Per-session module instance: each session — orchestrator and every
	// in-process child — re-imports this module with fresh module state.
	// Coordination across in-process siblings runs through process.env.
	let isOrchestrator = false;
	let enabled = false;
	// The full, pre-Fusion tool set. Captured once, before Fusion ever shrinks
	// the surface, so a later toggle-off / session-switch restores the real
	// baseline instead of re-snapshotting an already-shrunk set.
	let pristineTools: string[] | undefined;

	const defaultFromConfig = readDefaultMode();

	// Resolve desired state for whatever session `ctx` currently points at and
	// apply it. Shared by session_start (initial load) and session_switch
	// (/new, /resume, /fork within the same process). Precedence: latest
	// fusion-state entry > --fusion flag > repo default > off.
	async function applyState(ctx: ExtensionContext): Promise<void> {
		if (pristineTools === undefined) {
			pristineTools = pi.getActiveTools();
		}
		const persisted = readLatestFusionState(ctx.sessionManager.getEntries());
		enabled = persisted
			? persisted.enabled
			: pi.getFlag("fusion") === true || defaultFromConfig === "on";
		await applyNow();
	}

	// --- session_start: claim role + resolve + apply ---------------------

	pi.on("session_start", async (_event, ctx) => {
		const sid = ctx.sessionManager.getSessionId();
		const claimed = process.env[CLAIM_ENV];
		if (claimed === undefined) {
			// First claim in this process: we are the top-level orchestrator.
			// Stash our session id so in-process children (which get their own
			// sid and their own module instance) self-disable below.
			process.env[CLAIM_ENV] = sid;
			isOrchestrator = true;
		} else if (claimed === sid) {
			// Same session rebinding (headless re-init). Still the orchestrator.
			isOrchestrator = true;
		} else {
			// This module instance belongs to an in-process child subagent: do
			// NOT touch its tool surface. Its tools come from config.yml /
			// agent frontmatter.
			isOrchestrator = false;
			return;
		}
		await applyState(ctx);
	});

	// --- session_switch: orchestrator moved to another session -----------
	// Fires on /new, /resume, /fork (and handoff) in the same process. Only the
	// orchestrator's own module instance ever has isOrchestrator === true;
	// children run to completion and never switch, so they ignore this. Repoint
	// the claim at the live session id (so children spawned from the new session
	// still self-disable) and re-resolve state for that session.
	pi.on("session_switch", async (_event, ctx) => {
		if (!isOrchestrator) return;
		process.env[CLAIM_ENV] = ctx.sessionManager.getSessionId();
		await applyState(ctx);
	});

	// --- commands --------------------------------------------------------

	pi.registerFlag("fusion", {
		description: "Start the session in Fusion mode",
		type: "boolean",
		default: false,
	});

	pi.registerCommand("fusion", {
		description:
			"Fusion mode controls: /fusion on | off | status | default on|off",
		handler: async (args, ctx) => {
			if (!isOrchestrator) {
				if (ctx.hasUI)
					ctx.ui.notify("fusion: not active in this session", "info");
				return;
			}
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
				await setEnabled(trimmed === "on", ctx);
				return;
			}
			if (trimmed.startsWith("default")) {
				const rest = trimmed.replace(/^default\s+/, "").trim();
				if (rest === "on" || rest === "off") {
					const ok = writeDefaultMode(rest);
					if (ctx.hasUI) {
						ctx.ui.notify(
							ok
								? `fusion: repo default = ${rest}`
								: `fusion: failed to write ${repoFusionJsonPath()}`,
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
			toolsBeforeFusion: pristineTools,
		});
	}

	async function setEnabled(
		next: boolean,
		ctx: ExtensionContext,
	): Promise<void> {
		if (next === enabled) return;
		if (pristineTools === undefined) {
			pristineTools = pi.getActiveTools();
		}
		enabled = next;
		await applyNow();
		persistState();
		if (ctx.hasUI) {
			ctx.ui.notify(
				enabled
					? "Fusion on (orchestrator tool surface shrunk)"
					: "Fusion off (tools restored)",
				"info",
			);
		}
	}

	async function applyNow(): Promise<void> {
		if (enabled) {
			await pi.setActiveTools([...ORCHESTRATOR_ALLOWED_TOOLS]);
		} else if (pristineTools !== undefined) {
			await pi.setActiveTools(pristineTools);
		}
	}

	// --- before_agent_start: reapply allowlist + inject guidance ---------
	// Guidance rides the per-turn systemPrompt override, which the session
	// clears after every turn (never persisted) — so it never accumulates in
	// the transcript. The allowlist is the actual enforcement; the guidance is
	// only orchestration methodology (role delegation, worker contract, retry
	// ladder) the shrunk surface cannot itself convey.
	pi.on("before_agent_start", async (event, _ctx) => {
		if (!isOrchestrator || !enabled) return;
		const wanted = [...ORCHESTRATOR_ALLOWED_TOOLS];
		const active = pi.getActiveTools();
		const sameSet =
			active.length === wanted.length &&
			wanted.every((t) => active.includes(t));
		if (!sameSet) {
			await pi.setActiveTools(wanted);
		}
		return { systemPrompt: [...event.systemPrompt, FUSION_GUIDANCE_FULL] };
	});
}