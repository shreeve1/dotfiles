/**
 * Test-only sandbox helpers for rpiv-core.
 *
 * The settings/agent-dir readers (`getAgentDir()`, `getPiAgentSettingsPath()`)
 * resolve `PI_CODING_AGENT_DIR` fresh on every call. These helpers point that
 * env var at a fresh per-test temp dir so tests never read, write, or delete
 * the developer's real `~/.pi/agent`. Without this, `npm test` corrupts live
 * Pi config.
 *
 * Not a `*.test.ts` file, so Vitest never collects it as a suite.
 */

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach } from "vitest";

/** The env var `getAgentDir()` honors (mirrors Pi's `ENV_AGENT_DIR`). */
const ENV_AGENT_DIR = "PI_CODING_AGENT_DIR";

/** Accessor for the active sandbox paths of the current test. */
export interface TempPiAgentDir {
	/** Fresh temp root for this test (safe to mkdir/rm against its children). */
	readonly root: string;
	/** The sandboxed agent dir (`PI_CODING_AGENT_DIR` points here). */
	readonly agentDir: string;
}

/**
 * Register beforeEach/afterEach hooks that sandbox `PI_CODING_AGENT_DIR` to a
 * fresh temp dir for every test in the calling suite, restoring the prior env
 * value and removing the temp dir afterwards.
 *
 * Call once at the top level of a test file (before any other `beforeEach`
 * that relies on the agent dir):
 *
 *   const piAgent = useTempPiAgentDir();
 *   // ... piAgent.agentDir is the sandbox for the current test
 *
 * Restoration runs even if a test overrides `PI_CODING_AGENT_DIR` itself, so
 * env leaks across files are impossible.
 */
export function useTempPiAgentDir(): TempPiAgentDir {
	let root = "";
	let agentDir = "";
	let hadEnv = false;
	let prevEnv: string | undefined;

	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "rpiv-piagent-"));
		agentDir = join(root, "agent");
		hadEnv = ENV_AGENT_DIR in process.env;
		prevEnv = process.env[ENV_AGENT_DIR];
		process.env[ENV_AGENT_DIR] = agentDir;
	});

	afterEach(() => {
		if (hadEnv) process.env[ENV_AGENT_DIR] = prevEnv;
		else delete process.env[ENV_AGENT_DIR];
		if (root) rmSync(root, { recursive: true, force: true });
	});

	return {
		get root() {
			return root;
		},
		get agentDir() {
			return agentDir;
		},
	};
}
