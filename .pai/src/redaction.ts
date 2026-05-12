export type PayloadSurface =
  | "prompt"
  | "tool_input"
  | "tool_output"
  | "command"
  | "env_var"
  | "transcript"
  | "model_response"
  | "memory_content"
  | "memory_provenance";

export type MemorySurface = Extract<PayloadSurface, "memory_content" | "memory_provenance">;

export type SensitivityLabel = "public" | "sensitive" | "secret" | "oversized";

export type RedactionStatus = "clean" | "redacted" | "blocked";

export type RedactionDestination = "sqlite" | "jsonl" | "dream" | "retrieval" | "inference_provider";

export type RedactionFinding = {
  surface: PayloadSurface;
  kind: "secret_pattern" | "denylisted_path" | "payload_limit";
  label: string;
};

export type RedactionOptions = {
  maxPayloadChars?: number;
};

export type PaiEventInput = {
  event_id: string;
  pai_session_id: string;
  harness: "claude" | "codex" | "opencode" | "pi" | "pai";
  event_type: string;
  timestamp: string;
  sequence: number;
  adapter_version: string;
  payloads?: Partial<Record<PayloadSurface, string>>;
};

export type RedactedPaiEvent = Omit<PaiEventInput, "payloads"> & {
  schema_version: "pai.event.v1";
  redaction_destination?: RedactionDestination;
  sensitivity: SensitivityLabel;
  taint_labels: SensitivityLabel[];
  redaction_status: RedactionStatus;
  payload_size_limit: number;
  payload_summary: string;
  findings: RedactionFinding[];
};

const DEFAULT_MAX_PAYLOAD_CHARS = 512;

