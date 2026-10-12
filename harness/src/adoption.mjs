import fs from "node:fs";
import path from "node:path";
import { artifactManifestFor } from "./artifacts.mjs";
import { projectFiles } from "./storage.mjs";
import {
  workflowStageIndex,
  workflowStages,
} from "./workflows/registry.mjs";
import { matchesArtifactPath } from "./artifact-paths.mjs";
import { validateProjectStage, validateStageArtifacts } from "./validation.mjs";

const repositoryRoot = path.resolve(new URL("../..", import.meta.url).pathname);
const ADOPTABLE_TARGET = "gate-2";
const LAST_ADOPTED_STAGE = "visual-prototype";

function workspaceRoot() {
  return path.resolve(process.env.HARNESS_WORKSPACE_ROOT ?? repositoryRoot);
}

function candidateProject(slug) {
  return {
    config: {
      slug,
      workspaceRoot: workspaceRoot(),
      validationPolicy: "strict",
      workflow: "default",
      workflowVersion: 2,
    },
    artifacts: { stages: artifactManifestFor(slug) },
    state: { stages: {} },
  };
}

function requiredArtifactIssues(project) {
  const stages = workflowStages(project);
  return stages
    .slice(0, workflowStageIndex(project, LAST_ADOPTED_STAGE) + 1)
    .flatMap((stage) => validateStageArtifacts(project, stage));
}

function downstreamArtifactIssues(project) {
  const stages = workflowStages(project);
  return stages
    .slice(workflowStageIndex(project, ADOPTABLE_TARGET) + 1)
    .flatMap((stage) => (project.artifacts.stages[stage] ?? [])
      .filter((entry) => matchesArtifactPath(project.config.workspaceRoot, entry.path))
      .map((entry) => ({
        code: "downstream-artifact-present",
        stage,
        path: entry.path,
        message: `Gate 2 后已有产物，不能接管到 Gate 2：${entry.path}`,
      })));
}

export function inspectAdoptionCandidate(slug) {
  const files = projectFiles(slug);
  const hasHarnessState = [files.config, files.state, files.artifacts].some((file) => fs.existsSync(file));
  const project = candidateProject(slug);
  const issues = [
    ...requiredArtifactIssues(project),
    ...validateProjectStage(project, LAST_ADOPTED_STAGE),
    ...downstreamArtifactIssues(project),
  ];
  return {
    slug,
    targetStage: ADOPTABLE_TARGET,
    issues,
    eligible: issues.length === 0 && !hasHarnessState,
  };
}

// Adoption of old prototypes or approvals is no longer a production path.
const retired = () => { throw Object.assign(new Error("旧资料接管入口已停用，请初始化当前流程或使用 storyboard-rework 正常返工；历史记录保持只读。"), {code: "production-entry-retired"}); };
export const adoptExistingProjectToGate2 = retired;
export const markHistoricalProjectCompleted = retired;
