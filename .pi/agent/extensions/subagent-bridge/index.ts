import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import type {
	ExtensionAPI,
	ExtensionCommandContext,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import {
	SUBAGENT_RPC_PROTOCOL_VERSION,
	SUBAGENT_RPC_REQUEST_EVENT,
	subagentRpcReplyEvent,
	type SubagentRpcReplyEnvelope,
} from "../pi-subagents/src/extension/rpc.ts";
import { formatActivityStatus } from "../shared/activity-status.ts";
import {
	SLASH_SUBAGENT_REQUEST_EVENT,
	SLASH_SUBAGENT_RESPONSE_EVENT,
	SUBAGENT_ASYNC_COMPLETE_EVENT,
	SUBAGENT_ASYNC_STARTED_EVENT,
	SUBAGENT_CONTROL_EVENT,
	SUBAGENT_FOREGROUND_COMPLETE_EVENT,
	type AsyncStartedEvent,
	type AsyncStatus,
} from "../pi-subagents/src/shared/types.ts";
import { readStatus } from "../pi-subagents/src/shared/utils.ts";
import { reconcileAsyncRun } from "../pi-subagents/src/runs/background/stale-run-reconciler.ts";
import {
	listActivityProviders,
	onRegistryChange,
	registerActivityProvider,
	type ActionResult,
	type ActivityAction,
	type ActivityItem,
	type ActivityProvider,
	type DetailSection,
} from "../hub-kit/registry.ts";
import {
	ListDetailView,
	type ListDetailEntry,
	type ListDetailResult,
} from "../hub-kit/ui/list-detail.ts";

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

interface BtwRun {
	question: string;
	askedAt: number;
	finishedAt?: number;
	state: "running" | "complete" | "failed";
	answer?: string;
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

function runToItem(run: Run): ActivityItem {
	return {
		id: run.runId,
		title: `${run.mode}  ${run.agents.join(", ") || "?"}`,
		state: run.state,
		startedAt: run.startedAt,
		finishedAt: run.finishedAt,
		meta: { run },
	};
}

function runFromItem(item: ActivityItem): Run | undefined {
	const run = item.meta?.run;
	return run && typeof run === "object" ? (run as Run) : undefined;
}

function buildDetailSections(run: Run): DetailSection[] {
	const status = run.asyncDir ? safeReadStatus(run.asyncDir) : undefined;
	const output = readOutputSnapshot(run, status);
	const state = status?.state ?? run.state;
	const finishedAt = status?.endedAt ?? run.finishedAt;
	const duration = (finishedAt ?? Date.now()) - run.startedAt;
	const metaLines = [
		safeLine(`Run ${run.runId}`),
		safeLine(
			`Mode ${run.mode} · State ${state} · Elapsed ${elapsed(duration)}`,
		),
		safeLine(`Agents ${run.agents.join(", ") || "?"}`),
	];
	if (status?.cwd) metaLines.push(safeLine(`Cwd ${status.cwd}`));
	if (!run.asyncDir) {
		metaLines.push(
			`Foreground completion${finishedAt ? ` · finishedAt ${new Date(finishedAt).toISOString()}` : ""}`,
			"Artifact/output path not tracked for this foreground run",
		);
	} else if (!status) {
		metaLines.push(`Status unavailable · ${run.asyncDir}`);
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
	const outputLines = output.lines.length
		? output.lines.map((line) => `  ${line}`)
		: ["(no output captured)"];

	return [
		{ lines: metaLines },
		{ title: "Steps", lines: stepLines, keep: "head" },
		{
			title: `Output tail · ${safeLine(output.source ?? "none")}`,
			lines: outputLines,
			keep: "tail",
		},
	];
}

export default function (pi: ExtensionAPI) {
	if (process.env.PI_SUBAGENT_CHILD === "1") return;

	const runs = new Map<string, Run>();
	const btwRuns = new Map<string, BtwRun>();
	let ctx: ExtensionContext | undefined;
	let poller: ReturnType<typeof setInterval> | undefined;

	const safely = (fn: () => void) => {
		try {
			fn();
		} catch {
			/* Headless sessions do not expose a usable UI. */
		}
	};

	// --- hub: footer aggregation + /fleet consume the activity registry ---

	const safeList = (provider: ActivityProvider): ActivityItem[] => {
		try {
			return provider.list();
		} catch {
			return [];
		}
	};
	const safeActions = (
		provider: ActivityProvider,
		item: ActivityItem,
	): ActivityAction[] => {
		try {
			return provider.actions?.(item) ?? [];
		} catch {
			return [];
		}
	};
	const safeDetail = (
		provider: ActivityProvider,
		item: ActivityItem,
	): DetailSection[] => {
		try {
			return provider.detail(item);
		} catch {
			return [{ lines: ["Detail unavailable"] }];
		}
	};

	const refreshFooter = () => {
		const providers = listActivityProviders();
		const counts = { running: 0, done: 0, failed: 0 };
		for (const provider of providers) {
			try {
				const c = provider.counts();
				counts.running += c.running;
				counts.done += c.done;
				counts.failed += c.failed;
			} catch {
				/* A broken provider must not take down the footer. */
			}
		}
		// Visibility matches the pre-registry footer: shown while anything is
		// tracked, even when every counted bucket is zero (e.g. all paused).
		// list() is only consulted when the cheap counts are all zero.
		const visible =
			counts.running + counts.done + counts.failed > 0 ||
			providers.some((provider) => safeList(provider).length > 0);
		safely(() =>
			ctx?.ui.setStatus(
				STATUS_KEY,
				visible && ctx
					? formatActivityStatus(ctx.ui.theme, "subagents", counts)
					: undefined,
			),
		);
	};

	const providerUnsubs: Array<() => void> = [];
	const resubscribeProviders = () => {
		for (const unsub of providerUnsubs.splice(0)) {
			try {
				unsub();
			} catch {
				/* Already disposed. */
			}
		}
		for (const provider of listActivityProviders()) {
			try {
				providerUnsubs.push(provider.onChange(refreshFooter));
			} catch {
				/* A broken provider must not take down the hub. */
			}
		}
	};
	const unregisterRegistryWatch = onRegistryChange(() => {
		resubscribeProviders();
		refreshFooter();
	});
	resubscribeProviders();

	// --- pi-subagents activity provider wrapping the tracker map/poller ---

	const changeListeners = new Set<() => void>();
	const emitChange = () => {
		for (const listener of [...changeListeners]) {
			try {
				listener();
			} catch {
				/* A broken listener must not break the tracker. */
			}
		}
	};

	// --- lifecycle actions ---
	// stop/interrupt ride pi-subagents' typed RPC bridge (same envelope /btw
	// uses); steer/resume are not in the RPC allowlist and ride the internal
	// slash-bridge channel instead. Both are undocumented-internal, so every
	// emit is wrapped: a missing pi-subagents runtime yields a timeout toast,
	// never a hang or a throw.

	const RPC_ACTION_TIMEOUT_MS = 10_000;
	const SLASH_ACTION_TIMEOUT_MS = 30_000;

	const rpcAction = (
		method: "stop" | "interrupt",
		params: { id: string },
	): Promise<ActionResult> =>
		new Promise((resolve) => {
			const requestId = randomUUID();
			let unsubscribe: (() => void) | undefined;
			let timer: ReturnType<typeof setTimeout> | undefined;
			const finish = (result: ActionResult) => {
				if (timer) {
					clearTimeout(timer);
					timer = undefined;
				}
				if (unsubscribe) {
					try {
						unsubscribe();
					} catch {
						/* The bus may already have discarded the subscription. */
					}
					unsubscribe = undefined;
				}
				resolve(result);
			};
			try {
				unsubscribe = pi.events.on(subagentRpcReplyEvent(requestId), (data) => {
					const envelope = data as SubagentRpcReplyEnvelope | undefined;
					if (!envelope) {
						finish({ ok: false, message: `${method}: empty RPC reply` });
						return;
					}
					if (!envelope.success) {
						finish({
							ok: false,
							message: `${method}: ${envelope.error?.code ?? "error"} — ${envelope.error?.message ?? "malformed reply"}`,
						});
						return;
					}
					const reply = payload(envelope.data);
					const message =
						typeof reply.message === "string"
							? reply.message
							: typeof reply.text === "string"
								? firstLine(reply.text)
								: `${method} requested`;
					finish({ ok: true, message });
				});
				timer = setTimeout(
					() =>
						finish({
							ok: false,
							message: `${method}: timed out waiting for pi-subagents`,
						}),
					RPC_ACTION_TIMEOUT_MS,
				);
				timer.unref?.();
				pi.events.emit(SUBAGENT_RPC_REQUEST_EVENT, {
					version: SUBAGENT_RPC_PROTOCOL_VERSION,
					requestId,
					method,
					params,
				});
			} catch (error) {
				finish({
					ok: false,
					message: `${method}: ${error instanceof Error ? error.message : String(error)}`,
				});
			}
		});

	const slashAction = (params: {
		action: "steer" | "resume";
		id: string;
		message?: string;
	}): Promise<ActionResult> =>
		new Promise((resolve) => {
			const requestId = `hub-${randomUUID()}`;
			let unsubscribe: (() => void) | undefined;
			let timer: ReturnType<typeof setTimeout> | undefined;
			const finish = (result: ActionResult) => {
				if (timer) {
					clearTimeout(timer);
					timer = undefined;
				}
				if (unsubscribe) {
					try {
						unsubscribe();
					} catch {
						/* The bus may already have discarded the subscription. */
					}
					unsubscribe = undefined;
				}
				resolve(result);
			};
			try {
				unsubscribe = pi.events.on(SLASH_SUBAGENT_RESPONSE_EVENT, (data) => {
					const response = data as
						| {
								requestId?: string;
								isError?: boolean;
								errorText?: string;
								result?: {
									content?: Array<{ type?: string; text?: string }>;
								};
						  }
						| undefined;
					if (!response || response.requestId !== requestId) return;
					const text =
						response.result?.content?.find((part) => part?.type === "text")
							?.text ?? "";
					finish(
						response.isError
							? {
									ok: false,
									message: `${params.action}: ${response.errorText || firstLine(text) || "failed"}`,
								}
							: {
									ok: true,
									message: firstLine(text) || `${params.action} delivered`,
								},
					);
				});
				timer = setTimeout(
					() =>
						finish({
							ok: false,
							message: `${params.action}: timed out waiting for pi-subagents`,
						}),
					SLASH_ACTION_TIMEOUT_MS,
				);
				timer.unref?.();
				// slash-bridge falls back to its own getContext() when ctx is absent.
				pi.events.emit(SLASH_SUBAGENT_REQUEST_EVENT, {
					requestId,
					params,
					...(ctx ? { ctx } : {}),
				});
			} catch (error) {
				finish({
					ok: false,
					message: `${params.action}: ${error instanceof Error ? error.message : String(error)}`,
				});
			}
		});

	const promptInput = async (
		title: string,
		placeholder: string,
	): Promise<string> => {
		try {
			return String((await ctx?.ui.input(title, placeholder)) ?? "").trim();
		} catch {
			return "";
		}
	};

	// One targeted re-read after an action: refreshRuns only polls runs whose
	// tracked state is active, so a paused→running resume would stay stale.
	const refreshRun = (runId: string) => {
		const run = runs.get(runId);
		if (run?.asyncDir) {
			const status = safeReadStatus(run.asyncDir);
			if (status) {
				run.state = status.state;
				run.steps = status.steps;
				run.startedAt = status.startedAt || run.startedAt;
				run.finishedAt = isActive(status.state)
					? undefined
					: (status.endedAt ?? run.finishedAt);
			}
		}
		refreshRuns();
	};

	const provider: ActivityProvider = {
		id: "pi-subagents",
		label: "subagents",
		counts: () => {
			const values = [...runs.values()];
			return {
				running: values.filter((run) => isActive(run.state)).length,
				done: values.filter((run) => run.state === "complete").length,
				failed: values.filter(
					(run) => run.state === "failed" || run.state === "stopped",
				).length,
			};
		},
		// Re-reads status at call time so /fleet reflects drift the active-run
		// poller cannot see (finished/paused runs); footer counts stay cheap.
		list: () =>
			[...runs.values()].map((run) => {
				const status = run.asyncDir ? safeReadStatus(run.asyncDir) : null;
				if (run.asyncDir && status === undefined)
					return runToItem({ ...run, state: "unknown" as RunState });
				return runToItem(
					status
						? { ...run, state: status.state, steps: status.steps }
						: { ...run },
				);
			}),
		detail: (item) => {
			const run = runFromItem(item);
			return run ? buildDetailSections(run) : [{ lines: ["Run unavailable"] }];
		},
		// Preconditions mirror upstream: stop needs running + same-session (the
		// tracker only ever holds this session's runs — cleared on session_start,
		// populated from this process's events); resume takes paused/complete/
		// failed; steer needs a live run. Inapplicable actions are omitted, not
		// disabled. Upstream re-validates on execution either way.
		actions: (item) => {
			const run = runFromItem(item);
			if (!run?.asyncDir) return [];
			const id = run.runId;
			const short = id.slice(0, 8);
			const actions: ActivityAction[] = [];
			if (item.state === "running") {
				actions.push({
					id: "stop",
					label: "stop",
					key: "s",
					confirm: `Stop run ${short}?`,
					run: () => rpcAction("stop", { id }),
				});
				actions.push({
					id: "interrupt",
					label: "interrupt",
					key: "i",
					run: () => rpcAction("interrupt", { id }),
				});
			}
			if (item.state === "running" || item.state === "queued") {
				actions.push({
					id: "steer",
					label: "steer",
					key: "t",
					run: async () => {
						const message = await promptInput(
							`Steer ${short}`,
							"Message for the running subagent…",
						);
						if (!message)
							return { ok: false, message: "steer: cancelled (no message)" };
						return slashAction({ action: "steer", id, message });
					},
				});
			}
			if (
				item.state === "paused" ||
				item.state === "complete" ||
				item.state === "failed"
			) {
				actions.push({
					id: "resume",
					label: "resume",
					key: "r",
					run: async () => {
						const message = await promptInput(
							`Resume ${short}`,
							"Optional follow-up message…",
						);
						return slashAction({
							action: "resume",
							id,
							...(message ? { message } : {}),
						});
					},
				});
			}
			return actions;
		},
		onChange: (cb) => {
			changeListeners.add(cb);
			return () => {
				changeListeners.delete(cb);
			};
		},
	};
	const unregisterProvider = registerActivityProvider(provider);

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
		emitChange();
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
			if (!value || typeof value !== "object") return;
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
		// Capture /btw answers for the overlay from the completion payload
		// (it already carries summary — no result-file read, no re-delivery).
		pi.events.on(SUBAGENT_ASYNC_COMPLETE_EVENT, (value) => {
			const event = payload(value);
			const entry = btwRuns.get(String(event.runId ?? event.id ?? ""));
			if (!entry) return;
			entry.state = event.success === true ? "complete" : "failed";
			if (typeof event.summary === "string" && event.summary)
				entry.answer = event.summary;
			entry.finishedAt = Date.now();
		}),
	];

	// /btw: side-question channel. Bare /btw opens a hub-kit overlay to ask
	// delegate questions while the main agent is running and to read answers
	// back; /btw <question> quick-fires without the overlay. Spawns ride
	// pi-subagents' RPC bridge and we only await the spawn ACK. The answer
	// text shown in the overlay is captured from SUBAGENT_ASYNC_COMPLETE's
	// payload; chat delivery stays with pi-subagents' existing notify
	// (src/extension/index.ts:495), so we MUST NOT sendMessage the answer
	// ourselves or it would double-deliver.
	const askBtw = (question: string): Promise<ActionResult> =>
		new Promise((resolve) => {
			const requestId = randomUUID();
			let unsubscribe: (() => void) | undefined;
			let timer: ReturnType<typeof setTimeout> | undefined;
			const finish = (result: ActionResult) => {
				if (timer) {
					clearTimeout(timer);
					timer = undefined;
				}
				if (unsubscribe) {
					try {
						unsubscribe();
					} catch {
						/* The bus may already have discarded the subscription. */
					}
					unsubscribe = undefined;
				}
				resolve(result);
			};
			try {
				unsubscribe = pi.events.on(subagentRpcReplyEvent(requestId), (data) => {
					const envelope = data as SubagentRpcReplyEnvelope | undefined;
					if (!envelope) {
						finish({ ok: false, message: "btw: empty RPC reply" });
						return;
					}
					if (!envelope.success) {
						finish({
							ok: false,
							message: `btw: ${envelope.error?.code ?? "error"} — ${envelope.error?.message ?? "malformed reply"}`,
						});
						return;
					}
					const details = payload(envelope.data).details as
						| { runId?: string; results?: Array<{ runId?: string }> }
						| undefined;
					const runId = details?.runId ?? details?.results?.[0]?.runId;
					if (runId) {
						btwRuns.set(runId, {
							question,
							askedAt: Date.now(),
							state: "running",
						});
					}
					finish({
						ok: true,
						message: `btw: asked delegate (run ${(runId ?? "no-id").slice(0, 8)}) — /btw to review`,
					});
				});
				timer = setTimeout(
					() =>
						finish({
							ok: false,
							message:
								"btw: timed out waiting for subagent spawn acknowledgement.",
						}),
					10_000,
				);
				timer.unref?.();
				pi.events.emit(SUBAGENT_RPC_REQUEST_EVENT, {
					version: SUBAGENT_RPC_PROTOCOL_VERSION,
					requestId,
					method: "spawn",
					params: {
						agent: "delegate",
						task: question,
						context: "fresh",
						agentScope: "both",
					},
				});
			} catch (error) {
				finish({
					ok: false,
					message: `btw: ${error instanceof Error ? error.message : String(error)}`,
				});
			}
		});

	const buildBtwEntries = (): ListDetailEntry[] => {
		const now = Date.now();
		return [...btwRuns.entries()]
			.sort(([, a], [, b]) => b.askedAt - a.askedAt)
			.map(([runId, btw]) => ({
				item: {
					id: runId,
					title: btw.question,
					state: btw.state,
					startedAt: btw.askedAt,
					finishedAt: btw.finishedAt,
				},
				row: safeLine(
					`${btw.state === "running" ? "…" : btw.state === "complete" ? "✓" : "✗"} ${firstLine(btw.question)}  ${btw.state}  ${elapsed((btw.finishedAt ?? now) - btw.askedAt)}`,
				),
				actions: [],
				detail: () => [
					{
						lines: [
							safeLine(`Run ${runId}`),
							safeLine(
								`State ${btw.state} · Elapsed ${elapsed((btw.finishedAt ?? Date.now()) - btw.askedAt)}`,
							),
						],
					},
					{
						title: "Question",
						lines: btw.question.split(/\r?\n/).map(safeLine),
						keep: "head" as const,
					},
					{
						title: "Answer",
						lines: btw.answer
							? btw.answer.split(/\r?\n/).map(safeLine)
							: [
									btw.state === "running"
										? "(pending — the answer also lands in chat when ready)"
										: "(no answer captured)",
								],
						keep: "head" as const,
					},
				],
			}));
	};

	// The overlay loops: after an [a]sk it reopens with a fresh snapshot so
	// the new question is visible immediately; Esc/q exits the loop.
	const openBtwOverlay = async (commandCtx: ExtensionCommandContext) => {
		for (;;) {
			const result = await commandCtx.ui.custom<ListDetailResult>(
				(tui, theme, _keys, done) =>
					new ListDetailView(tui, theme, done, {
						listTitle: " by the way ",
						detailTitle: " side question ",
						emptyText: "No side questions yet — press a to ask one",
						entries: buildBtwEntries,
						globalActions: [
							{
								id: "ask",
								label: "ask",
								key: "a",
								run: async () => {
									const asked = await promptInput(
										"by the way",
										"Ask a one-off side question…",
									);
									if (!asked) return { ok: true, message: "" };
									return askBtw(asked);
								},
							},
						],
					}),
				{
					overlay: true,
					overlayOptions: {
						anchor: "center",
						width: "100%",
						maxHeight: "100%",
					},
				},
			);
			if (!result) return;
			try {
				const outcome = await result.action.run();
				if (outcome.message) {
					commandCtx.ui.notify(outcome.message, outcome.ok ? "info" : "error");
				}
			} catch (error) {
				safely(() =>
					commandCtx.ui.notify(
						`btw: ${error instanceof Error ? error.message : String(error)}`,
						"error",
					),
				);
			}
		}
	};

	pi.registerCommand("btw", {
		description:
			"Side questions via a delegate subagent — /btw opens the Q&A overlay, /btw <question> asks and opens it",
		handler: async (rawArgs, commandCtx) => {
			if (commandCtx.mode !== "tui") {
				if (commandCtx.hasUI) {
					commandCtx.ui.notify(
						"/btw needs an interactive (TUI) session.",
						"info",
					);
				}
				return;
			}
			const question = rawArgs.trim();
			if (question) {
				const outcome = await askBtw(question);
				safely(() =>
					commandCtx.ui.notify(outcome.message, outcome.ok ? "info" : "error"),
				);
			}
			await openBtwOverlay(commandCtx);
		},
	});

	pi.on("session_start", (_event, context) => {
		// /new or /resume within the same process must start with an empty tracked
		// set; mirror session_shutdown's cleanup minus the disposer teardown.
		if (poller) clearInterval(poller);
		poller = undefined;
		safely(() => ctx?.ui.setStatus(STATUS_KEY, undefined));
		runs.clear();
		btwRuns.clear();
		ctx = context;
		refreshRuns();
	});
	pi.on("session_shutdown", () => {
		if (poller) clearInterval(poller);
		poller = undefined;
		safely(() => ctx?.ui.setStatus(STATUS_KEY, undefined));
		ctx = undefined;
		runs.clear();
		btwRuns.clear();
		changeListeners.clear();
		try {
			unregisterProvider();
		} catch {
			/* Registry may already be gone. */
		}
		try {
			unregisterRegistryWatch();
		} catch {
			/* Registry may already be gone. */
		}
		for (const unsub of providerUnsubs.splice(0)) {
			try {
				unsub();
			} catch {
				/* Already disposed. */
			}
		}
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
			const buildEntries = (): ListDetailEntry[] => {
				const now = Date.now();
				return listActivityProviders()
					.flatMap((activityProvider) =>
						safeList(activityProvider).map((item) => ({
							item,
							row: safeLine(
								`${item.id.slice(0, 8)}  ${item.title}  ${item.state}  ${elapsed((item.finishedAt ?? now) - item.startedAt)}`,
							),
							actions: safeActions(activityProvider, item),
							detail: () => safeDetail(activityProvider, item),
						})),
					)
					.sort((a, b) => b.item.startedAt - a.item.startedAt);
			};
			const result = await commandCtx.ui.custom<ListDetailResult>(
				(tui, theme, _keys, done) =>
					new ListDetailView(tui, theme, done, {
						listTitle: " Subagent fleet ",
						detailTitle: " Subagent run ",
						emptyText: "No tracked subagent runs",
						entries: buildEntries,
					}),
				{
					overlay: true,
					overlayOptions: {
						anchor: "center",
						width: "100%",
						maxHeight: "100%",
					},
				},
			);
			if (!result) return;
			// The overlay closed itself before handing us the action, so the
			// confirm/input dialogs below never stack on top of it.
			const { action, item } = result;
			try {
				if (action.confirm) {
					const confirmed = await commandCtx.ui.confirm(
						"Confirm",
						action.confirm,
					);
					if (!confirmed) return;
				}
				const outcome = await action.run();
				commandCtx.ui.notify(outcome.message, outcome.ok ? "info" : "error");
			} catch (error) {
				safely(() =>
					commandCtx.ui.notify(
						`${action.label}: ${error instanceof Error ? error.message : String(error)}`,
						"error",
					),
				);
			} finally {
				if (item) refreshRun(item.id);
			}
		},
	});
}
