/**
 * Full-screen opaque panel chrome for hub overlays.
 *
 * Sizing: rows - 1 total (rows - 3 body + 2 border rows) so the overlay
 * covers the chat while leaving pi's final footer row visible. Every body row
 * is space-padded to full width — short unpadded output renders as a small
 * floating box instead of an opaque panel.
 */
import type { Theme } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

export function padRow(text: string, width: number): string {
	const truncated = truncateToWidth(text, width);
	return truncated + " ".repeat(Math.max(0, width - visibleWidth(truncated)));
}

/** Body rows available inside the frame for a terminal of `rows` height. */
export function panelBodyHeight(rows: number): number {
	return Math.max(0, (rows || 30) - 3);
}

export function renderPanelFrame(
	theme: Theme,
	width: number,
	title: string,
	bodyHeight: number,
	body: string[],
): string[] {
	const innerWidth = Math.max(0, width - 2);
	const border = (s: string) => theme.fg("border", s);
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
		lines.push(divider + padRow(body[i] ?? "", innerWidth) + divider);
	}
	lines.push(border("╰" + "─".repeat(innerWidth) + "╯"));
	return lines;
}
