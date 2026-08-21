import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createJob, findActiveJob, listJobs } from "../src/jobs.mjs";

test("persists a background job and its completed result", async () => {
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-jobs-"));
  const previousRoot = process.env.HARNESS_PROJECTS_DIR;
  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  fs.mkdirSync(path.join(projectsRoot, "job-video"), { recursive: true });

  try {
    const { job, done } = createJob({
      slug: "job-video",
      stage: "smoke-render",
      run: async () => ({ outputs: [{ kind: "test-output" }] }),
    });
    assert.equal(job.status, "queued");
    assert.equal(findActiveJob("job-video", "smoke-render")?.id, job.id);
    const finished = await done;
    assert.equal(finished.status, "succeeded");
    assert.deepEqual(finished.result.outputs, [{ kind: "test-output" }]);
    assert.equal(findActiveJob("job-video", "smoke-render"), null);
    assert.equal(listJobs("job-video").length, 1);
  } finally {
    if (previousRoot === undefined) delete process.env.HARNESS_PROJECTS_DIR;
    else process.env.HARNESS_PROJECTS_DIR = previousRoot;
    fs.rmSync(projectsRoot, { recursive: true, force: true });
  }
});
