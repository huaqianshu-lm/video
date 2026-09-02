import { COVER_HEIGHT, COVER_WIDTH, coverCropFor } from "../cover-image.js";
import { apiClient } from "../core/api-client.js";
import { polling } from "../core/polling.js";
import { appStore } from "../core/store.js";

const statusElement = document.querySelector("#service-status");
const dashboardView = document.querySelector("#dashboard-view");
const detailView = document.querySelector("#detail-view");
const projectGrid = document.querySelector("#project-grid");
const projectListState = document.querySelector("#project-list-state");
const projectDetail = document.querySelector("#project-detail");
const globalJobsList = document.querySelector("#global-jobs-list");
const githubDiagnostics = document.querySelector("#github-diagnostics");
const batchList = document.querySelector("#batch-list");
const remotionTaskList = document.querySelector("#remotion-task-list");
const batchSelectionState = document.querySelector("#batch-selection-state");
const batchToGate2Button = document.querySelector("#batch-to-gate2");
const batchToTtsButton = document.querySelector("#batch-to-tts");
const batchToRemotionButton = document.querySelector("#batch-to-remotion");
const batchToRenderButton = document.querySelector("#batch-to-render");
const seriesForm = document.querySelector("#series-form");
const seriesSelect = document.querySelector("#series-select");
const seriesIdInput = document.querySelector("#series-id");
const seriesTitleInput = document.querySelector("#series-title");
const seriesStyleInput = document.querySelector("#series-style");
const seriesCoverFramesInput = document.querySelector("#series-cover-frames");
const seriesVideoList = document.querySelector("#series-video-list");
const seriesCoverFile = document.querySelector("#series-cover-file");
const seriesCoverPreview = document.querySelector("#series-cover-preview");
const uploadSeriesCoverButton = document.querySelector("#upload-series-cover");
const seriesState = document.querySelector("#series-state");
const sourceImportForm = document.querySelector("#source-import-form");
const sourceImportFile = document.querySelector("#source-import-file");
const sourceImportSlug = document.querySelector("#source-import-slug");
const sourceImportSeries = document.querySelector("#source-import-series");
const sourceImportSubmit = document.querySelector("#source-import-submit");
const sourceImportState = document.querySelector("#source-import-state");
const selectedSlugs = new Set();
let availableProjects = [];
let availableSeries = [];
let activeSeriesId = "";
let selectedCoverPreviewUrl = null;
let activeProject = null;
let activeProjectRequest = 0;

function clearSelectedCover() {
  seriesCoverFile.value = "";
  if (selectedCoverPreviewUrl) URL.revokeObjectURL(selectedCoverPreviewUrl);
  selectedCoverPreviewUrl = null;
}

const statusLabels = {
  completed: "已完成",
  failed: "失败",
  invalid: "状态异常",
  pending: "未开始",
  ready: "可执行",
  running: "执行中",
  succeeded: "已完成",
  uninitialized: "未初始化 Harness",
  waiting: "等待确认",
};

const stageStatusLabels = {
  available: "已有产物",
  failed: "失败",
  invalidated: "已失效",
  missing: "缺少产物",
  pending: "未开始",
  ready: "可执行",
  running: "执行中",
  succeeded: "已完成",
  waiting: "等待确认",
};

const jobStatusLabels = {
  dispatching: "提交中",
  failed: "失败",
  queued: "排队中",
  running: "执行中",
  succeeded: "成功",
  submitted: "已提交",
  timeout: "超时",
  recoverable: "可恢复",
  "waiting-config": "等待配置",
  "waiting-run": "等待 Run",
};

const batchStatusLabels = {
  completed: "已完成",
  "completed-with-errors": "部分失败",
  queued: "排队中",
  running: "执行中",
  waiting: "等待人工处理",
};

const batchItemStatusLabels = {
  failed: "失败",
  invalidated: "已失效",
  pending: "未开始",
  queued: "排队中",
  ready: "可执行",
  running: "执行中",
  skipped: "已跳过",
  succeeded: "已完成",
  "waiting-gate": "等待 Gate",
  "waiting-agent-job": "等待 Agent 任务",
  "waiting-tts-qc": "等待 TTS 质检",
  "waiting-remotion-task": "等待 Remotion 制作",
  "waiting-smoke-qc": "等待 Smoke 检查",
};

const remotionTaskStatusLabels = {
  ready: "待制作",
  "in-progress": "制作中",
  blocked: "校验未通过",
  completed: "已完成，待继续批次",
  failed: "失败",
};

const batchTypeLabels = {
  "to-gate-2": "批量到 Gate 2",
  "to-tts": "批量完成 TTS",
  "to-remotion": "批量完成 Remotion",
  "to-render": "批量渲染",
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function activeSeries() {
  return availableSeries.find((series) => series.id === activeSeriesId) ?? null;
}

function renderSeriesManager() {
  const series = activeSeries();
  seriesSelect.innerHTML = `<option value="">新建系列</option>${availableSeries.map((item) => `<option value="${escapeHtml(item.id)}"${item.id === activeSeriesId ? " selected" : ""}>${escapeHtml(item.title)} · ${escapeHtml(item.id)}</option>`).join("")}`;
  seriesIdInput.value = series?.id ?? "";
  seriesIdInput.readOnly = Boolean(series);
  seriesTitleInput.value = series?.title ?? "";
  seriesStyleInput.value = series?.style ?? "current";
  seriesCoverFramesInput.value = String(series?.coverDurationFrames ?? 45);
  seriesVideoList.innerHTML = availableProjects.map((project) => `
    <label>
      <input type="checkbox" name="series-video" value="${escapeHtml(project.slug)}"${series?.videos.includes(project.slug) ? " checked" : ""} />
      <span>${escapeHtml(project.slug)}</span>
    </label>
  `).join("") || "暂无视频项目。";
  if (series?.cover) {
    seriesCoverPreview.innerHTML = `<img src="/${escapeHtml(series.cover)}?v=${encodeURIComponent(series.updatedAt ?? "")}" alt="${escapeHtml(series.title)}封面" />`;
    seriesState.textContent = `当前封面：${series.cover} · ${series.coverDurationFrames} 帧`;
  } else {
    seriesCoverPreview.innerHTML = "<span>尚未上传系列封面</span>";
    seriesState.textContent = series ? "系列已建立，可以上传 16:9 封面。" : "选择或创建系列后上传封面。";
  }
  uploadSeriesCoverButton.disabled = !series || !seriesCoverFile.files?.[0];
}

function renderSourceImportSeriesOptions() {
  const selected = sourceImportSeries.value;
  sourceImportSeries.innerHTML = [
    '<option value="">请选择系列</option>',
    '<option value="none">不归入系列（使用通用 current 风格）</option>',
    ...availableSeries.map((series) => `<option value="${escapeHtml(series.id)}">${escapeHtml(series.title)} · ${escapeHtml(series.id)} · ${escapeHtml(series.style)}</option>`),
  ].join("");
  sourceImportSeries.value = [...sourceImportSeries.options].some((option) => option.value === selected) ? selected : "";
}

async function loadSeries() {
  const response = await apiClient.request("/api/series", { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const payload = await response.json();
  availableSeries = payload.series ?? [];
  appStore.setState({ series: availableSeries });
  if (activeSeriesId && !availableSeries.some((series) => series.id === activeSeriesId)) activeSeriesId = "";
  if (!activeSeriesId && availableSeries.length > 0) activeSeriesId = availableSeries[0].id;
  renderSeriesManager();
  renderSourceImportSeriesOptions();
  updateSourceImportState();
}

async function saveSeriesSettings(event) {
  event.preventDefault();
  const id = seriesIdInput.value.trim();
  const videos = [...seriesVideoList.querySelectorAll('input[name="series-video"]:checked')].map((input) => input.value);
  const existingVideos = activeSeries()?.videos ?? [];
  const removedVideos = existingVideos.filter((slug) => !videos.includes(slug));
  let confirmVideoRemoval = false;
  if (removedVideos.length > 0) {
    const confirmed = window.confirm(`将从系列中移除已有视频：${removedVideos.join(", ")}。\n\n这不会删除视频文件，但会解除系列关联。确认继续吗？`);
    if (!confirmed) {
      seriesState.textContent = "已取消移除系列视频。";
      return;
    }
    confirmVideoRemoval = true;
  }
  seriesState.textContent = "正在保存系列设置……";
  try {
    const response = await apiClient.request("/api/series", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        title: seriesTitleInput.value.trim(),
        style: seriesStyleInput.value,
        coverDurationFrames: Number(seriesCoverFramesInput.value),
        videos,
        confirmVideoRemoval,
      }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? `HTTP ${response.status}`);
    activeSeriesId = payload.series.id;
    await loadSeries();
    const restarts = payload.updatedProjects?.filter((project) => project.restartedAt).map((project) => project.slug) ?? [];
    seriesState.textContent = restarts.length > 0
      ? `系列设置已保存；${restarts.join("、")} 已回退到视觉脚本阶段以应用新风格。`
      : "系列设置已保存。";
  } catch (error) {
    seriesState.textContent = `保存失败：${error.message}`;
  }
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ image, url, width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("无法读取图片"));
    };
    image.src = url;
  });
}

