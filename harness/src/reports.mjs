import {
  isGateStage,
  previousStage,
  returnToStages,
  RETIRED_STAGE_DEFINITIONS,
  stagesForProjectView,
  STAGE_DEFINITIONS,
  STAGES,
} from "./stages.mjs";
import { validateStage } from "./runner.mjs";
import { hasAssetSource } from "./asset-bundler.mjs";
import { validateRemoteRenderPackage } from "./remote-executor.mjs";
import { isGitWorkspace, validateGitRenderDelivery } from "./git-delivery.mjs";

function commandFor(project, command, stage = null) {
  const suffix = stage ? ` ${stage}` : "";
  return `node harness/src/cli.mjs ${command} ${project.state.slug}${suffix}`;
}

function executeCommandFor(stage) {
  return stage === "render" ? "remote-run" : "run";
}

function isBlockingPreExecutionIssue(stage, issue) {
  if (issue.severity === "warning") return false;
  if (STAGE_DEFINITIONS[stage]?.executor === "agent" && issue.code === "missing-artifact") {
    return false;
  }
  if (stage === "remotion" && STAGE_DEFINITIONS[stage]?.executor === "agent" && issue.code === "missing-remotion-alignment") {
    return false;
  }
  return true;
}

function remoteDeliveryIssues(project, stage) {
  if (!(stage === "render" && isGitWorkspace(project.config.workspaceRoot))) return [];
  return [
    ...validateRemoteRenderPackage(project).map((message) => ({
      code: "remote-render-inputs-invalid",
      stage,
      path: null,
      message,
      severity: "error",
    })),
    ...validateGitRenderDelivery(project).map((message) => ({
      code: "git-render-delivery-invalid",
      stage,
      path: null,
      message,
      severity: "error",
    })),
  ];
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
  if (!STAGE_DEFINITIONS[stage]) {
    const retiredDefinition = RETIRED_STAGE_DEFINITIONS[stage];
    if (retiredDefinition) {
      return {
        currentStage: stage,
        status: item?.status ?? "unknown",
        action: "inspect",
        message: "该项目保留旧版 Smoke Render 记录，仅供只读查看；当前生产流程不提供 Smoke 阶段操作。",
        requiresUser: false,
        readOnly: true,
        legacy: true,
        commands: [],
        issues: [],
        manualChecks: retiredDefinition.manualChecks,
      };
    }
    return {
      currentStage: stage,
      status: item?.status ?? "unknown",
      action: "inspect",
      message: "未知阶段只能只读检查：" + stage,
      requiresUser: false,
      readOnly: true,
      commands: [],
      issues: [],
    };
  }
  const issues = item.status === "ready"
    ? [...validateStage(project, stage), ...remoteDeliveryIssues(project, stage)]
    : [];
  const blockingIssues = issues.filter((issue) => isBlockingPreExecutionIssue(stage, issue));
  if (item.status === "waiting" && isGateStage(stage)) {
    return {
      currentStage: stage,
      status: item.status,
      action: "approve-or-reject-gate",
      message: `等待人工确认 ${stage}。通过后继续，驳回时必须指定回退阶段和原因。`,
      requiresUser: true,
      commands: [commandFor(project, "approve", stage)],
      issues,
      manualChecks: STAGE_DEFINITIONS[stage].manualChecks,
      returnToStages: returnToStages(stage),
      recommendedReturnTo: STAGE_DEFINITIONS[stage].fallbackStage,
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
    const remoteStage = stage === "render";
    return {
      currentStage: stage,
      status: item.status,
      action: "fix-validation-issues",
      message: remoteStage
        ? `${stage} 暂不能提交远程任务，交付预检发现 ${blockingIssues.length} 个阻塞问题。`
        : `${stage} 还有 ${blockingIssues.length} 个阻塞性校验问题，修复后才能执行。`,
      requiresUser: false,
      commands: [commandFor(project, "validate", stage)],
      issues,
      preparation: stage === "render" && hasAssetSource(project)
        ? {
          action: "prepare-remote-render",
          message: "本地视频资料和资源已存在，可以先整理独立远程输入包；随后仍需配置输入包地址并完成能力代码交付预检。",
        }
        : null,
    };
  }
  if (item.status === "ready") {
    if (stage === "remotion" && item.invalidatedBy === "gate-3-rejected") {
      return {
        currentStage: stage,
        status: item.status,
        action: "run-stage",
        message: "Gate 3 已驳回 Remotion，必须重新制作并产生变化后才能再次验证 Gate 3。",
        requiresUser: false,
        commands: [commandFor(project, "run", stage)],
        issues: [],
      };
    }
    return {
      currentStage: stage,
      status: item.status,
      action: "run-stage",
      message: `可以执行 ${stage}。`,
      requiresUser: false,
      commands: [commandFor(project, executeCommandFor(stage), stage)],
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
    stages: stagesForProjectView(project).map((stage) => {
      const item = project.state.stages[stage];
      const definition = STAGE_DEFINITIONS[stage] ?? RETIRED_STAGE_DEFINITIONS[stage];
      return {
        stage,
        status: item?.status ?? "unknown",
        attempts: item?.attempts ?? 0,
        invalidatedBy: item?.invalidatedBy ?? null,
        outputCount: item?.outputs?.length ?? 0,
        review: item?.review ?? null,
        error: item?.error ?? null,
        manualChecks: definition?.manualChecks ?? [],
        updatedAt: item?.updatedAt ?? null,
      };
    }),
  };
}
