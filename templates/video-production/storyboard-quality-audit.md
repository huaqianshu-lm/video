# 分镜设计与执行审计

规则版本：storyboard-execution-quality-v2。适用标准：`docs/STORYBOARD-EXECUTION-QUALITY.md`。这是审计模板，不是运行时分镜 schema 或人工观看证据。

## 输入版本

- videoSlug／Workflow／productionContract／分镜 schemaVersion：
- 分镜、纯口播、资料依据、实现和 Timeline 指纹：
- reviewVersion（Gate 2 前未冻结时如实记录）：
- 审计方法：设计资料／源码检查／实际观看（分别填写，不互相替代）。

## 逐幕逐事件

必须覆盖全片所有 Scene／Event，包括有意静置与交界；每个事件逐项填写 SQ-1～SQ-10，不由模板默认通过。

| Scene／Event／Element | 检查 ID | pass／fail／pending | design／implementation | 依据与观察 | 修正及返回阶段 |
|---|---|---|---|---|---|
| 待填 | 待填 | pending | 待填 | 待填 | 待填 |

检查内容：视觉任务与依据、前态／动作／后态、焦点与让位、完整对象清单、父子与替换区间、请求／结果身份、标题用途、跨幕身份、可用执行能力、语义锚点与正式时间可行性。

按 `docs/VIDEO-PRODUCTION-RULES.md` 6.1 写具体造型／构图、每次镜头变化获得的新信息，以及动画如何体现因果结果；按 8.5 复查转场合成漏底，按 9.6 A 复查字幕轮廓与背景对比。采用代表性片段实验时按 9.7 区分局部观察与整片推广结果，浅色配色仅为可选参考。记录沿用本模板和现有审计／观看 note，不新增字段或默认 pass。

## 量化参数选择与复核

先读 `docs/VIDEO-PRODUCTION-RULES.md` 9.6，按当前设计任务填写适用参数；数值只在权威规则维护。Gate 2 填设计检查，Gate 3 补实际帧／正常速度试听证据；未观看保持 pending，不改变运行时分镜 schema。

| Scene／Event／对象 | 参数 | 采用值 | 偏离基线的原因（如有） | 设计检查 | 实际画面／听感证据与结果 | 修正 |
|---|---|---|---|---|---|---|
| 待填 | 待填 | 待填 | 待填 | pending | pending | 待填 |

## 审美与感官检查

先读 `docs/VIDEO-PRODUCTION-RULES.md` 14.4。每幕分别记录设计依据和实际观察，不以量化达标或“好看”代替结论；使用既有审计 evidence／note 和观看证据 note，不增加 JSON 字段。

| Scene／代表 Event | 维度／关联 SQ | 设计依据与待验事项 | 实际帧范围／观看或试听方式 | 具体发现、结果与修正 |
|---|---|---|---|---|
| 待填 | 构图与留白／SQ-3 | pending | pending | pending |
| 待填 | 字体与层级／SQ-7 | pending | pending | pending |
| 待填 | 配色与材质／SQ-9 | pending | pending | pending |
| 待填 | 动作与呼吸／SQ-9、SQ-10 | pending | pending | pending |
| 待填 | 连续性与交接／SQ-3、SQ-8 | pending | pending | pending |
| 待填 | 声音与画面／SQ-10 | pending | pending | pending |

值得复用的调校组合按 9.7 使用 `tutorial-motion-recipe.md` 留证；候选、单条实际验证与跨视频适用范围分别记录，不将本表视为已验证配方库。

## 待验收样例

以下是无业务文案的机制样例，未经实际画面或人工 Gate 验收，不能作为质量基线；具体视频必须替换为自身资料依据。

| 机制 | 候选设计 | 反例及失败原因 |
|---|---|---|
| 状态替换 | 同一主体先呈现前态，替换事件使前态退出、后态接替；阅读区分别保留 | 前后态同事件进入且同时常驻，无法读出顺序 |
| 请求到结果 | 请求对象先进入，处理完成事件后生成独立结果对象，请求退出 | 提前显示结果对象，靠换色代替生成 |
| 父子生命周期 | 容器包含标签、底线与箭头，共用受控区间；退出后整组不输出 | 主体隐藏而路径或标签残留 |
| 标题让位 | 标题说明当前对象，在主体接管焦点时退出 | 有文字来源就全片常驻 |
| 跨幕承接 | 同一对象 ID 延续状态及空间，后续用途完成后退出 | 每幕卸载重建对象，入场重播或几何位置跳变 |
| 同 Cue 顺序动作 | 有词级时间证据才精细绑定，否则重设计或阻断 | 按字数估算、固定偏移或同起点冒充精确同步 |

## 实际观看（Gate 3）

只有实际观看后填写检查方式、真实帧范围、版本指纹、完整动作／交界、关键中间状态、正常速度试听、结果和遗留问题。未观看填 pending。机器结果单列，不代填观看结论。失败项按设计／实现返回相应任务；不得自动批准 Gate。

## 镜头审计（当前格式）

使用 `storyboard-design-audit-v2.schema.json`：schemaVersion 2；逐事件 checks 保留 SQ-1～10；shotChecks 按每幕每 Shot 唯一记录 sceneId、shotId、result、全部可见 elementIds、purposeComposition、objectContinuity、transitionBenefit、timingSource、implementation、evidence 和 note。各项写具体取景任务、构图理由、身份／状态交接、切换收益和真实时间可定位性，不复制一份空泛 pass。绑定当前 designInputVersion、分镜和口播指纹，未完成填 pending。当前数据参考 storyboard-v3.json；v2 文件仅供历史读取。
