import { findActiveJob, listJobs } from "../../jobs.mjs";
import { buildAlignmentView } from "../../remotion-alignment.mjs";
import { listRemotionTasks } from "../../remotion-tasks.mjs";
import { getVideoProject } from "../../project-view.mjs";
import { listProjectFiles } from "../../project-files.mjs";
import { loadProject } from "../../storage.mjs";
import { findActiveBatchForProject, getBatchForView } from "../../batches.mjs";
import { listAgentJobs } from "../../agent-jobs.mjs";

export async function getProjectWorkspace(slug, { remoteJobMonitor = null } = {}) {
  let project = getVideoProject(slug);
  if (!project) return null;
  if (project.initialized && remoteJobMonitor) {
    await remoteJobMonitor.poll();
    project = getVideoProject(slug);
  }

  const jobs = listJobs(slug);
  const workspace = {
    project,
    files: listProjectFiles(slug),
    jobs,
    activeJob: project.currentStage ? findActiveJob(slug, project.currentStage) : null,
    agentJobs: listAgentJobs({ slug }),
    alignment: null,
    remotionTasks: listRemotionTasks({ slug }),
    continuousBatch: null,
  };

  if (project.initialized) {
    try {
      workspace.alignment = buildAlignmentView(loadProject(slug, { refresh: false }));
    } catch {
      workspace.alignment = null;
    }
  }

  for (const type of ["to-gate-2", "to-tts", "to-remotion", "to-render"]) {
    const activeBatch = findActiveBatchForProject(type, slug);
    if (activeBatch) {
      workspace.continuousBatch = getBatchForView(activeBatch.id);
      break;
    }
  }
  return workspace;
}
