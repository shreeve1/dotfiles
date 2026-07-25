import assert from "node:assert/strict";
import test from "node:test";
import { resolveCompletionGuard } from "../../src/runs/shared/completion-guard.ts";

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
