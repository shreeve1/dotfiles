// Stand-in for .agents/bin/verify-final in tests/opencode-verify-final.test.mjs.
// Reads stdin, sleeps FAKE_VF_DELAY_MS, prints FAKE_VF_OUT, appends the stdin
// (one JSON line per call) to FAKE_VF_LOG, and exits FAKE_VF_EXIT.
import { appendFileSync } from "node:fs";

let input = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) input += chunk;
await new Promise((r) => setTimeout(r, Number(process.env.FAKE_VF_DELAY_MS ?? 0)));
process.stdout.write(process.env.FAKE_VF_OUT ?? "");
if (process.env.FAKE_VF_LOG) appendFileSync(process.env.FAKE_VF_LOG, JSON.stringify(input) + "\n");
process.exitCode = Number(process.env.FAKE_VF_EXIT ?? 0);
