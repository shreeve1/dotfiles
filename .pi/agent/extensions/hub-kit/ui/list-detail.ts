/**
 * ListDetailView: two-stage (list → detail) full-screen overlay over activity
 * entries, with an action row for per-item lifecycle actions.
 *
 * Live: entries is a function re-evaluated on every render, and a 1 Hz ticker
 * (the background-terminals /ps pattern) re-renders so states, elapsed times
 * and detail sections update while the overlay is open. Selection follows the
 * item id across rebuilds.
 *
 * Keymap (all via matchesKey — raw escape comparison breaks under the Kitty
 * keyboard protocol): ↑/↓/j/k move, Enter detail, Esc back-or-close,
 * q/Ctrl+C close, Backspace back from detail, plus per-entry action keys.
 * Choosing an action closes the overlay with { action, item } so the caller
 * can confirm / collect input via native dialogs without stacking overlays.
 *
 * Detail section lines are word-wrapped to the panel width; list rows stay
 * single-line (truncated by the panel frame).
 */
import type { Theme } from "@earendil-works/pi-coding-agent";
import type { Component, TUI } from "@earendil-works/pi-tui";
import { matchesKey, visibleWidth } from "@earendil-works/pi-tui";
import type {
	ActivityAction,
	ActivityItem,
	DetailSection,
} from "../registry.ts";
import { panelBodyHeight, renderPanelFrame } from "./panel.ts";

export interface ListDetailEntry {
	item: ActivityItem;
	/** Pre-rendered list row (without the selection marker). */
	row: string;
	/** Available actions, recomputed with each entries() snapshot. */
	actions: ActivityAction[];
	/** Invoked per render while the entry is inspected (live detail). */
	detail(): DetailSection[];
}

export interface ListDetailConfig {
	listTitle: string;
	detailTitle: string;
	emptyText: string;
	/** Re-evaluated on every render; keep it cheap and never throwing. */
	entries: () => ListDetailEntry[];
	/** View-level actions available regardless of selection (e.g. "ask"). */
	globalActions?: ActivityAction[];
}

export type ListDetailResult = {
	action: ActivityAction;
	/** Absent when a global action was chosen. */
	item?: ActivityItem;
} | null;

function withHeadOverflow(lines: string[], capacity: number): string[] {
	if (capacity <= 0) return [];
	if (lines.length <= capacity) return lines;
	if (capacity === 1) return [`… +${lines.length} more`];
	return [
		...lines.slice(0, capacity - 1),
		`… +${lines.length - capacity + 1} more`,
	];
}

function withTailOverflow(lines: string[], capacity: number): string[] {
	if (capacity <= 0) return [];
	if (lines.length <= capacity) return lines;
	if (capacity === 1) return [`… +${lines.length} more`];
	return [
		`… +${lines.length - capacity + 1} more`,
		...lines.slice(-(capacity - 1)),
	];
}

/** Greedy word wrap on plain (non-ANSI) text, hard-breaking oversized words. */
export function wrapLine(text: string, width: number): string[] {
	if (width <= 0 || visibleWidth(text) <= width) return [text];
	const lines: string[] = [];
	let current = "";
	const flush = () => {
		if (current) {
			lines.push(current);
			current = "";
		}
	};
	for (let word of text.split(" ")) {
		while (visibleWidth(word) > width) {
			flush();
			let head = "";
			for (const ch of word) {
				if (visibleWidth(head + ch) > width) break;
				head += ch;
			}
			if (!head) head = word.slice(0, 1);
			lines.push(head);
			word = word.slice(head.length);
		}
		const candidate = current ? `${current} ${word}` : word;
		if (visibleWidth(candidate) > width) {
			flush();
			current = word;
		} else {
			current = candidate;
		}
	}
	flush();
	return lines.length ? lines : [""];
}

export class ListDetailView implements Component {
	private tui: TUI;
	private theme: Theme;
	private done: (value: ListDetailResult) => void;
	private config: ListDetailConfig;
	private mode: "list" | "detail" = "list";
	private selection = 0;
	private selectedId?: string;
	private detailEntry?: ListDetailEntry;
	private closed = false;
	private ticker?: ReturnType<typeof setInterval>;

	constructor(
		tui: TUI,
		theme: Theme,
		done: (value: ListDetailResult) => void,
		config: ListDetailConfig,
	) {
		this.tui = tui;
		this.theme = theme;
		this.done = done;
		this.config = config;
		// Elapsed times and run states tick along at 1Hz while open.
		this.ticker = setInterval(() => {
			try {
				this.tui.requestRender();
			} catch {
				/* The ticker must never break the parent TUI. */
			}
		}, 1000);
		this.ticker.unref?.();
	}

	private cleanup(): boolean {
		if (this.closed) return false;
		this.closed = true;
		if (this.ticker) clearInterval(this.ticker);
		this.ticker = undefined;
		return true;
	}

	private close(result: ListDetailResult) {
		if (this.cleanup()) this.done(result);
	}

	dispose(): void {
		this.cleanup();
	}

	private entries(): ListDetailEntry[] {
		try {
			return this.config.entries();
		} catch {
			return [];
		}
	}

	/** Follow the selected item id across live rebuilds; clamp otherwise. */
	private reconcileSelection(entries: ListDetailEntry[]) {
		if (this.selectedId) {
			const index = entries.findIndex(
				(entry) => entry.item.id === this.selectedId,
			);
			if (index >= 0) {
				this.selection = index;
				return;
			}
		}
		this.selection = Math.max(
			0,
			Math.min(this.selection, entries.length - 1),
		);
		this.selectedId = entries[this.selection]?.item.id;
	}