function canvasBlob(canvas, contentType) {
  return new Promise((resolve, reject) => {
    const quality = contentType === "image/png" ? undefined : 0.92;
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("无法生成标准封面"));
      else resolve(blob);
    }, contentType, quality);
  });
}

async function normalizeCover(file) {
  const source = await readImage(file);
  try {
    const crop = coverCropFor(source.width, source.height);
    const canvas = document.createElement("canvas");
    canvas.width = COVER_WIDTH;
    canvas.height = COVER_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("浏览器无法处理图片");
    context.drawImage(
      source.image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      COVER_WIDTH,
      COVER_HEIGHT,
    );
    const blob = await canvasBlob(canvas, file.type);
    return { blob, sourceWidth: source.width, sourceHeight: source.height };
  } finally {
    URL.revokeObjectURL(source.url);
  }
}

async function previewSelectedCover() {
  const file = seriesCoverFile.files?.[0];
  uploadSeriesCoverButton.disabled = !activeSeries() || !file;
  if (selectedCoverPreviewUrl) URL.revokeObjectURL(selectedCoverPreviewUrl);
  selectedCoverPreviewUrl = null;
  if (!file) {
    renderSeriesManager();
    return;
  }

  try {
    if (file.size > 10 * 1024 * 1024) throw new Error("图片超过 10 MB");
    const source = await readImage(file);
    try {
      coverCropFor(source.width, source.height);
      selectedCoverPreviewUrl = URL.createObjectURL(file);
      seriesCoverPreview.innerHTML = `<img src="${selectedCoverPreviewUrl}" alt="待上传封面裁切预览" />`;
      seriesState.textContent = `裁切预览：${source.width}×${source.height}，上传后保存为 ${COVER_WIDTH}×${COVER_HEIGHT}。`;
    } finally {
      URL.revokeObjectURL(source.url);
    }
  } catch (error) {
    uploadSeriesCoverButton.disabled = true;
    seriesState.textContent = `无法上传：${error.message}`;
  }
}

async function uploadSeriesCover() {
  const file = seriesCoverFile.files?.[0];
  const series = activeSeries();
  if (!file || !series) return;
  seriesState.textContent = "正在检查并上传封面……";
  try {
    if (file.size > 10 * 1024 * 1024) throw new Error("图片超过 10 MB");
    const normalized = await normalizeCover(file);
    if (normalized.blob.size > 10 * 1024 * 1024) throw new Error("标准化后的图片超过 10 MB");
    const response = await apiClient.request(`/api/series/${encodeURIComponent(series.id)}/cover`, {
      method: "PUT",
      headers: { "Content-Type": normalized.blob.type },
      body: normalized.blob,
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? `HTTP ${response.status}`);
    clearSelectedCover();
    await loadSeries();
    seriesState.textContent = `封面已从 ${normalized.sourceWidth}×${normalized.sourceHeight} 居中裁切并保存为 ${payload.image.width}×${payload.image.height}。`;
  } catch (error) {
    seriesState.textContent = `上传失败：${error.message}`;
  }
}

function updateSourceImportState() {
  const file = sourceImportFile.files?.[0];
  const seriesId = sourceImportSeries.value;
  sourceImportSubmit.disabled = !file || !seriesId;
  if (!file) {
    sourceImportState.textContent = "请选择一个原文件。";
    return;
  }
  if (!seriesId) {
    sourceImportState.textContent = "请先选择所属系列与视觉基线。";
    return;
  }
  const selectedSeries = availableSeries.find((series) => series.id === seriesId);
  sourceImportState.textContent = selectedSeries
    ? `待上传：${file.name} · ${(file.size / 1024).toFixed(1)} KB · ${selectedSeries.title}（${selectedSeries.style}）`
    : `待上传：${file.name} · ${(file.size / 1024).toFixed(1)} KB · 通用 current 风格`;
}

async function importSourceProject(event) {
  event.preventDefault();
  const file = sourceImportFile.files?.[0];
  if (!file) return;
  sourceImportSubmit.disabled = true;
  sourceImportState.textContent = "正在上传并创建视频项目……";
  try {
    if (file.size > 10 * 1024 * 1024) throw new Error("原文件不能超过 10 MB");
    const query = new URLSearchParams({ filename: file.name });
    const slug = sourceImportSlug.value.trim();
    if (slug) query.set("slug", slug);
    if (sourceImportSeries.value !== "none") query.set("seriesId", sourceImportSeries.value);
    const response = await apiClient.request(`/api/projects/import?${query.toString()}`, {
      method: "PUT",
      headers: { "Content-Type": file.type || "text/plain" },
      body: file,
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? `HTTP ${response.status}`);
    sourceImportForm.reset();
    renderSourceImportSeriesOptions();
    sourceImportState.textContent = `已创建项目 ${payload.result.slug}${payload.result.series ? `，已锁定 ${payload.result.series.title} 的 ${payload.result.series.style} 风格` : ""}，正在打开项目详情……`;
    await loadProjects();
    await openProject(payload.result.slug);
  } catch (error) {
    sourceImportState.textContent = `导入失败：${error.message}`;
    sourceImportSubmit.disabled = false;
  }
}

function labelFor(status, labels = statusLabels) {
  return labels[status] ?? status;
}

function projectSequence(project) {
  return project.sequence === null || project.sequence === undefined
    ? "—"
    : String(project.sequence).padStart(2, "0");
}

function projectCard(project) {
  const selectable = project.currentStage !== "completed";
  return `
    <article class="project-card">
      <div class="card-heading">
        <div class="project-label">
          <label class="project-select" title="选择加入批次">
            <input type="checkbox" data-project-select="${escapeHtml(project.slug)}"${selectable ? "" : " disabled"}${selectedSlugs.has(project.slug) ? " checked" : ""} />
            <span>选择</span>
          </label>
          <span class="project-sequence" aria-label="原文件序号 ${escapeHtml(projectSequence(project))}">${escapeHtml(projectSequence(project))}</span>
          <p class="card-kicker">VIDEO PROJECT</p>
        </div>
        <span class="status status-${escapeHtml(project.status)}">${escapeHtml(labelFor(project.status))}</span>
      </div>
      <h3 class="project-name">${escapeHtml(project.slug)}</h3>
      <div class="progress-track"><span style="width: ${project.progress}%"></span></div>
      <div class="card-meta">
        <span>${project.succeededCount}/${project.stageCount} 个阶段</span>
        <span>${project.progress}%</span>
      </div>
      <p class="card-next">${escapeHtml(project.next.message)}</p>
      <button class="button button-primary project-open" type="button" data-slug="${escapeHtml(project.slug)}">查看详情</button>
    </article>
  `;
}

function stageItem(stage) {
  const status = stage.status;
  const artifactText = stage.artifacts.length === 0
    ? "人工 Gate / 外部任务"
    : `${stage.artifacts.filter((artifact) => artifact.present).length}/${stage.artifacts.length} 个产物`;
  return `
    <li class="stage-item stage-${escapeHtml(status)}">
      <div class="stage-marker">${stage.order + 1}</div>
      <div class="stage-content">
        <div class="stage-heading">
          <div>
            <h3>${escapeHtml(stage.label ?? stage.stage)}</h3>
            <p>${escapeHtml(stage.objective)}</p>
          </div>
          <span class="stage-status">${escapeHtml(labelFor(status, stageStatusLabels))}</span>
        </div>
        <div class="stage-meta"><span>${escapeHtml(artifactText)}</span>${stage.requiresApproval ? "<span>需要人工确认</span>" : ""}${stage.review ? `<span>审查：${escapeHtml(stage.review.decision === "approved" ? "已通过" : "已驳回")}</span>` : ""}</div>
      </div>
    </li>
  `;
}

function rejectGateDialog(project) {
  const returnStages = project.next.returnToStages ?? [];
  const recommendedReturnTo = project.next.recommendedReturnTo ?? returnStages[0]?.stage;
  return `
    <dialog id="reject-gate-dialog" class="reject-dialog">
      <form class="reject-form" data-reject-form>
        <div class="reject-dialog-heading">
          <div>
            <p class="eyebrow">GATE REVIEW</p>
            <h2>驳回 ${escapeHtml(project.currentStage)}</h2>
          </div>
          <button class="dialog-close" type="button" data-reject-cancel aria-label="关闭">×</button>
        </div>
        <p class="reject-help">请选择需要重新制作的阶段。回退后，该阶段到当前 Gate 之间的阶段状态会被清空并重新执行。</p>
        <label class="form-field">
          <span>回退到阶段</span>
          <select name="returnTo" required>
            ${returnStages.map((item) => `<option value="${escapeHtml(item.stage)}"${item.stage === recommendedReturnTo ? " selected" : ""}>${escapeHtml(item.label)}（${escapeHtml(item.stage)}）</option>`).join("")}
          </select>
        </label>
        <label class="form-field">
          <span>驳回原因</span>
          <textarea name="reason" rows="4" required placeholder="请说明需要修改的内容"></textarea>
        </label>
        <div class="dialog-actions">
          <button class="button button-secondary" type="button" data-reject-cancel>取消</button>
          <button class="button button-primary" type="submit">确认驳回</button>
        </div>
      </form>
    </dialog>
  `;
}

function renderProjects(projects) {
  projectListState.hidden = projects.length > 0;
  if (projects.length === 0) {
    projectListState.textContent = "暂时没有发现视频项目。";
    projectGrid.innerHTML = "";
    return;
  }
  projectGrid.innerHTML = projects.map(projectCard).join("");
  projectGrid.querySelectorAll("[data-project-select]").forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) selectedSlugs.add(input.dataset.projectSelect);
      else selectedSlugs.delete(input.dataset.projectSelect);
      updateBatchSelection();
    });
  });
  projectGrid.querySelectorAll(".project-open").forEach((button) => {
    button.addEventListener("click", () => openProject(button.dataset.slug));
  });
  updateBatchSelection();
}

