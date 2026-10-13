import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);

// dist/clients/cooperative-budget.js
function createDeadline(budgetMs) {
  const boundedBudget = Math.max(0, budgetMs);
  let startedAt = performance.now();
  return {
    expired: () => performance.now() - startedAt >= boundedBudget,
    reset: () => {
      startedAt = performance.now();
    }
  };
}
async function yieldIfOverBudget(deadline) {
  if (!deadline.expired())
    return false;
  await new Promise((resolve) => setImmediate(resolve));
  deadline.reset();
  return true;
}
async function forEachCooperatively(items, fn, options) {
  const deadline = createDeadline(options.budgetMs);
  const assertContinuing = () => {
    if (options.shouldContinue?.() === false) {
      throw new Error(options.abortMessage ?? "cooperative work superseded");
    }
  };
  let index = 0;
  for (const item of items) {
    assertContinuing();
    const result = fn(item, index++);
    if (result !== void 0 && typeof result.then === "function") {
      await result;
    }
    if (deadline.expired() && await yieldIfOverBudget(deadline)) {
      assertContinuing();
    }
  }
}

export {
  createDeadline,
  yieldIfOverBudget,
  forEachCooperatively
};
