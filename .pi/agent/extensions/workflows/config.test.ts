import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_CONCURRENCY,
  DEFAULT_MAX_AGENT_CALLS,
  loadWorkflowsConfig,
  MAX_CONFIGURABLE_AGENT_CALLS,
  MAX_CONFIGURABLE_CONCURRENCY,
  resolveConcurrency,
  resolveMaxAgentCalls,
} from "./config.ts";

test("resolveMaxAgentCalls falls back to the default when nothing is configured", () => {
  assert.equal(resolveMaxAgentCalls({}), DEFAULT_MAX_AGENT_CALLS);
  assert.equal(resolveMaxAgentCalls({}), 128);
});

test("resolveConcurrency falls back to the default when nothing is configured", () => {
  assert.equal(resolveConcurrency({}), DEFAULT_CONCURRENCY);
  assert.equal(resolveConcurrency({}), 8);
});

test("config file value wins over the default", () => {
  assert.equal(resolveMaxAgentCalls({ maxAgentCalls: 256 }), 256);
  assert.equal(resolveConcurrency({ concurrency: 16 }), 16);
});

test("env wins over config file", () => {
  const previous = process.env.PI_WORKFLOWS_MAX_AGENT_CALLS;
  const previousConcurrency = process.env.PI_WORKFLOWS_CONCURRENCY;
  process.env.PI_WORKFLOWS_MAX_AGENT_CALLS = "500";
  process.env.PI_WORKFLOWS_CONCURRENCY = "20";
  try {
    assert.equal(resolveMaxAgentCalls({ maxAgentCalls: 256 }), 500);
    assert.equal(resolveConcurrency({ concurrency: 16 }), 20);
  } finally {
    if (previous === undefined) delete process.env.PI_WORKFLOWS_MAX_AGENT_CALLS;
    else process.env.PI_WORKFLOWS_MAX_AGENT_CALLS = previous;
    if (previousConcurrency === undefined)
      delete process.env.PI_WORKFLOWS_CONCURRENCY;
    else process.env.PI_WORKFLOWS_CONCURRENCY = previousConcurrency;
  }
});

test("invalid values fall back without throwing", () => {
  assert.equal(
    resolveMaxAgentCalls({ maxAgentCalls: 0 }),
    DEFAULT_MAX_AGENT_CALLS,
  );
  assert.equal(
    resolveMaxAgentCalls({ maxAgentCalls: -1 }),
    DEFAULT_MAX_AGENT_CALLS,
  );
  assert.equal(
    resolveMaxAgentCalls({ maxAgentCalls: "abc" as unknown as number }),
    DEFAULT_MAX_AGENT_CALLS,
  );
  assert.equal(resolveMaxAgentCalls({ maxAgentCalls: 1.5 }), 1);
  assert.equal(
    resolveMaxAgentCalls({ maxAgentCalls: Number.NaN }),
    DEFAULT_MAX_AGENT_CALLS,
  );
  assert.equal(resolveConcurrency({ concurrency: 0 }), DEFAULT_CONCURRENCY);
  assert.equal(resolveConcurrency({ concurrency: -3 }), DEFAULT_CONCURRENCY);
  assert.equal(
    resolveConcurrency({ concurrency: "abc" as unknown as number }),
    DEFAULT_CONCURRENCY,
  );
  assert.equal(resolveConcurrency({ concurrency: 2.9 }), 2);
  assert.equal(
    resolveConcurrency({ concurrency: Number.NaN }),
    DEFAULT_CONCURRENCY,
  );
});

test("values above the ceiling are clamped to the ceiling", () => {
  assert.equal(
    resolveMaxAgentCalls({ maxAgentCalls: MAX_CONFIGURABLE_AGENT_CALLS * 10 }),
    MAX_CONFIGURABLE_AGENT_CALLS,
  );
  assert.equal(
    resolveConcurrency({ concurrency: MAX_CONFIGURABLE_CONCURRENCY * 10 }),
    MAX_CONFIGURABLE_CONCURRENCY,
  );
});

test("loadWorkflowsConfig returns an empty object for a missing file", () => {
  assert.deepEqual(loadWorkflowsConfig("/nonexistent/path.json"), {});
});
