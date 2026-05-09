#!/usr/bin/env bun
import { buildRuntimePaths } from "../runtime-paths";

const paths = buildRuntimePaths();

console.log(`pai-dream scaffold: trails home ${paths.trailsDir}`);
