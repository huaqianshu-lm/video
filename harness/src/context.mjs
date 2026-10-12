import { storyboardReview, storyboardTimingEvents, storyboardImplementationTiming } from "./storyboard.mjs";
import { storyboardSchemaVersion, STORYBOARD_DESIGN_REFERENCES, STORYBOARD_SHARED_REFERENCES } from "./storyboard-design.mjs";
import { buildStoryboardReview } from "./storyboard-review.mjs";
import { visualSelfReviewPath } from "./visual-self-review.mjs";
import { productionContract, productionManualChecks, taskStages, usesUnifiedProduction, usesStoryboardProduction } from "./production-contract.mjs";
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
  if (["tts", "subtitle-timeline"].includes(packet.task.stage)) {
    packet.context.referencePaths.push("docs/TTS-SETUP.md");
    packet.context.readPaths.push("docs/TTS-SETUP.md");
    packet.context.constraints.push("首次申请 TTS 宿主／网络执行权限前，按 docs/TTS-SETUP.md 核对真实授权记录，在该次 justification 附记录路径及相关原文、冻结输入、Edge TTS 目的地、+25% 语速、输出范围和缓存选择；不能只写已授权或等拒绝后补证据。已有同范围授权不重复询问，其他项目不继承本项目授权；拒绝后不得绕过工具审批。");
  }
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
    const convergence = stages.includes("storyboard");
    packet.task.objective = convergence ? "先按内容组织 Scene、设计 Shot 观看方式与 Event 变化，再编写纯口播，与 Storyboard 一起收敛；两份产物全部校验通过后请求 Gate 2。" : usesStoryboardProduction(project) ? "一次完成内容分析与视频叙事，全部校验后内部审查。" : "一次完成内容分析、视频叙事和场景脚本策划；保持三份文件职责，全部校验通过后完成内部审查。";
    packet.task.outputArtifacts = parts.flatMap((part) => part.task.outputArtifacts);
    packet.task.inputStages = [...new Set(parts.flatMap(part => part.task.inputStages))].filter(stage => !stages.includes(stage));
    packet.task.inputArtifacts = artifactEntries(project, packet.task.inputStages);
    packet.context.readPaths = [...new Set([...uniquePaths(packet.task.inputArtifacts), ...packet.context.referencePaths])];
    packet.context.writePaths = uniquePaths(packet.task.outputArtifacts);
    packet.task.validation = [...new Set(parts.flatMap((part) => part.task.validation))];
    packet.task.nextStage = convergence ? "gate-2" : "narration-script";
    packet.task.commands.validateAll = stages.map((stage) => commandFor("validate", project.state.slug, stage));
    packet.context.constraints[0] = "本任务合并 task.stages 声明的阶段；只制作这些阶段，不提前执行下游。";
  }
  if (usesStoryboardProduction(project)) {
    const dataVersion = storyboardSchemaVersion(project);
    packet.context.referencePaths = packet.context.referencePaths.filter(file => !file.includes("visual-script") && !file.includes("visual-prototype"));
    packet.context.referencePaths.push(packet.context.style.path, "docs/STORYBOARD-PRODUCTION-CONTRACT.md", "docs/STORYBOARD-EXECUTION-QUALITY.md", "templates/video-production/storyboard-quality-audit.md", "templates/video-production/storyboard.json", "templates/video-production/storyboard.schema.json");
    packet.context.readPaths = [...new Set([...packet.context.readPaths.filter(file => !file.includes("visual-script") && !file.includes("visual-prototype")), ...packet.context.referencePaths])];
    packet.context.constraints = packet.context.constraints.filter(text => !/原型|schemaVersion 2/.test(text));
    packet.context.constraints.push("Storyboard 是唯一场景／视觉方案；口播只写 narration-script.md，分镜以 narrationRef 引用，不制作旧 Scene／Visual Script 或 HTML 原型。", "分镜写明视觉焦点、变化链、稳定事件 ID、唯一口播语义锚点、文字依据、停留和衔接；不写正式估算秒数。实际画面与试听在 Gate 3 检查。");
    packet.context.constraints.push(`按 storyboard-execution-quality-v2 审计每个 Scene／Shot／Event 的完整对象、生命周期、请求／结果身份、标题让位与跨幕承接；本任务分镜数据版本为 ${dataVersion}，不得自行更换版本。设计／源码检查不能代替 Gate 3 实际观看与正常速度试听，实现入口验证状态以 ROADMAP 为准。`);
    if (dataVersion >= 2) {
      packet.context.referencePaths = packet.context.referencePaths.filter(p => !["templates/video-production/storyboard.json", "templates/video-production/storyboard.schema.json"].includes(p));
      packet.context.readPaths = packet.context.readPaths.filter(p => !["templates/video-production/storyboard.json", "templates/video-production/storyboard.schema.json"].includes(p));
      packet.context.referencePaths.push("templates/video-production/storyboard-v3.json");
      packet.context.readPaths.push("templates/video-production/storyboard-v3.json");
      packet.context.referencePaths.push(...STORYBOARD_DESIGN_REFERENCES);
      packet.context.readPaths.push(...STORYBOARD_DESIGN_REFERENCES);
      packet.context.constraints.push("制作与审核读取 VIDEO-PRODUCTION-RULES.md 9.6、9.7、14.4：量化数值只以 9.6 为准；构图留白、字体层级、配色材质、动作呼吸、连续交接及声音画面的审美与感官设计按 14.4 写入现有 SQ evidence／note。Gate 3 在观看 checks／scenes 的 note 与 listening.note 中记录真实帧、实际发现、修正和遗留问题，未观看保持 pending；参数调校配方未经实际观看与适用人工 Gate 不得声称已验证，不新增 JSON 字段或自动审美评分。");
      packet.context.storyboardSchemaVersion = dataVersion;
      packet.context.constraints.push("现行分镜按 Scene → Shot → Event 设计观看方式与变化，再选择组件；使用对象类型、父子关系、事件边界和 execution 能力。动作 durationFrames 是动作持续参数，不是口播起点；正式事件时间只能来自真实 Timeline。逐镜头 shotChecks 及每个事件的 SQ-1～SQ-10 设计审计必须绑定当前 designInputVersion，不能自动声称实际画面已观看。");
      packet.context.constraints.push("Shot 首尾连续覆盖 Scene，后续起点用 anchor／occurrence 绑定真实 Cue 起点；无词级时间时不能猜 Cue 内切点。可见对象不等于新建身份；同镜多个 Event 允许，不规定最少镜头数，不新增画面执行器。alignment 5 记录 Shot 区间及实现文件／符号和转场，观看证据 2 逐 Shot／交界留真实证据，未观看保持 pending。旧格式仅历史读取，继续制作先正常返工。");
      if (stages.includes("storyboard")) {
        const auditPath = `${project.config.sourceDirectory}/storyboard-design-audit.json`;
        if (!packet.task.outputArtifacts.some(item => item.path === auditPath)) packet.task.outputArtifacts.push({ stage: "storyboard", path: auditPath, status: "unverified", exists: false });
        if (!packet.context.writePaths.includes(auditPath)) packet.context.writePaths.push(auditPath);
        packet.context.storyboardDesignInputs = storyboardReview(project);
      }
    }
    if (stages.includes("storyboard")) {
      const outputPath = `${project.config.sourceDirectory}/storyboard-assets/*`;
      packet.task.outputArtifacts.push({ stage: "storyboard", path: outputPath, status: "optional", exists: false });
      packet.context.writePaths.push(outputPath);
    }
    if (packet.task.stage === "gate-2") {
      packet.context.storyboardReview = buildStoryboardReview(project);
      packet.task.commands.review = commandFor("storyboard-review", project.state.slug);
      packet.task.commands.approve += ` --review-version ${packet.context.storyboardReview.reviewVersion}`;
    }
    if (packet.task.stage === "remotion") {
      packet.context.storyboardReview = storyboardReview(project);
      try { packet.context.storyboardTimingEvents = storyboardTimingEvents(project, packet.context.timingPlan); } catch (error) { packet.context.storyboardTimingError = error.message; }
      if (dataVersion >= 2) {
        packet.context.referencePaths.push(...STORYBOARD_SHARED_REFERENCES);
        packet.context.readPaths.push(...STORYBOARD_SHARED_REFERENCES);
        try { packet.context.storyboardTimingPlan = storyboardImplementationTiming(project, packet.context.timingPlan); }
        catch (error) { packet.context.storyboardTimingError = error.message; }
        packet.context.constraints.push("现行分镜由 Agent 按冻结 Scene／Shot／Event和真实 Timeline 编写 React／Remotion 组件及 storyboard-authored-alignment 5，由 Agent 编写当前视频组件。使用 render-input prepare／entry 生成 Studio 预览，实际逐 Shot、镜头交界和 Event 观看及完整试听后填写 remotion-viewing-evidence.json；没有观看不得填写 pass。方案不符返回分镜／Gate 2，实现不符修正当前视频组件。人工 Gate 3 保留。");
        const evidencePath = `${project.config.sourceDirectory}/remotion-viewing-evidence.json`;
        packet.context.writePaths.push(evidencePath);
        packet.task.outputArtifacts.push({stage: "remotion", path: evidencePath, status: "unverified", exists: false});
      } else packet.context.constraints.push("逐 Scene／Event 对齐冻结分镜；alignment 使用 schemaVersion 3、storyboardFingerprint、reviewVersion，事件通过命名 visualBindings 绑定实际 Cue／Segment 和时间。不得以估算秒数替代真实 Timeline。");
    }
  }
  if (usesUnifiedProduction(project) && packet.task.executor === "agent" && !["source", "tts"].includes(packet.task.stage)) {
    packet.task.commands.claim = `node harness/src/cli.mjs production-task claim ${project.state.slug}`;
    packet.task.commands.complete = 'node harness/src/cli.mjs production-task complete <task-id> --summary "<制作说明>"';
  }
  return packet;
}
