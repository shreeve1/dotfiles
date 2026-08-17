/**
 * Identifier-aware inverted word index + BM25 ranking.
 *
 * The lexical half of the "codebase mental model + hybrid ranking" ask (#162):
 * a deterministic, zero-dep index over source identifiers that answers
 * "which files are most relevant to <query>" with BM25 relevance plus a small
 * set of priors (demote tests/vendor and doc files) and an optional graph
 * centrality boost (importedBy count from the reverse-dependency index). It
 * complements LSP/symbol navigation rather than duplicating the host's grep:
 * grep finds raw substrings; this ranks files by identifier relevance.
 *
 * Built from file contents during the session scan, persisted in the project
 * snapshot (serialize/deserialize below), and queried via an MCP tool. No
 * embeddings, no native deps, no daemon — pure in-process TypeScript.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { createDeadline, forEachCooperatively, yieldIfOverBudget, } from "./cooperative-budget.js";
import { KIND_EXTENSIONS } from "./file-kinds.js";
import { PathKeyedMap } from "./path-keyed-map.js";
import { isAtOrAboveHomeDir, normalizeEphemeralMapKey } from "./path-utils.js";
import { createDebounceScheduler, } from "./persist-debounce.js";
import { getWordIndexMaxFilesDerived } from "./project-scale.js";
import { logWordIndex } from "./word-index-logger.js";
/**
 * The single normalizer every word-index path key folds through (#1025). The
 * CHEAP form — slash-fold + win32-lowercase, NO filesystem I/O — because the
 * index is a hot, single-process, in-memory structure whose keys this process
 * produces itself (`collectSourceFilesAsync`'s walk, `path.resolve` at the
 * per-edit seams). `normalizeMapKey`'s `realpathSync` per call would be wrong on
 * the BM25 path. Applied at BOTH the build seam and the per-edit update seam so
 * a file's on-disk casing (walk) and its tool-input casing (edit) can no longer
 * diverge into a duplicate doc entry with stale postings (the #1025 item #2
 * bug). Kept as a named alias so every seam is grep-visible and provably shares
 * ONE normalizer with the {@link PathKeyedMap}s below.
 */
export const wordIndexKey = normalizeEphemeralMapKey;
// Common language keywords / boilerplate — indexing them adds noise and bloats
// postings without improving relevance. Kept deliberately small and
// language-agnostic.
const STOPWORDS = new Set([
    "the",
    "and",
    "for",
    "let",
    "var",
    "const",
    "function",
    "return",
    "if",
    "else",
    "import",
    "export",
    "from",
    "class",
    "interface",
    "type",
    "enum",
    "new",
    "this",
    "self",
    "void",
    "null",
    "true",
    "false",
    "async",
    "await",
    "public",
    "private",
    "protected",
    "static",
    "def",
    "fn",
    "func",
    "struct",
    "impl",
    "pub",
    "use",
    "mod",
    "in",
    "of",
    "as",
    "is",
    "not",
    "with",
]);
const TEST_VENDOR_RE = /(?:(^|[\\/])(?:tests?|__tests__|spec|specs|__mocks__|vendor|node_modules|examples?|fixtures?|\.git|dist|build|coverage)([\\/]|$))|(?:\.(?:test|spec)\.[a-z]+$)/i;
const DOC_FILE_RE = /\.(?:md|mdx|markdown|json|json5|jsonc|txt|rst|lock|ya?ml|toml|csv)$/i;
const TEST_VENDOR_PENALTY = 0.3;
const DOC_FILE_PENALTY = 0.5;
const BM25_K1 = 1.2;
const BM25_B = 0.75;
function isTestOrVendor(file) {
    return TEST_VENDOR_RE.test(file);
}
function isDocFile(file) {
    return DOC_FILE_RE.test(file);
}
/**
 * Split an identifier into lowercased sub-tokens across camelCase, PascalCase,
 * snake_case, kebab-case, dotted, and digit boundaries — and keep the whole
 * lowercased identifier too. `getUserByID` → [getuserbyid, get, user, by, id];
 * `MAX_RETRY_2` → [max_retry_2, max, retry, 2] (whole kept, plus parts).
 */
export function splitIdentifier(identifier) {
    const parts = new Set();
    const whole = identifier.toLowerCase();
    if (whole.length >= 2 && !STOPWORDS.has(whole))
        parts.add(whole);
    for (const chunk of identifier.split(/[^A-Za-z0-9]+/)) {
        if (!chunk)
            continue;
        const spaced = chunk
            .replace(/([a-z0-9])([A-Z])/g, "$1 $2") // camelCase → camel Case
            .replace(/[A-Z](?=[A-Z][a-z])/g, "$& ") // HTTPServer → HTTP Server (linear; lookahead avoids super-linear backtracking, S5852)
            .replace(/([A-Za-z])([0-9])/g, "$1 $2") // retry2 → retry 2
            .replace(/([0-9])([A-Za-z])/g, "$1 $2"); // 2fa → 2 fa
        for (const sub of spaced.split(/\s+/)) {
            const token = sub.toLowerCase();
            if (token.length >= 2 && !STOPWORDS.has(token))
                parts.add(token);
        }
    }
    return [...parts];
}
/** Extract identifier-like tokens from a line and split each into sub-tokens. */
export function tokenizeLine(line) {
    const tokens = [];
    const matches = line.match(/[A-Za-z_$][A-Za-z0-9_$]*/g);
    if (!matches)
        return tokens;
    for (const match of matches) {
        for (const token of splitIdentifier(match))
            tokens.push(token);
    }
    return tokens;
}
const WORD_INDEX_BUILD_YIELD_BUDGET_MS = 8;
/**
 * A line at or above this length is treated as a yield checkpoint on its own.
 * The per-50-lines cadence is a proxy for work that only holds on hand-written
 * source: a minified/bundled single-line file up to {@link WORD_INDEX_MAX_BYTES}
 * that the source filter did not exclude would otherwise get ZERO in-document
 * yields — one unbroken tokenize+push burst far above the budget (#1197 review
 * finding 4). Checking the clock after any long line makes the cooperativeness
 * claim true per BYTE, not just per line count.
 */
const WORD_INDEX_LONG_LINE_YIELD_CHARS = 4096;
/**
 * Shared cooperative time-slicer for every bulk word-index path (#1197).
 *
 * Time-based, not count-based: "yield every N items" is only a bound when the
 * per-item cost is bounded too, and the incremental refresh's per-document cost
 * grows with the corpus (each replacement filters shared posting arrays). The
 * #1197 outage was exactly that shape — 239 stale documents held pi's event loop
 * for seconds between two "every 100 files" checkpoints. Callers combine this
 * The shared deadline is checked at every bounded work unit so abort latency
 * and occupancy are governed by the same monotonic budget.
 */
