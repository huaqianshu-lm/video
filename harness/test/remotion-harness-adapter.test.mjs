import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRemotionAgentPrompt,
  codexArgs,
  parseRemotionTaskInput,
  sanitizedCodexEnvironment,
} from "../src/remotion-harness-adapter.mjs";

const payload = {
  schemaVersion: 1,
  kind: "video-remotion-execution",
  taskId: "task-1",
  videoId: "video-1",
  workspaceRoot: "/workspace/video",
  outputArtifacts: ["src/videos/video-1/video.config.ts"],
  commands: ["npm run check"],
};

test("parses the Remotion task and builds a bounded Codex invocation", () => {
  assert.deepEqual(parseRemotionTaskInput(JSON.stringify(payload)), payload);
  assert.deepEqual(codexArgs(payload), [
    "exec",
    "--cd",
    "/workspace/video",
    "--ephemeral",
    "--approve-for-me",
    "-",
  ]);
  const prompt = buildRemotionAgentPrompt(payload);
  assert.match(prompt, /不得渲染视频/);
  assert.match(prompt, /src\/videos\/video-1\/video\.config\.ts/);
});

test("rejects invalid tasks and removes parent Codex session markers", () => {
  assert.throws(() => parseRemotionTaskInput("{}"), /video-remotion-execution/);
  const env = sanitizedCodexEnvironment({
    PATH: "/bin",
    CODEX_SESSION_ID: "parent-session",
    CODEX_SANDBOX: "seatbelt",
  });
  assert.deepEqual(env, { PATH: "/bin" });
});
