# 分镜设计与执行质量

本文是 `storyboard-v1` 的设计与执行质量标准，版本 `storyboard-execution-quality-v2`。阶段、人工审核和返工边界以 `STORYBOARD-PRODUCTION-CONTRACT.md` 为准；教程视觉原则继续使用 `VIDEO-PRODUCTION-RULES.md` 8.3～8.5、9.1～9.7、14.2～14.4。不恢复 HTML 原型，不增加人工 Gate，不恢复独立 TTS 试听审核。

制作分镜及实施前必须读取 [教程片量化基线](VIDEO-PRODUCTION-RULES.md#96-教程片视觉与声音量化基线)。采用值、偏离理由和待复查项记入现有设计审计；Gate 2 检查设计，Gate 3 检查实际有效字高、动作及阅读区间、交界和正常速度听感。参数达标不能代替 SQ-1～SQ-10 的动作语义与对象关系；量化参数接入本身不改变数据契约，Shot 格式升级见生产契约，不代表新增机器画面校验。

同时执行 `VIDEO-PRODUCTION-RULES.md` 14.4 的审美与感官自检：构图／留白、字体层级、配色材质、动作呼吸、连续交接、声音与画面。Gate 2 按该节映射写入 SQ-3／7／8／9／10 的 evidence／note，每幕有具体设计依据；Gate 3 在现有 Scene／Event 观看 note 和 listening.note 中记录真实观察、修正及遗留问题，不以设计 pass 代替实际观看。可复用参数组合按 9.7 和 `templates/video-production/tutorial-motion-recipe.md` 留证，候选与实际验证分开。这些要求属于当前设计规则；权威生产规则及配方模板纳入现有设计／任务输入指纹，变化使旧审计或已领取任务输入过期，不自动重写视频或继承批准。审美参数仍沿用既有字段；Shot 格式升级按生产契约执行。

## 设计审计

画面具体化、镜头目的与因果动画按 `VIDEO-PRODUCTION-RULES.md` 6.1 执行：造型／构图和焦点写入 SQ-3，状态变化与结果写入 SQ-2／6，镜头衔接理由写入 shotChecks 及 SQ-8，实现条件写入 SQ-9。代表性难点实验及整片推广按 9.7 留证，不新增审计字段、阶段或强制样稿。

每个 Scene 和每个 Event 都必须接受以下检查。审计独立于创作内容，指出具体对象、事件、依据、问题和修正；不能提交一份无证据的「全部通过」声明。程序能够确定的引用、区间和版本检查交给程序，不默认增加模型调用。

| ID | MUST 检查 | 失败例子 |
|---|---|---|
| SQ-1 | 明确视觉帮助理解的内容及 sourceRefs 依据 | 把口播排成卡片，只有淡入 |
| SQ-2 | before／action／after 在对象状态上可观察 | 写「请求到达」，实际只画连接线 |
| SQ-3 | 焦点、让位、阅读停留与后续承接明确 | 每幕重建版式，旧主体无理由常驻 |
| SQ-4 | 完整列出主体、容器、文字、路径、箭头、结果及子元素 | 只列文字，底线与状态指示灯游离 |
| SQ-5 | 元素区间及替换顺序可执行，父子区间一致 | 两个互斥状态同事件进入并都留到幕末 |
| SQ-6 | 请求、处理中和结果有明确身份 | 把请求面板换成绿色就声称文件已创建 |
| SQ-7 | 标题有用途、关联对象、焦点交接及退出 | 因有资料依据或字号小而全片保留 |
| SQ-8 | 跨幕身份及终止事件明确，确需换视角说明原因 | 「保持空间连续」充当保留理由 |
| SQ-9 | 按内容设计后核对实现条件，组件缺失时规划所需实现，明确真实能力缺口 | 根据组件库倒推分镜，或把组件名／任意 JSX 当作实现保证 |
| SQ-10 | 时间源可支持动作顺序，阅读区间待真实时间复核 | 同 Cue 多个顺序事件都绑定其起点却称精确同步 |

每项使用 pass／fail／pending，附 Scene ID、Event ID、Element ID（如适用）、问题类型（design／implementation）、依据和修正。Gate 2 审计 pass 只表示方案满足要求，不能表示动画已观看。实际画面、完整动作及正常速度试听在 Gate 3 检查。

## 当前实现契约（2026-10-10）

统一画面执行器已移除。Agent 按冻结分镜编写当前视频 React／Remotion 组件；Harness 不生成组件、配置或对象树，不限制对象类型和动作名称。分镜仍使用 schemaVersion 3、冻结 5，Workflow 和人工 Gate 不变。

对象稳定 ID、资料依据、前态／动作／后态、父子关系及生命周期仍须明确。execution 记录动作说明、涉及对象和持续帧数，capability 是描述性名称，不是固定能力白名单。结构检查不能代替视觉设计。不能因为现有组件不支持而降级成矩形与标签。

## 时间与实现校验

使用真实 Cue／Segment／Timeline 绑定语义事件。durationFrames 只表示动作持续时间；缺少词级时间时，同 Cue 多个顺序动作阻断，不伪造偏移。跨幕身份、请求与结果区别、文字来源、动作区间及父子关系仍须检查。

Agent 提交 remotion-alignment.json，schemaVersion 5、kind 为 storyboard-authored-alignment。每幕保留 layout、visualEvents、screenText、implementationFiles、implementationSymbols、timing、audioSegments、subtitleCues、animationEvents、visualBindings、visualElements、storyboardEvents，并增加实际 startFrame、endFrame 与 events（id、startFrame、completeFrame）。这些数据由真实时间映射核验，不能用自报文案代替实现。

对齐清单还绑定 reviewVersion、storyboardFingerprint、timingFingerprint、implementationFingerprint、runtimeFiles 和 audioFiles。harness/src/storyboard-implementation.mjs 的 buildStoryboardImplementationReview 是只读计算器，返回当前源码／音频指纹及事件区间供制作 Agent 填写，不生成画面、写文件或通过审核。导入的本地依赖递归纳入指纹和输入包；源码或音频改变，原观看证据失效。旧 storyboard-execution-alignment 不兼容，未完成视频必须正常返工，completed 永久只读。

## 实际观看与人工 Gate

按 `VIDEO-PRODUCTION-RULES.md` 8.5、9.6 A 和 14.4，复查转场底层背景与透明度覆盖、交界连续性及无底板白字描边字幕的实际可读性。交界静帧／像素检查只补充漏底排查，局部实验只证明对应范围；两者都不能代替连续播放及整片观看／试听，检查结果记入既有 note／unresolved。

remotion-viewing-evidence.json 的 schemaVersion 升为 2；kind、slug、reviewVersion 和分镜／实现／时间指纹字段继续保留。viewer、viewedAt、scenes、checks、listening 和 unresolved 仍必需：逐幕完整播放、逐 Event 检查起点／中间／完成／交界，正常速度完整试听当前音频。每项记录真实范围、方法、结果、发现和遗留问题；未观看保持 pending，机器检查不能填写 pass。

Studio、本地和 GitHub 使用同一独立输入包及 Agent 编写的组件；入口不强制文件名或组件导出名。临时 src/RenderInputRoot.tsx 仍被忽略，受跟踪的 Root 只含通用 Composition。缺少对齐或观看证据阻断任务完成和 Gate 3。

## 返工与并发

方案改变返回口播／分镜任务和 Gate 2；实现修改返回 Remotion 和 Gate 3。正常返工保留历史审核事实，不手改状态、不继承过期批准。共享 JSON 原子写入及 completed 保护仍适用。当前删除与新实现入口的验证状态见 ROADMAP.md；不能据此声称实片质量或跨视频验收完成。

## 镜头质量与证据

Shot 字段、锚点、连续区间、对象身份、衔接、设计 shotChecks、alignment 5 和观看证据 2 以 [生产契约的 Shot 章节](STORYBOARD-PRODUCTION-CONTRACT.md#shot-设计与消费契约) 为唯一结构说明。设计检查必须具体说明取景如何帮助理解、对象和父子引用是否完整、跨镜头状态如何延续、切换收益及可定位时间源。实际逐镜头播放并观看相邻交界，核对构图、阅读、完整动作、跳变和遮挡；保留逐 Scene／Event 与整片试听，机器不能填 pass。一个镜头可以包含多个变化，不以镜头数量、组件数量或持续运动代替质量。
