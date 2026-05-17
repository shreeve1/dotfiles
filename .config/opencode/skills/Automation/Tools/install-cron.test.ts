import { describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { buildBlock, buildCronGeneratorPaths, buildLine, replaceBlockScoped, type CronJob, type Registry } from "./install-cron";

const paths = buildCronGeneratorPaths({ HOME: "/home/james", PAI_DIR: "/home/james/.pai" });

const memoryDistillJob: CronJob = {
  id: "pai-memory-distill-nightly",
  name: "PAI Memory Distill Nightly",
  schedule: "17 2 * * *",
  type: "shell",
  command: "~/dotfiles/scripts/pai/run-memory-distill.sh",
  enabled: true,
  staggerSeconds: 120,
  lockName: "pai-memory-distill",
  logFile: "pai-memory-distill.log",
  timeoutSecs: 900,
  timezone: "America/Los_Angeles",
};

const memoryReviewJob: CronJob = {
  id: "pai-memory-review-pending-morning",
  name: "PAI Memory Review Pending Morning",
  schedule: "30 8 * * *",
  type: "shell",
  command: "~/dotfiles/scripts/pai/run-memory-review-pending.sh",
  enabled: true,
  staggerSeconds: 120,
  lockName: "pai-memory-review-pending",
  logFile: "pai-memory-review-pending.log",
  timeoutSecs: 300,
  timezone: "America/Los_Angeles",
};

const unrelatedEnabledJob: CronJob = {
  id: "zeroday-supply-chain-monitor",
  name: "ZeroDay Supply Chain Monitor",
  schedule: "0 * * * *",
  type: "shell",
  command: "~/.pai/scripts/run-zeroday-monitor.sh",
  enabled: true,
  staggerSeconds: 300,
  lockName: "zeroday-monitor",
  logFile: "zeroday-monitor.log",
  timezone: "America/Los_Angeles",
};

describe("Automation cron generator contract", () => {
  test("memory job lines use the canonical runtime wrapper path and PAI log path", () => {
    const line = buildLine(memoryDistillJob, paths);

    expect(line).toContain("/home/james/.config/opencode/skills/Automation/Tools/cron-wrapper.sh");
    expect(line).toContain("--lock pai-memory-distill");
    expect(line).toContain("--log /home/james/.pai/logs/pai-memory-distill.log");
    expect(line).toContain("--timeout 900");
    expect(line).toContain("-- /home/james/dotfiles/scripts/pai/run-memory-distill.sh");
  });

  test("disabled memory jobs stay out of generated crontab blocks", () => {
    const registry: Registry = {
      managedBlockStart: "# start",
      managedBlockEnd: "# end",
      jobs: [{ ...memoryDistillJob, enabled: false }],
    };

    const block = buildBlock(registry, paths);

    expect(block).toBe("# start\n# end\n");
    expect(block).not.toContain("run-memory-distill");
  });

  test("cron wrapper runs when PAI_DIR is unset", () => {
    const home = mkdtempSync(join(tmpdir(), "pai-cron-wrapper-home-"));
    try {
      const wrapper = join(import.meta.dir, "cron-wrapper.sh");
      const result = Bun.spawnSync(
        [wrapper, "--lock", "wrapper-unset-pai-dir", "--log", "wrapper-unset-pai-dir.log", "--timeout", "30", "--", process.execPath, "--version"],
        {
          env: {
            HOME: home,
            PATH: `${dirname(process.execPath)}:/usr/local/bin:/usr/bin:/bin`,
          },
          stdout: "pipe",
          stderr: "pipe",
        },
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout.toString()).toContain(Bun.version);
      expect(existsSync(join(home, ".pai", "logs", "automation-execution.jsonl"))).toBe(true);
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  });

  test("scoped replacement inserts selected jobs without syncing unrelated registry drift", () => {
    const registry: Registry = {
      managedBlockStart: "# start",
      managedBlockEnd: "# end",
      jobs: [unrelatedEnabledJob, memoryDistillJob, memoryReviewJob],
    };
    const legacyUnrelatedLine =
      "0 * * * * /legacy/wrapper.sh --stagger 300 --lock zeroday-monitor --log /legacy/zeroday.log -- /legacy/zeroday.sh";
    const current = ["SHELL=/bin/zsh", "# start", "CRON_TZ=America/Los_Angeles", legacyUnrelatedLine, "# end", ""].join("\n");

    const next = replaceBlockScoped(
      current,
      registry,
      ["pai-memory-distill-nightly", "pai-memory-review-pending-morning"],
      paths,
    );

    expect(next).toContain(legacyUnrelatedLine);
    expect(next).toContain(buildLine(memoryDistillJob, paths));
    expect(next).toContain(buildLine(memoryReviewJob, paths));
    expect(next).not.toContain(buildLine(unrelatedEnabledJob, paths));
  });

  test("scoped replacement replaces existing selected lock lines only", () => {
    const registry: Registry = {
      managedBlockStart: "# start",
      managedBlockEnd: "# end",
      jobs: [unrelatedEnabledJob, memoryDistillJob],
    };
    const legacyMemoryLine =
      "17 2 * * * /old/wrapper.sh --stagger 120 --lock pai-memory-distill --log /old/memory.log -- /old/run-memory-distill.sh";
    const legacyUnrelatedLine =
      "0 * * * * /legacy/wrapper.sh --lock zeroday-monitor --log /legacy/zeroday.log -- /legacy/zeroday.sh";
    const current = ["# start", "CRON_TZ=America/Los_Angeles", legacyUnrelatedLine, legacyMemoryLine, "# end", ""].join("\n");

    const next = replaceBlockScoped(current, registry, ["pai-memory-distill-nightly"], paths);

    expect(next).toContain(legacyUnrelatedLine);
    expect(next).not.toContain(legacyMemoryLine);
    expect(next).toContain(buildLine(memoryDistillJob, paths));
    expect(next).not.toContain(buildLine(unrelatedEnabledJob, paths));
  });

  test("scoped replacement rejects partial selections of shared lock groups", () => {
    const sharedA: CronJob = {
      ...unrelatedEnabledJob,
      id: "itastack-stale-ticket-check-am",
      lockName: "itastack-stale-ticket",
      schedule: "0 14-23 * * 1-5",
    };
    const sharedB: CronJob = {
      ...unrelatedEnabledJob,
      id: "itastack-stale-ticket-check-pm",
      lockName: "itastack-stale-ticket",
      schedule: "0 0-1 * * 2-6",
    };
    const registry: Registry = {
      managedBlockStart: "# start",
      managedBlockEnd: "# end",
      jobs: [sharedA, sharedB, memoryDistillJob],
    };

    expect(() => replaceBlockScoped("# start\n# end\n", registry, ["itastack-stale-ticket-check-am"], paths)).toThrow(
      /include all jobs sharing this lock: itastack-stale-ticket-check-am, itastack-stale-ticket-check-pm/,
    );
  });
});
