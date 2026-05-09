#!/usr/bin/env bun
import { buildRuntimePaths } from "../runtime-paths";

const paths = buildRuntimePaths();

console.log(`pai-memory scaffold: memory home ${paths.memoryDir}`);
