import * as path from "node:path";
import { isTestMode } from "./env-utils.js";
import { getGlobalPiLensDir } from "./file-utils.js";
import { createNdjsonLogger } from "./ndjson-logger.js";
const REVIEW_GRAPH_LOG_DIR = getGlobalPiLensDir();
const REVIEW_GRAPH_LOG_FILE = path.join(REVIEW_GRAPH_LOG_DIR, "review-graph.log");
const writer = createNdjsonLogger({ filePath: REVIEW_GRAPH_LOG_FILE });
/**
 * Build the one canonical graph metadata shape used by build and persist logs.
 * Counts come from the graph instance; source-file count may use the exact
 * signature-map count when the build has one, otherwise the graph file index.
 */
export function makeReviewGraphBuildMetadata(graph, options = {}) {
    return {
        ...(options.buildId === undefined ? {} : { buildId: options.buildId }),
        ...(graph.buildGeneration === undefined
            ? {}
            : { graphGeneration: graph.buildGeneration }),
        builtAt: graph.builtAt,
        ...(options.projectSeq === undefined
            ? {}
            : { projectSeq: options.projectSeq }),
        ...(options.seqHint === undefined ? {} : { seqHint: options.seqHint }),
        ...(options.mode === undefined ? {} : { mode: options.mode }),
        sourceFiles: options.sourceFileCount ?? graph.fileNodes.size,
        ...(options.sourceFileCountTruncated ||
            graph.persistCoverage?.sourceFilesTruncated
            ? { sourceFilesTruncated: true }
            : {}),
        nodes: graph.nodes.size,
        edges: graph.edges.length,
        ...(graph.persistCoverage
            ? { persistCoverage: graph.persistCoverage }
            : {}),
    };
}
export function logReviewGraph(entry) {
    if (isTestMode()) {
        return;
    }
    writer.log({ ts: new Date().toISOString(), ...entry, pid: process.pid });
}
export function getReviewGraphLogPath() {
    return REVIEW_GRAPH_LOG_FILE;
}
/** Resolve once all enqueued review-graph writes are on disk (tests/shutdown). */
export function flushReviewGraphLog() {
    return writer.flush();
}
/** Teardown-only: force queued entries to disk before the process exits. */
export function flushReviewGraphLogSync() {
    writer.flushSync();
}
