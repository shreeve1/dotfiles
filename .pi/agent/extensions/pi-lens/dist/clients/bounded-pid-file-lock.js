import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
const waitArray = new Int32Array(new SharedArrayBuffer(4));
function ownerPidIsLive(pid) {
    if (!Number.isSafeInteger(pid) || pid <= 0)
        return false;
    try {
        process.kill(pid, 0);
        return true;
    }
    catch (error) {
        return error.code === "EPERM";
    }
}
function quarantinePath(lockPath, token) {
    return `${lockPath}.quarantine-${process.pid}-${token}`;
}
async function restoreQuarantinedLock(lockPath, quarantined) {
    try {
        await fsp.rename(quarantined, lockPath);
    }
    catch {
        // A replacement owner may already hold the canonical name. Never overwrite it.
    }
}
async function releaseQuarantineLock(lockPath, token) {
    const quarantined = quarantinePath(lockPath, `release-${token}`);
    let renamed = false;
    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            await fsp.rename(lockPath, quarantined);
            renamed = true;
            break;
        }
        catch (error) {
            if (error.code !== "ENOENT" ||
                attempt === 2)
                return;
            await new Promise((resolve) => setImmediate(resolve));
        }
    }
    if (!renamed)
        return;
    try {
        const owner = JSON.parse(await fsp.readFile(path.join(quarantined, "owner.json"), "utf8"));
        if (owner.token === token) {
            await fsp.rm(quarantined, { recursive: true, force: true });
        }
        else {
            await restoreQuarantinedLock(lockPath, quarantined);
        }
    }
    catch {
        await restoreQuarantinedLock(lockPath, quarantined);
    }
}
function quarantineOwnerIsStale(owner, staleMs) {
    return Number.isInteger(owner.pid) && owner.pid > 0 &&
        Number.isFinite(owner.createdAt) &&
        (!ownerPidIsLive(owner.pid) || Date.now() - owner.createdAt > staleMs);
}
async function reclaimQuarantineLock(lockPath, staleMs) {
    const quarantined = quarantinePath(lockPath, `reclaim-${Date.now()}-${randomUUID()}`);
    try {
        await fsp.rename(lockPath, quarantined);
    }
    catch {
        return false;
    }
    let stale = false;
    try {
        const owner = JSON.parse(await fsp.readFile(path.join(quarantined, "owner.json"), "utf8"));
        stale = quarantineOwnerIsStale(owner, staleMs);
    }
    catch {
        try {
            stale = Date.now() - (await fsp.stat(quarantined)).mtimeMs > staleMs;
        }
        catch {
            stale = false;
        }
    }
    if (stale) {
        await fsp.rm(quarantined, { recursive: true, force: true });
        return true;
    }
    await restoreQuarantinedLock(lockPath, quarantined);
    return false;
}
async function tryAcquireQuarantineLock(lockPath, staleMs) {
    const owner = {
        pid: process.pid,
        createdAt: Date.now(),
        token: `${process.pid}-${Date.now()}-${randomUUID()}`,
    };
    for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
            await fsp.mkdir(lockPath);
            try {
                await fsp.writeFile(path.join(lockPath, "owner.json"), JSON.stringify(owner), "utf8");
            }
            catch (error) {
                await fsp.rm(lockPath, { recursive: true, force: true }).catch(() => { });
                throw error;
            }
            return () => releaseQuarantineLock(lockPath, owner.token);
        }
        catch (error) {
            if (error.code !== "EEXIST")
                throw error;
        }
        let stale;
        try {
            const existing = JSON.parse(await fsp.readFile(path.join(lockPath, "owner.json"), "utf8"));
            stale = quarantineOwnerIsStale(existing, staleMs);
        }
        catch {
            try {
                stale = Date.now() - (await fsp.stat(lockPath)).mtimeMs > staleMs;
            }
            catch {
                stale = true;
            }
        }
        if (!stale || !(await reclaimQuarantineLock(lockPath, staleMs)))
            return null;
    }
    return null;
}
export async function acquireQuarantinePidFileLock(lockPath, options) {
    const deadline = Date.now() + options.waitMs;
    for (;;) {
        const release = await tryAcquireQuarantineLock(lockPath, options.staleMs);
        if (release)
            return release;
        const remaining = deadline - Date.now();
        if (remaining <= 0) {
            if (options.onContention === "skip-log") {
                options.logContention();
                return null;
            }
            throw new Error(options.timeoutMessage);
        }
        await new Promise((resolve) => setTimeout(resolve, Math.min(options.retryMs, remaining)));
    }
}
export function acquireBoundedPidFileLock(lockPath, options) {
    const token = `${process.pid}:${Date.now()}:${randomUUID()}`;
    const deadline = Date.now() + options.waitMs;
    for (;;) {
        try {
            const fd = fs.openSync(lockPath, "wx");
            fs.writeFileSync(fd, token, "utf8");
            fs.closeSync(fd);
            return () => {
                try {
                    if (fs.readFileSync(lockPath, "utf8") === token) {
                        fs.unlinkSync(lockPath);
                    }
                }
                catch {
                    // Protected write completed; cleanup is best-effort.
                }
            };
        }
        catch (error) {
            if (error.code !== "EEXIST")
                throw error;
            try {
                const [pidText] = fs.readFileSync(lockPath, "utf8").split(":", 1);
                if (!ownerPidIsLive(Number.parseInt(pidText ?? "", 10))) {
                    fs.unlinkSync(lockPath);
                    continue;
                }
            }
            catch (lockError) {
                if (lockError.code === "ENOENT")
                    continue;
            }
            if (Date.now() >= deadline) {
                if (options.onContention === "skip-log") {
                    options.logContention();
                    return null;
                }
                throw new Error(options.timeoutMessage);
            }
            Atomics.wait(waitArray, 0, 0, options.retryMs);
        }
    }
}
