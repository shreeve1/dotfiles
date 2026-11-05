import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);

// dist/clients/sanitize.js
var ANSI_ESCAPE = /\x1b\[[0-9;]*m/g;
var ANSI_ESCAPE_EXTENDED = /\x1b\[[0-9;?]*[ -/]*[@-~]/g;
function stripAnsi(text) {
  return text.replace(ANSI_ESCAPE, "").replace(ANSI_ESCAPE_EXTENDED, "");
}

export {
  stripAnsi
};