const SECRET_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "aws_access_key_id", pattern: /\bAKIA[0-9A-Z]{16}\b/g },
  { label: "github_token", pattern: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g },
  { label: "generic_assignment_secret", pattern: /\b(?:api[_-]?key|token|secret|password|credential|cookie)\s*[=:]\s*[^\s,;"']+/gi },
  { label: "private_key_block", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g },
];

const DENYLISTED_PATH_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "env_file", pattern: /(?:^|[\s"'=:])(?:\.\/)?\.env(?:\.[A-Za-z0-9_-]+)?\b/g },
  { label: "ssh_secret", pattern: /(?:^|[\s"'=:])(?:~\/)?\.ssh\/(?:config|id_[A-Za-z0-9_-]+|known_hosts)\b/g },
  { label: "private_key_file", pattern: /(?:id_rsa|id_dsa|id_ecdsa|id_ed25519|\.pem|\.key)\b/g },
  { label: "codex_auth", pattern: /(?:^|[\s"'=:])(?:~\/|\.\/|[^\s"']*\/)?\.codex\/auth\.json\b/g },
  { label: "pi_agent_auth", pattern: /(?:^|[\s"'=:])(?:~\/|\.\/|[^\s"']*\/)?\.pi\/agent\/auth\.json\b/g },
  { label: "aws_credentials", pattern: /(?:^|[\s"'=:])(?:~\/)?\.aws\/(?:credentials|config)\b/g },
  { label: "netrc_credentials", pattern: /(?:^|[\s"'=:])(?:~\/)?\.netrc\b/g },
];

export function redactText(surface: PayloadSurface, value: string, options: RedactionOptions = {}) {
  const maxPayloadChars = options.maxPayloadChars ?? DEFAULT_MAX_PAYLOAD_CHARS;
  const findings: RedactionFinding[] = [];
  let redacted = value;

  for (const { label, pattern } of SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, () => {
      findings.push({ surface, kind: "secret_pattern", label });
      return `[REDACTED:${label}]`;
    });
  }

  for (const { label, pattern } of DENYLISTED_PATH_PATTERNS) {
    redacted = redacted.replace(pattern, (match) => {
      findings.push({ surface, kind: "denylisted_path", label });
      const prefix = match.match(/^[\s"'=:]+/)?.[0] ?? "";
      return `${prefix}[REDACTED_PATH:${label}]`;
    });
  }

  if (redacted.length > maxPayloadChars) {
    findings.push({ surface, kind: "payload_limit", label: `max_${maxPayloadChars}_chars` });
    redacted = `${redacted.slice(0, maxPayloadChars)}[TRUNCATED:${redacted.length - maxPayloadChars}]`;
  }

  return { redacted, findings };
}

export function redactEvent(input: PaiEventInput, options: RedactionOptions = {}): RedactedPaiEvent {
  const maxPayloadChars = options.maxPayloadChars ?? DEFAULT_MAX_PAYLOAD_CHARS;
  const findings: RedactionFinding[] = [];
  const summaries: string[] = [];

  for (const [surface, value] of Object.entries(input.payloads ?? {}) as Array<[PayloadSurface, string]>) {
    const result = redactText(surface, value, { maxPayloadChars });
    findings.push(...result.findings);
    summaries.push(`${surface}: ${result.redacted}`);
  }

  const hasOversized = findings.some((finding) => finding.kind === "payload_limit");
  const hasSecrets = findings.some((finding) => finding.kind !== "payload_limit");
  const taintLabels: SensitivityLabel[] = [];

  if (hasSecrets) taintLabels.push("secret");
  if (hasOversized) taintLabels.push("oversized");
  if (!hasSecrets && !hasOversized) taintLabels.push("public");

  return {
    schema_version: "pai.event.v1",
    event_id: input.event_id,
    pai_session_id: input.pai_session_id,
    harness: input.harness,
    event_type: input.event_type,
    timestamp: input.timestamp,
    sequence: input.sequence,
    adapter_version: input.adapter_version,
    sensitivity: taintLabels.includes("secret") ? "secret" : taintLabels[0],
    taint_labels: taintLabels,
    redaction_status: findings.length > 0 ? "redacted" : "clean",
    payload_size_limit: maxPayloadChars,
    payload_summary: summaries.join("\n"),
    findings,
  };
}

export function prepareEventForDestination(
  destination: RedactionDestination,
  input: PaiEventInput,
  options: RedactionOptions = {},
): RedactedPaiEvent {
  return {
    ...redactEvent(input, options),
    redaction_destination: destination,
  };
}

export type PortableMemoryRedactionOptions = {
  maxPortableChars?: number;
};

export type PortableMemoryRedactionResult = {
  redacted: string;
  findings: RedactionFinding[];
};

const DEFAULT_PORTABLE_MAX_CHARS = 16384;

export class PortableMemoryOversizeError extends Error {
  readonly surface: MemorySurface;
  readonly length: number;
  readonly limit: number;
  constructor(surface: MemorySurface, length: number, limit: number) {
    super(
      `Portable memory ${surface} length ${length} exceeds limit ${limit}; refusing to truncate. Shrink the memory or raise --max-portable-chars after verifying it does not contain secrets.`,
    );
    this.name = "PortableMemoryOversizeError";
    this.surface = surface;
    this.length = length;
    this.limit = limit;
  }
}

export function redactPortableMemoryText(
  surface: MemorySurface,
  value: string,
  options: PortableMemoryRedactionOptions = {},
): PortableMemoryRedactionResult {
  const limit = options.maxPortableChars ?? DEFAULT_PORTABLE_MAX_CHARS;
  const findings: RedactionFinding[] = [];
  let redacted = value;

  for (const { label, pattern } of SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, () => {
      findings.push({ surface, kind: "secret_pattern", label });
      return `[REDACTED:${label}]`;
    });
  }

  for (const { label, pattern } of DENYLISTED_PATH_PATTERNS) {
    redacted = redacted.replace(pattern, (match) => {
      findings.push({ surface, kind: "denylisted_path", label });
      const prefix = match.match(/^[\s"'=:]+/)?.[0] ?? "";
      return `${prefix}[REDACTED_PATH:${label}]`;
    });
  }

  if (redacted.length > limit) {
    throw new PortableMemoryOversizeError(surface, redacted.length, limit);
  }

  return { redacted, findings };
}

export const PORTABLE_REDACTION_DEFAULT_MAX_CHARS = DEFAULT_PORTABLE_MAX_CHARS;

const SECRET_KEY_PATTERN = /(?:api[_-]?key|token|secret|password|passwd|credential|cookie|authorization|bearer|session|private[_-]?key)/i;

export type StructuralRedactionResult = {
  value: unknown;
  findings: RedactionFinding[];
};

export function redactPortableMemoryProvenance(
  provenance: Record<string, unknown>,
  options: PortableMemoryRedactionOptions = {},
): StructuralRedactionResult {
  const limit = options.maxPortableChars ?? DEFAULT_PORTABLE_MAX_CHARS;
  const findings: RedactionFinding[] = [];

  const cleaned = redactStructural(provenance, findings, false);
  const serialized = JSON.stringify(cleaned);
  if (serialized.length > limit) {
    throw new PortableMemoryOversizeError("memory_provenance", serialized.length, limit);
  }

  return { value: cleaned, findings };
}

function redactStructural(value: unknown, findings: RedactionFinding[], underSecretKey: boolean): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === "string") {
    if (underSecretKey) {
      findings.push({ surface: "memory_provenance", kind: "secret_pattern", label: "secret_key_value" });
      return "[REDACTED:secret_key_value]";
    }
    const { redacted, findings: textFindings } = redactPortableMemoryStringForProvenance(value);
    findings.push(...textFindings);
    return redacted;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    if (underSecretKey) {
      findings.push({ surface: "memory_provenance", kind: "secret_pattern", label: "secret_key_value" });
      return "[REDACTED:secret_key_value]";
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactStructural(entry, findings, underSecretKey));
  }

  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const childUnderSecret = underSecretKey || SECRET_KEY_PATTERN.test(key);
      out[key] = redactStructural(child, findings, childUnderSecret);
    }
    return out;
  }

  return value;
}

function redactPortableMemoryStringForProvenance(value: string): { redacted: string; findings: RedactionFinding[] } {
  const findings: RedactionFinding[] = [];
  let redacted = value;

  for (const { label, pattern } of SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, () => {
      findings.push({ surface: "memory_provenance", kind: "secret_pattern", label });
      return `[REDACTED:${label}]`;
    });
  }

  for (const { label, pattern } of DENYLISTED_PATH_PATTERNS) {
    redacted = redacted.replace(pattern, (match) => {
      findings.push({ surface: "memory_provenance", kind: "denylisted_path", label });
      const prefix = match.match(/^[\s"'=:]+/)?.[0] ?? "";
      return `${prefix}[REDACTED_PATH:${label}]`;
    });
  }

  return { redacted, findings };
}

export function serializeRedactedJsonl(event: RedactedPaiEvent): string {
  if (event.redaction_status !== "clean" && event.redaction_status !== "redacted") {
    throw new Error(`Cannot serialize event with redaction_status=${event.redaction_status}`);
  }

  return `${JSON.stringify(event)}\n`;
}
