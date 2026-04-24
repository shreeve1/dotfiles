/**
 * Atuin + UV extension for pi.
 *
 * Single bash tool registration that combines:
 *   - Atuin history tracking (author `pi`) around every bash command.
 *   - UV guardrails: pip/pip3/poetry/`python -m {pip,venv,py_compile}` are
 *     blocked before execution with messages pointing at uv equivalents.
 *   - UV PATH shim: prepends ../intercepted-commands to PATH so explicit
 *     python tool calls resolve to shim scripts when present.
 *
 * Merged because pi rejects two extensions registering the same tool name.
 *
 * NOTE: Re-running `atuin hook install pi` will overwrite this file and
 * drop the uv guardrails. If that happens, restore this merged version.
 */

import type { BashOperations, ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { createBashTool, createLocalBashOperations } from "@mariozechner/pi-coding-agent";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ATUIN_AUTHOR = "pi";
const ATUIN_TIMEOUT_MS = 10_000;

const __dirname = dirname(fileURLToPath(import.meta.url));
const interceptedCommandsPath = join(__dirname, "..", "intercepted-commands");

function getBlockedCommandMessage(command: string): string | null {
	const pipCommandPattern = /(?:^|\n|[;|&]{1,2})\s*(?:\S+\/)?pip\s*(?:$|\s)/m;
	const pip3CommandPattern = /(?:^|\n|[;|&]{1,2})\s*(?:\S+\/)?pip3\s*(?:$|\s)/m;
	const poetryCommandPattern = /(?:^|\n|[;|&]{1,2})\s*(?:\S+\/)?poetry\s*(?:$|\s)/m;
	const pythonPipPattern =
		/(?:^|\n|[;|&]{1,2})\s*(?:\S+\/)?python(?:3(?:\.\d+)?)?\b[^\n;|&]*(?:\s-m\s*pip\b|\s-mpip\b)/m;
	const pythonVenvPattern =
		/(?:^|\n|[;|&]{1,2})\s*(?:\S+\/)?python(?:3(?:\.\d+)?)?\b[^\n;|&]*(?:\s-m\s*venv\b|\s-mvenv\b)/m;
	const pythonPyCompilePattern =
		/(?:^|\n|[;|&]{1,2})\s*(?:\S+\/)?python(?:3(?:\.\d+)?)?\b[^\n;|&]*(?:\s-m\s*py_compile\b|\s-mpy_compile\b)/m;

	if (pipCommandPattern.test(command)) {
		return [
			"Error: pip is disabled. Use uv instead:",
			"",
			"  To install a package for a script: uv run --with PACKAGE python script.py",
			"  To add a dependency to the project: uv add PACKAGE",
			"",
		].join("\n");
	}

	if (pip3CommandPattern.test(command)) {
		return [
			"Error: pip3 is disabled. Use uv instead:",
			"",
			"  To install a package for a script: uv run --with PACKAGE python script.py",
			"  To add a dependency to the project: uv add PACKAGE",
			"",
		].join("\n");
	}

	if (poetryCommandPattern.test(command)) {
		return [
			"Error: poetry is disabled. Use uv instead:",
			"",
			"  To initialize a project: uv init",
			"  To add a dependency: uv add PACKAGE",
			"  To sync dependencies: uv sync",
			"  To run commands: uv run COMMAND",
			"",
		].join("\n");
	}

	if (pythonPipPattern.test(command)) {
		return [
			"Error: 'python -m pip' is disabled. Use uv instead:",
			"",
			"  To install a package for a script: uv run --with PACKAGE python script.py",
			"  To add a dependency to the project: uv add PACKAGE",
			"",
		].join("\n");
	}

	if (pythonVenvPattern.test(command)) {
		return [
			"Error: 'python -m venv' is disabled. Use uv instead:",
			"",
			"  To create a virtual environment: uv venv",
			"",
		].join("\n");
	}

	if (pythonPyCompilePattern.test(command)) {
		return [
			"Error: 'python -m py_compile' is disabled because it writes .pyc files to __pycache__.",
			"",
			"  To verify syntax without bytecode output: uv run python -m ast path/to/file.py >/dev/null",
			"",
		].join("\n");
	}

	return null;
}

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

export default function atuinPiExtension(pi: ExtensionAPI) {
	const cwd = process.cwd();
	const local = createLocalBashOperations();

	const trackedOperations: BashOperations = {
		async exec(command, commandCwd, options) {
			const historyId = await startHistory(pi, commandCwd, command);
			let exitCode: number | null = null;

			try {
				const result = await local.exec(command, commandCwd, options);
				exitCode = result.exitCode;
				return result;
			} finally {
				if (historyId) {
					await endHistory(
						pi,
						commandCwd,
						historyId,
						exitCode ?? (options.signal?.aborted ? 130 : 1),
					);
				}
			}
		},
	};

	pi.registerTool(
		createBashTool(cwd, {
			operations: trackedOperations,
			commandPrefix: `export PATH="${interceptedCommandsPath}:$PATH"`,
			spawnHook: (ctx) => {
				const blockedMessage = getBlockedCommandMessage(ctx.command);
				if (blockedMessage) {
					throw new Error(blockedMessage);
				}
				return ctx;
			},
		}),
	);
}
