import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  withTreeSitterRoot
} from "./chunk-QHJ6DQ2R.js";

// dist/clients/dispatch/facts/tree-sitter-facts.js
var withFactTree = withTreeSitterRoot;
async function extractFactsFromTree(ctx, store, caller, defaults, extract, coverageFact) {
  const writeAll = (facts, complete) => {
    for (const key of Object.keys(defaults)) {
      store.setFileFact(ctx.filePath, key, facts[key] ?? defaults[key]);
    }
    if (coverageFact) {
      store.setFileFact(ctx.filePath, coverageFact, complete ? "complete" : "unavailable");
    }
  };
  const content = store.getFileFact(ctx.filePath, "file.content");
  if (content == null)
    return writeAll(defaults, false);
  const parsed = await withFactTree(ctx.filePath, content, (root) => extract(root, content), caller);
  writeAll(parsed.parsed ? parsed.value : defaults, parsed.parsed);
}

export {
  withFactTree,
  extractFactsFromTree
};