function createEmptyWordIndex(truncated) {
    return {
        postings: new Map(),
        docLengths: new PathKeyedMap(wordIndexKey),
        totalTokens: 0,
        docCount: 0,
        truncated,
        forward: new PathKeyedMap(wordIndexKey),
        fileMtimes: new PathKeyedMap(wordIndexKey),
        fileSizes: new PathKeyedMap(wordIndexKey),
    };
}
function indexWordLine(index, filePath, line, lineNumber, tokenLineCounts) {
    const lineTokens = tokenizeLine(line);
    const seenOnLine = new Set();
    for (const token of lineTokens) {
        if (seenOnLine.has(token))
            continue;
        seenOnLine.add(token);
        const arr = index.postings.get(token);
        if (arr)
            arr.push({ file: filePath, line: lineNumber });
        else
            index.postings.set(token, [{ file: filePath, line: lineNumber }]);
        tokenLineCounts.set(token, (tokenLineCounts.get(token) ?? 0) + 1);
    }
    return lineTokens.length;
}
function finishWordIndexDocument(index, doc, docLength, tokenLineCounts) {
    index.docLengths.set(doc.path, docLength);
    index.forward?.set(doc.path, tokenLineCounts);
    index.fileMtimes.set(doc.path, doc.mtimeMs ?? 0);
    index.fileSizes.set(doc.path, doc.size ?? Buffer.byteLength(doc.content, "utf-8"));
    index.totalTokens += docLength;
    index.docCount += 1;
}
function indexWordDocument(index, doc) {
    const lines = doc.content.split(/\r?\n/);
    const tokenLineCounts = new Map();
    let docLength = 0;
    for (let i = 0; i < lines.length; i += 1) {
        docLength += indexWordLine(index, doc.path, lines[i], i + 1, tokenLineCounts);
    }
    finishWordIndexDocument(index, doc, docLength, tokenLineCounts);
}
export function buildWordIndex(files) {
    const index = createEmptyWordIndex(files.truncated ?? false);
    for (const doc of files)
        indexWordDocument(index, doc);
    return index;
}
/**
 * Cooperative production builder for bulk/cold paths. It produces the exact
 * same index as {@link buildWordIndex}, but time-slices both between documents
 * and within a large document so startup warmup cannot monopolize pi's TUI
 * event loop (#1197). The index is private until this resolves, so a superseded
 * build never publishes a partial replacement.
 */
export async function buildWordIndexAsync(files, shouldContinue = () => true) {
    const index = createEmptyWordIndex(files.truncated ?? false);
    const deadline = createDeadline(WORD_INDEX_BUILD_YIELD_BUDGET_MS);
    for (const doc of files) {
        if (!shouldContinue())
            throw new Error("word index build superseded");
        const lines = doc.content.split(/\r?\n/);
        const tokenLineCounts = new Map();
        let docLength = 0;
        for (let i = 0; i < lines.length; i += 1) {
            const line = lines[i];
            docLength += indexWordLine(index, doc.path, line, i + 1, tokenLineCounts);
            if (line.length >= WORD_INDEX_LONG_LINE_YIELD_CHARS ||
                deadline.expired()) {
                await yieldIfOverBudget(deadline);
                if (!shouldContinue())
                    throw new Error("word index build superseded");
            }
        }
        finishWordIndexDocument(index, doc, docLength, tokenLineCounts);
        if (deadline.expired() && (await yieldIfOverBudget(deadline))) {
            if (!shouldContinue())
                throw new Error("word index build superseded");
        }
    }
    return index;
}
/**
 * Remove `filePath`'s postings/docLength/forward entry from `index` in place,
 * using the forward index to know exactly which tokens to touch (no scan of
 * unrelated postings). No-op (returns false) if the index has no forward
 * index yet (pre-phase-2 / deserialized-old-shape) or the file isn't present —
 * callers must treat `false` as "fall back to a full rebuild", never as
 * silent success.
 */
export function removeWordIndexDocument(index, filePath) {
    if (!index.forward)
        return false;
    const tokenLineCounts = index.forward.get(filePath);
    if (!tokenLineCounts)
        return false;
    // `postings` is token-keyed (not a PathKeyedMap), so its `WordHit.file`
    // display strings must be compared through the SAME normalizer the path maps
    // use — otherwise a build-form hit (`SUB/a.ts`) survives an edit-form removal
    // (`sub/a.ts`) on a case-insensitive FS and lingers as a stale posting
    // (the #1025 item #2 bug this fix closes).
    const removedKey = wordIndexKey(filePath);
    for (const token of tokenLineCounts.keys()) {
        const arr = index.postings.get(token);
        if (!arr)
            continue;
        const next = arr.filter((hit) => wordIndexKey(hit.file) !== removedKey);
        if (next.length > 0)
            index.postings.set(token, next);
        else
            index.postings.delete(token);
    }
    const docLength = index.docLengths.get(filePath) ?? 0;
    index.docLengths.delete(filePath);
    index.forward.delete(filePath);
    index.fileMtimes.delete(filePath);
    index.fileSizes.delete(filePath);
    index.totalTokens -= docLength;
    index.docCount = Math.max(0, index.docCount - 1);
    return true;
}
/**
 * Add or replace `filePath`'s document in `index` in place: removes the prior
 * postings for this file (if any, via {@link removeWordIndexDocument}'s
 * forward-index lookup) then re-tokenizes `content` and adds the new
 * postings/docLength/forward entry. df/N/totalTokens (avgdl) are updated as
 * running stats — no full recompute over other documents.
 *
 * Returns `false` (no-op on `index`) when the index has no forward index —
 * the caller must fall back to a full {@link buildWordIndex} rebuild in that
 * case (documented at the `forward` field and enforced by callers, not
 * silently patched here: a partially-forward-consistent index would corrupt
 * future incremental updates).
 */
