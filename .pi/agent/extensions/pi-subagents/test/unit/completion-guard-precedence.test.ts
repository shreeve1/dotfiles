import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { resolveCompletionGuard } from "../../src/runs/shared/completion-guard.ts";
import { buildAsyncRunnerSteps } from "../../src/runs/background/async-execution.ts";
import {
	applySteeringRecoveryAgentConfig,
	readAsyncRecoveryDescriptor,
} from "../../src/runs/background/async-resume.ts";
import { materializeDynamicParallelStep } from "../../src/runs/shared/dynamic-fanout.ts";
import { parseSubagentDelegationRequest } from "../../src/slash/delegation-request.ts";
import { toSubagentDelegationExecutionParams } from "../../src/slash/delegation-adapters.ts";

// Resolve vendored source paths via import.meta.url so the test is independent of cwd.
const here = dirname(fileURLToPath(import.meta.url));
const chainExecutionPath = resolve(
	here,
	"../../src/runs/foreground/chain-execution.ts",
);
const asyncExecutionPath = resolve(
	here,
	"../../src/runs/background/async-execution.ts",
);

test("resolveCompletionGuard: undefined call falls back to agent", () => {
	assert.equal(resolveCompletionGuard(undefined, false), false);
	assert.equal(resolveCompletionGuard(undefined, true), true);
});

test("resolveCompletionGuard: call=true overrides agent=false", () => {
	assert.equal(resolveCompletionGuard(true, false), true);
});

test("resolveCompletionGuard: default is true when both undefined", () => {
	assert.equal(resolveCompletionGuard(), true);
	assert.equal(resolveCompletionGuard(undefined, undefined), true);
});

test("resolveCompletionGuard: call=false overrides agent=true", () => {
	assert.equal(resolveCompletionGuard(false, true), false);
});

test("resolveCompletionGuard: call takes precedence over agent", () => {
	assert.equal(resolveCompletionGuard(true, true), true);
	assert.equal(resolveCompletionGuard(false, false), false);
});

const testAgent = {
	name: "writer",
	description: "",
	systemPrompt: "",
	systemPromptMode: "append",
	inheritProjectContext: false,
	inheritSkills: false,
	source: "user",
	filePath: "",
};
const testAsyncContext = {
	pi: {},
	cwd: process.cwd(),
	currentSessionId: "completion-guard-test",
};

function buildTestSteps(chain: unknown[], completionGuard?: boolean) {
	const result = buildAsyncRunnerSteps("completion-guard-test", {
		chain: chain as never,
		agents: [testAgent] as never,
		ctx: testAsyncContext as never,
		maxSubagentDepth: 2,
		asyncDir: process.cwd(),
		validateOutputBindings: false,
		completionGuard,
	});
	assert.ok(!("error" in result), "async step build should succeed");
	return result.steps;
}

test("completionGuard: async chain task and step values remain narrow", () => {
	const steps = buildTestSteps(
		[
			{
				parallel: [{ agent: "writer", task: "task", completionGuard: false }],
				completionGuard: true,
			},
		],
		true,
	);
	assert.equal(
		(steps[0] as { parallel: Array<{ completionGuard?: boolean }> }).parallel[0]
			?.completionGuard,
		false,
	);

	const stepOnly = buildTestSteps(
		[
			{
				parallel: [{ agent: "writer", task: "step" }],
				completionGuard: false,
			},
		],
		true,
	);
	assert.equal(
		(stepOnly[0] as { parallel: Array<{ completionGuard?: boolean }> })
			.parallel[0]?.completionGuard,
		false,
	);
});

test("completionGuard: dynamic group override reaches materialization", () => {
	const dynamicStep = {
		expand: { from: { output: "items", path: "" }, maxItems: 2 },
		parallel: { agent: "writer", task: "edit {item}", completionGuard: true },
		collect: { as: "results" },
		completionGuard: false,
	};
	const materialized = materializeDynamicParallelStep(
		dynamicStep as never,
		{
			items: {
				text: "items",
				structured: ["a", "b"],
				agent: "writer",
				stepIndex: 0,
			},
		},
		1,
	);
	assert.deepEqual(
		materialized.parallel.map((task) => task.completionGuard),
		[false, false],
	);

	const steps = buildTestSteps([dynamicStep], true);
	const dynamic = steps[0] as {
		completionGuard?: boolean;
		parallel: { completionGuard?: boolean };
	};
	assert.equal(dynamic.completionGuard, false);
	assert.equal(dynamic.parallel.completionGuard, false);
});

