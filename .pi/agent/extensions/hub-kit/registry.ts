/**
 * Activity-provider registry for the pi hub (/fleet).
 *
 * hub-kit is a library dir, NOT an extension: there is no top-level index.ts,
 * so pi's extensions/[star]/index.ts auto-discovery never loads it. Consumers
 * import it relatively, the same way ../shared/ is consumed.
 *
 * Contract v1 (frozen): id/label/counts/list/detail/actions?/onChange.
 */

export interface ActivityCounts {
	running: number;
	done: number;
	failed: number;
}

export interface ActivityItem {
	id: string;
	title: string;
	state: string;
	startedAt: number;
	finishedAt?: number;
	meta?: Record<string, unknown>;
}

export interface DetailSection {
	/** Titled sections share the remaining panel height; untitled render in full. */
	title?: string;
	lines: string[];
	/** Which end survives truncation. Defaults to "head". */
	keep?: "head" | "tail";
}

export interface ActionResult {
	ok: boolean;
	message: string;
}

export interface ActivityAction {
	id: string;
	/** Hint label, e.g. "stop" rendered as [s]top when key is its first letter. */
	label: string;
	/** Trigger key; must not collide with navigation (j/k/q/enter/esc/backspace). */
	key: string;
	/** When set, the hub asks y/n before running. */
	confirm?: string;
	run(): Promise<ActionResult>;
}

export interface ActivityProvider {
	id: string;
	label: string;
	counts(): ActivityCounts;
	list(): ActivityItem[];
	detail(item: ActivityItem): DetailSection[];
	actions?(item: ActivityItem): ActivityAction[];
	onChange(cb: () => void): () => void;
}

// globalThis-keyed: pi's extension loader does not guarantee module-cache
// identity across separately loaded extensions (a probe loaded via -e gets a
// fresh module instance), so a plain module-level Map would silently split
// the registry per consumer. The singleton makes cross-extension providers
// and external probes see the same state regardless of loader internals.
interface RegistryState {
	providers: Map<string, ActivityProvider>;
	listeners: Set<() => void>;
}
const state: RegistryState = ((
	globalThis as { __piHubKitRegistry?: RegistryState }
).__piHubKitRegistry ??= {
	providers: new Map(),
	listeners: new Set(),
});
const { providers, listeners } = state;

function fanout() {
	for (const listener of [...listeners]) {
		try {
			listener();
		} catch {
			/* A broken listener must not break the others. */
		}
	}
}

export function registerActivityProvider(
	provider: ActivityProvider,
): () => void {
	providers.set(provider.id, provider);
	fanout();
	return () => {
		if (providers.get(provider.id) === provider) {
			providers.delete(provider.id);
			fanout();
		}
	};
}

export function listActivityProviders(): ActivityProvider[] {
	return [...providers.values()];
}

/** Fires when providers register/unregister. Returns an unsubscribe. */
export function onRegistryChange(cb: () => void): () => void {
	listeners.add(cb);
	return () => {
		listeners.delete(cb);
	};
}
