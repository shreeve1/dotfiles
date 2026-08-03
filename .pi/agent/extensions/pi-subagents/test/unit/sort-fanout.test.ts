import assert from "node:assert/strict";
import test from "node:test";
import type { DynamicParallelStep, DynamicSortSpec } from "../../src/shared/settings.ts";
import { validateChainInput } from "../../src/extension/chain-validation.ts";
import {
	resolveDynamicFanoutItems,
	sortDynamicItems,
	validateDynamicStepShape,
} from "../../src/runs/shared/dynamic-fanout.ts";
import type { ChainOutputMap } from "../../src/shared/types.ts";

// ---------------------------------------------------------------------------
// sortDynamicItems unit tests
// ---------------------------------------------------------------------------

function makeItems<T>(items: T[]): T[] {
	return items;
}

test("sortDynamicItems: asc numeric order", () => {
	const out = sortDynamicItems({ by: "/s" }, makeItems([{ s: 3 }, { s: 1 }, { s: 2 }]));
	assert.deepEqual(out, [{ s: 1 }, { s: 2 }, { s: 3 }]);
});

test("sortDynamicItems: desc numeric order", () => {
	const out = sortDynamicItems({ by: "/s", order: "desc" }, makeItems([{ s: 3 }, { s: 1 }, { s: 2 }]));
	assert.deepEqual(out, [{ s: 3 }, { s: 2 }, { s: 1 }]);
});

test("sortDynamicItems: asc string order", () => {
	const out = sortDynamicItems({ by: "/s" }, makeItems([{ s: "banana" }, { s: "apple" }, { s: "cherry" }]));
	assert.deepEqual(out, [{ s: "apple" }, { s: "banana" }, { s: "cherry" }]);
});

test("sortDynamicItems: desc string order", () => {
	const out = sortDynamicItems({ by: "/s", order: "desc" }, makeItems([{ s: "banana" }, { s: "apple" }, { s: "cherry" }]));
	assert.deepEqual(out, [{ s: "cherry" }, { s: "banana" }, { s: "apple" }]);
});

test("sortDynamicItems: booleans sort false<true in asc", () => {
	const out = sortDynamicItems({ by: "/s" }, makeItems([{ s: true }, { s: false }, { s: true }, { s: false }]));
	assert.deepEqual(out, [{ s: false }, { s: false }, { s: true }, { s: true }]);
});

test("sortDynamicItems: booleans sort true<false in desc", () => {
	const out = sortDynamicItems({ by: "/s", order: "desc" }, makeItems([{ s: false }, { s: true }, { s: false }]));
	assert.deepEqual(out, [{ s: true }, { s: false }, { s: false }]);
});

test("sortDynamicItems: STABLE ties preserve input order (asc)", () => {
	const items = [{ s: 2, t: "a" }, { s: 1, t: "b" }, { s: 2, t: "c" }, { s: 1, t: "d" }];
	const out = sortDynamicItems({ by: "/s" }, items);
	assert.deepEqual(out, [{ s: 1, t: "b" }, { s: 1, t: "d" }, { s: 2, t: "a" }, { s: 2, t: "c" }]);
});

test("sortDynamicItems: STABLE ties preserve input order (desc)", () => {
	const items = [{ s: 2, t: "a" }, { s: 1, t: "b" }, { s: 2, t: "c" }, { s: 1, t: "d" }];
	const out = sortDynamicItems({ by: "/s", order: "desc" }, items);
	assert.deepEqual(out, [{ s: 2, t: "a" }, { s: 2, t: "c" }, { s: 1, t: "b" }, { s: 1, t: "d" }]);
});

test("sortDynamicItems: missing key sorts LAST regardless of asc/desc", () => {
	const asc = sortDynamicItems({ by: "/s" }, makeItems([{ s: 2 }, {}, { s: 1 }, {}]));
	assert.deepEqual(asc, [{ s: 1 }, { s: 2 }, {}, {}]);
	const desc = sortDynamicItems({ by: "/s", order: "desc" }, makeItems([{ s: 2 }, {}, { s: 1 }, {}]));
	assert.deepEqual(desc, [{ s: 2 }, { s: 1 }, {}, {}]);
});

