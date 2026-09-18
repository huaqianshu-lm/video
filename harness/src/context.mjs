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
  const prototypeStage = workflow.timelineMode === "visual-beats" ? "motion-prototype" : "visual-prototype";
  const styleReferencePaths = ["visual-script", prototypeStage].includes(stage)
    ? [style.path]
    : [];
  const prototypeReferencePaths = stage === prototypeStage && style.prototypeBaselinePath
    ? [style.prototypeBaselinePath]
    : [];
  const referencePaths = [...styleReferencePaths, ...prototypeReferencePaths];
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
        ...(["visual-prototype", "motion-prototype"].includes(stage) ? [
          `必须读取并复用 ${style.prototypeBaselinePath} 的完整原型基线：shell、toolbar、stage、section.scene、caption、controls、progress 和 meta。`,
          "系列标题、每个 Scene 的唯一标题区、PATH／幕数、右上导航、幕内字幕和底部进度区必须保持基线位置与排版；每个 Scene 的标题区至少包含 eyebrow 和 h1／title，统一位于左上安全区域，禁止缺失、重复、居中或由 Scene 专属样式改位；只替换当前视频内容、Scene 数量和 Scene 内部视觉事件。",
          "不得只复制 class 名称后另起页面布局、定位规则、色彩系统或 Scene 容器格式；完成后必须通过基线结构和布局校验。",
        ] : []),
        ...(stage === "remotion" && workflow.timelineMode === "narrated-manifest" ? [
          "Gate 2 冻结的 Visual Script 与 Visual Prototype 是 Remotion 的强制视觉基线。",
          "必须读取并校验冻结的 tts-script.json，以及由它生成的 Audio Manifest、Subtitle Manifest 和 Timeline Manifest；四类产物共同构成当前视频的声音与时间输入。",
          "Timeline Manifest 是唯一时间基准，tts-script.json 只用于确认 Scene／Segment 文本和 ID 边界，不能使用其他口播文本或旧音频资料替代。",
          "对于有口播的视频，必须先读取 context.timingPlan，并以其中的 Timeline 时间坐标制作 Scene 时长、音频位置、字幕位置和动画事件；不得使用估算时长或任意硬编码时间替代映射。",
          "如果 Scene／Segment／Cue 映射缺失或时长不一致，必须停止制作并报告原因。",
          ...(remotionTimingPlanError ? [`当前无法生成 context.timingPlan：${remotionTimingPlanError}`] : []),
          "必须逐 Scene 生成 schemaVersion 2 的 remotion-alignment.json，记录 Timeline 来源、Scene 起止秒／帧、Audio Segment、Subtitle Cue，以及每个视觉事件绑定的 Cue／Segment 和时间点；不能只记录布局文字。",
          "每个需要延迟出现的画面元素都必须在 remotion-alignment.json 的 visualElements 中声明，并通过 bindingId 一对一绑定命名 visualBindings；箭头、连线和关系标签必须声明依赖项，并从所有依赖项中最晚的显示帧开始。实现文件必须声明 implementationSymbols，禁止使用 Cue 数组下标、任意 fallback 帧、固定间隔推算或默认从 Scene 起始帧显示。",
          "Remotion Agent 不得写入或修改受跟踪的 src/Root.tsx；产物完成后由 Harness 从当前视频已校验的独立输入包生成被忽略的 src/RenderInputRoot.tsx，校验和 Studio 预览只使用这个临时入口。",
        ] : []),
        ...(stage === "remotion" && workflow.timelineMode === "visual-beats" ? [
          "Gate 2 冻结的 Visual Script 与 Motion Prototype 是 Remotion 的强制视觉基线。",
          "必须读取并校验 asset-manifest.json 和 visual-timeline.json；Visual Timeline 是宣传片唯一时间基准，不得生成或使用 TTS、字幕或 narrated Timeline 作为替代。",
          "必须逐 Scene 对齐 Scene、Beat、Transition、屏幕文字、素材、实现文件和组件符号；不得使用固定间隔估算或在渲染时联网抓取素材。",
          "最终 Composition 不得包含预览导航、进度、控件、调试标记或辅助说明；Remotion Agent 不得写入或修改受跟踪的 src/Root.tsx。",
        ] : []),
      ],
      ...(stage === "remotion" ? { prototypeBaseline } : {}),
      ...(stage === "remotion" && workflow.timelineMode === "narrated-manifest" ? { timingPlan: remotionTimingPlan } : {}),
      ...(stage === "remotion" && remotionTimingPlanError ? { timingPlanError: remotionTimingPlanError } : {}),
      ...(remotionRebuildRequest ? { rebuildRequest: remotionRebuildRequest } : {}),
    },
  };
}
