/** Shared lazy LSP service seam (#1394). */
let lspPromise;
export function warmLspService() {
    return (lspPromise ??= import("./lsp/index.js"));
}
export function loadLspService() {
    return warmLspService();
}
