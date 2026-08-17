/** Lazy dispatch integration seam for startup-cost control (#1394). */
let integrationPromise;
/** Start loading the runner graph once; callers may fire-and-forget this. */
export function warmDispatchIntegration() {
    return (integrationPromise ??= import("./integration.js"));
}
/** Await the same promise used by session-start warming and first use. */
export function loadDispatchIntegration() {
    return warmDispatchIntegration();
}
/** Test-only reset; production sessions intentionally retain the promise. */
export function resetDispatchIntegrationForTests() {
    integrationPromise = undefined;
}
