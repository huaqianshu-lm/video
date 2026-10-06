import { storyboardReview } from "./storyboard.mjs";
import { usesStoryboardProduction } from "./production-contract.mjs";
import { validateProjectStage } from "./validation.mjs";

// The display packet shares the complete Gate 2 validation, including pure
// narration and upstream readiness. Structural validation stays non-recursive.
export function buildStoryboardReview(project) {
  if (!usesStoryboardProduction(project)) throw new Error("当前项目不是 Storyboard 契约");
  const review = storyboardReview(project);
  const issues = validateProjectStage(project, "gate-2").filter(issue => issue.severity !== "warning");
  for (const stage of ["source", "content-analysis", "video-narrative", "narration-script", "storyboard"]) {
    if (project.state.stages[stage]?.status !== "succeeded") issues.push({ code: "storyboard-review-not-ready", stage: "gate-2", severity: "error", message: `${stage} 制作与校验尚未完成` });
  }
  return { ...review, issues, ready: issues.length === 0 };
}