export function updateWordIndexDocument(index, doc) {
    if (!index.forward)
        return false;
    // Remove the old contribution first (no-op if this is a brand new doc).
    if (index.forward.has(doc.path)) {
        removeWordIndexDocument(index, doc.path);
    }
    // Tokenize with line numbers attached (needed for WordHit.line) — this also
    // yields the forward-index entry (distinct-line count per token) so the
    // tokenization work happens exactly once for this document.
    const lines = doc.content.split(/\r?\n/);
    const perTokenHits = new Map();
    let docLength = 0;
    for (let i = 0; i < lines.length; i += 1) {
        const lineTokens = tokenizeLine(lines[i]);
        docLength += lineTokens.length;
        const seenOnLine = new Set();
        for (const token of lineTokens) {
            if (seenOnLine.has(token))
                continue;
            seenOnLine.add(token);
            const arr = perTokenHits.get(token);
            if (arr)
                arr.push(i + 1);
            else
                perTokenHits.set(token, [i + 1]);
        }
    }
    const tokenLineCounts = new Map();
    for (const [token, lineNumbers] of perTokenHits) {
        tokenLineCounts.set(token, lineNumbers.length);
        const hits = lineNumbers.map((line) => ({ file: doc.path, line }));
        const arr = index.postings.get(token);
        if (arr)
            arr.push(...hits);
        else
            index.postings.set(token, hits);
    }
    index.docLengths.set(doc.path, docLength);
    index.forward.set(doc.path, tokenLineCounts);
    // Per-edit callers generally already have content but not a stat. -1 is an
    // impossible real mtime, so it deliberately makes the document stale at the
    // next startup refresh (`-1 !== realMtime` always) — unlike 0, which is a
    // legal on-disk mtime (SOURCE_DATE_EPOCH=0, archive extraction) and would
    // collide, leaving such a file never re-tokenized (#958 review F2).
    index.fileMtimes.set(doc.path, -1);
    // Size is likewise recorded for the #1105 mtime+size refresh gate. The -1
    // mtime already forces a re-read next session, so this value only keeps the
    // map dense (parallel to fileMtimes); store the real byte length so a
    // deserialize→reserialize round-trip before any refresh carries a truthful
    // size rather than a placeholder.
    index.fileSizes.set(doc.path, Buffer.byteLength(doc.content, "utf-8"));
    index.totalTokens += docLength;
    index.docCount += 1;
    return true;
}
async function stageWordIndexDocumentRemoval(index, filePath, shouldContinue) {
    if (!index.forward)
        return undefined;
    const tokenLineCounts = index.forward.get(filePath);
    if (!tokenLineCounts)
        return undefined;
    const removedKey = wordIndexKey(filePath);
    const postings = new Map();
    const deadline = createDeadline(WORD_INDEX_BUILD_YIELD_BUDGET_MS);
    for (const token of tokenLineCounts.keys()) {
        if (!shouldContinue())
            throw new Error("word index refresh superseded");
        const arr = index.postings.get(token);
        if (!arr)
            continue;
        const next = [];
        for (const hit of arr) {
            if (wordIndexKey(hit.file) !== removedKey)
                next.push(hit);
            if (deadline.expired() && (await yieldIfOverBudget(deadline))) {
                if (!shouldContinue())
                    throw new Error("word index refresh superseded");
            }
        }
        postings.set(token, next.length > 0 ? next : undefined);
    }
    return { postings, docLength: index.docLengths.get(filePath) ?? 0 };
}
function commitWordIndexDocumentRemoval(index, filePath, staged) {
    for (const [token, hits] of staged.postings) {
        if (hits)
            index.postings.set(token, hits);
        else
            index.postings.delete(token);
    }
    index.docLengths.delete(filePath);
    index.forward?.delete(filePath);
    index.fileMtimes.delete(filePath);
    index.fileSizes.delete(filePath);
    index.totalTokens -= staged.docLength;
    index.docCount = Math.max(0, index.docCount - 1);
}
/** Cooperative, atomically-published removal used only by bulk refresh. */
export async function removeWordIndexDocumentAsync(index, filePath, shouldContinue = () => true) {
    const staged = await stageWordIndexDocumentRemoval(index, filePath, shouldContinue);
    if (!staged)
        return false;
    if (!shouldContinue())
        throw new Error("word index refresh superseded");
    commitWordIndexDocumentRemoval(index, filePath, staged);
    return true;
}
/** Cooperative replacement whose old/new state is committed without an await. */
export async function updateWordIndexDocumentAsync(index, doc, shouldContinue = () => true) {
    if (!index.forward)
        return false;
    const removal = index.forward.has(doc.path)
        ? await stageWordIndexDocumentRemoval(index, doc.path, shouldContinue)
        : undefined;
    if (index.forward.has(doc.path) && !removal)
        return false;
    const perTokenHits = new Map();
    let docLength = 0;
    const lines = doc.content.split(/\r?\n/);
    await forEachCooperatively(lines, (line, i) => {
        const lineTokens = tokenizeLine(line);
        docLength += lineTokens.length;
        const seenOnLine = new Set();
        for (const token of lineTokens) {
            if (seenOnLine.has(token))
                continue;
            seenOnLine.add(token);
            const arr = perTokenHits.get(token);
            if (arr)
                arr.push(i + 1);
            else
                perTokenHits.set(token, [i + 1]);
        }
    }, {
        budgetMs: WORD_INDEX_BUILD_YIELD_BUDGET_MS,
        shouldContinue,
        abortMessage: "word index refresh superseded",
    });
    if (!shouldContinue())
        throw new Error("word index refresh superseded");
    if (removal)
        commitWordIndexDocumentRemoval(index, doc.path, removal);
    const tokenLineCounts = new Map();
    for (const [token, lineNumbers] of perTokenHits) {
        tokenLineCounts.set(token, lineNumbers.length);
        const hits = lineNumbers.map((line) => ({ file: doc.path, line }));
        const arr = index.postings.get(token);
        if (arr)
            arr.push(...hits);
        else
            index.postings.set(token, hits);
    }
    index.docLengths.set(doc.path, docLength);
    index.forward.set(doc.path, tokenLineCounts);
    index.fileMtimes.set(doc.path, -1);
    index.fileSizes.set(doc.path, Buffer.byteLength(doc.content, "utf-8"));
    index.totalTokens += docLength;
    index.docCount += 1;
    return true;
}
/** Bounds shared by every word-index build path — keep the walk off the
 * critical path on large repos: cap the file count, and skip files too large
 * to be hand-written source (generated/bundled output the source filter
 * didn't already exclude).
 *
 * Deprecated (#776): `collectWordIndexDocs` below no longer reads this
 * constant directly — it derives its cap from `getWordIndexMaxFilesDerived`
 * (project-scale.ts's `maxProjectFiles` knob), which reproduces this same
 * 6,000 default at the default base. Kept exported for tests/callers that
 * still reference the literal. */
export const WORD_INDEX_MAX_FILES = 6000;
export const WORD_INDEX_MAX_BYTES = 512 * 1024;
/**
 * Collect the bounded `{path, content}` doc set `buildWordIndex` consumes —
 * the ONE file-walk-and-read implementation shared by every build path
 * (session-start task, quick-mode warmup, cold-query background trigger),
 * so a bound/skip-rule change lands in one place instead of three copies.
 * `shouldContinue` lets a session-scoped caller abort early (session
 * superseded) without this module knowing about RuntimeCoordinator.
 */
export async function collectWordIndexDocs(root, shouldContinue = () => true, preflightFiles) {
    const { collectSourceFilesAsync } = await import("./source-filter.js");
    // #747 hardening: pass the cap INTO the walk — without it,
    // `collectSourceFilesAsync` defaults to an unbounded traversal and the
    // `WORD_INDEX_MAX_FILES` slice below only trims the result AFTER the whole
    // tree (all of $HOME, on a misrooted cwd) has already been enumerated.
    // #760: the walk is additionally bounded by source-filter's default
    // visited-entry budget (DEFAULT_MAX_SCAN_ENTRIES), so a mixed tree with few
    // source files among a huge pile of non-source files can't force a
    // full-tree walk either; an index over the truncated list is acceptable.
    const maxFiles = preflightFiles?.length ?? getWordIndexMaxFilesDerived(root);
    // #894 review: prioritize code kinds within the cap — with broadened
    // enumeration, thousands of data/doc files (locale JSON, fixtures, …)
    // ahead of the code dirs in walk order could exhaust `maxFiles` and evict
    // real source files from the index entirely (DOC_FILE_PENALTY can't
    // rescue a file that never made the slice).
    const files = preflightFiles
        ? preflightFiles.map((file) => file.path)
        : await collectSourceFilesAsync(root, {
            maxFiles,
            prioritizeCodeKinds: true,
        });
    const truncated = preflightFiles?.truncated ?? files.length === maxFiles;
    const docs = Object.assign([], { truncated, skipped: 0 });
    if (!shouldContinue())
        return docs;
    const deadline = createDeadline(WORD_INDEX_BUILD_YIELD_BUDGET_MS);
    for (const file of files.slice(0, maxFiles)) {
        if (!shouldContinue())
            return docs;
        try {
            // A preflight list saves the second full WALK, but its metadata may be
            // stale by the time this rebuild reads the file. Re-stat each document at
            // content-read time so the stored freshness stamp describes the bytes we
            // actually index and the next incremental refresh cannot miss a change in
            // the walk-to-read window (#1302).
            const stat = fs.statSync(file);
            if (stat.size <= WORD_INDEX_MAX_BYTES) {
                docs.push({
                    path: file,
                    content: fs.readFileSync(file, "utf-8"),
                    mtimeMs: stat.mtimeMs,
                    size: stat.size,
                });
            }
            else {
                // Over the byte cap — enumerated but deliberately not indexed. Count
                // it (L1, #958) so callers can keep coverage honest instead of the
                // old silent drop.
                docs.skipped += 1;
            }
        }
        catch {
            // unreadable / vanished file — skip, but count it (see above).
            docs.skipped += 1;
        }
        if (deadline.expired() && (await yieldIfOverBudget(deadline))) {
            if (!shouldContinue())
                return docs;
        }
    }
    return docs;
}
// Node's fs.promises.stat runs on libuv's threadpool (default 4 slots), so
// real parallelism tops out there; the surplus workers are queue depth that
// keeps the pool saturated without starving other threadpool consumers.
export const WORD_INDEX_STAT_CONCURRENCY = 8;
const WORD_INDEX_INCREMENTAL_CHURN_THRESHOLD = 0.3;
// A ratio alone misclassifies one stale file in a three-file project as dense.
// Below this absolute floor, per-document replacement is bounded and cheaper
// than a second full walk/read even when the percentage is high (#1197).
const WORD_INDEX_DENSE_REFRESH_MIN_DOCUMENTS = 32;
/**
 * Cost of one file's stat+read+decode expressed in tokenizer-token units, so
 * the work model below can compare a path that re-reads EVERY file (full
 * rebuild) against one that re-reads only the stale files (incremental) in a
 * single currency. One read ≈ 300 tokens at the ~1 µs/token measured below.
 * Order-of-magnitude by design — it only has to keep a tiny-vocabulary corpus
 * (where posting scans are nearly free) from being sent to a full rebuild that
 * re-reads everything to save a handful of array filters.
 */
