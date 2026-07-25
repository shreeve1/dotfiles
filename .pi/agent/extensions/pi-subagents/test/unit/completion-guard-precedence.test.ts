import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import test from "node:test";
import { resolveCompletionGuard } from "../../src/runs/shared/completion-guard.ts";
import { buildAsyncRunnerSteps } from "../../src/runs/background/async-execution.ts";
import { buildCompletionGuardRecoveryFields } from "../../src/runs/background/async-execution.ts";
import {
	applySteeringRecoveryAgentConfig,
	readAsyncRecoveryDescriptor,
} from "../../src/runs/background/async-resume.ts";
import { materializeDynamicParallelStep } from "../../src/runs/shared/dynamic-fanout.ts";
import { parseSubagentDelegationRequest } from "../../src/slash/delegation-request.ts";
import { toSubagentDelegationExecutionParams } from "../../src/slash/delegation-adapters.ts";
import {
	buildAsyncParallelCompletionGuardFields,
	buildForegroundChainCompletionGuardFields,
} from "../../src/runs/foreground/subagent-executor.ts";
import { buildDynamicParallelStep } from "../../src/runs/foreground/chain-execution.ts";

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

test("completionGuard: async launch recovery persists omitted call with agent default", () => {
	const fields = buildCompletionGuardRecoveryFields(undefined, false);
	assert.equal(fields.completionGuard, false);
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

test("completionGuard: foreground chain forwards top-level call value", () => {
	assert.deepEqual(buildForegroundChainCompletionGuardFields(false), {
		completionGuard: false,
	});
	assert.deepEqual(buildForegroundChainCompletionGuardFields(true), {
		completionGuard: true,
	});
	assert.deepEqual(buildForegroundChainCompletionGuardFields(undefined), {
		completionGuard: undefined,
	});
});

test("completionGuard: async parallel reconstruction omits field when call is undefined", () => {
	assert.deepEqual(buildAsyncParallelCompletionGuardFields(false), {
		completionGuard: false,
	});
	assert.deepEqual(buildAsyncParallelCompletionGuardFields(true), {
		completionGuard: true,
	});
	assert.deepEqual(buildAsyncParallelCompletionGuardFields(undefined), {});
});

test("completionGuard: foreground dynamic group honors step.completionGuard on ParallelStep seam", () => {
	const dynamicStep = {
		expand: { from: { output: "items", path: "" }, maxItems: 2 },
		parallel: { agent: "writer", task: "edit {item}" },
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
	const off = buildDynamicParallelStep(dynamicStep as never, materialized);
	assert.equal(off.completionGuard, false);
	assert.equal(off.parallel.length, 2);

	const on = buildDynamicParallelStep(
		{ ...dynamicStep, completionGuard: true } as never,
		materialized,
	);
	assert.equal(on.completionGuard, true);

	const noGuard = { ...dynamicStep } as Record<string, unknown>;
	delete noGuard.completionGuard;
	const omitted = buildDynamicParallelStep(noGuard as never, materialized);
	assert.equal(
		omitted.completionGuard,
		undefined,
		"omitted step-level value must not be set on the ParallelStep",
	);
	assert.ok(
		!("completionGuard" in omitted),
		"omitted value must not be present as a key",
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
