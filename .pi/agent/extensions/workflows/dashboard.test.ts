import test from "node:test";
import assert from "node:assert/strict";
import { canResumeRun, replayedSummary } from "./dashboard.ts";
import {
  phaseGroups,
  type AgentRecord,
  type WorkflowDetails,
} from "./model.ts";

function makeAgent(index: number): AgentRecord {
  return {
    index,
    label: `agent-${index}`,
    state: "done",
    startedAt: 0,
    preview: "",
    usage: {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
      cost: 0,
      turns: 0,
    },
    transcript: [],
  };
}

function makeDetails(
  overrides: Partial<WorkflowDetails> = {},
): WorkflowDetails {
  return {
    runId: "wf_abc123def456",
    background: false,
    status: "completed",
    startedAt: 0,
    phases: [],
    agents: [makeAgent(1), makeAgent(2)],
    ...overrides,
  };
}

test("replayedSummary returns undefined for a plain fresh run with no resume fields", () => {
  const details = makeDetails();
  assert.equal(replayedSummary(details), undefined);
});

test("replayedSummary returns replayed 0/2 when resumedFrom is set and replayedCount is absent", () => {
  const details = makeDetails({ resumedFrom: "wf_prior1234567" });
  assert.equal(replayedSummary(details), "replayed 0/2");
});

test("replayedSummary returns replayed 3/7 for replayedCount: 3 and 7 agents", () => {
  const agents = Array.from({ length: 7 }, (_, i) => makeAgent(i + 1));
  const details = makeDetails({
    resumedFrom: "wf_prior1234567",
    replayedCount: 3,
    agents,
  });
  assert.equal(replayedSummary(details), "replayed 3/7");
});

test("replayedSummary returns replayed 0/N when replayedCount is explicitly 0", () => {
  const details = makeDetails({
    resumedFrom: "wf_prior1234567",
    replayedCount: 0,
  });
  assert.equal(replayedSummary(details), "replayed 0/2");
});

test("replayedSummary appends checkpoint count when checkpoints were replayed", () => {
  const details = makeDetails({
    resumedFrom: "wf_prior1234567",
    replayedCount: 2,
    checkpointReplayedCount: 1,
  });
  assert.equal(replayedSummary(details), "replayed 2/2 (+1 checkpoint)");
});

test("replayedSummary shows checkpoints even with zero agent replays", () => {
  const details = makeDetails({
    resumedFrom: "wf_prior1234567",
    agents: [],
    checkpointReplayedCount: 3,
  });
  assert.equal(replayedSummary(details), "replayed 0/0 (+3 checkpoints)");
});

test("canResumeRun is true for failed", () => {
  assert.equal(canResumeRun(makeDetails({ status: "failed" })), true);
});

test("canResumeRun is true for aborted", () => {
  assert.equal(canResumeRun(makeDetails({ status: "aborted" })), true);
});

test("canResumeRun is false for completed", () => {
  assert.equal(canResumeRun(makeDetails({ status: "completed" })), false);
});

test("canResumeRun is false for running", () => {
  assert.equal(canResumeRun(makeDetails({ status: "running" })), false);
});

test("phaseGroups sorts agents within each phase by AgentRecord.index", () => {
  // Interleave replayed (pushed immediately) and executed (pushed after
  // the semaphore) records under two phases. phaseGroups must group by
  // phase and order within each phase by index, not by insertion order.
  const agents: AgentRecord[] = [
    {
      index: 2,
      label: "replayed-2",
      state: "done",
      startedAt: 0,
      preview: "",
      usage: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
        cost: 0,
        turns: 0,
      },
      transcript: [],
      replayed: true,
      phase: "Scan",
    },
    {
      index: 1,
      label: "executed-1",
      state: "done",
      startedAt: 0,
      preview: "",
      usage: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
        cost: 0,
        turns: 0,
      },
      transcript: [],
      phase: "Report",
    },
    {
      index: 4,
      label: "replayed-4",
      state: "done",
      startedAt: 0,
      preview: "",
      usage: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
        cost: 0,
        turns: 0,
      },
      transcript: [],
      replayed: true,
      phase: "Report",
    },
    {
      index: 3,
      label: "executed-3",
      state: "done",
      startedAt: 0,
      preview: "",
      usage: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
        cost: 0,
        turns: 0,
      },
      transcript: [],
      phase: "Report",
    },
  ];
  const details = makeDetails({
    phases: [{ title: "Scan" }, { title: "Report" }],
    agents,
  });
  const groups = phaseGroups(details);
  assert.deepEqual(
    groups.map((group) => group.title),
    ["Scan", "Report"],
  );
  assert.deepEqual(
    groups[0].agents.map((agent) => agent.index),
    [2],
  );
  assert.deepEqual(
    groups[1].agents.map((agent) => agent.index),
    [1, 3, 4],
  );
});