const WORD_INDEX_FILE_READ_TOKEN_COST = 300;
/**
 * Cost of scanning ONE posting-array element (the `wordIndexKey` compare in
 * {@link removeWordIndexDocument}'s filter) relative to tokenizing one token,
 * so both sides of the model below are denominated in tokens. Measured on this
 * repository's own 2,062-document corpus: 213 ns per element scan against 979 ns
 * per token — and the resulting predicted crossover (23 stale documents) lands
 * on the directly measured one (~21, from 97.8 ms per document replacement
 * against a 1,436 ms rebuild + re-read). The synthetic high-df corpus in the
 * #1197 probe gives 0.09, so this is the conservative (incremental-favouring)
 * end of the observed range.
 */
const WORD_INDEX_POSTING_SCAN_TOKEN_COST = 0.2;
/**
 * Refresh a serializer-v2 index from the current bounded source-file set.
 * The walk/stat pass is cheap; only sparse stale/new documents are read and
 * tokenized. Expected dense/legacy states return `full-required` BEFORE any
 * mutation; unexpected corruption or supersession still throws.
 */
export async function refreshWordIndexIncrementally(index, root, shouldContinue = () => true, options = {}) {
    if (!index.forward || !index.fileMtimes || !index.fileSizes) {
        return {
            mode: "full-required",
            reason: "missing-incremental-metadata",
            timings: { sourceWalkMs: 0, statWalkMs: 0, refreshReadsMs: 0 },
        };
    }
    const { collectSourceFilesAsync } = await import("./source-filter.js");
    const maxFiles = getWordIndexMaxFilesDerived(root);
    const sourceWalkStartMs = Date.now();
    const walked = await collectSourceFilesAsync(root, {
        maxFiles,
        prioritizeCodeKinds: true,
    });
    const sourceWalkMs = Date.now() - sourceWalkStartMs;
    if (!shouldContinue())
        throw new Error("word index refresh superseded");
    // This set-difference must run in the SAME normalized key space the path
    // maps use (#1025 review). Otherwise a file whose stored displayPath became
    // the edit form (last-writer-wins after a case/separator-divergent per-edit
    // update) no longer string-matches its walk form here — even though
    // `fileMtimes.get(walkForm)` folds and hits — which would (1) double-count
    // churn (the same file scored as both "dropped" and "added"), possibly
    // crossing the threshold and forcing a needless full rebuild, and (2) drop
    // then re-add an unchanged file, opening a regression window because the drop
    // loop runs BEFORE the re-read: a transient read failure (skipped++) would
    // strand the file with no postings. Keying `current` and `oldSet` through
    // `wordIndexKey` keeps build/edit/refresh convergent; `current`'s value
    // retains the raw walk path for the stat/read and for the display key.
    const current = new Map();
    const statWalkStartMs = Date.now();
    const statFile = options.statFile ?? ((file) => fs.promises.stat(file));
    const requestedConcurrency = options.statConcurrency ?? WORD_INDEX_STAT_CONCURRENCY;
    const statConcurrency = Number.isFinite(requestedConcurrency) && requestedConcurrency > 0
        ? Math.max(1, Math.floor(requestedConcurrency))
        : WORD_INDEX_STAT_CONCURRENCY;
    const statResults = new Array(walked.length);
    let cursor = 0;
    let superseded = false;
    const worker = async () => {
        while (true) {
            if (!shouldContinue()) {
                superseded = true;
                return;
            }
            const slot = cursor++;
            if (slot >= walked.length)
                return;
            const file = walked[slot];
            try {
                const stat = await statFile(file);
                if (stat.size <= WORD_INDEX_MAX_BYTES) {
                    statResults[slot] = {
                        path: file,
                        mtimeMs: stat.mtimeMs,
                        size: stat.size,
                    };
                }
            }
            catch {
                // A rejection has statSync parity: the file is simply absent.
            }
        }
    };
    await Promise.all(Array.from({ length: Math.min(statConcurrency, walked.length) }, () => worker()));
    if (superseded || !shouldContinue()) {
        throw new Error("word index refresh superseded");
    }
    const statWalkMs = Date.now() - statWalkStartMs;
    for (const result of statResults) {
        if (result)
            current.set(wordIndexKey(result.path), result);
    }
    const timings = { sourceWalkMs, statWalkMs, refreshReadsMs: 0 };
    const preflightFiles = Object.assign([...current.values()], {
        truncated: walked.length === maxFiles,
    });
    const oldSet = new Set([...index.docLengths.keys()].map(wordIndexKey));
    let changedSet = 0;
    for (const key of oldSet)
        if (!current.has(key))
            changedSet++;
    for (const key of current.keys())
        if (!oldSet.has(key))
            changedSet++;
    const denominator = Math.max(oldSet.size, current.size, 1);
    if (changedSet / denominator > WORD_INDEX_INCREMENTAL_CHURN_THRESHOLD) {
        return {
            mode: "full-required",
            reason: "file-set-churn",
            preflightFiles,
            timings,
        };
    }
    // Replacing one document filters every shared posting array for that
    // document's tokens. That is excellent for a sparse edit, but repeating it
    // for most of the corpus becomes effectively quadratic. Decide the dense
    // transition BEFORE dropping or editing anything so the old index remains a
    // valid fallback until a separately-built full replacement is ready (#1197).
    let staleDocuments = 0;
    for (const { path: file, mtimeMs, size } of current.values()) {
        if (index.fileMtimes.get(file) !== mtimeMs ||
            (index.fileSizes.get(file) ?? -1) !== size) {
            staleDocuments += 1;
        }
    }
    // Density alone is NOT a bound (#1197 review finding 1): the per-document cost
    // GROWS with the corpus, so a stale set comfortably under any fixed ratio (or
    // any fixed absolute ceiling) still costs orders of magnitude more than a
    // rebuild on a big enough repository. 800 documents with 239 stale — 29.875%,
    // just under the ratio — measured 90.6 s with a 39.6 s synchronous block
    // against 1.3 s / 10.6 ms for a full build, and at the 6,000-file cap up to
    // 1,799 stale documents would have stayed on that path.
    //
    // So compare estimated WORK, both sides denominated in tokenizer tokens:
    //   incremental ≈ stale x (docTokens x postingLength x scanCost + readCost)
    //   full        ≈ totalTokens + corpusSize x readCost
    // This is self-bounding in a way no constant is: the incremental path is taken
    // only while its total estimated cost stays under ONE full rebuild, so the
    // worst case is "about as expensive as rebuilding", whatever the corpus size.
    //
    // Both statistics come from cheap metadata passes — one over `postings`
    // (distinct tokens, reading only `.length`) and one over `forward` (documents,
    // reading only `.size`). Neither touches a posting ELEMENT, which is the work
    // this decision exists to avoid.
    let postingEntries = 0;
    let weightedPostingEntries = 0;
    for (const hits of index.postings.values()) {
        postingEntries += hits.length;
        weightedPostingEntries += hits.length * hits.length;
    }
    // The mean posting-array length weighted by OCCURRENCES, not the plain mean:
    // a document's tokens are drawn from the frequency distribution, so the arrays
    // a removal actually filters skew hard toward the high-document-frequency
    // tokens. The unweighted mean (dominated by the long tail of df=1 tokens)
    // underestimates the real cost by an order of magnitude.
    const expectedPostingLength = postingEntries > 0 ? weightedPostingEntries / postingEntries : 0;
    let distinctTokenEntries = 0;
    for (const tokenLineCounts of index.forward.values()) {
        distinctTokenEntries += tokenLineCounts.size;
    }
    const expectedDocumentTokens = index.docCount > 0 ? distinctTokenEntries / index.docCount : 0;
    const estimatedIncrementalWork = staleDocuments *
        (expectedDocumentTokens *
            expectedPostingLength *
            WORD_INDEX_POSTING_SCAN_TOKEN_COST +
            WORD_INDEX_FILE_READ_TOKEN_COST);
    const estimatedFullRebuildWork = index.totalTokens + current.size * WORD_INDEX_FILE_READ_TOKEN_COST;
    // The document-count floor guards the RATIO test only — its documented job is
    // that "one stale file in a three-file project" is 33% but not dense. It must
    // NOT gate the work test: a floor is another constant, and letting one
    // suppress the work comparison would reintroduce exactly the unbounded-on-the
    // -other-axis shape (31 documents at 98 ms each on this repository's own
    // corpus, and worse as the corpus grows). The work test needs no floor — on a
    // small project a full rebuild is cheap, so it never fires there.
    if ((staleDocuments >= WORD_INDEX_DENSE_REFRESH_MIN_DOCUMENTS &&
        staleDocuments / Math.max(current.size, 1) >
            WORD_INDEX_INCREMENTAL_CHURN_THRESHOLD) ||
        estimatedIncrementalWork > estimatedFullRebuildWork) {
        return {
            mode: "full-required",
            reason: "stale-document-churn",
            preflightFiles,
            timings,
        };
    }
    const deadline = createDeadline(WORD_INDEX_BUILD_YIELD_BUDGET_MS);
    let dropped = 0;
    for (const key of oldSet) {
        if (!current.has(key)) {
            // `key` is already folded; removeWordIndexDocument re-folds it
            // idempotently via the PathKeyedMap, so the drop hits the right entry.
            if (!(await removeWordIndexDocumentAsync(index, key, shouldContinue))) {
                throw new Error(`failed to drop word-index document: ${key}`);
            }
            dropped++;
        }
    }
    let refreshed = 0;
    let skipped = 0;
    const refreshReadsStartMs = Date.now();
    for (const { path: file, mtimeMs, size } of current.values()) {
        // #1105: mtime-first, size-second freshness — mtime alone is a stale
        // signal (mtime-preserving content changes serve stale identifiers to
        // symbol_search). Size is free (the stat above already read it) and
        // catches every content change that alters byte length. Both come from the
        // SAME stat, so a mismatch on EITHER axis re-reads. `?? -1` makes a file
        // absent from the (possibly legacy, pre-#1105) size map always count as
        // changed → one-time re-read that repopulates the size, the safe direction.
        if (index.fileMtimes.get(file) !== mtimeMs ||
            (index.fileSizes.get(file) ?? -1) !== size) {
            // A file the walk/stat pass saw can still fail to read here — a
            // transient exclusive lock (antivirus, an editor, a build step) or a
            // file that vanished in the interim. Match collectWordIndexDocs'
            // tolerance: skip this one file and leave its existing posting (and
            // its old mtime, so it is retried next session) rather than aborting
            // the whole incremental pass into a full rebuild (#958 review F1).
            let content;
            try {
                content = fs.readFileSync(file, "utf-8");
            }
            catch {
                skipped++;
                continue;
            }
            if (!(await updateWordIndexDocumentAsync(index, { path: file, content }, shouldContinue))) {
                throw new Error(`failed to refresh word-index document: ${file}`);
            }
            // updateWordIndexDocument stamps mtime=-1 (per-edit convention); the
            // refresh path KNOWS the real on-disk stat, so overwrite both axes with
            // the true values so this document is not needlessly re-read next pass.
            index.fileMtimes.set(file, mtimeMs);
            index.fileSizes.set(file, size);
            refreshed++;
        }
        // Same OR as the stat loop. This is the loop the #1197 outage actually
        // blocked in: replacing one document costs more the larger the corpus is,
        // so a count-only checkpoint let 100 replacements run back to back for
        // seconds. The gate above keeps the stale set sparse; this keeps even a
        // sparse-but-expensive set off the event loop.
        if (deadline.expired() && (await yieldIfOverBudget(deadline))) {
            if (!shouldContinue())
                throw new Error("word index refresh superseded");
        }
    }
    timings.refreshReadsMs = Date.now() - refreshReadsStartMs;
    index.truncated = walked.length === maxFiles;
    return {
        mode: "incremental",
        refreshed,
        dropped,
        skipped,
        reused: current.size - refreshed - skipped,
        timings,
    };
}
export const WORD_INDEX_QUERY_FILTER_KEYS = ["lang", "file", "ext"];
/** Thrown by {@link parseWordIndexQuery}/{@link buildWordIndexQueryFilter} for
 * an unrecognized `key:` prefix or an unrecognized `lang:` value — a query
 * typo fails loudly with the supported list instead of silently degrading
 * into a literal search term (#1450 acceptance criterion). */
