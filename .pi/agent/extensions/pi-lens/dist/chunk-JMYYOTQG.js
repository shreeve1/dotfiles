import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);

// dist/clients/config-diagnostic-codes.js
var STABILITY_TIER_KEY = "x-stability";
var CONFIG_SCHEMA_ID = "https://raw.githubusercontent.com/apmantza/pi-lens/master/docs/schema/pi-lens-config-v1.json";
var CONFIG_SCHEMA_ANCHOR_KEY = "$schema";
function configDiagnosticMarker(code) {
  return `[${code}]`;
}
function withConfigDiagnosticCode(message, code) {
  const marker = configDiagnosticMarker(code);
  return message.includes(marker) ? message : `${message} ${marker}`;
}
var LSP_DEPRECATION_WINDOW = {
  deprecatedSince: "4.1.4",
  removeNotBefore: "5.0.0"
};
var LEGACY_KEY = {
  kind: "key",
  code: "PILENS_CFG_0002",
  ...LSP_DEPRECATION_WINDOW
};
var LEGACY_FILE = {
  kind: "file",
  code: "PILENS_CFG_0003",
  ...LSP_DEPRECATION_WINDOW
};
var DEPRECATED_CONFIG_SURFACES = [
  {
    ...LEGACY_KEY,
    surface: "servers",
    reason: "custom-server definitions move to the unified catalog schema; the bare string command + args form is replaced by the trust-gated ProcessSpec (#2416)."
  },
  {
    ...LEGACY_KEY,
    surface: "serverOverrides",
    reason: "per-server initializationOptions overrides fold into the catalog's field-wise merge, keyed by the same public server IDs (#2416)."
  },
  {
    ...LEGACY_KEY,
    surface: "disabledServers",
    reason: "replaced by the catalog's per-entry `enabled: false`, which carries monotonic deny precedence (#1416/#2415)."
  },
  {
    ...LEGACY_KEY,
    surface: "warmFiles",
    reason: "session warm-up seeds become a per-server catalog field rather than a config-root list (#2416)."
  },
  {
    ...LEGACY_FILE,
    surface: ".pi-lens/lsp.json",
    reason: "project LSP settings consolidate into `.pi-lens.json` under the unified envelope (#2426)."
  },
  {
    ...LEGACY_FILE,
    surface: "pi-lsp.json",
    reason: "pre-rename project location; superseded by `.pi-lens.json` (#2426)."
  },
  {
    ...LEGACY_FILE,
    surface: "pi-lens.json",
    reason: "undotted project-config basename; superseded by `.pi-lens.json` (#2426)."
  },
  {
    ...LEGACY_FILE,
    surface: "~/.pi-lens/lsp.json",
    reason: "global LSP settings consolidate into `~/.pi-lens/config.json` (#2426)."
  }
];

export {
  STABILITY_TIER_KEY,
  CONFIG_SCHEMA_ID,
  CONFIG_SCHEMA_ANCHOR_KEY,
  withConfigDiagnosticCode,
  DEPRECATED_CONFIG_SURFACES
};
