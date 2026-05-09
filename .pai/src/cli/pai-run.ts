#!/usr/bin/env bun
import { buildRuntimePaths } from "../runtime-paths";

const paths = buildRuntimePaths();

console.log(`pai-run scaffold: runtime home ${paths.home}`);
