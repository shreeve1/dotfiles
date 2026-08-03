import assert from "node:assert/strict";
import test from "node:test";
import type { DynamicJoinSpec, DynamicParallelStep } from "../../src/shared/settings.ts";
import { validateChainInput } from "../../src/extension/chain-validation.ts";
import { ChainOutputValidationError, validateChainOutputBindings } from "../../src/runs/shared/chain-outputs.ts";
import {
	enrichItemWithJoin,
	resolveDynamicFanoutItems,
	validateDynamicStepShape,
} from "../../src/runs/shared/dynamic-fanout.ts";
import type { ChainOutputMap } from "../../src/shared/types.ts";

function joinSpec(overrides: Partial<DynamicJoinSpec> = {}): DynamicJoinSpec {
	return {
		output: "reviews",
		path: "/items",
		on: "/path",
		as: "review",
		...overrides,
	};
}

function dynamicStep(join: DynamicJoinSpec[] | undefined, extra: Record<string, unknown> = {}): DynamicParallelStep {
	return {
		expand: {
			from: { output: "files", path: "/items" },
			maxItems: 20,
			...(join !== undefined ? { join } : {}),
			...extra,
		},
		parallel: { agent: "worker" },
		collect: { as: "results" },
	} as DynamicParallelStep;
}

test("enrichItemWithJoin: matches on shared key and binds the secondary object", () => {
	const item = { path: "/a", owner: "x" };
	const secondary = [{ path: "/a", severity: "high" }, { path: "/b", severity: "low" }];
	const out = enrichItemWithJoin(joinSpec({ as: "review" }), item, secondary);
	assert.deepEqual(out, { path: "/a", owner: "x", review: { path: "/a", severity: "high" } });
});

test("enrichItemWithJoin: unmatched item binds null (left-join, item kept)", () => {
	const item = { path: "/missing" };
	const secondary = [{ filePath: "/a", severity: "high" }];
	const out = enrichItemWithJoin(joinSpec(), item, secondary);
	assert.deepEqual(out, { path: "/missing", review: null });
});

test("enrichItemWithJoin: match defaults to on when omitted", () => {
	const item = { path: "/a" };
	const secondary = [{ path: "/a", note: "matched by on" }, { path: "/b", note: "skipped" }];
	const out = enrichItemWithJoin(joinSpec({ on: "/path", match: undefined }), item, secondary);
	assert.deepEqual(out, { path: "/a", review: secondary[0] });
});

test("enrichItemWithJoin: match differs from on", () => {
	const item = { id: 7 };
	const secondary = [{ externalId: 7, note: "matched by match" }];
	const out = enrichItemWithJoin(joinSpec({ on: "/id", match: "/externalId" }), item, secondary);
	assert.deepEqual(out, { id: 7, review: secondary[0] });
});

test("enrichItemWithJoin: first match wins when two secondaries collide", () => {
	const item = { id: 1 };
	const first = { id: 1, note: "first" };
	const second = { id: 1, note: "second" };
	const out = enrichItemWithJoin(joinSpec({ on: "/id", match: "/id" }), item, [first, second]);
	assert.deepEqual(out, { id: 1, review: first });
});

test("enrichItemWithJoin: missing right key on a secondary element is skipped", () => {
	const item = { id: 1 };
	const secondary = [{}, { id: 1, note: "only valid match" }, { id: 1, note: "later dup" }];
	const out = enrichItemWithJoin(joinSpec({ on: "/id", match: "/id" }), item, secondary);
	assert.deepEqual(out, { id: 1, review: secondary[1] });
});

test("enrichItemWithJoin: missing on-key on primary binds null", () => {
	const item = { owner: "x" };
	const secondary = [{ id: 1 }];
	const out = enrichItemWithJoin(joinSpec(), item, secondary);
	assert.deepEqual(out, { owner: "x", review: null });
});

test("enrichItemWithJoin: strict scalar equality (\"1\" !== 1)", () => {
	const item = { id: 1 };
	const secondary = [{ id: "1" }];
	const out = enrichItemWithJoin(joinSpec(), item, secondary);
	assert.deepEqual(out, { id: 1, review: null });
});

test("enrichItemWithJoin: non-scalar left key (object) => unmatched null", () => {
	const item = { id: { nested: 1 } };
	const secondary = [{ id: { nested: 1 } }];
	const out = enrichItemWithJoin(joinSpec(), item, secondary);
	assert.deepEqual(out, { id: { nested: 1 }, review: null });
});

