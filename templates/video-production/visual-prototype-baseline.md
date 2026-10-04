# Visual Prototype 基线

这是通用 Visual Prototype 的结构基线，不包含任何具体视频内容。新原型应从 `visual-prototype.html` 开始，只替换 Scene 数量、左上简短内容文字、主体视觉和有资料依据的屏幕文字。

固定骨架和顺序：

```text
.shell
  .toolbar
    .controls
  .stage
    .scene.active
      .eyebrow
      主体视觉内容
    .caption
  .progress
  .meta
```

约束：16:9；每个 Scene 的左上文字只保留有资料依据的简短内容，省略 `SCENE 01`／`场景 01` 一类编号，也不显示固定大标题；必要的内容标题融入主体视觉。字幕、导航和进度信息保持在固定位置；预览辅助控件不得进入最终 Remotion Composition 或 MP4。旧原型的 `h1` 可继续只读展示，不作为新原型的模板。

新原型需能按正常速度预览 Visual Script 中的关键事件：主体建立、状态变化、旧主体让位、完成态停留和跨 Scene 承接。静态布局截图不足以确认这些动作已发生。

动态播放采用估算节奏；每幕声明稳定事件 ID、状态与口播语义提示，支持播放、暂停、重播和切幕。不得要求下游 TTS 或正式字幕才能预览。事件 ID 延续到 Remotion，正式时间仍来自 Workflow 的实际 Manifest。
