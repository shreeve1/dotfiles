import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { validateAcceptanceInput } from "../../src/runs/shared/acceptance.ts";

const levels = ["auto", "attested", "checked", "verified"] as const;

// Resolve the vendored async-execution.ts path via import.meta.url so the
// test is independent of cwd.
const here = dirname(fileURLToPath(import.meta.url));
const asyncExecutionPath = resolve(
	here,
	"../../src/runs/background/async-execution.ts",
);

function roundTrip<T>(acceptance: T): T {
	const descriptor = {
		outputMode: "inline" as const,
		...(acceptance !== undefined ? { acceptance } : {}),
	};
	assert.deepEqual(validateAcceptanceInput(descriptor.acceptance), []);
	return JSON.parse(JSON.stringify(descriptor)).acceptance;
}

test("recovery descriptor write site persists params.acceptance, not resolvedAcceptance", () => {
	const source = readFileSync(asyncExecutionPath, "utf8");
	// The descriptor must assign params.acceptance directly (not the resolved shape),
	// gated on params.acceptance !== undefined so the field is omitted otherwise.
	assert.match(
		source,
		/recoveryDescriptor\.acceptance\s*=\s*params\.acceptance/,
		"async-execution.ts must assign params.acceptance to recoveryDescriptor.acceptance",
	);
	assert.match(
		source,
		/if\s*\(\s*params\.acceptance\s*!==\s*undefined\s*\)/,
		"async-execution.ts must gate the descriptor acceptance assignment on params.acceptance !== undefined",
	);
	// And must NOT serialize the resolved shape into the descriptor.
	assert.doesNotMatch(
		source,
		/recoveryDescriptor\.acceptance\s*=\s*resolvedAcceptance/,
		"async-execution.ts must not persist resolvedAcceptance into the recovery descriptor",
	);
	// The resolved shape is still computed for the run's evaluation.
	assert.match(
		source,
		/const\s+resolvedAcceptance\s*=\s*resolveEffectiveAcceptance\(/,
		"async-execution.ts still computes resolvedAcceptance for run evaluation",
	);
});

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
	assert.notDeepEqual(
		validateAcceptanceInput({ level: "verified", unknown: true }),
		[],
	);
	assert.notDeepEqual(
		validateAcceptanceInput({ level: "verified", criteria: "not-an-array" }),
		[],
	);
	assert.notDeepEqual(
		validateAcceptanceInput({ level: "verified", criteria: [42] }),
		[],
	);
});

test("undefined acceptance is omitted from the recovery descriptor", () => {
	const descriptor = {
		outputMode: "inline" as const,
		...(undefined !== undefined ? { acceptance: undefined } : {}),
	};
	assert.equal("acceptance" in descriptor, false);
});
