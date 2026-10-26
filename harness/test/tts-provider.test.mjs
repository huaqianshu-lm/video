import assert from "node:assert/strict";
import test from "node:test";
import { EDGE_TTS, resolveTtsProvider } from "../src/tts-provider.mjs";
import { buildTtsExecutionInput } from "../src/tts-executor.mjs";

test("uses the frozen Edge defaults when a historical project has no TTS config", () => {
  assert.deepEqual(resolveTtsProvider({}), EDGE_TTS);
});

test("serializes Bailian into the shared executor without an Edge rate", () => {
  const input = buildTtsExecutionInput({ config: {
    slug: "provider-video", workspaceRoot: "/tmp/provider-video",
    tts: { provider: "bailian", model: "qwen3-tts-flash", voice: "Cherry", region: "cn-beijing", languageType: "Chinese", timingProvider: "qwen-audio-3.1-asr-flash", audioSpeed: 1 },
  } });
  assert.equal(input.provider, "bailian");
  assert.equal(Object.hasOwn(input, "rate"), false);
});

test("accepts Bailian only at original speed with its fixed timing provider", () => {
  const provider = resolveTtsProvider({ tts: {
    provider: "bailian", model: "qwen3-tts-flash", voice: "Cherry",
    region: "cn-beijing", languageType: "Chinese", timingProvider: "qwen-audio-3.1-asr-flash", audioSpeed: 1,
  } });
  assert.equal(provider.provider, "bailian");
  assert.equal(provider.audioSpeed, 1);
  assert.throws(() => resolveTtsProvider({ tts: { ...provider, audioSpeed: 1.25 } }), { code: "tts-provider-invalid" });
});
