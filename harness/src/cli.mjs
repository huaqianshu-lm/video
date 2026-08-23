#!/usr/bin/env node

import { initializeProject, loadProject } from "./storage.mjs";
import { STAGES } from "./stages.mjs";
import { approveGate, rejectGate, resumeProject, retryStage, runStage, validateStage } from "./runner.mjs";
import { createGitHubActionsAdapterFromEnv } from "./adapters.mjs";
import { requireGitHubActionsConfig } from "./github-config.mjs";
import { buildNextAction, buildProjectReport } from "./reports.mjs";
import { buildTaskPacket } from "./context.mjs";
import { buildProjectPlan } from "./plans.mjs";
import { listJobs } from "./jobs.mjs";

function usage() {
  console.log(`Usage:
  node harness/src/cli.mjs init <slug>
  node harness/src/cli.mjs status <slug> [--json]
  node harness/src/cli.mjs jobs <slug> [--json]
  node harness/src/cli.mjs validate <slug> [stage]
  node harness/src/cli.mjs run <slug> [stage]
  node harness/src/cli.mjs approve <slug> <gate>
  node harness/src/cli.mjs reject <slug> <gate> --return-to <stage> --reason <text>
  node harness/src/cli.mjs retry <slug> [stage]
  node harness/src/cli.mjs resume <slug>
  node harness/src/cli.mjs next <slug> [--json]
  node harness/src/cli.mjs report <slug> [--json]
  node harness/src/cli.mjs context <slug>
  node harness/src/cli.mjs plan <slug> --until <stage> [--json]

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

function configuredAdapters() {
  requireGitHubActionsConfig();
  const adapter = createGitHubActionsAdapterFromEnv();
  return { "smoke-render": adapter, render: adapter };
}

async function main(args) {
  const [command, slug, ...options] = args;
  if (!command) {
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

  if (command === "status") {
    validateSlug(slug);
    printStatus(loadProject(slug), options.includes("--json"));
    return 0;
  }

  if (command === "jobs") {
    validateSlug(slug);
    printJobs(slug, options.includes("--json"));
    return 0;
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
      console.log(JSON.stringify(await runStage(project, stage, { adapters }), null, 2));
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
