import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  withFactTree
} from "./chunk-GXW6K4YJ.js";
import {
  childrenOfType,
  firstChildOfType,
  walk
} from "./chunk-QHJ6DQ2R.js";
import {
  isJstsFactFile
} from "./chunk-PHDMFAKM.js";
import {
  logLatency
} from "./chunk-QQNQ7SJW.js";

// dist/clients/dispatch/facts/import-facts.js
function importFactsApplyTo(filePath) {
  return isJstsFactFile(filePath);
}
function stripQuotes(raw) {
  return raw.replace(/^["'`]+|["'`]+$/g, "");
}
function parseStaticImport(node, moduleType) {
  const sourceNode = firstChildOfType(node, "string");
  if (!sourceNode)
    return null;
  const source = stripQuotes(sourceNode.text);
  const clause = firstChildOfType(node, "import_clause");
  if (!clause) {
    return { source, names: [], moduleType };
  }
  const entry = { source, names: [], moduleType };
  for (const child of clause.children ?? []) {
    if (!child)
      continue;
    if (child.type === "identifier") {
      entry.defaultName = child.text;
    } else if (child.type === "namespace_import") {
      const id = firstChildOfType(child, "identifier");
      if (id)
        entry.namespace = id.text;
    } else if (child.type === "named_imports") {
      for (const spec of childrenOfType(child, "import_specifier")) {
        const ids = childrenOfType(spec, "identifier");
        const local = ids.length ? ids[ids.length - 1].text : void 0;
        if (local)
          entry.names.push(local);
      }
    }
  }
  return entry;
}
function parseReExport(node) {
  const sourceNode = firstChildOfType(node, "string");
  if (!sourceNode)
    return null;
  const source = stripQuotes(sourceNode.text);
  const clause = firstChildOfType(node, "export_clause");
  if (!clause) {
    return { source, names: [] };
  }
  const names = [];
  for (const spec of childrenOfType(clause, "export_specifier")) {
    const ids = childrenOfType(spec, "identifier");
    const name = ids.length ? ids[ids.length - 1].text : void 0;
    if (name)
      names.push(name);
  }
  return { source, names };
}
var importFactProvider = {
  id: "fact.file.imports",
  provides: ["file.imports", "file.reexports", "file.importFactsCoverage"],
  requires: ["file.content"],
  appliesTo(ctx) {
    return importFactsApplyTo(ctx.filePath);
  },
  async run(ctx, store) {
    const content = store.getFileFact(ctx.filePath, "file.content");
    const setEmpty = (complete = false) => {
      store.setFileFact(ctx.filePath, "file.imports", []);
      store.setFileFact(ctx.filePath, "file.reexports", []);
      store.setFileFact(ctx.filePath, "file.importFactsCoverage", complete ? "complete" : "unavailable");
    };
    if (content == null) {
      setEmpty();
      return;
    }
    const parsed = await withFactTree(ctx.filePath, content, (root) => {
      let hasEsm = false;
      let hasCjs = false;
      const importNodes = [];
      const reExportNodes = [];
      for (const child of root.children ?? []) {
        if (!child)
          continue;
        if (child.type === "import_statement") {
          hasEsm = true;
          importNodes.push(child);
        } else if (child.type === "export_statement") {
          const isReExport = Boolean(firstChildOfType(child, "from"));
          if (isReExport || firstChildOfType(child, "export_clause")) {
            hasEsm = true;
          }
          if (isReExport)
            reExportNodes.push(child);
        }
      }
      const dynamicRaw = [];
      walk(root, (node) => {
        if (node.type === "call_expression") {
          const callee = node.children?.[0];
          const args = firstChildOfType(node, "arguments");
          const strArg = args ? firstChildOfType(args, "string") : void 0;
          if (!strArg)
            return;
          const source = stripQuotes(strArg.text);
          if (callee?.type === "import") {
            dynamicRaw.push({ source, kind: "import" });
          } else if (callee?.type === "identifier" && callee.text === "require") {
            dynamicRaw.push({ source, kind: "require" });
            hasCjs = true;
          }
        } else if (node.type === "member_expression") {
          const obj = node.children?.[0];
          if (obj?.type === "identifier" && obj.text === "module") {
            const prop = firstChildOfType(node, "property_identifier");
            if (prop?.text === "exports")
              hasCjs = true;
          }
        }
      });
      const moduleType = hasEsm && !hasCjs ? "esm" : hasCjs && !hasEsm ? "cjs" : hasEsm || hasCjs ? "esm" : "unknown";
      const imports = [];
      for (const node of importNodes) {
        const entry = parseStaticImport(node, moduleType);
        if (entry)
          imports.push(entry);
      }
      let dynamicCount = 0;
      for (const d of dynamicRaw) {
        if (d.kind === "import") {
          imports.push({
            source: d.source,
            names: [],
            isDynamic: true,
            moduleType
          });
        } else {
          imports.push({ source: d.source, names: [], moduleType: "cjs" });
        }
        dynamicCount++;
      }
      store.setFileFact(ctx.filePath, "file.imports", imports);
      const reexports = [];
      for (const node of reExportNodes) {
        const r = parseReExport(node);
        if (r)
          reexports.push(r);
      }
      store.setFileFact(ctx.filePath, "file.reexports", reexports);
      if (dynamicCount > 0 || reexports.length > 0) {
        logLatency({
          type: "call_graph_facts",
          filePath: ctx.filePath,
          durationMs: 0,
          metadata: {
            moduleType,
            staticImports: imports.length - dynamicCount,
            dynamicImports: dynamicCount,
            reexports: reexports.length,
            starReexports: reexports.filter((r) => r.names.length === 0).length
          }
        });
      }
    }, importFactProvider.id);
    if (!parsed.parsed)
      setEmpty();
    else
      store.setFileFact(ctx.filePath, "file.importFactsCoverage", "complete");
  }
};

export {
  importFactsApplyTo,
  importFactProvider
};
