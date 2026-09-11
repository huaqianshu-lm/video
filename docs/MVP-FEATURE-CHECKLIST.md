# 第一版最小 MVP 功能清单

本文档记录仓库中可复用视频制作能力的 MVP 状态。完成能力后，同步补充实现路径和验证依据。具体视频的生产资料和渲染状态不在此记录。

## 状态说明

- `[x]`：已有实现或明确验证依据。
- `[ ]`：未完成、待验证或仍需用户确认。

## 能力清单

- [x] Remotion 固定工程：16:9、1920 × 1080、30fps，内容驱动时长。
- [x] 七层视频生产资料结构和 Markdown 工作流。
- [x] 六个通用场景组件：Opening、Concept、Comparison、StepList、Terminal、Summary。
- [x] 配置驱动的通用视频实现。
- [x] Visual Prototype → Remotion 的人工确认流程。
- [x] 逐句字幕、音频驱动时间轴和 Timeline Manifest 契约。
- [x] Gate 1、Gate 2、TTS 质检、Gate 3、Smoke Render 和 Gate 4 人工检查点。
- [x] Gate 2 后从纯口播派生并校验 `tts-script.json`。
- [x] TTS、Remotion、Smoke Render 和完整 Render 的执行器边界。
- [x] Harness 四类批量任务、持久化 Job、失败重试和断点恢复。
- [x] Harness Web UI 的项目状态、任务状态、Gate 操作和远程任务查询。
- [x] 远程渲染资源包、Manifest、分支和 Git 交付预检。
- [x] 系列风格、系列封面和 45 帧正文起点规则。
- [ ] 完成当前用户确认范围内的最终视频导出闭环。

## 维护原则

- 只记录仓库能力，不记录具体视频的本地产物状态。
- 以代码、测试和可复现命令作为验证依据。
- 当前阶段、阻塞和下一步写入 `ROADMAP.md`。
