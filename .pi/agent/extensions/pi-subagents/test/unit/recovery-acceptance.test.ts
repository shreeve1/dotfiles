import assert from "node:assert/strict";
import test from "node:test";
import { validateAcceptanceInput } from "../../src/runs/shared/acceptance.ts";

const levels = ["auto", "attested", "checked", "verified"] as const;

function roundTrip<T>(acceptance: T): T {
	const descriptor = {
		outputMode: "inline" as const,
		...(acceptance !== undefined ? { acceptance } : {}),
	};
	assert.deepEqual(validateAcceptanceInput(descriptor.acceptance), []);
	return JSON.parse(JSON.stringify(descriptor)).acceptance;
}

test("acceptance shorthand values survive recovery descriptor round-trip", () => {
	for (const acceptance of [false, ...levels]) {
		assert.deepEqual(roundTrip(acceptance), acceptance);
	}
});

test("acceptance object descriptors survive recovery descriptor round-trip", () => {
	const acceptance = {
		level: "verified",
		criteria: ["Run the verification command"],
	};
	assert.deepEqual(roundTrip(acceptance), acceptance);
});

test("recovery acceptance validation rejects reviewed and malformed descriptors", () => {
	assert.notDeepEqual(validateAcceptanceInput("reviewed"), []);
	assert.notDeepEqual(validateAcceptanceInput({ level: "verified", unknown: true }), []);
	assert.notDeepEqual(validateAcceptanceInput({ level: "verified", criteria: "not-an-array" }), []);
	assert.notDeepEqual(validateAcceptanceInput({ level: "verified", criteria: [42] }), []);
});

test("undefined acceptance is omitted from the recovery descriptor", () => {
	const descriptor = {
		outputMode: "inline" as const,
		...(undefined !== undefined ? { acceptance: undefined } : {}),
	};
	assert.equal("acceptance" in descriptor, false);
});