test("sortDynamicItems: non-scalar key (object) sorts last", () => {
	const asc = sortDynamicItems({ by: "/s" }, makeItems([{ s: { nested: 1 } }, { s: 2 }, { s: 1 }]));
	assert.deepEqual(asc, [{ s: 1 }, { s: 2 }, { s: { nested: 1 } }]);
});

test("sortDynamicItems: non-scalar key (array, null) sorts last", () => {
	const asc = sortDynamicItems({ by: "/s" }, makeItems([{ s: [1, 2] }, { s: null }, { s: 3 }]));
	assert.deepEqual(asc, [{ s: 3 }, { s: [1, 2] }, { s: null }]);
});

test("sortDynamicItems: different-type keys fall back to String compare (deterministic)", () => {
	const asc = sortDynamicItems({ by: "/s" }, makeItems([{ s: 10 }, { s: "2" }, { s: true }]));
	// String(10)="10", String("2")="2", String(true)="true". "10"<"2"<"true".
	assert.deepEqual(asc, [{ s: 10 }, { s: "2" }, { s: true }]);
});

test("sortDynamicItems: input array is NOT mutated", () => {
	const items = [{ s: 3 }, { s: 1 }, { s: 2 }];
	const snapshot = JSON.parse(JSON.stringify(items));
	sortDynamicItems({ by: "/s" }, items);
	assert.deepEqual(items, snapshot);
});

test("sortDynamicItems: nested pointer resolution", () => {
	const out = sortDynamicItems({ by: "/meta/score", order: "desc" }, makeItems([
		{ meta: { score: 0.5 } },
		{ meta: { score: 0.9 } },
		{ meta: { score: 0.1 } },
	]));
	assert.deepEqual(out, [{ meta: { score: 0.9 } }, { meta: { score: 0.5 } }, { meta: { score: 0.1 } }]);
});

// ---------------------------------------------------------------------------
// validateDynamicStepShape: sort + top
// ---------------------------------------------------------------------------

function dynamicStep(expandOverrides: Record<string, unknown>, maxItems = 5): DynamicParallelStep {
	const expand = {
		from: { output: "prev", path: "/items" },
		maxItems,
		...expandOverrides,
	};
	return {
		expand,
		parallel: { agent: "worker" },
		collect: { as: "results" },
	} as DynamicParallelStep;
}

test("validateDynamicStepShape: accepts sort asc", () => {
	assert.doesNotThrow(() => validateDynamicStepShape(dynamicStep({ sort: { by: "/severity", order: "asc" } })));
});

test("validateDynamicStepShape: accepts sort desc", () => {
	assert.doesNotThrow(() => validateDynamicStepShape(dynamicStep({ sort: { by: "/severity", order: "desc" } })));
});

test("validateDynamicStepShape: accepts sort without order", () => {
	assert.doesNotThrow(() => validateDynamicStepShape(dynamicStep({ sort: { by: "/severity" } })));
});

test("validateDynamicStepShape: accepts top alone (no sort)", () => {
	assert.doesNotThrow(() => validateDynamicStepShape(dynamicStep({ top: 3 })));
});

test("validateDynamicStepShape: accepts sort + top", () => {
	assert.doesNotThrow(() => validateDynamicStepShape(dynamicStep({ sort: { by: "/score", order: "desc" }, top: 3 })));
});

test("validateDynamicStepShape: accepts sort + filter", () => {
	assert.doesNotThrow(() => validateDynamicStepShape(dynamicStep({
		sort: { by: "/score", order: "desc" },
		filter: { path: "/severity", equals: "high" },
	})));
});

test("validateDynamicStepShape: accepts sort + join + filter + top all together", () => {
	assert.doesNotThrow(() => validateDynamicStepShape(dynamicStep({
		join: [{ output: "prev2", path: "/items", on: "/id", as: "owner" }],
		sort: { by: "/owner/name", order: "asc" },
		filter: { path: "/owner/active", equals: true },
		top: 2,
	})));
});

test("validateDynamicStepShape: REJECTS sort not an object", () => {
	assert.throws(() => validateDynamicStepShape(dynamicStep({ sort: "by:/score" } as never)), /must be an object/);
});

test("validateDynamicStepShape: REJECTS sort unknown key", () => {
	assert.throws(() => validateDynamicStepShape(dynamicStep({ sort: { by: "/s", direction: "desc" } as unknown as DynamicSortSpec })), /does not support field 'direction'/);
});