function updateBatchSelection() {
  const count = selectedSlugs.size;
  batchSelectionState.textContent = `已选择 ${count} 个视频`;
  [batchToGate2Button, batchToTtsButton, batchToRemotionButton, batchToRenderButton]
    .forEach((button) => { button.disabled = count === 0; });
}

function batchItemCard(batch, item) {
  const currentProject = item.currentProject;
  const displayStatus = currentProject?.status ?? item.status;
  const displayMessage = currentProject?.message ?? item.message;
  const action = item.status === "waiting-tts-qc" && currentProject?.ttsQcApproved !== true
    ? `<button class="button button-secondary" type="button" data-batch-action="approve-tts-qc" data-batch-id="${escapeHtml(batch.id)}" data-slug="${escapeHtml(item.slug)}">确认 TTS 质检</button>`
    : item.status === "waiting-smoke-qc"
      ? `<button class="button button-secondary" type="button" data-batch-action="approve-smoke-qc" data-batch-id="${escapeHtml(batch.id)}" data-slug="${escapeHtml(item.slug)}">确认 Smoke 检查</button>`
    : "";
  return `<li class="batch-item"><span><strong>${escapeHtml(item.slug)}</strong><small>${escapeHtml(displayMessage ?? "")}</small></span><span class="batch-item-actions"><span class="stage-status">${escapeHtml(labelFor(displayStatus, batchItemStatusLabels))}</span>${action}</span></li>`;
}

function renderBatches(batches) {
  if (batches.length === 0) {
    batchList.className = "loading-state";
    batchList.textContent = "暂无批次记录。";
    return;
  }
  batchList.className = "batch-list";
  batchList.innerHTML = batches.slice(0, 8).map((batch) => `
    <article class="batch-card">
      <div class="batch-card-heading"><div><p class="eyebrow">${escapeHtml(batch.type)}</p><h3>${escapeHtml(batch.label)}</h3></div><span class="batch-card-status"><span class="status status-${escapeHtml(batch.status)}">${escapeHtml(labelFor(batch.status, batchStatusLabels))}</span>${batch.status === "completed-with-errors" ? `<button class="button button-secondary" type="button" data-batch-action="retry-failed" data-batch-id="${escapeHtml(batch.id)}">重试失败项目</button>` : ""}</span></div>
      <p class="batch-description">${escapeHtml(batch.description)}</p>
      <div class="batch-meta"><span>${escapeHtml(batch.id)}</span><span>目标：${escapeHtml(batch.targetStage)}</span><span>${batch.summary?.total ?? batch.items.length} 个视频</span></div>
      <ul class="batch-items">${batch.items.map((item) => batchItemCard(batch, item)).join("")}</ul>
    </article>
  `).join("");
  batchList.querySelectorAll("[data-batch-action]").forEach((button) => {
    button.addEventListener("click", () => performBatchAction(button.dataset.batchAction, button.dataset.batchId, button.dataset.slug));
  });
}

function renderRemotionTasks(tasks) {
  if (tasks.length === 0) {
    remotionTaskList.className = "loading-state";
    remotionTaskList.textContent = "暂无 Remotion 制作任务。";
    return;
  }
  remotionTaskList.className = "batch-list";
  remotionTaskList.innerHTML = tasks.slice(0, 12).map((task) => {
    const failed = ["blocked", "failed"].includes(task.status);
    const description = failed
      ? `Remotion ${remotionTaskStatusText(task.status)}：${remotionTaskErrorText(task)}`
      : "根据 Visual Script、原型、音频、字幕和 Timeline 生成 Remotion 配置与主组件。";
    return `
      <article class="batch-card">
        <div class="batch-card-heading"><div><p class="eyebrow">${escapeHtml(task.kind)}</p><h3>${escapeHtml(task.slug)}</h3></div><span class="batch-card-status"><span class="status status-${escapeHtml(task.status)}">${escapeHtml(labelFor(task.status, remotionTaskStatusLabels))}</span>${["ready", "blocked", "failed"].includes(task.status) ? `<button class="button button-secondary" type="button" data-remotion-task-action="run" data-task-id="${escapeHtml(task.id)}">${task.status === "ready" ? "执行 Agent" : "重试 Agent"}</button>` : ""}${task.status === "in-progress" ? `<button class="button button-secondary" type="button" data-remotion-task-action="complete" data-task-id="${escapeHtml(task.id)}">提交完成校验</button>` : ""}</span></div>
        <p class="batch-description${failed ? " remotion-task-error" : ""}">${escapeHtml(description)}</p>
        <div class="batch-meta"><span>${escapeHtml(task.id)}</span><span>批次：${escapeHtml(task.batchId ?? "—")}</span><span>输出：${task.outputArtifacts.length} 项</span></div>
      </article>
    `;
  }).join("");
  remotionTaskList.querySelectorAll("[data-remotion-task-action]").forEach((button) => {
    button.addEventListener("click", () => performRemotionTaskAction(button.dataset.remotionTaskAction, button.dataset.taskId));
  });
}

