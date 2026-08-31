import test from "node:test";
import assert from "node:assert/strict";
import { createRemoteRenderExecutor } from "../src/remote-executor.mjs";
import { runSingleStage } from "../src/single-runner.mjs";

test("runs a single remote stage through the shared single-stage entry point", async () => {
  const calls = [];
  const project = {
    config: { slug: "single-runner-video" },
    state: { currentStage: "smoke-render", stages: { "smoke-render": { status: "ready" } } },
  };
  const remoteExecutor = createRemoteRenderExecutor({
    validateInputs() {},
    monitor: {
      submit(input) {
        calls.push(input);
        return { id: "single-job", status: "queued", ...input };
      },
    },
  });

  const result = await runSingleStage(project, "smoke-render", { remoteExecutor });
  assert.equal(result.deferred, true);
  assert.deepEqual(calls, [{ slug: "single-runner-video", stage: "smoke-render" }]);
});
