// Offline smoke for subagent-bridge — see subagent-bridge-smoke.sh header.
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const extDir = path.resolve(here, "..");
const { createJiti } = await import(
	path.resolve(extDir, "../pi-subagents/node_modules/jiti/lib/jiti.mjs")
);
const jiti = createJiti(path.join(extDir, "index.ts"));

const mod = await jiti.import(path.join(extDir, "index.ts"));
assert.equal(typeof mod.default, "function", "default export is a function");

const registry = await jiti.import(
	path.resolve(extDir, "../hub-kit/registry.ts"),
);

// Stub ExtensionAPI: capture pi.on handlers, ignore the event bus + commands.
const handlers = new Map();
const pi = {
	events: { on: () => () => {}, emit: () => {} },
	on: (event, handler) => handlers.set(event, handler),
	registerCommand: () => {},
};
mod.default(pi);

const provider = registry
	.listActivityProviders()
	.find((p) => p.id === "pi-subagents");
assert.ok(provider, "activity provider registered");
assert.ok(handlers.has("tool_execution_start"), "tool_execution_start hooked");
assert.ok(handlers.has("tool_execution_end"), "tool_execution_end hooked");

const start = (toolCallId, args) =>
	handlers.get("tool_execution_start")({
		type: "tool_execution_start",
		toolCallId,
		toolName: "subagent",
		args,
	});
const end = (toolCallId, result, isError = false) =>
	handlers.get("tool_execution_end")({
		type: "tool_execution_end",
		toolCallId,
		toolName: "subagent",
		result,
		isError,
	});

// (2) spawn-shaped sync call becomes a running item keyed by toolCallId
start("tc-1", { agent: "scout", task: "look around" });
let items = provider.list();
assert.equal(items.length, 1, "one tracked run");
assert.equal(items[0].id, "tc-1");
assert.equal(items[0].state, "running");
assert.match(items[0].title, /scout/);

// (3) end re-keys to details.runId, completes, keeps finalOutput tail
end("tc-1", {
	details: {
		mode: "single",
		runId: "run-1234",
		results: [{ agent: "scout", exitCode: 0, finalOutput: "line1\nline2" }],
	},
});
items = provider.list();
assert.equal(items.length, 1, "re-key does not duplicate");
assert.equal(items[0].id, "run-1234");
assert.equal(items[0].state, "complete");
const detail = provider
	.detail(items[0])
	.map((section) => section.lines.join("\n"))
	.join("\n");
assert.match(detail, /line2/, "finalOutput tail shown in detail");

// (4) management + async:true calls are not tracked
start("tc-2", { action: "list" });
start("tc-3", { agent: "scout", task: "x", async: true });
assert.equal(provider.list().length, 1, "action/async calls not tracked");

// failed sync run
start("tc-4", { agent: "worker", task: "y" });
end("tc-4", {
	details: {
		mode: "single",
		runId: "run-5678",
		results: [{ agent: "worker", exitCode: 1, error: "boom" }],
	},
});
assert.equal(
	provider.list().find((item) => item.id === "run-5678")?.state,
	"failed",
	"nonzero exitCode marks failed",
);

// (5) result carrying asyncDir is dropped (async events own the run)
start("tc-5", { agent: "scout", task: "z" });
end("tc-5", {
	details: { mode: "single", runId: "run-9", asyncDir: "/tmp/x" },
});
assert.ok(
	!provider.list().some((item) => item.id === "tc-5" || item.id === "run-9"),
	"async-by-default run dropped at end",
);

console.log("subagent-bridge smoke: OK");
process.exit(0);