async function loadBatches() {
  try {
    const [batchesResponse, tasksResponse] = await Promise.all([
      apiClient.request("/api/batches", { cache: "no-store" }),
      apiClient.request("/api/remotion-tasks", { cache: "no-store" }),
    ]);
    if (!batchesResponse.ok || !tasksResponse.ok) throw new Error(`HTTP ${batchesResponse.status}/${tasksResponse.status}`);
    const [batchesPayload, tasksPayload] = await Promise.all([batchesResponse.json(), tasksResponse.json()]);
    renderBatches(batchesPayload.batches ?? []);
    renderRemotionTasks(tasksPayload.tasks ?? []);
  } catch (error) {
    batchList.textContent = `读取批次失败：${error.message}`;
    remotionTaskList.textContent = `读取 Remotion 制作任务失败：${error.message}`;
  }
}

async function performRemotionTaskAction(action, id) {
  const taskButtons = [...document.querySelectorAll(`[data-remotion-task-action][data-task-id="${CSS.escape(id)}"]`)];
  const buttonLabels = taskButtons.map((button) => button.textContent);
  taskButtons.forEach((button) => {
    button.disabled = true;
    button.textContent = "提交中……";
  });
  try {
    const response = await apiClient.request(`/api/remotion-tasks/${encodeURIComponent(id)}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? `HTTP ${response.status}`);
    await Promise.all([loadProjects(), loadBatches()]);
    if (activeProject?.slug) await openProject(activeProject.slug);
  } catch (error) {
    await loadBatches();
    window.alert(`Remotion 制作任务操作失败：${error.message}`);
  } finally {
    taskButtons.forEach((button, index) => {
      if (!button.isConnected) return;
      button.disabled = false;
      button.textContent = buttonLabels[index];
    });
  }
}

async function createBatch(type) {
  if (selectedSlugs.size === 0) return;
  const slugs = [...selectedSlugs];
  if (!window.confirm(`确认对 ${slugs.length} 个视频执行${batchTypeLabels[type]}吗？`)) return;
  try {
    const response = await apiClient.request("/api/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, slugs }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? `HTTP ${response.status}`);
    selectedSlugs.clear();
    await Promise.all([loadProjects(), loadBatches()]);
  } catch (error) {
    window.alert(`创建批次失败：${error.message}`);
  }
}

async function performBatchAction(action, id, slug = null) {
  try {
    const response = await apiClient.request(`/api/batches/${encodeURIComponent(id)}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, slug }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? `HTTP ${response.status}`);
    await loadBatches();
  } catch (error) {
    window.alert(`批次操作失败：${error.message}`);
  }
}

function agentJobCard(job) {
  return `
    <article class="job-card">
      <div><strong>${escapeHtml(job.stage)}</strong><span class="job-id">${escapeHtml(job.id)}</span></div>
      <span class="stage-status">${escapeHtml(labelFor(job.status, jobStatusLabels))}</span>
      <p>${escapeHtml(job.error?.message ?? (job.status === "succeeded" ? "真实产物已通过 Harness 校验。" : "后台 Agent 正按阶段任务包执行。"))}</p>
      <div class="job-meta"><span>尝试：${job.attempts}</span><span>${escapeHtml(job.startedAt ? `开始：${job.startedAt}` : "尚未开始")}</span><span>${escapeHtml(job.completedAt ? `结束：${job.completedAt}` : "尚未结束")}</span></div>
      ${job.logs?.stdout || job.logs?.stderr ? `<details class="job-logs"><summary>查看有界日志</summary><pre>${escapeHtml([job.logs.stdout, job.logs.stderr].filter(Boolean).join("\n"))}</pre></details>` : ""}
      ${job.status === "failed" ? `<button class="button button-secondary agent-job-retry" type="button" data-agent-job-retry="${escapeHtml(job.id)}">重试任务</button>` : ""}
    </article>
  `;
}

function renderAgentJobs(jobs) {
  if (jobs.length === 0) return `<div class="loading-state">暂无 Agent 任务。</div>`;
  return `<div class="jobs-list">${jobs.map(agentJobCard).join("")}</div>`;
}

function alignmentPanel(project, files, alignmentView) {
  const remotionStage = project.stages.find((stage) => stage.stage === "remotion");
  const hasReachedRemotion = remotionStage && !["pending", "missing", "invalidated"].includes(remotionStage.status);
  if (!hasReachedRemotion && !alignmentView?.baseline && !alignmentView?.alignment) return "";
  const scenes = Array.isArray(alignmentView.alignment?.scenes) ? alignmentView.alignment.scenes : [];
  return `
    <section class="prototype-section">
      <div class="section-heading"><div><p class="eyebrow">PROTOTYPE → REMOTION</p><h2>Gate 3 对齐检查</h2></div><a class="button button-secondary" href="${escapeHtml(alignmentView.studioUrl)}" target="_blank" rel="noreferrer">打开 Remotion Studio</a></div>
      <div class="alignment-compare">
        <div class="alignment-pane"><span class="summary-label">Gate 2 冻结原型</span>${files.some((file) => file.path.endsWith("visual-prototype.html") && file.present) ? `<iframe title="Gate 2 Visual Prototype" src="/preview/${encodeURIComponent(project.slug)}"></iframe>` : `<div class="viewer-state">缺少视觉原型。</div>`}</div>
        <div class="alignment-pane"><span class="summary-label">Remotion Studio</span><iframe title="Remotion Studio" src="${escapeHtml(alignmentView.studioUrl)}"></iframe></div>
      </div>
      <div class="alignment-summary">
        <p>冻结 Scene：${escapeHtml(alignmentView.baseline?.sceneIds?.join("、") ?? "历史项目未冻结")}</p>
        ${alignmentView.issues.length > 0 ? `<ul>${alignmentView.issues.map((item) => `<li class="${item.severity === "warning" ? "alignment-warning" : "alignment-error"}">${escapeHtml(item.message)}</li>`).join("")}</ul>` : `<p class="alignment-ok">结构对齐校验已通过，仍需在 Gate 3 人工确认实际画面。</p>`}
        ${scenes.length > 0 ? `<div class="alignment-scenes">${scenes.map((scene) => `<article><strong>Scene ${escapeHtml(scene.sceneId)}</strong><p>${escapeHtml(scene.layout)}</p><small>视觉事件：${escapeHtml((scene.visualEvents ?? []).join("；"))}</small><small>实现：${escapeHtml((scene.implementationFiles ?? []).join("、"))}</small></article>`).join("")}</div>` : ""}
      </div>
    </section>
  `;
}

