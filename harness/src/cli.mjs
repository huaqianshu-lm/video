#!/usr/bin/env node

import { initializeProject, loadProject } from "./storage.mjs";
import { STAGES } from "./stages.mjs";
import { approveGate, rejectGate, resumeProject, retryStage, runStage, validateStage } from "./runner.mjs";
import { createGitHubActionsAdapterFromEnv } from "./adapters.mjs";
import { requireGitHubActionsConfig } from "./github-config.mjs";
import { createTtsExecutorFromEnv } from "./tts-executor.mjs";
import { createRemotionExecutorFromEnv } from "./remotion-executor.mjs";
import { createRemoteRenderExecutor } from "./remote-executor.mjs";
import { packageVideoAssets } from "./asset-bundler.mjs";
import {
  packageRenderInput,
  prepareRenderInput,
  renderInputDirectory,
  validateRenderInputDirectory,
  writeStudioCatalogEntryPoint,
  writeRenderEntryPoint,
} from "./render-input.mjs";
import { runSingleStage } from "./single-runner.mjs";
import { buildNextAction, buildProjectReport } from "./reports.mjs";
import { buildTaskPacket } from "./context.mjs";
import { buildProjectPlan } from "./plans.mjs";
import { listAllJobs, listJobs } from "./jobs.mjs";
import { createRemoteJobMonitor } from "./remote-jobs.mjs";
import { diagnoseGitHubActions } from "./diagnostics.mjs";
import { adoptExistingProjectToGate2, markHistoricalProjectCompleted } from "./adoption.mjs";
import {
  approveTtsQc,
  approveSmokeQc,
  batchDefinitions,
  createBatch,
  getBatchForView,
  listBatchesForView,
  retryFailedBatchItems,
  runBatch,
} from "./batches.mjs";
import {
  completeRemotionTask,
  getRemotionTask,
  listRemotionTasks,
  retryRemotionTask,
  runRemotionTask,
  startRemotionTask,
} from "./remotion-tasks.mjs";

function usage() {
  console.log(`Usage:
  node harness/src/cli.mjs init <slug>
  node harness/src/cli.mjs adopt <slug> --to gate-2 [--json]
  node harness/src/cli.mjs adopt <slug> --to completed --historical [--json]
  node harness/src/cli.mjs status <slug> [--json]
  node harness/src/cli.mjs jobs <slug> [--json]
  node harness/src/cli.mjs jobs --all [--json]
  node harness/src/cli.mjs validate <slug> [stage]
  node harness/src/cli.mjs run <slug> [stage]
  node harness/src/cli.mjs remote-run <slug> <smoke-render|render> [--json]
  node harness/src/cli.mjs assets package <slug> [--json]
  node harness/src/cli.mjs render-input prepare <slug> [--composition-id <id>] [--component-file <file>] [--component-export <name>] [--json]
  node harness/src/cli.mjs render-input validate <slug> [--json]
  node harness/src/cli.mjs render-input package <slug> [--json]
  node harness/src/cli.mjs render-input validate-path <directory> [--json]
  node harness/src/cli.mjs render-input entry --manifest <file> --output <file> [--json]
  node harness/src/cli.mjs render-input entry-all --output <file> [--json]
  node harness/src/cli.mjs approve <slug> <gate>
  node harness/src/cli.mjs reject <slug> <gate> --return-to <stage> --reason <text>
  node harness/src/cli.mjs retry <slug> [stage]
  node harness/src/cli.mjs resume <slug>
  node harness/src/cli.mjs next <slug> [--json]
  node harness/src/cli.mjs report <slug> [--json]
  node harness/src/cli.mjs context <slug>
  node harness/src/cli.mjs plan <slug> --until <stage> [--json]
  node harness/src/cli.mjs batch types [--json]
  node harness/src/cli.mjs batch create <to-gate-2|to-tts|to-remotion|to-render> <slug>... [--json]
  node harness/src/cli.mjs batch list [--json]
  node harness/src/cli.mjs batch status <batch-id> [--json]
  node harness/src/cli.mjs batch run <batch-id> [--json]
  node harness/src/cli.mjs batch resume <batch-id> [--retry-failed] [--json]
  node harness/src/cli.mjs batch approve-tts-qc <batch-id> <slug> [--json]
  node harness/src/cli.mjs batch approve-smoke-qc <batch-id> <slug> [--json]
  node harness/src/cli.mjs remotion-task list [--json]
  node harness/src/cli.mjs remotion-task show <task-id> [--json]
  node harness/src/cli.mjs remotion-task start <task-id> [--json]
  node harness/src/cli.mjs remotion-task run <task-id> [--json]
  node harness/src/cli.mjs remotion-task complete <task-id> [--json]
  node harness/src/cli.mjs remotion-task retry <task-id> [--json]
  node harness/src/cli.mjs doctor [--json]

  GitHub Actions adapter environment:
  GITHUB_TOKEN or GH_TOKEN, GITHUB_REPOSITORY, and GITHUB_REF_NAME (or HARNESS_GITHUB_REF)`);
}

