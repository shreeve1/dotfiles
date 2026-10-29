// Pi extension that mirrors the Claude Code / Codex Stop hook
// (.agents/bin/verify-final) and adds a post-work cleanup gate and nudge.
//
// Grounding check (verify-final):
//   TUI: runs after the agent settles, in the background, and delivers a FALSE
//   finding as one corrective follow-up turn (pi.sendUserMessage) or a
//   non-triggering notice.
//   Headless (print/JSON/RPC): runs inside agent_before_settle and returns the
//   finding as a custom-message continuation, because a post-settle
//   sendUserMessage cannot run there — print mode awaits one session.prompt and
//   exits. The boundary continuation is awaited inside that same prompt call.
//
// Completion check (verify-final --done):
//   On a turn that edited, wrote or ran a command, the user's request (with the
//   two before it as context) and the final answer go to the same checker in
//   --done mode, which reports parts of the request that are not done. It runs
//   alongside the grounding check, at the same points and the same minimum
//   length; when either finds something, both findings go to the agent as ONE
//   follow-up turn. A turn's own follow-up is never checked again.
//   VERIFY_DONE=0 turns it off; VERIFY_FINAL=0 turns off both checks.
//
// Recommendation check (verify-final --recommend):
//   TUI only. After each settled answer (any turn, same minimum length) the
//   request history and answer go to the checker in --recommend mode, which
//   grounds the answer's recommendations in local docs, official docs and
//   existing open-source projects (web search through Exa, so it can take a few
//   minutes). It runs on its own, not merged with the two checks above, and its
//   result is delivered however late: as a new turn when the agent is idle, or
//   queued as a follow-up (deliverAs "followUp") when it is busy. A queued
//   revision rides inside the newer prompt's run, so that run is not checked;
//   a revision that starts its own turn is skipped like the follow-up above.
//   At most one per user prompt. VERIFY_RECOMMEND=0 turns it off.
//
// Cleanup (post-work-cleanup):
//   Tracks the code files THIS session changed through edit/write (by real
//   path, so a symlinked ~/.config file maps to its repo copy). Another
//   session's edits in the same repo are never counted. Two prompts:
//   - Commit gate: a bash `git commit` while tracked files are uncleaned is
//     blocked once per user prompt with the file list. Re-running the commit
//     goes through, so the agent can skip cleanup when it does not apply.
//   - Settle nudge: when the run ends with tracked files still uncommitted,
//     the boundary asks for cleanup over those files. It never asks for a
//     commit; whether to commit stays with the task and the repo's rules.
//   A successful read of the skill's SKILL.md, or /skill:post-work-cleanup,
//   counts as running it: tracked files are cleared and the cleanup's own edits
//   that prompt are not tracked. Docs, notes, data files and harness paths
//   (.pi/) are never tracked. Edits made through bash (sed -i, heredocs) are
//   not seen. Commits are found by parsing the bash command into its simple
//   commands; a commit run through eval, xargs, a git alias or a script is
//   not seen. Cheap and local: no model call.
//
// Both boundary handlers fire at most once per user prompt (guarded by
// userPromptSeq) so a continuation cannot re-trigger itself: the run loop
// re-enters agent_before_settle after every `continue: true`.
import type {
  AgentBeforeSettleEvent,
  AgentBeforeSettleEventResult,
  CustomMessageEntryDraft,
  ExtensionAPI,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { execFile, spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import {
  basename,
  dirname,
  isAbsolute,
  join as pathJoin,
  relative as pathRelative,
  resolve as pathResolve,
  sep,
} from "node:path";

const VERIFY_BIN = pathJoin(homedir(), ".agents", "bin", "verify-final");
// Windows cannot run a script from its shebang, so the checker starts through python there.
const [VERIFY_EXE, VERIFY_ARGS]: readonly [string, readonly string[]] =
  process.platform === "win32" ? ["python", [VERIFY_BIN]] : [VERIFY_BIN, []];
const CHECK_TIMEOUT_MS = 180_000;
// The script's own limit is VERIFY_RECOMMEND_TIMEOUT (300 s); this is a backstop.
const REC_TIMEOUT_MS = 330_000;
const REC_HEADER = "An independent check of the recommendations in an earlier answer found problems:";
const REC_FINDING_RE = /(^|\n)\s*(?:IMPOSSIBLE|WRONG|EXISTS)\s*\|/;
const REC_ERROR_PREFIX = "verify-final: recommendation check could not run";
const MIN_CHARS = 500;
// Grill format markers: answering questions or selecting next options. Same as the
// script's GRILL_MARKERS: ❓, or ➡ followed by its emoji selector U+FE0F.
const GRILL_MARKER_RE = /\u2753|\u27a1\ufe0f/u;
const GRILL_LEDGER_RE = /\.kanban[\\/]grilling[\\/][\w.-]+\.md\b/u;
// The verify-final script opens every FALSE and UNGROUNDED finding with the
// verdict name and a pipe — match those, not bare "FALSE" / "UNGROUNDED"
// substrings, so the notice path can never be triggered by prose.
const FINDING_RE = /(^|\n)\s*(?:FALSE|UNGROUNDED)\s*\|/;
// Hard cap on boundary-forced continuations per user prompt, in case a guard
// regresses and a handler re-fires.
const MAX_CONTINUATIONS_PER_PROMPT = 2;
const CLEANUP_SKILL_NAME = "post-work-cleanup";
// The skill counts as run once its SKILL.md is read (model) or injected
// (/skill:post-work-cleanup, which expands to a <skill name=...> block).
const CLEANUP_SKILL_FILE_RE = /(^|[\\/])post-work-cleanup[\\/]SKILL\.md\b/;
const CLEANUP_SKILL_BLOCK_RE = /<skill name="post-work-cleanup"/;
// Repo-relative paths never tracked: harness and dependency output, not work.
// pi-lens also drops a .pi-lens-probe-home/ directory into the cwd.
// Either separator: path.relative gives backslashes on Windows.
const HARNESS_PATH_RE = /(^|[\\/])(?:\.pi|\.pi-lens[^\\/]*|node_modules)[\\/]/;
// Cheap prefilter before parsing a bash command for commits.
const MAYBE_COMMIT_RE = /\bgit\b[\s\S]*\bcommit\b/;
// git global options that take the next word as their value.
const GIT_ARG_OPTS = new Set([
  "-C",
  "-c",
  "--git-dir",
  "--work-tree",
  "--namespace",
  "--exec-path",
]);
// Words that may precede the command name of a simple command.
const SHELL_PREFIX_WORDS = new Set([
  "!",
  "{",
  "}",
  "if",
  "then",
  "elif",
  "else",
  "do",
  "while",
  "until",
  "time",
  "env",
  "command",
  "nohup",
  "exec",
]);
// Paths shown in a message before the rest are summarised.
const MAX_FILES_SHOWN = 10;
// Code surfaces only. Cleanup exists for code, so a session that changed only
// docs, notes, ledgers, JSON or YAML is left alone. Extensionless scripts
// (identified by shebang) are not matched.
const CODE_EXT_RE =
  /\.(?:py|pyi|ps1|psm1|psd1|sh|bash|zsh|ksh|ts|tsx|mts|cts|js|jsx|mjs|cjs|go|rb|rs|c|h|cc|cpp|hpp|cxx|hxx|java|kt|kts|cs|php|sql|lua|swift|scala|pl|pm|r|ex|exs|erl|hs|clj|dart|vue|svelte)$/i;
const CLEANUP_DISABLE_HINT = "(Set POST_WORK_CLEANUP=0 to disable this reminder.)";
const NOT_A_COMMIT_REQUEST =
  "This is not a request to commit: commit only if the task or the repo's rules call for it.";

/** "a, b, c" with anything past MAX_FILES_SHOWN summarised as "and N more". */
function fileList(files: string[]): string {
  if (files.length <= MAX_FILES_SHOWN) return files.join(", ");
  return `${files.slice(0, MAX_FILES_SHOWN).join(", ")} and ${files.length - MAX_FILES_SHOWN} more`;
}

function cleanupAction(skillAvailable: boolean): string {
  return skillAvailable
    ? "run the `post-work-cleanup` skill over them and apply its findings"
    : "review them for leftover debug output, dead code and unused imports, and run the " +
        "project's linter or formatter if one is configured";
}

/** Settle nudge: tracked files are still uncommitted at the end of the run. */
function settleDirective(files: string[], skillAvailable: boolean): string {
  return [
    `This session changed code files that are not committed yet: ${fileList(files)}.`,
    `If the work on them is finished, ${cleanupAction(skillAvailable)} before they are committed;`,
    "if it is not finished, say so and skip this.",
    NOT_A_COMMIT_REQUEST,
    CLEANUP_DISABLE_HINT,
  ].join(" ");
}

/** Commit gate: the block reason the agent sees in place of the commit result. */
function gateReason(files: string[], skillAvailable: boolean): string {
  return [
    `Commit held once by the post-work-cleanup gate: this session changed ${fileList(files)}`,
    `and the cleanup has not run. First ${cleanupAction(skillAvailable)}, then commit again.`,
    "Skip the cleanup only if the user said to; then re-run the same commit and it will not",
    "be held again for this prompt.",
    CLEANUP_DISABLE_HINT,
  ].join(" ");
}

interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
  errored: boolean;
}

const activeChildren = new Set<ChildProcessWithoutNullStreams>();
// Completion check state: recent user requests (latest last) and whether this
// prompt's run edited, wrote or ran a command.
const REQUEST_HISTORY = 3;
const DONE_FINDING_RE = /(^|\n)\s*MISSING\s*\|/;
const WORK_TOOLS = new Set(["edit", "write", "bash"]);
const recentRequests: string[] = [];
let workedSeq = -1;
let lastAssistantText = "";
let userPromptSeq = 0;
let lastFollowupSeq = -1;
// Recommendation check: the prompt it last started for, and the prompt whose
// run carries a queued revision (that run is not checked).
let recStartedSeq = -1;
let recRevisionSeq = -1;
// Boundary guards, keyed to the user prompt they fired for.
let groundingDoneSeq = -1;
let cleanupDoneSeq = -1;
let cleanupPendingSeq = -1;
let continuationsThisPrompt = 0;
// Cleanup state. tracked: real path -> repo root, for code files this session
// changed through edit/write since the cleanup last ran.
const tracked = new Map<string, string>();
let cleanupRanSeq = -1;
let gateHeldSeq = -1;

function shouldSkipText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (
    trimmed.length < MIN_CHARS &&
    !GRILL_MARKER_RE.test(trimmed) &&
    !GRILL_LEDGER_RE.test(trimmed)
  )
    return true;
  return false;
}

