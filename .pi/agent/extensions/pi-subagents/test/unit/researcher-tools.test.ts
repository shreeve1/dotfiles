import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const settingsPath = new URL("../../../../settings.json", import.meta.url);
const templatePath = new URL("../../../../settings.json.template", import.meta.url);

async function readResearcherTools(path: URL) {
	const raw = await readFile(path, "utf8");
	const settings = JSON.parse(raw);
	const tools = settings.subagents.agentOverrides.researcher.tools;
	assert.ok(Array.isArray(tools), `researcher.tools present in ${path.pathname}`);
	return tools as string[];
}

for (const path of [settingsPath, templatePath]) {
	const label = path.pathname.split("/").slice(-2).join("/");
	test(`${label} researcher.tools references web_search and web_fetch only`, async () => {
		const tools = await readResearcherTools(path);
		assert.ok(tools.includes("web_search"));
		assert.ok(tools.includes("web_fetch"));
		assert.ok(!tools.includes("fetch_content"));
		assert.ok(!tools.includes("get_search_content"));
	});
}
