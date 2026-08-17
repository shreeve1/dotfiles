/** Host-neutral capabilities available to the pi-lens engine (#1358 S2). */
/**
 * Headless/test implementation. Its feature-detection defaults deliberately
 * match the pre-ports absent-host paths: unknown trust/mode, fail-open spawn,
 * and no-op delivery surfaces.
 */
export function createDefaultHostPorts(overrides = {}) {
    const unknownMode = () => "unknown";
    const defaults = {
        notify: { user: () => { } },
        trust: { isProjectTrusted: () => "unknown" },
        mode: {
            current: unknownMode,
            supportsTuiWidget: () => true,
            suppressesUserNotify: () => false,
        },
        log: { extension: () => { }, debug: () => { }, sink: () => () => { } },
        emit: { bus: () => { } },
        status: { set: () => { } },
        spawn: { abortSignal: () => undefined, isAllowed: () => true },
        render: { invalidate: () => { } },
        session: { id: () => undefined },
        workspace: { cwd: () => undefined, projectRoot: () => undefined },
        flags: { get: () => undefined },
        tools: { has: async () => false, getActive: () => [], setActive: () => { } },
    };
    return Object.fromEntries(Object.entries(defaults).map(([group, value]) => [
        group,
        { ...value, ...(overrides[group] ?? {}) },
    ]));
}
