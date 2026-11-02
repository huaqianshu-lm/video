# Video 项目生产流程说明

当前生产统一使用 [Storyboard 生产契约](STORYBOARD-PRODUCTION-CONTRACT.md) 与现行分镜格式，不提供旧流程或分镜版本选择。本文说明资料职责与 Video／TTS／Remotion 边界；阶段、冻结、返工和校验以生产契约为准，实际实现与验证状态以 ROADMAP.md 为准。

## 资料链与职责

| 环节 | 正式资料 | 职责与使用时机 |
|---|---|---|
| Source 登记 | source.md | 保留原始内容依据；由 Harness 登记后开始策划 |
| 合并策划 | content-analysis.md、video-narrative.md | 分析受众、知识结构和视频叙事；两份输出在同一任务完成，Gate 1 内部检查 |
| 口播与分镜联合收敛 | narration-script.md、storyboard.json、storyboard-design-audit.json | 口播只含实际朗读文本；分镜定义 Scene → Shot → Event、观看方式、对象及语义事件、生命周期和执行能力；设计审计检查方案，Gate 2 人工审核同版本资料 |
| TTS 输入 | tts-script.json | Gate 2 后从冻结纯口播派生并校验，是下游唯一朗读输入 |
| 实际音频与时间 | MP3、VTT／SRT、Audio／Subtitle／Timeline Manifest | 显式 +25% 生成真实音频，字幕与 Timeline 基于实际音频；机器质检不能代替试听 |
| Agent 编写的 Remotion | Agent 编写的组件／配置、remotion-alignment.json、remotion-viewing-evidence.json | 消费冻结分镜和真实时间，记录当前画面与正常速度试听证据；Gate 3 人工检查 |
| 共享交付 | 独立输入包、交付计划、Job、MP4 | prepare／start／resume 保留精确计划确认；渲染成功后 Gate 4 人工验收 |

本项目负责知识转译、策划、纯口播与分镜、调度、按冻结分镜编写的实现和交付。既有 TTS 工程负责音频、字幕及时间数据的实际生成，通过共享适配器交接；不得跨项目自行改写它的配置。Remotion 是实现层，不能重新决定冻结的叙事和分镜设计。

## Gate 与证据

Gate 2 审核口播与分镜方案，不要求 HTML 动态原型，也不能声称动画已经观看。Gate 3 结合真实 Timeline 检查完整动作、阅读停留、对象退出／替换、文字遮挡、跨幕承接和正常速度完整试听。Gate 4 审核最终成片。所有人工 Gate 只由用户明确决定，机器通过或已有文件不能代替。

设计、观看及音频证据必须绑定当前输入与实现；变更后过期证据阻断下游。具体格式见 [分镜设计与执行质量](STORYBOARD-EXECUTION-QUALITY.md)，内容与视觉质量见 [视频生产规则](VIDEO-PRODUCTION-RULES.md)。

审美与感官要求按视频生产规则 14.4 贯穿分镜设计和实际观看／试听，使用现有 SQ 审计及观看证据的 evidence／note 记录具体发现；调校组合按 9.7 区分候选、单条实际验证和跨视频适用范围。量化数值仍只在 9.6 维护，不新增阶段、审美评分或自动批准。

## 调度与正常返工

对话、CLI、Web、批量均通过 Harness 领取任务、提交实际产物并恢复同一任务。源码、资料、任务记录和状态不能被另一执行者并行覆盖；失败不生成占位成功。

未完成视频的资料不满足当前规则时，通过 storyboard-rework 准备返工范围，确认后按绑定计划执行。严格校验通过的公共上游可保留，缺失或变化的资料退回正常任务补齐；失效 Gate 必须重审。只修改契约字段或版本号不算更新完成。

legacy-v1、unified-v1、旧分镜与原型资料只供历史读取，不继续生产。completed 永久只读，后续新版本使用独立视频标识。本次迭代不自动改写或批量转换历史视频。

## 本地资料与交付边界

具体视频使用 videos/<slug>/、src/videos/<slug>/、assets/<slug>-assets.zip，全部保留为被忽略的本地资料。通用能力、模板、规范属于仓库；不能把具体视频重新提交到能力代码仓库。

Studio 从当前已校验独立输入包生成被忽略的 src/RenderInputRoot.tsx；受跟踪 src/Root.tsx 保持通用。预览、local 和 GitHub 渲染使用同一冻结输入。

交付以 [渲染交付基线](RENDER-DELIVERY-BASELINE.md) 为准：单条默认本地，可选 GitHub；批量只用 GitHub。准备不 commit／push／派发；GitHub 启动前须确认精确文件计划，本地无需发布或 Git 操作。恢复同一 Job，不切换 backend，不重复派发。Smoke Render 仅为独立手动环境检查，不推进生产阶段。
