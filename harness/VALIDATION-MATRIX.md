# Harness 0.6 阶段校验矩阵

这份矩阵是 `harness/src/stages.mjs` 中阶段契约的实现清单。它区分自动校验、适配器校验和必须由人工完成的质量判断；0.6 另外覆盖远程任务状态、超时／恢复、环境诊断、全局任务视图和 Gate 4 审查记录。

## 校验类型

| 类型 | 含义 |
| --- | --- |
| 自动 | Harness 可以基于文件、Manifest 或代码结构确定判断结果 |
| 适配器 | 由 TTS、字幕／时间轴、Remotion 或 GitHub Actions 适配器返回结果 |
| 人工 | Harness 只能阻断并提示，不能替代用户对画面、声音和交付质量的判断 |

## 阶段矩阵

| 阶段 | 校验项 | 类型 | 0.4 目标 |
| --- | --- | --- | --- |
| source | `required-artifacts` | 自动 | 已实现 |
| content-analysis | `required-artifacts` | 自动 | 已实现 |
|  | `content-analysis-structure` | 自动 | 0.4 补齐 |
| video-narrative | `required-artifacts` | 自动 | 已实现 |
|  | `narrative-structure` | 自动 | 0.4 补齐 |
| scene-script | `required-artifacts` | 自动 | 已实现 |
|  | `scene-structure` | 自动 | 0.4 补齐 |
| narration-script | `narration-purity` | 自动 | 已实现 |
|  | `source-reference-boundary` | 自动 | 已实现 |
| visual-script | `visual-script-structure` | 自动 | 0.4 补齐 |
|  | `screen-text-provenance` | 自动／规则化 | 0.4 补齐可确定部分 |
| visual-prototype | `prototype-structure` | 自动 | 0.4 补齐 |
| gate-2 | `manual-gate` | 人工 | 保留人工确认 |
| tts | `tts-script-alignment` | 自动 | 已实现 |
|  | `tts-script-purity` | 自动 | 已实现 |
| subtitle-timeline | `tts-coverage` | 自动 | 已实现 |
|  | `subtitle-timeline-alignment` | 自动 | 已实现 |
| remotion | `remotion-config` | 自动 | 0.4 补齐 |
|  | `resource-manifest` | 自动 | 0.4 补齐 |
|  | `remotion-alignment` | 自动 | 已实现：冻结指纹、Scene 覆盖、布局／事件／文字字段、实现文件和 Composition 注册 |
| gate-3 | `manual-gate` | 人工 | 保留人工确认 |
|  | `clean-output-review` | 人工 | 只记录人工检查要求 |
| smoke-render | `adapter-result` | 适配器 | 已实现 |
|  | `smoke-artifact-metadata` | 适配器 | 已实现 |
|  | `clean-output-review` | 人工 | 保留人工检查要求 |
| render | `adapter-result` | 适配器 | 已实现 |
|  | `render-artifact-metadata` | 适配器 | 已实现 |
| gate-4 | `manual-gate` | 人工 | 保留人工确认 |
|  | `final-output-review` | 人工 | 只记录人工检查要求 |

## 0.6 远程任务边界

- 远程任务提交前必须通过 GitHub Actions 配置预检。
- Run 发现、状态查询和 Artifact 验证可以分次执行，任务记录保存在 `harness/projects/<slug>/jobs/`。
- Web 服务重启后恢复 `queued`、`submitted`、`waiting-run`、`running`、`recoverable` 和 `waiting-config` 任务；已有 dispatch 意图会先查询 Run，避免重复触发。
- 临时网络／GitHub API 错误进入 `recoverable` 并等待下一次检查；权限错误、Run 失败、Artifact 缺失和超时进入明确终态，不会无限轮询。
- `doctor` 只检查配置和 GitHub 访问能力，不输出 Token；Web UI 首页提供全局远程任务列表和显式诊断入口。
- Gate 通过／驳回会记录审查决定、时间、回退阶段和驳回原因；Harness 不自动判断最终 MP4 的内容质量。
- Agent 只检查 Run 结论和 Artifact 元数据；Artifact 下载、视频播放和最终 Gate 4 内容检查仍由用户完成。

## 0.4 边界

- “0.4 补齐”表示实现确定性、可重复的结构和技术校验，不表示自动判断内容质量。
- Gate 2、Gate 3 和 Gate 4 的画面、声音、节奏和最终清洁输出仍必须人工确认。
- Legacy 只读回归允许历史资料产生警告，但新项目的严格口播和来源边界规则不放宽。

## Agent Job 与原型对齐边界

- Web UI 的 Agent 阶段先创建本地持久化 Job，再由 Server 调用配置的命令；浏览器只读取状态和有界日志。
- 命令进程退出码为 0 仍不代表阶段完成；Harness 必须重新读取当前阶段产物并执行全部确定性校验。
- Gate 2 冻结前已经存在 Remotion 实现的历史项目按兼容模式处理；新项目必须提供引用当前冻结指纹的 `remotion-alignment.json`。
- 自动校验只检查契约完整性和指纹有效性，实际布局、动画和视觉质量仍在 Gate 3 人工对照。
