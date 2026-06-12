import { describe, expect, it } from "vitest";
import { createSearchProvider } from "./factory.js";
import { BraveProvider } from "./brave.js";
import { TavilyProvider } from "./tavily.js";
import { SerperProvider } from "./serper.js";
import { ExaProvider } from "./exa.js";
import { JinaProvider } from "./jina.js";
import { FirecrawlProvider } from "./firecrawl.js";
import { SearxngProvider } from "./searxng.js";

describe("createSearchProvider", () => {
	it("creates BraveProvider", () => {
		const p = createSearchProvider("brave", { apiKey: "key" });
		expect(p).toBeInstanceOf(BraveProvider);
		expect(p.name).toBe("brave");
	});

	it("creates TavilyProvider", () => {
		const p = createSearchProvider("tavily", { apiKey: "key" });
		expect(p).toBeInstanceOf(TavilyProvider);
		expect(p.name).toBe("tavily");
	});

	it("creates SerperProvider", () => {
		const p = createSearchProvider("serper", { apiKey: "key" });
		expect(p).toBeInstanceOf(SerperProvider);
		expect(p.name).toBe("serper");
	});

	it("creates ExaProvider", () => {
		const p = createSearchProvider("exa", { apiKey: "key" });
		expect(p).toBeInstanceOf(ExaProvider);
		expect(p.name).toBe("exa");
	});

	it("creates JinaProvider", () => {
		const p = createSearchProvider("jina", { apiKey: "key" });
		expect(p).toBeInstanceOf(JinaProvider);
		expect(p.name).toBe("jina");
	});

	it("creates FirecrawlProvider", () => {
		const p = createSearchProvider("firecrawl", { apiKey: "key" });
		expect(p).toBeInstanceOf(FirecrawlProvider);
		expect(p.name).toBe("firecrawl");
	});

	it("creates SearxngProvider with baseUrl", () => {
		const p = createSearchProvider("searxng", {
			apiKey: "key",
			baseUrl: "http://localhost:8080",
		});
		expect(p).toBeInstanceOf(SearxngProvider);
		expect(p.name).toBe("searxng");
	});

	it("throws for unknown provider", () => {
		expect(() =>
			createSearchProvider("unknown" as any, { apiKey: "key" }),
		).toThrow('Unknown search provider: "unknown"');
	});
});
