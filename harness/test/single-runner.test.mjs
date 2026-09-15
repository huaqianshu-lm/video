import test from "node:test";
import assert from "node:assert/strict";
import { createRemoteRenderExecutor } from "../src/remote-executor.mjs";
import { runSingleStage } from "../src/single-runner.mjs";

test("runs a single complete Render through the shared single-stage entry point", async () => {
  const calls = [];
  const project = {
    config: { slug: "single-runner-video" },
    state: { currentStage: "render", stages: { render: { status: "ready" } } },
  };
  const remoteExecutor = createRemoteRenderExecutor({
    validateInputs() {},
    preflight: async () => {},
    monitor: {
      submit(input) {
        calls.push(input);
        return { id: "single-job", status: "queued", ...input };
      },
    },
  });

  const result = await runSingleStage(project, "render", { remoteExecutor });
  assert.equal(result.deferred, true);
  assert.deepEqual(calls, [{ slug: "single-runner-video", stage: "render" }]);
});

test("rejects Smoke Render from the shared single-stage entry point", async () => {
  let submissions = 0;
  await assert.rejects(
    () => runSingleStage({
      config: { slug: "standalone-smoke-video" },
      state: { currentStage: "smoke-render", stages: { "smoke-render": { status: "ready" } } },
    }, "smoke-render", { remoteExecutor: { run() { submissions += 1; } } }),
    (error) => error.code === "standalone-smoke-render" && /GitHub Actions/.test(error.message),
  );
  assert.equal(submissions, 0);
});
