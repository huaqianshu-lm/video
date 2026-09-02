export function activeRemoteJobs(jobs = []) {
  return jobs.filter((job) => ["queued", "dispatching", "running", "waiting-run"].includes(job.status));
}
