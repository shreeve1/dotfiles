#!/usr/bin/env bun
import { INSTALL_PLAN_TARGETS, renderInstallDryRun, type InstallPlanTarget } from "../installer-contract";

const args = process.argv.slice(2);
const command = args.shift();
const target = args.shift() as InstallPlanTarget | undefined;

if (command !== "dry-run" || !target || !INSTALL_PLAN_TARGETS.includes(target)) {
  console.error(`Usage: pai-install dry-run <${INSTALL_PLAN_TARGETS.join("|")}>`);
  process.exit(1);
}

const dryRun = renderInstallDryRun(target);
console.log(JSON.stringify(dryRun, null, 2));
process.exit(dryRun.validation.valid ? 0 : 2);
