import { logExtension } from "./extension-log.js";
import { notifyUserDegradation } from "./user-notify.js";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { assignFlagConfigSection, flagConfigSectionKeys, flagValueFromConfig, getLensFlagSpec, GLOBAL_NON_FLAG_CONFIG_SECTIONS, LENS_FLAGS, readFlagConfigValue, } from "./lens-flag-registry.js";
import { findNestedProjectMutationValue, } from "./project-lens-config.js";
export function getPiLensGlobalConfigPath(homeDir = os.homedir()) {
    const override = process.env.PI_LENS_CONFIG_PATH;
    if (override)
        return path.resolve(override);
    return path.join(homeDir, ".pi-lens", "config.json");
}
const warnedInvalidGlobalConfigs = new Set();
/**
 * Same warn-once-per-(path, reason) contract as project-lens-config.ts's
 * `warnInvalidConfigOnce` — a malformed global config value is logged once
 * and then treated as absent, rather than silently dropped (#792).
 */
function warnInvalidGlobalConfigOnce(configPath, reason) {
    const key = `${configPath}:${reason}`;
    if (warnedInvalidGlobalConfigs.has(key))
        return;
    warnedInvalidGlobalConfigs.add(key);
    const message = `ignoring invalid global config ${configPath}: ${reason}`;
    logExtension({
        subsystem: "lens-config",
        level: "warn",
        message,
        metadata: { configPath, reason },
    });
    // HUMAN-audience too: a config the user wrote is being ignored. Routed
    // through the host's own render path (#1333), never a raw write.
    notifyUserDegradation(`pi-lens: ${message}`);
}
/** For tests that need to force the warn-once cache to reset between cases. */
export function resetGlobalConfigWarnCache() {
    warnedInvalidGlobalConfigs.clear();
}
function asConfigObject(value) {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value
        : undefined;
}
export function loadPiLensGlobalConfig(configPath = getPiLensGlobalConfigPath()) {
    try {
        const parsed = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        if (!parsed || typeof parsed !== "object")
            return undefined;
        const raw = parsed;
        const warnInvalid = (reason) => warnInvalidGlobalConfigOnce(configPath, reason);
        const config = {};
        for (const spec of LENS_FLAGS) {
            if (spec.readGlobal)
                continue;
            assignFlagConfigSection(raw, config, spec.configKey, warnInvalid);
        }
        const ignore = Array.isArray(raw.ignore)
            ? raw.ignore.filter((p) => typeof p === "string")
            : undefined;
        if (ignore && ignore.length > 0)
            config.ignore = ignore;
        const dispatch = asConfigObject(raw.dispatch);
        if (dispatch) {
            const floor = dispatch.runnerTimeoutFloorMs;
            if (typeof floor === "number" && Number.isFinite(floor) && floor > 0) {
                config.dispatch = { runnerTimeoutFloorMs: floor };
            }
            else {
                // #533: warn only when the key is PRESENT but malformed — an absent
                // key stays silent so a config that never mentions it is not falsely
                // flagged. Same warn-once path as the maxFixes case below.
                if ("runnerTimeoutFloorMs" in dispatch) {
                    warnInvalid("dispatch.runnerTimeoutFloorMs must be a positive finite number");
                }
                config.dispatch = { runnerTimeoutFloorMs: undefined };
            }
        }
        const autoFix = asConfigObject(asConfigObject(raw.actionableWarnings)?.autoFix);
        if (autoFix && "maxFixes" in autoFix) {
            if (typeof autoFix.maxFixes === "number" &&
                Number.isFinite(autoFix.maxFixes) &&
                autoFix.maxFixes >= 0) {
                config.actionableWarnings ??= {};
                const warnings = config.actionableWarnings;
                warnings.autoFix ??= {};
                warnings.autoFix.maxFixes = Math.floor(autoFix.maxFixes);
            }
            else {
                warnInvalid("actionableWarnings.autoFix.maxFixes must be a non-negative finite number");
            }
        }
        const widget = asConfigObject(raw.widget);
        if (widget) {
            if (typeof widget.visible === "boolean") {
                config.widget = { visible: widget.visible };
            }
            else {
                // #533: present-but-wrong-type warns; absent stays silent.
                if ("visible" in widget) {
                    warnInvalid("widget.visible must be a boolean");
                }
                config.widget = { visible: undefined };
            }
        }
        const format = asConfigObject(raw.format);
        if (format) {
            config.format ??= {};
            const formatSection = config.format;
            if (format.mode === "immediate" || format.mode === "deferred") {
                formatSection.mode = format.mode;
            }
            else {
                // #533: a present-but-invalid mode (e.g. "immedaite") warns and
                // falls back; an absent mode stays silent.
                if ("mode" in format) {
                    warnInvalid('format.mode must be "immediate" or "deferred"');
                }
                formatSection.mode = undefined;
            }
        }
        // #533 hygiene: a completely unknown top-level key (e.g. a typo like
        // `lps` for `lsp`) is otherwise dropped silently, so a setting the user
        // thought they made does nothing with no signal. Warn once per key. The
        // recognized set is single-sourced (#883): the flag sections derived
        // from the registry plus the declared non-flag global sections
        // (`GLOBAL_NON_FLAG_CONFIG_SECTIONS`, which co-locates `$schema` and the
        // hand-parsed namespaces beside the registry). Adding a flag needs no
        // edit here; adding a namespace is a one-line edit in that one constant.
        const knownGlobalConfigKeys = new Set([
            ...flagConfigSectionKeys(LENS_FLAGS),
            ...GLOBAL_NON_FLAG_CONFIG_SECTIONS,
        ]);
        for (const key of Object.keys(raw)) {
            if (!knownGlobalConfigKeys.has(key)) {
                warnInvalid(`unknown key "${key}" is not a recognized pi-lens setting (check for a typo); ignored`);
            }
        }
        return config;
    }
    catch {
        return undefined;
    }
}
export function getGlobalIgnorePatterns(configPath) {
    return loadPiLensGlobalConfig(configPath)?.ignore ?? [];
}
export function getGlobalWidgetDefaultVisible(configPath) {
    return loadPiLensGlobalConfig(configPath)?.widget?.visible !== false;
}
/** Per-turn quickfix cap; undefined means "use the built-in default of 5". */
export function getGlobalActionableWarningMaxFixes(configPath) {
    return loadPiLensGlobalConfig(configPath)?.actionableWarnings?.autoFix
        ?.maxFixes;
}
/**
 * Resolve a flag AND report which config tier decided it — same precedence
 * as {@link resolvePiLensFlag} (which now delegates here), just also
 * returning the `source` so callers can log e.g.
 * "(--no-autofix, source=project)" instead of a bare boolean (#792).
 *
 * Every tier is driven by `clients/lens-flag-registry.ts` (#166): the spec's
 * `configKey` is read out of each config object rather than matched by a
 * per-flag branch, so a new toggle needs no change here at all.
 *
 * Precedence: env → cli → nested-project → project → global → default.
 * Project tiers apply to `scope: "project"` flags only (maintainer decision —
 * project wins over global, including re-enabling; only an explicit CLI
 * disabling flag outranks project config). A name with no registry entry
 * passes its CLI value straight through, which is how untyped string flags
 * like `--lens-opengrep-config` keep working.
 */
