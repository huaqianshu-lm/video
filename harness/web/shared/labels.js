export const statusLabels = Object.freeze({
  completed: "已完成", failed: "失败", invalid: "状态异常", pending: "未开始", ready: "可执行",
  running: "执行中", succeeded: "已完成", uninitialized: "未初始化 Harness", waiting: "等待确认",
});

export const stageStatusLabels = Object.freeze({
  available: "已有产物", failed: "失败", invalidated: "已失效", missing: "缺少产物", pending: "未开始",
  ready: "可执行", running: "执行中", succeeded: "已完成", waiting: "等待确认",
});

export const jobStatusLabels = Object.freeze({
  dispatching: "提交中", failed: "失败", queued: "排队中", running: "执行中", succeeded: "成功",
  submitted: "已提交", timeout: "超时", recoverable: "可恢复", "waiting-config": "等待配置",
  "waiting-run": "等待 Run",
});

export const batchStatusLabels = Object.freeze({
  completed: "已完成", "completed-with-errors": "部分失败", queued: "排队中", running: "执行中", waiting: "等待人工处理",
});

export const batchItemStatusLabels = Object.freeze({
  failed: "失败", invalidated: "已失效", pending: "未开始", queued: "排队中", ready: "可执行",
  running: "执行中", skipped: "已跳过", succeeded: "已完成", "waiting-gate": "等待 Gate",
  "waiting-agent-job": "等待 Agent 任务", "waiting-tts-qc": "等待 TTS 质检", "waiting-remotion-task": "等待 Remotion 制作",
  "waiting-smoke-qc": "等待 Smoke 检查",
});

export const remotionTaskStatusLabels = Object.freeze({
  ready: "待制作", "in-progress": "制作中", blocked: "校验未通过", completed: "已完成，待继续批次", failed: "失败",
});

export const batchTypeLabels = Object.freeze({
  "to-gate-2": "批量到 Gate 2", "to-tts": "批量完成 TTS", "to-remotion": "批量完成 Remotion", "to-render": "批量渲染",
});

export function labelFor(status, labels = statusLabels) {
  return labels[status] ?? status;
}
