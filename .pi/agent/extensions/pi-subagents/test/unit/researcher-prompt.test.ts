import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const promptUrl = new URL("../../agents/researcher.md", import.meta.url);

test("researcher prompt uses rpiv-web-tools API", async () => {
	const source = await readFile(promptUrl, "utf8");
	const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
	assert.ok(match, "researcher prompt has frontmatter");

	const toolsLine = match[1].match(/^tools:\s*(.+)$/m);
	assert.ok(toolsLine, "frontmatter has tools");
	const tools = toolsLine[1].split(",").map((tool) => tool.trim());
	const body = match[2];

	assert.ok(tools.includes("web_search"));
	assert.ok(tools.includes("web_fetch"));
	assert.ok(!tools.includes("write"));
	assert.ok(!tools.includes("fetch_content"));
	assert.ok(!tools.includes("get_search_content"));
	assert.match(body, /web_search\(\{query, max_results\?\}\)/);
	assert.match(body, /web_fetch\(\{url, raw\?\}\)/);
	assert.doesNotMatch(
		body,
		/fetch_content|get_search_content|workflow: "none"/,
	);
});
