# Storyboard 生产契约

当前唯一生产契约为 `productionContract: storyboard-v1`，分镜使用现行 `schemaVersion: 3`。新建入口由服务端统一设置 `storyboardSchemaVersion: 3`，不提供生产版本选择。`legacy-v1`、`unified-v1`、缺少契约及旧分镜格式仅用于历史资料读取，不能继续制作、审批、批量、打包或交付。未完成项目资料不满足当前规则时，通过正常返工补齐；不自动改写历史项目，completed 永久只读。

## 阶段和任务

视频制作不得半路引入改变画面制作方式或限制分镜表达的强制机制。先按内容设计分镜，再选择或编写实现；即使阶段名称不变，制作方式改变也须按 [视频制作与流程变更的边界](HARNESS-PRODUCTION-CONTRACT.md#视频制作与流程变更的边界) 单独说明并确认。流程检查须核对阶段内部的实际任务提示、生成调用、强制依赖和校验限制，不能只核对阶段图。

原始内容 → 合并策划（Content Analysis、Video Narrative）→ Gate 1 内部检查 → 一个口播与分镜收敛任务（Narration Script、Storyboard）→ Gate 2 人工审核 → TTS 输入 → 真实音频／字幕／Timeline → Remotion → Gate 3 实际预览与试听 → 共享渲染交付（单条默认本地／可选 GitHub，批量仅 GitHub）→ Gate 4。

Storyboard 草案是收敛任务的工作步骤，不另存正式草案，不增加 Gate。新契约不要求 scene-script.md、visual-script.md、visual-prototype.html 或旧 visual-self-review.json。所有入口使用 Harness 的 production-task、审核及 render-delivery 服务。机器检查不代替人工决定。

## 数据

设计与执行质量标准见 [STORYBOARD-EXECUTION-QUALITY.md](STORYBOARD-EXECUTION-QUALITY.md)。当前格式的完整结构以 `templates/video-production/storyboard-v3.schema.json` 为准，示例为 `storyboard-v3.json`；文件名和数据版本号只用于识别格式，不代表两条可选生产路线。Gate 2 使用独立设计审计、同版本展示与冻结；冻结 schemaVersion 5、共享 Remotion、alignment 5、独立输入包及版本化观看／试听证据共同约束下游。审计模板见 `templates/video-production/storyboard-quality-audit.md`。真实入口与实片验收状态见 ROADMAP。

`storyboard.json` schemaVersion 为 3，包含 videoSlug、workflow、productionContract、style、seriesSelection 和有序 scenes。系列选择与项目中已确认快照一致。

Scene 的 id 使用纯口播文件 `## Scene 01` 的稳定两位数字 ID。每幕含 objective、narrationRef（同 ID）、sourceRefs（资料路径、原文 excerpt）、focus、layout、elements、shots、events、holds、handoff、assets、implementation；diagrams 可选。口播全文只维护在 narration-script.md，禁止在 JSON 中另存可修改的 narration。

元素含全片稳定 id、type、parentId、role、text、sourceRef、layout、layer、身份 identity 和结构化 enter／exit；跨幕保留须有具体 retain 依据。事件含全片唯一 id、shotId、before、action、after、trigger（sceneId、anchor、occurrence，重复锚点必须明确第几次）及 描述动作的 execution。事件顺序与口播锚点一致，文字的 sourceRef 必须覆盖其内容。生命周期、互斥替换及请求／结果身份按质量契约校验；静置放入 holds，实际视觉质量仍由人工判断。

assets 是相对视频资料目录的文件路径；diagrams 为 path、caption。禁止越界、符号链接、远程 URL；静态示意图仅支持 PNG／JPEG／WebP。sourceRefs 路径须属于本视频资料，excerpt 必须确实存在。新契约不允许估算秒数成为正式时间字段。

## Gate 2

共享审核包按序联合读取纯口播与分镜，展示目标、焦点、布局、状态变化、触发、文字、停留、衔接、素材、实现条件和可选静态图。CLI／对话和 HTTP／Web 使用同一 reviewVersion。批准必须显式传入该版本，过期、缺项或未就绪拒绝批准；用户整片通过或提交能定位 Scene／Event 的反馈。

冻结分镜、口播、资料依据、静态图／素材、风格、系列封面以及 Scene／Shot／Event 清单。冻结后修改使对应下游失效。Gate 2 只确认方案，不声称动画、遮挡、节奏或同步已实际验证，不生成旧动态观看证据。

冻结记录沿用 Harness 本地 `prototype-baseline.json` 的存储位置，以 `kind: storyboard-baseline`／schemaVersion 5 识别当前格式，内容不含旧原型指纹。可选图片放入任务声明的 `storyboard-assets/`，单张图与文件引用一并绑定审核版本。

## 下游与返工

保持纯口播 → 已校验 tts-script.json → 显式 +25% TTS → 实际音频／字幕／Timeline。事件语义锚点映射到真实 Subtitle Cue 和 Audio Segment。当前生产仅使用Agent 编写的实现、alignment 5 和版本化观看证据；缺项、过期或非真实 Cue 映射阻断。

Gate 3 逐事件兑现分镜，实际检查中间状态、文字遮挡、生命周期、衔接、节奏、正常速度试听、字幕同步及清洁成片。保留现有通用外壳、字幕安全区、时间工具和视觉质量约束。

Gate 2 的审美与感官设计及 Gate 3 的实际复查遵守 `VIDEO-PRODUCTION-RULES.md` 14.4；沿用既有设计审计／观看证据字段，不改变 schema 或阶段。量化数值只在 9.6 维护，调校配方按 9.7 留证；结构通过和参数达标不能代替实际效果验收。

视觉事件绑定真实 Cue／Segment 和帧区间；alignment 5 每幕 events 记录 id、startFrame、completeFrame。可从任务包获取真实锚点映射。字幕可能删除显示标点；先通过纯口播／字幕完整文本核对，再按指定 occurrence 找到真实 Cue，禁止用模糊词语或估算秒数猜测。

修改口播：口播／分镜任务及 Gate 2、TTS、Timeline、Remotion、后续审核失效。修改分镜或审核依赖：从分镜任务及 Gate 2 返工，保守地重建下游音频，不默认复用；实现修复：仅返工 Remotion 和 Gate 3。所有返工使用共享任务、Gate 驳回和状态刷新。远程交付仍须精确文件清单授权，不重复派发已存在 Job。

## 实施与验收

本次是项目迭代：统一现行生产规则、默认值、入口和返工，不批量转换历史视频。验收按 `local/current-production-iteration/acceptance.md` 的 AC-1～AC-5 收敛；实际验证与待完成实片环节以 ROADMAP.md 为准。


## 正常返工与旧资料

`storyboard-rework <slug> prepare --reason <原因>` 只读展示精确写入范围、返回阶段、失效范围与 reworkVersion。确认后使用 `start --rework-version <version>`，HTTP／Web 复用同一服务。旧 `storyboard-migration` CLI／HTTP 入口停用，不能作为生产回退。

旧资料返工保存原配置、阶段、审核、产物清单及冻结快照，不删除既有资料与任务记录。只有已成功且指纹及严格校验通过的公共上游资料才可沿用，遇到缺失、改变或未完成的输入就退回该阶段；随后使用当前任务重新制作分镜与下游，不继承旧 Gate 2／Gate 3 批准。旧设计不能直接选择仅返工 Remotion。活动任务、过期计划、冲突写入和 completed 均阻断。旧对话任务可显式通过 production-task fail 结束并释放锁，再准备返工；后台执行须先安全停止进程，不能把记录失败当成进程已停止。中断恢复同一 reworkVersion，不手改契约或版本字段。

## Shot 设计与消费契约

按内容表达目标 → Scene 组织内容 → Shot 设计观看方式 → Event 设计镜头内变化 → 选择组件或编写实现。Shot 属于现有口播／Storyboard 联合收敛步骤，不增加阶段、独立镜头文件、人工 Gate、画面生成器或自动审查调用。换字幕、亮标签、对象移动不自动算新镜头；单 Scene 单 Shot 可以成立，不规定最少镜头数或必须运镜。

每幕维护唯一 elements、events 和有序 shots，Event.shotId 引用所属 Shot，不复制对象或事件。Shot 必需字段及结构以 storyboard-v3.schema.json 为准：id、purpose、framing、composition、viewpoint、focus、visibleElementIds、camera、start、end、entryState、exitState、transitionToNext、implementation。取景、构图、视角、焦点及相机用描述表达，不设能力白名单；素材缺口写明，不强制图片或录屏。Scene.focus/layout 是总体说明，Shot.focus/composition 是具体观看方式；不能复制同一个框冒充镜头设计。

start 首镜为 {type: scene-start}，后续为 {type: cue, anchor, occurrence}；end 为 {type: next-shot, shotId} 或末镜 {type: scene-end}。后续起点必须在口播中明确定位且有序。transitionToNext 含 target（type 为 shot／scene／end，id 引用目标，end 的 id 为 null）、mechanism、reason、retainedElementIds、exitingElementIds；同幕延续与退出对象由相邻可见清单准确核对。跨幕延续使用唯一对象 ID、既有生命周期和具体 retain 理由，下幕可以引用上幕存续对象。镜头可见范围不销毁、复制或重置对象，必须包含可见子元素的父容器；路径和标签也独立登记。

真实音频返回后，以真实 Cue 起点解析 Shot 边界；锚点落在 Cue 中间而没有词级时间来源时阻断，不按字数、百分比或偏移猜切点。Shot 的半开区间连续覆盖 Scene，每镜至少一帧；Event 起点及完成点必须在所属 Shot 内。跨硬切动作拆为明确前后状态事件；连续运镜可以留在同一 Shot。Shot 不切分 TTS 或字幕，不延长音频。

Gate 2 展示 Scene → Shot → Event，设计审计 schemaVersion 2、质量规则 storyboard-execution-quality-v2 保留逐事件 SQ-1～10，另用 shotChecks 逐 Shot 覆盖目的／构图、对象完整性／连续性、切换收益、真实锚点可定位性及实现条件。冻结 5 绑定 shotIds、eventShotMap 与完整审核依赖，旧格式仅历史读取；未完成资料通过正常返工，不自动补镜头或继承批准。completed 永久只读。

下游 alignment 5 各幕 shots 记录 id、startFrame、endFrame、implementationFiles、implementationSymbols、transition；事件增加 shotId。transition 包含 target、mechanism、startFrame、endFrame、visibleElementIds：硬切为边界零长区间；其他转场必须声明在双方镜头时间范围内、含交界的真实视觉重叠区间及准确的双镜头对象并集，不改变逻辑 Shot／Scene／音频范围。全片末镜的 fade 等结束效果可在本镜真实区间内结束，endFrame 必须等于片尾，不额外补时。实施文件和符号必须能对应当前源码，不能用文字声明代替画面。只读时间计算器不生成组件、写文件或批准 Gate。

观看证据 schemaVersion 2 保留逐 Scene、逐 Event 及整片正常速度试听，新增 shots 和 boundaries，绑定当前冻结／源码／音频／真实时序；镜头及交界记录真实帧区间、studio-playback 方法、结果、具体发现，未观看保持 pending。Gate 3 保留人工决定；隔离检查通过不代表实际审美验收。
