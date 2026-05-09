#!/usr/bin/env bun
import { CanonicalEventStore } from "../event-store";
import { buildPaiRunPlan, recordPaiRunLifecycle, type PaiRunTarget, PAI_RUN_TARGETS } from "../session-wrapper";

const args = process.argv.slice(2);
const execIndex = args.indexOf("--exec");
const shouldExec = execIndex >= 0;
if (shouldExec) args.splice(execIndex, 1);

const target = args.shift() as PaiRunTarget | undefined;

if (!target || !PAI_RUN_TARGETS.includes(target)) {
  console.error(`Usage: pai-run [--exec] <${PAI_RUN_TARGETS.join("|")}> [...native args]`);
  process.exit(1);
}

const plan = buildPaiRunPlan({ target, args, cwd: process.cwd() });

if (!shouldExec) {
  console.log(JSON.stringify({ mode: "dry-run", plan }, null, 2));
  process.exit(0);
}

const store = new CanonicalEventStore({ runtimeHome: plan.runtime_home });
try {
  recordPaiRunLifecycle(plan, store);
  const child = Bun.spawn([plan.launch.command, ...plan.launch.args], {
    cwd: plan.cwd,
    env: plan.launch.env,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  process.exit(await child.exited);
} finally {
  store.close();
}
