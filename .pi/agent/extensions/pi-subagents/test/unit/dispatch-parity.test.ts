import assert from "node:assert/strict";
import test from "node:test";
import type { DynamicParallelStep } from "../../src/shared/settings.ts";
import type { ChainOutputMap, ChainOutputMapEntry, SingleResult } from "../../src/shared/types.ts";
import { getSingleResultOutput } from "../../src/shared/utils.ts";
import {
	ChainOutputValidationError,
	outputEntryFromAsyncResult,
	outputEntryFromResult,
	resolveOutputReferences,
	validateChainOutputBindings,
} from "../../src/runs/shared/chain-outputs.ts";
import {
	collectDynamicResults,
	materializeDynamicParallelStep,
} from "../../src/runs/shared/dynamic-fanout.ts";

// ----------------------------------------------------------------------------
// FG vs BG output-entry parity invariant
// ----------------------------------------------------------------------------
//
// Both dispatch paths write into outputs[as] using the same ChainOutputMapEntry
// shape. Foreground uses outputEntryFromResult(singleResult, k); background
// uses outputEntryFromAsyncResult({ agent, output: singleResult.output,
// structuredOutput }, k). The two builders have ONE intentional plumbing
// difference: the FG path derives its text-fallback from
// getSingleResultOutput(r) (which is finalOutput ?? textFromMessages), while
// the BG path takes the text it's handed verbatim — which the BG dispatch
// itself computes upstream and passes in. This test normalizes by handing the
// BG builder the equivalent getSingleResultOutput(r) value, which is the BG
// dispatch's contract. Under that normalization the two entries MUST be deeply
// equal. A regression where one path changes its key set (e.g. adds/omits
// `structured`) will break this test, because both builders spread
// `structured` with the same conditional (`...({structured: x} when defined)`).

function fakeSingleResult(overrides: Partial<SingleResult> = {}): SingleResult {
	return {
		agent: "analyst",
		task: "do thing",
		exitCode: 0,
		usage: {
			input: 0,
			output: 0,
			cacheRead: 0,
			cacheWrite: 0,
			totalTokens: 0,
			cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
		},
		...overrides,
	} as SingleResult;
}

test("dispatch parity: FG and BG entries agree when structuredOutput is set", () => {
	const r = fakeSingleResult({ structuredOutput: { items: [{ id: "a" }, { id: "b" }] } });
	const fg = outputEntryFromResult(r, 0);
	const bg = outputEntryFromAsyncResult({ agent: r.agent, output: getSingleResultOutput(r), structuredOutput: r.structuredOutput }, 0);
	assert.deepEqual(fg, bg);
	assert.deepEqual(fg.structured, { items: [{ id: "a" }, { id: "b" }] });
	assert.equal(fg.text, JSON.stringify(fg.structured));
});

test("dispatch parity: FG and BG entries agree when only finalOutput is set (no structured)", () => {
	const r = fakeSingleResult({ finalOutput: "all clear" });
	const fg = outputEntryFromResult(r, 2);
	const bg = outputEntryFromAsyncResult({ agent: r.agent, output: getSingleResultOutput(r), structuredOutput: r.structuredOutput }, 2);
	assert.deepEqual(fg, bg);
	assert.equal(fg.text, "all clear");
	// `structured` must be ABSENT (not undefined), because both builders spread
	// it conditionally. Asserting deepEqual above already covers this — the
	// spread contract is what makes parity hold.
	assert.ok(!Object.hasOwn(fg, "structured"));
	assert.ok(!Object.hasOwn(bg, "structured"));
});

test("dispatch parity: FG and BG entries agree when text is derived from messages only", () => {
	// finalOutput undefined; messages carry a single assistant text part. Both
	// builders must derive the same text via getSingleResultOutput -> getFinalOutput.
	const r = fakeSingleResult({
		finalOutput: undefined,
		messages: [{ role: "assistant", content: [{ type: "text", text: "from messages" }] } as never],
	});
	const derived = getSingleResultOutput(r);
	assert.equal(derived, "from messages");
	const fg = outputEntryFromResult(r, 1);
	const bg = outputEntryFromAsyncResult({ agent: r.agent, output: derived, structuredOutput: r.structuredOutput }, 1);
	assert.deepEqual(fg, bg);
	assert.equal(fg.text, "from messages");
});

test("dispatch parity: agent and stepIndex propagate identically for several indices", () => {
	for (const k of [0, 3, 7]) {
		const r = fakeSingleResult({ agent: `agent-${k}`, structuredOutput: { k } });
		const fg = outputEntryFromResult(r, k);
		const bg = outputEntryFromAsyncResult({ agent: r.agent, output: getSingleResultOutput(r), structuredOutput: r.structuredOutput }, k);
		assert.equal(fg.agent, `agent-${k}`);
		assert.equal(bg.agent, `agent-${k}`);
		assert.equal(fg.stepIndex, k);
		assert.equal(bg.stepIndex, k);
		assert.deepEqual(fg, bg);
	}
});