function validateSlug(slug) {
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Slug must use lowercase letters, numbers, and single hyphens");
  }
}

function printStatus(project, asJson) {
  if (asJson) {
    console.log(JSON.stringify(project, null, 2));
    return;
  }

  const { state } = project;
  console.log(`Project: ${state.slug}`);
  console.log(`Current stage: ${state.currentStage}`);
  console.log("Stages:");
  for (const stage of STAGES) {
    const item = state.stages[stage];
    console.log(`  ${stage}: ${item.status}`);
  }
}

function printJobs(slug, asJson) {
  const jobs = listJobs(slug);
  if (asJson) {
    console.log(JSON.stringify(jobs, null, 2));
    return;
  }
  console.log(`Remote jobs: ${slug}`);
  if (jobs.length === 0) {
    console.log("  No remote jobs");
    return;
  }
  for (const job of jobs) {
    const run = job.remote?.runId ? `Run #${job.remote.runId}` : "Run pending";
    const artifact = job.result?.outputs?.[0]?.artifactName ?? "Artifact pending";
    console.log(`  ${job.stage}: ${job.status} · ${run} · ${artifact}`);
    if (job.error?.message) console.log(`    Error: ${job.error.message}`);
  }
}

function printAllJobs(asJson) {
  const jobs = listAllJobs();
  if (asJson) {
    console.log(JSON.stringify(jobs, null, 2));
    return;
  }
  console.log("Remote jobs: all projects");
  if (jobs.length === 0) {
    console.log("  No remote jobs");
    return;
  }
  for (const job of jobs) {
    const run = job.remote?.runId ? `Run #${job.remote.runId}` : "Run pending";
    console.log(`  ${job.slug} · ${job.stage}: ${job.status} · ${run}`);
  }
}

function printNext(next) {
  console.log(`Current stage: ${next.currentStage}`);
  console.log(`Status: ${next.status}`);
  console.log(`Action: ${next.action}`);
  console.log(`Message: ${next.message}`);
  if (next.commands.length > 0) {
    console.log("Commands:");
    for (const command of next.commands) console.log(`  ${command}`);
  }
  if (next.issues.length > 0) {
    console.log(`Issues: ${next.issues.length}`);
    for (const issue of next.issues) console.log(`  [${issue.code}] ${issue.path ?? ""} ${issue.message}`.trim());
  }
  if (next.manualChecks?.length > 0) {
    console.log("Manual checks:");
    for (const check of next.manualChecks) console.log(`  - ${check}`);
  }
}

function printReport(report) {
  printNext(report.next);
  console.log("Stages:");
  for (const item of report.stages) {
    const suffix = item.invalidatedBy ? ` (invalidated by ${item.invalidatedBy})` : "";
    console.log(`  ${item.stage}: ${item.status}, attempts=${item.attempts}${suffix}`);
  }
}

