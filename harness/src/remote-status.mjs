export const REMOTE_JOB_STATUS = Object.freeze({
  WAITING_CONFIG: "waiting-config",
  SUBMITTED: "submitted",
  WAITING_RUN: "waiting-run",
  RUNNING: "running",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  TIMEOUT: "timeout",
  RECOVERABLE: "recoverable",
  DISPATCH_UNCERTAIN: "remote-dispatch-uncertain",
  DISPATCH_AMBIGUOUS: "remote-dispatch-ambiguous",
});

export const ACTIVE_REMOTE_JOB_STATUSES = Object.freeze(new Set([
  REMOTE_JOB_STATUS.SUBMITTED,
  REMOTE_JOB_STATUS.WAITING_RUN,
  REMOTE_JOB_STATUS.RUNNING,
  REMOTE_JOB_STATUS.RECOVERABLE,
]));

export const TERMINAL_REMOTE_JOB_STATUSES = Object.freeze(new Set([
  REMOTE_JOB_STATUS.SUCCEEDED,
  REMOTE_JOB_STATUS.FAILED,
  REMOTE_JOB_STATUS.TIMEOUT,
]));

export function isActiveRemoteJobStatus(status) {
  return ACTIVE_REMOTE_JOB_STATUSES.has(status);
}

export function isTerminalRemoteJobStatus(status) {
  return TERMINAL_REMOTE_JOB_STATUSES.has(status);
}

function errorText(error) {
  return `${error?.code ?? ""} ${error?.message ?? error ?? ""}`.toLowerCase();
}

export function classifyRemoteError(error) {
  if (["github-config-invalid", "github-auth-invalid"].includes(error?.code)) return REMOTE_JOB_STATUS.WAITING_CONFIG;
  if (error?.code === "remote-job-timeout") return REMOTE_JOB_STATUS.TIMEOUT;
  if (error?.code === "remote-dispatch-uncertain") return REMOTE_JOB_STATUS.DISPATCH_UNCERTAIN;
  if (error?.code === "remote-dispatch-ambiguous") return REMOTE_JOB_STATUS.DISPATCH_AMBIGUOUS;

  const text = errorText(error);
  if (/\b(401|403)\b/.test(text)) return REMOTE_JOB_STATUS.FAILED;
  if (/\b(408|409|425|429|5\d\d)\b/.test(text)
    || /(fetch failed|econnreset|econnrefused|etimedout|enotfound|eai_again|enetunreach|network)/.test(text)) {
    return REMOTE_JOB_STATUS.RECOVERABLE;
  }
  return REMOTE_JOB_STATUS.FAILED;
}

export function remoteJobStatusLabel(status) {
  return {
    [REMOTE_JOB_STATUS.WAITING_CONFIG]: "等待配置",
    [REMOTE_JOB_STATUS.SUBMITTED]: "已提交",
    [REMOTE_JOB_STATUS.WAITING_RUN]: "等待 Run",
    [REMOTE_JOB_STATUS.RUNNING]: "执行中",
    [REMOTE_JOB_STATUS.SUCCEEDED]: "成功",
    [REMOTE_JOB_STATUS.FAILED]: "失败",
    [REMOTE_JOB_STATUS.TIMEOUT]: "超时",
    [REMOTE_JOB_STATUS.RECOVERABLE]: "可恢复",
    [REMOTE_JOB_STATUS.DISPATCH_UNCERTAIN]: "派发结果待人工确认",
    [REMOTE_JOB_STATUS.DISPATCH_AMBIGUOUS]: "派发结果有歧义",
  }[status] ?? status;
}
