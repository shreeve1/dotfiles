import assert from "node:assert/strict";
import test from "node:test";
import { applySalvage } from "../../src/shared/settings.ts";
import { validateChainInput } from "../../src/extension/chain-validation.ts";
import { validateDynamicStepShape } from "../../src/runs/shared/dynamic-fanout.ts";

const FINAL_TEXT = "Some unstructured final text from the agent.";

test("applySalvage: salvage unset does NOT salvage", () => {
	const result = applySalvage({
		salvage: undefined,
		otherErrors: [],
		structuredError: "Missing structured_output call",
		baseExitCode: 0,
		finalOutputText: FINAL_TEXT,
	});
	assert.equal(result.salvaged, false);
});

test("applySalvage: salvage=false does NOT salvage", () => {
	const result = applySalvage({
		salvage: false,
		otherErrors: [],
		structuredError: "Missing structured_output call",
		baseExitCode: 0,
		finalOutputText: FINAL_TEXT,
	});
	assert.equal(result.salvaged, false);
});

test("applySalvage: salvage=true with only structured failure returns { unstructured: <final text> }", () => {
	const result = applySalvage({
		salvage: true,
		otherErrors: [],
		structuredError: "Missing structured_output call",
		baseExitCode: 0,
		finalOutputText: FINAL_TEXT,
	});
	assert.equal(result.salvaged, true);
	assert.deepEqual(result.structuredOutput, { unstructured: FINAL_TEXT });
});

test("applySalvage: salvage=true salvages on schema-invalid structured failure (any structured error)", () => {
	const result = applySalvage({
		salvage: true,
		otherErrors: [],
		structuredError:
			"Structured output validation failed: root: expected string",
		baseExitCode: 0,
		finalOutputText: FINAL_TEXT,
	});
	assert.equal(result.salvaged, true);
	assert.deepEqual(result.structuredOutput, { unstructured: FINAL_TEXT });
});

test("applySalvage: salvage=true with another error present does NOT salvage", () => {
	const result = applySalvage({
		salvage: true,
		otherErrors: ["Subagent produced no output"],
		structuredError: "Missing structured_output call",
		baseExitCode: 0,
		finalOutputText: FINAL_TEXT,
	});
	assert.equal(result.salvaged, false);
});

test("applySalvage: salvage=true with baseExitCode !== 0 does NOT salvage", () => {
	const result = applySalvage({
		salvage: true,
		otherErrors: [],
		structuredError: "Missing structured_output call",
		baseExitCode: 2,
		finalOutputText: FINAL_TEXT,
	});
	assert.equal(result.salvaged, false);
});

test("applySalvage: salvage=true with no structuredError does NOT salvage", () => {
	const result = applySalvage({
		salvage: true,
		otherErrors: [],
		structuredError: undefined,
		baseExitCode: 0,
		finalOutputText: FINAL_TEXT,
	});
	assert.equal(result.salvaged, false);
});

test("applySalvage: salvage=true with multiple other errors (any set) does NOT salvage", () => {
	const result = applySalvage({
		salvage: true,
		otherErrors: [undefined, undefined, "completion guard error", undefined],
		structuredError: "Missing structured_output call",
		baseExitCode: 0,
		finalOutputText: FINAL_TEXT,
	});
	assert.equal(result.salvaged, false);
});

test("applySalvage: salvage=true with baseExitCode null does NOT salvage", () => {
	const result = applySalvage({
		salvage: true,
		otherErrors: [],
		structuredError: "Missing structured_output call",
		baseExitCode: null,
		finalOutputText: FINAL_TEXT,
	});
	assert.equal(result.salvaged, false);
});

test("applySalvage: salvage=string 'false' is rejected (strict ===true check)", () => {
	const result = applySalvage({
		salvage: "false" as unknown as boolean,
		otherErrors: [],
		structuredError: "Missing structured_output call",
		baseExitCode: 0,
		finalOutputText: FINAL_TEXT,
	});
	assert.equal(result.salvaged, false);
});

test("validateChainInput: accepts salvage=true on a sequential step", () => {
	assert.doesNotThrow(() =>
		validateChainInput({
			chain: [
				{
					agent: "worker",
					outputSchema: { type: "object" },
					salvage: true,
				},
			],
		}),
	);
});

test("validateChainInput: accepts salvage=true on a parallel task", () => {
	assert.doesNotThrow(() =>
		validateChainInput({
			chain: [
				{
					parallel: [
						{
							agent: "worker",
							outputSchema: { type: "object" },
							salvage: true,
						},
					],
				},
			],
		}),
	);
});

test("validateChainInput: accepts salvage=true on a dynamic parallel template", () => {
	const input = {
		chain: [
			{
				agent: "worker",
				output: "prev",
				outputSchema: { type: "object" },
			},
			{
				expand: { from: { output: "prev", path: "/items" }, maxItems: 5 },
				parallel: {
					agent: "worker",
					outputSchema: { type: "object" },
					salvage: true,
				},
				collect: { as: "results" },
			},
		],
	};
	assert.doesNotThrow(() => {
		validateChainInput(input);
		validateDynamicStepShape(input.chain[1] as never, 1);
	});
});