export class WordIndexQueryError extends Error {
    constructor(message) {
        super(message);
        this.name = "WordIndexQueryError";
    }
}
const WORD_INDEX_FILTER_TOKEN_RE = /^(-)?([A-Za-z][A-Za-z0-9_-]*):(.+)$/;
/**
 * Split a word-index query string into plain search terms and `key:value`
 * prefix filters (#1450). Whitespace-delimited, one regex per token — no
 * quoting scheme invented here, matching the pre-existing query path (which
 * never supported quoting either). A `-` immediately before a recognized
 * `key:` negates that filter; a bare `-term` (no colon) is left as an
 * ordinary token, unchanged from prior behavior — `tokenizeLine` already
 * strips the leading `-` when it extracts identifiers.
 *
 * An unrecognized `key:` (e.g. `type:foo`) throws {@link WordIndexQueryError}
 * naming the supported prefixes, rather than falling through as a literal
 * term — a typo must fail loudly, never silently rank as if the filter never
 * existed. An empty value (`lang:`) is not treated as a filter token at all
 * (kept as a term) since there is nothing to filter by.
 */
export function parseWordIndexQuery(query) {
    const filters = [];
    const termParts = [];
    for (const raw of query.split(/\s+/)) {
        if (!raw)
            continue;
        const match = raw.match(WORD_INDEX_FILTER_TOKEN_RE);
        if (!match) {
            termParts.push(raw);
            continue;
        }
        const [, negation, keyRaw, value] = match;
        const key = keyRaw.toLowerCase();
        if (!value) {
            termParts.push(raw);
            continue;
        }
        if (!WORD_INDEX_QUERY_FILTER_KEYS.includes(key)) {
            // Not a recognized filter key. Ordinary search terms legitimately
            // contain colons (std::vector, error:foo, http://…, C:\ paths, a
            // TODO:tag), and the old tokenizer searched them fine — a hard
            // error here is a usability regression, not typo protection. The
            // token passes through as a plain term; the loud-failure contract
            // survives where it is unambiguous: a KNOWN key with a bad value
            // (lang:notalang) still throws.
            termParts.push(raw);
            continue;
        }
        filters.push({
            key: key,
            value,
            negated: negation === "-",
        });
    }
    return { terms: termParts.join(" "), filters };
}
/** `lang:X` → the extension set for FileKind X (case-insensitive), drawn
 * exclusively from `KIND_EXTENSIONS` (clients/file-kinds.ts) — the single
 * source of truth (#894 invariant: no second, hand-maintained language list).
 * An unrecognized kind throws {@link WordIndexQueryError} listing the accepted
 * kinds (KIND_EXTENSIONS' own keys), the same loud-failure contract as an
 * unsupported `key:` prefix. */
