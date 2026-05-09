import { createHash } from "node:crypto";
import { basename, join, normalize, resolve } from "node:path";
import { buildRuntimePaths } from "./runtime-paths";

export type ProjectIdentitySource = "git_remote" | "path_fallback" | "manual_alias";

export type ProjectIdentityInput = {
  repoRoot: string;
  gitRemoteUrl?: string;
  runtimeHome?: string;
  manualAlias?: string;
  existingProjectIds?: ReadonlySet<string>;
};

export type ProjectIdentity = {
  project_id: string;
  display_alias: string;
  source: ProjectIdentitySource;
  alias_file: string;
};

const HOST_ALIASES: Record<string, string> = {
  "github-personal": "github.com",
  "ssh.github.com": "github.com",
};

export function manualProjectAliasesFile(runtimeHome?: string): string {
  return join(buildRuntimePaths(runtimeHome).home, "project-aliases.json");
}

function normalizeGitRemoteForHash(remoteUrl: string): string | undefined {
  const remote = remoteUrl.trim();
  if (!remote) return undefined;

  const scpLike = remote.match(/^(?:[^@\s]+@)?([^:\s]+):(.+)$/);
  if (scpLike && !remote.includes("://")) {
    return normalizeRemoteParts(scpLike[1], scpLike[2]);
  }

  try {
    const parsed = new URL(remote);
    return normalizeRemoteParts(parsed.hostname, parsed.pathname);
  } catch {
    return undefined;
  }
}

export function resolveProjectIdentity(input: ProjectIdentityInput): ProjectIdentity {
  const aliasFile = manualProjectAliasesFile(input.runtimeHome);
  const manualAlias = sanitizeDisplayAlias(input.manualAlias);

  if (manualAlias) {
    return {
      project_id: uniqueProjectId(`manual:${hashValue(manualAlias)}`, input.existingProjectIds),
      display_alias: manualAlias,
      source: "manual_alias",
      alias_file: aliasFile,
    };
  }

  const repoRoot = normalizeRepoRoot(input.repoRoot);
  const normalizedRemote = input.gitRemoteUrl ? normalizeGitRemoteForHash(input.gitRemoteUrl) : undefined;

  if (normalizedRemote) {
    const repoName = repoDisplayName(normalizedRemote) || repoDisplayName(repoRoot) || "project";
    return {
      project_id: uniqueProjectId(`git:${hashValue(`${normalizedRemote}|root:${repoRoot}`)}`, input.existingProjectIds),
      display_alias: repoName,
      source: "git_remote",
      alias_file: aliasFile,
    };
  }

  return {
    project_id: uniqueProjectId(`path:${hashValue(repoRoot)}`, input.existingProjectIds),
    display_alias: repoDisplayName(repoRoot) || "project",
    source: "path_fallback",
    alias_file: aliasFile,
  };
}

function normalizeRemoteParts(host: string, path: string) {
  const normalizedHost = HOST_ALIASES[host.toLowerCase()] || host.toLowerCase();
  const normalizedPath = path
    .replace(/^\/+/, "")
    .replace(/\.git$/i, "")
    .split("/")
    .filter(Boolean)
    .join("/")
    .toLowerCase();

  if (!normalizedHost || !normalizedPath) return undefined;
  return `${normalizedHost}/${normalizedPath}`;
}

function normalizeRepoRoot(repoRoot: string) {
  return normalize(resolve(repoRoot));
}

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function uniqueProjectId(projectId: string, existingProjectIds?: ReadonlySet<string>) {
  if (!existingProjectIds?.has(projectId)) return projectId;

  let suffix = 2;
  let candidate = `${projectId}-${suffix}`;
  while (existingProjectIds.has(candidate)) {
    suffix += 1;
    candidate = `${projectId}-${suffix}`;
  }
  return candidate;
}

function repoDisplayName(value: string) {
  return sanitizeDisplayAlias(basename(value.replace(/\.git$/i, "")));
}

function sanitizeDisplayAlias(value?: string) {
  return value?.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || undefined;
}
