import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { existsSync, lstatSync, readFileSync, readlinkSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { homedir } from "node:os";
import { promisify } from "node:util";

const exec = promisify(execFile);
const MAX_FILES = 4_000;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_TOTAL_BYTES = 32 * 1024 * 1024;
const MAX_CHECKS = 12;
const SENSITIVE =
  /(^|\/)(?:\.env(?:\..*)?|auth\.json|models\.json|credentials?(?:\..*)?|secrets?(?:\..*)?|id_(?:rsa|ed25519)|[^/]*\.(?:pem|key|p12|pfx))$/i;
const TRANSIENT =
  /(^|\/)(?:\.git|node_modules|\.venv|venv|coverage|test-results|\.pi-lens|\.pi-lens-probe-home)(\/|$)|^\.pi\/fabric\/|^\.superpowers\/sdd\//;
const hash = (value: string | Buffer): string => createHash("sha256").update(value).digest("hex");

export type Risk = "api" | "security" | "platform";
export type Freshness = "current" | "changed" | "unknown";
export interface WorkspaceSnapshot {
  root: string;
  scope: "git-content" | "observed-files";
  complete: boolean;
  index: Map<string, string>;
  dirty: Set<string>;
  files: Map<string, string>;
  sensitiveRevision: string;
}
export interface CheckRecord {
  id: string;
  runner: string;
  commandDigest: string;
  exitCode: number | null;
  toolSucceeded: boolean;
  scope: "workspace" | "opaque";
  freshness: Freshness;
}
export interface DocumentBinding {
  path: string;
  digest: string;
  approvedDigest?: string;
  approvalSource?: "operator-input";
}
interface PendingCheck {
  record: CheckRecord;
  snapshot?: WorkspaceSnapshot;
}
interface StoredCheck extends PendingCheck {
  end?: WorkspaceSnapshot;
  runFreshness: Freshness;
}
export interface EvidenceView {
  version: 1;
  workspaceRoot: string;
  superpowersRoot?: string;
  coverage: string;
  checks: CheckRecord[];
  checkCount: number;
  changedFiles: string[];
  riskFiles: string[];
  omittedSensitivePaths: number;
  risks: Risk[];
  riskRevision: string;
  specialistRequestedRevision?: string;
  observedSkills: string[];
  spec?: DocumentBinding & { approval: "confirmed" | "changed" | "unconfirmed" };
  plan?: DocumentBinding & { approval: "confirmed" | "changed" | "unconfirmed" };
}

function inside(root: string, file: string): boolean {
  const relative = path.relative(root, file);
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))
  );
}

function toolPath(cwd: string, input: string): string {
  const expanded = /^~[\\/]/.test(input)
    ? path.join(homedir(), input.slice(2))
    : path.resolve(cwd, input);
  try {
    return realpathSync(expanded);
  } catch {
    try {
      return path.join(realpathSync(path.dirname(expanded)), path.basename(expanded));
    } catch {
      return expanded;
    }
  }
}

function publicPath(root: string, input: string): string | undefined {
  if (input.includes("\0")) return undefined;
  const absolute = path.resolve(root, input);
  if (!inside(root, absolute)) return undefined;
  const relative = path.relative(root, absolute).replaceAll(path.sep, "/");
  if (!relative || relative.length > 240 || SENSITIVE.test(relative) || TRANSIENT.test(relative))
    return undefined;
  return relative;
}

function fileVersion(
  root: string,
  relative: string,
): { version: string; bytes: number } | undefined {
  const file = path.join(root, relative);
  try {
    const before = lstatSync(file);
    if (before.isSymbolicLink()) return { version: `link:${hash(readlinkSync(file))}`, bytes: 0 };
    if (!before.isFile() || before.size > MAX_FILE_BYTES || !inside(root, realpathSync(file)))
      return undefined;
    const bytes = readFileSync(file);
    const after = statSync(file);
    if (before.size !== after.size || before.mtimeMs !== after.mtimeMs) return undefined;
    return { version: `${hash(bytes)}:${before.mode & 0o777}`, bytes: bytes.length };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { version: "missing", bytes: 0 };
    return undefined;
  }
}

function sensitiveVersion(root: string, relative: string): string {
  const file = path.resolve(root, relative);
  if (!inside(root, file)) return hash("outside-workspace");
  try {
    const stat = lstatSync(file);
    return hash(`${relative}\0${stat.size}\0${stat.mtimeMs}\0${stat.ctimeMs}\0${stat.mode}`);
  } catch {
    return hash(`${relative}\0missing-or-unreadable`);
  }
}