test("validateDynamicStepShape: REJECTS sort.by missing", () => {
	assert.throws(() => validateDynamicStepShape(dynamicStep({ sort: { order: "asc" } as unknown as DynamicSortSpec })), /requires string by/);
});

test("validateDynamicStepShape: REJECTS sort.by non-string", () => {
	assert.throws(() => validateDynamicStepShape(dynamicStep({ sort: { by: 42 } as unknown as DynamicSortSpec })), /requires string by/);
});

test("validateDynamicStepShape: REJECTS sort.by empty", () => {
	assert.throws(() => validateDynamicStepShape(dynamicStep({ sort: { by: "" } })), /expand\.sort\.by must not be empty/);
});

test("validateDynamicStepShape: REJECTS sort.by bad pointer (no leading /)", () => {
	assert.throws(() => validateDynamicStepShape(dynamicStep({ sort: { by: "score" } })), /must be a JSON Pointer starting with '\/'/);
});

test("validateDynamicStepShape: REJECTS sort.order invalid", () => {
	assert.throws(() => validateDynamicStepShape(dynamicStep({ sort: { by: "/s", order: "up" } })), /must be 'asc' or 'desc'/);
});

test("validateDynamicStepShape: REJECTS top not integer (1.5)", () => {
	assert.throws(() => validateDynamicStepShape(dynamicStep({ top: 1.5 })), /expand\.top must be an integer >= 1/);
});

test("validateDynamicStepShape: REJECTS top = 0", () => {
	assert.throws(() => validateDynamicStepShape(dynamicStep({ top: 0 })), /expand\.top must be an integer >= 1/);
});

test("validateDynamicStepShape: REJECTS top = -1", () => {
	assert.throws(() => validateDynamicStepShape(dynamicStep({ top: -1 })), /expand\.top must be an integer >= 1/);
});

// ---------------------------------------------------------------------------
// validateChainInput reachability
// ---------------------------------------------------------------------------

test("validateChainInput: accepts a chain with dynamic step that uses expand.sort + expand.top", () => {
	const input = {
		chain: [
			{ agent: "scanner", output: "src", outputSchema: { type: "object" } },
			{
				expand: {
					from: { output: "src", path: "/items" },
					sort: { by: "/score", order: "desc" },
					top: 3,
					maxItems: 10,
				},
				parallel: { agent: "analyst", task: "Review {item.id}" },
				collect: { as: "results" },
			},
		],
	};
	assert.doesNotThrow(() => {
		validateChainInput(input);
		validateDynamicStepShape(input.chain[1] as unknown as DynamicParallelStep, 1, { maxItems: 10 });
	});
});

test("validateChainInput: still REJECTS an unknown expand field (e.g. sorts)", () => {
	const input = {
		chain: [
			{
				expand: {
					from: { output: "src", path: "/items" },
					sorts: { by: "/score" },
					maxItems: 5,
				},
				parallel: { agent: "worker" },
				collect: { as: "results" },
			},
		],
	};
	assert.throws(() => validateChainInput(input));
});

// ---------------------------------------------------------------------------
// resolveDynamicFanoutItems: end-to-end pipeline behavior
// ---------------------------------------------------------------------------

function buildOutputs(items: unknown[]): ChainOutputMap {
	return {
		prev: {
			text: JSON.stringify({ items }),
			structured: { items },
			agent: "scanner",
			stepIndex: 0,
		},
	};
}

test("resolveDynamicFanoutItems: sort reorders and items[].index reflects sorted order", () => {
	const items = [
		{ id: "a", score: 30 },
		{ id: "b", score: 10 },
		{ id: "c", score: 20 },
	];
	const step = dynamicStep({ sort: { by: "/score", order: "asc" } }, 5);
	const out = resolveDynamicFanoutItems(step, buildOutputs(items), 1);
	assert.deepEqual(out.map((e) => (e.item as { id: string }).id), ["b", "c", "a"]);
	// Indices reflect post-sort position (0,1,2), but original source index should appear via itemKey? Here key defaults to String(index) of post-sort position.
	assert.deepEqual(out.map((e) => e.index), [0, 1, 2]);
});