test("completionGuard: delegation request parses optional boolean and forwards it", () => {
	const baseRequest = {
		version: 1,
		requestId: "delegation-completion-guard-1",
		agent: "writer",
		task: "draft",
		context: "fresh",
		cwd: "/tmp",
	};
	const off = parseSubagentDelegationRequest({
		...baseRequest,
		completionGuard: false,
	});
	assert.ok(off.ok, off.ok ? "" : off.error);
	if (off.ok) {
		assert.equal(off.request.completionGuard, false);
		assert.equal(
			toSubagentDelegationExecutionParams(off.request).completionGuard,
			false,
		);
	}

	const on = parseSubagentDelegationRequest({
		...baseRequest,
		completionGuard: true,
	});
	assert.ok(on.ok, on.ok ? "" : on.error);
	if (on.ok) {
		assert.equal(on.request.completionGuard, true);
		assert.equal(
			toSubagentDelegationExecutionParams(off.request).completionGuard,
			false,
		);
		assert.equal(
			toSubagentDelegationExecutionParams(on.request).completionGuard,
			true,
		);
	}

	const omitted = parseSubagentDelegationRequest({ ...baseRequest });
	assert.ok(omitted.ok, omitted.ok ? "" : omitted.error);
	if (omitted.ok) {
		assert.equal(omitted.request.completionGuard, undefined);
		assert.equal(
			toSubagentDelegationExecutionParams(omitted.request).completionGuard,
			undefined,
		);
	}

	const malformed = parseSubagentDelegationRequest({
		...baseRequest,
		completionGuard: "yes",
	});
	assert.equal(malformed.ok, false);
	if (!malformed.ok) assert.match(malformed.error, /completionGuard/);
});

test("completionGuard: recovery descriptor retains original call override, not agent default", () => {
	const agentBase = {
		name: "writer",
		description: "",
		systemPrompt: "",
		systemPromptMode: "append" as const,
		inheritProjectContext: false,
		inheritSkills: false,
		source: "user" as const,
		filePath: "",
		completionGuard: true,
	};
	const descriptorOff = {
		...agentBase,
		version: 1 as const,
		sourceRunId: "src",
		agent: "writer",
		cwd: "/tmp",
		systemPromptMode: "append" as const,
		inheritProjectContext: false,
		inheritSkills: false,
		outputMode: "inline" as const,
		maxSubagentDepth: 2,
		share: false,
		completionGuard: false,
	};
	const recovered = applySteeringRecoveryAgentConfig(agentBase, descriptorOff);
	assert.equal(
		recovered.completionGuard,
		false,
		"descriptor call override must override agent default",
	);

	const descriptorOn = { ...descriptorOff, completionGuard: true };
	const recoveredOn = applySteeringRecoveryAgentConfig(agentBase, descriptorOn);
	assert.equal(recoveredOn.completionGuard, true);
});

test("completionGuard: foreground chain call-level override threads through buildAsyncRunnerSteps", () => {
	// Top-level call value falls through onto every sequential step.
	const offSteps = buildTestSteps([{ agent: "writer", task: "t" }], false);
	const offStep = offSteps[0] as { completionGuard?: boolean };
	assert.equal(offStep.completionGuard, false);

	const onSteps = buildTestSteps([{ agent: "writer", task: "t" }], true);
	const onStep = onSteps[0] as { completionGuard?: boolean };
	assert.equal(onStep.completionGuard, true);

	// When the call-level value is undefined, the runner step resolves
	// precedence from agent default (testAgent has no completionGuard,
	// so resolveCompletionGuard returns true).
	const noCallSteps = buildTestSteps(
		[{ agent: "writer", task: "t" }],
		undefined,
	);
	const noCallStep = noCallSteps[0] as { completionGuard?: boolean };
	assert.equal(
		noCallStep.completionGuard,
		true,
		"undefined call value falls back to agent default (true)",
	);
});

