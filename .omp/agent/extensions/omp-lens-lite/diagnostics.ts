export type LensSeverity = "error" | "warning" | "info" | "hint" | "unknown";

export interface LensDiagnostic {
	filePath: string;
	severity: LensSeverity;
	message: string;
	line?: number;
	column?: number;
	source?: string;
	rule?: string;
}

export interface LensCounts {
	error: number;
	warning: number;
	info: number;
	hint: number;
}

export type LensDiagnosticStateKind = "clean" | "diagnostics" | "skipped" | "failed" | "unknown";

export interface LensDiagnosticState {
	kind: LensDiagnosticStateKind;
	diagnostics: LensDiagnostic[];
	counts: LensCounts;
	summary: string;
	message?: string;
}

export interface OmpFileDiagnosticsResult {
	server?: string;
	messages?: string[];
	summary?: string;
	errored?: boolean;
}

const EMPTY_COUNTS: LensCounts = { error: 0, warning: 0, info: 0, hint: 0 };
const SUMMARY_COUNT_RE = /(\d+)\s+(error|warning|info|hint)\(s\)/g;
const GREP_DIAGNOSTIC_RE = /^(.+?):(\d+):(\d+)\s+\[(error|warning|info|hint)\]\s+(.*)$/;
const GROUPED_FILE_RE = /^##\s+(.+)$/;
const GROUPED_DIR_RE = /^#\s+(.+)$/;
const GROUPED_DIAGNOSTIC_RE = /^\s*(\d+):(\d+)\s+\[(error|warning|info|hint)\]\s+(.*)$/;
const SOURCE_RE = /^\[([^\]]+)\]\s+(.*)$/;
const RULE_RE = /\s+\(([^()]+)\)$/;

export function emptyCounts(): LensCounts {
	return { ...EMPTY_COUNTS };
}

export function countDiagnostics(diagnostics: readonly LensDiagnostic[]): LensCounts {
	const counts = emptyCounts();
	for (const diagnostic of diagnostics) {
		if (diagnostic.severity === "error") counts.error++;
		else if (diagnostic.severity === "warning") counts.warning++;
		else if (diagnostic.severity === "info") counts.info++;
		else if (diagnostic.severity === "hint") counts.hint++;
	}
	return counts;
}

export function parseSummaryCounts(summary: string | undefined): LensCounts {
	const counts = emptyCounts();
	if (!summary) return counts;
	SUMMARY_COUNT_RE.lastIndex = 0;
	for (let match = SUMMARY_COUNT_RE.exec(summary); match; match = SUMMARY_COUNT_RE.exec(summary)) {
		counts[match[2] as keyof LensCounts] += Number(match[1]);
	}
	return counts;
}

export function hasCounts(counts: LensCounts): boolean {
	return counts.error > 0 || counts.warning > 0 || counts.info > 0 || counts.hint > 0;
}

export function summarizeCounts(counts: LensCounts): string {
	const parts: string[] = [];
	if (counts.error > 0) parts.push(`${counts.error} error(s)`);
	if (counts.warning > 0) parts.push(`${counts.warning} warning(s)`);
	if (counts.info > 0) parts.push(`${counts.info} info(s)`);
	if (counts.hint > 0) parts.push(`${counts.hint} hint(s)`);
	return parts.length === 0 ? "no issues" : parts.join(", ");
}

export function normalizeEditDiagnostics(
	result: OmpFileDiagnosticsResult | undefined,
	fallbackFilePath = "unknown",
): LensDiagnosticState {
	if (!result) {
		return { kind: "unknown", diagnostics: [], counts: emptyCounts(), summary: "manual check required" };
	}

	const diagnostics = parseDiagnosticMessages(result.messages ?? [], fallbackFilePath);
	const counts = diagnostics.length > 0 ? countDiagnostics(diagnostics) : parseSummaryCounts(result.summary);
	if (diagnostics.length === 0 && !hasCounts(counts)) {
		return { kind: "clean", diagnostics, counts, summary: "no issues" };
	}
	return { kind: "diagnostics", diagnostics, counts, summary: summarizeCounts(counts) };
}

export function parseManualLspDiagnostics(text: string, fallbackFilePath = "unknown"): LensDiagnosticState {
	const trimmed = text.trim();
	if (trimmed.length === 0 || trimmed === "OK") {
		return { kind: "clean", diagnostics: [], counts: emptyCounts(), summary: "no issues" };
	}
	if (trimmed.includes("No language server found")) {
		return {
			kind: "skipped",
			diagnostics: [],
			counts: emptyCounts(),
			summary: "no LSP",
			message: "No language server found",
		};
	}

	const diagnostics = parseDiagnosticMessages(trimmed.split(/\r?\n/), fallbackFilePath);
	const counts = diagnostics.length > 0 ? countDiagnostics(diagnostics) : parseSummaryCounts(trimmed);
	if (!hasCounts(counts)) {
		return { kind: "clean", diagnostics, counts, summary: "no issues" };
	}
	return { kind: "diagnostics", diagnostics, counts, summary: summarizeCounts(counts) };
}

export function failedDiagnostics(message: string): LensDiagnosticState {
	return { kind: "failed", diagnostics: [], counts: emptyCounts(), summary: "failed", message };
}

export function parseDiagnosticMessages(lines: readonly string[], fallbackFilePath = "unknown"): LensDiagnostic[] {
	const diagnostics: LensDiagnostic[] = [];
	let currentDir = "";
	let currentFile = fallbackFilePath;

	for (const rawLine of lines) {
		const line = rawLine.trimEnd();
		const dirMatch = GROUPED_DIR_RE.exec(line);
		if (dirMatch) {
			currentDir = dirMatch[1].trim();
			continue;
		}
		const fileMatch = GROUPED_FILE_RE.exec(line);
		if (fileMatch) {
			const file = fileMatch[1].trim();
			currentFile = currentDir && currentDir !== "." ? joinDisplayPath(currentDir, file) : file;
			continue;
		}

		const grepMatch = GREP_DIAGNOSTIC_RE.exec(line);
		if (grepMatch) {
			diagnostics.push(toDiagnostic(grepMatch[1], grepMatch[4] as LensSeverity, grepMatch[5], grepMatch[2], grepMatch[3]));
			continue;
		}

		const groupedMatch = GROUPED_DIAGNOSTIC_RE.exec(line);
		if (groupedMatch) {
			diagnostics.push(
				toDiagnostic(currentFile, groupedMatch[3] as LensSeverity, groupedMatch[4], groupedMatch[1], groupedMatch[2]),
			);
		}
	}
	return diagnostics;
}

function joinDisplayPath(dir: string, file: string): string {
	if (dir.endsWith("/")) return `${dir}${file}`;
	return `${dir}/${file}`;
}

function toDiagnostic(filePath: string, severity: LensSeverity, text: string, line: string, column: string): LensDiagnostic {
	let message = text.trim();
	let source: string | undefined;
	let rule: string | undefined;
	const sourceMatch = SOURCE_RE.exec(message);
	if (sourceMatch) {
		source = sourceMatch[1];
		message = sourceMatch[2];
	}
	const ruleMatch = RULE_RE.exec(message);
	if (ruleMatch) {
		rule = ruleMatch[1];
		message = message.slice(0, ruleMatch.index).trimEnd();
	}
	return {
		filePath,
		severity,
		message,
		line: Number(line),
		column: Number(column),
		source,
		rule,
	};
}