test("resolveDynamicFanoutItems: top slices to best N post-sort (desc)", () => {
	const items = [
		{ id: "a", score: 10 },
		{ id: "b", score: 30 },
		{ id: "c", score: 20 },
		{ id: "d", score: 40 },
	];
	const step = dynamicStep({ sort: { by: "/score", order: "desc" }, top: 2 }, 5);
	const out = resolveDynamicFanoutItems(step, buildOutputs(items), 1);
	assert.deepEqual(out.map((e) => (e.item as { id: string }).id), ["d", "b"]);
});

test("resolveDynamicFanoutItems: top WITHOUT sort takes first N in source order", () => {
	const items = [
		{ id: "a", score: 10 },
		{ id: "b", score: 30 },
		{ id: "c", score: 20 },
	];
	const step = dynamicStep({ top: 2 }, 5);
	const out = resolveDynamicFanoutItems(step, buildOutputs(items), 1);
	assert.deepEqual(out.map((e) => (e.item as { id: string }).id), ["a", "b"]);
});

test("resolveDynamicFanoutItems: filter THEN sort removes some, remaining sorted", () => {
	const items = [
		{ id: "a", severity: "high", score: 5 },
		{ id: "b", severity: "low", score: 100 },
		{ id: "c", severity: "high", score: 20 },
		{ id: "d", severity: "high", score: 10 },
	];
	const step = dynamicStep({
		filter: { path: "/severity", equals: "high" },
		sort: { by: "/score", order: "asc" },
	}, 10);
	const out = resolveDynamicFanoutItems(step, buildOutputs(items), 1);
	assert.deepEqual(out.map((e) => (e.item as { id: string }).id), ["a", "d", "c"]);
});

test("resolveDynamicFanoutItems: maxItems guard still THROWS when post-top count > maxItems", () => {
	const items = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
	const step = dynamicStep({ top: 4 }, 2);
	assert.throws(() => resolveDynamicFanoutItems(step, buildOutputs(items), 1), /exceeding maxItems 2/);
});

test("resolveDynamicFanoutItems: top brings an over-maxItems filtered set UNDER the cap (no throw)", () => {
	const items = [
		{ severity: "high" }, { severity: "low" }, { severity: "high" },
		{ severity: "low" }, { severity: "high" }, { severity: "low" },
		{ severity: "high" }, { severity: "low" },
	];
	const step = dynamicStep({
		filter: { path: "/severity", equals: "high" },
		top: 3,
	}, 5);
	const out = resolveDynamicFanoutItems(step, buildOutputs(items), 1);
	assert.equal(out.length, 3);
});

test("resolveDynamicFanoutItems: expand.key resolving against items works post-sort", () => {
	const items = [
		{ id: "b", score: 10 },
		{ id: "a", score: 20 },
	];
	const step = dynamicStep({ sort: { by: "/score", order: "desc" } }, 5) as DynamicParallelStep;
	// Cast: key is added by the helper
	const stepWithKey: DynamicParallelStep = {
		...step,
		expand: { ...step.expand, key: "/id" },
	};
	const out = resolveDynamicFanoutItems(stepWithKey, buildOutputs(items), 1);
	// Sorted desc -> a first (score 20), then b (score 10). Keys come from /id.
	assert.deepEqual(out.map((e) => e.key), ["a", "b"]);
});

test("resolveDynamicFanoutItems: missing-key items appear last in materialized order", () => {
	const items = [
		{ id: "a", score: 10 },
		{ id: "b" /* missing score */ },
		{ id: "c", score: 30 },
		{ id: "d" /* missing score */ },
		{ id: "e", score: 20 },
	];
	const step = dynamicStep({ sort: { by: "/score", order: "asc" } }, 10);
	const out = resolveDynamicFanoutItems(step, buildOutputs(items), 1);
	assert.deepEqual(out.map((e) => (e.item as { id: string }).id), ["a", "e", "c", "b", "d"]);
});

test("resolveDynamicFanoutItems: NO mutation of source structured output", () => {
	const items = [
		{ id: "a", score: 30 },
		{ id: "b", score: 10 },
		{ id: "c", score: 20 },
	];
	const outputs = buildOutputs(items);
	const before = JSON.parse(JSON.stringify(outputs.prev?.structured));
	const step = dynamicStep({ sort: { by: "/score", order: "asc" }, top: 2 }, 5);
	resolveDynamicFanoutItems(step, outputs, 1);
	assert.deepEqual(outputs.prev?.structured, before);
});
