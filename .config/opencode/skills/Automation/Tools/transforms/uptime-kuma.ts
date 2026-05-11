/**
 * uptime-kuma.ts — Named transform module for Uptime Kuma webhook payloads
 *
 * Exports classify(payload) — returns { monitor, status, severity, url, timestamp, details }
 * Uses References/critical-hosts.json for host classification
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";

const MAX_FIELD_LENGTH = 1024;

// Load critical hosts configuration
const REFERENCES_DIR = join(
  dirname(new URL(import.meta.url).pathname),
  "..",
  "..",
  "References"
);

interface CriticalHostsConfig {
  hosts: string[];
  connectionErrors: string[];
}

function loadCriticalHosts(): CriticalHostsConfig {
  try {
    const raw = readFileSync(
      join(REFERENCES_DIR, "critical-hosts.json"),
      "utf-8"
    );
    return JSON.parse(raw);
  } catch {
    return { hosts: [], connectionErrors: [] };
  }
}

// Cache at module load — avoids disk read per classify() call
const cachedConfig = loadCriticalHosts();

function capField(value: string, maxLen: number = MAX_FIELD_LENGTH): string {
  return value.length > maxLen ? value.substring(0, maxLen) : value;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Payload = Record<string, any>;

export interface TransformResult {
  monitor: string;
  status: string;
  severity: string;
  url: string;
  timestamp: string;
  details: string;
}

/**
 * Classify an Uptime Kuma webhook payload.
 *
 * Extraction logic:
 * - Monitor name: payload.monitor?.name || payload.monitorJson?.name || payload.monitor || 'unknown'
 * - Heartbeat: payload.heartbeat || payload.heartbeatJson
 * - Status: heartbeat.status === 1 or 'UP' or true => UP, else DOWN
 * - Connection errors in heartbeat.msg override to DOWN
 * - Severity: DOWN + critical host => CRITICAL, DOWN + non-critical => WARNING, UP => INFO
 * - Timestamp: heartbeat.time || heartbeat.localDateTime || new Date().toISOString()
 */
export function classify(payload: unknown): TransformResult {
  const p = (payload || {}) as Payload;
  const config = cachedConfig;

  // --- Extract monitor name ---
  const monitor =
    p.monitor?.name ||
    p.monitorJson?.name ||
    (typeof p.monitor === "string" ? p.monitor : null) ||
    "unknown";

  // --- Extract heartbeat ---
  const heartbeat: Payload =
    p.heartbeat || p.heartbeatJson || {};

  // --- Determine status ---
  let status = "DOWN";
  const heartbeatStatus = heartbeat.status ?? p.status;
  if (
    heartbeatStatus === 1 ||
    heartbeatStatus === "UP" ||
    heartbeatStatus === true
  ) {
    status = "UP";
  }

  // --- Check connection errors ---
  const msg: string = p.msg || heartbeat.msg || heartbeat.message || "";
  const connectionErrors: string[] = config.connectionErrors || [
    "EHOSTUNREACH",
    "ECONNREFUSED",
    "ENOTFOUND",
    "ETIMEDOUT",
    "ECONNRESET",
    "Host is down",
  ];
  for (const err of connectionErrors) {
    if (msg.includes(err)) {
      status = "DOWN";
      break;
    }
  }

  // --- Classify severity ---
  let severity = "INFO";
  if (status === "DOWN") {
    const isCritical = config.hosts.some(
      (host) =>
        monitor.toLowerCase().includes(host.toLowerCase())
    );
    severity = isCritical ? "CRITICAL" : "WARNING";
  }

  // --- Extract URL ---
  const url: string =
    p.url ||
    heartbeat.url ||
    p.monitor?.url ||
    p.monitorJson?.url ||
    "";

  // --- Extract timestamp ---
  const timestamp: string =
    heartbeat.time ||
    heartbeat.localDateTime ||
    new Date().toISOString();

  // --- Build details ---
  const details = capField(
    msg || heartbeat.statusMessage || `Monitor ${monitor} is ${status}`
  );

  return {
    monitor: capField(monitor),
    status,
    severity,
    url: capField(url),
    timestamp: capField(timestamp),
    details,
  };
}
