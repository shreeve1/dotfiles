import { describe, expect, test } from "bun:test";
import type { ExtensionAPI, ExtensionContext, ToolResultEvent } from "@oh-my-pi/pi-coding-agent";
import registerLensLite from "../../.omp/agent/extensions/omp-lens-lite/index.js";

type ToolResultHandler = (event: ToolResultEvent, ctx: ExtensionContext) => void | Promise<void>;

interface CapturedUi {
	status: string | undefined;
	widget: string[] | undefined;
}

describe("omp-lens-lite event wiring", () => {
	test("successful edit refreshes structured diagnostics", async () => {
		const { handler, ctx, ui } = setupHarness();
		await handler(makeToolResult({
			toolName: "edit",
			input: {},
			details: {
				path: "src/a.ts",
				diagnostics: {
					messages: ["src/a.ts:1:2 [error] Bad type"],
					summary: "1 error(s)",
					errored: true,
				},
			},
		}), ctx);

		expect(ui.status).toBe("lens: 1 error(s)");
		expect(ui.widget?.[1]).toContain("src/a.ts:1:2 [error] Bad type");
	});

	test("clean edit clears stale widget", async () => {
		const { handler, ctx, ui } = setupHarness();
		ui.widget = ["old diagnostic"];
		await handler(makeToolResult({
			toolName: "edit",
			input: {},
			details: { path: "src/a.ts", diagnostics: { messages: [], summary: "OK", errored: false } },
		}), ctx);

		expect(ui.status).toBe("lens: clean");
		expect(ui.widget).toBeUndefined();
	});

	test("write reports neutral manual check without diagnostics", async () => {
		const { handler, ctx, ui } = setupHarness();
		await handler(makeToolResult({ toolName: "write", input: { path: "src/a.ts" }, details: undefined }), ctx);

		expect(ui.status).toBe("lens: manual check (1 file)");
		expect(ui.widget).toBeUndefined();
	});

	test("manual lsp diagnostics refreshes status and widget", async () => {
		const { handler, ctx, ui } = setupHarness();
		await handler(makeToolResult({
			toolName: "lsp",
			input: { action: "diagnostics", file: "src/a.ts" },
			contentText: "1 warning(s):\nsrc/a.ts:3:4 [warning] Careful",
			details: { action: "diagnostics", success: true },
		}), ctx);

		expect(ui.status).toBe("lens: 1 warning(s)");
		expect(ui.widget?.[1]).toContain("src/a.ts:3:4 [warning] Careful");
	});
});

function setupHarness(): { handler: ToolResultHandler; ctx: ExtensionContext; ui: CapturedUi } {
	let handler: ToolResultHandler | undefined;
	const api = {
		on(event: string, registered: ToolResultHandler): void {
			if (event === "tool_result") handler = registered;
		},
	} as unknown as ExtensionAPI; // Test harness only implements event registration used by extension.
	registerLensLite(api);
	if (!handler) throw new Error("tool_result handler not registered");

	const ui: CapturedUi = { status: undefined, widget: undefined };
	const ctx = {
		hasUI: true,
		ui: {
			setStatus(_key: string, text: string | undefined): void {
				ui.status = text;
			},
			setWidget(_key: string, content: string[] | undefined): void {
				ui.widget = content;
			},
		},
	} as unknown as ExtensionContext; // Test context provides only UI methods touched by handler.
	return { handler, ctx, ui };
}

function makeToolResult(options: {
	toolName: string;
	input: Record<string, unknown>;
	details: unknown;
	contentText?: string;
}): ToolResultEvent {
	return {
		type: "tool_result",
		toolCallId: "call-1",
		toolName: options.toolName,
		input: options.input,
		content: [{ type: "text", text: options.contentText ?? "OK" }],
		isError: false,
		details: options.details,
	} as unknown as ToolResultEvent; // Custom toolName test events intentionally exercise union boundary.
}