	private selectedEntry(entries: ListDetailEntry[]): ListDetailEntry | undefined {
		return this.mode === "detail" ? this.detailEntry : entries[this.selection];
	}

	private runAction(data: string, entries: ListDetailEntry[]): boolean {
		const entry = this.selectedEntry(entries);
		for (const action of entry?.actions ?? []) {
			if (matchesKey(data, action.key)) {
				this.close({ action, item: entry?.item });
				return true;
			}
		}
		for (const action of this.config.globalActions ?? []) {
			if (matchesKey(data, action.key)) {
				this.close({ action });
				return true;
			}
		}
		return false;
	}

	handleInput(data: string) {
		try {
			const entries = this.entries();
			this.reconcileSelection(entries);
			if (matchesKey(data, "ctrl+c") || matchesKey(data, "q")) {
				this.close(null);
				return;
			}
			if (this.mode === "detail") {
				if (matchesKey(data, "escape") || matchesKey(data, "backspace")) {
					this.mode = "list";
					this.detailEntry = undefined;
					this.tui.requestRender();
					return;
				}
				this.runAction(data, entries);
				return;
			}
			if (matchesKey(data, "escape")) {
				this.close(null);
				return;
			}
			if (matchesKey(data, "up") || matchesKey(data, "k")) {
				if (entries.length) {
					this.selection =
						(this.selection - 1 + entries.length) % entries.length;
					this.selectedId = entries[this.selection]?.item.id;
					this.tui.requestRender();
				}
				return;
			}
			if (matchesKey(data, "down") || matchesKey(data, "j")) {
				if (entries.length) {
					this.selection = (this.selection + 1) % entries.length;
					this.selectedId = entries[this.selection]?.item.id;
					this.tui.requestRender();
				}
				return;
			}
			if (matchesKey(data, "enter")) {
				const entry = entries[this.selection];
				if (!entry) return;
				this.detailEntry = entry;
				this.mode = "detail";
				this.tui.requestRender();
				return;
			}
			this.runAction(data, entries);
		} catch {
			/* The overlay must never break the parent TUI. */
		}
	}

	private actionHints(entry: ListDetailEntry | undefined): string {
		const actions = [
			...(entry?.actions ?? []),
			...(this.config.globalActions ?? []),
		];
		if (!actions.length) return "";
		const hints = actions.map((action) =>
			action.label.startsWith(action.key)
				? `[${action.key}]${action.label.slice(action.key.length)}`
				: `[${action.key}]${action.label}`,
		);
		return ` · ${hints.join(" ")}`;
	}

	private listBody(bodyHeight: number, entries: ListDetailEntry[]): string[] {
		const body: string[] = [
			"↑/↓ select · Enter inspect · Esc/q close" +
				this.actionHints(entries[this.selection]),
			"",
		];
		if (!entries.length) return [...body, this.config.emptyText];

		const capacity = Math.max(0, bodyHeight - body.length);
		let start = 0;
		if (entries.length > capacity) {
			start = Math.min(
				Math.max(0, this.selection - Math.floor(capacity / 2)),
				entries.length - capacity,
			);
		}
		for (let i = start; i < Math.min(entries.length, start + capacity); i++) {
			const row = entries[i].row;
			body.push(
				i === this.selection ? this.theme.fg("accent", `❯ ${row}`) : `  ${row}`,
			);
		}
		return body;
	}

	private detailBody(bodyHeight: number, innerWidth: number): string[] {
		const entry = this.detailEntry;
		const hint =
			"Esc/Backspace back · q/Ctrl+C close" + this.actionHints(entry);
		if (!entry) return [hint, "", "Run unavailable"];
		let sections: DetailSection[];
		try {
			sections = entry.detail();
		} catch {
			sections = [{ lines: ["Detail unavailable"] }];
		}
		const body: string[] = [hint, ""];
		const wrap = (lines: string[]) =>
			lines.flatMap((line) => wrapLine(line, innerWidth));
		const fixed = sections.filter((section) => !section.title);
		const flex = sections.filter((section) => section.title);
		for (const section of fixed) body.push(...wrap(section.lines));
		if (!flex.length) return body;

		// Titled sections share the remaining height; the extra reserved row
		// matches the pre-kit /fleet layout (sectionChrome = 3).
		let remaining = Math.max(0, bodyHeight - body.length - flex.length * 2 - 1);
		flex.forEach((section, index) => {
			const lines = wrap(section.lines);
			const sectionsLeft = flex.length - index;
			const capacity =
				index === flex.length - 1
					? remaining
					: remaining <= 1
						? remaining
						: Math.max(
								1,
								Math.min(lines.length, Math.floor(remaining / sectionsLeft)),
							);
			remaining = Math.max(0, remaining - capacity);
			body.push("", section.title ?? "");
			body.push(
				...(section.keep === "tail"
					? withTailOverflow(lines, capacity)
					: withHeadOverflow(lines, capacity)),
			);
		});
		return body;
	}

	render(width: number): string[] {
		try {
			const bodyHeight = panelBodyHeight(this.tui.terminal.rows);
			const innerWidth = Math.max(0, width - 2);
			let body: string[];
			if (this.mode === "detail") {
				body = this.detailBody(bodyHeight, innerWidth);
			} else {
				const entries = this.entries();
				this.reconcileSelection(entries);
				body = this.listBody(bodyHeight, entries);
			}
			const title =
				this.mode === "detail"
					? this.config.detailTitle
					: this.config.listTitle;
			return renderPanelFrame(this.theme, width, title, bodyHeight, body);
		} catch {
			return ["overlay rendering unavailable"];
		}
	}

	invalidate() {}
}
