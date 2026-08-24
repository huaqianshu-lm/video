import test from "node:test";
import assert from "node:assert/strict";
import {
  ACTIVE_REMOTE_JOB_STATUSES,
  REMOTE_JOB_STATUS,
  classifyRemoteError,
  isActiveRemoteJobStatus,
  isTerminalRemoteJobStatus,
  remoteJobStatusLabel,
} from "../src/remote-status.mjs";

test("defines the 0.6 remote job lifecycle without treating completed jobs as active", () => {
  assert.deepEqual([...ACTIVE_REMOTE_JOB_STATUSES], [
    "submitted",
    "waiting-run",
    "running",
    "recoverable",
  ]);
  assert.equal(isActiveRemoteJobStatus(REMOTE_JOB_STATUS.WAITING_CONFIG), false);
  assert.equal(isActiveRemoteJobStatus(REMOTE_JOB_STATUS.RECOVERABLE), true);
  assert.equal(isTerminalRemoteJobStatus(REMOTE_JOB_STATUS.SUCCEEDED), true);
  assert.equal(isTerminalRemoteJobStatus(REMOTE_JOB_STATUS.TIMEOUT), true);
  assert.equal(isTerminalRemoteJobStatus(REMOTE_JOB_STATUS.FAILED), true);
});

test("classifies configuration, transient, permission and timeout errors", () => {
  assert.equal(classifyRemoteError({ code: "github-config-invalid" }), "waiting-config");
  assert.equal(classifyRemoteError(new Error("GitHub API 503: Service Unavailable")), "recoverable");
  assert.equal(classifyRemoteError(new Error("fetch failed: ECONNRESET")), "recoverable");
  assert.equal(classifyRemoteError(new Error("GitHub API 401: Bad credentials")), "failed");
  assert.equal(classifyRemoteError({ code: "remote-job-timeout" }), "timeout");
  assert.equal(classifyRemoteError(new Error("invalid artifact metadata")), "failed");
});

test("provides stable user-facing labels for every remote status", () => {
  for (const status of Object.values(REMOTE_JOB_STATUS)) {
    assert.notEqual(remoteJobStatusLabel(status), status);
  }
});
