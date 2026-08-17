/** Monotonic cooperative-work budgeting for event-loop-sensitive bulk work. */
export function createDeadline(budgetMs) {
    const boundedBudget = Math.max(0, budgetMs);
    let startedAt = performance.now();
    return {
        expired: () => performance.now() - startedAt >= boundedBudget,
        reset: () => {
            startedAt = performance.now();
        },
    };
}
export async function yieldIfOverBudget(deadline) {
    if (!deadline.expired())
        return false;
    await new Promise((resolve) => setImmediate(resolve));
    deadline.reset();
    return true;
}
export async function forEachCooperatively(items, fn, options) {
    const deadline = createDeadline(options.budgetMs);
    const assertContinuing = () => {
        if (options.shouldContinue?.() === false) {
            throw new Error(options.abortMessage ?? "cooperative work superseded");
        }
    };
    let index = 0;
    for (const item of items) {
        // Check before each unit: this per-unit check is what bounds abort
        // latency (one work unit, not an iteration checkpoint). The post-yield
        // check below only matters after the final unit's yield, so superseded
        // work is reported aborted rather than completed.
        assertContinuing();
        const result = fn(item, index++);
        if (result !== undefined &&
            typeof result.then === "function") {
            await result;
        }
        if (deadline.expired() && (await yieldIfOverBudget(deadline))) {
            assertContinuing();
        }
    }
}
