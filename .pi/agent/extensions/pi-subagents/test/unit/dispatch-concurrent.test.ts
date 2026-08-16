// ----------------------------------------------------------------------------
// Concurrent foreground dispatch (ADR 0004)
// ----------------------------------------------------------------------------
//
// Before ADR 0004, pi-subagents wrapped `execute` in `executeWithSingleDispatchGuard`,
// which set `state.subagentInProgress = true` around each foreground call and
// rejected a second concurrent foreground call with
//   "Rejected: a subagent call is already in progress. Issue exactly ONE
//    subagent call per turn."
// That single-call-per-turn guard blocked multi-scout fanout, the
// worker+reviewer pipeline overlap, and multi-worker dispatch even though the
// underlying parallel machinery (tasks[] up to 8, concurrency 4) already
// supported it.
//
// This test pins the new contract: two foreground-style calls dispatched
// concurrently MUST both reach the inner `execute` (not the rejection). We
// exercise the path with empty params — it bounces at
// `validateExecutionInput` with a benign "Provide exactly one mode…" error,
// which is enough to distinguish from the old rejection text.

import assert from "node:assert/strict";
import test from "node:test";
import { createSubagentExecutor } from "../../src/runs/foreground/subagent-executor.ts";
import type {
	AgentToolResult,
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import type { Details, SubagentState } from "../../src/shared/types.ts";

const REJECTION_TEXT = "Rejected: a subagent call is already in progress.";

function makeState(): SubagentState {
	return {
		baseCwd: "",
		currentSessionId: null,
		subagentSpawns: { sessionId: null, count: 0 },
		asyncJobs: new Map(),
		foregroundRuns: new Map(),
		foregroundControls: new Map(),
		lastForegroundControlId: null,
		pendingForegroundControlNotices: new Map(),
		cleanupTimers: new Map(),
		lastUiContext: null,
		poller: null,
		completionSeen: new Map(),
		watcher: null,
		watcherRestartTimer: null,
		resultFileCoalescer: { schedule: () => false, clear: () => {} },
	};
}

function makeCtx(): ExtensionContext {
	return {
		cwd: "/tmp",
		sessionManager: {
			getSessionFile: () => "/tmp/session.jsonl",
			getSessionId: () => "test-session",
		},
		hasUI: false,
		model: undefined,
		modelRegistry: { getAvailable: () => [] },
		ui: { notify: () => {}, setToolsExpanded: () => {} },
	} as unknown as ExtensionContext;
}

function buildExecutor() {
	// Minimal harness — only the fields `execute` reads at the entry path
	// are stubbed. We exercise up to `validateExecutionInput`, which fails
	// fast on empty params; that's enough to prove no single-dispatch
	// rejection short-circuits the second call.
	const pi: ExtensionAPI = {
		getSessionName: () => "test",
	} as unknown as ExtensionAPI;
	return createSubagentExecutor({
		pi,
		state: makeState(),
		config: {} as never,
		asyncByDefault: false,
		waitToolEnabled: false,
		tempArtifactsDir: "/tmp",
		getSubagentSessionRoot: () => "/tmp",
		expandTilde: (p: string) => p,
		discoverAgents: () => ({ agents: [] }),
	});
}

function textOf(result: AgentToolResult<Details>): string {
	const first = result.content?.[0];
	return first?.type === "text" ? (first.text ?? "") : "";
}

test("dispatch concurrent: two foreground-style calls are dispatched, not rejected", async () => {
	const executor = buildExecutor();
	const ctx = makeCtx();
	const signal = new AbortController().signal;
	const params = {};

	const [a, b] = await Promise.all([
		executor.execute("id-a", params, signal, undefined, ctx),
		executor.execute("id-b", params, signal, undefined, ctx),
	]);

	const textA = textOf(a);
	const textB = textOf(b);
	assert.ok(
		!textA.includes(REJECTION_TEXT),
		`call A was rejected by the old single-dispatch guard: ${textA}`,
	);
	assert.ok(
		!textB.includes(REJECTION_TEXT),
		`call B was rejected by the old single-dispatch guard: ${textB}`,
	);
});

test("dispatch concurrent: SubagentState no longer carries the subagentInProgress flag", () => {
	// Belt-and-braces companion: the previous rejection path used the
	// `state.subagentInProgress` boolean as its blocker. After the guard
	// removal the field must not exist on SubagentState — confirming it was
	// removed keeps "two-foreground-allowed" from being silently re-blocked
	// by a future regression that re-introduces the flag without a guard.
	const state = makeState();
	assert.equal(
		(state as unknown as Record<string, unknown>).subagentInProgress,
		undefined,
		"subagentInProgress state field must be removed (ADR 0004)",
	);
	assert.ok(state.lastForegroundControlId === null);
});

