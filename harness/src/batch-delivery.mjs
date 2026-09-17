import { assertGitHubActionsReady } from "./diagnostics.mjs";
import { buildBatchGitRenderCommitPlan, commitAndPushBatchRenderDelivery, validateGitRenderDelivery } from "./git-delivery.mjs";
import { loadProject } from "./storage.mjs";
import { readRenderInputDelivery, validateRenderInputDelivery } from "./render-input.mjs";
import { prepareRemoteRenderInputs, validateRemoteRenderInputs, validateRemoteRenderPackage } from "./remote-executor.mjs";

const UNCOMMITTED_RENDER_ISSUE = /^渲染相关文件存在未提交修改：/;

function unique(values) {
  return [...new Set(values)];
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function videoRecord(batchId, project, preparation, gitPlan, issues, confirmationIssues) {
  let delivery = null;
  try {
    delivery = readRenderInputDelivery(project.config.workspaceRoot, project.config.slug);
  } catch {
    delivery = null;
  }
  const singleVideoPlan = gitPlan?.videoPlans?.find((item) => item.videoSlug === project.config.slug);
  return {
    batchId,
    slug: project.config.slug,
    status: issues.length === 0 && gitPlan ? "ready" : "blocked",
    issues: unique(issues),
    confirmationIssues: unique(confirmationIssues),
    compositionId: delivery?.compositionId ?? project.config.compositionId ?? project.config.slug,
    renderInputUrl: delivery?.url ?? null,
    renderInputSha256: delivery?.archiveSha256 ?? null,
    packageFingerprint: delivery?.packageFingerprint ?? null,
    deliveryBindingSha256: singleVideoPlan?.deliveryBindingSha256 ?? null,
    inputBindingPath: `local/render-input/${project.config.slug}.delivery.json`,
    packagePath: `local/render-input/${project.config.slug}`,
    archivePath: preparation?.archivePath ?? `local/render-input/${project.config.slug}.zip`,
    archiveSha256: preparation?.archiveSha256 ?? null,
    gitPlanId: singleVideoPlan?.planId ?? null,
    branch: gitPlan?.branch ?? null,
    dispatchRef: gitPlan?.ref ?? null,
    deliveryPlanId: null,
    commitSha: null,
    remoteJobId: null,
    runId: null,
    runUrl: null,
  };
}

export async function prepareBatchRenderDelivery(batch, {
  environment = process.env,
  githubPreflight = (options) => assertGitHubActionsReady(options),
  prepareInputs = prepareRemoteRenderInputs,
} = {}) {
  if (batch?.type !== "to-render") {
    const error = new Error("批量交付预检只支持 to-render 批次");
    error.code = "batch-render-delivery-type-invalid";
    throw error;
  }

  const projects = [];
  const videos = [];
  for (const item of batch.items ?? []) {
    const project = loadProject(item.slug, { refresh: true });
    const issues = [];
    const confirmationIssues = [];
    if (item.status !== "queued") {
      issues.push(`${item.slug} 当前批次状态为 ${item.status}，不能进入正式渲染交付`);
    }
    if (project.state.currentStage !== "render" || project.state.stages.render?.status !== "ready") {
      issues.push(`${item.slug} 尚未处于通过 Gate 3 后的 render/ready 状态，不能进入正式渲染交付`);
    }
    let preparation = null;
    let gitPlan = null;
    try {
      preparation = await prepareInputs(project);
    } catch (error) {
      issues.push(errorMessage(error));
    }

    issues.push(...validateRemoteRenderPackage(project));
    issues.push(...validateRemoteRenderInputs(project));
    issues.push(...validateRenderInputDelivery(project));
    try {
      await githubPreflight({ project, stage: "render", checkRenderInput: false });
    } catch (error) {
      issues.push(errorMessage(error));
    }

    const gitIssues = validateGitRenderDelivery(project);
    for (const issue of gitIssues) {
      if (UNCOMMITTED_RENDER_ISSUE.test(issue)) confirmationIssues.push(issue);
      else issues.push(issue);
    }
    try {
      gitPlan = buildBatchGitRenderCommitPlan([project], { environment });
      if (gitPlan.outOfScopePaths.length > 0) {
        issues.push(`发现未纳入当前视频渲染提交范围的改动：${gitPlan.outOfScopePaths.join("、")}`);
      }
      if (gitPlan.ref !== gitPlan.branch) {
        issues.push(`dispatch 分支 ${gitPlan.ref} 与当前工作区分支 ${gitPlan.branch} 不一致`);
      }
    } catch (error) {
      issues.push(errorMessage(error));
    }

    projects.push(project);
    videos.push(videoRecord(batch.id, project, preparation, gitPlan, issues, confirmationIssues));
  }

  let gitPlan = null;
  const planIssues = [];
  try {
    gitPlan = buildBatchGitRenderCommitPlan(projects, { environment });
    if (gitPlan.outOfScopePaths.length > 0) planIssues.push(`发现未纳入批量渲染提交范围的改动：${gitPlan.outOfScopePaths.join("、")}`);
  } catch (error) {
    planIssues.push(errorMessage(error));
  }

  const allIssues = unique([...videos.flatMap((video) => video.issues), ...planIssues]);
  const allConfirmationIssues = unique(videos.flatMap((video) => video.confirmationIssues));
  const status = allIssues.length > 0 || !gitPlan ? "blocked" : "needs-confirmation";
  for (const video of videos) video.deliveryPlanId = gitPlan?.planId ?? null;
  return {
    schemaVersion: 1,
    kind: "batch-render-delivery",
    batchId: batch.id,
    status,
    generatedAt: new Date().toISOString(),
    issues: allIssues,
    confirmationIssues: allConfirmationIssues,
    git: gitPlan,
    videos,
  };
}

export function commitPreparedBatchRenderDelivery(batch, {
  environment = process.env,
  deliveryPlanId = null,
  selectedPaths = null,
} = {}) {
  const delivery = batch?.renderDelivery;
  if (!delivery || delivery.kind !== "batch-render-delivery") {
    const error = new Error("批量渲染尚未完成交付预检，请先准备交付计划");
    error.code = "batch-render-delivery-plan-missing";
    throw error;
  }
  if (delivery.status !== "needs-confirmation" || (delivery.issues ?? []).length > 0) {
    const error = new Error("批量渲染交付预检未通过，不能 commit/push；请先修复问题并重新预检");
    error.code = "batch-render-delivery-preflight-blocked";
    error.issues = delivery.issues ?? [];
    throw error;
  }
  const projects = (batch.items ?? [])
    .filter((item) => !["succeeded", "skipped"].includes(item.status))
    .map((item) => loadProject(item.slug, { refresh: true }));
  const inputIssues = unique(projects.flatMap((project) => [
    ...validateRemoteRenderPackage(project),
    ...validateRemoteRenderInputs(project),
    ...validateRenderInputDelivery(project),
  ]));
  if (inputIssues.length > 0) {
    const error = new Error(`批量渲染输入包交付绑定已失效：${inputIssues.join("；")}`);
    error.code = "batch-render-delivery-input-invalid";
    error.issues = inputIssues;
    throw error;
  }
  const result = commitAndPushBatchRenderDelivery(projects, { environment, deliveryPlanId, selectedPaths });
  return { ...result, deliveryBinding: projects.map((project) => readRenderInputDelivery(project.config.workspaceRoot, project.config.slug)) };
}

export async function assertCommittedBatchRenderDelivery(
  batch,
  {
    environment = process.env,
    githubPreflight = (options) => assertGitHubActionsReady(options),
  } = {},
) {
  const delivery = batch?.renderDelivery;
  if (!delivery || delivery.kind !== "batch-render-delivery" || delivery.status !== "committed") {
    const error = new Error("批量渲染交付尚未完成 commit/push，不能派发");
    error.code = "batch-render-delivery-not-committed";
    throw error;
  }
  const projects = (batch.items ?? [])
    .filter((item) => !["succeeded", "skipped"].includes(item.status))
    .map((item) => loadProject(item.slug, { refresh: true }));
  const issues = unique(projects.flatMap((project) => [
    ...validateRemoteRenderPackage(project),
    ...validateRemoteRenderInputs(project),
    ...validateRenderInputDelivery(project),
  ]));
  for (const project of projects) {
    try {
      await githubPreflight({ project, stage: "render", checkRenderInput: false });
    } catch (error) {
      issues.push(errorMessage(error));
    }
  }
  let currentGitPlan = null;
  try {
    currentGitPlan = buildBatchGitRenderCommitPlan(projects, { environment });
    if (currentGitPlan.outOfScopePaths.length > 0) issues.push(`发现未纳入批量渲染提交范围的改动：${currentGitPlan.outOfScopePaths.join("、")}`);
    if (currentGitPlan.commitPaths.length > 0) issues.push(`渲染代码在 commit 后又发生变化：${currentGitPlan.commitPaths.join("、")}`);
    if (delivery.commit?.sha && currentGitPlan.headCommit !== delivery.commit.sha) issues.push("当前 HEAD 不是批量交付记录中的 commit");
  } catch (error) {
    issues.push(errorMessage(error));
  }
  const deliveryVideos = new Map((delivery.videos ?? []).map((video) => [video.slug, video]));
  for (const project of projects) {
    const slug = project.config.slug;
    const video = deliveryVideos.get(slug);
    if (!video) {
      issues.push(`${slug} 缺少持久化的批量输入包绑定记录`);
      continue;
    }
    const currentPlan = currentGitPlan?.videoPlans?.find((item) => item.videoSlug === slug);
    const current = readRenderInputDelivery(project.config.workspaceRoot, slug);
    if (current?.url !== video.renderInputUrl
      || current?.archiveSha256 !== video.renderInputSha256
      || current?.packageFingerprint !== video.packageFingerprint
      || current?.compositionId !== video.compositionId
      || currentPlan?.deliveryBindingSha256 !== video.deliveryBindingSha256
      || video.batchId !== batch.id
      || video.branch !== currentGitPlan?.branch
      || video.dispatchRef !== currentGitPlan?.ref
      || (video.commitSha && video.commitSha !== delivery.commit?.sha)) {
      issues.push(`${slug} 的输入包或交付绑定已变化，请重新预检并确认`);
    }
  }
  if (issues.length > 0) {
    const error = new Error(`批量渲染派发前复核失败：${unique(issues).join("；")}`);
    error.code = "batch-render-dispatch-preflight-invalid";
    error.issues = unique(issues);
    throw error;
  }
  return { projects, gitPlan: currentGitPlan };
}
