import { describe, expect, test } from "bun:test";
import {
	normalizeEditDiagnostics,
	parseManualLspDiagnostics,
	type LensDiagnostic,
} from "../../.omp/agent/extensions/omp-lens-lite/diagnostics.js";
import {
	renderCheckingStatus,
	renderDiagnosticStatus,
	renderDiagnosticWidget,
	renderManualCheckStatus,
} from "../../.omp/agent/extensions/omp-lens-lite/status.js";

describe("omp-lens-lite diagnostics and status", () => {
	test("normalizes empty structured edit diagnostics as clean", () => {
		const state = normalizeEditDiagnostics({ messages: [], summary: "OK", errored: false }, "src/a.ts");
		expect(state.kind).toBe("clean");
		expect(state.summary).toBe("no issues");
		expect(renderDiagnosticStatus(state).statusText).toBe("lens: clean");
	});

	test("normalizes structured error and warning diagnostics into counts", () => {
		const state = normalizeEditDiagnostics({
			messages: [
				"src/a.ts:2:3 [error] [tsserver] Type 'string' is not assignable to type 'number'. (2322)",
				"src/a.ts:4:1 [warning] Unused variable",
			],
			summary: "1 error(s), 1 warning(s)",
			errored: true,
		});

		expect(state.counts).toEqual({ error: 1, warning: 1, info: 0, hint: 0 });
		expect(state.diagnostics[0]).toMatchObject({
			filePath: "src/a.ts",
			line: 2,
			column: 3,
			severity: "error",
			source: "tsserver",
			rule: "2322",
		});
		expect(renderDiagnosticStatus(state).statusText).toBe("lens: 1 error(s), 1 warning(s)");
	});

	test("parses manual LSP clean and summary outputs", () => {
		expect(parseManualLspDiagnostics("OK").kind).toBe("clean");
		expect(parseManualLspDiagnostics("✓ src/a.ts: no issues").kind).toBe("clean");
		const state = parseManualLspDiagnostics("1 error(s), 2 warning(s):\nsrc/a.ts:1:2 [error] Bad");
		expect(state.counts).toEqual({ error: 1, warning: 0, info: 0, hint: 0 });
		const summaryOnly = parseManualLspDiagnostics("1 error(s), 2 warning(s):");
		expect(summaryOnly.counts).toEqual({ error: 1, warning: 2, info: 0, hint: 0 });
	});

	test("renders all status chip states", () => {
		expect(renderCheckingStatus().statusText).toBe("lens: checking");
		expect(renderManualCheckStatus({ files: ["src/a.ts"] }).statusText).toBe("lens: manual check (1 file)");
		expect(renderDiagnosticStatus(parseManualLspDiagnostics("No language server found for this file")).statusText).toBe("lens: no LSP");
		expect(renderDiagnosticStatus(parseManualLspDiagnostics("src/a.ts:1:1 [warning] Warn")).statusText).toBe("lens: 1 warning(s)");
		expect(renderDiagnosticStatus(parseManualLspDiagnostics("src/a.ts:1:1 [error] Bad")).statusText).toBe("lens: 1 error(s)");
		expect(renderDiagnosticStatus({ kind: "failed", diagnostics: [], counts: { error: 0, warning: 0, info: 0, hint: 0 }, summary: "failed", message: "edit failed" }).statusText).toBe("lens: failed");
	});

	test("caps widget diagnostic output to five diagnostic lines", () => {
		const diagnostics: LensDiagnostic[] = Array.from({ length: 7 }, (_, index) => ({
			filePath: "src/a.ts",
			severity: "error",
			message: `Problem ${index}`,
			line: index + 1,
			column: 1,
		}));
		const widget = renderDiagnosticWidget({
			kind: "diagnostics",
			diagnostics,
			counts: { error: 7, warning: 0, info: 0, hint: 0 },
			summary: "7 error(s)",
		});
		expect(widget).toHaveLength(7);
		expect(widget?.[6]).toBe("... 2 more");
	});
});
