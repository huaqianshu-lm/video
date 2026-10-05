import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { fileURLToPath } from "node:url";
import { createCliTtsExecutor } from "../src/cli.mjs";
import { commandConfigFromEnv } from "../src/command-executor.mjs";

const keys = ["COMMAND", "ARGS", "CWD"].map((key) => `HARNESS_TTS_EXECUTOR_${key}`);

function environment(t, values = {}) {
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  for (const key of keys) {
    if (values[key] === undefined) delete process.env[key];
    else process.env[key] = values[key];
  }
  t.after(() => {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  });
}

async function captureExecution() {
  let invocation;
  let payload;
  const executor = createCliTtsExecutor({
    spawnImpl(command, args, options) {
      invocation = { command, args, cwd: options.cwd };
      const child = new EventEmitter();
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      child.stdin = { end(value) {
        payload = JSON.parse(value);
        queueMicrotask(() => child.emit("close", 0));
      } };
      return child;
    },
  });
  await executor.run({ project: { config: { slug: "fixture", workspaceRoot: "/tmp/tts-fixture" } } });
  return { invocation, payload };
}

test("CLI without environment config launches the bundled adapter with frozen TTS input", async (t) => {
  environment(t);
  const { invocation, payload } = await captureExecution();
  assert.equal(invocation.command, process.execPath);
  assert.deepEqual(invocation.args, [fileURLToPath(new URL("../src/tts-harness-adapter.mjs", import.meta.url))]);
  assert.equal(payload.input.ttsScript, "videos/fixture/tts-script.json");
  assert.equal(payload.rate, "+25%");
  assert.equal(payload.voice, "zh-CN-XiaoxiaoNeural");
});

test("CLI preserves an explicit executor command, arguments and working directory", async (t) => {
  environment(t, {
    HARNESS_TTS_EXECUTOR_COMMAND: "/custom/tts",
    HARNESS_TTS_EXECUTOR_ARGS: '["--custom"]',
    HARNESS_TTS_EXECUTOR_CWD: "/custom/workspace",
  });
  assert.deepEqual((await captureExecution()).invocation, {
    command: "/custom/tts", args: ["--custom"], cwd: "/custom/workspace",
  });
});

test("CLI does not pass bundled adapter arguments to an explicit custom command", async (t) => {
  environment(t, { HARNESS_TTS_EXECUTOR_COMMAND: "/custom/tts" });
  assert.deepEqual((await captureExecution()).invocation.args, []);
});

test("CLI supports argument and cwd overrides for its default command", async (t) => {
  environment(t, { HARNESS_TTS_EXECUTOR_ARGS: '["custom-adapter.mjs"]', HARNESS_TTS_EXECUTOR_CWD: "/custom" });
  assert.deepEqual((await captureExecution()).invocation, {
    command: process.execPath, args: ["custom-adapter.mjs"], cwd: "/custom",
  });
});

test("CLI rejects malformed arguments and generic executors still require a command", (t) => {
  environment(t, { HARNESS_TTS_EXECUTOR_ARGS: '{"invalid":true}' });
  assert.throws(() => createCliTtsExecutor(), { code: "executor-config-invalid" });
  assert.throws(() => commandConfigFromEnv("HARNESS_TTS_EXECUTOR"), { code: "executor-not-configured" });
});
