#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { createWebServer } from "./server.mjs";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const agentAdapterPath = path.join(moduleDirectory, "agent-harness-adapter.mjs");
const ttsAdapterPath = path.join(moduleDirectory, "tts-harness-adapter.mjs");
const adapterPath = path.join(moduleDirectory, "remotion-harness-adapter.mjs");

process.env.HARNESS_AGENT_EXECUTOR_COMMAND ||= process.execPath;
process.env.HARNESS_AGENT_EXECUTOR_ARGS ||= JSON.stringify([agentAdapterPath]);
process.env.HARNESS_TTS_EXECUTOR_COMMAND ||= process.execPath;
process.env.HARNESS_TTS_EXECUTOR_ARGS ||= JSON.stringify([ttsAdapterPath]);
process.env.HARNESS_REMOTION_EXECUTOR_COMMAND ||= process.execPath;
process.env.HARNESS_REMOTION_EXECUTOR_ARGS ||= JSON.stringify([adapterPath]);

const port = Number(process.env.HARNESS_WEB_PORT ?? 4173);
const host = process.env.HARNESS_WEB_HOST ?? "127.0.0.1";
const webServer = createWebServer({ host, port });
await webServer.listen();
console.log(`Video Harness Web UI: http://${host}:${port}`);