test("enrichItemWithJoin: non-scalar right key candidate is skipped", () => {
	const item = { id: 1 };
	const secondary = [{ id: { nested: 1 } }, { id: 1, ok: true }];
	const out = enrichItemWithJoin(joinSpec({ on: "/id", match: "/id" }), item, secondary);
	assert.deepEqual(out, { id: 1, review: secondary[1] });
});

test("enrichItemWithJoin: returns a NEW object; original is untouched", () => {
	const item = { path: "/a" };
	const secondary = [{ path: "/a", ok: true }];
	const out = enrichItemWithJoin(joinSpec(), item, secondary);
	assert.notEqual(out, item);
	assert.equal("review" in item, false);
});

test("enrichItemWithJoin: overwrite — join value wins over pre-existing field", () => {
	const item = { path: "/a", review: "STALE" };
	const secondary = [{ path: "/a", severity: "high" }];
	const out = enrichItemWithJoin(joinSpec(), item, secondary);
	assert.deepEqual(out, { path: "/a", review: secondary[0] });
});

test("validateDynamicStepShape: accepts a single join", () => {
	assert.doesNotThrow(() => validateDynamicStepShape(dynamicStep([joinSpec()]), 1));
});

test("validateDynamicStepShape: accepts multiple joins with distinct as", () => {
	assert.doesNotThrow(() => validateDynamicStepShape(dynamicStep([
		joinSpec({ as: "review" }),
		joinSpec({ as: "owner", output: "owners", path: "/items", on: "/path" }),
	]), 1));
});

test("validateDynamicStepShape: accepts join + filter together (filter on joined field)", () => {
	const step = dynamicStep([joinSpec()], { filter: { path: "/review/severity", in: ["high"] } });
	assert.doesNotThrow(() => validateDynamicStepShape(step, 1));
});

test("validateDynamicStepShape: allows `as` equal to item name", () => {
	assert.doesNotThrow(() => validateDynamicStepShape({
		expand: {
			from: { output: "files", path: "/items" },
			item: "item",
			maxItems: 5,
			join: [joinSpec({ as: "item" })],
		},
		parallel: { agent: "worker" },
		collect: { as: "results" },
	} as DynamicParallelStep, 1));
});

test("validateDynamicStepShape: allows `as` equal to a reserved template name", () => {
	assert.doesNotThrow(() => validateDynamicStepShape(dynamicStep([joinSpec({ as: "previous" })]), 1));
});

test("validateDynamicStepShape: rejects a non-array join", () => {
	assert.throws(
		() => validateDynamicStepShape(dynamicStep("not-an-array" as unknown as DynamicJoinSpec[]), 1),
		/expand\.join must be an array/,
	);
});

test("validateDynamicStepShape: rejects an empty join array", () => {
	assert.throws(
		() => validateDynamicStepShape(dynamicStep([]), 1),
		/expand\.join must not be empty/,
	);
});

test("validateDynamicStepShape: rejects an unknown field in a join spec", () => {
	assert.throws(
		() => validateDynamicStepShape(dynamicStep([{ ...joinSpec(), extra: "x" } as DynamicJoinSpec]), 1),
		/does not support field 'extra'/,
	);
});

test("validateDynamicStepShape: rejects an invalid output name", () => {
	assert.throws(
		() => validateDynamicStepShape(dynamicStep([joinSpec({ output: "9bad" })]), 1),
		/has invalid output/,
	);
});

test("validateDynamicStepShape: rejects missing or non-string path", () => {
	assert.throws(
		() => validateDynamicStepShape(dynamicStep([joinSpec({ path: undefined as unknown as string })]), 1),
		/requires string path/,
	);
	assert.throws(
		() => validateDynamicStepShape(dynamicStep([joinSpec({ path: 7 as unknown as string })]), 1),
		/requires string path/,
	);
});

test("validateDynamicStepShape: rejects a path without leading slash", () => {
	assert.throws(
		() => validateDynamicStepShape(dynamicStep([joinSpec({ path: "items" })]), 1),
		/must be a JSON Pointer starting with '\/'/,
	);
});

test("validateDynamicStepShape: rejects missing or empty on", () => {
	assert.throws(
		() => validateDynamicStepShape(dynamicStep([joinSpec({ on: undefined as unknown as string })]), 1),
		/requires string on/,
	);
	assert.throws(
		() => validateDynamicStepShape(dynamicStep([joinSpec({ on: "" })]), 1),
		/\.on must not be empty/,
	);
});

