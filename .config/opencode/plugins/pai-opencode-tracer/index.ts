import type { Plugin } from "@opencode-ai/plugin";
import { createPaiOpenCodeTracer } from "./core";

const plugin: Plugin = createPaiOpenCodeTracer;

export default plugin;