function resolveLangExtensions(value) {
    const kind = value.toLowerCase();
    const extensions = KIND_EXTENSIONS[kind];
    if (!extensions) {
        const known = Object.keys(KIND_EXTENSIONS).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)).join(", ");
        throw new WordIndexQueryError(`Unknown lang: "${value}" in word-index query — supported languages: ${known}.`);
    }
    return extensions;
}
/** `ext:ts` / `ext:.ts` → normalized to a single leading-dot, lowercased form for extname comparison. */
function normalizeExtFilterValue(value) {
    return `.${value.replace(/^\.+/, "").toLowerCase()}`;
}
function resolveWordIndexFilter(filter) {
    if (filter.key === "lang") {
        const extensions = resolveLangExtensions(filter.value);
        return {
            key: filter.key,
            negated: filter.negated,
            test: (file) => extensions.includes(path.extname(file).toLowerCase()),
        };
    }
    if (filter.key === "ext") {
        const normalized = normalizeExtFilterValue(filter.value);
        return {
            key: filter.key,
            negated: filter.negated,
            test: (file) => path.extname(file).toLowerCase() === normalized,
        };
    }
    // "file": substring match against the index's own normalized display path
    // (#1450 — see the doc comment on {@link buildWordIndexQueryFilter} for the
    // case-behavior choice). Both sides fold through `wordIndexKey` so the
    // comparison matches the SAME normalization the index's own path keys use.
    const needle = wordIndexKey(filter.value);
    return {
        key: filter.key,
        negated: filter.negated,
        test: (_file, displayPath) => displayPath.includes(needle),
    };
}
/**
 * Build a pre-ranking predicate from parsed query filters (#1450). Composes
 * (AND) with `searchWordIndex`'s pre-existing `fileFilter` option (#771) —
 * `symbol_search`'s structured `paths`/`lang` params and this query's inline
 * filters both apply when both are present.
 *
 * Semantics: multiple positive filters of the SAME key OR together
 * (`lang:ts lang:go` matches either); filters of DIFFERENT keys AND
 * (`lang:ts file:clients/` requires both); a negated filter always subtracts,
 * regardless of any positive filter sharing its key.
 *
 * All filters are RESOLVED EAGERLY (extension lookups, `WordIndexQueryError`
 * thrown) here at build time — before any candidate file is tested — so a bad
 * `lang:` value fails once, loudly, rather than per-file during the scoring
 * loop.
 *
 * `file:` case behavior: matched via `wordIndexKey` (this module's single
 * path-key normalizer, `normalizeEphemeralMapKey`) on BOTH the candidate path
 * and the filter value — slash-folded everywhere, and case-folded ONLY on
 * win32 (Windows' case-insensitive filesystem), preserved on POSIX. This
 * mirrors the SAME normalization the word index's own path-keyed maps already
 * apply (#1025), rather than inventing a second, divergent case rule for this
 * one filter. The candidate path matched is the RAW index-stored path (not
 * cwd-relativized) — the index already stores paths in the form the caller
 * built it with (relative in tests, absolute in the real project walk), and
 * an absolute path's tail always contains its project-relative suffix, so
 * `file:clients/word-index.ts` still matches naturally either way.
 */
export function buildWordIndexQueryFilter(filters) {
    if (filters.length === 0)
        return undefined;
    const resolved = filters.map(resolveWordIndexFilter);
    const positivesByKey = new Map();
    const negatives = [];
    for (const r of resolved) {
        if (r.negated) {
            negatives.push(r);
            continue;
        }
        const group = positivesByKey.get(r.key) ?? [];
        group.push(r);
        positivesByKey.set(r.key, group);
    }
    return (file) => {
        const displayPath = wordIndexKey(file);
        for (const negative of negatives) {
            if (negative.test(file, displayPath))
                return false;
        }
        for (const group of positivesByKey.values()) {
            if (!group.some((r) => r.test(file, displayPath)))
                return false;
        }
        return true;
    };
}
function combineFileFilters(a, b) {
    if (!a)
        return b;
    if (!b)
        return a;
    return (file) => a(file) && b(file);
}
/**
 * Rank files for a query by BM25 over the query's identifier tokens, then apply
 * priors: demote test/vendor and doc/data files, and boost by graph centrality
 * when supplied. Returns the top {@link RankOptions.limit} files, highest first.
 *
 * The query string may mix plain terms with `lang:`/`file:`/`ext:` prefix
 * filters (+ `-` negation, #1450) — parsed by {@link parseWordIndexQuery} and
 * applied as a `fileFilter` (composed, AND, with any caller-supplied one)
 * BEFORE scoring, same as the pre-existing `paths`/`lang` options (#771): a
 * surviving file's score is unaffected by filtering. A query with no filter
 * tokens reproduces prior output byte-for-byte.
 *
 * DF-normalization note: BM25's per-token `idf` is computed from `docFrequency`
 * over the FULL (unfiltered) postings for that token — `fileFilter` (whether
 * from `options.fileFilter` or from this query's inline filters) is applied
 * AFTER `idf` is computed, per file, inside the same loop. This means a
 * filtered query reuses the GLOBAL, corpus-wide document frequency rather than
 * recomputing it over just the filtered subset. That is the pre-existing #771
 * behavior this change does not alter; it is an acceptable approximation
 * (idf reflects true corpus rarity, not an artifact of the filter) and keeps
 * filtered/unfiltered scores for the SAME file directly comparable, which is
 * the property #1450 asks for ("BM25 and centrality stay comparable within
 * the filtered set").
 */
