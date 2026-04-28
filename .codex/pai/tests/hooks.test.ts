import { describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { dotfilesPath } from "../lib/paths";
import { classifyPrompt } from "../lib/algorithm-state";

async function runHook(path: string, payload: unknown) {
  const proc = Bun.spawn(["bun", path], {
    cwd: dotfilesPath(),
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });
  proc.stdin.write(JSON.stringify(payload));
  proc.stdin.end();
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { stdout, stderr, exitCode };
}

describe("PAI Codex hooks", () => {
  test("security hook allows trusted read-only Bash", async () => {
    const result = await runHook(".codex/pai/hooks/security-validator.ts", {
      hook_event_name: "PreToolUse",
      tool_name: "Bash",
      tool_input: { command: "ls .codex" },
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("");
  });

  test("security hook denies destructive Bash", async () => {
    const result = await runHook(".codex/pai/hooks/security-validator.ts", {
      hook_event_name: "PreToolUse",
      tool_name: "Bash",
      tool_input: { command: "rm -rf /" },
    });
    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.hookSpecificOutput.permissionDecision).toBe("deny");
    expect(parsed.decision).toBe("block");
  });

  test("security hook handles apply_patch payloads", async () => {
    const result = await runHook(".codex/pai/hooks/security-validator.ts", {
      hook_event_name: "PreToolUse",
      tool_name: "apply_patch",
      tool_input: { command: "*** Begin Patch\n*** Update File: README.md\n@@\n test\n*** End Patch" },
    });
    expect(result.exitCode).toBe(0);
  });

  test("context hook emits SessionStart PAI operating context", async () => {
    const result = await runHook(".codex/pai/hooks/load-context.ts", {
      hook_event_name: "SessionStart",
      source: "startup",
    });
    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.hookSpecificOutput.hookEventName).toBe("SessionStart");
    expect(parsed.hookSpecificOutput.additionalContext).toContain("PAI operating loop");
    expect(parsed.hookSpecificOutput.additionalContext).toContain("artifacts/specs/<slug>/PRD.md");
  });

  test("prompt classifier covers substantive, artifact, and trivial edges", () => {
    for (const prompt of ["status", "help", "what directory should i try this in?"]) {
      const classification = classifyPrompt(prompt);
      expect(classification.classification).toBe("trivial");
      expect(classification.requiresPrd).toBe(false);
    }

    const fix = classifyPrompt("fix the PAI Algorithm enforcement gap");
    expect(fix.classification).toBe("substantive");
    expect(fix.requiresPrd).toBe(true);

    const artifact = classifyPrompt("continue from artifacts/specs/pai-algorithm-enforcement/PRD.md");
    expect(artifact.classification).toBe("substantive");
    expect(artifact.suppliedArtifact).toBe("artifacts/specs/pai-algorithm-enforcement/PRD.md");
  });

  test("stop hook emits valid JSON", async () => {
    const result = await runHook(".codex/pai/hooks/session-capture.ts", {
      hook_event_name: "Stop",
      session_id: "test-session",
    });
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout).continue).toBe(true);
  });

  test("stop hook blocks active substantive sessions missing finalization signals", async () => {
    const sessionId = "test-algorithm-stop-missing";
    await runHook(".codex/pai/hooks/session-capture.ts", {
      hook_event_name: "UserPromptSubmit",
      session_id: sessionId,
      turn_id: "turn-prompt",
      prompt: "fix the PAI Algorithm finalization enforcement gap",
    });

    const result = await runHook(".codex/pai/hooks/session-capture.ts", {
      hook_event_name: "Stop",
      session_id: sessionId,
      turn_id: "turn-stop",
      last_assistant_message: "Implemented the change.",
    });
    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.continue).toBe(false);
    expect(parsed.stopReason).toContain("PAI Algorithm finalization required");
    expect(parsed.stopReason).toContain("verification");
    expect(parsed.stopReason).toContain("review");
    expect(parsed.stopReason).toContain("learning");
    expect(parsed.decision).toBeUndefined();
    expect(parsed.reason).toBeUndefined();
    expect(parsed.hookSpecificOutput).toBeUndefined();
  });

  test("stop hook allows active substantive sessions with all finalization signals", async () => {
    const sessionId = "test-algorithm-stop-complete";
    await runHook(".codex/pai/hooks/session-capture.ts", {
      hook_event_name: "UserPromptSubmit",
      session_id: sessionId,
      turn_id: "turn-prompt",
      prompt: "implement a PAI Algorithm finalization check",
    });

    const result = await runHook(".codex/pai/hooks/session-capture.ts", {
      hook_event_name: "Stop",
      session_id: sessionId,
      turn_id: "turn-stop",
      last_assistant_message:
        "Verified tests passed. Review against acceptance criteria found no gaps. Learn: no durable memory note was warranted.",
    });
    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.continue).toBe(true);
    expect(parsed.decision).toBeUndefined();
    expect(parsed.hookSpecificOutput).toBeUndefined();
  });

  test("stop hook stays quiet for unrelated or re-entrant sessions", async () => {
    await runHook(".codex/pai/hooks/session-capture.ts", {
      hook_event_name: "UserPromptSubmit",
      session_id: "test-algorithm-stop-owner",
      turn_id: "turn-prompt",
      prompt: "implement a PAI Algorithm finalization check",
    });

    const unrelated = await runHook(".codex/pai/hooks/session-capture.ts", {
      hook_event_name: "Stop",
      session_id: "test-algorithm-stop-other",
      turn_id: "turn-stop",
      last_assistant_message: "Implemented the change.",
    });
    expect(JSON.parse(unrelated.stdout).continue).toBe(true);

    const reentrant = await runHook(".codex/pai/hooks/session-capture.ts", {
      hook_event_name: "Stop",
      session_id: "test-algorithm-stop-owner",
      turn_id: "turn-stop",
      stop_hook_active: true,
      last_assistant_message: "Implemented the change.",
    });
    expect(JSON.parse(reentrant.stdout).continue).toBe(true);
  });

  test("substantive prompts inject PAI Algorithm enforcement context", async () => {
    const result = await runHook(".codex/pai/hooks/session-capture.ts", {
      hook_event_name: "UserPromptSubmit",
      session_id: "test-algorithm-enforcement",
      turn_id: "turn-substantive",
      prompt: "proceed with pai fix",
    });
    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.hookSpecificOutput.hookEventName).toBe("UserPromptSubmit");
    expect(parsed.hookSpecificOutput.additionalContext).toContain("PAI Algorithm enforcement");
    expect(parsed.hookSpecificOutput.additionalContext).toContain("Before Build/Execute");
    expect(parsed.hookSpecificOutput.additionalContext).toContain("artifacts/specs/");
    expect(parsed.hookSpecificOutput.additionalContext).toContain("Before the final response");
    expect(parsed.hookSpecificOutput.additionalContext).toContain("During Learn");
  });

  test("trivial prompts do not inject enforcement context", async () => {
    const result = await runHook(".codex/pai/hooks/session-capture.ts", {
      hook_event_name: "UserPromptSubmit",
      session_id: "test-algorithm-trivial",
      turn_id: "turn-trivial",
      prompt: "continue",
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("");
  });

  test("post-edit hook reminds when substantive work edits before PRD or plan", async () => {
    const sessionId = "test-algorithm-post-edit";
    const prompt = await runHook(".codex/pai/hooks/session-capture.ts", {
      hook_event_name: "UserPromptSubmit",
      session_id: sessionId,
      turn_id: "turn-prompt",
      prompt: "fix the PAI Algorithm enforcement gap",
    });
    expect(prompt.exitCode).toBe(0);

    const result = await runHook(".codex/pai/hooks/work-sync.ts", {
      hook_event_name: "PostToolUse",
      session_id: sessionId,
      turn_id: "turn-edit",
      tool_name: "apply_patch",
      tool_input: { command: "*** Begin Patch\n*** Update File: .codex/pai/hooks/session-capture.ts\n@@\n test\n*** End Patch" },
    });
    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.hookSpecificOutput.hookEventName).toBe("PostToolUse");
    expect(parsed.hookSpecificOutput.additionalContext).toContain("PAI Algorithm correction");
    expect(parsed.hookSpecificOutput.additionalContext).toContain("did not touch a PRD or plan");
  });

  test("post-edit hook stays quiet when the planning artifact is touched", async () => {
    const sessionId = "test-algorithm-plan-edit";
    await runHook(".codex/pai/hooks/session-capture.ts", {
      hook_event_name: "UserPromptSubmit",
      session_id: sessionId,
      turn_id: "turn-prompt",
      prompt: "implement a PAI Algorithm enforcement fix",
    });

    const result = await runHook(".codex/pai/hooks/work-sync.ts", {
      hook_event_name: "PostToolUse",
      session_id: sessionId,
      turn_id: "turn-plan",
      tool_name: "apply_patch",
      tool_input: { command: "*** Begin Patch\n*** Update File: artifacts/specs/pai-algorithm-enforcement/PRD.md\n@@\n test\n*** End Patch" },
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("");
  });

  test("configured hook commands point at existing scripts", () => {
    const hooksPath = dotfilesPath(".codex", "hooks.json");
    if (!existsSync(hooksPath)) return;
    const config = JSON.parse(readFileSync(hooksPath, "utf8"));
    const commands = Object.values(config.hooks ?? {})
      .flatMap((groups: any) => groups)
      .flatMap((group: any) => group.hooks ?? [])
      .map((hook: any) => hook.command)
      .filter((command: string) => command?.includes(".codex/pai/hooks/"));
    for (const command of commands) {
      expect(command).not.toContain("git rev-parse");
      const match = command.match(/\.codex\/pai\/hooks\/([a-z-]+)\.ts/);
      expect(match).toBeTruthy();
      expect(existsSync(dotfilesPath(".codex", "pai", "hooks", `${match![1]}.ts`))).toBe(true);
    }
  });

  test("configured hook commands execute through hooks JSON strings", async () => {
    const hooksPath = dotfilesPath(".codex", "hooks.json");
    if (!existsSync(hooksPath)) return;
    const config = JSON.parse(readFileSync(hooksPath, "utf8"));
    const payloads: Record<string, unknown> = {
      SessionStart: { hook_event_name: "SessionStart", source: "startup" },
      PreToolUse: { hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: "ls .codex" } },
      PermissionRequest: { hook_event_name: "PermissionRequest", tool_name: "Bash", tool_input: { command: "ls .codex" } },
      UserPromptSubmit: { hook_event_name: "UserPromptSubmit", prompt: "continue" },
      Stop: { hook_event_name: "Stop", session_id: "test-session" },
      PostToolUse: { hook_event_name: "PostToolUse", tool_name: "apply_patch", tool_input: { command: "plan.md" } },
    };

    for (const [event, groups] of Object.entries(config.hooks ?? {})) {
      for (const group of groups as any[]) {
        for (const hook of group.hooks ?? []) {
          if (!String(hook.command).includes(".codex/pai/hooks/")) continue;
          const proc = Bun.spawn(["bash", "-lc", hook.command], {
            cwd: dotfilesPath(),
            stdin: "pipe",
            stdout: "pipe",
            stderr: "pipe",
          });
          proc.stdin.write(JSON.stringify(payloads[event] ?? { hook_event_name: event }));
          proc.stdin.end();
          const stdout = await new Response(proc.stdout).text();
          const stderr = await new Response(proc.stderr).text();
          const exitCode = await proc.exited;
          expect({ event, command: hook.command, stderr, exitCode }).toMatchObject({ exitCode: 0 });
          if (stdout.trim()) expect(() => JSON.parse(stdout)).not.toThrow();
        }
      }
    }
  });

  test("configured PAI hook commands execute outside the dotfiles checkout", async () => {
    const hooksPath = dotfilesPath(".codex", "hooks.json");
    if (!existsSync(hooksPath)) return;
    const config = JSON.parse(readFileSync(hooksPath, "utf8"));
    const command = Object.values(config.hooks ?? {})
      .flatMap((groups: any) => groups)
      .flatMap((group: any) => group.hooks ?? [])
      .map((hook: any) => hook.command)
      .find((value: string) => value?.includes(".codex/pai/hooks/security-validator.ts"));
    expect(command).toBeTruthy();

    const cwd = mkdtempSync(join(tmpdir(), "pai-hook-cwd-"));
    Bun.spawnSync(["git", "init"], { cwd, stdout: "pipe", stderr: "pipe" });
    try {
      const proc = Bun.spawn(["bash", "-lc", command], {
        cwd,
        stdin: "pipe",
        stdout: "pipe",
        stderr: "pipe",
      });
      proc.stdin.write(JSON.stringify({ hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: "ls" } }));
      proc.stdin.end();
      const [stdout, stderr, exitCode] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
      ]);
      expect({ stdout, stderr, exitCode }).toMatchObject({ exitCode: 0 });
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
