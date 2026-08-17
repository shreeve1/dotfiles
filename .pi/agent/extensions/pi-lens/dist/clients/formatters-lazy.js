/** Shared lazy formatter catalog seam (#1394). */
let formatterPromise;
export function warmFormatters() {
    return (formatterPromise ??= import("./formatters.js"));
}
export function loadFormatters() {
    return warmFormatters();
}
