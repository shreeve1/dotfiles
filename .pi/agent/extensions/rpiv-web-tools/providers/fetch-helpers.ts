/**
 * Shared fetch helpers — HTTP client, content-type guards, and HTML-to-text
 * extraction used by providers that wrap the built-in pipeline (Brave, Serper).
 */

import type { FetchResponse } from "./types.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const USER_AGENT = "Mozilla/5.0 (compatible; rpiv-pi/1.0)";
const FETCH_ACCEPT_HEADER =
	"text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5";
const BINARY_CONTENT_TYPE_PREFIXES = ["image/", "video/", "audio/"];
const HTML_CONTENT_TYPE_TOKEN = "text/html";
const FETCH_TIMEOUT_MS = 30_000;
const MAX_ERROR_BODY_CHARS = 500;

// ---------------------------------------------------------------------------
// HTML-to-text extraction
// ---------------------------------------------------------------------------

const SCRIPT_BLOCK_REGEX = /<script[\s\S]*?<\/script>/gi;
const STYLE_BLOCK_REGEX = /<style[\s\S]*?<\/style>/gi;
const NOSCRIPT_BLOCK_REGEX = /<noscript[\s\S]*?<\/noscript>/gi;
const BLOCK_CLOSER_REGEX =
	/<\/(p|div|h[1-6]|li|tr|br|blockquote|pre|section|article|header|footer|nav|details|summary)>/gi;
const SELF_CLOSING_BR_REGEX = /<br\s*\/?>/gi;
const ANY_REMAINING_TAG_REGEX = /<[^>]+>/g;
const TITLE_TAG_REGEX = /<title[^>]*>([\s\S]*?)<\/title>/i;
const NUMERIC_HTML_ENTITY_REGEX = /&#(\d+);/g;
const HORIZONTAL_WHITESPACE_RUN = /[ \t]+/g;
const BLANK_LINE_RUN = /\n{3,}/g;

function stripNonContentBlocks(html: string): string {
	return html
		.replace(SCRIPT_BLOCK_REGEX, "")
		.replace(STYLE_BLOCK_REGEX, "")
		.replace(NOSCRIPT_BLOCK_REGEX, "");
}

function convertBlockTagsToNewlines(text: string): string {
	return text
		.replace(BLOCK_CLOSER_REGEX, "\n")
		.replace(SELF_CLOSING_BR_REGEX, "\n");
}

function stripRemainingTags(text: string): string {
	return text.replace(ANY_REMAINING_TAG_REGEX, " ");
}

function decodeHtmlEntities(text: string): string {
	return text
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, " ")
		.replace(NUMERIC_HTML_ENTITY_REGEX, (_, code) =>
			String.fromCharCode(Number(code)),
		);
}

function collapseWhitespace(text: string): string {
	return text
		.replace(HORIZONTAL_WHITESPACE_RUN, " ")
		.replace(BLANK_LINE_RUN, "\n\n");
}

export function htmlToText(html: string): string {
	let text = stripNonContentBlocks(html);
	text = convertBlockTagsToNewlines(text);
	text = stripRemainingTags(text);
	text = decodeHtmlEntities(text);
	text = collapseWhitespace(text);
	return text.trim();
}

export function extractTitle(html: string): string | undefined {
	const match = html.match(TITLE_TAG_REGEX);
	if (!match) return undefined;
	return match[1].replace(ANY_REMAINING_TAG_REGEX, "").trim() || undefined;
}

// ---------------------------------------------------------------------------
// URL + content-type guards
// ---------------------------------------------------------------------------

export function isHtmlContentType(contentType: string): boolean {
	return contentType.includes(HTML_CONTENT_TYPE_TOKEN);
}

export function assertTextContentType(contentType: string): void {
	if (
		BINARY_CONTENT_TYPE_PREFIXES.some((prefix) => contentType.includes(prefix))
	) {
		throw new Error(
			`Unsupported content type: ${contentType}. web_fetch supports text pages only.`,
		);
	}
}

// ---------------------------------------------------------------------------
// HTTP fetch
// ---------------------------------------------------------------------------

export function buildFetchRequestInit(
	signal: AbortSignal | undefined,
): RequestInit {
	return {
		signal,
		redirect: "follow",
		headers: { "User-Agent": USER_AGENT, Accept: FETCH_ACCEPT_HEADER },
	};
}

