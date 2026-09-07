import { escapeHtml } from "../../shared/html.js";
import { jobStatusLabels, labelFor } from "../../shared/labels.js";

function card(job) {
  const message = job.error?.message ? escapeHtml(job.error.message) : job.remote?.runUrl ? `<a href="${escapeHtml(job.remote.runUrl)}" target="_blank" rel="noreferrer">查看 GitHub Actions Run</a>` : "任务状态已记录";
  return `<article class="job-card"><div><strong>${escapeHtml(job.slug ? `${job.slug} · ` : "")}${escapeHtml(job.stage)}</strong><span class="job-id">${escapeHtml(job.id)}</span></div><span class="stage-status status status-${escapeHtml(job.status)}">${escapeHtml(labelFor(job.status, jobStatusLabels))}</span><p>${message}</p><div class="job-meta"><span>${escapeHtml(job.remote?.runId ? `Run #${job.remote.runId}` : "尚未发现 Run")}</span><span>${escapeHtml(job.result?.outputs?.[0]?.artifactName ? `Artifact：${job.result.outputs[0].artifactName}` : "Artifact：待检查")}</span><span>${escapeHtml(job.lastCheckedAt ? `最近检查：${job.lastCheckedAt}` : "尚未检查")}</span></div></article>`;
}

export function createRemoteJobsView({ elements, api, refreshButton, diagnosticsButton } = {}) {
  let mounted = false;
  let refreshPromise = null;
  let diagnosticsPromise = null;
  let refreshHandler;
  let diagnosticsHandler;
  async function refresh() {
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
      try { const jobs = await api.getJobs(); elements.list.classList.remove("loading-state"); elements.list.innerHTML = jobs.length ? jobs.map(card).join("") : `<div class="loading-state">暂无远程任务。</div>`; }
      catch (error) { elements.list.textContent = `读取远程任务失败：${error.message}`; }
      finally { refreshPromise = null; }
    })();
    return refreshPromise;
  }
  async function diagnostics() {
    if (diagnosticsPromise) return diagnosticsPromise;
    elements.diagnostics.hidden = false; elements.diagnostics.textContent = "正在检查 GitHub 配置和远程权限……";
    diagnosticsPromise = (async () => {
      try { const result = await api.getGitHubDiagnostics(); elements.diagnostics.innerHTML = `<strong>${result.ok ? "GitHub Actions 配置可用" : "GitHub Actions 配置仍有问题"}</strong><br>${result.checks.map((item) => `${escapeHtml(item.status)} · ${escapeHtml(item.name)}：${escapeHtml(item.message)}`).join("<br>")}`; }
      catch (error) { elements.diagnostics.textContent = `检查失败：${error.message}`; }
      finally { diagnosticsPromise = null; }
    })();
    return diagnosticsPromise;
  }
  function mount() { if (mounted) return; mounted = true; refreshHandler = () => void refresh(); diagnosticsHandler = () => void diagnostics(); refreshButton?.addEventListener("click", refreshHandler); diagnosticsButton?.addEventListener("click", diagnosticsHandler); void refresh(); }
  return { mount, unmount() { if (!mounted) return; mounted = false; refreshButton?.removeEventListener("click", refreshHandler); diagnosticsButton?.removeEventListener("click", diagnosticsHandler); }, refresh, diagnostics };
}
