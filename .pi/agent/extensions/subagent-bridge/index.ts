import * as fs from "node:fs";
import * as path from "node:path";
import type {
	ExtensionAPI,
	ExtensionCommandContext,
	ExtensionContext,
	Theme,
} from "@earendil-works/pi-coding-agent";
import type { Component, TUI } from "@earendil-works/pi-tui";
import {
	matchesKey,
	truncateToWidth,
	visibleWidth,
} from "@earendil-works/pi-tui";
import { formatActivityStatus } from "../shared/activity-status.ts";
import {
	SUBAGENT_ASYNC_COMPLETE_EVENT,
	SUBAGENT_ASYNC_STARTED_EVENT,
	SUBAGENT_CONTROL_EVENT,
	SUBAGENT_FOREGROUND_COMPLETE_EVENT,
	type AsyncStartedEvent,
	type AsyncStatus,
} from "../pi-subagents/src/shared/types.ts";
import { readStatus } from "../pi-subagents/src/shared/utils.ts";
import { reconcileAsyncRun } from "../pi-subagents/src/runs/background/stale-run-reconciler.ts";

const STATUS_KEY = "subagents";
const MAX_FINISHED = 20;

type RunState = AsyncStatus["state"];
interface Run {
	runId: string;
	mode: string;
	agents: string[];
	startedAt: number;
	asyncDir?: string;
	state: RunState;
	finishedAt?: number;
	steps?: AsyncStatus["steps"];
}

