import type { ExtensionAPI, ToolResultEvent } from "@oh-my-pi/pi-coding-agent";
import { failedDiagnostics, normalizeEditDiagnostics, parseManualLspDiagnostics } from "./diagnostics.js";
import { renderDiagnosticStatus, renderManualCheckStatus, renderReadyStatus, type LensStatusView } from "./status.js";
import { extractTouchedFiles } from "./touched-files.js";

const STATUS_KEY = "omp-lens-lite.status";
const WIDGET_KEY = "omp-lens-lite.widget";

export default function (pi: ExtensionAPI) {
	let latestRunId = 0;

	pi.on("session_start", (_event, ctx) => {
		if (!ctx.hasUI) return;
		applyView(ctx, ++latestRunId, latestRunId, renderReadyStatus());
	});

	pi.on("tool_result", (event, ctx) => {
		if (!ctx.hasUI) return;
		if (!isLensToolResult(event)) return;

		const runId = ++latestRunId;
		if (event.isError) {
			applyView(ctx, runId, latestRunId, renderDiagnosticStatus(failedDiagnostics(`${event.toolName} failed`)));
			return;
		}

		if (event.toolName === "edit") {
			const files = extractTouchedFiles(event);
			const fallbackFile = files[0] ?? "unknown";
			const details = isRecord(event.details) ? event.details : undefined;
			const state = normalizeEditDiagnostics(details?.diagnostics, fallbackFile);
			applyView(ctx, runId, latestRunId, renderDiagnosticStatus(state));
			return;
		}

		if (event.toolName === "write") {
			applyView(ctx, runId, latestRunId, renderManualCheckStatus({ files: extractTouchedFiles(event) }));
			return;
		}

		if (event.toolName === "lsp" && event.input.action === "diagnostics") {
			const text = event.content.filter(part => part.type === "text").map(part => part.text).join("\n");
			const files = extractTouchedFiles(event);
			applyView(ctx, runId, latestRunId, renderDiagnosticStatus(parseManualLspDiagnostics(text, files[0] ?? "unknown")));
		}
	});
}

function isLensToolResult(event: ToolResultEvent): event is ToolResultEvent & { toolName: "edit" | "write" | "lsp" } {
	return event.toolName === "edit" || event.toolName === "write" || event.toolName === "lsp";
}

function applyView(
	ctx: { ui: { setStatus(key: string, text: string | undefined): void; setWidget(key: string, content: string[] | undefined, options?: { placement?: "belowEditor" }): void } },
	runId: number,
	latestRunId: number,
	view: LensStatusView,
): void {
	if (runId !== latestRunId) return;
	ctx.ui.setStatus(STATUS_KEY, view.statusText);
	ctx.ui.setWidget(WIDGET_KEY, view.widget, { placement: "belowEditor" });
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}
