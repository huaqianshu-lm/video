// Metadata for completed videos only. No production executors or validators.
export const ARCHIVED_WORKFLOW_ID = "product-promo-v1";
export const ARCHIVED_NAMESPACE = "product-promo";

const records = [
  ["source", "产品资料", "source.md"],
  ["promo-brief", "Promo Brief", "promo-brief.md"],
  ["creative-concept", "Creative Concept", "creative-concept.md"],
  ["scene-script", "Scene Storyboard", "scene-script.md"],
  ["visual-script", "视觉脚本", "visual-script.md"],
  ["motion-prototype", "历史动态原型", "motion-prototype.html"],
  ["gate-2", "Gate 2", null],
  ["asset-preparation", "素材清单", "asset-manifest.json"],
  ["visual-timeline", "视觉时间轴", "visual-timeline.json"],
  ["remotion", "历史 Remotion 实现", null],
  ["gate-3", "Gate 3", null],
  ["render", "历史完整渲染", null],
  ["gate-4", "Gate 4", null],
];
const stages = Object.freeze(records.map(([stage]) => stage));
const stageDefinitions = Object.freeze(Object.fromEntries(records.map(([stage, label, file], order) => [stage, Object.freeze({
  stage, label, order, kind: "archived", objective: "历史记录，仅供只读查看。",
  requiresApproval: false, requiresAdapter: false, manualChecks: [],
  artifacts: file ? [`videos/${ARCHIVED_NAMESPACE}/{slug}/${file}`]
    : stage === "remotion" ? [`src/videos/${ARCHIVED_NAMESPACE}/{slug}/video.config.ts`, `src/videos/${ARCHIVED_NAMESPACE}/{slug}/*Video.tsx`, `src/videos/${ARCHIVED_NAMESPACE}/{slug}/remotion-alignment.json`]
    : stage === "render" ? ["out/{slug}.mp4"] : [],
  inputStages: [], validation: [], executor: null,
})])));

export const ARCHIVED_WORKFLOW = Object.freeze({
  id: ARCHIVED_WORKFLOW_ID, version: 1, label: "历史宣传片（只读）",
  readOnly: true, pathNamespace: ARCHIVED_NAMESPACE, pathMode: "namespaced",
  timelineMode: "archived", audioMode: "archived", batchSupported: false,
  stages, stageDefinitions, gateStages: [], adapterStages: [],
});

export function retiredWorkflowError() {
  const error = new Error("宣传片生产能力已移除；已完成视频仅供只读查看和已有输入包预览。");
  error.code = "workflow-retired";
  return error;
}
