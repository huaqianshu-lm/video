import { COVER_HEIGHT, COVER_WIDTH, coverCropFor } from "../../cover-image.js";
import { escapeHtml } from "../../shared/html.js";

export function createSeriesView({ elements, api, getProjects, onImported } = {}) {
  let mounted = false;
  let series = [];
  let projects = [];
  let activeId = "";
  let previewUrl = null;
  const active = () => series.find((item) => item.id === activeId) ?? null;
  const clearPreview = () => { if (previewUrl) URL.revokeObjectURL(previewUrl); previewUrl = null; };

  function renderImportOptions() {
    const selected = elements.importSeries.value;
    elements.importSeries.innerHTML = ['<option value="">请选择系列</option>', '<option value="none">不归入系列（使用通用 current 风格）</option>', ...series.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.title)} · ${escapeHtml(item.id)} · ${escapeHtml(item.style)}</option>`)].join("");
    elements.importSeries.value = [...elements.importSeries.options].some((option) => option.value === selected) ? selected : "";
  }

  function render() {
    const current = active();
    elements.seriesSelect.innerHTML = `<option value="">新建系列</option>${series.map((item) => `<option value="${escapeHtml(item.id)}"${item.id === activeId ? " selected" : ""}>${escapeHtml(item.title)} · ${escapeHtml(item.id)}</option>`).join("")}`;
    elements.seriesId.value = current?.id ?? ""; elements.seriesId.readOnly = Boolean(current);
    elements.seriesTitle.value = current?.title ?? ""; elements.seriesStyle.value = current?.style ?? "current";
    elements.seriesCoverFrames.value = String(current?.coverDurationFrames ?? 45);
    elements.seriesVideoList.innerHTML = projects.map((project) => `<label><input type="checkbox" name="series-video" value="${escapeHtml(project.slug)}"${current?.videos.includes(project.slug) ? " checked" : ""} /><span>${escapeHtml(project.slug)}</span></label>`).join("") || "暂无视频项目。";
    if (current?.cover) { elements.seriesCoverPreview.innerHTML = `<img src="/${escapeHtml(current.cover)}?v=${encodeURIComponent(current.updatedAt ?? "")}" alt="${escapeHtml(current.title)}封面" />`; elements.seriesState.textContent = `当前封面：${current.cover} · ${current.coverDurationFrames} 帧`; }
    else { elements.seriesCoverPreview.innerHTML = "<span>尚未上传系列封面</span>"; elements.seriesState.textContent = current ? "系列已建立，可以上传 16:9 封面。" : "选择或创建系列后上传封面。"; }
    elements.uploadSeriesCover.disabled = !current || !elements.seriesCoverFile.files?.[0];
    renderImportOptions();
  }

  async function refresh() {
    series = await api.getSeries(); projects = getProjects?.() ?? projects;
    if (activeId && !series.some((item) => item.id === activeId)) activeId = "";
    if (!activeId && series[0]) activeId = series[0].id;
    render();
  }

  function readImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file); const image = new Image();
      image.onload = () => resolve({ image, url, width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("无法读取图片")); }; image.src = url;
    });
  }

  async function normalizeCover(file) {
    const source = await readImage(file);
    try {
      const crop = coverCropFor(source.width, source.height); const canvas = document.createElement("canvas");
      canvas.width = COVER_WIDTH; canvas.height = COVER_HEIGHT; const context = canvas.getContext("2d");
      if (!context) throw new Error("浏览器无法处理图片");
      context.drawImage(source.image, crop.x, crop.y, crop.width, crop.height, 0, 0, COVER_WIDTH, COVER_HEIGHT);
      const blob = await new Promise((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("无法生成标准封面")), file.type, file.type === "image/png" ? undefined : 0.92));
      return { blob, sourceWidth: source.width, sourceHeight: source.height };
    } finally { URL.revokeObjectURL(source.url); }
  }

  async function save(event) {
    event.preventDefault(); const current = active();
    const videos = [...elements.seriesVideoList.querySelectorAll('input[name="series-video"]:checked')].map((input) => input.value);
    const removed = (current?.videos ?? []).filter((slug) => !videos.includes(slug));
    if (removed.length > 0 && !window.confirm(`将从系列中移除已有视频：${removed.join(", ")}。\n\n确认继续吗？`)) return;
    elements.seriesState.textContent = "正在保存系列设置……";
    try { const result = await api.saveSeries({ id: elements.seriesId.value.trim(), title: elements.seriesTitle.value.trim(), style: elements.seriesStyle.value, coverDurationFrames: Number(elements.seriesCoverFrames.value), videos, confirmVideoRemoval: removed.length > 0 }); activeId = result.series.id; await refresh(); elements.seriesState.textContent = "系列设置已保存。"; }
    catch (error) { elements.seriesState.textContent = `保存失败：${error.message}`; }
  }

  async function previewCover() {
    const file = elements.seriesCoverFile.files?.[0]; clearPreview(); elements.uploadSeriesCover.disabled = !active() || !file;
    if (!file) return render();
    try { if (file.size > 10 * 1024 * 1024) throw new Error("图片超过 10 MB"); const source = await readImage(file); try { coverCropFor(source.width, source.height); previewUrl = URL.createObjectURL(file); elements.seriesCoverPreview.innerHTML = `<img src="${previewUrl}" alt="待上传封面裁切预览" />`; elements.seriesState.textContent = `裁切预览：${source.width}×${source.height}，上传后保存为 ${COVER_WIDTH}×${COVER_HEIGHT}。`; } finally { URL.revokeObjectURL(source.url); } }
    catch (error) { elements.uploadSeriesCover.disabled = true; elements.seriesState.textContent = `无法上传：${error.message}`; }
  }

  async function uploadCover() {
    const file = elements.seriesCoverFile.files?.[0]; const current = active(); if (!file || !current) return;
    try { const normalized = await normalizeCover(file); const result = await api.uploadSeriesCover(current.id, normalized.blob); clearPreview(); elements.seriesCoverFile.value = ""; await refresh(); elements.seriesState.textContent = `封面已从 ${normalized.sourceWidth}×${normalized.sourceHeight} 居中裁切并保存为 ${result.image.width}×${result.image.height}。`; }
    catch (error) { elements.seriesState.textContent = `上传失败：${error.message}`; }
  }

  async function importSource(event) {
    event.preventDefault(); const file = elements.importFile.files?.[0]; if (!file) return;
    elements.importSubmit.disabled = true; elements.importState.textContent = "正在上传并创建视频项目……";
    try { if (file.size > 10 * 1024 * 1024) throw new Error("原文件不能超过 10 MB"); const result = await api.importSource(file, { slug: elements.importSlug.value.trim(), seriesId: elements.importSeries.value }); elements.importForm.reset(); renderImportOptions(); elements.importState.textContent = `已创建项目 ${result.result.slug}，正在打开项目详情……`; await onImported?.(result.result.slug); }
    catch (error) { elements.importState.textContent = `导入失败：${error.message}`; elements.importSubmit.disabled = false; }
  }

  function mount() {
    if (mounted) return; mounted = true;
    elements.newSeries.addEventListener("click", () => { activeId = ""; clearPreview(); render(); });
    elements.seriesSelect.addEventListener("change", () => { activeId = elements.seriesSelect.value; clearPreview(); render(); });
    elements.seriesForm.addEventListener("submit", save); elements.seriesCoverFile.addEventListener("change", previewCover); elements.uploadSeriesCover.addEventListener("click", uploadCover); elements.importForm.addEventListener("submit", importSource); void refresh();
  }
  return { mount, unmount() { mounted = false; clearPreview(); }, refresh, setProjects(next) { projects = next; render(); } };
}
