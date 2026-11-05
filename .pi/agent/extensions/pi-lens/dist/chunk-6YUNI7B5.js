import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  extractFactsFromTree
} from "./chunk-7TNILKGY.js";
import {
  findOwnerName
} from "./chunk-5W3R6LFT.js";
import {
  firstChildOfType,
  walk
} from "./chunk-BHWW6FAX.js";
import {
  isJstsFactFile
} from "./chunk-G5GV2Q7K.js";

// dist/clients/dispatch/facts/function-facts.js
var BOUNDARY_PREFIXES = [
  "fetch",
  "fs.",
  "db.",
  "http",
  "axios",
  "got",
  "req.",
  "res."
];
var FUNCTION_TYPES = /* @__PURE__ */ new Set([
  "function_declaration",
  "method_definition",
  "function_expression",
  "arrow_function"
]);
var COMPLEXITY_TYPES = /* @__PURE__ */ new Set([
  "if_statement",
  "for_statement",
  "for_in_statement",
  // for…of and for…in both parse to for_in_statement
  "while_statement",
  "do_statement",
  "switch_case",
  // `case` only — `default` (switch_default) is not counted
  "catch_clause",
  "ternary_expression"
]);
var NESTING_TYPES = /* @__PURE__ */ new Set([
  "if_statement",
  "for_statement",
  "for_in_statement",
  "while_statement",
  "do_statement",
  "switch_statement",
  "try_statement"
]);
var LOGICAL_OPERATORS = /* @__PURE__ */ new Set(["&&", "||", "??"]);
function namedChildren(node) {
  return (node.children ?? []).filter((c) => c && c.isNamed && c.type !== "comment");
}
function firstNamedChild(node) {
  return namedChildren(node)[0];
}
function getBody(node) {
  return firstChildOfType(node, "statement_block");
}
function getParameters(node) {
  const fp = firstChildOfType(node, "formal_parameters");
  if (!fp)
    return [];
  return (fp.children ?? []).filter((c) => c && (c.type === "identifier" || c.type === "required_parameter" || c.type === "optional_parameter" || c.type === "rest_pattern" || c.type === "assignment_pattern" || // Plain JavaScript's grammar places a top-level destructured
  // parameter directly as an object_pattern/array_pattern child
  // of formal_parameters — no required_parameter wrapper (the TS
  // grammar always wraps every parameter, destructured or not,
  // which is why the wrapper types above already covered TS).
  // Without this, `function f({a, b})` counted 0 params in JS
  // while the TS-annotated equivalent counted correctly (#1089 P3-4).
  c.type === "object_pattern" || c.type === "array_pattern"));
}
function parameterName(param) {
  return param.type === "identifier" ? param.text : firstNamedChild(param)?.text ?? "";
}
function getFunctionName(node) {
  if (node.type === "function_declaration") {
    return firstChildOfType(node, "identifier")?.text ?? "<anonymous>";
  }
  if (node.type === "method_definition") {
    const kids = node.children ?? [];
    const paramsIdx = kids.findIndex((c) => c?.type === "formal_parameters");
    for (let i = paramsIdx - 1; i >= 0; i -= 1) {
      const t = kids[i]?.type;
      if (t === "property_identifier" || t === "private_property_identifier" || t === "computed_property_name" || t === "string" || t === "number") {
        return kids[i].text;
      }
    }
    return "<anonymous>";
  }
  if (node.type === "arrow_function" || node.type === "function_expression") {
    const parent = node.parent;
    if (parent?.type === "variable_declarator") {
      const id = firstChildOfType(parent, "identifier");
      if (id)
        return id.text;
    } else if (parent?.type === "pair") {
      const key = (parent.children ?? [])[0];
      if (key)
        return key.text;
    }
    return "<anonymous>";
  }
  return "<unknown>";
}
function isCallPassThrough(stmt, paramNames) {
  if (stmt.type !== "return_statement")
    return { pass: false };
  const expr = firstNamedChild(stmt);
  if (!expr || expr.type !== "call_expression")
    return { pass: false };
  const argsNode = firstChildOfType(expr, "arguments");
  const args = argsNode ? namedChildren(argsNode).map((a) => a.text) : [];
  if (args.length !== paramNames.length)
    return { pass: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] !== paramNames[i])
      return { pass: false };
  }
  return { pass: true, target: (expr.children ?? [])[0]?.text };
}
function isDecisionPoint(type, children) {
  if (COMPLEXITY_TYPES.has(type))
    return true;
  return type === "binary_expression" && children.some((c) => LOGICAL_OPERATORS.has(c?.type));
}
function calcCyclomaticComplexity(body) {
  let cc = 1;
  walk(body, (node) => {
    if (isDecisionPoint(node.type, node.children ?? []))
      cc++;
  });
  return cc;
}
function memberCallSite(callee) {
  if (callee?.type !== "member_expression")
    return void 0;
  const object = (callee.children ?? [])[0];
  const property = (callee.children ?? []).find((c) => c?.type === "property_identifier");
  if (object?.type !== "identifier" || !property)
    return void 0;
  return { receiver: object.text, method: property.text };
}
function parameterReceiverTypes(params) {
  const types = {};
  for (const param of params) {
    const id = firstNamedChild(param);
    if (!id || id.type !== "identifier")
      continue;
    const typeAnnotation = (param.children ?? []).find((c) => c?.type === "type_annotation");
    const typeId = typeAnnotation ? firstChildOfType(typeAnnotation, "type_identifier") : void 0;
    if (typeId)
      types[id.text] = typeId.text;
  }
  return types;
}
function returnsAwaitedCall(stmt) {
  const ret = firstNamedChild(stmt);
  return ret?.type === "await_expression" && firstNamedChild(ret)?.type === "call_expression";
}
function addCallFacts(callee, calls, memberCallSites) {
  const calleeText = callee?.text ?? "";
  if (calleeText.length < 80)
    calls.add(calleeText);
  const site = memberCallSite(callee);
  if (site)
    memberCallSites.push(site);
}
function addNewReceiverType(children, receiverTypes) {
  const id = children.find((c) => c?.type === "identifier");
  const value = children.find((c) => c?.type === "new_expression");
  const ctor = value ? firstNamedChild(value) : void 0;
  if (id && ctor?.type === "identifier")
    receiverTypes[id.text] = ctor.text;
}
function summarizeBody(body, params) {
  let hasAwait = false;
  let hasReturnAwaitCall = false;
  let cyclomaticComplexity = 1;
  let maxNestingDepth = 0;
  const calls = /* @__PURE__ */ new Set();
  const memberCallSites = [];
  const receiverTypes = parameterReceiverTypes(params);
  const visit = (node, depth) => {
    const type = node.type;
    const children = node.children ?? [];
    if (depth > maxNestingDepth)
      maxNestingDepth = depth;
    if (isDecisionPoint(type, children))
      cyclomaticComplexity++;
    if (type === "await_expression") {
      hasAwait = true;
    } else if (type === "return_statement") {
      if (returnsAwaitedCall(node))
        hasReturnAwaitCall = true;
    } else if (type === "call_expression") {
      addCallFacts(children[0], calls, memberCallSites);
    } else if (type === "variable_declarator") {
      addNewReceiverType(children, receiverTypes);
    }
    const next = NESTING_TYPES.has(type) ? depth + 1 : depth;
    for (const child of children) {
      if (child)
        visit(child, next);
    }
  };
  visit(body, 0);
  return {
    hasAwait,
    hasReturnAwaitCall,
    cyclomaticComplexity,
    maxNestingDepth,
    outgoingCalls: [...calls],
    memberCallSites,
    receiverTypes
  };
}
function hasExplicitPromiseReturnType(node) {
  const returnType = firstChildOfType(node, "type_annotation");
  if (!returnType)
    return false;
  return /:\s*Promise\b/.test(returnType.text);
}
var functionFactProvider = {
  id: "fact.file.functions",
  provides: ["file.functionSummaries", "file.functionFactsCoverage"],
  requires: ["file.content"],
  appliesTo(ctx) {
    return isJstsFactFile(ctx.filePath);
  },
  async run(ctx, store) {
    await extractFactsFromTree(ctx, store, functionFactProvider.id, { "file.functionSummaries": [] }, (root) => {
      const summaries = [];
      const containers = [];
      const addSummary = (node) => {
        const body = getBody(node);
        if (!body)
          return;
        const params = getParameters(node);
        const paramNames = params.map(parameterName);
        const statements = namedChildren(body);
        const statementCount = statements.length;
        const passThrough = statementCount === 1 ? isCallPassThrough(statements[0], paramNames) : { pass: false };
        const target = passThrough.target ?? "";
        const lowerTarget = target.toLowerCase();
        const isBoundaryWrapper = BOUNDARY_PREFIXES.some((prefix) => lowerTarget.startsWith(prefix));
        const bodySummary = summarizeBody(body, params);
        summaries.push({
          name: getFunctionName(node),
          line: node.startPosition.row + 1,
          column: node.startPosition.column + 1,
          endLine: body.endPosition.row + 1,
          isAsync: Boolean(firstChildOfType(node, "async")),
          hasAwait: bodySummary.hasAwait,
          hasReturnAwaitCall: bodySummary.hasReturnAwaitCall,
          statementCount,
          parameterCount: params.length,
          isPassThroughWrapper: passThrough.pass,
          passThroughTarget: passThrough.target,
          isBoundaryWrapper,
          hasExplicitPromiseReturnType: hasExplicitPromiseReturnType(node),
          cyclomaticComplexity: bodySummary.cyclomaticComplexity,
          maxNestingDepth: bodySummary.maxNestingDepth,
          outgoingCalls: bodySummary.outgoingCalls,
          memberCallSites: bodySummary.memberCallSites,
          receiverTypes: bodySummary.receiverTypes
        });
      };
      walk(root, (node) => {
        const type = node.type;
        if (FUNCTION_TYPES.has(type))
          addSummary(node);
        if (type === "class_declaration" || type === "interface_declaration") {
          const nameNode = firstChildOfType(node, "type_identifier") ?? firstChildOfType(node, "identifier");
          if (nameNode) {
            containers.push({
              name: nameNode.text,
              startLine: node.startPosition.row + 1,
              endLine: node.endPosition.row + 1
            });
          }
        }
      });
      for (const summary of summaries) {
        const owner = findOwnerName(containers, summary.line, summary.endLine ?? summary.line);
        if (owner)
          summary.owner = owner;
      }
      return { "file.functionSummaries": summaries };
    }, "file.functionFactsCoverage");
  }
};

export {
  calcCyclomaticComplexity,
  functionFactProvider
};
