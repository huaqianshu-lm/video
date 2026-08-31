#!/usr/bin/env node

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const modulePath = fileURLToPath(import.meta.url);
const MAX_INPUT_BYTES = 2_000_000;

export function parseRemotionTaskInput(raw) {
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid Remotion task JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (payload?.kind !== "video-remotion-execution") {
    throw new Error("Expected a video-remotion-execution task");
  }
  if (!payload.workspaceRoot || !path.isAbsolute(payload.workspaceRoot)) {
    throw new Error("Remotion task requires an absolute workspaceRoot");
  }
  if (!payload.videoId || !payload.taskId) {
    throw new Error("Remotion task requires videoId and taskId");
  }
  return payload;
}

export function buildRemotionAgentPrompt(payload) {
  return [
    "你是当前项目的 Remotion 制作 Agent。",
    "先读取并遵守 ~/.claude/CLAUDE.md、项目 CLAUDE.md 和 ROADMAP.md，再执行下面的 Harness 任务包。",
    "只修改任务包声明的输出路径；以 Gate 2 冻结的 Visual Script 与 Visual Prototype 为视觉基线；完成后运行任务包中的校验命令。",
    "不得渲染视频，不得自行通过 Gate 3。任务完成后直接退出，由 Harness 重新校验真实产物。",
    "",
    JSON.stringify(payload, null, 2),
  ].join("\n");
}

export function codexArgs(payload) {
  return [
    "exec",
    "--cd",
    payload.workspaceRoot,
    "--ephemeral",
    "--approve-for-me",
    "-",
  ];
}

export function sanitizedCodexEnvironment(source = process.env) {
  const env = { ...source };
  for (const name of [
    "CODEX_CI",
    "CODEX_PERMISSION_PROFILE",
    "CODEX_SANDBOX",
    "CODEX_SANDBOX_NETWORK_DISABLED",
    "CODEX_SESSION_ID",
    "CODEX_THREAD_ID",
  ]) {
    delete env[name];
  }
  return env;
}

export async function runRemotionAgent(payload, { spawnImpl = spawn } = {}) {
  const command = process.env.HARNESS_REMOTION_AGENT_COMMAND || "codex";
  const child = spawnImpl(command, codexArgs(payload), {
    cwd: payload.workspaceRoot,
    env: sanitizedCodexEnvironment(),
    stdio: ["pipe", "inherit", "inherit"],
  });
  child.stdin.end(buildRemotionAgentPrompt(payload));
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Codex Remotion Agent exited with ${signal ? `signal ${signal}` : `code ${code}`}`));
    });
  });
}

async function readStdin() {
  const chunks = [];
  let size = 0;
  for await (const chunk of process.stdin) {
    size += chunk.length;
    if (size > MAX_INPUT_BYTES) throw new Error("Remotion task input is too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

if (process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
  try {
    await runRemotionAgent(parseRemotionTaskInput(await readStdin()));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
