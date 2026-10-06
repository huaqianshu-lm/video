import { visualSelfReviewPath } from "./visual-self-review.mjs";
import { productionContract, productionManualChecks, taskStages, usesUnifiedProduction } from "./production-contract.mjs";
import {
  requireWorkflowDefinition,
  retiredStageDefinition,
  workflowIsGateStage,
  workflowStageDefinition,
  workflowForProject,
} from "./workflows/registry.mjs";
import { getStyleDefinition, resolveStyleId } from "./styles.mjs";
import { matchesArtifactPath } from "./artifact-paths.mjs";
import { getPrototypeBaseline, remotionAlignmentPath } from "./remotion-alignment.mjs";
import { buildRemotionTimingPlanForProject } from "./remotion-timing.mjs";
import { validateProjectStage } from "./validation.mjs";

import {readVideoCover} from './video-cover.mjs';

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

function buildSingleTaskPacket(project) {
  const { config, state } = project;
  const workflow = requireWorkflowDefinition(config);
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
  const definition = workflowStageDefinition(project, stage);
  if (!definition) {
    if (retiredStageDefinition(stage)) {
      return {
        schemaVersion: 1,
        kind: "video-stage-task",
        harnessVersion: config.harnessVersion,
        project: {
          slug: state.slug,
          workflow: config.workflow,
          workflowVersion: config.workflowVersion,
          target: config.target,
          currentStage: stage,
          status: state.stages[stage]?.status ?? "unknown",
        },
        task: null,
        readOnly: true,
        message: "该项目保留旧版 Smoke Render 记录，仅供只读查看；当前生产流程不提供 Smoke 阶段任务。",
      };
    }
    throw new Error("Unknown stage: " + stage);
  }
  const item = state.stages[stage];
  const contract = definition.contract;
  const currentValidationIssues = validateProjectStage(project, stage);
  const inputs = artifactEntries(project, contract.inputStages);
  const outputs = artifactEntries(project, [stage]);
  const prototypeStage = "visual-prototype";
  if (stage === prototypeStage) {
    outputs.push({ stage, path: visualSelfReviewPath(project), status: "unverified", exists: matchesArtifactPath(config.workspaceRoot, visualSelfReviewPath(project)) });
    outputs.push({ stage, path: `${config.sourceDirectory}/visual-review/*`, status: "unverified", exists: false });
  }
  const styleReferencePaths = ["visual-script", prototypeStage].includes(stage)
    ? [style.path]
    : [];
  const prototypeReferencePaths = stage === prototypeStage && style.prototypeBaselinePath
    ? [style.prototypeBaselinePath]
    : [];
  const referencePaths = [...styleReferencePaths, ...prototypeReferencePaths, ...(["visual-script", prototypeStage, "gate-2", "remotion"].includes(stage) ? ["docs/VIDEO-PRODUCTION-RULES.md", "templates/video-production/visual-script.md"] : [])];
  const prototypeBaseline = stage === "remotion" ? getPrototypeBaseline(project) : null;
  let remotionTimingPlan = null;
  let remotionTimingPlanError = null;
  if (stage === "remotion" && workflow.timelineMode === "narrated-manifest") {
    try {
      remotionTimingPlan = buildRemotionTimingPlanForProject(project);
    } catch (error) {
      remotionTimingPlanError = error instanceof Error ? error.message : String(error);
    }
  }
  const gate3Review = state.stages["gate-3"]?.review;
  const remotionRebuildRequest = stage === "remotion"
    && state.stages.remotion?.invalidatedBy === "gate-3-rejected"
    && gate3Review?.decision === "rejected"
    && gate3Review.returnTo === "remotion"
    ? {
      gate: "gate-3",
      returnTo: "remotion",
      reason: gate3Review.reason,
      requirement: "必须针对上述驳回原因修改 Remotion 实现，并产生新的 Remotion 产物；不能只重新校验或原样返回现有文件。",
    }
    : null;
  if (stage === "remotion" && prototypeBaseline?.alignmentRequired !== false) {
    for (const outputPath of [
      remotionAlignmentPath(project),
      `${config.remotionDirectory}/*.tsx`,
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
    execute: workflowIsGateStage(project, stage)
      ? commandFor("run", state.slug, stage)
      : commandFor("run", state.slug, stage),
  };
  if (workflowIsGateStage(project, stage)) {
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
      seriesSelection: config.seriesSelection ?? null,
      cover: readVideoCover(project),
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
      currentValidationIssues,
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
      assetArchive: config.assetArchive,
      renderInputDirectory: config.renderInputDirectory,
      style: {
        id: style.id,
        version: style.version,
        path: style.path,
        description: style.description,
      },
      readPaths: [...uniquePaths(inputs), ...referencePaths],
      referencePaths,
      writePaths: uniquePaths(outputs),
      constraints: [
        "只处理当前阶段，不跳过前置阶段或提前执行下游阶段。",
        "只写入当前阶段声明的输出产物。",
        "完成输出后执行任务包中列出的校验命令。",
        ...(remotionRebuildRequest ? [
          "这是 Gate 3 驳回后的 Remotion 重制任务，必须先读取并处理 context.rebuildRequest，不能只做只读检查。",
          remotionRebuildRequest.requirement,
        ] : []),
        ...(stage === "visual-script" ? [
          "新 Visual Script 的每个 Scene 要写清视觉焦点、初始状态、关键事件的语义触发与可观察结果、完成态停留，以及旧主体让位和跨幕承接；不能只列出要放哪些卡片。教程片按口播语义规划。",
          "静置可以用于阅读和比较；运镜与动效只在它们帮助理解时使用，不以持续运动为目标。",
        ] : []),
        ...(stage === "visual-prototype" ? [
          "采用轻量动态分镜：估算节奏、稳定事件 ID、口播语义提示；支持播放、暂停、重播和切幕，不读取或生成下游 TTS、正式字幕或实际 Timeline。",
          "完成实际动态画面检查后写 visual-self-review.json（契约见 docs/VIDEO-PRODUCTION-RULES.md），证据路径相对于视频资料目录。未观看画面必须记录未通过，不得以源码、截图存在或模板输出假造 passed。",
          `必须读取并复用 ${style.prototypeBaselinePath} 的完整原型基线：shell、toolbar、stage、section.scene、caption、controls、progress 和 meta。`,
          "系列标识、每个 Scene 左上有资料依据的简短内容文字、PATH／幕数、右上导航、幕内字幕和底部进度区保持基线位置；左上省略 SCENE／场景编号和固定大标题。必要的文字说明随主体对象或视觉证据出现，不用标题加卡片组织每一幕。历史已冻结原型可按旧基线只读展示。",
          "原型要能正常速度预览关键事件的前态、动作、后态、主体让位和跨幕承接；阅读停留可保持稳定，不能用静态布局或所有元素依次淡入代替动态分镜。",
          "不得只复制 class 名称后另起页面布局、定位规则、色彩系统或 Scene 容器格式；完成后必须通过基线结构和布局校验。",
        ] : []),
        ...(stage === "gate-2" ? [
          "人工检查实际动态原型：每幕焦点、信息变化、完成态阅读停留、旧主体让位和跨幕关系均须与 Visual Script 一致；结构检查通过不能代替观看画面。",
        ] : []),
        ...(stage === "remotion" && workflow.timelineMode === "narrated-manifest" ? [
          "Gate 2 冻结的 Visual Script 与 Visual Prototype 是 Remotion 的强制视觉基线。",
          "新基线的画布左上只保留简短内容文字，不显示 Scene／场景编号或固定大标题；历史已冻结的大标题原型不得未经人工 Gate 2 重新确认而单改 Remotion。",
          "对照冻结原型实现每个关键事件的前态、动作和后态，处理旧主体的让位与跨幕承接；不能把执行、扫描、连接、状态改变全部实现为相同的淡入上浮。允许与口播匹配的稳定阅读段。",
          "必须读取并校验冻结的 tts-script.json，以及由它生成的 Audio Manifest、Subtitle Manifest 和 Timeline Manifest；四类产物共同构成当前视频的声音与时间输入。",
          "Timeline Manifest 是唯一时间基准，tts-script.json 只用于确认 Scene／Segment 文本和 ID 边界，不能使用其他口播文本或旧音频资料替代。",
          "对于有口播的视频，必须先读取 context.timingPlan，并以其中的 Timeline 时间坐标制作 Scene 时长、音频位置、字幕位置和动画事件；不得使用估算时长或任意硬编码时间替代映射。",
          "如果 Scene／Segment／Cue 映射缺失或时长不一致，必须停止制作并报告原因。",
          ...(remotionTimingPlanError ? [`当前无法生成 context.timingPlan：${remotionTimingPlanError}`] : []),
          "必须逐 Scene 生成 schemaVersion 2 的 remotion-alignment.json，记录 Timeline 来源、Scene 起止秒／帧、Audio Segment、Subtitle Cue，以及每个视觉事件绑定的 Cue／Segment 和时间点；不能只记录布局文字。",
          "每个需要延迟出现的画面元素都必须在 remotion-alignment.json 的 visualElements 中声明，并通过 bindingId 一对一绑定命名 visualBindings；箭头、连线和关系标签必须声明依赖项，并从所有依赖项中最晚的显示帧开始。实现文件必须声明 implementationSymbols，禁止使用 Cue 数组下标、任意 fallback 帧、固定间隔推算或默认从 Scene 起始帧显示。",
          "Remotion Agent 不得写入或修改受跟踪的 src/Root.tsx；产物完成后由 Harness 从当前视频已校验的独立输入包生成被忽略的 src/RenderInputRoot.tsx，校验和 Studio 预览只使用这个临时入口。",
        ] : []),
      ],
      ...(stage === "remotion" ? { prototypeBaseline } : {}),
      ...(stage === "remotion" && workflow.timelineMode === "narrated-manifest" ? { timingPlan: remotionTimingPlan } : {}),
      ...(stage === "remotion" && remotionTimingPlanError ? { timingPlanError: remotionTimingPlanError } : {}),
      ...(remotionRebuildRequest ? { rebuildRequest: remotionRebuildRequest } : {}),
    },
  };
}

export function buildTaskPacket(project) {
  const packet = buildSingleTaskPacket(project);
  packet.project.productionContract = productionContract(project);
  if (!packet.task) return packet;
  packet.task.manualChecks = productionManualChecks(project, workflowStageDefinition(project, packet.task.stage));
  const stages = taskStages(project);
  packet.task.stages = stages;
  if (packet.task.stage === "render") packet.task.commands.execute = `node harness/src/cli.mjs render-delivery prepare ${project.state.slug}`;
  if (usesUnifiedProduction(project) && packet.task.stage === "subtitle-timeline") {
    for (const directory of ["audio", "subtitles"]) {
      const outputPath = `${project.config.remotionDirectory}/generated/${directory}/**/*`;
      packet.task.outputArtifacts.push({ stage: "subtitle-timeline", path: outputPath, status: "unverified", exists: false });
      packet.context.writePaths.push(outputPath);
    }
  }
  if (stages.length > 1) {
    const parts = stages.map((stage) => buildSingleTaskPacket({ ...project, state: { ...project.state, currentStage: stage } }));
    packet.task.objective = "一次完成内容分析、视频叙事和场景脚本策划；保持三份文件职责，全部校验通过后完成内部审查。";
    packet.task.outputArtifacts = parts.flatMap((part) => part.task.outputArtifacts);
    packet.context.writePaths = uniquePaths(packet.task.outputArtifacts);
    packet.task.validation = [...new Set(parts.flatMap((part) => part.task.validation))];
    packet.task.nextStage = "narration-script";
    packet.task.commands.validateAll = stages.map((stage) => commandFor("validate", project.state.slug, stage));
    packet.context.constraints[0] = "本任务合并 task.stages 声明的策划阶段；只制作这些阶段，不能提前制作口播或视觉资料。";
  }
  if (usesUnifiedProduction(project) && packet.task.executor === "agent" && !["source", "tts"].includes(packet.task.stage)) {
    packet.task.commands.claim = `node harness/src/cli.mjs production-task claim ${project.state.slug}`;
    packet.task.commands.complete = 'node harness/src/cli.mjs production-task complete <task-id> --summary "<制作说明>"';
  }
  return packet;
}
