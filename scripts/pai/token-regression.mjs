#!/usr/bin/env node

import fs from "node:fs";
import { spawnSync } from "node:child_process";

const checks = [];

function add(name, pass, detail) {
  checks.push({ name, pass, detail });
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

const agents = read(".config/opencode/AGENTS.md");
const algorithm = read(".config/opencode/modes/algorithm.md");

add("Algorithm format", agents.includes("## ALGORITHM Mode") && algorithm.includes("ALGORITHM MODE"), "mode contract still present");
add("ISA evidence", agents.includes("ISA") && agents.includes("verification"), "ISA and verification terms present");
add("Safety expansion", agents.includes("NEVER Publish Sensitive Data") && agents.includes("Always confirm"), "safety confirmations remain force-loaded");
add("Exact strings", agents.includes("exact strings") && agents.includes("code, commands, errors, file paths"), "compact policy preserves exact strings");

const budget = spawnSync(process.execPath, ["scripts/pai/token-budget.mjs"], { encoding: "utf8" });
add("Token budget", budget.status === 0 && budget.stdout.includes("TOTAL"), "token-budget script prints TOTAL");

const verbosityMissing = spawnSync(process.execPath, ["scripts/pai/verbosity-mode.mjs"], { encoding: "utf8", env: { ...process.env, PAI_VERBOSITY: "" } });
add("Verbosity fallback", verbosityMissing.status === 0 && verbosityMissing.stdout.includes("normal"), "missing or invalid verbosity defaults to normal");

for (const check of checks) {
  console.log(`${check.pass ? "PASS" : "FAIL"} ${check.name}: ${check.detail}`);
}

const failed = checks.filter((check) => !check.pass);
process.exit(failed.length === 0 ? 0 : 1);
