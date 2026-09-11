# Visual Prototype 基线

这是通用 Visual Prototype 的结构基线，不包含任何具体视频内容。新原型应从 `visual-prototype.html` 开始，只替换标题、Scene 数量、主体视觉和有资料依据的屏幕文字。

固定骨架和顺序：

```text
.shell
  .toolbar
    .controls
  .stage
    .scene.active
      .eyebrow
      h1 或 .title
      主体视觉内容
    .caption
  .progress
  .meta
```

约束：16:9；标题区统一位于 Scene 左上；每个 Scene 只能有一个可见标题区；字幕、导航和进度信息保持在固定位置；预览辅助控件不得进入最终 Remotion Composition 或 MP4。
