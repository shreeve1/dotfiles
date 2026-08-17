/**
 * Generic read-recording bridge for pi-lens.
 *
 * ## Trust model — explicitly advisory
 *
 * This bridge is an **advisory, trust-based protocol** for same-process Pi
 * extensions. Any code sharing the same Node.js process already has full
 * access to pi-lens's internal state, so the bridge cannot and does not
 * provide a meaningful security boundary. What it *does* provide is:
 *
 * - A stable API surface so extensions do not need to import pi-lens
 *   internals directly.
 * - A single place for flag/scope checks (no-read-guard, ignored paths).
 * - Basic defensive validation to catch integration bugs early (malformed
 *   payloads).
 *
 * Mounts a `ReadBridge` object at `globalThis[READ_BRIDGE_KEY]` that any
 * co-process extension can call to register a file read against pi-lens's
 * read-guard — without either party needing to know about the other.
 *
 * Protocol (producer side)
 * ────────────────────────
 * A co-process Pi extension that performs file reads outside pi-lens's
 * awareness (e.g. via a custom registered tool) can forward those reads so
 * that a subsequent `edit` call on the same file is not blocked by the
 * read-before-edit guard:
 *
 *   const bridge = (globalThis as any)[Symbol.for("pi-lens:read-bridge")];
 *   bridge?.recordRead({
 *     filePath,          // absolute path
 *     requestedOffset,   // 1-indexed first line (default 1)
 *     requestedLimit,    // line count, or undefined for the whole file
 *     consumer,          // optional identifier, e.g. "my-extension" (appears in read-guard.log)
 *   });
 *
 * Check `bridge.version` before calling to guard against future incompatible
 * changes — a bridge whose version you don't recognise should be treated as
 * unsupported.
 *
 * The timestamp is stamped by the bridge itself (Date.now()) to match
 * exactly how the internal read path works.
 *
 * Calling before pi-lens is loaded, or when the guard is disabled via
 * `PI_LENS_NO_READ_GUARD`, is safe — the bridge is absent or the call is
 * silently dropped.
 *
 * Protocol (registration side, internal to pi-lens)
 * ──────────────────────────────────────────────────
 * `registerReadBridge` is called once from inside the extension factory
 * (after `getLensFlag` is available) via the `_readBridgeRegistered`
 * singleton guard so that factory re-activations in the same process do not
 * mount a second bridge.
 *
 * The `isRecordable` predicate is re-evaluated on every `recordRead` call
 * using the *current* activation's flag getter (stored in a module-level
 * holder refreshed on every factory activation — same pattern as
 * `_turnSummaryEmitCtx`), so flag changes take effect immediately.
 */
/** Stable Symbol key — identical across module reloads in the same process. */
import { captureReadContentBinding, } from "./read-guard.js";
export const READ_BRIDGE_KEY = Symbol.for("pi-lens:read-bridge");
/**
 * Validate a raw entry from an untrusted caller.
 * Returns `true` when the entry is structurally sound and safe to forward.
 *
 * Validation is deliberately lightweight — this is an advisory protocol
 * between same-process extensions (see the module-level trust-model note).
 * The goal is to catch integration bugs (typo'd fields, bad numbers) early
 * rather than to enforce a security boundary.
 */
function isValidEntry(entry) {
    if (typeof entry !== "object" || entry === null)
        return false;
    const e = entry;
    // filePath must be a non-empty string (absolute paths are expected but
    // we don't re-resolve here — `isRecordable` handles scope checks).
    if (typeof e["filePath"] !== "string" || e["filePath"] === "")
        return false;
    // requestedOffset must be a finite integer ≥ 1.
    const offset = e["requestedOffset"];
    if (typeof offset !== "number" ||
        !Number.isFinite(offset) ||
        offset < 1 ||
        !Number.isInteger(offset))
        return false;
    // requestedLimit must be undefined or a finite positive integer.
    const limit = e["requestedLimit"];
    if (limit !== undefined) {
        if (typeof limit !== "number" ||
            !Number.isFinite(limit) ||
            limit < 1 ||
            !Number.isInteger(limit))
            return false;
    }
    return true;
}
/**
 * Mount the bridge singleton. Call once from inside the extension factory
 * (protected by the `_readBridgeRegistered` module-level flag).
 * Subsequent calls are no-ops.
 */
export function registerReadBridge(deps) {
    // Use `in` check so the frozen non-configurable property doesn't throw
    // on a redundant defineProperty attempt.
    if (READ_BRIDGE_KEY in globalThis)
        return;
    const bridge = Object.freeze({
        version: 1,
        recordRead(entry) {
            // Validate the payload before doing anything else — this catches
            // integration bugs in callers (malformed fields, bad numbers).
            if (!isValidEntry(entry))
                return;
            if (!deps.isRecordable(entry.filePath))
                return;
            const offset = entry.requestedOffset;
            // When no limit is given treat the whole file as covered — the guard
            // clips to the actual line count via its own file-length probe.
            const limit = entry.requestedLimit ?? Number.MAX_SAFE_INTEGER;
            const contentBinding = captureReadContentBinding(entry.filePath, offset, limit);
            deps.getReadGuard().recordRead({
                filePath: entry.filePath,
                requestedOffset: offset,
                requestedLimit: limit,
                effectiveOffset: offset,
                effectiveLimit: limit,
                expandedByLsp: false,
                turnIndex: deps.getTurnIndex(),
                writeIndex: deps.peekWriteIndex(),
                // Stamp the timestamp here, matching exactly how the internal read
                // path works (runtime-tool-call.ts always uses Date.now()).
                timestamp: Date.now(),
                // Provenance: identifies this record as bridge-sourced in read-guard.log.
                source: `bridge:${entry.consumer ?? "unknown"}`,
                ...(contentBinding !== undefined && { contentBinding }),
            });
        },
    });
    // Register as non-writable, non-configurable so no subsequent code can
    // silently overwrite the bridge (first-wins is the contract).
    Object.defineProperty(globalThis, READ_BRIDGE_KEY, {
        value: bridge,
        writable: false,
        configurable: false,
        enumerable: false,
    });
}