function resolveCwd(ctx: ExtensionContext | undefined): string {
  return ctx?.cwd && ctx.cwd.length > 0 ? ctx.cwd : process.cwd();
}

function git(cwd: string, args: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    execFile("git", args, { cwd, timeout: 10_000, maxBuffer: 1 << 20 }, (err, stdout) => {
      resolve(err ? null : stdout.replace(/\r/g, ""));
    });
  });
}

/** Repo root containing dir (real path), or null outside a work tree. */
async function repoRootOf(dir: string): Promise<string | null> {
  const out = await git(dir, ["rev-parse", "--show-toplevel"]);
  const root = out?.trim();
  if (!root) return null;
  try {
    return realpathSync(root);
  } catch {
    return root;
  }
}

/** Resolve a tool path the way pi does (~, leading @, cwd-relative), then follow symlinks. */
function realToolPath(raw: string, cwd: string): string {
  let p = raw.startsWith("@") ? raw.slice(1) : raw;
  if (p === "~") p = homedir();
  else if (p.startsWith("~/")) p = pathJoin(homedir(), p.slice(2));
  const abs = isAbsolute(p) ? pathResolve(p) : pathResolve(cwd, p);
  try {
    return realpathSync(abs);
  } catch {
    try {
      return pathJoin(realpathSync(dirname(abs)), basename(abs));
    } catch {
      return abs;
    }
  }
}

