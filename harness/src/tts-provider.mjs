import crypto from "node:crypto";

export const EDGE_TTS = Object.freeze({
  provider: "edge",
  voice: "zh-CN-XiaoxiaoNeural",
  rate: "+25%",
  audioSpeed: 1,
  timingProvider: "edge-word-boundaries",
});

const BAILIAN_MODEL = "qwen3-tts-flash";
const BAILIAN_TIMING = "qwen-audio-3.1-asr-flash";

function invalid(message) {
  throw Object.assign(new Error(`TTS 配置无效：${message}`), { code: "tts-provider-invalid" });
}

function string(value, label) {
  if (typeof value !== "string" || !value.trim()) invalid(`${label} 必须是非空字符串`);
  return value.trim();
}

export function resolveTtsProvider(config = {}) {
  const tts = config?.tts;
  if (tts === undefined || tts === null) return { ...EDGE_TTS };
  if (typeof tts !== "object" || Array.isArray(tts)) invalid("tts 必须是对象");
  const provider = tts.provider ?? "edge";
  if (provider === "edge") {
    const result = {
      provider,
      voice: tts.voice === undefined ? EDGE_TTS.voice : string(tts.voice, "Edge voice"),
      rate: tts.rate === undefined ? EDGE_TTS.rate : string(tts.rate, "Edge rate"),
      audioSpeed: tts.audioSpeed === undefined ? 1 : Number(tts.audioSpeed),
      timingProvider: tts.timingProvider ?? EDGE_TTS.timingProvider,
    };
    if (result.audioSpeed !== 1) invalid("Edge 音频速度必须由 rate 控制，audioSpeed 固定为 1");
    return result;
  }
  if (provider !== "bailian") invalid(`不支持 provider：${provider}`);
  const result = {
    provider,
    model: tts.model ?? BAILIAN_MODEL,
    voice: string(tts.voice, "百炼 voice"),
    region: tts.region ?? "cn-beijing",
    languageType: tts.languageType ?? "Chinese",
    timingProvider: tts.timingProvider ?? BAILIAN_TIMING,
    audioSpeed: tts.audioSpeed === undefined ? 1 : Number(tts.audioSpeed),
  };
  if (result.model !== BAILIAN_MODEL) invalid(`百炼模型必须固定为 ${BAILIAN_MODEL}`);
  if (result.region !== "cn-beijing") invalid("当前只支持 cn-beijing 百炼端点");
  if (result.timingProvider !== BAILIAN_TIMING) invalid(`百炼时间戳必须使用 ${BAILIAN_TIMING}`);
  if (result.audioSpeed !== 1) invalid("百炼当前只支持原始语速，audioSpeed 必须为 1");
  return result;
}

export function ttsProviderFingerprint(provider) {
  return crypto.createHash("sha256").update(JSON.stringify(provider)).digest("hex");
}

export function ttsProviderLabel(provider) {
  return provider.provider === "bailian" ? "百炼 Qwen3-TTS-Flash" : "Edge TTS";
}
