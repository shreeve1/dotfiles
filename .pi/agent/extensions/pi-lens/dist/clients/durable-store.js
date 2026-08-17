/**
 * Synchronous locked read-modify-write commit seam for behavior-gating JSON
 * stores shared by multiple pi-lens processes.
 *
 * The authoritative read happens only after the bounded PID lock is held; the
 * caller merges only its delta, publication is a throwing atomic replacement,
 * and success telemetry runs only after publication succeeds.
 *
 * Short synchronous commits use a file lock. Awaited commits use the shared
 * quarantine directory lock, preserving bounded contention and stale-owner
 * recovery without allowing a late release to delete a replacement owner.
 */
import * as fs from "node:fs";
import fsp from "node:fs/promises";
import { writeFileAtomic, writeFileAtomicAsync } from "./atomic-write.js";
import { acquireBoundedPidFileLock, acquireQuarantinePidFileLock, } from "./bounded-pid-file-lock.js";
function readLocked(path) {
    try {
        return fs.readFileSync(path, "utf8");
    }
    catch {
        return undefined;
    }
}
export function commitDurableStore(options) {
    const release = options.onContention === "skip-log"
        ? acquireBoundedPidFileLock(`${options.path}.lock`, {
            waitMs: options.waitMs,
            retryMs: options.retryMs,
            timeoutMessage: options.timeoutMessage,
            onContention: "skip-log",
            logContention: options.logContention,
        })
        : acquireBoundedPidFileLock(`${options.path}.lock`, {
            waitMs: options.waitMs,
            retryMs: options.retryMs,
            timeoutMessage: options.timeoutMessage,
            onContention: "throw",
        });
    if (!release)
        return undefined;
    let committed;
    try {
        const current = options.deserialize(readLocked(options.path));
        committed = options.merge(current);
        writeFileAtomic(options.path, options.serialize(committed), {
            bestEffort: false,
        });
        options.afterWriteLocked?.(committed);
    }
    finally {
        release();
    }
    return committed;
}
async function readLockedAsync(path) {
    try {
        return await fsp.readFile(path, "utf8");
    }
    catch (error) {
        if (error.code === "ENOENT")
            return undefined;
        throw error;
    }
}
export async function commitDurableStoreAsync(options) {
    const release = options.onContention === "skip-log"
        ? await acquireQuarantinePidFileLock(`${options.path}.lock`, {
            waitMs: options.waitMs,
            retryMs: options.retryMs,
            staleMs: options.staleMs,
            timeoutMessage: options.timeoutMessage,
            onContention: "skip-log",
            logContention: options.logContention,
        })
        : await acquireQuarantinePidFileLock(`${options.path}.lock`, {
            waitMs: options.waitMs,
            retryMs: options.retryMs,
            staleMs: options.staleMs,
            timeoutMessage: options.timeoutMessage,
            onContention: "throw",
        });
    if (!release)
        return undefined;
    try {
        const current = options.deserialize(await readLockedAsync(options.path));
        const committed = options.merge(current);
        await writeFileAtomicAsync(options.path, options.serialize(committed), {
            bestEffort: false,
        });
        await options.afterWriteLocked?.(committed);
        return committed;
    }
    finally {
        await release();
    }
}
