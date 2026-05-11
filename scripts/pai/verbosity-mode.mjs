#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const allowed = new Set(["compact", "normal", "expanded"]);
const root = process.cwd();
const stateFile = path.resolve(root, ".config/opencode/.pai-verbosity");

function readMode() {
  const envMode = (process.env.PAI_VERBOSITY || "").trim().toLowerCase();
  if (allowed.has(envMode)) return { mode: envMode, source: "env" };

  if (fs.existsSync(stateFile)) {
    const fileMode = fs.readFileSync(stateFile, "utf8").trim().toLowerCase();
    if (allowed.has(fileMode)) return { mode: fileMode, source: "file" };
    return { mode: "normal", source: "invalid-file" };
  }

  return { mode: "normal", source: envMode ? "invalid-env" : "default" };
}

const result = readMode();
console.log(`${result.mode} (${result.source})`);
