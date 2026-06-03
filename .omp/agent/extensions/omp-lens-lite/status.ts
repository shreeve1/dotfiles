import type { LensDiagnostic, LensDiagnosticState, LensCounts } from "./diagnostics.js";

export type LensStatusKind = "ready" | "checking" | "clean" | "warning" | "error" | "skipped" | "manual-check" | "failed";

export interface LensStatusView {
	kind: LensStatusKind;
	statusText: string;
	widget?: string[];
}

export interface ManualCheckOptions {
	files?: readonly string[];
}

const MAX_WIDGET_DIAGNOSTICS = 5;
const MAX_WIDGET_LINE_WIDTH = 120;

export function renderReadyStatus(): LensStatusView {
	return { kind: "ready", statusText: "lens: ready" };
}

export function renderCheckingStatus(): LensStatusView {
	return { kind: "checking", statusText: "lens: checking" };
}

export function renderManualCheckStatus(options: ManualCheckOptions = {}): LensStatusView {
	const suffix = options.files && options.files.length > 0 ? ` (${options.files.length} file${options.files.length === 1 ? "" : "s"})` : "";
	return { kind: "manual-check", statusText: `lens: manual check${suffix}` };
}

export function renderDiagnosticStatus(state: LensDiagnosticState): LensStatusView {
	if (state.kind === "failed") {
		return { kind: "failed", statusText: "lens: failed", widget: state.message ? [`lens: ${state.message}`] : undefined };
	}
	if (state.kind === "skipped") {
		return { kind: "skipped", statusText: "lens: no LSP" };
	}
	if (state.kind === "unknown") {
		return renderManualCheckStatus();
	}
	if (state.counts.error > 0) {
		return {
			kind: "error",
			statusText: `lens: ${formatStatusCounts(state.counts)}`,
			widget: renderDiagnosticWidget(state),
		};
	}
	if (state.counts.warning > 0 || state.counts.info > 0 || state.counts.hint > 0) {
		return {
			kind: "warning",
			statusText: `lens: ${formatStatusCounts(state.counts)}`,
			widget: renderDiagnosticWidget(state),
		};
	}
	return { kind: "clean", statusText: "lens: clean" };
}

export function renderDiagnosticWidget(state: LensDiagnosticState): string[] | undefined {
	if (state.diagnostics.length === 0) return undefined;
	const lines: string[] = [`lens diagnostics: ${state.summary}`];
	const limit = Math.min(state.diagnostics.length, MAX_WIDGET_DIAGNOSTICS);
	for (let index = 0; index < limit; index++) {
		lines.push(truncateLine(formatDiagnosticLine(state.diagnostics[index])));
	}
	if (state.diagnostics.length > MAX_WIDGET_DIAGNOSTICS) {
		lines.push(`... ${state.diagnostics.length - MAX_WIDGET_DIAGNOSTICS} more`);
	}
	return lines;
}

export function formatStatusCounts(counts: LensCounts): string {
	if (counts.error > 0) {
		return counts.warning > 0 ? `${counts.error} error(s), ${counts.warning} warning(s)` : `${counts.error} error(s)`;
	}
	if (counts.warning > 0) return `${counts.warning} warning(s)`;
	if (counts.info > 0) return `${counts.info} info(s)`;
	if (counts.hint > 0) return `${counts.hint} hint(s)`;
	return "clean";
}

function formatDiagnosticLine(diagnostic: LensDiagnostic): string {
	const location = diagnostic.line === undefined ? diagnostic.filePath : `${diagnostic.filePath}:${diagnostic.line}:${diagnostic.column ?? 1}`;
	const source = diagnostic.source ? ` [${diagnostic.source}]` : "";
	const rule = diagnostic.rule ? ` (${diagnostic.rule})` : "";
	return `${location} [${diagnostic.severity}]${source} ${diagnostic.message}${rule}`;
}

function truncateLine(line: string): string {
	if (line.length <= MAX_WIDGET_LINE_WIDTH) return line;
	return `${line.slice(0, MAX_WIDGET_LINE_WIDTH - 1)}…`;
}
