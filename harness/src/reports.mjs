import { isGateStage, previousStage, STAGES } from "./stages.mjs";
import { validateStage } from "./runner.mjs";

function commandFor(project, command, stage = null) {
  const suffix = stage ? ` ${stage}` : "";
  return `node harness/src/cli.mjs ${command} ${project.state.slug}${suffix}`;
}

export function buildNextAction(project) {
  if (project.state.currentStage === "completed") {
    return {
      currentStage: "completed",
      status: "succeeded",
      action: "complete",
      message: "所有阶段已完成，等待最终交付或后续版本操作。",
      requiresUser: false,
      commands: [],
      issues: [],
    };
  }

  const stage = project.state.currentStage;
  const item = project.state.stages[stage];
  const issues = item.status === "ready" ? validateStage(project, stage) : [];
  const blockingIssues = issues.filter((item) => item.severity !== "warning");
  if (item.status === "waiting" && isGateStage(stage)) {
    return {
      currentStage: stage,
      status: item.status,
      action: "approve-or-reject-gate",
      message: `等待人工确认 ${stage}。通过后继续，驳回时必须指定回退阶段和原因。`,
      requiresUser: true,
      commands: [commandFor(project, "approve", stage)],
      issues,
    };
  }
  if (item.status === "failed") {
    return {
      currentStage: stage,
      status: item.status,
      action: "retry-stage",
      message: item.error?.message ?? `${stage} 执行失败。`,
      requiresUser: false,
      commands: [commandFor(project, "retry", stage)],
      issues,
    };
  }
  if (item.status === "ready" && blockingIssues.length > 0) {
    return {
      currentStage: stage,
      status: item.status,
      action: "fix-validation-issues",
      message: `${stage} 还有 ${blockingIssues.length} 个阻塞性校验问题，修复后才能执行。`,
      requiresUser: false,
      commands: [commandFor(project, "validate", stage)],
      issues,
    };
  }
  if (item.status === "ready") {
    return {
      currentStage: stage,
      status: item.status,
      action: "run-stage",
      message: `可以执行 ${stage}。`,
      requiresUser: false,
      commands: [commandFor(project, "run", stage)],
      issues: [],
    };
  }
  if (item.status === "running") {
    return {
      currentStage: stage,
      status: item.status,
      action: "wait",
      message: `${stage} 正在执行，暂时不要重复提交。`,
      requiresUser: false,
      commands: [],
      issues: [],
    };
  }
  if (item.status === "invalidated") {
    return {
      currentStage: stage,
      status: item.status,
      action: "resume-from-invalidated-stage",
      message: `${stage} 已被上游变化失效，应从当前项目的最早 ready 阶段恢复。`,
      requiresUser: false,
      commands: [commandFor(project, "resume")],
      issues: [],
    };
  }

  return {
    currentStage: stage,
    status: item.status,
    action: "inspect-previous-stage",
    message: `${stage} 当前状态为 ${item.status}，需要先检查前置阶段 ${previousStage(stage) ?? "无"}。`,
    requiresUser: false,
    commands: [commandFor(project, "status")],
    issues: [],
  };
}

export function buildProjectReport(project) {
  const next = buildNextAction(project);
  return {
    schemaVersion: 1,
    harnessVersion: project.config.harnessVersion,
    slug: project.state.slug,
    currentStage: project.state.currentStage,
    next,
    stages: STAGES.map((stage) => {
      const item = project.state.stages[stage];
      return {
        stage,
        status: item.status,
        attempts: item.attempts,
        invalidatedBy: item.invalidatedBy,
        outputCount: item.outputs.length,
        error: item.error,
        updatedAt: item.updatedAt,
      };
    }),
  };
}