test("completionGuard: async parallel reconstruction omits field when call is undefined", () => {
	// Inline production seam: each parallel task gets `completionGuard`
	// only when task.completionGuard is defined.
	const withFalse = buildTestSteps(
		[{ parallel: [{ agent: "writer", task: "t" }], completionGuard: false }],
		undefined,
	);
	const falseStep = withFalse[0] as {
		parallel: Array<{ completionGuard?: boolean }>;
	};
	assert.equal(falseStep.parallel[0]?.completionGuard, false);

	const withTrue = buildTestSteps(
		[{ parallel: [{ agent: "writer", task: "t" }], completionGuard: true }],
		undefined,
	);
	const trueStep = withTrue[0] as {
		parallel: Array<{ completionGuard?: boolean }>;
	};
	assert.equal(trueStep.parallel[0]?.completionGuard, true);

	// When the task-level and step-level values are both undefined, the
	// runner step resolves precedence from the agent default (true).
	const withUndefined = buildTestSteps(
		[{ parallel: [{ agent: "writer", task: "t" }] }],
		undefined,
	);
	const undefStep = withUndefined[0] as {
		parallel: Array<{ completionGuard?: boolean }>;
	};
	assert.equal(
		undefStep.parallel[0]?.completionGuard,
		true,
		"undefined call value resolves to agent default (true) on the runner step",
	);
});

test("completionGuard: foreground dynamic group inlines step.completionGuard onto ParallelStep", () => {
	// No higher-level public path is runnable in this unit test (executeChain requires
	// ExtensionContext). The conversion is now inlined in chain-execution.ts: confirm
	// the inline conditional spread for completionGuard and the per-task template forwarding.
	const source = readFileSync(chainExecutionPath, "utf8");
	assert.match(
		source,
		/parallel:\s*materialized\.parallel/,
		"chain-execution.ts must forward materialized.parallel onto the ParallelStep",
	);
	assert.match(
		source,
		/concurrency:\s*step\.concurrency/,
		"chain-execution.ts must forward step.concurrency onto the ParallelStep",
	);
	assert.match(
		source,
		/failFast:\s*step\.failFast/,
		"chain-execution.ts must forward step.failFast onto the ParallelStep",
	);
	assert.match(
		source,
		/step\.completionGuard\s*!==\s*undefined/,
		"chain-execution.ts must gate step.completionGuard forwarding on !== undefined",
	);
	assert.match(
		source,
		/completionGuard:\s*step\.completionGuard/,
		"chain-execution.ts must forward the explicit step.completionGuard value",
	);
});

test("completionGuard: async recovery descriptor write site forwards resolved precedence", () => {
	// The recovery descriptor write site is the only place the async single path persists
	// completionGuard; after seam removal it must call resolveCompletionGuard directly
	// (not a single-use helper) and write the boolean.
	const source = readFileSync(asyncExecutionPath, "utf8");
	assert.match(
		source,
		/completionGuard:\s*resolveCompletionGuard\(\s*params\.completionGuard,\s*agentConfig\.completionGuard/,
		"async-execution.ts must call resolveCompletionGuard directly with params and agent",
	);
	assert.doesNotMatch(
		source,
		/buildCompletionGuardRecoveryFields/,
		"async-execution.ts must not export the removed recovery-fields helper",
	);
});

test("completionGuard: async recovery descriptor round-trip accepts boolean field", () => {
	const asyncDir = mkdtempSync(
		path.join(tmpdir(), "pi-subagents-completion-guard-"),
	);
	try {
		writeFileSync(
			path.join(asyncDir, "recovery-descriptor.json"),
			JSON.stringify({
				version: 1,
				sourceRunId: "src",
				agent: "writer",
				cwd: "/tmp",
				systemPromptMode: "append",
				inheritProjectContext: false,
				inheritSkills: false,
				outputMode: "inline",
				maxSubagentDepth: 2,
				share: false,
				completionGuard: false,
			}),
		);
		const descriptor = readAsyncRecoveryDescriptor(asyncDir);
		assert.ok(descriptor);
		assert.equal(descriptor?.completionGuard, false);
	} finally {
		rmSync(asyncDir, { recursive: true, force: true });
	}
});