/** Track a code file changed by edit/write, if it lives in a git work tree. */
async function trackChangedFile(raw: string, cwd: string): Promise<void> {
  const real = realToolPath(raw, cwd);
  if (!CODE_EXT_RE.test(real)) return;
  const root = await repoRootOf(dirname(real));
  if (!root) return;
  if (HARNESS_PATH_RE.test(pathRelative(root, real))) return;
  tracked.set(real, root);
}

/** Drop tracked files that are no longer dirty (committed, reverted, ignored). */
async function pruneTracked(): Promise<void> {
  const byRoot = new Map<string, string[]>();
  for (const [file, root] of tracked) {
    const list = byRoot.get(root) ?? [];
    list.push(file);
    byRoot.set(root, list);
  }
  for (const [root, files] of byRoot) {
    // -z keeps paths unescaped (non-ASCII, quotes); literal pathspecs keep a
    // file named with * or [ from matching as a glob.
    const out = await git(root, [
      "--literal-pathspecs",
      "status",
      "--porcelain=v1",
      "-z",
      "--untracked-files=all",
      "--",
      ...files,
    ]);
    // Unknown state (git failed): keep the entries rather than lose them.
    if (out === null) continue;
    const dirty = new Set<string>();
    const fields = out.split("\0");
    for (let i = 0; i < fields.length; i += 1) {
      const entry = fields[i];
      if (entry.length < 4) continue;
      dirty.add(pathResolve(root, entry.slice(3)));
      // A rename or copy is followed by its source path as its own field.
      if (entry[0] === "R" || entry[0] === "C") i += 1;
    }
    for (const file of files) if (!dirty.has(file)) tracked.delete(file);
  }
}

/** Short display path: cwd-relative inside cwd, ~-relative under home, else absolute. */
function displayPath(file: string, cwd: string): string {
  const rel = pathRelative(realToolPath(cwd, cwd), file);
  if (rel && !rel.startsWith("..") && !isAbsolute(rel)) return rel;
  const home = homedir();
  return file.startsWith(`${home}${sep}`) ? `~/${file.slice(home.length + 1)}` : file;
}

