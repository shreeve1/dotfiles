import assert from "node:assert/strict";
import test from "node:test";
import type { DynamicParallelStep } from "../../src/shared/settings.ts";
import { validateChainInput } from "../../src/extension/chain-validation.ts";
import {
	evaluateDynamicFilter,
	resolveDynamicFanoutItems,
	validateDynamicStepShape,
} from "../../src/runs/shared/dynamic-fanout.ts";
import type { ChainOutputMap } from "../../src/shared/types.ts";

function dynamicStep(filter: unknown, key?: string, maxItems = 5): DynamicParallelStep {
	return {
		expand: {
			from: { output: "prev", path: "/items" },
			...(key !== undefined ? { key } : {}),
			maxItems,
			filter,
		},
		parallel: { agent: "worker" },
		collect: { as: "results" },
	} as DynamicParallelStep;
}

test("evaluateDynamicFilter: equals match and no-match", () => {
	assert.equal(evaluateDynamicFilter({ equals: "ready" }, "ready"), true);
	assert.equal(evaluateDynamicFilter({ equals: "ready" }, "pending"), false);
});

test("evaluateDynamicFilter: in match and no-match", () => {
	assert.equal(evaluateDynamicFilter({ in: ["ready", "done"] }, "done"), true);
	assert.equal(evaluateDynamicFilter({ in: ["ready", "done"] }, "pending"), false);
});

test("evaluateDynamicFilter: path resolves to nested value", () => {
	assert.equal(evaluateDynamicFilter({ path: "/metadata/severity", equals: "high" }, { metadata: { severity: "high" } }), true);
});

test("evaluateDynamicFilter: missing path excludes item", () => {
	assert.equal(evaluateDynamicFilter({ path: "/metadata/severity", equals: "high" }, { metadata: {} }), false);
});

test("evaluateDynamicFilter: no path matches the whole item", () => {
	assert.equal(evaluateDynamicFilter({ equals: 42 }, 42), true);
	assert.equal(evaluateDynamicFilter({ equals: 42 }, "42"), false);
});

test("evaluateDynamicFilter: in preserves mixed scalar types", () => {
	const filter = { in: ["1", 1, true, false] };
	assert.equal(evaluateDynamicFilter(filter, "1"), true);
	assert.equal(evaluateDynamicFilter(filter, 1), true);
	assert.equal(evaluateDynamicFilter(filter, true), true);
	assert.equal(evaluateDynamicFilter(filter, 0), false);
});

test("validateDynamicStepShape: accepts equals and in filters", () => {
	assert.doesNotThrow(() => validateDynamicStepShape(dynamicStep({ path: "/severity", equals: "high" }), 1));
	assert.doesNotThrow(() => validateDynamicStepShape(dynamicStep({ in: ["high", 2, false] }), 1));
});

test("validateDynamicStepShape: rejects both equals and in", () => {
	assert.throws(
		() => validateDynamicStepShape(dynamicStep({ equals: "high", in: ["low"] }), 1),
		/requires exactly one of equals or in/,
	);
});

test("validateDynamicStepShape: rejects neither equals nor in", () => {
	assert.throws(
		() => validateDynamicStepShape(dynamicStep({ path: "/severity" }), 1),
		/requires exactly one of equals or in/,
	);
});

test("validateDynamicStepShape: rejects an empty in array", () => {
	assert.throws(
		() => validateDynamicStepShape(dynamicStep({ in: [] }), 1),
		/expand\.filter\.in must be a non-empty array/,
	);
});

test("validateDynamicStepShape: rejects non-scalar in elements", () => {
	assert.throws(
		() => validateDynamicStepShape(dynamicStep({ in: ["high", { severity: "low" }] }), 1),
		/expand\.filter\.in must contain only scalars/,
	);
});

test("validateDynamicStepShape: rejects a non-pointer filter path", () => {
	assert.throws(
		() => validateDynamicStepShape(dynamicStep({ path: "severity", equals: "high" }), 1),
		/expand\.filter\.path must be a JSON Pointer starting with '\/'/,
	);
});

test("validateChainInput: accepts a dynamic expand filter", () => {
	const input = {
		chain: [
			{
				agent: "worker",
				output: "prev",
				outputSchema: { type: "object" },
			},
			{
				expand: { from: { output: "prev", path: "/items" }, maxItems: 5, filter: { path: "/severity", equals: "high" } },
				parallel: { agent: "worker" },
				collect: { as: "results" },
			},
		],
	};
	assert.doesNotThrow(() => {
		validateChainInput(input);
		validateDynamicStepShape(input.chain[1] as DynamicParallelStep, 1);
	});
});

test("resolveDynamicFanoutItems: filters items in order and retains matching keys", () => {
	const items = [
		{ id: "first", severity: "low" },
		{ id: "second", severity: "high" },
		{ id: "third", severity: "high" },
	];
	const outputs: ChainOutputMap = {
		prev: { text: "", agent: "worker", stepIndex: 0, structured: { items } },
	};
	const result = resolveDynamicFanoutItems(dynamicStep({ path: "/severity", equals: "high" }, "/id", 10), outputs, 1, { maxItems: 10 });
	assert.deepEqual(result, [
		{ index: 0, key: "second", idKey: "second", item: items[1] },
		{ index: 1, key: "third", idKey: "third", item: items[2] },
	]);
});

test("resolveDynamicFanoutItems: maxItems applies after filtering", () => {
	const items = Array.from({ length: 20 }, (_, index) => ({ id: `item-${index}`, keep: index === 19 }));
	const outputs: ChainOutputMap = {
		prev: { text: "", agent: "worker", stepIndex: 0, structured: { items } },
	};
	const result = resolveDynamicFanoutItems(dynamicStep({ path: "/keep", equals: true }, "/id", 1), outputs, 1, { maxItems: 10 });
	assert.deepEqual(result.map((entry) => entry.key), ["item-19"]);
});
