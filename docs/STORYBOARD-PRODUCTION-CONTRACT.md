# 分镜关联与时间映射规则

## 适用范围与使用时机

本文补充分镜中跨字段的对象关联与真实时间规则。编写分镜时查对象引用，真实音频生成后或恢复实现时查时间映射与异常处理。字段、类型及必填项直接查 [Schema](../contracts/video-production/current/storyboard.schema.json)，具体写法查 [合法示例](../contracts/video-production/current/examples/storyboard.json)。

## 对象关联

### 对象与素材引用

Scene 的 `id` 与纯口播对应 Scene 的 ID 一致，`narrationRef` 指向同一 Scene。Scene、Shot、Event 的 ID 各自在全片唯一；`Event.shotId` 指向本幕镜头，`trigger.sceneId` 指向本幕，`execution.elements` 指向实际参与动作的元素。

元素 ID 全片稳定，同一对象只定义一次；跨幕延续沿用原 ID、生命周期及具体 `retain` 理由，下幕可以引用上幕仍存续的对象。`parentId` 指向实际父对象，不得自指或形成循环；子元素的存续不得超出父对象。镜头可见清单须包含可见子元素的父容器，路径和标签也独立登记；改变可见范围不等于销毁、复制或重置对象。

`sourceRefs` 指向本视频资料，`excerpt` 须确实存在。元素的 `sourceRef` 为定义该元素的 Scene 中 `sourceRefs` 的有效数组索引，依据须支持其画面文字。素材及示意图路径相对视频资料目录，须指向实际文件，禁止越界、符号链接及远程 URL；静态示意图支持 PNG／JPEG／WebP。`seriesSelection` 与本视频已确认快照一致。

### 镜头边界与衔接

首镜从 Scene 起点开始，后续镜头的 `start` 用锚点及出现次数定位到本幕口播，顺序须与口播一致。非末镜 `end.shotId` 指向紧邻下一镜，末镜在 Scene 终点结束。

`transitionToNext.target` 指向紧邻下一镜或下一幕，全片末镜指向结束。保留与退出清单不得重叠，须与前后可见对象一致；跨幕保留还须符合原对象生命周期及保留依据。请求、处理中状态与结果不得因复用 ID 或保留清单而混为同一对象；互斥状态的进出场须与事件的前后状态一致。

## 真实时间映射与异常处理

### 时间来源

以已校验的 Timeline 为时间基准，通过 `src/lib/timing.ts` 对应 Audio／Subtitle Manifest。Shot／Event 的语义锚点解析到真实 Cue 起点；有有效词级证据时使用准确词边界。锚点匹配须核对本幕文本、`occurrence` 及实际含义，保留与源码、实际帧区间的对应关系。动作持续帧数是实现预算，不是音频时间来源；估算秒数、字数比例或任意偏移不能作为同步依据。

使用 `generated/word-timing.json` 时，核对原始 `wordBoundaries` 与当前 `tts-script.json`、三份 Manifest 及各段音频的 SHA-256 绑定有效，对应段落去标点文本完整一致，时间单调且处于音频内。

### 解析与阻断

Agent 在当前实现中核对锚点及对应帧。只有 Cue 级证据时，可使用确有依据的 Cue 起点，不称为词级精确同步。出现以下情况，停止相应映射并修正引用、补齐有效证据或调整设计：

- 锚点不存在、出现次数不匹配或顺序不成立。
- 需要定位 Cue 内部但缺少词级证据，或锚点落在词内部。
- 所用词级证据绑定过期、文本不对应或时间无效。
- 解析后的镜头或事件区间不满足下述边界。

Shot 使用左闭右开的帧区间，连续覆盖 Scene，每镜至少一帧；Event 起点及完成点均在所属 Shot 内。跨硬切动作拆为明确的前后状态事件，连续运镜可留在同一 Shot。重叠转场说明双方可见对象与实际区间，最后效果在片内结束；Shot 不切分 TTS 或字幕，不延长音频。