/** Mark a word that holds an expansion the parser cannot evaluate. */
const UNKNOWN = "\u0000";
// Pseudo-commands bracketing a child shell ((...), $(...), backticks): a cd
// inside one does not move the commands after it.
const SUBSHELL_OPEN = "\u0001(";
const SUBSHELL_CLOSE = "\u0001)";

/**
 * Split a bash command into its simple commands, as word lists. Honours
 * quotes, backslashes, comments, heredoc bodies and command separators
 * (; & | && || newline parentheses). Commands inside $(...) and backticks are
 * returned as commands too; the word holding them is marked UNKNOWN. Child
 * shells are bracketed by SUBSHELL_OPEN / SUBSHELL_CLOSE pseudo-commands.
 */
function scanShell(s: string, start: number, out: string[][], closer: string | null): number {
  let depth = 0;
  // Scan a child shell's body: a recursive scan bracketed by scope markers.
  const child = (body: string, from: number, end: string | null): number => {
    out.push([SUBSHELL_OPEN]);
    const next = scanShell(body, from, out, end);
    out.push([SUBSHELL_CLOSE]);
    return next;
  };
  let words: string[] = [];
  let word = "";
  let inWord = false;
  let heredocStrip: boolean | null = null;
  const heredocs: { delim: string; strip: boolean }[] = [];
  const endWord = (): void => {
    if (!inWord) return;
    if (heredocStrip !== null) {
      heredocs.push({ delim: word, strip: heredocStrip });
      heredocStrip = null;
    } else words.push(word);
    word = "";
    inWord = false;
  };
  const endCommand = (): void => {
    endWord();
    if (words.length > 0) out.push(words);
    words = [];
  };
  // Skip heredoc bodies that start after the newline at index nl.
  const skipHeredocs = (nl: number): number => {
    let at = nl + 1;
    for (const { delim, strip } of heredocs) {
      while (at < s.length) {
        const eol = s.indexOf("\n", at);
        const lineEnd = eol === -1 ? s.length : eol;
        const line = s.slice(at, lineEnd);
        at = lineEnd + 1;
        if ((strip ? line.replace(/^\t+/, "") : line) === delim) break;
      }
    }
    heredocs.length = 0;
    return at;
  };
  let i = start;
  while (i < s.length) {
    const c = s[i];
    if (c === ")" && depth === 0 && closer !== null) {
      endCommand();
      return i + 1;
    }
    if (c === "\\") {
      if (s[i + 1] !== "\n") {
        word += s[i + 1] ?? "";
        inWord = true;
      }
      i += 2;
    } else if (c === "'") {
      const end = s.indexOf("'", i + 1);
      word += s.slice(i + 1, end === -1 ? s.length : end);
      inWord = true;
      i = end === -1 ? s.length : end + 1;
    } else if (c === '"') {
      inWord = true;
      i += 1;
      while (i < s.length && s[i] !== '"') {
        if (s[i] === "\\" && i + 1 < s.length) {
          word += s[i + 1];
          i += 2;
        } else if (s.startsWith("$(", i)) {
          i = child(s, i + 2, ")");
          word += UNKNOWN;
        } else if (s[i] === "`") {
          const end = s.indexOf("`", i + 1);
          child(s.slice(i + 1, end === -1 ? s.length : end), 0, null);
          word += UNKNOWN;
          i = end === -1 ? s.length : end + 1;
        } else {
          if (s[i] === "$") word += UNKNOWN;
          word += s[i];
          i += 1;
        }
      }
      i += 1;
    } else if (s.startsWith("$(", i)) {
      i = child(s, i + 2, ")");
      word += UNKNOWN;
      inWord = true;
    } else if (c === "`") {
      const end = s.indexOf("`", i + 1);
      child(s.slice(i + 1, end === -1 ? s.length : end), 0, null);
      word += UNKNOWN;
      inWord = true;
      i = end === -1 ? s.length : end + 1;
    } else if (c === "#" && !inWord) {
      const eol = s.indexOf("\n", i);
      i = eol === -1 ? s.length : eol;
    } else if (c === "\n") {
      endCommand();
      i = heredocs.length > 0 || heredocStrip !== null ? skipHeredocs(i) : i + 1;
    } else if (c === "(") {
      endCommand();
      out.push([SUBSHELL_OPEN]);
      depth += 1;
      i += 1;
    } else if (c === ")") {
      endCommand();
      // An unmatched ")" (a case pattern) closes nothing.
      if (depth > 0) {
        out.push([SUBSHELL_CLOSE]);
        depth -= 1;
      }
      i += 1;
    } else if (c === ";" || c === "&" || c === "|") {
      endCommand();
      i += 1;
    } else if (s.startsWith("<<<", i)) {
      endWord();
      i += 3;
    } else if (s.startsWith("<<", i)) {
      endWord();
      i += 2;
      heredocStrip = s[i] === "-";
      if (heredocStrip) i += 1;
    } else if (c === "<" || c === ">") {
      endWord();
      i += 1;
    } else if (c === " " || c === "\t" || c === "\r") {
      endWord();
      i += 1;
    } else {
      if (c === "$") word += UNKNOWN;
      word += c;
      inWord = true;
      i += 1;
    }
  }
  endCommand();
  return i;
}

