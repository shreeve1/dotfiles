import { describe, expect, test } from "bun:test";
import { redactEvent, serializeRedactedJsonl, type PaiEventInput, type PayloadSurface } from "../src/redaction";

const baseEvent = (payloads: PaiEventInput["payloads"]): PaiEventInput => ({
  event_id: "evt_001",
  pai_session_id: "session_001",
  harness: "pai",
  event_type: "test.event",
  timestamp: "2026-05-09T00:00:00.000Z",
  sequence: 1,
  adapter_version: "test",
  payloads,
});

describe("central redaction pipeline", () => {
  test("attaches redaction metadata to clean events", () => {
    const event = redactEvent(baseEvent({ prompt: "summarize the public readme" }));

    expect(event).not.toHaveProperty("payloads");
    expect(event.redaction_status).toBe("clean");
    expect(event.taint_labels).toEqual(["public"]);
    expect(event.payload_size_limit).toBe(512);
    expect(event.payload_summary).toContain("public readme");
  });

  test("redacts hard denylisted credential paths", () => {
    const event = redactEvent(
      baseEvent({
        command: "cat .env.local ~/.ssh/id_ed25519 ~/.codex/auth.json ~/.pi/agent/auth.json ~/.aws/credentials ~/.netrc secret.pem",
      }),
    );

    expect(event.redaction_status).toBe("redacted");
    expect(event.taint_labels).toContain("secret");
    expect(event.payload_summary).not.toContain(".env.local");
    expect(event.payload_summary).not.toContain("id_ed25519");
    expect(event.payload_summary).not.toContain(".codex/auth.json");
    expect(event.payload_summary).not.toContain(".pi/agent/auth.json");
    expect(event.payload_summary).not.toContain(".aws/credentials");
    expect(event.payload_summary).not.toContain(".netrc");
    expect(event.payload_summary).not.toContain("secret.pem");
    const labels = event.findings.map((finding) => finding.label);
    expect(labels).toContain("env_file");
    expect(labels).toContain("private_key_file");
    expect(labels).toContain("ssh_secret");
    expect(labels).toContain("codex_auth");
    expect(labels).toContain("pi_agent_auth");
    expect(labels).toContain("aws_credentials");
    expect(labels).toContain("netrc_credentials");
  });

  test("covers token and credential patterns across every payload surface", () => {
    const githubToken = ["ghp", "abcdefghijklmnopqrstuvwxyz123456"].join("_");
    const surfaces: PayloadSurface[] = [
      "prompt",
      "tool_input",
      "tool_output",
      "command",
      "env_var",
      "transcript",
      "model_response",
    ];
    const payloads = Object.fromEntries(
      surfaces.map((surface) => [surface, `${surface} token=${githubToken} password=not-a-real-password`]),
    ) as Record<PayloadSurface, string>;

    const event = redactEvent(baseEvent(payloads));

    expect(event.redaction_status).toBe("redacted");
    expect(event.payload_summary).not.toContain(githubToken);
    expect(event.payload_summary).not.toContain("not-a-real-password");
    for (const surface of surfaces) {
      expect(event.findings.some((finding) => finding.surface === surface && finding.kind === "secret_pattern")).toBe(true);
    }
  });

  test("applies payload size limits and taint labels", () => {
    const event = redactEvent(baseEvent({ transcript: "a".repeat(32) }), { maxPayloadChars: 8 });

    expect(event.redaction_status).toBe("redacted");
    expect(event.taint_labels).toContain("oversized");
    expect(event.payload_size_limit).toBe(8);
    expect(event.payload_summary).toContain("[TRUNCATED:24]");
  });

  test("JSONL serialization never receives unredacted payload fields or secret content", () => {
    const event = redactEvent(baseEvent({ tool_output: "api_key=plain-secret-value from .env" }));
    const jsonl = serializeRedactedJsonl(event);

    expect(jsonl).not.toContain("payloads");
    expect(jsonl).not.toContain("plain-secret-value");
    expect(jsonl).not.toContain(".env");
    expect(jsonl).toContain("[REDACTED:generic_assignment_secret]");
    expect(jsonl).toContain("[REDACTED_PATH:env_file]");
  });
});