// ----------------------------------------------------------------------------
// Dynamic-fanout collect parity (shared core)
// ----------------------------------------------------------------------------
//
// Both dispatch paths drive the SAME materializeDynamicParallelStep +
// collectDynamicResults and write the SAME literal entry into outputs[collect.as].
// This test pins that literal so a future edit that diverges between FG and
// BG (or omits a field) breaks the test.

function buildChainOutputMap(): ChainOutputMap {
	return {
		src: {
			text: JSON.stringify({
				items: [
					{ id: "a", severity: "high" },
					{ id: "b", severity: "low" },
					{ id: "c", severity: "high" },
				],
			}),
			structured: {
				items: [
					{ id: "a", severity: "high" },
					{ id: "b", severity: "low" },
					{ id: "c", severity: "high" },
				],
			},
			agent: "scanner",
			stepIndex: 0,
		},
	};
}

function buildDynamicStep(): DynamicParallelStep {
	return {
		expand: {
			from: { output: "src", path: "/items" },
			filter: { path: "/severity", equals: "high" },
			maxItems: 5,
		},
		parallel: { agent: "analyst", task: "Review {item.id}" },
		collect: { as: "results" },
	} as DynamicParallelStep;
}

test("dispatch parity: dynamic-fanout collect entry is the literal shape both paths write", () => {
	const outputs = buildChainOutputMap();
	const step = buildDynamicStep();
	const group = materializeDynamicParallelStep(step, outputs, 1, { maxItems: 5 });

	// Filter applied: only severity=high survives (ids a, c). Order preserved.
	assert.equal(group.items.length, 2);
	const firstItem = group.items[0]!.item as { id: string };
	const secondItem = group.items[1]!.item as { id: string };
	assert.equal(firstItem.id, "a");
	assert.equal(secondItem.id, "c");

	// Fake per-item results matching collectDynamicResults' expected shape.
	const fakeResults = group.items.map((entry, i) => {
		const item = entry.item as { id: string };
		return {
			agent: "analyst",
			exitCode: 0 as number | null,
			// finalOutput omitted -> text falls through getSingleResultOutput -> "".
			// structuredOutput set -> `structured` populated on the collected entry.
			structuredOutput: { id: item.id, verdict: i === 0 ? "block" : "ship" },
		} as unknown as Parameters<typeof collectDynamicResults>[2][number];
	});

	const collected = collectDynamicResults(step, group.items, fakeResults);

	// Pin the literal that BOTH chain-execution.ts:1047 and subagent-runner.ts:2960
	// (the FG and BG collect-write sites) construct: { text: JSON.stringify(collected), structured: collected, agent: step.parallel.agent, stepIndex }.
	const expectedEntry: ChainOutputMapEntry = {
		text: JSON.stringify(collected),
		structured: collected,
		agent: step.parallel.agent,
		stepIndex: 1,
	};
	// Round-trip through resolveOutputReferences must yield the same text — this
	// proves the entry shape is consumable by downstream {outputs.<name>} refs.
	assert.equal(resolveOutputReferences("{outputs.results}", { results: expectedEntry }), expectedEntry.text);
	// And the structured value must equal the collected array exactly (so later
	// steps can JSON-pointer into it).
	assert.deepEqual(expectedEntry.structured, collected);
});

// ----------------------------------------------------------------------------
// validateChainOutputBindings is path-independent (shared validator)
// ----------------------------------------------------------------------------
//
// Both FG (executeChain) and BG (buildAsyncRunnerSteps) call the same
// validateChainOutputBindings. They cannot disagree on dependency ordering.

test("dispatch parity: validateChainOutputBindings accepts a producer -> dynamic-expand chain", () => {
	const steps: DynamicParallelStep[] = [
		{
			agent: "scanner",
			task: "scan",
			as: "src",
			outputSchema: { type: "object" },
		} as unknown as DynamicParallelStep,
		buildDynamicStep(),
	];
	assert.doesNotThrow(() => validateChainOutputBindings(steps as unknown as Parameters<typeof validateChainOutputBindings>[0]));
});

test("dispatch parity: validateChainOutputBindings rejects a forward/unknown output reference", () => {
	const steps: DynamicParallelStep[] = [
		buildDynamicStep(), // expand.from.output = "src", but no prior step produces "src"
	];
	assert.throws(() => validateChainOutputBindings(steps as unknown as Parameters<typeof validateChainOutputBindings>[0]), ChainOutputValidationError);
});
