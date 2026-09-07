import { COVER_HEIGHT, COVER_WIDTH, coverCropFor } from "../../cover-image.js";
import { escapeHtml } from "../../shared/html.js";

export function createSeriesView({ elements, api, getProjects, onImported } = {}) {
  let mounted = false;
  let series = [];
  let projects = [];
  let activeId = "";
  let previewUrl = null;
  let saving = false;
  let uploading = false;
  let importing = false;
  let newSeriesHandler;
  let seriesSelectHandler;
  let seriesSubmitHandler;
  let coverFileHandler;
  let uploadCoverHandler;
  let importFileHandler;
  let importSeriesHandler;
  let importSubmitHandler;
  const active = () => series.find((item) => item.id === activeId) ?? null;
  const clearPreview = () => { if (previewUrl) URL.revokeObjectURL(previewUrl); previewUrl = null; };

  function updateImportAvailability(updateMessage = true) {
    const hasFile = Boolean(elements.importFile.files?.[0]);
    const hasSeries = Boolean(elements.importSeries.value);
    elements.importSubmit.disabled = importing || !hasFile || !hasSeries;
    if (updateMessage && !importing && (!hasFile || !hasSeries)) {
      elements.importState.textContent = !hasFile && !hasSeries ? "请选择一个原文件和所属系列。" : !hasFile ? "已选择系列，请再选择一个原文件。" : "已选择原文件，请再选择所属系列。";
    }
  }

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
    if (current?.cover) { elements.seriesCoverPreview.innerHTML = `<img src="/${escapeHtml(current.cover)}?v=${encodeURIComponent(current.updatedAt ?? "")}" alt="${escapeHtml(current.title)}封面" />`; elements.seriesState.textContent = elements.seriesCoverFile.files?.[0] ? `当前封面：${current.cover} · ${current.coverDurationFrames} 帧，已选择新封面。` : `当前封面：${current.cover} · ${current.coverDurationFrames} 帧。请选择新的封面文件后上传。`; }
    else { elements.seriesCoverPreview.innerHTML = "<span>尚未上传系列封面</span>"; elements.seriesState.textContent = current ? "系列已建立，请选择封面文件后上传。" : "选择或创建系列后上传封面。"; }
    elements.uploadSeriesCover.disabled = uploading || !current || !elements.seriesCoverFile.files?.[0];
    renderImportOptions();
    updateImportAvailability(false);
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
    event.preventDefault(); if (saving) return; saving = true; const current = active();
    const videos = [...elements.seriesVideoList.querySelectorAll('input[name="series-video"]:checked')].map((input) => input.value);
    const removed = (current?.videos ?? []).filter((slug) => !videos.includes(slug));
    if (removed.length > 0 && !window.confirm(`将从系列中移除已有视频：${removed.join(", ")}。\n\n确认继续吗？`)) { saving = false; return; }
    elements.seriesState.textContent = "正在保存系列设置……";
    try { const result = await api.saveSeries({ id: elements.seriesId.value.trim(), title: elements.seriesTitle.value.trim(), style: elements.seriesStyle.value, coverDurationFrames: Number(elements.seriesCoverFrames.value), videos, confirmVideoRemoval: removed.length > 0 }); activeId = result.series.id; await refresh(); elements.seriesState.textContent = "系列设置已保存。"; }
    catch (error) { elements.seriesState.textContent = `保存失败：${error.message}`; }
    finally { saving = false; }
  }

  async function previewCover() {
    const file = elements.seriesCoverFile.files?.[0]; clearPreview(); elements.uploadSeriesCover.disabled = !active() || !file;
    if (!file) return render();
    try { if (file.size > 10 * 1024 * 1024) throw new Error("图片超过 10 MB"); const source = await readImage(file); try { coverCropFor(source.width, source.height); previewUrl = URL.createObjectURL(file); elements.seriesCoverPreview.innerHTML = `<img src="${previewUrl}" alt="待上传封面裁切预览" />`; elements.seriesState.textContent = `裁切预览：${source.width}×${source.height}，上传后保存为 ${COVER_WIDTH}×${COVER_HEIGHT}。`; } finally { URL.revokeObjectURL(source.url); } }
    catch (error) { elements.uploadSeriesCover.disabled = true; elements.seriesState.textContent = `无法上传：${error.message}`; }
  }

  async function uploadCover() {
    const file = elements.seriesCoverFile.files?.[0]; const current = active(); if (uploading || !file || !current) return;
    uploading = true; elements.uploadSeriesCover.disabled = true;
    try { const normalized = await normalizeCover(file); const result = await api.uploadSeriesCover(current.id, normalized.blob); clearPreview(); elements.seriesCoverFile.value = ""; await refresh(); elements.seriesState.textContent = `封面已从 ${normalized.sourceWidth}×${normalized.sourceHeight} 居中裁切并保存为 ${result.image.width}×${result.image.height}。`; }
    catch (error) { elements.seriesState.textContent = `上传失败：${error.message}`; }
    finally { uploading = false; elements.uploadSeriesCover.disabled = !active() || !elements.seriesCoverFile.files?.[0]; }
  }

  async function importSource(event) {
    event.preventDefault(); const file = elements.importFile.files?.[0]; if (importing || !file) return;
    importing = true; elements.importSubmit.disabled = true; elements.importState.textContent = "正在上传并创建视频项目……";
    let completed = false;
    try { if (file.size > 10 * 1024 * 1024) throw new Error("原文件不能超过 10 MB"); const result = await api.importSource(file, { slug: elements.importSlug.value.trim(), seriesId: elements.importSeries.value }); elements.importForm.reset(); renderImportOptions(); elements.importState.textContent = `已创建项目 ${result.result.slug}，正在打开项目详情……`; completed = true; await onImported?.(result.result.slug); }
    catch (error) { elements.importState.textContent = `导入失败：${error.message}`; }
    finally { importing = false; if (!completed) updateImportAvailability(false); }
  }

  function mount() {
    if (mounted) return; mounted = true;
    newSeriesHandler = () => { activeId = ""; clearPreview(); render(); };
    seriesSelectHandler = () => { activeId = elements.seriesSelect.value; clearPreview(); render(); };
    seriesSubmitHandler = save;
    coverFileHandler = (event) => { void previewCover(event); };
    uploadCoverHandler = () => { void uploadCover(); };
    importFileHandler = () => updateImportAvailability();
    importSeriesHandler = () => updateImportAvailability();
    importSubmitHandler = importSource;
    elements.newSeries.addEventListener("click", newSeriesHandler);
    elements.seriesSelect.addEventListener("change", seriesSelectHandler);
    elements.seriesForm.addEventListener("submit", seriesSubmitHandler); elements.seriesCoverFile.addEventListener("change", coverFileHandler); elements.uploadSeriesCover.addEventListener("click", uploadCoverHandler); elements.importFile.addEventListener("change", importFileHandler); elements.importSeries.addEventListener("change", importSeriesHandler); elements.importForm.addEventListener("submit", importSubmitHandler); elements.uploadSeriesCover.setAttribute?.("aria-describedby", "series-state"); elements.importSubmit.setAttribute?.("aria-describedby", "source-import-state"); updateImportAvailability(); void refresh();
  }
  return { mount, unmount() { if (!mounted) return; mounted = false; elements.newSeries.removeEventListener("click", newSeriesHandler); elements.seriesSelect.removeEventListener("change", seriesSelectHandler); elements.seriesForm.removeEventListener("submit", seriesSubmitHandler); elements.seriesCoverFile.removeEventListener("change", coverFileHandler); elements.uploadSeriesCover.removeEventListener("click", uploadCoverHandler); elements.importFile.removeEventListener("change", importFileHandler); elements.importSeries.removeEventListener("change", importSeriesHandler); elements.importForm.removeEventListener("submit", importSubmitHandler); clearPreview(); }, refresh, setProjects(next) { projects = next; render(); } };
}
