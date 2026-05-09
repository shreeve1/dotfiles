import { describe, expect, test } from "bun:test";
import {
  ACTIVE_SHARED_MEMORY_TARGETS,
  DISABLED_SHARED_MEMORY_TARGETS,
  INSTALL_PLAN_SCHEMA,
  INSTALL_PLAN_TARGETS,
  renderInstallDryRun,
  renderInstallDryRunSteps,
  renderInstallPlanFixture,
  validateInstallPlan,
  type InstallPlanCandidate,
  type InstallPlan,
} from "../src/installer-contract";

describe("installer contract", () => {
  test("documents required install plan fields and negative guarantees", () => {
    expect(INSTALL_PLAN_SCHEMA.schema_version).toBe("pai.install-plan.v1");
    expect(INSTALL_PLAN_SCHEMA.required).toContain("target_cli");
    expect(INSTALL_PLAN_SCHEMA.required).toContain("files_to_change");
    expect(INSTALL_PLAN_SCHEMA.required).toContain("backup_paths");
    expect(INSTALL_PLAN_SCHEMA.required).toContain("symlink_actions");
    expect(INSTALL_PLAN_SCHEMA.required).toContain("adapter_enablement");
    expect(INSTALL_PLAN_SCHEMA.required).toContain("rollback_notes");
    expect(INSTALL_PLAN_SCHEMA.required).toContain("required_user_approval");
    expect(INSTALL_PLAN_SCHEMA.negative_guarantees.join(" ")).toContain("live config mutation is forbidden");
  });

  test("renders valid fixture install plans for every adapter target", () => {
    for (const target of INSTALL_PLAN_TARGETS) {
      const plan = renderInstallPlanFixture(target);
      const result = validateInstallPlan(plan);

      expect(result).toEqual({ valid: true, issues: [] });
      expect(plan.target_cli).toBe(target);
      const enabledByDefault = (ACTIVE_SHARED_MEMORY_TARGETS as readonly string[]).includes(target);
      expect(plan.adapter_enablement).toEqual({ adapter: target, enabled: enabledByDefault, explicit_user_approval: enabledByDefault });
      expect(plan.required_user_approval).toBe(true);
      expect(plan.live_config_mutation_allowed).toBe(false);
      expect(plan.files_to_change).toHaveLength(1);
      expect(plan.backup_paths).toContain(plan.files_to_change[0].backup_path);
      expect(plan.rollback_notes.length).toBeGreaterThan(0);
    }
  });

  test("renders dry-run steps without live config mutation", () => {
    const dryRun = renderInstallDryRun("opencode");

    expect(dryRun.mode).toBe("dry-run");
    expect(dryRun.will_mutate_live_config).toBe(false);
    expect(dryRun.validation).toEqual({ valid: true, issues: [] });
    expect(dryRun.steps).toContainEqual({
      action: "write_file",
      target: "~/.config/opencode/opencode.json",
      backup_path: "~/.config/opencode/opencode.json.pai-backup",
      description: "Plan adapter hook insertion for opencode; do not apply in tracer issues.",
    });
    expect(dryRun.steps).toContainEqual({
      action: "symlink",
      target: "~/.pai/adapters/opencode/current -> ~/.pai/adapters/opencode/tracer.ts",
      description: "Runtime-local adapter pointer for opencode.",
    });
    expect(dryRun.steps).toContainEqual({
      action: "enable_adapter",
      target: "opencode",
      enabled: true,
      explicit_user_approval: true,
      description: "Adapter opencode enablement is enabled.",
    });
  });

  test("dry-run renderer prints backups, symlinks, and disabled adapter enablement", () => {
    const plan = renderInstallPlanFixture("claude");
    const steps = renderInstallDryRunSteps(plan);

    expect(steps.map((step) => step.action)).toEqual(["write_file", "symlink", "enable_adapter"]);
    expect(steps[0].backup_path).toBe("~/.claude/settings.json.pai-backup");
    expect(steps[1].target).toBe("~/.pai/adapters/claude/current -> ~/.pai/adapters/claude/tracer.ts");
    expect(steps[2]).toMatchObject({ target: "claude", enabled: false, explicit_user_approval: false });
  });

  test("forbids live config mutation during adapter tracer issues", () => {
    const plan = { ...renderInstallPlanFixture("claude"), live_config_mutation_allowed: true } satisfies InstallPlanCandidate;
    const result = validateInstallPlan(plan);

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("live_mutation_forbidden");
  });

  test("requires explicit user approval and adapter enablement for active writers", () => {
    const plan = {
      ...renderInstallPlanFixture("opencode"),
      required_user_approval: false,
      adapter_enablement: { adapter: "opencode", enabled: true, explicit_user_approval: false },
    } satisfies InstallPlanCandidate;
    const result = validateInstallPlan(plan);

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("approval_required");
    expect(result.issues.map((issue) => issue.code)).toContain("adapter_enablement_required");
  });

  test("keeps Claude and Codex disabled as historical shared-memory adapters", () => {
    for (const target of DISABLED_SHARED_MEMORY_TARGETS) {
      const plan = renderInstallPlanFixture(target);
      expect(plan.adapter_enablement.enabled).toBe(false);
      expect(validateInstallPlan(plan)).toEqual({ valid: true, issues: [] });

      const enabledPlan = {
        ...plan,
        adapter_enablement: { adapter: target, enabled: true, explicit_user_approval: true },
      } satisfies InstallPlanCandidate;
      const result = validateInstallPlan(enabledPlan);

      expect(result.valid).toBe(false);
      expect(result.issues.map((issue) => issue.code)).toContain("adapter_enablement_required");
    }
  });

  test("rejects secret and runtime path exposure", () => {
    const plan = {
      ...renderInstallPlanFixture("opencode"),
      files_to_change: [
        { path: "~/.env.local", backup_path: "~/.env.local.pai-backup", description: "forbidden" },
        { path: "~/.pai/memory/memories.sqlite", backup_path: "~/.pai/memory/backup", description: "forbidden" },
      ],
      backup_paths: ["~/.env.local.pai-backup", "~/.pai/memory/backup"],
    } as InstallPlan;
    const result = validateInstallPlan(plan);

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("runtime_or_secret_path_exposed");
  });

  test("rejects transcripts, DBs, JSONL trails, and auth runtime paths", () => {
    const plan = {
      ...renderInstallPlanFixture("opencode"),
      files_to_change: [
        { path: "~/.pai/transcripts/session.jsonl", backup_path: "~/.config/opencode/opencode.json.pai-backup", description: "forbidden" },
        { path: "~/.pai/events.sqlite", backup_path: "~/.config/opencode/opencode.json.pai-backup", description: "forbidden" },
        { path: "~/.pai/trails/events.jsonl", backup_path: "~/.config/opencode/opencode.json.pai-backup", description: "forbidden" },
        { path: "~/.pai/auth/token.json", backup_path: "~/.config/opencode/opencode.json.pai-backup", description: "forbidden" },
      ],
    } as InstallPlan;
    const result = validateInstallPlan(plan);

    expect(result.valid).toBe(false);
    expect(result.issues.filter((issue) => issue.code === "runtime_or_secret_path_exposed")).toHaveLength(4);
  });

  test("rejects tracked-source symlinks into runtime stores", () => {
    const plan = {
      ...renderInstallPlanFixture("pi"),
      symlink_actions: [
        {
          link_path: "~/.pai/memory/adapters/pi",
          target_path: "/home/james/dotfiles/.pai/src/cli/pai-run.ts",
          description: "forbidden tracked source into runtime store",
        },
      ],
    } as InstallPlan;
    const result = validateInstallPlan(plan);

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("tracked_source_to_runtime_symlink");
  });
});
