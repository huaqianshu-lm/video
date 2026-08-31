import {
  STAGE_DEFINITIONS,
  getWorkflowDefinition,
  isGateStage,
} from "./stages.mjs";
import { getStyleDefinition, resolveStyleId } from "./styles.mjs";
import { matchesArtifactPath } from "./artifact-paths.mjs";
import { getPrototypeBaseline, remotionAlignmentPath } from "./remotion-alignment.mjs";

function commandFor(command, slug, stage = null) {
  const suffix = stage ? ` ${stage}` : "";
  return `node harness/src/cli.mjs ${command} ${slug}${suffix}`;
}

function artifactEntries(project, stages) {
  const workspaceRoot = project.config.workspaceRoot;
  return stages.flatMap((stage) =>
    (project.artifacts.stages[stage] ?? []).map((artifact) => ({
      stage,
      path: artifact.path,
      status: artifact.status,
      exists: matchesArtifactPath(workspaceRoot, artifact.path),
    })),
  );
}

function uniquePaths(entries) {
  return [...new Set(entries.map(({ path: artifactPath }) => artifactPath))];
}

export function buildTaskPacket(project) {
  const { config, state } = project;
  const workflow = getWorkflowDefinition(config.workflow);
  if (!workflow) {
    throw new Error(`Unknown workflow: ${config.workflow}`);
  }
  const styleId = resolveStyleId(config, state.slug);
  const style = getStyleDefinition(styleId);
  if (!style) {
    throw new Error(`Unknown style: ${styleId}`);
  }

  if (state.currentStage === "completed") {
    return {
      schemaVersion: 1,
      kind: "video-stage-task",
      harnessVersion: config.harnessVersion,
      project: {
        slug: state.slug,
        workflow: config.workflow,
        workflowVersion: config.workflowVersion,
        style: style.id,
        styleVersion: style.version,
        target: config.target,
        currentStage: "completed",
      },
      task: null,
      message: "所有阶段已完成，没有待执行的单阶段任务。",
    };
  }

  const stage = state.currentStage;
  const definition = STAGE_DEFINITIONS[stage];
  const item = state.stages[stage];
  const contract = definition.contract;
  const inputs = artifactEntries(project, contract.inputStages);
  const outputs = artifactEntries(project, [stage]);
  const prototypeBaseline = stage === "remotion" ? getPrototypeBaseline(project) : null;
  if (stage === "remotion" && prototypeBaseline?.alignmentRequired !== false) {
    for (const outputPath of [
      remotionAlignmentPath(project),
      `src/videos/${config.slug}/*.tsx`,
      "src/Root.tsx",
    ]) {
      outputs.push({
        stage,
        path: outputPath,
        status: "unverified",
        exists: matchesArtifactPath(config.workspaceRoot, outputPath),
      });
    }
  }
  const commands = {
    validate: commandFor("validate", state.slug, stage),
    execute: isGateStage(stage)
      ? commandFor("run", state.slug, stage)
      : commandFor("run", state.slug, stage),
  };
  if (isGateStage(stage)) {
    commands.approve = commandFor("approve", state.slug, stage);
    commands.reject = `node harness/src/cli.mjs reject ${state.slug} ${stage} --return-to <stage> --reason "<reason>"`;
  }

  return {
    schemaVersion: 1,
    kind: "video-stage-task",
    harnessVersion: config.harnessVersion,
    project: {
      slug: state.slug,
      workflow: config.workflow,
      workflowVersion: config.workflowVersion,
      style: style.id,
      styleVersion: style.version,
      target: config.target,
      currentStage: stage,
      status: item.status,
    },
    task: {
      stage,
      order: definition.order,
      objective: contract.objective,
      executor: contract.executor,
      status: item.status,
      inputStages: contract.inputStages,
      inputArtifacts: inputs,
      outputArtifacts: outputs,
      validation: contract.validation,
      manualChecks: contract.manualChecks,
      fallbackStage: contract.fallbackStage,
      nextStage: contract.nextStage,
      requiresApproval: definition.requiresApproval,
      requiresAdapter: definition.requiresAdapter,
      commands,
    },
    context: {
      workspaceRoot: config.workspaceRoot,
      sourceDirectory: config.sourceDirectory,
      remotionDirectory: config.remotionDirectory,
      style: {
        id: style.id,
        version: style.version,
        path: style.path,
        description: style.description,
      },
      readPaths: uniquePaths(inputs),
      writePaths: uniquePaths(outputs),
      constraints: [
        "只处理当前阶段，不跳过前置阶段或提前执行下游阶段。",
        "只写入当前阶段声明的输出产物。",
        "完成输出后执行任务包中列出的校验命令。",
        ...(stage === "remotion" ? [
          "Gate 2 冻结的 Visual Script 与 Visual Prototype 是 Remotion 的强制视觉基线。",
          "必须逐 Scene 生成 remotion-alignment.json，记录布局、视觉事件、屏幕文字和实现文件。",
        ] : []),
      ],
      ...(stage === "remotion" ? { prototypeBaseline } : {}),
    },
  };
}