async function git(cwd: string, args: string[]): Promise<string> {
  const windowsGit = "C:/Program Files/Git/cmd/git.exe";
  const binary = process.platform === "win32" && existsSync(windowsGit) ? windowsGit : "git";
  const result = await exec(
    binary,
    ["-c", "core.fsmonitor=false", "-c", "core.untrackedCache=false", ...args],
    {
      cwd,
      env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" },
      timeout: 5_000,
      maxBuffer: 8 * 1024 * 1024,
      windowsHide: true,
    },
  );
  return result.stdout;
}

export async function captureWorkspace(
  cwd: string,
  observed: Iterable<string> = [],
): Promise<WorkspaceSnapshot> {
  let root = realpathSync(cwd);
  const index = new Map<string, string>();
  const dirty = new Set<string>();
  const sensitive = new Set<string>();
  let scope: WorkspaceSnapshot["scope"] = "observed-files";
  let complete = true;
  let status = "";
  try {
    root = realpathSync((await git(cwd, ["rev-parse", "--show-toplevel"])).trim());
    const tracked = await git(root, ["ls-files", "--stage", "-z"]);
    for (const entry of tracked.split("\0").filter(Boolean)) {
      const match = /^(\d+) ([a-f0-9]+) (\d)\t([\s\S]+)$/.exec(entry);
      if (!match) {
        complete = false;
        continue;
      }
      const relative = publicPath(root, match[4]);
      if (!relative) continue;
      if (match[3] !== "0" || match[1] === "160000") complete = false;
      index.set(relative, `${match[1]}:${match[2]}`);
      if (index.size > 50_000) {
        complete = false;
        break;
      }
    }
    status = await git(root, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]);
    const entries = status.split("\0");
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (!entry) continue;
      const relative = publicPath(root, entry.slice(3));
      if (relative) dirty.add(relative);
      else if (!TRANSIENT.test(entry.slice(3))) {
        complete = false;
        if (SENSITIVE.test(entry.slice(3))) sensitive.add(sensitiveVersion(root, entry.slice(3)));
      }
      if (/[RC]/.test(entry.slice(0, 2))) {
        const previous = publicPath(root, entries[++i] ?? "");
        if (previous) dirty.add(previous);
      }
    }
    scope = "git-content";
  } catch {
    complete = false;
  }
  const candidates = new Set(dirty);
  for (const file of observed) {
    const relative = publicPath(root, path.resolve(cwd, file));
    if (relative) candidates.add(relative);
    else complete = false;
  }
  const files = new Map<string, string>();
  let bytes = 0;
  for (const relative of candidates) {
    if (files.size >= MAX_FILES || bytes > MAX_TOTAL_BYTES) {
      complete = false;
      break;
    }
    const result = fileVersion(root, relative);
    if (!result) {
      complete = false;
      continue;
    }
    bytes += result.bytes;
    files.set(relative, result.version);
  }
  if (scope === "git-content") {
    try {
      if (status !== (await git(root, ["status", "--porcelain=v1", "-z", "--untracked-files=all"])))
        complete = false;
    } catch {
      complete = false;
    }
  }
  return {
    root,
    scope,
    complete,
    index,
    dirty,
    files,
    sensitiveRevision: hash([...sensitive].sort().join("\n")),
  };
}

export function changedPaths(before: WorkspaceSnapshot, after: WorkspaceSnapshot): string[] {
  if (before.root !== after.root) return ["[workspace changed]"];
  const changed = new Set<string>();
  for (const [file, version] of before.files)
    if (after.files.get(file) !== version) changed.add(file);
  for (const file of after.dirty) if (!before.files.has(file)) changed.add(file);
  const keys = new Set([...before.index.keys(), ...after.index.keys()]);
  for (const file of keys)
    if (!before.files.has(file) && before.index.get(file) !== after.index.get(file))
      changed.add(file);
  return [...changed].sort();
}