test("validateDynamicStepShape: rejects a bad pointer on", () => {
	assert.throws(
		() => validateDynamicStepShape(dynamicStep([joinSpec({ on: "path" })]), 1),
		/JSON Pointer starting with '\/'/,
	);
});

test("validateDynamicStepShape: rejects non-string or empty match", () => {
	assert.throws(
		() => validateDynamicStepShape(dynamicStep([joinSpec({ match: 5 as unknown as string })]), 1),
		/\.match must be a string/,
	);
	assert.throws(
		() => validateDynamicStepShape(dynamicStep([joinSpec({ match: "" })]), 1),
		/\.match must not be empty/,
	);
});

test("validateDynamicStepShape: rejects invalid or missing as", () => {
	assert.throws(
		() => validateDynamicStepShape(dynamicStep([joinSpec({ as: "a-b" })]), 1),
		/has invalid as 'a-b'/,
	);
	assert.throws(
		() => validateDynamicStepShape(dynamicStep([joinSpec({ as: undefined as unknown as string })]), 1),
		/has invalid as/,
	);
});

test("validateDynamicStepShape: rejects duplicate as across joins", () => {
	assert.throws(
		() => validateDynamicStepShape(dynamicStep([
			joinSpec({ as: "review" }),
			joinSpec({ as: "review", output: "owners", path: "/items", on: "/path" }),
		]), 1),
		/duplicate as 'review'/,
	);
});

test("validateChainInput: accepts a chain whose dynamic step has expand.join", () => {
	const input = {
		chain: [
			{
				agent: "worker",
				output: "files",
				outputSchema: { type: "object", properties: { items: { type: "array" } } },
			},
			{
				agent: "worker",
				output: "reviews",
				outputSchema: { type: "object", properties: { items: { type: "array" } } },
			},
			{
				expand: {
					from: { output: "files", path: "/items" },
					join: [{ output: "reviews", path: "/items", on: "/path", as: "review" }],
					maxItems: 5,
				},
				parallel: { agent: "worker" },
				collect: { as: "results" },
			},
		],
	};
	assert.doesNotThrow(() => {
		validateChainInput(input);
		validateDynamicStepShape(input.chain[2] as DynamicParallelStep, 2);
	});
});