function printPlan(plan) {
  console.log(`Project: ${plan.project.slug}`);
  console.log(`Current stage: ${plan.project.currentStage}`);
  console.log(`Target stage: ${plan.target.stage}`);
  console.log("Stages:");
  for (const item of plan.stages) {
    console.log(`  ${item.stage}: ${item.status} — ${item.objective}`);
  }
}

function printDiagnostics(result) {
  console.log(`GitHub Actions: ${result.ok ? "ready" : "not ready"}`);
  console.log(`Repository: ${result.config.repository || "未配置"}`);
  console.log(`Ref: ${result.config.ref || "未配置"}`);
  console.log(`Token: ${result.config.tokenConfigured ? "已配置" : "未配置"}`);
  console.log(`Render input: ${result.config.renderInputConfigured ? "已配置" : "未配置"}`);
  for (const item of result.checks) {
    console.log(`  [${item.status}] ${item.name}: ${item.message}`);
  }
}

function printBatch(batch, asJson = false) {
  if (asJson) {
    console.log(JSON.stringify(batch, null, 2));
    return;
  }
  console.log(`Batch: ${batch.id}`);
  console.log(`Type: ${batch.label}`);
  console.log(`Status: ${batch.status}`);
  console.log(`Target: ${batch.targetStage}`);
  for (const item of batch.items) {
    const error = item.error?.message ? ` · ${item.error.message}` : "";
    console.log(`  ${item.slug}: ${item.status}${item.phase ? ` · ${item.phase}` : ""}${error}`);
  }
}

function printRemotionTask(result, asJson = false) {
  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  const task = result.task ?? result;
  console.log(`Remotion task: ${task.id}`);
  console.log(`Video: ${task.slug}`);
  console.log(`Status: ${task.status}`);
  if (task.batchId) console.log(`Batch: ${task.batchId}`);
  if (task.error?.message) console.log(`Error: ${task.error.message}`);
  if (result.batch) printBatch(result.batch);
}

function configuredAdapters() {
  requireGitHubActionsConfig();
  const adapter = createGitHubActionsAdapterFromEnv();
  return { "smoke-render": adapter, render: adapter };
}

function configuredExecutors() {
  return { "subtitle-timeline": createTtsExecutorFromEnv() };
}