function renderDetail(project, files, jobs, agentJobs, alignmentView, remotionTasks = [], activeRemoteJob = null, continuousBatch = null) {
  activeProject = project;
  const latestRemotionTask = remotionTasks.find((task) => task.slug === project.slug);
  const remotionTaskFailed = latestRemotionTask && ["blocked", "failed"].includes(latestRemotionTask.status);
  const remotionTaskBlocked = latestRemotionTask?.status === "blocked";
  const remotionTaskPending = project.currentStage === "gate-3"
    && latestRemotionTask?.slug === project.slug
    && latestRemotionTask.status !== "completed";
  const remotionTaskInProgress = project.currentStage === "remotion"
    && latestRemotionTask?.slug === project.slug
    && latestRemotionTask.status === "in-progress";
  const continuousItem = continuousBatch?.items?.find((item) => item.slug === project.slug) ?? null;
  const continuousGate2Waiting = project.currentStage === "gate-2"
    && project.next.action === "approve-or-reject-gate"
    && continuousItem?.status === "waiting-gate";
  const currentContinuousItem = (project.next.action === "run-stage"
    && continuousItem?.status === "waiting-agent-job"
    && continuousItem.phase === project.currentStage) || continuousGate2Waiting
    ? continuousItem
    : null;
  const nextActionMessage = remotionTaskPending
    ? "Remotion 任务尚未完成，当前没有可供 Gate 3 验证的新产物。完成执行并通过校验后才能继续。"
    : remotionTaskInProgress
      ? `Remotion Agent 正在制作，任务 ID：${latestRemotionTask.id}。页面会自动同步任务状态。`
      : currentContinuousItem?.status === "waiting-agent-job"
        ? currentContinuousItem.message
        : continuousGate2Waiting
          ? "已连续完成到 Gate 2，等待人工确认口播与视觉原型。"
          : project.next.message;
  const actionControls = projectActions(project, latestRemotionTask, activeRemoteJob, continuousBatch);
  projectDetail.innerHTML = `
    <div class="detail-heading">
      <div>
        <p class="card-kicker">VIDEO PROJECT · 原文件序号 ${escapeHtml(projectSequence(project))}</p>
        <h2>${escapeHtml(project.slug)}</h2>
        <p class="detail-path">${escapeHtml(project.sourceDirectory)} · ${escapeHtml(project.remotionDirectory)}</p>
      </div>
      <span class="status status-${escapeHtml(project.status)}">${escapeHtml(labelFor(project.status))}</span>
    </div>
    <div class="detail-summary">
      <div><span class="summary-label">当前阶段</span><strong>${escapeHtml(project.currentStage ?? "尚未初始化")}</strong></div>
      <div><span class="summary-label">完成进度</span><strong>${project.progress}%</strong></div>
      <div><span class="summary-label">下一步</span><strong>${escapeHtml(project.next.action)}</strong></div>
    </div>
    <div class="next-action">
      <span class="summary-label">下一步动作</span>
      <p>${escapeHtml(nextActionMessage)}</p>
      <div class="action-controls">${actionControls}</div>
      ${remotionTaskFailed ? `<div class="action-feedback action-feedback-error remotion-task-error" role="alert"><strong>${remotionTaskBlocked ? "Remotion 任务已阻塞" : "Remotion 执行失败"}</strong><p>${escapeHtml(remotionTaskErrorText(latestRemotionTask))}</p><small>任务 ID：${escapeHtml(latestRemotionTask.id)}。完成新的 Remotion 产物并通过校验后，才能重新验证 Gate 3。</small><button class="button button-secondary" type="button" data-remotion-task-action="run" data-task-id="${escapeHtml(latestRemotionTask.id)}">重新提交 Agent</button></div>` : ""}
      <p id="action-feedback" class="action-feedback" role="status" aria-live="polite" hidden></p>
    </div>
    ${project.next.action === "approve-or-reject-gate" ? rejectGateDialog(project) : ""}
    <section class="jobs-section">
      <div class="section-heading"><div><p class="eyebrow">REMOTE JOBS</p><h2>远程任务</h2></div><button class="button button-secondary" id="refresh-jobs" type="button">刷新任务</button></div>
      <div id="jobs-list">${renderJobs(jobs)}</div>
    </section>
    <section class="jobs-section">
      <div class="section-heading"><div><p class="eyebrow">AGENT JOBS</p><h2>本地 Agent 任务</h2></div></div>
      <div id="agent-jobs-list">${renderAgentJobs(agentJobs)}</div>
    </section>
    <section class="pipeline-section">
      <div class="section-heading"><div><p class="eyebrow">WORKFLOW</p><h2>生产阶段</h2></div></div>
      <ol class="pipeline">${project.stages.map(stageItem).join("")}</ol>
    </section>
    <section class="artifacts-section">
      <div class="section-heading"><div><p class="eyebrow">ARTIFACTS</p><h2>生产资料</h2></div></div>
      <div class="artifact-layout">
        <div class="file-list">
          ${files.map((file, index) => `
            <button class="file-button${file.present ? "" : " file-missing"}" type="button" data-path="${escapeHtml(file.path)}" ${file.present ? "" : "disabled"}>
              <span>${escapeHtml(file.label)}</span>
              <small>${escapeHtml(file.stage)} · ${file.present ? "可查看" : "缺失"}</small>
            </button>
          `).join("")}
        </div>
        <div class="file-viewer">
          <div id="file-viewer-state" class="viewer-state">选择左侧文件查看内容。</div>
          <pre id="file-content" hidden></pre>
        </div>
      </div>
    </section>
    ${alignmentPanel(project, files, alignmentView)}
    <section class="prototype-section">
      <div class="section-heading"><div><p class="eyebrow">VISUAL PROTOTYPE</p><h2>视觉原型预览</h2></div></div>
      <div class="prototype-frame">
        ${files.some((file) => file.path.endsWith("visual-prototype.html") && file.present)
          ? `<iframe title="Visual Prototype" src="/preview/${encodeURIComponent(project.slug)}"></iframe>`
          : "<div class=\"viewer-state\">当前项目还没有可用的 Visual Prototype。</div>"}
      </div>
    </section>
  `;

  projectDetail.querySelectorAll(".file-button:not([disabled])").forEach((button) => {
    button.addEventListener("click", () => loadFile(project.slug, button.dataset.path));
  });
  const rejectDialog = projectDetail.querySelector("#reject-gate-dialog");
  rejectDialog?.querySelectorAll("[data-reject-cancel]").forEach((button) => {
    button.addEventListener("click", () => rejectDialog.close());
  });
  rejectDialog?.querySelector("[data-reject-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const returnTo = String(form.get("returnTo") ?? "");
    const reason = String(form.get("reason") ?? "").trim();
    if (!returnTo || !reason) return;
    rejectDialog.close();
    await performAction(project, "reject", null, { returnTo, reason });
  });
  projectDetail.querySelector("#refresh-jobs")?.addEventListener("click", () => openProject(project.slug));
  projectDetail.querySelectorAll("[data-agent-job-retry]").forEach((button) => {
    button.addEventListener("click", () => retryAgentJob(project.slug, button.dataset.agentJobRetry));
  });
  projectDetail.querySelectorAll("[data-remotion-task-action]").forEach((button) => {
    button.addEventListener("click", () => performRemotionTaskAction(button.dataset.remotionTaskAction, button.dataset.taskId));
  });
}

function setActionFeedback(message, kind = "info") {
  const feedback = projectDetail.querySelector("#action-feedback");
  if (!feedback) return;
  feedback.hidden = !message;
  feedback.className = `action-feedback action-feedback-${kind}`;
  feedback.textContent = message;
}

async function retryAgentJob(slug, id) {
  try {
    const response = await apiClient.request(`/api/agent-jobs/${encodeURIComponent(id)}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "retry" }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? `HTTP ${response.status}`);
    await openProject(slug);
  } catch (error) {
    window.alert(`Agent 任务重试失败：${error.message}`);
  }
}

async function readAgentJob(id) {
  const response = await apiClient.request(`/api/agent-jobs/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (!response.ok) return null;
  const payload = await response.json();
  return payload.job ?? null;
}

async function waitForQueuedAgentJob(id) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const job = await readAgentJob(id);
    if (!job || !["queued", "running"].includes(job.status)) return job;
  }
  return null;
}

