import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAgentPrompt,
  codexArgs,
  parseAgentTaskInput,
  sanitizedCodexEnvironment,
} from "../src/agent-harness-adapter.mjs";

const payload = {
  schemaVersion: 1,
  kind: "video-agent-execution",
  project: { slug: "video-1" },
  task: { stage: "content-analysis" },
  context: {
    workspaceRoot: "/workspace/video",
    writePaths: ["videos/video-1/content-analysis.md"],
  },
};

test("builds a bounded Codex invocation for a video Agent stage", () => {
  assert.deepEqual(parseAgentTaskInput(JSON.stringify(payload)), payload);
  assert.deepEqual(codexArgs(payload), [
    "exec",
    "--cd",
    "/workspace/video",
    "--ephemeral",
    "--approve-for-me",
    "-",
  ]);
  const prompt = buildAgentPrompt(payload);
  assert.match(prompt, /不要自行通过人工 Gate/);
  assert.match(prompt, /content-analysis\.md/);
});

test("rejects malformed Agent task input and strips parent Codex markers", () => {
  assert.throws(() => parseAgentTaskInput("{}"), /video-agent-execution/);
  const env = sanitizedCodexEnvironment({
    PATH: "/bin",
    CODEX_SESSION_ID: "parent-session",
    CODEX_SANDBOX: "seatbelt",
  });
  assert.deepEqual(env, { PATH: "/bin" });
});
