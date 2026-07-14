// Runnable check for the scope-gate context builders in ../../src/duo-core.ts.
// No framework: assert-based, exits non-zero on failure. Run: node check-scope-context.mjs
import assert from "node:assert";
import {
	verifierContext,
	distillContext,
	actingContext,
	VERIFIER_SCOPE_PROMPT,
	CONVENTIONS_DISTILL_PROMPT,
} from "../../src/duo-core.ts";

const config = {
	maxToolResultChars: 6000,
	maxVerifierContextChars: 80000,
	verifierMaxTokens: 700,
};

// A mid-loop context: user request for THIS turn + one prior assistant step
// (with thinking + a tool call), and the actor's latest interim step (candidate).
const context = {
	systemPrompt: "irrelevant here (conventions are passed in distilled)",
	messages: [
		{ role: "user", content: "remove the pi-moa extension", timestamp: 0 },
		{
			role: "assistant",
			timestamp: 0,
			content: [
				{ type: "thinking", thinking: "I'll grep for pi-moa references first." },
				{ type: "toolCall", name: "bash", arguments: { command: "grep -r pi-moa ." } },
			],
		},
		{ role: "tool", toolName: "bash", content: "found 3 matches", timestamp: 0 },
	],
};
const candidate = {
	role: "assistant",
	content: [
		{ type: "thinking", thinking: "Now I'll also rewrite the whole wiki." },
		{ type: "toolCall", name: "edit", arguments: { path: "wiki/raw/topology.md" } },
	],
	timestamp: 0,
};

const CONV = "- Editing wiki/CLAIMS.md is REQUIRED convention work, NOT scope creep.";
const scoped = verifierContext(context, candidate, config, "scope", CONV);
const prefix = scoped.messages[0].content[0].text;

// 1. scope prompt drives the gate
assert(prefix.startsWith(VERIFIER_SCOPE_PROMPT.slice(0, 60)), "scope prompt missing from prefix");
// 2. conventions + original request are surfaced in the tuned order
assert(prefix.includes("# PROJECT CONVENTIONS"), "conventions header missing");
assert(prefix.includes(CONV), "distilled conventions not injected");
assert(prefix.includes("# The user's ORIGINAL request for this turn"), "request header missing");
assert(prefix.includes("remove the pi-moa extension"), "original request not surfaced");
// 3. scope evidence is enriched: actor thinking + tool-call args are visible
assert(prefix.includes("grep -r pi-moa"), "tool-call args not surfaced in scope evidence");
assert(prefix.includes("[reasoning:"), "actor thinking not surfaced in scope evidence");
// 4. candidate (interim step) carries its args + reasoning, labelled as interim
const candText = scoped.messages[1].content;
assert(candText.includes("Latest interim step to verify"), "wrong candidate label for scope");
assert(candText.includes("wiki/raw/topology.md"), "candidate tool args missing");

// 5. terminal mode is UNCHANGED: no conventions/request preamble, name-only tools
const term = verifierContext(context, candidate, config, "terminal");
const termPrefix = term.messages[0].content[0].text;
assert(!termPrefix.includes("# PROJECT CONVENTIONS"), "terminal leaked scope preamble");
assert(!termPrefix.includes("grep -r pi-moa"), "terminal leaked tool args");
assert(!termPrefix.includes("[reasoning:"), "terminal leaked actor thinking");

// 6. distillContext wraps the raw doc with the distill prompt
const dc = distillContext("# some CLAUDE.md\nrules here");
assert(dc.messages[0].content.includes(CONVENTIONS_DISTILL_PROMPT.slice(0, 60)), "distill prompt missing");
assert(dc.messages[0].content.includes("some CLAUDE.md"), "raw conventions not wrapped");

// 7. actingContext framing differs by kind
const scopeNudge = actingContext(context, [{ label: "r1", text: "too broad" }], "scope").messages.at(-1).content;
const grounding = actingContext(context, [{ label: "r1", text: "unverified" }], "grounding").messages.at(-1).content;
assert(scopeNudge.includes("automated scope check"), "scope nudge framing missing");
assert(grounding.includes("automated grounding check"), "grounding framing missing");

console.log("check-scope-context: all assertions passed");