function elapsed(ms: number) {
	const seconds = Math.max(0, Math.floor(ms / 1000));
	return seconds < 60
		? `${seconds}s`
		: `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function isActive(state: RunState) {
	// Paused is terminal per pi-subagents' stale-run-reconciler `terminal()` helper;
	// it must not inflate the footer's running count.
	return state === "queued" || state === "running";
}

function safeReadStatus(asyncDir: string): AsyncStatus | undefined {
	try {
		return readStatus(asyncDir);
	} catch {
		return undefined;
	}
}

function payload(value: unknown): Record<string, unknown> {
	return value && typeof value === "object"
		? (value as Record<string, unknown>)
		: {};
}

const OUTPUT_TAIL_BYTES = 64 * 1024;
const OUTPUT_TAIL_LINES = 30;

function safeLine(text: string): string {
	return text.replace(/[\r\n]/g, " ").replace(/[\x00-\x08\x0b-\x1f\x7f]/g, "");
}

function firstLine(text: string): string {
	return safeLine(text.split(/\r?\n/, 1)[0] ?? "");
}

function safeOutputTail(filePath: string): string[] | undefined {
	let fd: number | undefined;
	try {
		const stat = fs.statSync(filePath);
		if (!stat.isFile()) return undefined;
		if (!stat.size) return [];
		const size = Math.min(stat.size, OUTPUT_TAIL_BYTES);
		const buffer = Buffer.alloc(size);
		fd = fs.openSync(filePath, "r");
		fs.readSync(fd, buffer, 0, size, stat.size - size);
		const lines = buffer.toString("utf8").split(/\r?\n/);
		if (stat.size > size) lines.shift();
		while (lines.at(-1) === "") lines.pop();
		return lines.slice(-OUTPUT_TAIL_LINES).map(safeLine);
	} catch {
		return undefined;
	} finally {
		if (fd !== undefined) {
			try {
				fs.closeSync(fd);
			} catch {
				/* Best-effort UI read. */
			}
		}
	}
}

interface OutputSnapshot {
	source?: string;
	lines: string[];
}

function readOutputSnapshot(
	run: Run,
	status: AsyncStatus | undefined,
): OutputSnapshot {
	if (!run.asyncDir) return { lines: [] };
	const configured = status?.outputFile
		? path.isAbsolute(status.outputFile)
			? status.outputFile
			: path.resolve(run.asyncDir, status.outputFile)
		: undefined;
	const candidates = [
		configured,
		path.join(run.asyncDir, "output-0.log"),
	].filter((value): value is string => Boolean(value));
	for (const candidate of [...new Set(candidates)]) {
		const lines = safeOutputTail(candidate);
		if (lines !== undefined) return { source: candidate, lines };
	}
	return { source: configured, lines: [] };
}

class FleetSnapshot implements Component {
	private tui: TUI;
	private theme: Theme;
	private done: (value: null) => void;
	private runs: Run[];
	private now: number;
	private mode: "list" | "detail" = "list";
	private selection = 0;
	private detailRun?: Run;
	private detailStatus?: AsyncStatus;
	private detailOutput: OutputSnapshot = { lines: [] };

	constructor(
		tui: TUI,
		theme: Theme,
		done: (value: null) => void,
		runs: Run[],
		now: number,
	) {
		this.tui = tui;
		this.theme = theme;
		this.done = done;
		this.runs = runs;
		this.now = now;
	}

	handleInput(data: string) {
		try {
			if (matchesKey(data, "ctrl+c") || matchesKey(data, "q")) {
				this.done(null);
				return;
			}
			if (this.mode === "detail") {
				if (matchesKey(data, "escape") || matchesKey(data, "backspace")) {
					this.mode = "list";
					this.detailRun = undefined;
					this.detailStatus = undefined;
					this.detailOutput = { lines: [] };
					this.tui.requestRender();
				}
				return;
			}
			if (matchesKey(data, "escape")) {
				this.done(null);
				return;
			}
			if (matchesKey(data, "up") || matchesKey(data, "k")) {
				if (this.runs.length) {
					this.selection =
						(this.selection - 1 + this.runs.length) % this.runs.length;
					this.tui.requestRender();
				}
				return;
			}
			if (matchesKey(data, "down") || matchesKey(data, "j")) {
				if (this.runs.length) {
					this.selection = (this.selection + 1) % this.runs.length;
					this.tui.requestRender();
				}
				return;
			}
			if (matchesKey(data, "enter")) {
				const run = this.runs[this.selection];
				if (!run) return;
				this.detailRun = run;
				this.detailStatus = run.asyncDir
					? safeReadStatus(run.asyncDir)
					: undefined;
				this.detailOutput = readOutputSnapshot(run, this.detailStatus);
				this.mode = "detail";
				this.tui.requestRender();
			}
		} catch {
			/* The inspector must never break the parent TUI. */
		}
	}

	private pad(text: string, width: number): string {
		const truncated = truncateToWidth(text, width);
		return truncated + " ".repeat(Math.max(0, width - visibleWidth(truncated)));
	}

	private listBody(bodyHeight: number): string[] {
		const body: string[] = ["↑/↓ select · Enter inspect · Esc/q close", ""];
		if (!this.runs.length) return [...body, "No tracked subagent runs"];

		const capacity = Math.max(0, bodyHeight - body.length);
		let start = 0;
		if (this.runs.length > capacity) {
			start = Math.min(
				Math.max(0, this.selection - Math.floor(capacity / 2)),
				this.runs.length - capacity,
			);
		}
		for (let i = start; i < Math.min(this.runs.length, start + capacity); i++) {
			const run = this.runs[i];
			const duration = (run.finishedAt ?? this.now) - run.startedAt;
			const row = safeLine(
				`${run.runId.slice(0, 8)}  ${run.mode}  ${run.agents.join(", ") || "?"}  ${run.state}  ${elapsed(duration)}`,
			);
			body.push(
				i === this.selection ? this.theme.fg("accent", `❯ ${row}`) : `  ${row}`,
			);
		}
		return body;
	}

	private withHeadOverflow(lines: string[], capacity: number): string[] {
		if (capacity <= 0) return [];
		if (lines.length <= capacity) return lines;
		if (capacity === 1) return [`… +${lines.length} more`];
		return [
			...lines.slice(0, capacity - 1),
			`… +${lines.length - capacity + 1} more`,
		];
	}

	private withTailOverflow(lines: string[], capacity: number): string[] {
		if (capacity <= 0) return [];
		if (lines.length <= capacity) return lines;
		if (capacity === 1) return [`… +${lines.length} more`];
		return [
			`… +${lines.length - capacity + 1} more`,
			...lines.slice(-(capacity - 1)),
		];
	}

	private detailBody(bodyHeight: number): string[] {
		const run = this.detailRun;
		if (!run)
			return ["Esc/Backspace back · q/Ctrl+C close", "", "Run unavailable"];
		const status = this.detailStatus;
		const state = status?.state ?? run.state;
		const finishedAt = status?.endedAt ?? run.finishedAt;
		const duration = (finishedAt ?? this.now) - run.startedAt;
		const body = [
			"Esc/Backspace back · q/Ctrl+C close",
			"",
			safeLine(`Run ${run.runId}`),
			safeLine(
				`Mode ${run.mode} · State ${state} · Elapsed ${elapsed(duration)}`,
			),
			safeLine(`Agents ${run.agents.join(", ") || "?"}`),
		];
		if (status?.cwd) body.push(safeLine(`Cwd ${status.cwd}`));
		if (!run.asyncDir) {
			body.push(
				`Foreground completion${finishedAt ? ` · finishedAt ${new Date(finishedAt).toISOString()}` : ""}`,
				"Artifact/output path not tracked for this foreground run",
			);
		} else if (!status) {
			body.push(`Status unavailable · ${run.asyncDir}`);
		}

		const steps = status?.steps ?? run.steps ?? [];
		const stepLines = steps.length
			? steps.map((step, index) => {
					const activity =
						step.currentTool || step.currentPath
							? ` · ${step.currentTool ?? "activity"}${step.currentPath ? ` ${step.currentPath}` : ""}`
							: "";
					const model = step.model ? ` · ${step.model}` : "";
					const error =
						step.status === "failed" && step.error
							? ` · error: ${firstLine(step.error)}`
							: "";
					return safeLine(
						`${index + 1}. ${step.agent} · ${step.status}${activity} · turns ${step.turnCount ?? 0} · tools ${step.toolCount ?? 0}${model}${error}`,
					);
				})
			: ["(no step details)"];
		const outputLines = this.detailOutput.lines.length
			? this.detailOutput.lines.map((line) => `  ${line}`)
			: ["(no output captured)"];

		body.push("", "Steps");
		const sectionChrome = 3;
		const contentCapacity = Math.max(
			0,
			bodyHeight - body.length - sectionChrome,
		);
		const stepCapacity =
			contentCapacity <= 1
				? contentCapacity
				: Math.max(
						1,
						Math.min(stepLines.length, Math.floor(contentCapacity / 2)),
					);
		const outputCapacity = Math.max(0, contentCapacity - stepCapacity);
		body.push(...this.withHeadOverflow(stepLines, stepCapacity));
		body.push(
			"",
			`Output tail · ${safeLine(this.detailOutput.source ?? "none")}`,
			...this.withTailOverflow(outputLines, outputCapacity),
		);
		return body;
	}

	private renderFrame(
		width: number,
		bodyHeight: number,
		body: string[],
	): string[] {
		const innerWidth = Math.max(0, width - 2);
		const theme = this.theme;
		const border = (s: string) => theme.fg("border", s);
		const title =
			this.mode === "detail" ? " Subagent run " : " Subagent fleet ";
		const label = truncateToWidth(title, Math.max(0, innerWidth - 2));
		const labelWidth = visibleWidth(label);
		const topBorder =
			border("╭") +
			border("─") +
			theme.fg("text", label) +
			border("─".repeat(Math.max(0, innerWidth - 1 - labelWidth))) +
			border("╮");
		const lines: string[] = [topBorder];
		const divider = border("│");
		for (let i = 0; i < bodyHeight; i++) {
			lines.push(divider + this.pad(body[i] ?? "", innerWidth) + divider);
		}
		lines.push(border("╰" + "─".repeat(innerWidth) + "╯"));
		return lines;
	}

	render(width: number): string[] {
		try {
			const rows = this.tui.terminal.rows || 30;
			// Keep the existing full-screen frame and leave pi's final footer visible.
			const bodyHeight = Math.max(0, rows - 3);
			const body =
				this.mode === "detail"
					? this.detailBody(bodyHeight)
					: this.listBody(bodyHeight);
			return this.renderFrame(width, bodyHeight, body);
		} catch {
			return ["/fleet rendering unavailable"];
		}
	}

	invalidate() {}
}

export default function (pi: ExtensionAPI) {
	if (process.env.PI_SUBAGENT_CHILD === "1") return;

	const runs = new Map<string, Run>();
	let ctx: ExtensionContext | undefined;
	let poller: ReturnType<typeof setInterval> | undefined;

	const safely = (fn: () => void) => {
		try {
			fn();
		} catch {
			/* Headless sessions do not expose a usable UI. */
		}
	};

	const refreshStatus = () => {
		const values = [...runs.values()];
		const counts = {
			running: values.filter((run) => isActive(run.state)).length,
			done: values.filter((run) => run.state === "complete").length,
			failed: values.filter(
				(run) => run.state === "failed" || run.state === "stopped",
			).length,
		};
		safely(() =>
			ctx?.ui.setStatus(
				STATUS_KEY,
				values.length && ctx
					? formatActivityStatus(ctx.ui.theme, "subagents", counts)
					: undefined,
			),
		);
	};

	const trim = () => {
		const finished = [...runs.values()]
			.filter((run) => !isActive(run.state))
			.sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));
		for (const run of finished.slice(MAX_FINISHED)) runs.delete(run.runId);
	};

	const refreshRuns = () => {
		for (const run of runs.values()) {
			if (!run.asyncDir || !isActive(run.state)) continue;
			// Mirror the invocation used by pi-subagents'
			// runs/background/async-status.ts:291 — reconcileAsyncRun defaults to
			// process.kill, Date.now, and the shared RESULTS_DIR. A throw must never
			// escape the poll loop (safeReadStatus is the same try/catch shape).
			let status: AsyncStatus | undefined;
			try {
				status = reconcileAsyncRun(run.asyncDir)?.status;
			} catch {
				/* Best-effort self-heal; fall back to plain status read. */
			}
			status ??= safeReadStatus(run.asyncDir);
			if (!status) continue;
			run.state = status.state;
			run.steps = status.steps;
			run.startedAt = status.startedAt || run.startedAt;
			if (!isActive(status.state))
				run.finishedAt = status.endedAt ?? Date.now();
		}
		trim();
		refreshStatus();
		const active = [...runs.values()].some((run) => isActive(run.state));
		if (active && !poller) {
			poller = setInterval(refreshRuns, 1500);
			poller.unref?.();
		} else if (!active && poller) {
			clearInterval(poller);
			poller = undefined;
		}
	};

	const complete = (value: unknown) => {
		const event = payload(value);
		const runId = String(event.runId ?? event.id ?? "");
		if (!runId) return;
		const existing = runs.get(runId);
		const status = existing?.asyncDir
			? safeReadStatus(existing.asyncDir)
			: null;
		const state =
			status?.state ??
			(event.state === "complete" || event.success === true
				? "complete"
				: "failed");
		runs.set(runId, {
			runId,
			mode: String(event.mode ?? existing?.mode ?? "single"),
			agents:
				existing?.agents ??
				(typeof event.agent === "string" ? [event.agent] : []),
			startedAt:
				existing?.startedAt ??
				Number(event.startedAt ?? event.timestamp ?? Date.now()),
			asyncDir: existing?.asyncDir,
			state,
			finishedAt: status?.endedAt ?? Number(event.timestamp ?? Date.now()),
			steps: status?.steps ?? existing?.steps,
		});
		refreshRuns();
	};

	const eventUnsubscribes = [
		pi.events.on(SUBAGENT_ASYNC_STARTED_EVENT, (value) => {
			const event = value as AsyncStartedEvent;
			const runId = event.id;
			if (!runId) return;
			runs.set(runId, {
				runId,
				mode: event.mode ?? "single",
				agents:
					event.agents ?? (event.agent ? [event.agent] : (event.chain ?? [])),
				startedAt: Date.now(),
				asyncDir: event.asyncDir,
				state: "running",
			});
			refreshRuns();
		}),
		pi.events.on(SUBAGENT_ASYNC_COMPLETE_EVENT, complete),
		pi.events.on(SUBAGENT_FOREGROUND_COMPLETE_EVENT, complete),
		pi.events.on(SUBAGENT_CONTROL_EVENT, refreshRuns),
	];

	pi.on("session_start", (_event, context) => {
		// /new or /resume within the same process must start with an empty tracked
		// set; mirror session_shutdown's cleanup minus the disposer teardown.
		if (poller) clearInterval(poller);
		poller = undefined;
		safely(() => ctx?.ui.setStatus(STATUS_KEY, undefined));
		runs.clear();
		ctx = context;
		refreshRuns();
	});
	pi.on("session_shutdown", () => {
		if (poller) clearInterval(poller);
		poller = undefined;
		safely(() => ctx?.ui.setStatus(STATUS_KEY, undefined));
		ctx = undefined;
		runs.clear();
		for (const unsubscribe of eventUnsubscribes) {
			try {
				unsubscribe();
			} catch {
				/* Best effort cleanup during shutdown. */
			}
		}
	});

	// pi-subagents owns /subagents; repository-wide registration scan found no /fleet.
	pi.registerCommand("fleet", {
		description: "Show recent subagent activity",
		handler: async (_args, commandCtx: ExtensionCommandContext) => {
			if (commandCtx.mode !== "tui") return;
			const snapshot = [...runs.values()]
				.map((run) => {
					const status = run.asyncDir ? safeReadStatus(run.asyncDir) : null;
					if (run.asyncDir && status === undefined)
						return { ...run, state: "unknown" as RunState };
					return status
						? { ...run, state: status.state, steps: status.steps }
						: { ...run };
				})
				.sort((a, b) => b.startedAt - a.startedAt);
			await commandCtx.ui.custom<null>(
				(tui, theme, _keys, done) =>
					new FleetSnapshot(tui, theme, done, snapshot, Date.now()),
				{
					overlay: true,
					overlayOptions: {
						anchor: "center",
						width: "100%",
						maxHeight: "100%",
					},
				},
			);
		},
	});
}
