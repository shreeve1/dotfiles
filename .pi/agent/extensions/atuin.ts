/**
 * Atuin extension for pi.
 *
 * Tracks bash commands executed by pi in Atuin history with author `pi`.
 *
 * Install with:
 *   atuin hook install pi
 *
 * Then restart pi or run /reload.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const ATUIN_AUTHOR = "pi";
const ATUIN_TIMEOUT_MS = 10_000;

async function startHistory(
	pi: ExtensionAPI,
	cwd: string,
	command: string,
): Promise<string | undefined> {
	try {
		const result = await pi.exec(
			"atuin",
			["history", "start", "--author", ATUIN_AUTHOR, "--", command],
			{ cwd, timeout: ATUIN_TIMEOUT_MS },
		);

		if (result.code !== 0) return undefined;

		const id = result.stdout.trim();
		return id.length > 0 ? id : undefined;
	} catch {
		return undefined;
	}
}

async function endHistory(
	pi: ExtensionAPI,
	cwd: string,
	historyId: string,
	exitCode: number,
): Promise<void> {
	try {
		await pi.exec(
			"atuin",
			["history", "end", historyId, "--exit", String(exitCode)],
			{ cwd, timeout: ATUIN_TIMEOUT_MS },
		);
	} catch {
		// Ignore Atuin failures so command execution is never blocked.
	}
}

function textFromResult(result: unknown): string {
	if (!result || typeof result !== "object") return "";
	const content = (result as { content?: unknown }).content;
	if (!Array.isArray(content)) return "";
	return content
		.map((part) => {
			if (part && typeof part === "object" && (part as { type?: unknown }).type === "text") {
				return String((part as { text?: unknown }).text ?? "");
			}
			return "";
		})
		.join("\n");
}

function exitCodeFromResult(result: unknown, isError: boolean): number {
	const text = textFromResult(result);
	const match = text.match(/Command exited with code (\d+)/);
	if (match) return Number(match[1]);
	if (text.includes("Command aborted")) return 130;
	return isError ? 1 : 0;
}

export default function atuinPiExtension(pi: ExtensionAPI) {
	const activeHistory = new Map<string, { cwd: string; historyId: string }>();

	pi.on("tool_execution_start", async (event, ctx) => {
		if (event.toolName !== "bash") return;
		const command = (event.args as { command?: unknown })?.command;
		if (typeof command !== "string") return;

		const historyId = await startHistory(pi, ctx.cwd, command);
		if (historyId) activeHistory.set(event.toolCallId, { cwd: ctx.cwd, historyId });
	});

	pi.on("tool_execution_end", async (event) => {
		if (event.toolName !== "bash") return;
		const active = activeHistory.get(event.toolCallId);
		if (!active) return;

		activeHistory.delete(event.toolCallId);
		await endHistory(pi, active.cwd, active.historyId, exitCodeFromResult(event.result, event.isError));
	});

	pi.on("session_shutdown", async () => {
		for (const active of activeHistory.values()) {
			await endHistory(pi, active.cwd, active.historyId, 130);
		}
		activeHistory.clear();
	});
}