export function searchWordIndex(index, query, options = {}) {
    const { demoteTestVendor = true, demoteDocs = true, centrality, limit = 20, fileFilter, } = options;
    const parsedQuery = parseWordIndexQuery(query);
    const queryFilter = buildWordIndexQueryFilter(parsedQuery.filters);
    const combinedFilter = combineFileFilters(fileFilter, queryFilter);
    const queryTokens = [...new Set(tokenizeLine(parsedQuery.terms))];
    if (queryTokens.length === 0)
        return [];
    const docCount = index.docCount || 1;
    const avgDocLength = index.totalTokens / docCount || 1;
    const scores = new Map();
    for (const token of queryTokens) {
        const posting = index.postings.get(token);
        if (!posting)
            continue;
        const linesByFile = new Map();
        for (const hit of posting) {
            const arr = linesByFile.get(hit.file);
            if (arr)
                arr.push(hit.line);
            else
                linesByFile.set(hit.file, [hit.line]);
        }
        const docFrequency = linesByFile.size;
        const idf = Math.log(1 + (docCount - docFrequency + 0.5) / (docFrequency + 0.5));
        for (const [file, lines] of linesByFile) {
            if (combinedFilter && !combinedFilter(file))
                continue;
            const termFrequency = lines.length;
            const docLength = index.docLengths.get(file) ?? avgDocLength;
            const denominator = termFrequency +
                BM25_K1 * (1 - BM25_B + BM25_B * (docLength / avgDocLength));
            const termScore = idf * ((termFrequency * (BM25_K1 + 1)) / denominator);
            const entry = scores.get(file) ?? {
                score: 0,
                hits: 0,
                lines: new Set(),
            };
            entry.score += termScore;
            entry.hits += termFrequency;
            for (const line of lines)
                entry.lines.add(line);
            scores.set(file, entry);
        }
    }
    const results = [];
    for (const [file, entry] of scores) {
        let score = entry.score;
        if (demoteTestVendor && isTestOrVendor(file))
            score *= TEST_VENDOR_PENALTY;
        if (demoteDocs && isDocFile(file))
            score *= DOC_FILE_PENALTY;
        const connections = centrality?.get(file);
        if (connections && connections > 0) {
            score *= 1 + Math.log(1 + connections) / 4;
        }
        results.push({
            file,
            score,
            hits: entry.hits,
            lines: [...entry.lines].sort((a, b) => a - b),
        });
    }
    results.sort((a, b) => b.score - a.score || a.file.localeCompare(b.file));
    return results.slice(0, Math.max(0, limit));
}
/**
 * Build a centrality map (file → importedBy count) keyed by THIS index's file
 * paths, from the project snapshot's `reverseDeps` (importedBy). The snapshot
 * keys are normalized (`normalizeMapKey(resolve(...))`) while the index keys are
 * the raw scanned paths, so the caller injects a `normalizeKey` bridge; it
 * defaults to identity for testing. Pass the result to {@link searchWordIndex}
 * as `centrality` to boost well-connected files. Kept here (not in the engine)
 * so it stays pure + unit-testable without the normalizer dependency.
 */
export function centralityFromReverseDeps(index, reverseDeps, normalizeKey = (file) => file) {
    const centrality = new Map();
    if (!reverseDeps)
        return centrality;
    for (const file of index.docLengths.keys()) {
        const importers = reverseDeps[normalizeKey(file)];
        if (importers && importers.length > 0) {
            centrality.set(file, importers.length);
        }
    }
    return centrality;
}
/** Persisted word-index serialization format version. Bump on breaking format changes. */
export const WORD_INDEX_FORMAT_VERSION = 2;
export function serializeWordIndex(index) {
    const files = [...index.docLengths.keys()];
    const fileIndex = new Map();
    files.forEach((file, i) => fileIndex.set(file, i));
    const postings = [];
    for (const [token, hits] of index.postings) {
        const flat = [];
        for (const hit of hits) {
            const idx = fileIndex.get(hit.file);
            if (idx === undefined)
                continue;
            flat.push(idx, hit.line);
        }
        if (flat.length > 0)
            postings.push([token, flat]);
    }
    const forward = index.forward
        ? files.map((file, i) => [
            i,
            [...(index.forward.get(file) ?? new Map()).entries()],
        ])
        : undefined;
    return {
        version: WORD_INDEX_FORMAT_VERSION,
        files,
        postings,
        docLengths: files.map((file) => index.docLengths.get(file) ?? 0),
        totalTokens: index.totalTokens,
        indexedFileCount: index.docCount,
        truncated: index.truncated,
        fileMtimes: files.map((file) => index.fileMtimes.get(file) ?? 0),
        fileSizes: files.map((file) => index.fileSizes.get(file) ?? 0),
        forward,
    };
}
export function deserializeWordIndex(data) {
    if (!data ||
        data.version !== WORD_INDEX_FORMAT_VERSION ||
        !Array.isArray(data.files) ||
        !Array.isArray(data.postings) ||
        !Array.isArray(data.docLengths) ||
        !Array.isArray(data.fileMtimes) ||
        data.fileMtimes.length !== data.files.length) {
        return null;
    }
    const docLengths = new PathKeyedMap(wordIndexKey);
    const fileMtimes = new PathKeyedMap(wordIndexKey);
    const fileSizes = new PathKeyedMap(wordIndexKey);
    data.files.forEach((file, i) => docLengths.set(file, data.docLengths[i] ?? 0));
    data.files.forEach((file, i) => fileMtimes.set(file, data.fileMtimes[i] ?? 0));
    // #1105: `fileSizes` is optional on the wire (pre-#1105 snapshots omit it).
    // Only populate when the array is present AND parallel to `files`; otherwise
    // leave it empty so the refresh gate re-reads every file once to repopulate,
    // rather than trusting a bogus/misaligned size. Never treated as "current".
    if (Array.isArray(data.fileSizes) &&
        data.fileSizes.length === data.files.length) {
        data.files.forEach((file, i) => fileSizes.set(file, data.fileSizes?.[i] ?? 0));
    }
    const postings = new Map();
    for (const [token, flat] of data.postings) {
        if (typeof token !== "string" || !Array.isArray(flat))
            continue;
        const hits = [];
        for (let i = 0; i + 1 < flat.length; i += 2) {
            const file = data.files[flat[i]];
            const line = flat[i + 1];
            if (typeof file === "string" && typeof line === "number") {
                hits.push({ file, line });
            }
        }
        if (hits.length > 0)
            postings.set(token, hits);
    }
    let forward;
    if (Array.isArray(data.forward)) {
        forward = new PathKeyedMap(wordIndexKey);
        for (const entry of data.forward) {
            if (!Array.isArray(entry) || entry.length !== 2)
                continue;
            const [fileIdx, tokenCounts] = entry;
            const file = data.files[fileIdx];
            if (typeof file !== "string" || !Array.isArray(tokenCounts))
                continue;
            const perToken = new Map();
            for (const pair of tokenCounts) {
                if (!Array.isArray(pair) || pair.length !== 2)
                    continue;
                const [token, count] = pair;
                if (typeof token === "string" && typeof count === "number") {
                    perToken.set(token, count);
                }
            }
            forward.set(file, perToken);
        }
    }
    return {
        postings,
        docLengths,
        totalTokens: typeof data.totalTokens === "number" ? data.totalTokens : 0,
        docCount: data.files.length,
        truncated: data.truncated === true,
        forward,
        fileMtimes,
        fileSizes,
    };
}
const buildStatuses = new Map();
export function getWordIndexBuildStatus(cwd) {
    return buildStatuses.get(path.resolve(cwd));
}
/** Test-only: reset the in-flight-build guard between test files/cases. */
export function _resetWordIndexBuildGuardForTests() {
    buildStatuses.clear();
}
/**
 * Fire a one-time bounded background build for `cwd` if one isn't already
 * running. Persists into the existing project snapshot (preserving its other
 * fields) so the next query — or the next real session — picks it up. Errors
 * are swallowed (this is best-effort warmth, not a request the caller is
 * waiting on); the guard always clears in a `finally` so a failed build can be
 * retried by a later query.
 */
