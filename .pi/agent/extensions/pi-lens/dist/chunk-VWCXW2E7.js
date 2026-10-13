import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  findLocalToolConfig
} from "./chunk-N2H3ZPZY.js";

// dist/clients/opengrep-config.js
import * as path from "node:path";
var LOCAL_OPENGREP_CONFIG_NAMES = [
  ".opengrep.yml",
  ".opengrep.yaml",
  "opengrep.yml",
  "opengrep.yaml",
  ".semgrep.yml",
  ".semgrep.yaml",
  "semgrep.yml",
  "semgrep.yaml"
];
function findLocalOpengrepConfig(startDir) {
  return findLocalToolConfig(startDir, LOCAL_OPENGREP_CONFIG_NAMES);
}
function isRegistryOrAutoConfig(config) {
  return config === "auto" || config.startsWith("p/") || config.startsWith("r/");
}
function normalizeOpengrepConfigArg(config, cwd) {
  if (!config)
    return void 0;
  const trimmed = config.trim();
  if (!trimmed)
    return void 0;
  if (isRegistryOrAutoConfig(trimmed))
    return trimmed;
  return path.isAbsolute(trimmed) ? trimmed : path.resolve(cwd, trimmed);
}
function resolveOpengrepConfig(cwd, flags) {
  const localConfig = findLocalOpengrepConfig(cwd);
  const flagConfig = typeof flags?.config === "string" && flags.config.trim() ? flags.config.trim() : void 0;
  if (flags?.enabled || flagConfig) {
    const explicit = normalizeOpengrepConfigArg(flagConfig ?? localConfig, cwd);
    return {
      enabled: true,
      configArg: explicit ?? "auto",
      source: explicit && localConfig && !flagConfig ? "local" : "flag"
    };
  }
  if (localConfig) {
    return {
      enabled: true,
      configArg: localConfig,
      source: "local"
    };
  }
  return {
    enabled: false,
    source: "disabled",
    reason: "no local opengrep config (.opengrep.yml) and --lens-opengrep not set"
  };
}

export {
  findLocalOpengrepConfig,
  resolveOpengrepConfig
};
