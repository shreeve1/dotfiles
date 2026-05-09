import { buildRuntimePaths } from "./runtime-paths";

export type AdapterName = "claude" | "codex" | "opencode" | "pi";

export type PaiHarnessConfig = {
  runtimeHome: string;
  adapters: Record<AdapterName, { enabled: boolean }>;
  defaults: {
    retainFullPayloads: false;
    requireRedactionBeforeStorage: true;
    requireExplicitAdapterEnablement: true;
  };
};

const paths = buildRuntimePaths();

export const DEFAULT_CONFIG: PaiHarnessConfig = {
  runtimeHome: paths.home,
  adapters: {
    claude: { enabled: false },
    codex: { enabled: false },
    opencode: { enabled: false },
    pi: { enabled: false },
  },
  defaults: {
    retainFullPayloads: false,
    requireRedactionBeforeStorage: true,
    requireExplicitAdapterEnablement: true,
  },
};
