import { createHash } from "node:crypto";
import * as fs from "node:fs";
import { PathKeyedMap } from "../path-keyed-map.js";
import { normalizeEphemeralMapKey } from "../path-utils.js";
/**
 * #1470: the single source of truth for "which servers did this touch NOT hear
 * from". Read this instead of comparing `confirmation` to a string literal — a
 * consumer that tests `confirmation === "confirmed"` is correct only by accident
 * (it happens to fail closed for `"partial"`), and one that tests `!inconclusive`
 * is outright wrong, because a partially-confirmed touch is deliberately NOT
 * inconclusive: the primary's answer is still trustworthy and must survive.
 */
export function touchCoverageGap(result) {
    return result?.unconfirmedServerIds ?? [];
}
/**
 * #1470: did this touch complete its configured confirmation policy at all —
 * `"confirmed"` (for every spawned server) or `"partial"` (for every server
 * except the named cut-off auxiliaries)?
 *
 * This is deliberately NOT `confirmation === "confirmed"`. A consumer asking
 * "did the PRIMARY confirm?" must answer yes for a partial touch: `partial`
 * implies neither the notify write nor the diagnostics wait lapsed, so the
 * silent-clean gates ran to completion exactly as they do for a full
 * confirmation. Reading `=== "confirmed"` there looks safely fail-closed but
 * reports "the language server could not confirm clean" when the truth is "the
 * language server confirmed clean and a scanner was cut off" — the same overclaim
 * pointing the other way. Pair this with {@link touchCoverageGap}, which names
 * what the touch does not speak for.
 */
export function touchCompletedConfirmationPolicy(result) {
    return result?.confirmation !== undefined;
}
/**
 * Fingerprint the EXACT text handed to didOpen/didChange. sha256 over the raw
 * string — no normalization — so the disk comparison (which reads the file with
 * the SAME raw `utf-8` transform pi-lens builds LSP payloads with) round-trips
 * CRLF and BOM bytes identically. See `createDiskBindingCache`.
 */
export function hashDiagnosticContent(content) {
    return createHash("sha256").update(content).digest("hex");
}
/**
 * Compose the merged `boundToCurrentDisk` across every client contributing to a
 * merged diagnostics result (primary + auxiliaries). The merged set is only as
 * trustworthy as its least-bound contributor:
 *   - ANY contributor demonstrably mismatches disk        → false
 *   - otherwise, all contributors are "unknown" (or none) → "unknown"
 *   - otherwise (≥1 bound, none mismatched)               → true
 * Unknowns never block a `true`: a version-less auxiliary alongside a bound
 * primary must not erase the primary's binding, only a real mismatch does.
 */
export function composeBoundToCurrentDisk(values) {
    if (values.some((v) => v === false))
        return false;
    if (values.length === 0 || values.every((v) => v === "unknown")) {
        return "unknown";
    }
    return true;
}
/** One-word summary of a binding verdict for latency/observability logs. */
export function bindingStateLabel(value) {
    if (value === true)
        return "bound";
    if (value === false)
        return "mismatch";
    return "unknown";
}
/**
 * Bound on the per-(file,mtime) disk-fingerprint memo. The memo grows by one
 * entry per distinct tracked file; a full clear on overflow (rather than an LRU)
 * is fine because each entry is a pure, cheaply-recomputed derivation of disk
 * bytes — the worst case after a clear is one extra re-hash per file. Keeps the
 * map from growing unbounded across a long-lived session.
 */
const DISK_BINDING_MEMO_MAX = 4096;
export function createDiskBindingCache() {
    // #1025: key through PathKeyedMap + normalizeEphemeralMapKey so two forms of
    // the same path (`SUB\a.ts` vs `sub/a.ts`) can't produce a duplicate memo or a
    // false miss. Ephemeral (slash-fold + win32-lowercase, no realpath I/O) — the
    // keys are file paths this process is already stat'ing on the hot read path.
    const diskHashByPath = new PathKeyedMap(normalizeEphemeralMapKey);
    return {
        boundToCurrentDisk(filePath, stored) {
            // No fingerprint captured (version-less server) → unknown, never false.
            if (stored.contentHash === undefined)
                return "unknown";
            let mtimeMs;
            try {
                mtimeMs = fs.statSync(filePath).mtimeMs;
            }
            catch {
                // Can't stat (deleted/unreadable): can't disprove the binding either,
                // so stay honest — "unknown", never a manufactured false.
                return "unknown";
            }
            let cached = diskHashByPath.get(filePath);
            if (!cached || cached.mtimeMs !== mtimeMs) {
                let diskHash;
                try {
                    diskHash = hashDiagnosticContent(fs.readFileSync(filePath, "utf-8"));
                }
                catch {
                    return "unknown";
                }
                cached = { mtimeMs, hash: diskHash };
                if (diskHashByPath.size >= DISK_BINDING_MEMO_MAX) {
                    diskHashByPath.clear();
                }
                diskHashByPath.set(filePath, cached);
            }
            return cached.hash === stored.contentHash;
        },
    };
}
