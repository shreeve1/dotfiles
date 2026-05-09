import type { AdapterName } from "./config";

export const INSTALL_PLAN_TARGETS = ["claude", "codex", "opencode", "pi"] as const;
export const INSTALL_PLAN_ACTIONS = ["write_file", "symlink", "enable_adapter"] as const;

export type InstallPlanTarget = (typeof INSTALL_PLAN_TARGETS)[number];
export type InstallPlanActionType = (typeof INSTALL_PLAN_ACTIONS)[number];

export type FileChangePlan = {
  path: string;
  backup_path: string;
  description: string;
};

export type SymlinkAction = {
  link_path: string;
  target_path: string;
  description: string;
};

export type AdapterEnablement = {
  adapter: AdapterName;
  enabled: true;
  explicit_user_approval: true;
};

export type InstallPlan = {
  schema_version: "pai.install-plan.v1";
  target_cli: InstallPlanTarget;
  files_to_change: FileChangePlan[];
  backup_paths: string[];
  symlink_actions: SymlinkAction[];
  adapter_enablement: AdapterEnablement;
  rollback_notes: string[];
  required_user_approval: true;
  live_config_mutation_allowed: false;
};

export type InstallPlanCandidate = Omit<InstallPlan, "adapter_enablement" | "required_user_approval" | "live_config_mutation_allowed"> & {
  adapter_enablement: Omit<AdapterEnablement, "enabled" | "explicit_user_approval"> & {
    enabled: boolean;
    explicit_user_approval: boolean;
  };
  required_user_approval: boolean;
  live_config_mutation_allowed: boolean;
};

export type InstallPlanValidationIssue = {
  code:
    | "live_mutation_forbidden"
    | "approval_required"
    | "adapter_enablement_required"
    | "runtime_or_secret_path_exposed"
    | "tracked_source_to_runtime_symlink"
    | "missing_backup"
    | "target_adapter_mismatch";
  message: string;
};

export type InstallPlanValidationResult = {
  valid: boolean;
  issues: InstallPlanValidationIssue[];
};

export const INSTALL_PLAN_SCHEMA = {
  schema_version: "pai.install-plan.v1",
  required: [
    "target_cli",
    "files_to_change",
    "backup_paths",
    "symlink_actions",
    "adapter_enablement",
    "rollback_notes",
    "required_user_approval",
    "live_config_mutation_allowed",
  ],
  negative_guarantees: [
    "live config mutation is forbidden during adapter tracer issues",
    "tracked source must not symlink into runtime stores",
    "secret and runtime paths must not be exposed in install plans",
    "adapter enablement requires explicit user approval",
  ],
} as const;

const TARGET_CONFIG_PATHS: Record<InstallPlanTarget, string> = {
  claude: "~/.claude/settings.json",
  codex: "~/.codex/config.toml",
  opencode: "~/.config/opencode/opencode.json",
  pi: "~/.pi/agent/config.json",
};

const TARGET_ADAPTER_PATHS: Record<InstallPlanTarget, string> = {
  claude: "~/.pai/adapters/claude/tracer.ts",
  codex: "~/.pai/adapters/codex/tracer.ts",
  opencode: "~/.pai/adapters/opencode/tracer.ts",
  pi: "~/.pai/adapters/pi/tracer.ts",
};

export function renderInstallPlanFixture(target_cli: InstallPlanTarget): InstallPlan {
  const configPath = TARGET_CONFIG_PATHS[target_cli];
  return {
    schema_version: "pai.install-plan.v1",
    target_cli,
    files_to_change: [
      {
        path: configPath,
        backup_path: `${configPath}.pai-backup`,
        description: `Plan adapter hook insertion for ${target_cli}; do not apply in tracer issues.`,
      },
    ],
    backup_paths: [`${configPath}.pai-backup`],
    symlink_actions: [
      {
        link_path: `~/.pai/adapters/${target_cli}/current`,
        target_path: TARGET_ADAPTER_PATHS[target_cli],
        description: `Runtime-local adapter pointer for ${target_cli}.`,
      },
    ],
    adapter_enablement: {
      adapter: target_cli,
      enabled: true,
      explicit_user_approval: true,
    },
    rollback_notes: [
      `Restore ${configPath} from ${configPath}.pai-backup before disabling ${target_cli}.`,
      "Remove runtime-local adapter pointers only after verifying the native CLI still starts.",
    ],
    required_user_approval: true,
    live_config_mutation_allowed: false,
  };
}

export function validateInstallPlan(plan: InstallPlanCandidate): InstallPlanValidationResult {
  const issues: InstallPlanValidationIssue[] = [];

  if (plan.live_config_mutation_allowed) {
    issues.push({ code: "live_mutation_forbidden", message: "Install plans may not mutate live config during adapter tracer issues." });
  }

  if (!plan.required_user_approval) {
    issues.push({ code: "approval_required", message: "Install plans require explicit user approval before application." });
  }

  if (!plan.adapter_enablement.enabled || !plan.adapter_enablement.explicit_user_approval) {
    issues.push({ code: "adapter_enablement_required", message: "Adapter enablement must be explicit and approved." });
  }

  if (plan.adapter_enablement.adapter !== plan.target_cli) {
    issues.push({ code: "target_adapter_mismatch", message: "Adapter enablement must match the target CLI." });
  }

  for (const file of plan.files_to_change) {
    if (!plan.backup_paths.includes(file.backup_path)) {
      issues.push({ code: "missing_backup", message: `Missing backup path for ${file.path}.` });
    }
  }

  for (const pathValue of collectPlanPaths(plan)) {
    if (exposesRuntimeOrSecretPath(pathValue)) {
      issues.push({ code: "runtime_or_secret_path_exposed", message: `Install plan exposes forbidden path: ${pathValue}.` });
    }
  }

  for (const symlink of plan.symlink_actions) {
    if (isTrackedSourcePath(symlink.target_path) && isRuntimeStorePath(symlink.link_path)) {
      issues.push({
        code: "tracked_source_to_runtime_symlink",
        message: `Tracked source may not be symlinked into runtime store: ${symlink.target_path} -> ${symlink.link_path}.`,
      });
    }
  }

  return { valid: issues.length === 0, issues };
}

function collectPlanPaths(plan: InstallPlanCandidate) {
  return [
    ...plan.files_to_change.flatMap((file) => [file.path, file.backup_path]),
    ...plan.backup_paths,
    ...plan.symlink_actions.flatMap((symlink) => [symlink.link_path, symlink.target_path]),
  ];
}

function exposesRuntimeOrSecretPath(pathValue: string) {
  return /(^|\/)\.env($|[./-])/.test(pathValue)
    || /(^|\/)auth\.json$/.test(pathValue)
    || /(^|\/)id_(rsa|ed25519|ecdsa)$/.test(pathValue)
    || /(^|\/)\.ssh(\/|$)/.test(pathValue)
    || /~\/\.pai\/(events\.sqlite|memory|trails|transcripts|auth)(\/|$)/.test(pathValue);
}

function isTrackedSourcePath(pathValue: string) {
  return pathValue.startsWith("/home/james/dotfiles/") || pathValue.startsWith("./") || pathValue.startsWith(".pai/");
}

function isRuntimeStorePath(pathValue: string) {
  return /~\/\.pai\/(events\.sqlite|memory|trails|transcripts|auth)(\/|$)/.test(pathValue);
}
