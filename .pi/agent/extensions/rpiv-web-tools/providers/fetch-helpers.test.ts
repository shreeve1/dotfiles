import { describe, expect, it } from "vitest";
import {
	assertPublicHttpUrl,
	htmlToText,
	isHtmlContentType,
	truncateErrorBody,
} from "./fetch-helpers.js";

describe("assertPublicHttpUrl", () => {
	it("accepts public http URLs", () => {
		const parsed = assertPublicHttpUrl("http://example.com/path");
		expect(parsed.hostname).toBe("example.com");
		expect(parsed.protocol).toBe("http:");
	});

	it("accepts public https URLs", () => {
		const parsed = assertPublicHttpUrl("https://example.com");
		expect(parsed.hostname).toBe("example.com");
	});

	it("rejects non-http protocols", () => {
		expect(() => assertPublicHttpUrl("ftp://example.com")).toThrow(
			"Unsupported URL protocol: ftp:",
		);
		expect(() => assertPublicHttpUrl("file:///etc/passwd")).toThrow(
			"Unsupported URL protocol: file:",
		);
	});

	it("rejects localhost", () => {
		expect(() => assertPublicHttpUrl("http://localhost")).toThrow(
			"Refusing to fetch private/loopback address: localhost",
		);
		expect(() => assertPublicHttpUrl("http://localhost:8080")).toThrow(
			"Refusing to fetch private/loopback address: localhost",
		);
	});

	it("rejects 127.0.0.0/8", () => {
		expect(() => assertPublicHttpUrl("http://127.0.0.1")).toThrow();
		expect(() => assertPublicHttpUrl("http://127.255.255.254")).toThrow();
	});

	it("rejects RFC1918 addresses", () => {
		expect(() => assertPublicHttpUrl("http://10.0.0.1")).toThrow();
		expect(() => assertPublicHttpUrl("http://172.16.0.1")).toThrow();
		expect(() => assertPublicHttpUrl("http://192.168.1.1")).toThrow();
	});

	it("rejects link-local addresses", () => {
		expect(() => assertPublicHttpUrl("http://169.254.169.254")).toThrow();
	});

	it("rejects IPv6 loopback", () => {
		expect(() => assertPublicHttpUrl("http://[::1]")).toThrow();
		expect(() => assertPublicHttpUrl("http://[fe80::1]")).toThrow();
	});

	it("rejects URL-encoded private hostnames", () => {
		// %6C%6F%63%61%6C%68%6F%73%74 = localhost
		expect(() =>
			assertPublicHttpUrl("http://%6C%6F%63%61%6C%68%6F%73%74"),
		).toThrow();
		// %31%32%37%2E%30%2E%30%2E%31 = 127.0.0.1
		expect(() =>
			assertPublicHttpUrl("http://%31%32%37%2E%30%2E%30%2E%31"),
		).toThrow();
	});

	it("accepts public URLs with ports", () => {
		const parsed = assertPublicHttpUrl("https://example.com:8443/path");
		expect(parsed.hostname).toBe("example.com");
		expect(parsed.port).toBe("8443");
	});
});

describe("htmlToText", () => {
	it("strips scripts and styles", () => {
		const html = "<html><script>alert('xss')</script><body>Hello</body></html>";
		expect(htmlToText(html)).toBe("Hello");
	});

	it("decodes HTML entities", () => {
		expect(htmlToText("Tom &amp; Jerry")).toBe("Tom & Jerry");
		expect(htmlToText("5 &lt; 10")).toBe("5 < 10");
	});

	it("extracts title", () => {
		const html =
			"<html><head><title>Page Title</title></head><body>content</body></html>";
		expect(htmlToText(html)).toContain("content");
	});
});

describe("isHtmlContentType", () => {
	it("detects HTML content types", () => {
		expect(isHtmlContentType("text/html; charset=utf-8")).toBe(true);
		expect(isHtmlContentType("application/json")).toBe(false);
	});
});

describe("truncateErrorBody", () => {
	it("returns short bodies unchanged", () => {
		expect(truncateErrorBody("short")).toBe("short");
	});

	it("truncates long bodies", () => {
		const long = "x".repeat(1000);
		const truncated = truncateErrorBody(long, 100);
		expect(truncated.length).toBeLessThan(long.length);
		expect(truncated.endsWith("... [truncated]")).toBe(true);
	});
});