export function resolvePiLensFlagWithSource(name, value, config, projectConfig, editedFilePath, projectRoot) {
    const spec = getLensFlagSpec(name);
    if (spec?.env && process.env[spec.env] === "1") {
        return { value: true, source: "env" };
    }
    if (value)
        return { value, source: "cli" };
    if (!spec)
        return { value, source: "default" };
    if (spec.scope === "project") {
        const nested = editedFilePath && projectRoot
            ? findNestedProjectMutationValue(spec, editedFilePath, projectRoot)
            : undefined;
        if (nested) {
            return {
                value: flagValueFromConfig(spec, nested.value),
                source: path.resolve(nested.dir) === path.resolve(projectRoot)
                    ? "project"
                    : `nested-project:${nested.dir}`,
            };
        }
        const projectValue = readFlagConfigValue(projectConfig, spec.configKey);
        if (projectValue !== undefined) {
            return {
                value: flagValueFromConfig(spec, projectValue),
                source: "project",
            };
        }
    }
    const globalValue = spec.readGlobal
        ? spec.readGlobal((config ?? {}))
        : readFlagConfigValue(config, spec.configKey);
    if (globalValue !== undefined) {
        return { value: flagValueFromConfig(spec, globalValue), source: "global" };
    }
    return { value: spec.default, source: "default" };
}
export function resolvePiLensFlag(name, value, config, projectConfig, editedFilePath, projectRoot) {
    return resolvePiLensFlagWithSource(name, value, config, projectConfig, editedFilePath, projectRoot).value;
}
