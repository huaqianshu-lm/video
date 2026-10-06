# Storyboard 生产契约

`productionContract: storyboard-v1` 使用本文；`legacy-v1` 和 `unified-v1` 继续使用原阶段及动态原型审核。未知契约拒绝执行。迁移期间新建默认保持 `unified-v1`，可显式创建 Storyboard 项目；旧项目不自动迁移，completed 永久只读。

## 阶段和任务

原始内容 → 合并策划（Content Analysis、Video Narrative）→ Gate 1 内部检查 → 一个口播与分镜收敛任务（Narration Script、Storyboard）→ Gate 2 人工审核 → TTS 输入 → 真实音频／字幕／Timeline → Remotion → Gate 3 实际预览与试听 → 共享远程交付 → Gate 4。

Storyboard 草案是收敛任务的工作步骤，不另存正式草案，不增加 Gate。新契约不要求 scene-script.md、visual-script.md、visual-prototype.html 或旧 visual-self-review.json。所有入口使用 Harness 的 production-task、审核及 render-delivery 服务。机器检查不代替人工决定。

## 数据

`storyboard.json` schemaVersion 为 1，包含 videoSlug、workflow、productionContract、style、seriesSelection 和有序 scenes。系列选择与项目中已确认快照一致。

Scene 的 id 使用纯口播文件 `## Scene 01` 的稳定两位数字 ID。每幕含 objective、narrationRef（同 ID）、sourceRefs（资料路径、原文 excerpt）、focus、layout、elements、events、holds、handoff、assets、implementation；diagrams 可选。口播全文只维护在 narration-script.md，禁止在 JSON 中另存可修改的 narration。

元素含 id、text、sourceRef（该幕 sourceRefs 下标）、enter、exit、retain（跨幕保留理由）。事件含全片唯一 id、before、action、after、trigger（sceneId、anchor、occurrence，重复锚点必须明确第几次）。事件顺序与口播锚点顺序一致。Screen text 的 sourceRef 必须覆盖其文字。首尾状态必须不同，静置放入 holds；复杂动画是否解释清楚仍由人工判断。

assets 是相对视频资料目录的文件路径；diagrams 为 path、caption。禁止越界、符号链接、远程 URL；静态示意图仅支持 PNG／JPEG／WebP。sourceRefs 路径须属于本视频资料，excerpt 必须确实存在。新契约不允许估算秒数成为正式时间字段。

## Gate 2

共享审核包按序联合读取纯口播与分镜，展示目标、焦点、布局、状态变化、触发、文字、停留、衔接、素材、实现条件和可选静态图。CLI／对话和 HTTP／Web 使用同一 reviewVersion。批准必须显式传入该版本，过期、缺项或未就绪拒绝批准；用户整片通过或提交能定位 Scene／Event 的反馈。

冻结分镜、口播、资料依据、静态图／素材、风格、系列封面以及 Scene／Event 清单。冻结后修改使对应下游失效。Gate 2 只确认方案，不声称动画、遮挡、节奏或同步已实际验证，不生成旧动态观看证据。

冻结记录沿用 Harness 本地 `prototype-baseline.json` 的存储位置，以 `kind: storyboard-baseline`／schemaVersion 3 明确区分，内容不含旧原型指纹。可选图片放入任务声明的 `storyboard-assets/`，单张图与文件引用一并绑定审核版本。

## 下游与返工

保持纯口播 → 已校验 tts-script.json → 显式 +25% TTS → 实际音频／字幕／Timeline。事件语义锚点映射到真实 Subtitle Cue 和 Audio Segment。Remotion alignment schemaVersion 3 绑定 storyboardFingerprint、reviewVersion、Scene／Event 与既有真实时间和命名 visualBindings；缺项、过期或非真实 Cue 映射阻断。

Gate 3 逐事件兑现分镜，实际检查中间状态、文字遮挡、生命周期、衔接、节奏、正常速度试听、字幕同步及清洁成片。保留现有通用外壳、字幕安全区、时间工具和视觉质量约束。

命名事件映射记录在 alignment 每幕的 `storyboardEvents`：id、bindingId、cueId、segmentId、atFrame。可从 Remotion 任务包的 `context.storyboardTimingEvents` 获取真实锚点映射。字幕可能删除显示标点；先通过纯口播／字幕完整文本核对，再按原口播中指定 occurrence 的位置找到真实 Cue，采用该 Cue 起点，禁止用模糊词语或估算秒数猜测。

修改口播：口播／分镜任务及 Gate 2、TTS、Timeline、Remotion、后续审核失效。修改分镜或审核依赖：从分镜任务及 Gate 2 返工，保守地重建下游音频，不默认复用；实现修复：仅返工 Remotion 和 Gate 3。所有返工使用共享任务、Gate 驳回和状态刷新。远程交付仍须精确文件清单授权，不重复派发已存在 Job。

## 实施与验收

实际覆盖、默认切换、显式旧项目迁移及人工／跨视频验收以 ROADMAP.md 为准。完整验收采用 drafts/STORYBOARD-PRODUCTION-MIGRATION-PLAN.md 的 AC-1～AC-12；未走通的入口不能标记整体迁移完成。


## 显式旧项目迁移

`storyboard-migration <slug> prepare` 只读展示精确状态文件、保留／失效范围与 migrationVersion。用户选择实施后，`start --migration-version <version>` 绑定该计划；HTTP 的 prepare-storyboard-migration／start-storyboard-migration action 复用同一服务。仅支持 Gate 2 及此前的未完成项目，活动制作任务、过期计划、下游项目和 completed 均拒绝迁移。

迁移保存旧配置、阶段／审核／产物清单与冻结基线到本地 storyboard-migration.json 日志；旧具体视频文件和任务记录保留。已完成且严格校验通过的 Source／分析／叙事／纯口播可显式沿用，阶段 order 按新契约重建。其余资料由新 Harness 任务制作，不复用旧 Gate 2 批准。纯口播已沿用时，先领取 Storyboard 任务；需要修改口播时经返工回到联合收敛任务。迁移中断后使用同一 migrationVersion 恢复，不手改 productionContract 或阶段字段。