async function readRemotionTask(id) {
  const response = await apiClient.request(`/api/remotion-tasks/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (!response.ok) return null;
  const payload = await response.json();
  return payload.task ?? null;
}

async function waitForQueuedRemotionTask(id) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const task = await readRemotionTask(id);
    if (!task || !["ready", "in-progress"].includes(task.status)) return task;
  }
  return readRemotionTask(id);
}

function remotionTaskStatusText(status) {
  return {
    ready: "等待 Agent 执行",
    "in-progress": "Agent 正在制作",
    blocked: "已阻塞",
    failed: "执行失败",
    completed: "制作完成，等待校验",
  }[status] ?? status;
}

function remotionTaskErrorText(task) {
  const message = task.error?.message ?? "未提供错误详情";
  const stderr = String(task.error?.stderr ?? "").trim();
  if (!stderr) return message;
  const detail = stderr.split(/\r?\n/).filter(Boolean).slice(-3).join(" ");
  return `${message} · 详细原因：${detail}`;
}

function watchRemotionTask(slug, id) {
  polling.stop("remotion-task");
  let attempts = 0;
  const poll = async () => {
    attempts += 1;
    const task = await readRemotionTask(id);
    if (!task) {
      polling.stop("remotion-task");
      setActionFeedback("Remotion 任务已提交，但暂时无法读取任务状态。请刷新项目查看。", "error");
      return;
    }
    if (["ready", "in-progress"].includes(task.status)) {
      setActionFeedback(`Remotion 任务已创建（${remotionTaskStatusText(task.status)}），任务 ID：${task.id}`, "info");
      if (attempts >= 40) {
        polling.stop("remotion-task");
        setActionFeedback("Remotion 任务仍在执行，已停止自动轮询；可刷新页面查看最新状态。", "info");
      }
      return;
    }
    polling.stop("remotion-task");
    if (task.status === "blocked" || task.status === "failed") {
      setActionFeedback(`Remotion 任务${remotionTaskStatusText(task.status)}：${task.error?.message ?? "请查看任务详情后重试"}`, "error");
      return;
    }
    if (task.status === "completed") {
      setActionFeedback("Remotion 制作完成，正在重新校验项目……", "info");
      await openProject(slug);
    }
  };
  void poll();
  polling.start("remotion-task", poll, 1500);
}

function jobCard(job) {
  return `
    <article class="job-card">
      <div><strong>${escapeHtml(job.slug ? `${job.slug} · ` : "")}${escapeHtml(job.stage)}</strong><span class="job-id">${escapeHtml(job.id)}</span></div>
      <span class="stage-status">${escapeHtml(labelFor(job.status, jobStatusLabels))}</span>
      <p>${job.error?.message
        ? escapeHtml(job.error.message)
        : job.remote?.runUrl
          ? `<a href="${escapeHtml(job.remote.runUrl)}" target="_blank" rel="noreferrer">查看 GitHub Actions Run</a>`
          : "任务状态已记录"}</p>
      <div class="job-meta">
        <span>${escapeHtml(job.remote?.runId ? `Run #${job.remote.runId}` : "尚未发现 Run")}</span>
        <span>${escapeHtml(job.result?.outputs?.[0]?.artifactName ? `Artifact：${job.result.outputs[0].artifactName}` : "Artifact：待检查")}</span>
        <span>${escapeHtml(job.lastCheckedAt ? `最近检查：${job.lastCheckedAt}` : "尚未检查")}</span>
        ${job.nextCheckAt ? `<span>下次检查：${escapeHtml(job.nextCheckAt)}</span>` : ""}
      </div>
    </article>
  `;
}

function renderJobs(jobs) {
  if (jobs.length === 0) return `<div class="loading-state">暂无远程任务。</div>`;
  return `<div class="jobs-list">${jobs.map(jobCard).join("")}</div>`;
}

function renderGlobalJobs(jobs) {
  globalJobsList.classList.remove("loading-state");
  globalJobsList.innerHTML = jobs.length === 0
    ? `<div class="loading-state">暂无远程任务。</div>`
    : jobs.map(jobCard).join("");
}

function projectActions(project, latestRemotionTask = null, activeRemoteJob = null, continuousBatch = null) {
  if (!project.initialized) {
    return `<button class="button button-primary" type="button" data-action="initialize">初始化 Harness</button><button class="button button-secondary" type="button" data-action="legacy-validate">Legacy 只读检查</button>`;
  }

  const buttons = [
    `<button class="button button-secondary" type="button" data-action="validate">重新校验</button>`,
    `<button class="button button-secondary" type="button" data-action="legacy-validate">Legacy 只读检查</button>`,
  ];
  const continuousItem = continuousBatch?.items?.find((item) => item.slug === project.slug) ?? null;
  const continuousGate2Waiting = project.currentStage === "gate-2"
    && project.next.action === "approve-or-reject-gate"
    && continuousItem?.status === "waiting-gate";
  const currentContinuousItem = project.next.action === "run-stage"
    && ["queued", "running"].includes(continuousItem?.status)
    || project.next.action === "run-stage"
      && continuousItem?.status === "waiting-agent-job"
      && continuousItem.phase === project.currentStage
    || continuousGate2Waiting
    ? continuousItem
    : null;
  const continuousStages = new Set(["source", "content-analysis", "video-narrative", "scene-script", "narration-script", "visual-script", "visual-prototype"]);
  const continuousEligible = ["run-stage", "fix-validation-issues"].includes(project.next.action)
    && continuousStages.has(project.currentStage);
  const continuousActive = currentContinuousItem && ["queued", "running", "waiting-agent-job"].includes(currentContinuousItem.status);
  if (continuousActive) {
    buttons.push(`<button class="button button-primary" type="button" disabled>连续生成至 Gate 2（执行中）</button>`);
    buttons.push(`<span class="action-note">${escapeHtml(currentContinuousItem.message)} 批次会在每个 Agent 产物校验通过后自动继续。</span>`);
  } else if (continuousEligible && !currentContinuousItem) {
    buttons.push(`<button class="button button-primary" type="button" data-action="run-to-gate-2">连续生成至 Gate 2</button>`);
    buttons.push(`<span class="action-note">从当前阶段自动执行到 Gate 2，中间不逐步等待人工确认。</span>`);
  } else if (continuousGate2Waiting) {
    buttons.push(`<span class="action-note">已连续生成至 Gate 2，等待人工确认口播与视觉原型。</span>`);
  }
  const subtitleTimeline = project.stages.find((stage) => stage.stage === "subtitle-timeline");
  const ttsQcPending = project.currentStage !== "completed"
    && subtitleTimeline?.status === "succeeded"
    && subtitleTimeline.review?.decision !== "approved";
  if (ttsQcPending) buttons.push(`<button class="button button-primary" type="button" data-action="approve-tts-qc">确认 TTS 质检</button>`);
  const currentRemotionTask = project.currentStage === "remotion"
    && latestRemotionTask?.slug === project.slug
    && latestRemotionTask.status !== "completed"
    ? latestRemotionTask
    : null;
  if (project.next.action === "run-stage" && currentRemotionTask?.status === "ready") {
    buttons.push(`<button class="button button-primary" type="button" data-remotion-task-action="run" data-task-id="${escapeHtml(currentRemotionTask.id)}">执行 Agent</button>`);
  } else if (project.next.action === "run-stage" && currentRemotionTask?.status === "in-progress") {
    buttons.push(`<button class="button button-primary" type="button" disabled>Agent 正在制作</button>`);
    buttons.push(`<span class="action-note">Remotion 任务 ${escapeHtml(currentRemotionTask.id)} 正在执行。</span>`);
  } else if (project.next.action === "run-stage" && !currentRemotionTask && !continuousEligible && !continuousActive) {
    buttons.push(`<button class="button button-primary" type="button" data-action="run">执行当前阶段</button>`);
  }
  if (project.next.action === "run-stage" && (project.currentStage === "smoke-render" || project.currentStage === "render")) {
    buttons.pop();
    if (activeRemoteJob?.stage === project.currentStage) {
      buttons.push(`<button class="button button-primary" type="button" disabled>远程任务执行中</button>`);
      buttons.push(`<span class="action-note">当前 ${escapeHtml(project.currentStage)} 已有远程任务正在运行（${escapeHtml(labelFor(activeRemoteJob.status, jobStatusLabels))}，任务 ID：${escapeHtml(activeRemoteJob.id)}），请等待完成或在下方查看任务状态。</span>`);
    } else {
      buttons.push(`<button class="button button-primary" type="button" data-action="remote-run">提交远程任务</button>`);
    }
  }
  if (project.next.action === "fix-validation-issues"
    && (project.currentStage === "smoke-render" || project.currentStage === "render")) {
    const blockingIssues = project.next.issues.filter((issue) => issue.severity !== "warning");
    const hasGitDeliveryIssues = blockingIssues.some((issue) => issue.code === "git-render-delivery-invalid");
    if (project.currentStage === "smoke-render") {
      buttons.push(`<button class="button button-primary" type="button" data-action="remote-run">提交并执行 Smoke Render</button>`);
      buttons.push(`<span class="action-note">一次完成资源准备和交付预检；需要提交代码时，只会提交当前视频的渲染文件，并在执行前请求一次确认。</span>`);
    } else if (project.next.preparation?.action === "prepare-remote-render") {
      buttons.push(`<button class="button button-primary" type="button" data-action="prepare-remote-render">准备远程渲染资源</button>`);
      buttons.push(`<span class="action-note">资源准备：可先打包并校验本地资源；此操作不会提交或推送代码。</span>`);
    }
    const nextStep = hasGitDeliveryIssues
      ? "请按下方列表修复问题，涉及 Git 的文件完成 commit/push 后，再点击“重新校验”。"
      : "请按下方列表修复问题，再点击“重新校验”。";
    buttons.push(`<span class="action-note action-note-error">提交阻塞：当前有 ${blockingIssues.length} 个交付预检问题。${nextStep}</span>`);
  }
  if (["smoke-render", "render"].includes(project.currentStage)) {
    buttons.push(`<button class="button button-secondary" type="button" data-action="find-historical">查找历史 Artifact</button>`);
  }
  if (project.next.action === "retry-stage") buttons.push(`<button class="button button-primary" type="button" data-action="retry">重试当前阶段</button>`);
  if (project.next.action === "resume-from-invalidated-stage") buttons.push(`<button class="button button-primary" type="button" data-action="resume">恢复项目</button>`);
  if (project.next.action === "approve-or-reject-gate") {
    const remotionTaskNotCompleted = project.currentStage === "gate-3"
      && latestRemotionTask?.slug === project.slug
      && latestRemotionTask.status !== "completed";
    if (remotionTaskNotCompleted) {
      buttons.push(`<span class="action-note action-note-error">当前没有可供 Gate 3 验证的新 Remotion 产物。</span>`);
      if (["ready", "blocked", "failed"].includes(latestRemotionTask.status)) {
        buttons.push(`<button class="button button-secondary" type="button" data-remotion-task-action="run" data-task-id="${escapeHtml(latestRemotionTask.id)}">${latestRemotionTask.status === "ready" ? "执行 Agent" : "重试 Agent"}</button>`);
      }
    } else {
      buttons.push(`<button class="button button-primary" type="button" data-action="approve">通过 ${escapeHtml(project.currentStage)}</button>`);
      buttons.push(`<button class="button button-secondary" type="button" data-action="reject">驳回 Gate</button>`);
    }
  }
  return buttons.join("");
}

async function performAction(project, action, runId = null, rejectInput = null) {
  if (action === "initialize" && !window.confirm(`初始化 ${project.slug} 的 Harness 状态吗？`)) return;
  const body = { action };
  if (["validate", "run", "retry", "remote-run", "prepare-remote-render", "find-historical", "adopt-historical"].includes(action)) body.stage = project.currentStage;
  if (action === "adopt-historical") body.runId = runId;
  if (action === "approve") body.gate = project.currentStage;
  if (action === "reject") {
    if (!rejectInput) {
      projectDetail.querySelector("#reject-gate-dialog")?.showModal();
      return;
    }
    body.gate = project.currentStage;
    body.returnTo = rejectInput.returnTo;
    body.reason = rejectInput.reason;
    if (!body.returnTo || !body.reason) return;
  }

  const actionButton = [...projectDetail.querySelectorAll("[data-action]")]
    .find((button) => button.dataset.action === action);
  const actionButtonLabel = actionButton?.textContent ?? "";
  const restoreActionButton = () => {
    if (!actionButton) return;
    actionButton.disabled = false;
    actionButton.textContent = actionButtonLabel;
  };
  if (actionButton) {
    actionButton.disabled = true;
    actionButton.textContent = "提交中……";
  }
  setActionFeedback("正在提交当前阶段请求……", "info");

  try {
    const sendAction = async (requestBody) => {
      const response = await apiClient.request(`/api/projects/${encodeURIComponent(project.slug)}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? `HTTP ${response.status}`);
      return payload;
    };
    let payload = await sendAction(body);
    if (action === "remote-run" && payload.result?.status === "needs-confirmation") {
      const plan = payload.commitPlan ?? { branch: "当前分支", commitPaths: [] };
      const paths = plan.commitPaths.length > 0 ? plan.commitPaths.map((item) => `- ${item}`).join("\n") : "（没有可定向提交的文件）";
      const confirmed = window.confirm(
        `Smoke Render 提交前需要定向 commit/push。\n\n分支：${plan.branch}\n将提交的文件：\n${paths}\n\n确认后会自动 commit、push，并提交 Smoke Render。其他改动不会被提交。`,
      );
      if (!confirmed) {
        restoreActionButton();
        setActionFeedback("已取消提交和推送，未创建远程任务。", "info");
        return;
      }
      payload = await sendAction({ ...body, commitAndPush: true, confirmDelivery: true });
    }
    if (payload.job?.id && payload.result?.status === "queued") {
      const job = await waitForQueuedAgentJob(payload.job.id);
      if (job?.status === "failed") {
        throw new Error(`后台任务失败：${job.error?.message ?? "未配置执行器"}`);
      }
    }
    const remotionTaskId = payload.result?.taskId ?? payload.task?.id;
    if (remotionTaskId && payload.result?.status === "queued") {
      const task = await waitForQueuedRemotionTask(remotionTaskId);
      if (task?.status === "failed" || task?.status === "blocked") {
        throw new Error(`Remotion 后台任务未执行：${task.error?.message ?? "请配置 Remotion 执行器后重试"}`);
      }
      if (task && ["ready", "in-progress"].includes(task.status)) {
        await openProject(project.slug);
        setActionFeedback(`Remotion 任务已创建（${remotionTaskStatusText(task.status)}），任务 ID：${task.id}`, "info");
        watchRemotionTask(project.slug, task.id);
        return;
      }
    }
    if (action === "find-historical") {
      const candidates = payload.result.candidates ?? [];
      if (candidates.length === 0) {
        restoreActionButton();
        window.alert("没有找到带有匹配 Artifact 的成功历史 Run。");
        return;
      }
      const options = candidates.map((candidate, index) =>
        `${index + 1}. Run #${candidate.runId} · ${candidate.ref} · ${candidate.createdAt} · ${candidate.artifactName} · ${candidate.artifactSizeInBytes} bytes`
      ).join("\n");
      const answer = window.prompt(`找到历史成功结果，请输入要认领的序号：\n${options}`, "1");
      const index = Number(answer) - 1;
      if (!Number.isInteger(index) || !candidates[index]) {
        restoreActionButton();
        return;
      }
      const candidate = candidates[index];
      if (!window.confirm(`确认认领 Run #${candidate.runId} 的 Artifact ${candidate.artifactName} 吗？\n分支：${candidate.ref}`)) {
        restoreActionButton();
        return;
      }
      await performAction(project, "adopt-historical", candidate.runId);
      return;
    }
    if (action === "legacy-validate") {
      const errors = payload.result.issues.filter((issue) => issue.severity !== "warning").length;
      const warnings = payload.result.issues.filter((issue) => issue.severity === "warning").length;
      window.alert(`Legacy 只读检查完成：${errors} 个错误，${warnings} 个警告。\n视频资料没有被修改。`);
    }
    if (action === "approve-tts-qc") {
      await Promise.all([openProject(project.slug), loadBatches()]);
    } else {
      await openProject(project.slug);
    }
    if (action === "remote-run" && payload.result?.delivery?.status === "committed") {
      setActionFeedback(`已提交 ${payload.result.delivery.commit} 并推送到 ${payload.result.delivery.branch}，Smoke Render 已排队。`, "info");
    }
  } catch (error) {
    restoreActionButton();
    const message = `操作失败：${error.message}`;
    setActionFeedback(message, "error");
    window.alert(message);
  }
}

