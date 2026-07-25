import assert from "node:assert/strict";
import test from "node:test";
import { resolveCompletionGuard } from "../../src/runs/shared/completion-guard.ts";
import { buildAsyncRunnerSteps } from "../../src/runs/background/async-execution.ts";
import { materializeDynamicParallelStep } from "../../src/runs/shared/dynamic-fanout.ts";

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
	const steps = buildTestSteps([{
		parallel: [{ agent: "writer", task: "task", completionGuard: false }],
		completionGuard: true,
	}], true);
	assert.equal((steps[0] as { parallel: Array<{ completionGuard?: boolean }> }).parallel[0]?.completionGuard, false);

	const stepOnly = buildTestSteps([{
		parallel: [{ agent: "writer", task: "step" }],
		completionGuard: false,
	}], true);
	assert.equal((stepOnly[0] as { parallel: Array<{ completionGuard?: boolean }> }).parallel[0]?.completionGuard, false);
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
		{ items: { text: "items", structured: ["a", "b"], agent: "writer", stepIndex: 0 } },
		1,
	);
	assert.deepEqual(materialized.parallel.map((task) => task.completionGuard), [false, false]);

	const steps = buildTestSteps([dynamicStep], true);
	const dynamic = steps[0] as { completionGuard?: boolean; parallel: { completionGuard?: boolean } };
	assert.equal(dynamic.completionGuard, false);
	assert.equal(dynamic.parallel.completionGuard, false);
});
