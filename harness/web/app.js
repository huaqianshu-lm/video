const statusElement = document.querySelector("#service-status");
const dashboardView = document.querySelector("#dashboard-view");
const detailView = document.querySelector("#detail-view");
const projectGrid = document.querySelector("#project-grid");
const projectListState = document.querySelector("#project-list-state");
const projectDetail = document.querySelector("#project-detail");

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
  "waiting-config": "等待配置",
  "waiting-run": "等待 Run",
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
  return `
    <article class="project-card">
      <div class="card-heading">
        <div class="project-label">
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
            <h3>${escapeHtml(stage.stage)}</h3>
            <p>${escapeHtml(stage.objective)}</p>
          </div>
          <span class="stage-status">${escapeHtml(labelFor(status, stageStatusLabels))}</span>
        </div>
        <div class="stage-meta"><span>${escapeHtml(artifactText)}</span>${stage.requiresApproval ? "<span>需要人工确认</span>" : ""}</div>
      </div>
    </li>
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
  projectGrid.querySelectorAll(".project-open").forEach((button) => {
    button.addEventListener("click", () => openProject(button.dataset.slug));
  });
}

function renderDetail(project, files, jobs) {
  const actionControls = projectActions(project);
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
      <p>${escapeHtml(project.next.message)}</p>
      <div class="action-controls">${actionControls}</div>
    </div>
    <section class="jobs-section">
      <div class="section-heading"><div><p class="eyebrow">REMOTE JOBS</p><h2>远程任务</h2></div><button class="button button-secondary" id="refresh-jobs" type="button">刷新任务</button></div>
      <div id="jobs-list">${renderJobs(jobs)}</div>
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
  projectDetail.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => performAction(project, button.dataset.action));
  });
  projectDetail.querySelector("#refresh-jobs")?.addEventListener("click", () => openProject(project.slug));
}

function renderJobs(jobs) {
  if (jobs.length === 0) return `<div class="loading-state">暂无远程任务。</div>`;
  return `<div class="jobs-list">${jobs.map((job) => `
    <article class="job-card">
      <div><strong>${escapeHtml(job.stage)}</strong><span class="job-id">${escapeHtml(job.id)}</span></div>
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
      </div>
    </article>
  `).join("")}</div>`;
}

function projectActions(project) {
  if (!project.initialized) {
    return `<button class="button button-primary" type="button" data-action="initialize">初始化 Harness</button><button class="button button-secondary" type="button" data-action="legacy-validate">Legacy 只读检查</button>`;
  }

  const buttons = [
    `<button class="button button-secondary" type="button" data-action="validate">重新校验</button>`,
    `<button class="button button-secondary" type="button" data-action="legacy-validate">Legacy 只读检查</button>`,
  ];
  if (project.next.action === "run-stage") buttons.push(`<button class="button button-primary" type="button" data-action="run">执行当前阶段</button>`);
  if (project.next.action === "run-stage" && (project.currentStage === "smoke-render" || project.currentStage === "render")) {
    buttons.pop();
    buttons.push(`<button class="button button-primary" type="button" data-action="remote-run">提交远程任务</button>`);
  }
  if (project.next.action === "retry-stage") buttons.push(`<button class="button button-primary" type="button" data-action="retry">重试当前阶段</button>`);
  if (project.next.action === "resume-from-invalidated-stage") buttons.push(`<button class="button button-primary" type="button" data-action="resume">恢复项目</button>`);
  if (project.next.action === "approve-or-reject-gate") {
    buttons.push(`<button class="button button-primary" type="button" data-action="approve">通过 ${escapeHtml(project.currentStage)}</button>`);
    buttons.push(`<button class="button button-secondary" type="button" data-action="reject">驳回 Gate</button>`);
  }
  return buttons.join("");
}

async function performAction(project, action) {
  if (action === "initialize" && !window.confirm(`初始化 ${project.slug} 的 Harness 状态吗？`)) return;
  const body = { action };
  if (action === "validate" || action === "run" || action === "retry" || action === "remote-run") body.stage = project.currentStage;
  if (action === "approve") body.gate = project.currentStage;
  if (action === "reject") {
    body.gate = project.currentStage;
    body.returnTo = window.prompt("请输入回退阶段，例如 visual-script：");
    body.reason = window.prompt("请输入驳回原因：");
    if (!body.returnTo || !body.reason) return;
  }

  try {
    const response = await fetch(`/api/projects/${encodeURIComponent(project.slug)}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? `HTTP ${response.status}`);
    if (action === "legacy-validate") {
      const errors = payload.result.issues.filter((issue) => issue.severity !== "warning").length;
      const warnings = payload.result.issues.filter((issue) => issue.severity === "warning").length;
      window.alert(`Legacy 只读检查完成：${errors} 个错误，${warnings} 个警告。\n视频资料没有被修改。`);
    }
    await openProject(project.slug);
  } catch (error) {
    window.alert(`操作失败：${error.message}`);
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
    const response = await fetch(`/api/projects/${encodeURIComponent(slug)}/file?${query.toString()}`, { cache: "no-store" });
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
    const response = await fetch("/api/projects", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    renderProjects(payload.projects);
  } catch (error) {
    projectListState.hidden = false;
    projectListState.textContent = `读取失败：${error.message}`;
    projectGrid.innerHTML = "";
  }
}

async function openProject(slug) {
  try {
    const [projectResponse, filesResponse, jobsResponse] = await Promise.all([
      fetch(`/api/projects/${encodeURIComponent(slug)}`, { cache: "no-store" }),
      fetch(`/api/projects/${encodeURIComponent(slug)}/files`, { cache: "no-store" }),
      fetch(`/api/projects/${encodeURIComponent(slug)}/jobs`, { cache: "no-store" }),
    ]);
    if (!projectResponse.ok || !filesResponse.ok || !jobsResponse.ok) throw new Error(`HTTP ${projectResponse.status}/${filesResponse.status}/${jobsResponse.status}`);
    const [payload, filesPayload, jobsPayload] = await Promise.all([projectResponse.json(), filesResponse.json(), jobsResponse.json()]);
    renderDetail(payload.project, filesPayload.files, jobsPayload.jobs);
    dashboardView.hidden = true;
    detailView.hidden = false;
    window.location.hash = `project=${encodeURIComponent(slug)}`;
  } catch (error) {
    projectListState.hidden = false;
    projectListState.textContent = `读取项目失败：${error.message}`;
  }
}

function showDashboard() {
  detailView.hidden = true;
  dashboardView.hidden = false;
  if (window.location.hash) history.replaceState(null, "", window.location.pathname);
}

async function checkHealth() {
  try {
    const response = await fetch("/api/health", { cache: "no-store" });
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

document.querySelector("#refresh-projects").addEventListener("click", loadProjects);
document.querySelector("#back-to-projects").addEventListener("click", showDashboard);

checkHealth();
loadProjects();

const projectHash = window.location.hash.match(/^#project=(.+)$/);
if (projectHash) openProject(decodeURIComponent(projectHash[1]));
