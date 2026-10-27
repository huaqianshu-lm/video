import { withStoryboardRead, storyboardReview, storyboardTimingEvents, storyboardImplementationTiming } from "./storyboard.mjs";
import { storyboardDesignReferences, storyboardSchemaVersion, STORYBOARD_SHARED_REFERENCES } from "./storyboard-design.mjs";
import { buildStoryboardReview } from "./storyboard-review.mjs";
import { visualSelfReviewPath } from "./visual-self-review.mjs";
import { productionContract, usesCurrentProduction, productionManualChecks, taskStages, usesUnifiedProduction, usesStoryboardProduction } from "./production-contract.mjs";
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
  const referencePaths = [...styleReferencePaths, ...prototypeReferencePaths, ...(["visual-script", prototypeStage, "gate-2", "remotion"].includes(stage) ? ["docs/VIDEO-PRODUCTION-RULES.md", "legacy/video-production/visual-script.md"] : [])];
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
  if (usesCurrentProduction(project) && project.state.currentStage !== "completed") return withStoryboardRead(project, buildCurrentTaskPacket);
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
    if (stages.some(stage => ["narration-script", "storyboard", "gate-2", "remotion"].includes(stage))) {
      packet.context.referencePaths.push("references/README.md");
      packet.context.readPaths.push("references/README.md");
      packet.context.constraints.push("设计／实现先读 references/README.md，按当前表达问题选择相关方法与案例；借鉴点和内容适配写进既有设计说明／SQ evidence／note，实际结果进入既有观看证据。案例观察值不是生产默认值；复现认可不等于原创、教程迁移或跨视频验收，不要求套用案例，不新增阶段、产物字段或自动画面生成。");
    }
    packet.context.referencePaths = packet.context.referencePaths.filter(file => !file.includes("visual-script") && !file.includes("visual-prototype"));
    packet.context.referencePaths.push(packet.context.style.path, "docs/STORYBOARD-PRODUCTION-CONTRACT.md", "docs/STORYBOARD-EXECUTION-QUALITY.md", "scaffolds/video-production/storyboard-quality-audit.md", "contracts/video-production/legacy/examples/storyboard-v1.json", "contracts/video-production/legacy/storyboard-v1.schema.json");
    packet.context.readPaths = [...new Set([...packet.context.readPaths.filter(file => !file.includes("visual-script") && !file.includes("visual-prototype")), ...packet.context.referencePaths])];
    packet.context.constraints = packet.context.constraints.filter(text => !/原型|schemaVersion 2/.test(text));
    packet.context.constraints.push("Storyboard 是唯一场景／视觉方案；口播只写 narration-script.md，分镜以 narrationRef 引用，不制作旧 Scene／Visual Script 或 HTML 原型。", "分镜写明视觉焦点、变化链、稳定事件 ID、唯一口播语义锚点、文字依据、停留和衔接；不写正式估算秒数。实际画面与试听在 Gate 3 检查。");
    packet.context.constraints.push(`按 storyboard-execution-quality-v2 审计每个 Scene／Shot／Event 的完整对象、生命周期、请求／结果身份、标题让位与跨幕承接；本任务分镜数据版本为 ${dataVersion}，不得自行更换版本。设计／源码检查不能代替 Gate 3 实际观看与正常速度试听，实现入口验证状态以 ROADMAP 为准。`);
    if (dataVersion >= 2) {
      packet.context.referencePaths = packet.context.referencePaths.filter(p => !["contracts/video-production/legacy/examples/storyboard-v1.json", "contracts/video-production/legacy/storyboard-v1.schema.json"].includes(p));
      packet.context.readPaths = packet.context.readPaths.filter(p => !["contracts/video-production/legacy/examples/storyboard-v1.json", "contracts/video-production/legacy/storyboard-v1.schema.json"].includes(p));
      const storyboardExample = dataVersion === 3
        ? "contracts/video-production/current/examples/storyboard.json"
        : "contracts/video-production/legacy/examples/storyboard-v2.json";
      const designReferences = storyboardDesignReferences(project);
      packet.context.referencePaths.push(storyboardExample, ...designReferences);
      packet.context.readPaths.push(storyboardExample, ...designReferences);
      packet.context.constraints.push("制作与审核读取 VIDEO-PRODUCTION-RULES.md 9.6、9.7、14.4：量化数值只以 9.6 为准；构图留白、字体层级、配色材质、动作呼吸、连续交接及声音画面的审美与感官设计按 14.4 写入现有 SQ evidence／note。Gate 3 在观看 checks／scenes 的 note 与 listening.note 中记录真实帧、实际发现、修正和遗留问题，未观看保持 pending；参数调校配方未经实际观看与适用人工 Gate 不得声称已验证，不新增 JSON 字段或自动审美评分。");
      packet.context.constraints.push("按 VIDEO-PRODUCTION-RULES.md 8.4 判断强调是否必要：只有需要观众此刻定位、操作或辨别的具体对象才突出，写明目标、理由、语义触发和退出；现有状态已清楚时不加框，不能默认每个 Cue 都用黄色框。章节标题是短暂视觉事件，不做常驻左上角导航，须按正文时间让位。判断记入现有 SQ evidence／note，不新增字段。");
      packet.context.storyboardSchemaVersion = dataVersion;
      packet.context.constraints.push("现行分镜按 Scene → Shot → Event 设计观看方式与变化，再选择组件；使用对象类型、父子关系、事件边界和 execution 能力。动作 durationFrames 是动作持续参数，不是口播起点；正式事件时间只能来自真实 Timeline。逐镜头 shotChecks 及每个事件的 SQ-1～SQ-10 设计审计必须绑定当前 designInputVersion，不能自动声称实际画面已观看。");
      packet.context.constraints.push("Shot 首尾连续覆盖 Scene，后续起点用 anchor／occurrence 绑定真实 Cue 起点；无词级时间时不能猜 Cue 内切点。可见对象不等于新建身份；同镜多个 Event 允许，不规定最少镜头数，不新增画面执行器。alignment 5 记录 Shot 区间及实现文件／符号和转场，观看证据 2 逐 Shot／交界留真实证据，未观看保持 pending。旧格式仅历史读取，继续制作先正常返工。");
      if (stages.includes("storyboard")) {
        packet.context.constraints.push("关键变化的导演决策按 STORYBOARD-EXECUTION-QUALITY.md「关键变化怎样完成导演决策」及 references/content-to-visual.md「把关键变化设计完整」执行：先确定行为成立的配置／权限／覆盖条件，推演整幅画面的完整状态（同一次执行或独立假设、所有保留记录和未执行层级），再共同设计口播与动作的含义，安排观众定位→追踪→阅读的注意力顺序，最后确定动作参数。按未解决的视觉疑问选择关键帧或短动画实验，必要观看无法完成时明确能力缺口与影响；抽帧与完整解码不能证明正常速度的运动观感。内部审查重新判断无声画面、声画共同含义和连续焦点交接，允许推翻原设计；不能以没有错误标签、没有重叠或复述创作意图判通过。决定及修正使用现有字段和 evidence／note，不新增审计项、必交样片或人工 Gate。");
        packet.context.constraints.push("本任务由制作 Agent 承担视觉导演责任，按 STORYBOARD-EXECUTION-QUALITY.md「导演创作与首次交付」创作：全片构思（理解难点、视觉主线、主要对象发展、重点和场景承接）→ 逐幕表达（把知识变成可见情境、关系和变化，说明理解收益）→ 镜头组织（构图、观看距离、层级、焦点交接、动作过程、阅读与衔接）→ 按难点画面推敲 → 全片统筹（信息密度、动静、重点、连续性）→ 实现选择与数据整理。口播和画面在冻结前共同收敛；不能按各段口播先套统一版式，再补导演描述。首次提交应当主要表达已经成立、可进入细节打磨，不能把主体、机制或大量镜头的重设计留给用户审核或下游 Remotion。");
        packet.context.constraints.push("内容理解落实为 Scene 情境、Shot 观看方式与 Event 前态／过程／后态，数量由表达需要决定；不规定镜头菜单、最少切换或动作名称多样性。全片构思依据既有 video-narrative.md，落实到 Scene／Shot／Event 与跨幕对象关系；任务完成 summary 概括主线、重点和待验范围，不代替具体设计。先读 references/content-to-visual.md 的完整设计推导；contracts 中合法 JSON 示例只解释格式，不是视觉质量基线。判断写入现有字段，不新增必交文档或运行时字段；写入脚本只能序列化已完成的设计，不能为所有镜头默认填入相同构图或相机。固定或单镜头可以成立，须按内容判断；量化基线只校准已确定的方案。");
        packet.context.constraints.push("画面推敲用于完成创作：先想清开始／关键变化中／结束的焦点和对象关系，文字无法确认的关键构图或动作按问题使用简略构图、关键状态图或短动画实验，实际查看后修正并在现有 evidence／note 说明范围。仅文字推演不得声称已观看；不要求逐幕完整预演，不增加强制工具、额外模型调用或人工 Gate。需要重设计的主要表达在本任务内解决，真实能力缺口具体报告。全片统筹后再作独立审查和结构校验，不能把检查当作导演创作。");
        packet.context.constraints.push("初稿后在同一任务内单独执行审查，再提交：从观众角度核对教学前提、具体命令／输入、示例对象、预期结果、匹配核对及不一致处理；逐 Scene／Shot 检查造型、构图、距离、焦点和隐喻，区分判断原则、产品能力与验证结果；通看整片检查机械重复、信息拥挤、平台混淆及缺少对照；对照按需选读的案例方法检查当前内容适配。重大问题先内部修订，再复查受影响部分，发现及修正写入既有 evidence／note；无法判断保持 pending。无需强行发现问题，禁止从创作描述拼接证据并无条件生成 pass。脚本只能整理真实审查判断和覆盖；结构校验与复查提示不能证明设计质量，不默认新增模型调用或强制样片。");
        packet.context.constraints.push("只向用户提交内部收敛的成熟方案，如实标注仍需实际观看判断的事项，不要求用户逐轮审核内部草稿。试点保留首次提交版本及画面依据，按用户反馈区分构图／速度／层级等打磨与主体／表达机制／大量镜头的重设计；首次设计成熟度由用户判断，不自动打分，不以审计 pass 或任务完成宣称质量提升。首条质量验收与跨视频稳定性分别留证，不修改 completed 视频作验证。");
        const auditPath = `${project.config.sourceDirectory}/storyboard-design-audit.json`;
        if (!packet.task.outputArtifacts.some(item => item.path === auditPath)) packet.task.outputArtifacts.push({ stage: "storyboard", path: auditPath, status: "unverified", exists: false });
        if (!packet.context.writePaths.includes(auditPath)) packet.context.writePaths.push(auditPath);
        packet.context.storyboardDesignInputs = storyboardReview(project);
      }
    }
    if (stages.some(stage => ["storyboard", "gate-2", "remotion"].includes(stage))) {
      packet.context.referencePaths.push("templates/README.md");
      packet.context.readPaths.push("templates/README.md");
      packet.context.constraints.push("先按内容和 references 完成画面设计，再查询视觉模板索引。只有表达任务、对象关系和适用条件匹配时才选择或改造模板；没有匹配项时按冻结分镜自行编写 React／Remotion。模板不自动生成分镜、不限制可用对象或动作，也不替代本视频 Gate 3 实际观看。");
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
        packet.context.constraints.push("Gate 3 预览必须加载本次正式 Remotion 组件、已校验独立输入包、真实音频与 Timeline；独立演示或旧 Studio 入口不能代替。正常速度检查标题转场卡顿／占时，以及口播提示时具体对象的强调是否同步；只有必要对象才用框，检查发现记入既有观看／试听证据。");
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

// Build the combined contract directly; never construct discarded per-stage packets.
function buildCurrentTaskPacket(project) {
  const { config, state } = project,
    stage = state.currentStage,
    stages = taskStages(project);
  const definition = workflowStageDefinition(project, stage);
  if (!definition) return buildSingleTaskPacket(project);
  const contracts = stages.map((id) => workflowStageDefinition(project, id).contract);
  const style = getStyleDefinition(resolveStyleId(config, state.slug));
  const inputStages = [...new Set(contracts.flatMap((c) => c.inputStages))].filter(
    (id) => !stages.includes(id),
  );
  const inputs = artifactEntries(project, inputStages),
    outputs = artifactEntries(project, stages);
  const designing = stages.includes("storyboard"),
    visual = designing || ["gate-2", "remotion"].includes(stage);
  const referencePaths = visual
    ? [
        ...new Set([
          style.path,
          "references/README.md",
          "templates/README.md",
          "contracts/video-production/current/examples/storyboard.json",
          ...storyboardDesignReferences(project),
        ]),
      ]
    : [];
  const readPaths = [...uniquePaths(inputs)];
  if (visual) readPaths.push("docs/STORYBOARD-PRODUCTION-CONTRACT.md", "references/README.md");
  if (designing)
    readPaths.push(
      "docs/STORYBOARD-EXECUTION-QUALITY.md",
      "contracts/video-production/current/storyboard.schema.json",
      "contracts/video-production/current/storyboard-design-audit.schema.json",
    );
  const constraints = [
    "只制作 task.stages，且只写 writePaths；对话用 complete／fail／resume 回传，后台完成产物后退出，由统一服务校验；不自动批准人工 Gate。",
  ];
  if (visual)
    constraints.push(
      "按内容设计 Scene → Shot → Event；先读 references/README.md 按问题选方法，再选模板或自行编写。Storyboard 是唯一视觉方案，纯口播只写 narration-script.md；实际观看与正常速度试听保留在 Gate 3。",
    );
  if (designing)
    constraints.push(
      "先按 STORYBOARD-EXECUTION-QUALITY.md 完成全片构思→逐幕表达→镜头组织→难点画面推敲→全片统筹，再整理数据并独立审查。主要表达在提交前内部收敛；紧凑审计 schemaVersion 3 绑定当前 designInputVersion，写全片 summary、reviewedSceneIds、status 和实际 findings，不逐事件十项或逐镜头重复填写；设计未决保持 pending，真实观看待验标 gate-3，不虚构已观看。",
    );
  const commands = {
    validate: commandFor("validate", state.slug, stage),
    execute: commandFor("run", state.slug, stage),
  };
  if (definition.requiresApproval) {
    commands.approve = commandFor("approve", state.slug, stage);
    commands.reject = `node harness/src/cli.mjs reject ${state.slug} ${stage} --return-to <stage> --reason "<reason>"`;
  }
  if (definition.contract.executor === "agent" && !["source", "tts"].includes(stage)) {
    commands.claim = `node harness/src/cli.mjs production-task claim ${state.slug}`;
    commands.complete = 'node harness/src/cli.mjs production-task complete <task-id> --summary "<制作说明>"';
    commands.fail = 'node harness/src/cli.mjs production-task fail <task-id> --reason "<原因>"';
    commands.resume = "node harness/src/cli.mjs production-task resume <task-id>";
  }
  const context = {
    workspaceRoot: config.workspaceRoot,
    sourceDirectory: config.sourceDirectory,
    remotionDirectory: config.remotionDirectory,
    assetArchive: config.assetArchive,
    renderInputDirectory: config.renderInputDirectory,
    style: { id: style.id, version: style.version, path: style.path, description: style.description },
    readPaths,
    referencePaths,
    writePaths: [],
    constraints,
  };
  const addOutput = (id, file, status = "unverified") => {
    if (!outputs.some((o) => o.path === file))
      outputs.push({
        stage: id,
        path: file,
        status,
        exists: matchesArtifactPath(config.workspaceRoot, file),
      });
  };
  if (visual) context.storyboardSchemaVersion = 3;
  if (designing) {
    addOutput("storyboard", `${config.sourceDirectory}/storyboard-design-audit.json`);
    addOutput("storyboard", `${config.sourceDirectory}/storyboard-assets/*`, "optional");
    const review = storyboardReview(project);
    const { designInputVersion, storyboardFingerprint, narrationFingerprint, issues } = review;
    context.storyboardDesignInputs = {
      designInputVersion,
      storyboardFingerprint,
      narrationFingerprint,
      issues,
    };
    commands.review = commandFor("storyboard-review", state.slug);
  }
  if (stage === "gate-2") {
    context.storyboardReview = buildStoryboardReview(project);
    commands.review = commandFor("storyboard-review", state.slug);
    commands.approve += ` --review-version ${context.storyboardReview.reviewVersion}`;
  }
  if (["tts", "subtitle-timeline"].includes(stage)) {
    readPaths.push("docs/TTS-SETUP.md");
    referencePaths.push("docs/TTS-SETUP.md");
    constraints.push(
      "按 docs/TTS-SETUP.md 核对冻结的纯口播 tts-script.json、provider 与真实授权记录；Edge 显式 +25%，百炼原速。申请宿主／网络权限时附授权原文、目的地和输入输出范围；已有同范围授权不重复询问，拒绝后不得绕过审批。音频、字幕及 Timeline 只从已校验 tts-script.json 派生。",
    );
    if (stage === "subtitle-timeline")
      for (const dir of ["audio", "subtitles"])
        addOutput(stage, `${config.remotionDirectory}/generated/${dir}/**/*`);
  }
  if (stage === "remotion") {
    context.prototypeBaseline = getPrototypeBaseline(project);
    context.storyboardReview = storyboardReview(project);
    readPaths.push(...STORYBOARD_SHARED_REFERENCES);
    referencePaths.push(...STORYBOARD_SHARED_REFERENCES);
    addOutput(stage, remotionAlignmentPath(project));
    addOutput(stage, `${config.remotionDirectory}/*.tsx`);
    addOutput(stage, `${config.sourceDirectory}/remotion-viewing-evidence.json`);
    try {
      context.timingPlan = buildRemotionTimingPlanForProject(project);
      context.storyboardTimingEvents = storyboardTimingEvents(project, context.timingPlan);
      context.storyboardTimingPlan = storyboardImplementationTiming(project, context.timingPlan);
    } catch (error) {
      if (!context.timingPlan) context.timingPlanError = error.message;
      else context.storyboardTimingError = error.message;
    }
    constraints.push(
      "由 Agent 按冻结分镜和 context.timingPlan／storyboardTimingPlan 编写 React／Remotion，保留 Scene／Shot／Event、Audio、Subtitle 映射；时间缺失即停止，不猜时间。提交 alignment 5 和当前真实画面／试听证据，未观看保持 pending。仅用独立输入包生成的 src/RenderInputRoot.tsx 预览，不修改 src/Root.tsx。审美与感官按 VIDEO-PRODUCTION-RULES.md 9.6、9.7、14.4 检查。",
    );
    const review = state.stages["gate-3"]?.review;
    if (
      state.stages.remotion?.invalidatedBy === "gate-3-rejected" &&
      review?.decision === "rejected" &&
      review.returnTo === "remotion"
    ) {
      context.rebuildRequest = {
        gate: "gate-3",
        returnTo: "remotion",
        reason: review.reason,
        requirement: "必须修改被驳回的 Remotion 实现，不能只校验或原样返回。",
      };
      constraints.push(context.rebuildRequest.requirement);
    }
  }
  if (stage === "render") commands.execute = `node harness/src/cli.mjs render-delivery prepare ${state.slug}`;
  context.readPaths = [...new Set(readPaths)];
  context.referencePaths = [...new Set(referencePaths)];
  context.writePaths = uniquePaths(outputs);
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
      status: state.stages[stage].status,
      productionContract: productionContract(project),
    },
    task: {
      stage,
      stages,
      order: definition.order,
      objective: designing
        ? "联合收敛纯口播与分镜，完成紧凑设计审查后提交 Gate 2。"
        : stages.length > 1
          ? "一次制作内容分析与视频叙事，全部校验后内部审查。"
          : definition.contract.objective,
      executor: definition.contract.executor,
      status: state.stages[stage].status,
      inputStages,
      inputArtifacts: inputs,
      outputArtifacts: outputs,
      validation: [...new Set(contracts.flatMap((c) => c.validation))],
      currentValidationIssues: stages.flatMap((id) => validateProjectStage(project, id)),
      manualChecks: productionManualChecks(project, definition),
      fallbackStage: definition.contract.fallbackStage,
      nextStage: designing
        ? "gate-2"
        : stages.length > 1
          ? "narration-script"
          : definition.contract.nextStage,
      requiresApproval: definition.requiresApproval,
      requiresAdapter: definition.requiresAdapter,
      commands,
    },
    context,
  };
}