export function triggerBackgroundWordIndexBuild(cwd, dbg, options = {}) {
    const key = path.resolve(cwd);
    // #747 hardening: this trigger is the one word-index build path with NO
    // session lifecycle in front of it (cold `symbol_search` queries, in-process
    // and via MCP where cwd can be a raw tool argument) — the session-start and
    // quick-mode-warmup builds sit behind `canWarmCaches`, which already refuses
    // a home-rooted cwd. Apply the same `isAtOrAboveHomeDir` ceiling here so a
    // cold query from $HOME never starts a whole-home walk-and-read.
    if (isAtOrAboveHomeDir(key, options.homeDir)) {
        const reason = `root at/above home directory (${key})`;
        dbg?.(`word-index cold-build: skipped — ${reason}`);
        logWordIndex({
            phase: "cold_build_refused",
            cwd: key,
            trigger: "cold_query",
            reason,
        });
        const status = { state: "refused", reason };
        buildStatuses.set(key, status);
        return status;
    }
    const current = buildStatuses.get(key);
    if (current?.state === "building")
        return current;
    const status = { state: "building" };
    buildStatuses.set(key, status);
    void (async () => {
        const startMs = Date.now();
        try {
            const { loadProjectSnapshot, saveProjectSnapshot, PROJECT_SNAPSHOT_VERSION, } = await import("./project-snapshot.js");
            const docs = await collectWordIndexDocs(key);
            const index = await buildWordIndexAsync(docs);
            const existing = loadProjectSnapshot(key);
            const snapshot = existing ?? {
                version: PROJECT_SNAPSHOT_VERSION,
                projectRoot: key,
                generatedAt: new Date().toISOString(),
                seq: 0,
                files: {},
                symbols: {},
                reverseDeps: {},
                cachedExports: [],
            };
            snapshot.generatedAt = new Date().toISOString();
            snapshot.wordIndex = serializeWordIndex(index);
            saveProjectSnapshot(key, snapshot);
            dbg?.(`word-index cold-build: ${index.docCount} files, ${index.postings.size} tokens (${Date.now() - startMs}ms)`);
            // M2, #958: durable decision/coverage record for the MCP-critical cold
            // path (this is where symbol_search reads the index and dbg is a no-op).
            logWordIndex({
                phase: "cold_build",
                cwd: key,
                trigger: "cold_query",
                durationMs: Date.now() - startMs,
                indexedFileCount: index.docCount,
                tokens: index.postings.size,
                truncated: index.truncated,
                skipped: docs.skipped,
            });
            buildStatuses.delete(key);
        }
        catch (err) {
            const reason = err instanceof Error ? err.message : String(err);
            buildStatuses.set(key, { state: "failed", reason });
            dbg?.(`word-index cold-build: failed: ${reason}`);
            logWordIndex({
                phase: "cold_build_failed",
                cwd: key,
                trigger: "cold_query",
                durationMs: Date.now() - startMs,
                error: reason,
            });
        }
    })();
    return status;
}
// --- Debounced per-edit persist (#348 phase 2) --------------------------------
//
// The per-edit seam (dispatch/integration.ts) updates `runtime.wordIndex` in
// memory on every write, same as the review graph's per-edit rebuild. Without
// coalescing, persisting that in-memory index on every single edit would mean
// one full-snapshot JSON.stringify+write per keystroke-adjacent edit — the
// same OOM-risking spike the graph's #260 circuit-breaker exists to prevent.
// This reuses `createDebounceScheduler` (persist-debounce.ts) rather than
// growing a second copy of the graph's bespoke pending-map+timer bookkeeping;
// only the "write" callback differs, because the target differs: the graph
// owns its own cache file, but the word index must merge into the SHARED
// project-snapshot file via `saveRuntimeProjectSnapshot`/`saveProjectSnapshot`
// (preserving unrelated snapshot fields, and honoring the seq-laundering guard
// in project-snapshot.ts — see saveRuntimeProjectSnapshot's comment).
const WORD_INDEX_PERSIST_DEBOUNCE_MS_DEFAULT = 1500;
function wordIndexPersistDebounceMs() {
    const raw = Number(process.env.PI_LENS_WORD_INDEX_PERSIST_DEBOUNCE_MS);
    return Number.isFinite(raw) && raw >= 0
        ? raw
        : WORD_INDEX_PERSIST_DEBOUNCE_MS_DEFAULT;
}
let wordIndexPersistScheduler;
function getWordIndexPersistScheduler() {
    if (wordIndexPersistScheduler)
        return wordIndexPersistScheduler;
    wordIndexPersistScheduler = createDebounceScheduler({
        debounceMs: wordIndexPersistDebounceMs,
        write(_key, pending) {
            void writeWordIndexSnapshot(pending.cwd, pending.index, pending.dbg);
        },
    });
    return wordIndexPersistScheduler;
}
async function writeWordIndexSnapshot(cwd, index, dbg) {
    try {
        const { loadProjectSnapshot, saveProjectSnapshot, PROJECT_SNAPSHOT_VERSION, } = await import("./project-snapshot.js");
        const existing = loadProjectSnapshot(cwd);
        const snapshot = existing ?? {
            version: PROJECT_SNAPSHOT_VERSION,
            projectRoot: path.resolve(cwd),
            generatedAt: new Date().toISOString(),
            seq: 0,
            files: {},
            symbols: {},
            reverseDeps: {},
            cachedExports: [],
        };
        snapshot.generatedAt = new Date().toISOString();
        snapshot.wordIndex = serializeWordIndex(index);
        saveProjectSnapshot(cwd, snapshot);
        dbg?.(`word-index persist: ${index.docCount} files, ${index.postings.size} tokens`);
        // #958 review F1: durably record persist SUCCESS too, not just failures —
        // in the MCP host (`dbg` is a no-op) this is the only signal that the index
        // is actually being kept fresh across edits. Debounced (~1.5s), so not
        // spammy. Mirrors the review graph's persist_succeeded.
        logWordIndex({
            phase: "persist_succeeded",
            cwd: path.resolve(cwd),
            trigger: "per_edit",
            indexedFileCount: index.docCount,
            tokens: index.postings.size,
        });
    }
    catch (err) {
        dbg?.(`word-index persist: failed: ${err}`);
        // M3, #958: a swallowed persist means every LATER symbol_search reads a
        // stale index with no trace — the exact silent-failure this durable log
        // exists to surface (dbg is a no-op in the MCP host).
        logWordIndex({
            phase: "persist_failed",
            cwd: path.resolve(cwd),
            trigger: "per_edit",
            indexedFileCount: index.docCount,
            error: err instanceof Error ? err.message : String(err),
        });
    }
}
/**
 * Schedule a debounced persist of `index` for `cwd`, coalescing a burst of
 * per-edit updates into one write after a quiet window (default 1500ms,
 * override via `PI_LENS_WORD_INDEX_PERSIST_DEBOUNCE_MS`, mirroring the review
 * graph's `PI_LENS_GRAPH_PERSIST_DEBOUNCE_MS`). Merges through the same
 * `saveProjectSnapshot` path phase 1 uses — preserves unrelated snapshot
 * fields and respects the seq-laundering guard (only ever writes wordIndex
 * for the CURRENT in-memory index, never re-stamps a stale one).
 */
export function scheduleWordIndexPersist(cwd, index, dbg) {
    const key = path.resolve(cwd);
    getWordIndexPersistScheduler().schedule(key, { cwd: key, index, dbg });
}
/** Test hook: force any pending debounced word-index persist to write immediately. */
export function flushWordIndexPersistsForTests() {
    getWordIndexPersistScheduler().flushAll();
}