/** A path word resolved against base, or null when it holds an expansion. */
function shellPath(word: string | undefined, base: string | null): string | null {
  if (base === null || word === undefined) return null;
  if (word.includes(UNKNOWN) || /[*?[]/.test(word)) return null;
  return realToolPath(word, base);
}

interface CommitTarget {
  /** Directory git runs in after cd and -C, or null when not resolvable. */
  dir: string | null;
  /** --git-dir / --work-tree (or GIT_DIR / GIT_WORK_TREE): absent when not given, null when not resolvable. */
  gitDir?: string | null;
  workTree?: string | null;
}

/** Every `git commit` in a bash command, with where each one runs. */
function commitTargets(command: string, cwd: string): CommitTarget[] {
  if (!MAYBE_COMMIT_RE.test(command)) return [];
  const commands: string[][] = [];
  scanShell(command, 0, commands, null);
  const targets: CommitTarget[] = [];
  let dir: string | null = cwd;
  const outer: (string | null)[] = [];
  for (const words of commands) {
    if (words[0] === SUBSHELL_OPEN) {
      outer.push(dir);
      continue;
    }
    if (words[0] === SUBSHELL_CLOSE) {
      if (outer.length > 0) dir = outer.pop() ?? null;
      continue;
    }
    let k = 0;
    const env: Record<string, string> = {};
    for (; k < words.length; k += 1) {
      const assignment = /^([A-Za-z_]\w*)=([\s\S]*)$/.exec(words[k]);
      if (assignment) env[assignment[1]] = assignment[2];
      else if (!SHELL_PREFIX_WORDS.has(words[k])) break;
    }
    const name = words[k];
    if (name === undefined) continue;
    if (name === "cd" || name === "pushd") {
      const arg = words[k + 1];
      if (arg === undefined) dir = homedir();
      else if (arg !== "-" && !arg.startsWith("-")) dir = shellPath(arg, dir);
      continue;
    }
    if (basename(name) !== "git") continue;
    let at = dir;
    let gitDir: string | undefined = env.GIT_DIR;
    let workTree: string | undefined = env.GIT_WORK_TREE;
    k += 1;
    while (k < words.length && words[k].startsWith("-")) {
      const opt = words[k];
      const eq = opt.indexOf("=");
      // "--opt=value" carries its value; "-C dir" / "--git-dir dir" take the next word.
      const separate = eq === -1 && GIT_ARG_OPTS.has(opt);
      const key = eq === -1 ? opt : opt.slice(0, eq);
      const value = separate ? words[k + 1] : opt.slice(eq + 1);
      if (key === "-C") at = shellPath(value, at);
      else if (key === "--git-dir") gitDir = value;
      else if (key === "--work-tree") workTree = value;
      k += separate ? 2 : 1;
    }
    if (words[k] !== "commit") continue;
    targets.push({
      dir: at,
      gitDir: gitDir === undefined ? undefined : shellPath(gitDir, at),
      workTree: workTree === undefined ? undefined : shellPath(workTree, at),
    });
  }
  return targets;
}

/** Repo root a commit target writes to, or null when it cannot be told. */
function targetRoot(target: CommitTarget): Promise<string | null> {
  if (target.dir === null || target.gitDir === null || target.workTree === null)
    return Promise.resolve(null);
  if (target.workTree) return repoRootOf(target.workTree);
  if (target.gitDir)
    return repoRootOf(basename(target.gitDir) === ".git" ? dirname(target.gitDir) : target.gitDir);
  return repoRootOf(target.dir);
}

function markCleanupRan(): void {
  cleanupRanSeq = userPromptSeq;
  cleanupPendingSeq = -1;
  tracked.clear();
}

/** True when pi can load the cleanup skill from cwd or a user skill root. */
function cleanupSkillAvailable(cwd: string): boolean {
  const tail = ["skills", CLEANUP_SKILL_NAME, "SKILL.md"];
  const candidates = [
    pathJoin(homedir(), ".agents", ...tail),
    pathJoin(homedir(), ".pi", "agent", ...tail),
  ];
  let dir = pathResolve(cwd);
  for (;;) {
    candidates.push(pathJoin(dir, ".agents", ...tail));
    candidates.push(pathJoin(dir, ".pi", ...tail));
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return candidates.some((candidate) => existsSync(candidate));
}

/** Grounding check: the answer's claims against the files. */
function runCheck(cwd: string, text: string): Promise<RunResult> {
  return runChecker(cwd, ["--harness", "pi", "--check", "-"], text);
}

/** Completion check: did the run finish what the user asked? */
function runDoneCheck(cwd: string, text: string): Promise<RunResult> {
  const input = JSON.stringify({ requests: recentRequests, answer: text });
  return runChecker(cwd, ["--harness", "pi", "--done", "-"], input);
}

/** Recommendation check: do the answer's recommendations hold against docs and projects? */
function runRecommendCheck(cwd: string, text: string): Promise<RunResult> {
  const input = JSON.stringify({ requests: recentRequests, answer: text });
  return runChecker(cwd, ["--harness", "pi", "--recommend", "-"], input, REC_TIMEOUT_MS);
}

/** True when this prompt's run did work the completion check can judge. */
function shouldCheckDone(): boolean {
  return (
    process.env.VERIFY_DONE !== "0" && workedSeq === userPromptSeq && recentRequests.length > 0
  );
}

/** The follow-up text from both checks, or "" when neither found anything. */
function findingsText(grounding: RunResult, done: RunResult | null): string {
  const parts: string[] = [];
  if (FINDING_RE.test(grounding.stdout)) parts.push(grounding.stdout.trim());
  if (done && DONE_FINDING_RE.test(done.stdout)) parts.push(done.stdout.trim());
  return parts.join("\n\n");
}

function runChecker(
  cwd: string,
  args: string[],
  text: string,
  timeoutMs = CHECK_TIMEOUT_MS,
): Promise<RunResult> {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let errored = false;
    let child: ChildProcessWithoutNullStreams;
    try {
      child = spawn(VERIFY_EXE, [...VERIFY_ARGS, ...args], {
        cwd,
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch {
      resolve({
        stdout: "",
        stderr: "spawn failed",
        exitCode: null,
        signal: null,
        timedOut: false,
        errored: true,
      });
      return;
    }
    activeChildren.add(child);
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill();
      } catch {
        // Already exited; close/error still resolves the promise.
      }
    }, timeoutMs);
    if (typeof timer.unref === "function") timer.unref();
    child.on("close", (exitCode, signal) => {
      clearTimeout(timer);
      activeChildren.delete(child);
      resolve({ stdout, stderr, exitCode, signal, timedOut, errored });
    });
    child.on("error", () => {
      errored = true;
      clearTimeout(timer);
      activeChildren.delete(child);
      resolve({
        stdout,
        stderr,
        exitCode: null,
        signal: null,
        timedOut,
        errored,
      });
    });
    child.stdin.setDefaultEncoding("utf8");
    child.stdin.end(text);
  });
}

