/**
 * Deferred followUp delivery: queue result messages while the agent is
 * mid-turn and flush when it settles, with an isIdle() fast path. Shape
 * lifted from background-terminals/index.ts:113-184 (read-only reference).
 *
 * Exactly-once: defer keys by id in a Map, drain-then-redeliver-on-failure —
 * whoever drains first wins, so the settle handler and the idle fast path
 * can never both deliver the same message.
 */
import type {
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";

export interface DeferredMessage {
	customType: string;
	content: string;
	display: boolean;
	details?: unknown;
}

export interface DeferredDelivery {
	/** Queue a message; delivers immediately when the session is idle. */
	defer(id: string, message: DeferredMessage): void;
	/** Drop queued messages that were delivered through another path. */
	consume(ids: string[]): void;
	/** Drop everything (session shutdown). */
	clear(): void;
	/** Permanently inert the helper. pi.on has no unsubscribe, so the
	 * agent_settled handler stays registered but becomes a no-op; create at
	 * most one instance per extension factory. */
	dispose(): void;
}

export function createDeferredDelivery(
	pi: ExtensionAPI,
	getContext: () => ExtensionContext | undefined,
): DeferredDelivery {
	const pending = new Map<string, DeferredMessage>();
	let disposed = false;

	const deliver = (message: DeferredMessage): boolean => {
		try {
			// followUp: queued until the agent has no more tool calls — never
			// interrupts a mid-turn stream. triggerTurn: wakes the model
			// immediately iff idle; busy sessions get it when the run settles.
			pi.sendMessage(message, { deliverAs: "followUp", triggerTurn: true });
			return true;
		} catch {
			// Session may be shutting down; keep the message for a later flush.
			return false;
		}
	};

	const flush = () => {
		if (disposed) return;
		// Drain before delivering so a reentrant flush (e.g. sendMessage
		// synchronously settling the agent) cannot see — and redeliver —
		// messages this pass already owns.
		const batch = [...pending];
		pending.clear();
		for (const [id, message] of batch) {
			if (!deliver(message)) pending.set(id, message);
		}
	};

	pi.on("agent_settled", flush);

	return {
		defer(id, message) {
			if (disposed) return;
			pending.set(id, message);
			try {
				if (getContext()?.isIdle()) flush();
			} catch {
				/* The agent_settled flush still covers it. */
			}
		},
		consume(ids) {
			for (const id of ids) pending.delete(id);
		},
		clear() {
			pending.clear();
		},
		dispose() {
			disposed = true;
			pending.clear();
		},
	};
}