async function loadFile(slug, filePath) {
  const stateElement = document.querySelector("#file-viewer-state");
  const contentElement = document.querySelector("#file-content");
  stateElement.hidden = false;
  stateElement.textContent = "正在读取文件……";
  contentElement.hidden = true;
  try {
    const query = new URLSearchParams({ path: filePath });
    const response = await apiClient.request(`/api/projects/${encodeURIComponent(slug)}/file?${query.toString()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    stateElement.hidden = true;
    contentElement.textContent = payload.file.content;
    contentElement.hidden = false;
  } catch (error) {
    stateElement.textContent = `读取失败：${error.message}`;
  }
}

async function loadProjects() {
  projectListState.hidden = false;
  projectListState.textContent = "正在读取视频项目……";
  try {
    const [projectsResponse, jobsResponse, seriesResponse] = await Promise.all([
      apiClient.request("/api/projects", { cache: "no-store" }),
      apiClient.request("/api/jobs", { cache: "no-store" }),
      apiClient.request("/api/series", { cache: "no-store" }),
    ]);
    if (!projectsResponse.ok || !jobsResponse.ok || !seriesResponse.ok) throw new Error(`HTTP ${projectsResponse.status}/${jobsResponse.status}/${seriesResponse.status}`);
    const [projectsPayload, jobsPayload, seriesPayload] = await Promise.all([projectsResponse.json(), jobsResponse.json(), seriesResponse.json()]);
    availableProjects = projectsPayload.projects;
    availableSeries = seriesPayload.series ?? [];
    appStore.setState({ projects: availableProjects, series: availableSeries });
    if (!activeSeriesId && availableSeries.length > 0) activeSeriesId = availableSeries[0].id;
    renderProjects(projectsPayload.projects);
    renderGlobalJobs(jobsPayload.jobs);
    renderSeriesManager();
    renderSourceImportSeriesOptions();
    updateSourceImportState();
    await loadBatches();
  } catch (error) {
    projectListState.hidden = false;
    projectListState.textContent = `读取失败：${error.message}`;
    projectGrid.innerHTML = "";
  }
}

async function checkGitHubConfig() {
  githubDiagnostics.hidden = false;
  githubDiagnostics.textContent = "正在检查 GitHub 配置和远程权限……";
  try {
    const response = await apiClient.request("/api/diagnostics/github", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    githubDiagnostics.innerHTML = `<strong>${result.ok ? "GitHub Actions 配置可用" : "GitHub Actions 配置仍有问题"}</strong><br>${result.checks.map((item) => `${escapeHtml(item.status)} · ${escapeHtml(item.name)}：${escapeHtml(item.message)}`).join("<br>")}`;
  } catch (error) {
    githubDiagnostics.textContent = `检查失败：${error.message}`;
  }
}

async function openProject(slug) {
  const requestId = ++activeProjectRequest;
  try {
    polling.stop("project");
    const workspace = await apiClient.getProjectWorkspace(slug);
    if (requestId !== activeProjectRequest) return;
    appStore.setState({ activeProjectSlug: slug, activeProjectWorkspace: workspace });
    const project = workspace.project;
    const jobsPayload = { jobs: workspace.jobs ?? [], activeJob: workspace.activeJob ?? null };
    const agentJobsPayload = { jobs: workspace.agentJobs ?? [] };
    const remotionTasks = workspace.remotionTasks ?? [];
    renderDetail(project, workspace.files ?? [], jobsPayload.jobs, agentJobsPayload.jobs, workspace.alignment, remotionTasks, jobsPayload.activeJob, workspace.continuousBatch);
    dashboardView.hidden = true;
    detailView.hidden = false;
    window.location.hash = `project=${encodeURIComponent(slug)}`;
    const latestRemotionTask = remotionTasks.find((task) => task.slug === slug);
    const hasActiveRemotionTask = latestRemotionTask && ["ready", "in-progress"].includes(latestRemotionTask.status);
    const hasActiveRemoteJob = Boolean(jobsPayload.activeJob);
    if (agentJobsPayload.jobs.some((job) => ["queued", "running"].includes(job.status)) || hasActiveRemotionTask || hasActiveRemoteJob || workspace.continuousBatch?.items.some((item) => ["queued", "running", "waiting-agent-job"].includes(item.status))) {
      polling.start("project", () => openProject(slug), hasActiveRemoteJob ? 5000 : 1500);
    }
  } catch (error) {
    projectListState.hidden = false;
    projectListState.textContent = `读取项目失败：${error.message}`;
  }
}

function showDashboard() {
  activeProjectRequest += 1;
  polling.stop("project");
  polling.stop("remotion-task");
  appStore.setState({ route: { name: "projects", slug: null }, activeProjectSlug: null, activeProjectWorkspace: null });
  detailView.hidden = true;
  dashboardView.hidden = false;
  if (window.location.hash) history.replaceState(null, "", window.location.pathname);
}

async function checkHealth() {
  try {
    const response = await apiClient.request("/api/health", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    statusElement.textContent = `服务正常 · Harness ${payload.harnessVersion}`;
    statusElement.className = "status status-ok";
  } catch (error) {
    statusElement.textContent = "服务异常";
    statusElement.className = "status status-error";
    console.error(error);
  }
}

export function startApplication() {
  document.querySelector("#refresh-projects").addEventListener("click", loadProjects);
  document.querySelector("#refresh-batches").addEventListener("click", loadBatches);
  document.querySelector("#refresh-jobs-dashboard").addEventListener("click", loadProjects);
  document.querySelector("#check-github-config").addEventListener("click", checkGitHubConfig);
  document.querySelector("#back-to-projects").addEventListener("click", showDashboard);
  projectDetail.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button || button.disabled || !activeProject) return;
    void performAction(activeProject, button.dataset.action);
  });
  document.querySelector("#new-series").addEventListener("click", () => {
    activeSeriesId = "";
    clearSelectedCover();
    renderSeriesManager();
  });
  seriesSelect.addEventListener("change", () => {
    activeSeriesId = seriesSelect.value;
    clearSelectedCover();
    renderSeriesManager();
  });
  seriesForm.addEventListener("submit", saveSeriesSettings);
  seriesCoverFile.addEventListener("change", previewSelectedCover);
  uploadSeriesCoverButton.addEventListener("click", uploadSeriesCover);
  sourceImportFile.addEventListener("change", updateSourceImportState);
  sourceImportSeries.addEventListener("change", updateSourceImportState);
  sourceImportForm.addEventListener("submit", importSourceProject);
  batchToGate2Button.addEventListener("click", () => createBatch("to-gate-2"));
  batchToTtsButton.addEventListener("click", () => createBatch("to-tts"));
  batchToRemotionButton.addEventListener("click", () => createBatch("to-remotion"));
  batchToRenderButton.addEventListener("click", () => createBatch("to-render"));

  void checkHealth();
  void loadProjects();
  const projectHash = window.location.hash.match(/^#project=(.+)$/);
  if (projectHash) void openProject(decodeURIComponent(projectHash[1]));
}
