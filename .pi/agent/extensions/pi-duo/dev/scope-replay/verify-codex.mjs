// Bridge: run the scope-gate verdict through a real Pi provider model (e.g.
// openai-codex/gpt-5.6-terra), reusing Pi's own AuthStorage + ModelRegistry so
// OAuth token refresh and codex headers are handled for us. deepseek is a plain
// key (replay.py calls it directly); codex is OAuth, so it must go through Pi.
//
// Usage: MODEL_SLOT="openai-codex/gpt-5.6-terra" node verify-codex.mjs
//   stdin  = JSON { prefix, trailing }  (the two user messages replay.py builds)
//   stdout = the verifier's raw text
import { AuthStorage } from "/home/james/.npm-global/lib/node_modules/@earendil-works/pi-coding-agent/dist/core/auth-storage.js";
import { ModelRegistry } from "/home/james/.npm-global/lib/node_modules/@earendil-works/pi-coding-agent/dist/core/model-registry.js";
// Must be the SAME pi-ai instance ModelRegistry registers providers into (the
// one nested under the global pi-coding-agent), or the provider lookup misses.
import { completeSimple } from "/home/james/.npm-global/lib/node_modules/@earendil-works/pi-coding-agent/node_modules/@earendil-works/pi-ai/dist/compat.js";

const slot = process.env.MODEL_SLOT || "openai-codex/gpt-5.6-terra";
const [provider, ...rest] = slot.split("/");
const modelId = rest.join("/");

const input = JSON.parse(await new Promise((res) => {
	let s = "";
	process.stdin.on("data", (d) => (s += d));
	process.stdin.on("end", () => res(s));
}));

const registry = ModelRegistry.create(AuthStorage.create());
const model = registry.find(provider, modelId);
if (!model) throw new Error(`model not found: ${slot}`);
const auth = await registry.getApiKeyAndHeaders(model);
if (!auth.ok) throw new Error(auth.error);

const msg = await completeSimple(
	model,
	{
		messages: [
			{ role: "user", content: input.prefix, timestamp: Date.now() },
			{ role: "user", content: input.trailing, timestamp: Date.now() },
		],
	},
	{
		apiKey: auth.apiKey,
		headers: auth.headers,
		env: auth.env,
		// codex-responses rejects `temperature`; reasoning models run at fixed temp.
		maxTokens: 4000,
		reasoning: "low",
	},
);

const text = (msg.content || [])
	.filter((b) => b.type === "text")
	.map((b) => b.text)
	.join("\n");
process.stdout.write(text || "(empty)");