export function classifyRisks(files: string[]): Risk[] {
  const risks = new Set<Risk>();
  for (const file of files) {
    if (
      /(^|\/)(?:package(?:-lock)?\.json|pnpm-lock\.yaml|yarn\.lock|pyproject\.toml|requirements[^/]*|go\.(?:mod|sum)|Cargo\.(?:toml|lock))$|(?:^|\/)(?:api|sdk|clients?|providers?|extensions)(?:\/|[._-])/i.test(
        file,
      )
    )
      risks.add("api");
    if (
      /(?:auth|oauth|permission|credential|secret|security|encrypt|session[-_]?token)|(^|\/)\.env/i.test(
        file,
      )
    )
      risks.add("security");
    if (
      /(?:windows|win32|powershell|wsl|arm64|aarch64|launcher)|\.(?:ps1|cmd|bat)$|(^|\/)install(?:[-_.]|$)/i.test(
        file,
      )
    )
      risks.add("platform");
  }
  return [...risks].sort();
}

export function validationCommand(
  command: string,
): { runner: string; scope: "workspace" | "opaque" } | undefined {
  let text = command.trim();
  if (/^(?:echo|printf|cat)\b/i.test(text)) return undefined;
  const environment = /^(?:[A-Za-z_]\w*=(?:"[^"]*"|'[^']*'|\S+)\s+)+/.exec(text);
  if (environment) text = text.slice(environment[0].length);
  const pattern =
    /^(?:pytest|vitest|jest|unittest|tsc|style-check|shellcheck|shfmt|ruff|markdownlint-cli2)\b|^(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?(?:test|check|lint|build|typecheck)\b|^(?:go|cargo|dotnet)\s+test\b|^python[\d.]*\s+-m\s+(?:pytest|unittest)\b|^node\s+(?:--[\w-]+\s+)*--test\b|^(?:bash|sh)\s+[^\s;&|]*(?:\.test\.sh|run-all\.sh)\b/i;
  const remote = /^(?:ssh|scp|wsl(?:\.exe)?|powershell\.exe|pwsh\.exe|cmd\.exe)\b/i.test(text);
  const runner = pattern.exec(text);
  if (!runner && !remote) return undefined;
  if (!runner) return { runner: "remote or wrapped validation", scope: "opaque" };
  let label = runner[0].replace(/\s+/g, " ");
  if (/^(?:bash|sh)\s/.test(label)) label = "shell test script";
  const opaque = environment !== null || /[\n\r;&|`<>]|\$\(/.test(command);
  // ponytail: retain labels/digests, not raw arguments; add an audited argv redactor before storing commands.
  return { runner: label, scope: opaque ? "opaque" : "workspace" };
}

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function observedExit(result: unknown): number | null {
  if (!object(result)) return null;
  const content = object(result.structuredContent) ? result.structuredContent : result;
  for (const key of ["exit_code", "exitCode"]) {
    const code = content[key];
    if (typeof code === "number" && Number.isInteger(code) && code >= 0 && code <= 255) return code;
  }
  return null;
}

function documentReference(text: string, kind: "spec" | "plan"): string | undefined {
  const directory = kind === "spec" ? "specs" : "plans";
  return new RegExp(`(?:\\.?\\/?docs/superpowers/${directory}/[^\\s\\x60"'<>]+\\.md)`, "i").exec(
    text,
  )?.[0];
}

function completeApproval(text: string, reference: string): boolean {
  const escaped = reference.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const statement = text
    .trim()
    .replace(new RegExp(`[\\x60"']?${escaped}[\\x60"']?`, "g"), "@DOCUMENT@");
  return /^(?:please\s+)?(?:(?:i\s+)?approve(?:d)?\s+(?:the\s+)?(?:(?:spec|design|plan)(?:\s+at)?\s+)?|use\s+(?:the\s+)?approved\s+(?:(?:spec|design|plan)(?:\s+at)?\s+)?)@DOCUMENT@[.! ]*$/i.test(
    statement,
  );
}

export class SessionEvidence {
  readonly cwd: string;
  private baseline?: WorkspaceSnapshot;
  private initializing?: Promise<void>;
  private observed = new Set<string>();
  private pending = new Map<string, PendingCheck>();
  private checks: StoredCheck[] = [];
  private checkCount = 0;
  private seen = new Set<string>();
  private changed = new Set<string>();
  private skills = new Set<string>();
  private sensitiveChanges = 0;
  private lastSensitiveRevision = "";
  private spec?: DocumentBinding;
  private plan?: DocumentBinding;
  private approvalQuestion?: {
    kind: "spec" | "plan";
    binding: DocumentBinding;
    executionChoice: boolean;
  };
  private lastSpecialist = "";
  private readonly superpowersRoot?: string;

  constructor(cwd: string, superpowersRoot?: string) {
    this.cwd = realpathSync(cwd);
    this.superpowersRoot =
      superpowersRoot && existsSync(superpowersRoot) ? realpathSync(superpowersRoot) : undefined;
  }

  async initialize(): Promise<void> {
    if (this.baseline) return;
    this.initializing ??= (async () => {
      this.baseline = await captureWorkspace(this.cwd);
      this.lastSensitiveRevision = this.baseline.sensitiveRevision;
    })();
    await this.initializing;
  }

  restore(value: unknown): void {
    if (!object(value) || value.version !== 1) return;
    for (const kind of ["spec", "plan"] as const) {
      const saved = value[kind];
      if (!object(saved) || typeof saved.path !== "string") continue;
      const binding = this.bind(saved.path);
      if (!binding) continue;
      if (
        saved.approvalSource === "operator-input" &&
        typeof saved.approvedDigest === "string" &&
        /^[a-f0-9]{64}$/.test(saved.approvedDigest)
      ) {
        binding.approvedDigest = saved.approvedDigest;
        binding.approvalSource = "operator-input";
      }
      this[kind] = binding;
    }
    const restoredPaths = [
      ...(Array.isArray(value.changedFiles) ? value.changedFiles : []),
      ...(Array.isArray(value.riskFiles) ? value.riskFiles : []),
    ].slice(0, 140);
    if (
      typeof value.omittedSensitivePaths === "number" &&
      Number.isInteger(value.omittedSensitivePaths) &&
      value.omittedSensitivePaths >= 0 &&
      value.omittedSensitivePaths <= 1_000_000
    )
      this.sensitiveChanges = value.omittedSensitivePaths;
    for (const file of restoredPaths) {
      if (typeof file !== "string") continue;
      const relative = publicPath(this.baseline?.root ?? this.cwd, file);
      if (relative) {
        this.changed.add(relative);
        this.observed.add(path.join(this.baseline?.root ?? this.cwd, relative));
      }
    }
    if (Array.isArray(value.checks))
      for (const saved of value.checks.slice(-MAX_CHECKS)) {
        if (
          !object(saved) ||
          typeof saved.id !== "string" ||
          !/^[\w:/.~-]{1,200}$/.test(saved.id) ||
          typeof saved.runner !== "string" ||
          !/^[\w .-]{1,80}$/.test(saved.runner) ||
          typeof saved.commandDigest !== "string" ||
          !/^[a-f0-9]{64}$/.test(saved.commandDigest)
        )
          continue;
        const exitCode = observedExit({ exitCode: saved.exitCode });
        this.checks.push({
          runFreshness: "unknown",
          record: {
            id: saved.id,
            runner: saved.runner,
            commandDigest: saved.commandDigest,
            exitCode,
            toolSucceeded: saved.toolSucceeded === true,
            scope: saved.scope === "workspace" ? "workspace" : "opaque",
            freshness: "unknown",
          },
        });
      }
    this.checkCount =
      typeof value.checkCount === "number" &&
      Number.isInteger(value.checkCount) &&
      value.checkCount >= this.checks.length &&
      value.checkCount <= 1_000_000
        ? value.checkCount
        : this.checks.length;
    if (
      typeof value.specialistRequestedRevision === "string" &&
      /^[a-f0-9]{64}$/.test(value.specialistRequestedRevision)
    )
      this.lastSpecialist = value.specialistRequestedRevision;
  }

  private allObserved(): string[] {
    const files = [...this.observed];
    for (const check of this.checks)
      if (check.end)
        for (const file of check.end.files.keys()) files.push(path.join(check.end.root, file));
    return files;
  }

  async start(id: string, tool: string, input: Record<string, unknown>): Promise<void> {
    if (
      this.seen.has(id) ||
      this.pending.has(id) ||
      !["bash", "powershell"].includes(tool) ||
      typeof input.command !== "string"
    )
      return;
    const check = validationCommand(input.command);
    if (!check) return;
    await this.initialize();
    const record: CheckRecord = {
      id,
      runner: check.runner,
      commandDigest: hash(input.command),
      exitCode: null,
      toolSucceeded: false,
      scope: check.scope,
      freshness: "unknown",
    };
    const snapshot =
      check.scope === "workspace"
        ? await captureWorkspace(this.cwd, this.allObserved())
        : undefined;
    this.pending.set(id, { record, snapshot });
  }

  async finish(
    id: string,
    tool: string,
    input: Record<string, unknown>,
    result: unknown,
    isError: boolean,
  ): Promise<void> {
    if (this.seen.has(id)) return;
    this.seen.add(id);
    if (this.seen.size > 2_000) {
      const oldest = this.seen.values().next().value;
      if (oldest !== undefined) this.seen.delete(oldest);
    }
    if (!isError && ["edit", "write"].includes(tool) && typeof input.path === "string") {
      const root = this.baseline?.root ?? this.cwd;
      const relative = publicPath(root, toolPath(this.cwd, input.path));
      if (relative) {
        this.observed.add(path.join(root, relative));
        this.changed.add(relative);
      } else this.sensitiveChanges++;
    }
    if (!isError && tool === "read" && typeof input.path === "string") {
      const resolved = toolPath(this.cwd, input.path);
      if (this.superpowersRoot && inside(this.superpowersRoot, resolved)) {
        const relative = path.relative(this.superpowersRoot, resolved).replaceAll(path.sep, "/");
        const skill = /^skills\/([\w-]+)\/SKILL\.md$/.exec(relative)?.[1];
        if (skill) this.skills.add(skill);
      }
    }
    const pending = this.pending.get(id);
    if (!pending) return;
    this.pending.delete(id);
    const snapshot = pending.snapshot;
    const end = snapshot
      ? await captureWorkspace(
          this.cwd,
          [...this.allObserved(), ...snapshot.files.keys()].map((file) =>
            path.isAbsolute(file) ? file : path.join(snapshot.root, file),
          ),
        )
      : undefined;
    const exitCode = observedExit(result);
    const record = { ...pending.record, exitCode, toolSucceeded: !isError };
    if (pending.snapshot && end && pending.snapshot.complete && end.complete)
      record.freshness = changedPaths(pending.snapshot, end).length ? "changed" : "current";
    this.checkCount++;
    this.checks.push({ record, snapshot: pending.snapshot, end, runFreshness: record.freshness });
    this.checks = this.checks.slice(-MAX_CHECKS);
  }

  private bind(file: string): DocumentBinding | undefined {
    const root = this.baseline?.root ?? this.cwd;
    const relative = publicPath(root, file);
    if (!relative) return undefined;
    const absolute = path.join(root, relative);
    try {
      if (!inside(root, realpathSync(absolute)) || statSync(absolute).size > MAX_FILE_BYTES)
        return undefined;
      return { path: relative, digest: hash(readFileSync(absolute)) };
    } catch {
      return undefined;
    }
  }

  private retainApproval(kind: "spec" | "plan", binding: DocumentBinding): DocumentBinding {
    const previous = this[kind];
    return previous?.path === binding.path && previous.approvedDigest
      ? {
          ...binding,
          approvedDigest: previous.approvedDigest,
          approvalSource: previous.approvalSource,
        }
      : binding;
  }

  operatorInput(text: string, source: string): void {
    if (source !== "interactive" && source !== "rpc") return;
    const negated = /\b(?:not|unapproved|don't|do not|pending)\b/i.test(text);
    for (const kind of ["spec", "plan"] as const) {
      const reference = documentReference(text, kind);
      if (!reference) continue;
      const current = this.bind(reference);
      if (!current) continue;
      const binding = this.retainApproval(kind, current);
      if (!negated && completeApproval(text, reference)) {
        binding.approvedDigest = binding.digest;
        binding.approvalSource = "operator-input";
      }
      this[kind] = binding;
    }
    const acknowledgement =
      /^(?:yes|(?:yes[,! ]*)?(?:approved|approve(?:d)? (?:the )?(?:spec|design|plan)|go ahead|proceed(?: with (?:the )?(?:plan|implementation))?))[.! ]*$/i.test(
        text.trim(),
      );
    const executionChoice =
      this.approvalQuestion?.executionChoice &&
      /^(?:native|subagent(?:-driven)?(?: development)?)[.! ]*$/i.test(text.trim());
    if (!negated && (acknowledgement || executionChoice) && this.approvalQuestion) {
      const { kind, binding } = this.approvalQuestion;
      const current = this.bind(binding.path);
      if (current?.digest === binding.digest)
        this[kind] = {
          ...current,
          approvedDigest: current.digest,
          approvalSource: "operator-input",
        };
    }
    this.approvalQuestion = undefined;
  }

  assistantMessage(text: string): void {
    this.approvalQuestion = undefined;
    if (!/\?\s*$/.test(text)) return;
    for (const kind of ["spec", "plan"] as const) {
      const reference = documentReference(text, kind);
      const prose = text.replace(/```[\s\S]*?```/g, "").replace(/[^\s\x60\"'<>]+\.md\b/g, "");
      const question = prose.trim().split("\n").at(-1) ?? "";
      const executionChoice =
        kind === "plan" &&
        /\breview\b/i.test(prose) &&
        /\bnative\b/i.test(prose) &&
        /\bsubagent/i.test(prose);
      if (!reference || (!/\b(?:approve|your approval)\b/i.test(question) && !executionChoice))
        continue;
      const binding = this.bind(reference);
      if (binding) {
        this[kind] = this.retainApproval(kind, binding);
        this.approvalQuestion = { kind, binding, executionChoice };
      }
    }
  }

  previewSpec(file: string): DocumentBinding | undefined {
    return this.bind(file);
  }

  selectSpec(file: string, approve: boolean, expectedDigest?: string): boolean {
    const binding = this.bind(file);
    if (!binding || (expectedDigest !== undefined && binding.digest !== expectedDigest))
      return false;
    if (approve) {
      binding.approvedDigest = binding.digest;
      binding.approvalSource = "operator-input";
    }
    this.spec = approve ? binding : this.retainApproval("spec", binding);
    return true;
  }

  clearSpec(): void {
    this.spec = undefined;
  }

  private document(binding: DocumentBinding | undefined): EvidenceView["spec"] {
    if (!binding) return undefined;
    const current = this.bind(binding.path);
    const digest = current?.digest ?? "missing";
    return {
      ...binding,
      digest,
      approval: binding.approvedDigest
        ? digest === binding.approvedDigest
          ? "confirmed"
          : "changed"
        : "unconfirmed",
    };
  }

  async view(): Promise<EvidenceView> {
    await this.initialize();
    const baseline = this.baseline;
    if (!baseline) throw new Error("Evidence baseline is unavailable");
    const current = await captureWorkspace(
      this.cwd,
      [...this.allObserved(), ...baseline.files.keys()].map((file) =>
        path.isAbsolute(file) ? file : path.join(baseline.root, file),
      ),
    );
    if (current.sensitiveRevision !== this.lastSensitiveRevision) {
      this.sensitiveChanges++;
      this.lastSensitiveRevision = current.sensitiveRevision;
    }
    for (const file of changedPaths(baseline, current))
      if (publicPath(current.root, file)) this.changed.add(file);
    for (const check of this.checks) {
      if (check.runFreshness === "changed") check.record.freshness = "changed";
      else if (check.runFreshness !== "current" || !check.end?.complete || !current.complete)
        check.record.freshness = "unknown";
      else check.record.freshness = changedPaths(check.end, current).length ? "changed" : "current";
    }
    const allChanged = [...this.changed].sort();
    const changedFiles = allChanged.slice(0, 100);
    const risks = classifyRisks(allChanged);
    if (this.sensitiveChanges && !risks.includes("security")) risks.push("security");
    const riskVersions = allChanged
      .filter((file) => classifyRisks([file]).length)
      .map((file) => [file, current.files.get(file) ?? current.index.get(file) ?? "unknown"]);
    return {
      version: 1,
      workspaceRoot: current.root,
      superpowersRoot: this.superpowersRoot,
      coverage:
        current.scope === "git-content" && current.complete
          ? "Main's observed tool checks and Git-content snapshots; not external services, ignored files, user shell commands or child reports"
          : "Partial observed-file evidence; not a whole-workspace verification",
      checks: this.checks.map((check) => ({ ...check.record })),
      checkCount: this.checkCount,
      changedFiles,
      riskFiles: allChanged.filter((file) => classifyRisks([file]).length).slice(0, 40),
      omittedSensitivePaths: this.sensitiveChanges,
      risks: risks.sort(),
      riskRevision: hash(JSON.stringify({ riskVersions, sensitiveChanges: this.sensitiveChanges })),
      specialistRequestedRevision: this.lastSpecialist || undefined,
      observedSkills: [...this.skills].sort(),
      spec: this.document(this.spec),
      plan: this.document(this.plan),
    };
  }

  specialistKey(view: EvidenceView): string | undefined {
    if (!view.risks.length) return undefined;
    const key = view.riskRevision;
    if (key === this.lastSpecialist) return undefined;
    return key;
  }

  markSpecialist(key: string): void {
    this.lastSpecialist = key;
  }
}
