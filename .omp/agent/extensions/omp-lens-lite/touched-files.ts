export interface ToolResultLike {
	toolName?: string;
	input?: Record<string, unknown>;
	details?: unknown;
}

interface EditDetailsLike {
	path?: unknown;
	move?: unknown;
	perFileResults?: Array<{ path?: unknown; move?: unknown }>;
}

const HASHLINE_HEADER_RE = /^¶([^\s#]+)#[0-9A-Fa-f]{4}\s*$/gm;
const RUNTIME_SEGMENTS = ["/node_modules/", "/.git/", "/.omp/agent/logs/", "/logs/", "/sessions/"] as const;
const BINARY_OR_CACHE_EXTENSIONS: Record<string, true> = {
	".7z": true,
	".avif": true,
	".bin": true,
	".bmp": true,
	".cache": true,
	".db": true,
	".db3": true,
	".gif": true,
	".gz": true,
	".ico": true,
	".jpeg": true,
	".jpg": true,
	".lockb": true,
	".mp3": true,
	".mp4": true,
	".pdf": true,
	".png": true,
	".pyc": true,
	".sqlite": true,
	".sqlite3": true,
	".tar": true,
	".tgz": true,
	".wasm": true,
	".webm": true,
	".zip": true,
};
const EXTENSION_RE = /\.[^./]+$/;

export function extractTouchedFiles(event: ToolResultLike): string[] {
	const paths: string[] = [];
	if (event.toolName === "write") {
		pushPath(paths, event.input?.path);
	} else if (event.toolName === "edit") {
		collectEditDetails(paths, event.details);
		if (paths.length === 0) collectHashlineHeaders(paths, event.input);
	} else if (event.toolName === "lsp" && event.input?.action === "diagnostics") {
		pushPath(paths, event.input.file);
	}
	return dedupeAndFilter(paths);
}

export function dedupeAndFilter(paths: readonly string[]): string[] {
	const seen = new Set<string>();
	const result: string[] = [];
	for (const rawPath of paths) {
		const path = normalizePath(rawPath);
		if (!path || seen.has(path) || !isLikelySourcePath(path)) continue;
		seen.add(path);
		result.push(path);
	}
	return result;
}

export function isLikelySourcePath(path: string): boolean {
	if (path.length === 0 || path.endsWith("/")) return false;
	const normalized = path.replace(/\\/g, "/");
	if (normalized.includes("/node_modules/") || normalized.startsWith("node_modules/") || normalized === "node_modules") return false;
	if (normalized.includes("/.git/") || normalized.startsWith(".git/") || normalized === ".git") return false;
	for (const segment of RUNTIME_SEGMENTS) {
		if (normalized.includes(segment)) return false;
	}
	if (normalized.includes("/.pi-lens/")) return false;
	const basename = normalized.slice(normalized.lastIndexOf("/") + 1);
	if (basename.startsWith("omp.") && basename.endsWith(".log")) return false;
	const extensionMatch = EXTENSION_RE.exec(basename);
	if (!extensionMatch) return !basename.includes(".") && isSpecialSourceName(basename);
	return BINARY_OR_CACHE_EXTENSIONS[extensionMatch[0].toLowerCase()] !== true;
}

function collectEditDetails(paths: string[], details: unknown): void {
	if (!isRecord(details)) return;
	const editDetails = details as EditDetailsLike;
	pushPath(paths, editDetails.path);
	pushPath(paths, editDetails.move);
	if (Array.isArray(editDetails.perFileResults)) {
		for (const result of editDetails.perFileResults) {
			pushPath(paths, result.path);
			pushPath(paths, result.move);
		}
	}
}

function collectHashlineHeaders(paths: string[], input: Record<string, unknown> | undefined): void {
	if (!input) return;
	for (const value of Object.values(input)) {
		if (typeof value !== "string") continue;
		HASHLINE_HEADER_RE.lastIndex = 0;
		for (let match = HASHLINE_HEADER_RE.exec(value); match; match = HASHLINE_HEADER_RE.exec(value)) {
			paths.push(match[1]);
		}
	}
}

function pushPath(paths: string[], value: unknown): void {
	if (typeof value === "string" && value.trim().length > 0) paths.push(value);
}

function normalizePath(path: string): string {
	return path.trim().replace(/\\/g, "/");
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isSpecialSourceName(basename: string): boolean {
	return basename === "Makefile" || basename === "Dockerfile" || basename === "Rakefile" || basename === "Gemfile";
}
