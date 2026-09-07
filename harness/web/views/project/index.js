import { escapeHtml, projectSequence } from "../../shared/html.js";
import { jobStatusLabels, labelFor, stageStatusLabels, statusLabels } from "../../shared/labels.js";

function stageItem(stage) {
  const present = stage.artifacts.filter((artifact) => artifact.present).length;
  const artifacts = stage.artifacts.length ? `${present}/${stage.artifacts.length} 个产物` : "人工 Gate / 外部任务";
  return `<li class="stage-item stage-${escapeHtml(stage.status)}"><div class="stage-marker">${stage.order + 1}</div><div class="stage-content"><div class="stage-heading"><div><h3>${escapeHtml(stage.label ?? stage.stage)}</h3><p>${escapeHtml(stage.objective)}</p></div><span class="stage-status status status-${escapeHtml(stage.status)}">${escapeHtml(labelFor(stage.status, stageStatusLabels))}</span></div><div class="stage-meta"><span>${escapeHtml(artifacts)}</span>${stage.requiresApproval ? "<span>需要人工确认</span>" : ""}${stage.review ? `<span>审查：${escapeHtml(stage.review.decision === "approved" ? "已通过" : "已驳回")}</span>` : ""}</div></div></li>`;
}

function jobCard(job) {
  const message = job.error?.message ? escapeHtml(job.error.message) : job.remote?.runUrl ? `<a href="${escapeHtml(job.remote.runUrl)}" target="_blank" rel="noreferrer">查看 GitHub Actions Run</a>` : "任务状态已记录";
  return `<article class="job-card"><div><strong>${escapeHtml(job.slug ? `${job.slug} · ` : "")}${escapeHtml(job.stage)}</strong><span class="job-id">${escapeHtml(job.id)}</span></div><span class="stage-status status status-${escapeHtml(job.status)}">${escapeHtml(labelFor(job.status, jobStatusLabels))}</span><p>${message}</p><div class="job-meta"><span>${escapeHtml(job.remote?.runId ? `Run #${job.remote.runId}` : "尚未发现 Run")}</span><span>${escapeHtml(job.result?.outputs?.[0]?.artifactName ? `Artifact：${job.result.outputs[0].artifactName}` : "Artifact：待检查")}</span><span>${escapeHtml(job.lastCheckedAt ? `最近检查：${job.lastCheckedAt}` : "尚未检查")}</span></div></article>`;
}

function alignmentPanel(project, files, alignment) {
  if (!alignment?.baseline && !alignment?.alignment) return "";
  const scenes = alignment.alignment?.scenes ?? [];
  return `<section class="prototype-section"><div class="section-heading"><div><p class="eyebrow">PROTOTYPE → REMOTION</p><h2>Gate 3 对齐检查</h2></div><a class="button button-secondary" href="${escapeHtml(alignment.studioUrl)}" target="_blank" rel="noreferrer">打开 Remotion Studio</a></div><div class="alignment-compare"><div class="alignment-pane"><span class="summary-label">Gate 2 冻结原型</span>${files.some((file) => file.path.endsWith("visual-prototype.html") && file.present) ? `<iframe title="Gate 2 Visual Prototype" src="/preview/${encodeURIComponent(project.slug)}"></iframe>` : "<div class=\"viewer-state\">缺少视觉原型。</div>"}</div><div class="alignment-pane"><span class="summary-label">Remotion Studio</span><iframe title="Remotion Studio" src="${escapeHtml(alignment.studioUrl)}"></iframe></div></div><div class="alignment-summary"><p>冻结 Scene：${escapeHtml(alignment.baseline?.sceneIds?.join("、") ?? "历史项目未冻结")}</p>${alignment.issues?.length ? `<ul>${alignment.issues.map((item) => `<li class="${item.severity === "warning" ? "alignment-warning" : "alignment-error"}">${escapeHtml(item.message)}</li>`).join("")}</ul>` : "<p class=\"alignment-ok\">结构对齐校验已通过，仍需在 Gate 3 人工确认实际画面。</p>"}${scenes.length ? `<div class="alignment-scenes">${scenes.map((scene) => `<article><strong>Scene ${escapeHtml(scene.sceneId)}</strong><p>${escapeHtml(scene.layout)}</p><small>视觉事件：${escapeHtml((scene.visualEvents ?? []).join("；"))}</small><small>实现：${escapeHtml((scene.implementationFiles ?? []).join("、"))}</small></article>`).join("")}</div>` : ""}</div></section>`;
}

