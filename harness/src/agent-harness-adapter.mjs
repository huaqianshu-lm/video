#!/usr/bin/env node

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const modulePath = fileURLToPath(import.meta.url);
const MAX_INPUT_BYTES = 2_000_000;

export function parseAgentTaskInput(raw) {
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid Agent task JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (payload?.kind !== "video-agent-execution") {
    throw new Error("Expected a video-agent-execution task");
  }
  if (!payload.context?.workspaceRoot || !path.isAbsolute(payload.context.workspaceRoot)) {
    throw new Error("Agent task requires an absolute context.workspaceRoot");
  }
  if (!payload.project?.slug || !payload.task?.stage) {
    throw new Error("Agent task requires project.slug and task.stage");
  }
  return payload;
}

export function buildAgentPrompt(payload) {
  return [
    "你是当前项目的视频生产 Agent。",
    "先读取并遵守 ~/.claude/CLAUDE.md、项目 CLAUDE.md 和 ROADMAP.md，再执行下面的 Harness 阶段任务包。",
    "先读取 context.readPaths（包括其中声明的原型基线）；只修改任务包声明的 context.writePaths；只处理当前阶段，不跳过前置阶段或提前执行下游阶段。",
    "完成输出后运行任务包中列出的校验命令。不要自行通过人工 Gate。",
    "完成后直接退出，由 Harness 重新读取并校验真实产物；只有校验通过才会推进阶段。",
    "",
    JSON.stringify(payload, null, 2),
  ].join("\n");
}

export function codexArgs(payload) {
  return [
    "exec",
    "--cd",
    payload.context.workspaceRoot,
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

export async function runAgent(payload, { spawnImpl = spawn } = {}) {
  const command = process.env.HARNESS_AGENT_CLI_COMMAND || "codex";
  const child = spawnImpl(command, codexArgs(payload), {
    cwd: payload.context.workspaceRoot,
    env: sanitizedCodexEnvironment(),
    stdio: ["pipe", "pipe", "pipe"],
  });
  child.stdout?.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr?.on("data", (chunk) => process.stderr.write(chunk));
  child.stdin.end(buildAgentPrompt(payload));
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Codex Agent exited with ${signal ? `signal ${signal}` : `code ${code}`}`));
    });
  });
}

async function readStdin() {
  const chunks = [];
  let size = 0;
  for await (const chunk of process.stdin) {
    size += chunk.length;
    if (size > MAX_INPUT_BYTES) throw new Error("Agent task input is too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

if (process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
  try {
    await runAgent(parseAgentTaskInput(await readStdin()));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
