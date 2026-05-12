import { homedir } from "node:os";
import { join } from "node:path";

export type RuntimePaths = {
  home: string;
  eventsDb: string;
  trailsDir: string;
  transcriptsDir: string;
  memoryDir: string;
  authDir: string;
  stateDir: string;
  logsDir: string;
};

export function defaultRuntimeHome(): string {
  return process.env.PAI_RUNTIME_HOME || join(homedir(), ".pai");
}

export function buildRuntimePaths(runtimeHome = defaultRuntimeHome()): RuntimePaths {
  return {
    home: runtimeHome,
    eventsDb: join(runtimeHome, "events.sqlite"),
    trailsDir: join(runtimeHome, "trails"),
    transcriptsDir: join(runtimeHome, "transcripts"),
    memoryDir: join(runtimeHome, "memory"),
    authDir: join(runtimeHome, "auth"),
    stateDir: join(runtimeHome, "state"),
    logsDir: join(runtimeHome, "logs"),
  };
}
