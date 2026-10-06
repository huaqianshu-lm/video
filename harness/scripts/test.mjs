import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const harness = path.resolve(new URL("..", import.meta.url).pathname);
const repository = path.dirname(harness);
const root = fs.mkdtempSync(path.join(os.tmpdir(), "harness-regression-"));
const binaries = path.join(root, "bin");
fs.mkdirSync(binaries);
fs.writeFileSync(path.join(binaries, "gh"), "#!/bin/sh\nexit 1\n", { mode: 0o755 });
const requested = process.argv.slice(2);
const available = fs.readdirSync(path.join(harness, "test")).filter(file => file.endsWith(".test.mjs")).sort();
if (requested.some(file => !available.includes(file))) throw new Error("只能选择 harness/test 下已有的 .test.mjs 文件。");
const files = requested.length ? available.filter(file => requested.includes(file)) : available;
let index = 0;
const results = [];

async function run(file) {
  const area = path.join(root, file.replace(/\.mjs$/, ""));
  fs.mkdirSync(area);
  const environment = { ...process.env, PATH: `${binaries}${path.delimiter}${process.env.PATH}`, HARNESS_GITHUB_AUTH_SOURCE: "env", GITHUB_TOKEN: "isolated-test-only" };
  delete environment.GH_TOKEN;
  delete environment.HARNESS_RENDER_INPUT_DIR;
  delete environment.HARNESS_RENDER_INPUT_URL;
  delete environment.HARNESS_RENDER_INPUT_SHA256;
  delete environment.HARNESS_RENDER_INPUT_TOKEN;
  for (const [key, directory] of Object.entries({ HARNESS_PROJECTS_DIR: "projects", HARNESS_WORKSPACE_ROOT: "workspace", HARNESS_AGENT_JOBS_DIR: "agent-jobs", HARNESS_REMOTION_TASKS_DIR: "remotion-tasks", HARNESS_BATCHES_DIR: "batches", HARNESS_JOBS_DIR: "jobs" })) environment[key] = path.join(area, directory);
  // This dedicated reader test hashes real files before/after and performs no production actions.
  if (file === "web-regression.test.mjs") {
    environment.HARNESS_WORKSPACE_ROOT = repository;
    environment.HARNESS_PROJECTS_DIR = path.join(harness, "projects");
  }
  const args = ["--require", path.join(harness, "test/helpers/isolated-network.cjs"), "--test"];
  if (Number(process.versions.node.split(".")[0]) >= 22) args.push("--test-force-exit");
  args.push(path.join(harness, "test", file));
  const child = spawn(process.execPath, args, { cwd: harness, env: environment, detached: true, stdio: ["ignore", "pipe", "pipe"] });
  let output = "";
  child.stdout.on("data", chunk => { output += chunk; });
  child.stderr.on("data", chunk => { output += chunk; });
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    try { process.kill(-child.pid, "SIGTERM"); } catch { /* Process may have just exited. */ }
  }, 240_000);
  const exitCode = await new Promise((resolve, reject) => { child.once("error", reject); child.once("close", resolve); });
  clearTimeout(timeout);
  fs.writeFileSync(path.join(area, "result.log"), output);
  const tests = Number(output.match(/^# tests (\d+)/m)?.[1] ?? 0);
  const passed = Number(output.match(/^# pass (\d+)/m)?.[1] ?? 0);
  const failed = Number(output.match(/^# fail (\d+)/m)?.[1] ?? 0);
  const ok = exitCode === 0 && !timedOut && tests > 0 && failed === 0;
  const result = { file, ok, exitCode, timedOut, tests, passed, failed, log: path.join(area, "result.log") };
  results.push(result);
  console.log(`${ok ? "PASS" : "FAIL"} ${file} ${passed}/${tests}${timedOut ? " timeout" : ""}`);
  if (!ok) console.log(output);
}

await Promise.all(Array.from({ length: Math.min(4, files.length) }, async () => {
  while (index < files.length) await run(files[index++]);
}));
results.sort((left, right) => left.file.localeCompare(right.file));
const summary = { node: process.version, results, tests: results.reduce((total, item) => total + item.tests, 0), passed: results.reduce((total, item) => total + item.passed, 0), ok: results.every(item => item.ok) };
fs.writeFileSync(path.join(root, "summary.json"), JSON.stringify(summary, null, 2));
console.log(`RESULT ${summary.passed}/${summary.tests}; evidence: ${path.join(root, "summary.json")}`);
process.exitCode = summary.ok ? 0 : 1;