function extractText(message: unknown): string {
  if (!message || typeof message !== "object") return "";
  const obj = message as Record<string, unknown>;
  const content = obj.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((chunk: unknown) => {
      if (typeof chunk === "string") return chunk;
      if (
        chunk &&
        typeof chunk === "object" &&
        typeof (chunk as { text?: unknown }).text === "string"
      ) {
        return (chunk as { text: string }).text;
      }
      return "";
    })
    .filter((s) => s.length > 0)
    .join(" ");
}

function noticeText(result: RunResult): string {
  const head = result.stdout.trim().split("\n", 1)[0] ?? "";
  if (head) return head.length > 240 ? head.slice(0, 239) + "\u2026" : head;
  const errHead = result.stderr.trim().split("\n", 1)[0] ?? "";
  if (errHead)
    return "verify-final: " + (errHead.length > 220 ? errHead.slice(0, 219) + "\u2026" : errHead);
  return result.timedOut
    ? "verify-final: check timed out"
    : result.errored
      ? "verify-final: check could not run"
      : "verify-final: see findings";
}

function customMessage(customType: string, content: string): CustomMessageEntryDraft {
  return { type: "custom_message", customType, content, display: true };
}

/** One continuation is allowed per boundary; compose rather than clobber. */
function withContinuation(
  event: AgentBeforeSettleEvent,
  entry: CustomMessageEntryDraft,
): AgentBeforeSettleEventResult {
  return { entries: [...event.entries, entry], continue: true };
}