export function createProjectView({ elements, api, polling, onBack, onRefreshDashboard } = {}) {
  let mounted = false;
  let currentSlug = null;
  let currentWorkspace = null;
  let requestNumber = 0;

  function taskText(task) {
    const message = task.error?.message ?? "未提供错误详情";
    const stderr = String(task.error?.stderr ?? "").trim();
    return stderr ? `${message} · ${stderr.split(/\r?\n/).filter(Boolean).slice(-3).join(" ")}` : message;
  }

  function actionControls(project, task, activeJob, continuousBatch) {
    if (!project.initialized) return `<button class="button button-primary" type="button" data-action="initialize">初始化 Harness</button><button class="button button-secondary" type="button" data-action="legacy-validate">Legacy 只读检查</button>`;
    const buttons = [`<button class="button button-secondary" type="button" data-action="validate">重新校验</button>`, `<button class="button button-secondary" type="button" data-action="legacy-validate">Legacy 只读检查</button>`];
    let disabledReason = "";
    const item = continuousBatch?.items?.find((value) => value.slug === project.slug);
    const continuousStages = new Set(["source", "content-analysis", "video-narrative", "scene-script", "narration-script", "visual-script", "visual-prototype"]);
    if (["run-stage", "fix-validation-issues"].includes(project.next.action) && continuousStages.has(project.currentStage) && !item) buttons.push(`<button class="button button-primary" type="button" data-action="run-to-gate-2">连续生成至 Gate 2</button>`);
    if (project.stages.find((stage) => stage.stage === "subtitle-timeline")?.review?.decision !== "approved" && project.stages.find((stage) => stage.stage === "subtitle-timeline")?.status === "succeeded") buttons.push(`<button class="button button-primary" type="button" data-action="approve-tts-qc">确认 TTS 质检</button>`);
    if (project.next.action === "run-stage" && task?.status === "ready") buttons.push(`<button class="button button-primary" type="button" data-remotion-task-action="run" data-task-id="${escapeHtml(task.id)}">执行 Agent</button>`);
    else if (project.next.action === "run-stage" && !task && !["smoke-render", "render"].includes(project.currentStage)) buttons.push(`<button class="button button-primary" type="button" data-action="run">执行当前阶段</button>`);
    if (project.next.action === "run-stage" && ["smoke-render", "render"].includes(project.currentStage)) buttons.push(activeJob?.stage === project.currentStage ? (() => { disabledReason = "remote-task-running-reason"; return `<button class="button button-primary" type="button" aria-describedby="${disabledReason}" disabled>远程任务执行中</button>`; })() : `<button class="button button-primary" type="button" data-action="remote-run">提交远程任务</button>`);
    if (project.next.action === "fix-validation-issues" && ["smoke-render", "render"].includes(project.currentStage)) {
      if (project.currentStage === "smoke-render") buttons.push(`<button class="button button-primary" type="button" data-action="remote-run">提交并执行 Smoke Render</button>`);
      else if (project.next.preparation?.action === "prepare-remote-render") buttons.push(`<button class="button button-primary" type="button" data-action="prepare-remote-render">准备远程渲染资源</button>`);
    }
    if (["smoke-render", "render"].includes(project.currentStage)) buttons.push(`<button class="button button-secondary" type="button" data-action="find-historical">查找历史 Artifact</button>`);
    if (project.next.action === "retry-stage") buttons.push(`<button class="button button-primary" type="button" data-action="retry">重试当前阶段</button>`);
    if (project.next.action === "resume-from-invalidated-stage") buttons.push(`<button class="button button-primary" type="button" data-action="resume">恢复项目</button>`);
    if (project.next.action === "approve-or-reject-gate") { buttons.push(`<button class="button button-primary" type="button" data-action="approve">通过 ${escapeHtml(project.currentStage)}</button><button class="button button-secondary" type="button" data-action="reject">驳回 Gate</button>`); }
    if (disabledReason) buttons.push(`<span id="${disabledReason}" class="visually-hidden">远程任务正在执行${activeJob.id ? `，任务 ID：${escapeHtml(activeJob.id)}` : ""}，完成前不能重复提交。</span>`);
    return buttons.join("");
  }

  function render(workspace) {
    currentWorkspace = workspace; const project = workspace.project; const task = workspace.remotionTasks?.find((item) => item.slug === project.slug); const activeJob = workspace.activeJob;
    const gateReturn = project.next.returnToStages ?? []; const detail = project.next.action === "approve-or-reject-gate" ? `<dialog id="reject-gate-dialog" class="reject-dialog"><form class="reject-form" data-reject-form><p class="eyebrow">GATE REVIEW</p><h2>驳回 ${escapeHtml(project.currentStage)}</h2><label class="form-field"><span>回退到阶段</span><select name="returnTo" required>${gateReturn.map((item) => `<option value="${escapeHtml(item.stage)}">${escapeHtml(item.label)}（${escapeHtml(item.stage)}）</option>`).join("")}</select></label><label class="form-field"><span>驳回原因</span><textarea name="reason" rows="4" required></textarea></label><div class="dialog-actions"><button class="button button-secondary" type="button" data-reject-cancel>取消</button><button class="button button-primary" type="submit">确认驳回</button></div></form></dialog>` : "";
    const files = workspace.files.map((file, index) => {
      const missingReasonId = `file-missing-reason-${index}`;
      const missing = file.present ? "" : ` aria-describedby="${missingReasonId}" disabled`;
      const reason = file.present ? "" : `<span id="${missingReasonId}" class="visually-hidden">${escapeHtml(file.label)}当前缺失，不能查看文件内容。</span>`;
      return `<button class="file-button${file.present ? "" : " file-missing"}" type="button" data-path="${escapeHtml(file.path)}"${missing}><span>${escapeHtml(file.label)}</span><small>${escapeHtml(file.stage)} · ${file.present ? "可查看" : "缺失"}</small>${reason}</button>`;
    }).join("");
    elements.container.innerHTML = `<div class="detail-heading"><div><p class="card-kicker">VIDEO PROJECT · 原文件序号 ${escapeHtml(projectSequence(project))}</p><h2>${escapeHtml(project.slug)}</h2><p class="detail-path">${escapeHtml(project.sourceDirectory)} · ${escapeHtml(project.remotionDirectory)}</p></div><span class="status status-${escapeHtml(project.status)}">${escapeHtml(labelFor(project.status, statusLabels))}</span></div><div class="detail-summary"><div><span class="summary-label">当前阶段</span><strong>${escapeHtml(project.currentStage ?? "尚未初始化")}</strong></div><div><span class="summary-label">完成进度</span><strong>${project.progress}%</strong></div><div><span class="summary-label">下一步</span><strong>${escapeHtml(project.next.action)}</strong></div></div><div class="next-action"><span class="summary-label">下一步动作</span><p>${escapeHtml(task?.status === "in-progress" ? `Remotion Agent 正在制作，任务 ID：${task.id}` : project.next.message)}</p><div class="action-controls">${actionControls(project, task, activeJob, workspace.continuousBatch)}</div><p id="action-feedback" class="action-feedback" role="status" aria-live="polite" hidden></p></div>${detail}<section class="jobs-section"><div class="section-heading"><div><p class="eyebrow">REMOTE JOBS</p><h2>远程任务</h2></div><button class="button button-secondary" id="refresh-project-jobs" type="button">刷新任务</button></div><div class="jobs-list">${workspace.jobs?.length ? workspace.jobs.map(jobCard).join("") : "<div class=\"loading-state\">暂无远程任务。</div>"}</div></section><section class="jobs-section"><div class="section-heading"><div><p class="eyebrow">AGENT JOBS</p><h2>本地 Agent 任务</h2></div><div class="jobs-list">${workspace.agentJobs?.length ? workspace.agentJobs.map((job) => `<article class="job-card"><strong>${escapeHtml(job.stage)}</strong><span class="stage-status status status-${escapeHtml(job.status)}">${escapeHtml(labelFor(job.status, jobStatusLabels))}</span><p>${escapeHtml(job.error?.message ?? "后台 Agent 正按阶段任务包执行。")}</p>${job.status === "failed" ? `<button class="button button-secondary" data-agent-job-retry="${escapeHtml(job.id)}" type="button">重试任务</button>` : ""}</article>`).join("") : "<div class=\"loading-state\">暂无 Agent 任务。</div>"}</div></section><section class="pipeline-section"><div class="section-heading"><div><p class="eyebrow">WORKFLOW</p><h2>生产阶段</h2></div></div><ol class="pipeline">${project.stages.map(stageItem).join("")}</ol></section><section class="artifacts-section"><div class="section-heading"><div><p class="eyebrow">ARTIFACTS</p><h2>生产资料</h2></div></div><div class="artifact-layout"><div class="file-list">${files}</div><div class="file-viewer"><div id="file-viewer-state" class="viewer-state">选择左侧文件查看内容。</div><pre id="file-content" hidden></pre></div></div></section>${alignmentPanel(project, workspace.files, workspace.alignment)}<section class="prototype-section"><div class="section-heading"><div><p class="eyebrow">VISUAL PROTOTYPE</p><h2>视觉原型预览</h2></div></div><div class="prototype-frame">${workspace.files.some((file) => file.path.endsWith("visual-prototype.html") && file.present) ? `<iframe title="Visual Prototype" src="/preview/${encodeURIComponent(project.slug)}"></iframe>` : "<div class=\"viewer-state\">当前项目还没有可用的 Visual Prototype。</div>"}</div></section>`;
    bindEvents(project);
  }

  function feedback(message, kind = "info") { const node = elements.container.querySelector("#action-feedback"); if (node) { node.hidden = !message; node.className = `action-feedback action-feedback-${kind}`; node.textContent = message; } }

  async function runAction(project, action, extra = {}) {
    if (action === "reject" && !extra.reason) { elements.container.querySelector("#reject-gate-dialog")?.showModal(); return; }
    if (action === "initialize" && !window.confirm(`初始化 ${project.slug} 的 Harness 状态吗？`)) return;
    const body = { action, stage: ["validate", "run", "retry", "remote-run", "prepare-remote-render", "find-historical"].includes(action) ? project.currentStage : undefined, gate: ["approve", "reject"].includes(action) ? project.currentStage : undefined, ...extra };
    const button = [...elements.container.querySelectorAll("[data-action]")].find((item) => item.dataset.action === action); if (button) { button.disabled = true; button.textContent = "提交中……"; }
    feedback("正在提交当前阶段请求……");
    try {
      let result = await api.runProjectAction(project.slug, body);
      if (action === "remote-run" && result.result?.status === "needs-confirmation") {
        const plan = result.commitPlan ?? { branch: "当前分支", commitPaths: [] }; const paths = plan.commitPaths.length ? plan.commitPaths.join("\n") : "（没有可定向提交的文件）";
        if (!window.confirm(`Smoke Render 提交前需要定向 commit/push。\n\n分支：${plan.branch}\n将提交的文件：\n${paths}\n\n确认后会自动 commit、push。`)) { feedback("已取消提交和推送，未创建远程任务。"); return; }
        result = await api.runProjectAction(project.slug, { ...body, commitAndPush: true, confirmDelivery: true });
      }
      if (action === "find-historical") {
        const candidates = result.result?.candidates ?? []; if (!candidates.length) { window.alert("没有找到带有匹配 Artifact 的成功历史 Run。"); return; }
        const index = Number(window.prompt(candidates.map((item, i) => `${i + 1}. Run #${item.runId} · ${item.ref} · ${item.artifactName}`).join("\n"), "1")) - 1;
        if (candidates[index] && window.confirm(`确认认领 Run #${candidates[index].runId} 的 Artifact 吗？`)) await runAction(project, "adopt-historical", { stage: project.currentStage, runId: candidates[index].runId });
        return;
      }
      await open(project.slug);
      await onRefreshDashboard?.();
    } catch (error) { feedback(`操作失败：${error.message}`, "error"); window.alert(`操作失败：${error.message}`); if (button) { button.disabled = false; } }
  }

  async function open(slug) {
    const id = ++requestNumber; currentSlug = slug; polling.stop("project");
    try { const workspace = await api.getProjectWorkspace(slug); if (id !== requestNumber) return; render(workspace); const project = workspace.project; const task = workspace.remotionTasks?.find((item) => item.slug === slug); if (workspace.activeJob || workspace.agentJobs?.some((job) => ["queued", "running"].includes(job.status)) || ["ready", "in-progress"].includes(task?.status)) polling.start("project", () => open(slug), workspace.activeJob ? 5000 : 1500); }
    catch (error) { elements.container.textContent = `读取项目失败：${error.message}`; }
  }

  async function file(path) { const state = elements.container.querySelector("#file-viewer-state"); const content = elements.container.querySelector("#file-content"); state.hidden = false; state.textContent = "正在读取文件……"; content.hidden = true; try { const result = await api.getProjectFile(currentSlug, path); content.textContent = result.content; content.hidden = false; state.hidden = true; } catch (error) { state.textContent = `读取失败：${error.message}`; } }

  function bindEvents(project) {
    elements.container.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => void runAction(project, button.dataset.action)));
    elements.container.querySelectorAll("[data-remotion-task-action]").forEach((button) => button.addEventListener("click", async () => { button.disabled = true; try { await api.runRemotionTaskAction(button.dataset.taskId, { action: button.dataset.remotionTaskAction }); await open(project.slug); } catch (error) { window.alert(`Remotion 任务操作失败：${error.message}`); button.disabled = false; } }));
    elements.container.querySelectorAll("[data-agent-job-retry]").forEach((button) => button.addEventListener("click", async () => { button.disabled = true; try { await api.runAgentJobAction(button.dataset.agentJobRetry, { action: "retry" }); await open(project.slug); } catch (error) { window.alert(`Agent 任务重试失败：${error.message}`); button.disabled = false; } }));
    elements.container.querySelectorAll("[data-path]").forEach((button) => button.addEventListener("click", () => void file(button.dataset.path)));
    elements.container.querySelector("#refresh-project-jobs")?.addEventListener("click", () => void open(project.slug));
    const dialog = elements.container.querySelector("#reject-gate-dialog"); dialog?.querySelectorAll("[data-reject-cancel]").forEach((button) => button.addEventListener("click", () => dialog.close()));
    dialog?.querySelector("[data-reject-form]")?.addEventListener("submit", (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); dialog.close(); void runAction(project, "reject", { returnTo: String(form.get("returnTo")), reason: String(form.get("reason")).trim() }); });
  }

  function mount() { if (mounted) return; mounted = true; }
  function unmount() { mounted = false; requestNumber += 1; currentSlug = null; currentWorkspace = null; polling.stop("project"); polling.stop("remotion-task"); elements.container.innerHTML = ""; }
  return { mount, unmount, open, refresh: () => currentSlug ? open(currentSlug) : Promise.resolve(), getCurrent: () => currentWorkspace?.project ?? null };
}