test("validateChainInput: still rejects a genuinely unknown expand field (schema-not-loosened guard)", () => {
	const input = {
		chain: [
			{
				agent: "worker",
				output: "files",
				outputSchema: { type: "object" },
			},
			{
				expand: {
					from: { output: "files", path: "/items" },
					joins: [{ output: "reviews", path: "/items", on: "/path", as: "review" }],
					maxItems: 5,
				},
				parallel: { agent: "worker" },
				collect: { as: "results" },
			},
		],
	};
	assert.throws(() => validateChainInput(input), /does not support field 'joins'|joins" is not allowed|"joins" is not allowed/);
});

test("validateChainOutputBindings: accepts join referencing a prior step output", () => {
	const steps = [
		{ agent: "w", as: "files", task: "t", outputSchema: { type: "object" } },
		{ agent: "w", as: "reviews", task: "t", outputSchema: { type: "object" } },
		dynamicStep([joinSpec()]),
	];
	assert.doesNotThrow(() => validateChainOutputBindings(steps, { maxItems: 100 }));
});

test("validateChainOutputBindings: rejects join referencing an unknown output", () => {
	const steps = [
		{ agent: "w", as: "files", task: "t", outputSchema: { type: "object" } },
		dynamicStep([joinSpec({ output: "never_produced" })]),
	];
	assert.throws(
		() => validateChainOutputBindings(steps, { maxItems: 100 }),
		(instance: unknown) => instance instanceof ChainOutputValidationError && /join references unknown output 'never_produced'/.test((instance as Error).message),
	);
});

test("validateChainOutputBindings: rejects join referencing a forward (later step) output", () => {
	const steps = [
		{ agent: "w", as: "files", task: "t", outputSchema: { type: "object" } },
		dynamicStep([joinSpec({ output: "future" })]),
		{ agent: "w", as: "future", task: "t", outputSchema: { type: "object" } },
	];
	assert.throws(
		() => validateChainOutputBindings(steps, { maxItems: 100 }),
		(instance: unknown) => instance instanceof ChainOutputValidationError && /join references unknown output 'future'/.test((instance as Error).message),
	);
});

test("validateChainOutputBindings: rejects join referencing this step's own collect.as", () => {
	const steps = [
		{ agent: "w", as: "files", task: "t", outputSchema: { type: "object" } },
		{
			expand: {
				from: { output: "files", path: "/items" },
				join: [joinSpec({ output: "results", path: "/items", on: "/path", as: "review" })],
				maxItems: 5,
			},
			parallel: { agent: "worker" },
			collect: { as: "results" },
		} as DynamicParallelStep,
	];
	assert.throws(
		() => validateChainOutputBindings(steps, { maxItems: 100 }),
		(instance: unknown) => instance instanceof ChainOutputValidationError && /join references unknown output 'results'/.test((instance as Error).message),
	);
});

test("resolveDynamicFanoutItems: single join enriches every item", () => {
	const files = [{ path: "/a" }, { path: "/b" }];
	const reviews = [{ path: "/a", severity: "high" }, { path: "/b", severity: "low" }];
	const outputs: ChainOutputMap = {
		files: { text: "", agent: "w", stepIndex: 0, structured: { items: files } },
		reviews: { text: "", agent: "w", stepIndex: 1, structured: { items: reviews } },
	};
	const result = resolveDynamicFanoutItems(dynamicStep([joinSpec()]), outputs, 2, { maxItems: 100 });
	assert.deepEqual(result.map((entry) => (entry.item as Record<string, unknown>).review), [reviews[0], reviews[1]]);
});

test("resolveDynamicFanoutItems: multi-join applies in order", () => {
	const files = [{ path: "/a" }];
	const reviews = [{ path: "/a", severity: "high" }];
	const owners = [{ path: "/a", name: "alice" }];
	const outputs: ChainOutputMap = {
		files: { text: "", agent: "w", stepIndex: 0, structured: { items: files } },
		reviews: { text: "", agent: "w", stepIndex: 1, structured: { items: reviews } },
		owners: { text: "", agent: "w", stepIndex: 2, structured: { items: owners } },
	};
	const step = dynamicStep([
		joinSpec({ as: "review", output: "reviews", path: "/items", on: "/path" }),
		joinSpec({ as: "owner", output: "owners", path: "/items", on: "/path" }),
	]);
	const result = resolveDynamicFanoutItems(step, outputs, 3, { maxItems: 100 });
	const enriched = result[0]!.item as Record<string, unknown>;
	assert.equal(enriched.review, reviews[0]);
	assert.equal(enriched.owner, owners[0]);
});

test("resolveDynamicFanoutItems: left-join keeps unmatched items with as=null", () => {
	const files = [{ path: "/a" }, { path: "/missing" }];
	const reviews = [{ path: "/a", severity: "high" }];
	const outputs: ChainOutputMap = {
		files: { text: "", agent: "w", stepIndex: 0, structured: { items: files } },
		reviews: { text: "", agent: "w", stepIndex: 1, structured: { items: reviews } },
	};
	const result = resolveDynamicFanoutItems(dynamicStep([joinSpec()]), outputs, 2, { maxItems: 100 });
	assert.equal(result.length, 2);
	assert.equal((result[1]!.item as Record<string, unknown>).review, null);
});

test("resolveDynamicFanoutItems: join-then-filter selects the right subset (proves order)", () => {
	const files = [{ path: "/a" }, { path: "/b" }, { path: "/c" }];
	const reviews = [{ path: "/a", severity: "high" }, { path: "/b", severity: "low" }, { path: "/c", severity: "critical" }];
	const outputs: ChainOutputMap = {
		files: { text: "", agent: "w", stepIndex: 0, structured: { items: files } },
		reviews: { text: "", agent: "w", stepIndex: 1, structured: { items: reviews } },
	};
	const step = dynamicStep([joinSpec()], { filter: { path: "/review/severity", in: ["high", "critical"] } });
	const result = resolveDynamicFanoutItems(step, outputs, 2, { maxItems: 100 });
	assert.deepEqual(result.map((entry) => (entry.item as Record<string, unknown>).path), ["/a", "/c"]);
});

test("resolveDynamicFanoutItems: inner-join-via-filter excludes null-joined items", () => {
	const files = [{ path: "/a" }, { path: "/missing" }];
	const reviews = [{ path: "/a", severity: "high" }];
	const outputs: ChainOutputMap = {
		files: { text: "", agent: "w", stepIndex: 0, structured: { items: files } },
		reviews: { text: "", agent: "w", stepIndex: 1, structured: { items: reviews } },
	};
	const step = dynamicStep([joinSpec()], { filter: { path: "/review/severity", equals: "high" } });
	const result = resolveDynamicFanoutItems(step, outputs, 2, { maxItems: 100 });
	assert.equal(result.length, 1);
	assert.equal((result[0]!.item as Record<string, unknown>).path, "/a");
});

test("resolveDynamicFanoutItems: does NOT mutate source outputs", () => {
	const files = [{ path: "/a", review: "ORIGINAL" }];
	const reviews = [{ path: "/a", severity: "high" }];
	const outputs: ChainOutputMap = {
		files: { text: "", agent: "w", stepIndex: 0, structured: { items: files } },
		reviews: { text: "", agent: "w", stepIndex: 1, structured: { items: reviews } },
	};
	const filesBefore = JSON.parse(JSON.stringify(outputs.files!.structured));
	const reviewsBefore = JSON.parse(JSON.stringify(outputs.reviews!.structured));
	resolveDynamicFanoutItems(dynamicStep([joinSpec()]), outputs, 2, { maxItems: 100 });
	assert.deepEqual(outputs.files!.structured, filesBefore);
	assert.deepEqual(outputs.reviews!.structured, reviewsBefore);
	assert.notEqual((files[0] as Record<string, unknown>).review, reviews[0]);
});

test("resolveDynamicFanoutItems: maxItems is enforced on POST-join/filter count", () => {
	const files = Array.from({ length: 10 }, (_, index) => ({ path: `/p${index}` }));
	const reviews = files.map((file, index) => ({ path: file.path, severity: index % 2 === 0 ? "high" : "low" }));
	const outputs: ChainOutputMap = {
		files: { text: "", agent: "w", stepIndex: 0, structured: { items: files } },
		reviews: { text: "", agent: "w", stepIndex: 1, structured: { items: reviews } },
	};
	const step = dynamicStep([joinSpec()], { filter: { path: "/review/severity", equals: "high" }, maxItems: 3 });
	assert.throws(
		() => resolveDynamicFanoutItems(step, outputs, 2, { maxItems: 100 }),
		/exceeding maxItems 3/,
	);
});

test("resolveDynamicFanoutItems: expand.key pointing at a joined field resolves post-enrich", () => {
	const files = [{ path: "/a" }, { path: "/b" }];
	const reviews = [{ path: "/a", severity: "high" }, { path: "/b", severity: "low" }];
	const outputs: ChainOutputMap = {
		files: { text: "", agent: "w", stepIndex: 0, structured: { items: files } },
		reviews: { text: "", agent: "w", stepIndex: 1, structured: { items: reviews } },
	};
	const step: DynamicParallelStep = {
		expand: {
			from: { output: "files", path: "/items" },
			join: [joinSpec()],
			key: "/review/severity",
			maxItems: 10,
		},
		parallel: { agent: "worker" },
		collect: { as: "results" },
	};
	const result = resolveDynamicFanoutItems(step, outputs, 2, { maxItems: 100 });
	assert.deepEqual(result.map((entry) => entry.key), ["high", "low"]);
});

test("resolveDynamicFanoutItems: non-object primary element with join present throws", () => {
	const files = [{ path: "/a" }, "not-an-object", 42, null];
	const reviews = [{ path: "/a", severity: "high" }];
	const outputs: ChainOutputMap = {
		files: { text: "", agent: "w", stepIndex: 0, structured: { items: files } },
		reviews: { text: "", agent: "w", stepIndex: 1, structured: { items: reviews } },
	};
	assert.throws(
		() => resolveDynamicFanoutItems(dynamicStep([joinSpec()]), outputs, 2, { maxItems: 100 }),
		/requires object items but item 1 is not an object/,
	);
});

test("resolveDynamicFanoutItems: later join can key on a field added by an earlier join", () => {
	const files = [{ path: "/a" }];
	const reviews = [{ path: "/a", severity: "high" }];
	const tags = [{ severity: "high", label: "urgent" }];
	const outputs: ChainOutputMap = {
		files: { text: "", agent: "w", stepIndex: 0, structured: { items: files } },
		reviews: { text: "", agent: "w", stepIndex: 1, structured: { items: reviews } },
		tags: { text: "", agent: "w", stepIndex: 2, structured: { items: tags } },
	};
	const step = dynamicStep([
		joinSpec({ as: "review", output: "reviews", path: "/items", on: "/path" }),
		joinSpec({ as: "tag", output: "tags", path: "/items", on: "/review/severity", match: "/severity" }),
	]);
	const result = resolveDynamicFanoutItems(step, outputs, 3, { maxItems: 100 });
	const enriched = result[0]!.item as Record<string, unknown>;
	assert.equal(enriched.review, reviews[0]);
	assert.equal(enriched.tag, tags[0]);
});