// ---------------------------------------------------------------------------
// SSRF guard — shared across all direct-HTTP fetch paths
// ---------------------------------------------------------------------------

function isPrivateOrLoopbackHostname(hostname: string): boolean {
	const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
	if (h === "localhost" || h.endsWith(".localhost")) return true;
	// IPv6 loopback / unspecified / link-local / unique-local
	if (
		h === "::1" ||
		h === "::" ||
		h.startsWith("fe80:") ||
		h.startsWith("fc") ||
		h.startsWith("fd")
	)
		return true;
	// IPv4 literals
	const v4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
	if (!v4) return false;
	const [a, b] = [Number(v4[1]), Number(v4[2])];
	if (a === 0 || a === 127 || a === 10) return true; // 0.0.0.0/8, loopback, RFC1918
	if (a === 169 && b === 254) return true; // link-local (incl. AWS metadata 169.254.169.254)
	if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918 172.16.0.0/12
	if (a === 192 && b === 168) return true; // RFC1918 192.168.0.0/16
	return false;
}

export function assertPublicHttpUrl(url: string): URL {
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		throw new Error(`Invalid URL: ${url}`);
	}
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		throw new Error(
			`Unsupported URL protocol: ${parsed.protocol}. Only http and https are supported.`,
		);
	}
	// Strip percent-encoding before hostname check (e.g. %36%31... → "61...")
	const decodedHost = decodeURIComponent(parsed.hostname);
	if (isPrivateOrLoopbackHostname(decodedHost)) {
		throw new Error(
			`Refusing to fetch private/loopback address: ${parsed.hostname}`,
		);
	}
	return parsed;
}

// ---------------------------------------------------------------------------
// HTTP fetch with timeout + SSRF guard
// ---------------------------------------------------------------------------

export function withTimeout(signal?: AbortSignal): AbortSignal {
	const timeoutSignal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
	if (!signal) return timeoutSignal;
	// Node 20+ supports AbortSignal.any; fallback for older runtimes
	if (typeof (AbortSignal as any).any === "function") {
		return (AbortSignal as any).any([signal, timeoutSignal]);
	}
	// Manual fallback: race the two signals
	const controller = new AbortController();
	const onAbort = () => controller.abort();
	signal.addEventListener("abort", onAbort, { once: true });
	timeoutSignal.addEventListener("abort", onAbort, { once: true });
	return controller.signal;
}

export async function fetchUrlOrThrow(
	url: string,
	signal: AbortSignal | undefined,
): Promise<Response> {
	assertPublicHttpUrl(url);
	const combinedSignal = withTimeout(signal);
	const res = await fetch(url, buildFetchRequestInit(combinedSignal));
	if (!res.ok) {
		throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
	}
	return res;
}

// ---------------------------------------------------------------------------
// Error response sanitization
// ---------------------------------------------------------------------------

export function truncateErrorBody(
	body: string,
	maxChars = MAX_ERROR_BODY_CHARS,
): string {
	if (body.length <= maxChars) return body;
	return body.slice(0, maxChars) + "... [truncated]";
}

// ---------------------------------------------------------------------------
// Direct HTTP fetch pipeline — used by extraction providers when raw: true
// ---------------------------------------------------------------------------

export async function fetchDirectHttp(
	url: string,
	raw: boolean,
	signal?: AbortSignal,
): Promise<FetchResponse> {
	const res = await fetchUrlOrThrow(url, signal);
	const contentType = res.headers.get("content-type") ?? "";
	assertTextContentType(contentType);
	const { text, title } = await extractBodyAsText(res, contentType, raw);
	const contentLengthHeader = res.headers.get("content-length");
	return {
		text,
		title,
		contentType: contentType || undefined,
		contentLength: contentLengthHeader
			? Number(contentLengthHeader)
			: undefined,
	};
}

export async function extractBodyAsText(
	res: Response,
	contentType: string,
	raw: boolean,
): Promise<{ text: string; title?: string }> {
	const body = await res.text();
	if (!raw && isHtmlContentType(contentType)) {
		return { text: htmlToText(body), title: extractTitle(body) };
	}
	return { text: body };
}
