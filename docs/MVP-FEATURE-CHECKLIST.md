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
- [x] Gate 1、Gate 2、TTS 质检、Gate 3 和 Gate 4 人工检查点；Smoke Render 作为独立手动环境检查保留。
- [x] Gate 2 后从纯口播派生并校验 `tts-script.json`。
- [x] TTS、Remotion 和完整 Render 的生产执行器边界；Smoke Render 使用独立 GitHub Actions 工作流，不推进 Harness。
- [x] Harness 四类批量任务、持久化 Job、失败重试和断点恢复。
- [x] Harness Web UI 的项目状态、任务状态、Gate 操作和远程任务查询。
- [x] 远程渲染资源包、Manifest、分支和 Git 交付预检。
- [x] 系列风格、系列封面和 45 帧正文起点规则。
- [x] Workflow Registry：`narrated-tutorial-v1` 与 `product-promo-v1` 的阶段、版本、Gate、路径和交付契约统一解析。
- [x] 新 Workflow 的 namespaced 本地目录、全局 slug 冲突校验和 legacy narrated 路径兼容。
- [x] `product-promo-v1` 的 Promo Brief、Scene／Visual Script、Asset Manifest、Visual Timeline 和 Remotion Alignment 确定性校验。
- [x] 无 TTS 宣传片的独立 Render Input、GitHub Actions 路径恢复和可选音乐／音效契约。
- [x] 可复用的宣传片 16:9 外壳、左上标题、Beat 驱动 Scene／Transition 和可选音频 Remotion 组件。
- [x] 首条真实产品宣传片的 Gate 2、Gate 3、完整 Render 和 Gate 4 验收；以 `huaqianshu-site-promo` 的真实端到端验证为依据。
- [x] 完成当前用户确认范围内的最终视频导出闭环；Artifact 已通过远程校验并完成 Gate 4 人工验收。

## 维护原则

- 只记录仓库能力，不记录具体视频的本地产物状态。
- 以代码、测试和可复现命令作为验证依据。
- 当前阶段、阻塞和下一步写入 `ROADMAP.md`。