async function main(args) {
  const [command, slug, ...options] = args;
  if (!command) {
    usage();
    return 1;
  }

  if (command === "doctor") {
    const result = await diagnoseGitHubActions();
    if (options.includes("--json")) console.log(JSON.stringify(result, null, 2));
    else printDiagnostics(result);
    return result.ok ? 0 : 1;
  }

  if (command === "batch") {
    const batchCommand = slug;
    const asJson = options.includes("--json");
    if (batchCommand === "types") {
      const definitions = batchDefinitions();
      if (asJson) console.log(JSON.stringify(definitions, null, 2));
      else definitions.forEach((definition) => console.log(`${definition.type}: ${definition.label} · ${definition.description}`));
      return 0;
    }
    if (batchCommand === "list") {
      const batches = listBatchesForView();
      if (asJson) console.log(JSON.stringify(batches, null, 2));
      else batches.forEach((batch) => console.log(`${batch.id} · ${batch.label} · ${batch.status} · ${batch.summary?.total ?? batch.items.length} 个视频`));
      return 0;
    }
    if (batchCommand === "create") {
      const type = options[0];
      const slugs = options.slice(1).filter((value) => value !== "--json");
      printBatch(createBatch({ type, slugs }), asJson);
      return 0;
    }
    if (batchCommand === "status" || batchCommand === "run" || batchCommand === "resume") {
      const batchId = options.find((value) => value !== "--json" && value !== "--retry-failed");
      if (!batchId) throw new Error(`batch ${batchCommand} requires <batch-id>`);
      if (batchCommand === "status") {
        const batch = getBatchForView(batchId);
        if (!batch) throw new Error(`Batch not found: ${batchId}`);
        printBatch(batch, asJson);
        return 0;
      }
      if (batchCommand === "resume" && options.includes("--retry-failed")) retryFailedBatchItems(batchId);
      await runBatch(batchId);
      printBatch(getBatchForView(batchId), asJson);
      return 0;
    }
    if (batchCommand === "approve-tts-qc" || batchCommand === "approve-smoke-qc") {
      const batchId = options.find((value) => value !== "--json");
      const videoSlug = options.filter((value) => value !== "--json").at(1);
      if (!batchId || !videoSlug) throw new Error("batch approve-tts-qc requires <batch-id> <slug>");
      if (batchCommand === "approve-tts-qc") approveTtsQc(batchId, videoSlug);
      else approveSmokeQc(batchId, videoSlug);
      await runBatch(batchId);
      printBatch(getBatchForView(batchId), asJson);
      return 0;
    }
    usage();
    return 1;
  }

  if (command === "remotion-task") {
    const taskCommand = slug;
    const asJson = options.includes("--json");
    if (taskCommand === "list") {
      const tasks = listRemotionTasks();
      if (asJson) console.log(JSON.stringify(tasks, null, 2));
      else tasks.forEach((task) => console.log(`${task.id} · ${task.slug} · ${task.status}`));
      return 0;
    }
    const taskId = options.find((value) => value !== "--json");
    if (!taskId) throw new Error(`remotion-task ${taskCommand} requires <task-id>`);
    if (taskCommand === "show") {
      const task = getRemotionTask(taskId);
      if (!task) throw new Error(`Remotion task not found: ${taskId}`);
      printRemotionTask(task, asJson);
      return 0;
    }
    if (taskCommand === "start") {
      printRemotionTask(startRemotionTask(taskId), asJson);
      return 0;
    }
    if (taskCommand === "run") {
      const result = await runRemotionTask(taskId, { executor: createRemotionExecutorFromEnv() });
      if (result.completed && result.task.batchId) result.batch = await runBatch(result.task.batchId);
      printRemotionTask(result, asJson);
      return result.completed ? 0 : 1;
    }
    if (taskCommand === "retry") {
      printRemotionTask(retryRemotionTask(taskId), asJson);
      return 0;
    }
    if (taskCommand === "complete") {
      const result = completeRemotionTask(taskId);
      if (result.completed && result.task.batchId) result.batch = await runBatch(result.task.batchId);
      printRemotionTask(result, asJson);
      return result.completed ? 0 : 1;
    }
    usage();
    return 1;
  }

  if (command === "init") {
    validateSlug(slug);
    const files = initializeProject(slug);
    console.log(`Initialized Harness project: ${slug}`);
    console.log(`State: ${files.state}`);
    return 0;
  }

  if (command === "adopt") {
    validateSlug(slug);
    const targetIndex = options.indexOf("--to");
    const target = targetIndex >= 0 ? options[targetIndex + 1] : undefined;
    if (target === "completed") {
      if (!options.includes("--historical")) throw new Error("adopt --to completed requires --historical");
      const result = markHistoricalProjectCompleted(slug);
      if (options.includes("--json")) console.log(JSON.stringify(result, null, 2));
      else console.log(`Marked historical project as completed: ${slug}`);
      return 0;
    }
    if (target !== "gate-2") throw new Error("adopt currently supports only --to gate-2 or --to completed --historical");
    const result = adoptExistingProjectToGate2(slug);
    if (options.includes("--json")) console.log(JSON.stringify(result, null, 2));
    else console.log(`Adopted existing artifacts to Gate 2: ${slug}`);
    return 0;
  }

  if (command === "status") {
    validateSlug(slug);
    printStatus(loadProject(slug), options.includes("--json"));
    return 0;
  }

  if (command === "jobs") {
    if (slug === "--all") {
      printAllJobs(options.includes("--json"));
      return 0;
    }
    validateSlug(slug);
    printJobs(slug, options.includes("--json"));
    return 0;
  }

  if (command === "remote-run") {
    validateSlug(slug);
    const stage = options.find((value) => value !== "--json");
    if (stage !== "smoke-render" && stage !== "render") {
      throw new Error("remote-run requires <smoke-render|render>");
    }
    requireGitHubActionsConfig();
    const project = loadProject(slug, { refresh: true });
    const monitor = createRemoteJobMonitor();
    const executor = createRemoteRenderExecutor({ monitor });
    const result = await runSingleStage(project, stage, { remoteExecutor: executor });
    if (options.includes("--json")) console.log(JSON.stringify(result, null, 2));
    else console.log(`Queued remote ${stage} job for ${slug}: ${result.job.id}`);
    return 0;
  }

  if (command === "assets") {
    if (slug !== "package") {
      usage();
      return 1;
    }
    const assetSlug = options.find((value) => value !== "--json");
    validateSlug(assetSlug);
    const result = packageVideoAssets(loadProject(assetSlug, { refresh: true }));
    if (options.includes("--json")) console.log(JSON.stringify(result, null, 2));
    else console.log(`Packaged ${result.archiveRelativePath} (${result.fileCount} files)`);
    return 0;
  }

  if (command === "render-input") {
    const subcommand = slug;
    const asJson = options.includes("--json");
    if (subcommand === "entry") {
      const manifestIndex = options.indexOf("--manifest");
      const outputIndex = options.indexOf("--output");
      const manifestPath = manifestIndex >= 0 ? options[manifestIndex + 1] : null;
      const outputPath = outputIndex >= 0 ? options[outputIndex + 1] : null;
      if (!manifestPath || !outputPath) throw new Error("render-input entry requires --manifest <file> --output <file>");
      const result = writeRenderEntryPoint(manifestPath, outputPath);
      if (asJson) console.log(JSON.stringify(result, null, 2));
      else console.log(`Wrote render entry point: ${result.outputPath}`);
      return 0;
    }

    if (subcommand === "entry-all") {
      const outputIndex = options.indexOf("--output");
      const outputPath = outputIndex >= 0 ? options[outputIndex + 1] : null;
      if (!outputPath) throw new Error("render-input entry-all requires --output <file>");
      const result = writeStudioCatalogEntryPoint(process.cwd(), outputPath);
      if (asJson) console.log(JSON.stringify(result, null, 2));
      else {
        console.log(`Wrote Studio catalog entry point: ${result.outputPath}`);
        console.log(`Registered ${result.entries.length} video(s)`);
        for (const skipped of result.skipped) console.log(`Skipped ${skipped.slug}: ${skipped.reason}`);
      }
      return 0;
    }

    if (subcommand === "validate-path") {
      const directory = options.find((value) => value !== "--json");
      if (!directory) throw new Error("render-input validate-path requires <directory>");
      const issues = validateRenderInputDirectory(directory);
      if (asJson) console.log(JSON.stringify({ directory, issues }, null, 2));
      else console.log(issues.length === 0 ? `Valid render input: ${directory}` : issues.map((issue) => `- ${issue}`).join("\n"));
      return issues.length === 0 ? 0 : 1;
    }

    validateSlug(options.find((value) => !value.startsWith("--")) ?? "");
    const inputSlug = options.find((value) => !value.startsWith("--"));
    const project = loadProject(inputSlug, { refresh: true });
    if (subcommand === "prepare") {
      const compositionIndex = options.indexOf("--composition-id");
      const componentFileIndex = options.indexOf("--component-file");
      const componentExportIndex = options.indexOf("--component-export");
      const result = prepareRenderInput(project, {
        compositionId: compositionIndex >= 0 ? options[compositionIndex + 1] : undefined,
        componentFile: componentFileIndex >= 0 ? options[componentFileIndex + 1] : undefined,
        componentExport: componentExportIndex >= 0 ? options[componentExportIndex + 1] : undefined,
      });
      if (asJson) console.log(JSON.stringify(result, null, 2));
      else console.log(`${result.status === "current" ? "Reused" : "Prepared"} render input: ${result.directory}`);
      return 0;
    }
    if (subcommand === "validate") {
      const directory = renderInputDirectory(project.config.workspaceRoot, inputSlug);
      const issues = validateRenderInputDirectory(directory, { expectedSlug: inputSlug });
      if (asJson) console.log(JSON.stringify({ directory, issues }, null, 2));
      else console.log(issues.length === 0 ? `Valid render input: ${directory}` : issues.map((issue) => `- ${issue}`).join("\n"));
      return issues.length === 0 ? 0 : 1;
    }
    if (subcommand === "package") {
      const result = packageRenderInput(project.config.workspaceRoot, inputSlug);
      if (asJson) console.log(JSON.stringify(result, null, 2));
      else console.log(`Packaged ${result.archivePath} (sha256=${result.archiveSha256})`);
      return 0;
    }
    usage();
    return 1;
  }

  if (["validate", "run", "resume", "retry", "approve", "reject", "next", "report", "context", "plan"].includes(command)) {
    validateSlug(slug);
    const project = loadProject(slug, { refresh: !["context", "plan"].includes(command) });

    if (command === "context") {
      console.log(JSON.stringify(buildTaskPacket(project), null, 2));
      return 0;
    }

    if (command === "plan") {
      const untilIndex = options.indexOf("--until");
      const until = untilIndex >= 0 ? options[untilIndex + 1] : undefined;
      if (!until) throw new Error("plan requires --until <stage>");
      const plan = buildProjectPlan(project, until);
      if (options.includes("--json")) console.log(JSON.stringify(plan, null, 2));
      else printPlan(plan);
      return 0;
    }

    if (command === "next") {
      const next = buildNextAction(project);
      if (options.includes("--json")) console.log(JSON.stringify(next, null, 2));
      else printNext(next);
      return next.issues.some((issue) => issue.severity !== "warning") ? 1 : 0;
    }

    if (command === "report") {
      const report = buildProjectReport(project);
      if (options.includes("--json")) console.log(JSON.stringify(report, null, 2));
      else printReport(report);
      return report.next.issues.some((issue) => issue.severity !== "warning") ? 1 : 0;
    }

    if (command === "validate") {
      const issues = validateStage(project, options[0]);
      console.log(JSON.stringify({ stage: options[0] ?? project.state.currentStage, issues }, null, 2));
      return issues.length === 0 ? 0 : 1;
    }

    if (command === "run") {
      const stage = options[0] ?? project.state.currentStage;
      const adapters = stage === "smoke-render" || stage === "render" ? configuredAdapters() : {};
      const ttsExecutor = stage === "subtitle-timeline" ? configuredExecutors()["subtitle-timeline"] : null;
      const remotionExecutor = stage === "remotion" ? createRemotionExecutorFromEnv() : null;
      const remoteExecutor = stage === "smoke-render" || stage === "render"
        ? createRemoteRenderExecutor({ monitor: createRemoteJobMonitor() })
        : null;
      console.log(JSON.stringify(await runSingleStage(project, stage, {
        adapters,
        ttsExecutor,
        remotionExecutor,
        remoteExecutor,
      }), null, 2));
      return 0;
    }

    if (command === "resume") {
      console.log(JSON.stringify(resumeProject(project), null, 2));
      return 0;
    }

    if (command === "retry") {
      console.log(JSON.stringify(retryStage(project, options[0]), null, 2));
      return 0;
    }

    if (command === "approve") {
      console.log(JSON.stringify(approveGate(project, options[0]), null, 2));
      return 0;
    }

    if (command === "reject") {
      const returnToIndex = options.indexOf("--return-to");
      const reasonIndex = options.indexOf("--reason");
      const returnTo = returnToIndex >= 0 ? options[returnToIndex + 1] : undefined;
      const reason = reasonIndex >= 0 ? options.slice(reasonIndex + 1).join(" ") : undefined;
      console.log(JSON.stringify(rejectGate(project, options[0], returnTo, reason), null, 2));
      return 0;
    }
  }

  usage();
  return 1;
}

try {
  process.exitCode = await main(process.argv.slice(2));
} catch (error) {
  console.error(`Harness error: ${error.message}`);
  process.exitCode = 1;
}