export default function verifyFinalHook(pi: ExtensionAPI): void {
  let aborted = false;

  pi.on("before_agent_start", async (event) => {
    // Only a user prompt begins a logical turn. A custom-triggered run
    // (pi.sendMessage with triggerTurn) belongs to the turn already in flight,
    // so counting it would reset the once-per-prompt guards and could make the
    // TUI follow-up prediction skip the wrong run.
    if (event.messageType !== "user") return;
    userPromptSeq += 1;
    groundingDoneSeq = -1;
    cleanupDoneSeq = -1;
    continuationsThisPrompt = 0;
    if (CLEANUP_SKILL_BLOCK_RE.test(event.prompt)) markCleanupRan();
    // A recommendation revision that starts its own turn is not checked or kept.
    if (event.prompt.startsWith(REC_HEADER)) lastFollowupSeq = userPromptSeq;
    // The checks' own follow-up is not a request to judge the next answer against.
    if (userPromptSeq !== lastFollowupSeq && event.prompt.trim()) {
      recentRequests.push(event.prompt.trim());
      if (recentRequests.length > REQUEST_HISTORY) recentRequests.shift();
    }
  });

  pi.on("session_start", () => {
    tracked.clear();
    recentRequests.length = 0;
  });

  pi.on("tool_call", (event) => {
    if (WORK_TOOLS.has(event.toolName)) workedSeq = userPromptSeq;
  });

  // Commit gate: hold a bash `git commit` once while tracked files are uncleaned.
  pi.on("tool_call", async (event, ctx) => {
    if (aborted) return;
    if (process.env.POST_WORK_CLEANUP === "0") return;
    if (event.toolName !== "bash") return;
    const command = (event.input as { command?: unknown }).command;
    if (typeof command !== "string") return;
    const seq = userPromptSeq;
    const held = (): boolean =>
      seq !== userPromptSeq || cleanupRanSeq === seq || gateHeldSeq === seq;
    if (tracked.size === 0 || held()) return;
    const cwd = resolveCwd(ctx);
    const targets = commitTargets(command, cwd);
    if (targets.length === 0) return;
    await pruneTracked();
    const roots = await Promise.all(targets.map(targetRoot));
    // A target the parser cannot resolve may be any repo: hold for all files.
    const anyRepo = roots.includes(null);
    const files = [...tracked].flatMap(([f, fileRoot]) =>
      anyRepo || roots.includes(fileRoot) ? [f] : [],
    );
    // Parallel commit calls: only the first to get here holds.
    if (files.length === 0 || held()) return;
    gateHeldSeq = seq;
    const shown = files.map((f) => displayPath(f, cwd));
    return {
      block: true,
      reason: gateReason(shown, cleanupSkillAvailable(cwd)),
    };
  });

  // A successful read of the cleanup skill means it is running now. Track code
  // files this session changed; the cleanup's own edits are not tracked.
  pi.on("tool_result", async (event, ctx) => {
    if (aborted) return;
    if (event.isError) return;
    const path = (event.input as { path?: unknown }).path;
    if (typeof path !== "string") return;
    if (event.toolName === "read") {
      if (CLEANUP_SKILL_FILE_RE.test(path)) markCleanupRan();
      return;
    }
    if (event.toolName !== "edit" && event.toolName !== "write") return;
    if (cleanupRanSeq === userPromptSeq) return;
    await trackChangedFile(path, resolveCwd(ctx));
  });

  pi.on("agent_end", (event) => {
    if (aborted) return;
    const messages = Array.isArray((event as { messages?: unknown[] }).messages)
      ? (event as { messages: unknown[] }).messages
      : [];
    let text = "";
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];
      text = extractText(message);
      const role =
        message && typeof message === "object" ? (message as { role?: unknown }).role : undefined;
      if (text && role === "assistant") break;
      text = "";
    }
    if (cleanupPendingSeq === userPromptSeq) cleanupPendingSeq = -1;
    lastAssistantText = text;
  });

  // Settle nudge: this session's tracked code files are still uncommitted.
  pi.on("agent_before_settle", async (event, ctx): Promise<AgentBeforeSettleEventResult | void> => {
    if (aborted) return;
    // Never extend a failed or interrupted run.
    if (event.outcome !== "completed") return;
    if (process.env.POST_WORK_CLEANUP === "0") return;
    if (cleanupDoneSeq === userPromptSeq) return;
    // Already running this prompt, or the gate already asked and was declined.
    if (cleanupRanSeq === userPromptSeq || gateHeldSeq === userPromptSeq) return;
    if (continuationsThisPrompt >= MAX_CONTINUATIONS_PER_PROMPT) return;
    if (tracked.size === 0) return;
    await pruneTracked();
    if (tracked.size === 0) return;
    if (
      cleanupDoneSeq === userPromptSeq ||
      cleanupRanSeq === userPromptSeq ||
      gateHeldSeq === userPromptSeq
    )
      return;
    const cwd = resolveCwd(ctx);
    cleanupDoneSeq = userPromptSeq;
    cleanupPendingSeq = userPromptSeq;
    continuationsThisPrompt += 1;
    const shown = [...tracked.keys()].map((f) => displayPath(f, cwd));
    return withContinuation(
      event,
      customMessage(CLEANUP_SKILL_NAME, settleDirective(shown, cleanupSkillAvailable(cwd))),
    );
  });

  // Grounding check for headless modes, where a post-settle follow-up cannot run.
  pi.on("agent_before_settle", async (event, ctx): Promise<AgentBeforeSettleEventResult | void> => {
    if (aborted) return;
    if (event.outcome !== "completed") return;
    if (ctx.mode === "tui") return;
    if (process.env.VERIFY_FINAL === "0") return;
    if (groundingDoneSeq === userPromptSeq) return;
    if (userPromptSeq === lastFollowupSeq) return;
    if (continuationsThisPrompt >= MAX_CONTINUATIONS_PER_PROMPT) return;
    if (cleanupPendingSeq === userPromptSeq) return;
    if (recRevisionSeq === userPromptSeq) return;
    const text = lastAssistantText;
    if (shouldSkipText(text)) return;
    groundingDoneSeq = userPromptSeq;
    const cwd = resolveCwd(ctx);
    const [grounding, done] = await Promise.all([
      runCheck(cwd, text),
      shouldCheckDone() ? runDoneCheck(cwd, text) : Promise.resolve(null),
    ]);
    if (aborted) return;
    const out = findingsText(grounding, done);
    if (!out) return;
    continuationsThisPrompt += 1;
    return withContinuation(event, customMessage("verify-final", out));
  });

  pi.on("agent_settled", (event, ctx) => {
    if (aborted) return;
    // An interrupted run must not start a corrective follow-up.
    if (event.aborted) return;
    if (typeof ctx.isIdle === "function" && ctx.isIdle() !== true) return;
    // Headless modes are handled at the boundary above; this path is the
    // interactive one, where a background check plus a follow-up turn is right.
    if (ctx.mode !== "tui") return;
    // Skip the turn that our own correction follow-up started.
    if (userPromptSeq === lastFollowupSeq) return;
    if (groundingDoneSeq === userPromptSeq) return;
    if (recRevisionSeq === userPromptSeq) return;
    if (process.env.VERIFY_FINAL === "0") return;
    const text = lastAssistantText;
    lastAssistantText = "";
    if (shouldSkipText(text)) return;
    const cwd = resolveCwd(ctx);
    const checkSeq = userPromptSeq;
    if (process.env.VERIFY_RECOMMEND !== "0" && recStartedSeq !== userPromptSeq) {
      recStartedSeq = userPromptSeq;
      // No stale-result rule: a late finding is still delivered.
      void runRecommendCheck(cwd, text)
        .then((rec) => {
          if (aborted) return;
          if (REC_FINDING_RE.test(rec.stdout)) {
            const out = rec.stdout.trim();
            if (typeof ctx.isIdle !== "function" || ctx.isIdle()) {
              pi.sendUserMessage(out);
            } else {
              recRevisionSeq = userPromptSeq;
              pi.sendUserMessage(out, { deliverAs: "followUp" });
            }
            return;
          }
          if (rec.stdout.includes(REC_ERROR_PREFIX) || rec.timedOut || rec.errored) {
            try {
              ctx.ui.notify(noticeText(rec), "warning");
            } catch {
              // UI gone (session ended mid-check); the notice is best-effort.
            }
          }
        })
        .catch(() => {});
    }
    groundingDoneSeq = userPromptSeq;
    void Promise.all([
      runCheck(cwd, text),
      shouldCheckDone() ? runDoneCheck(cwd, text) : Promise.resolve(null),
    ])
      .then(([grounding, done]) => {
        if (aborted) return;
        // A new user prompt arrived while the check ran — discard stale result.
        if (checkSeq !== userPromptSeq) return;
        if (userPromptSeq === lastFollowupSeq) return;
        const out = findingsText(grounding, done);
        if (out) {
          lastFollowupSeq = userPromptSeq + 1;
          pi.sendUserMessage(out);
          return;
        }
        // "check could not run", or any other diagnostic, from either check.
        const notices = [grounding, done].flatMap((result) =>
          result &&
          result.stdout.trim() &&
          !result.stdout.includes("verify-final: no findings") &&
          !result.stdout.includes("verify-final: work done")
            ? [noticeText(result)]
            : [],
        );
        if (notices.length === 0) return;
        try {
          ctx.ui.notify(notices.join("\n"), "warning");
        } catch {
          // UI gone (session ended mid-check); the notice is best-effort.
        }
      })
      .catch(() => {});
  });

  pi.on("session_shutdown", () => {
    aborted = true;
    for (const child of activeChildren) {
      try {
        child.kill();
      } catch {
        // Already exited; nothing left to stop at shutdown.
      }
    }
    activeChildren.clear();
  });
}
