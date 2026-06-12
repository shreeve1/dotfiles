import { describe, expect, test } from "bun:test";
import { dedupeAndFilter, extractTouchedFiles, isLikelySourcePath } from "../../.omp/agent/extensions/omp-lens-lite/touched-files.js";

describe("omp-lens-lite touched-file extraction", () => {
	test("extracts write target from input path only", () => {
		expect(extractTouchedFiles({ toolName: "write", input: { path: "src/a.ts" }, details: undefined })).toEqual(["src/a.ts"]);
		expect(extractTouchedFiles({ toolName: "write", input: { path: "" }, details: { diagnostics: [] } })).toEqual([]);
	});

	test("extracts edit targets from details path, per-file results, and move", () => {
		expect(extractTouchedFiles({
			toolName: "edit",
			input: {},
			details: {
				path: "src/a.ts",
				move: "src/b.ts",
				perFileResults: [{ path: "src/c.ts" }, { path: "src/a.ts" }, { move: "src/d.ts" }],
			},
		})).toEqual(["src/a.ts", "src/b.ts", "src/c.ts", "src/d.ts"]);
	});

	test("extracts edit targets from hashline fallback headers", () => {
		const input = "*** Begin Patch\n¶src/a.ts#ABCD\nreplace 1..1:\n+ok\n¶src/b.ts#1234\ndelete 2\n*** End Patch\n";
		expect(extractTouchedFiles({ toolName: "edit", input: { input } })).toEqual(["src/a.ts", "src/b.ts"]);
	});

	test("deduplicates paths while preserving first-seen order", () => {
		expect(dedupeAndFilter(["src/b.ts", "src/a.ts", "src/b.ts", "src/a.ts"])).toEqual(["src/b.ts", "src/a.ts"]);
	});

	test("filters runtime cache binary and directory paths", () => {
		expect(isLikelySourcePath("src/a.ts")).toBe(true);
		expect(isLikelySourcePath("Makefile")).toBe(true);
		expect(isLikelySourcePath("src/")).toBe(false);
		expect(isLikelySourcePath("node_modules/pkg/index.js")).toBe(false);
		expect(isLikelySourcePath(".git/config")).toBe(false);
		expect(isLikelySourcePath(".omp/agent/logs/omp.2026-06-03.log")).toBe(false);
		expect(isLikelySourcePath("tmp/session.sqlite")).toBe(false);
		expect(isLikelySourcePath("image.png")).toBe(false);
	});
});
