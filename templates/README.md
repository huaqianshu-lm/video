# 视觉模板库

`templates/` 保存本项目原创、可运行、可改造，并经正常速度预览和用户画面质量认可的 React／Remotion 视觉实现。

## 使用顺序

1. 先根据当前内容、用户确认的分镜和 [设计参考](../references/README.md) 设计画面。
2. 再查看本索引，判断是否存在表达任务、对象关系和适用条件均匹配的模板。
3. 匹配时按当前视频内容和真实 Timeline 改造；没有匹配项时，由 Agent 编写所需 React／Remotion 实现。
4. 改造后的实际画面与声音按 [质量规范第 12 章](../docs/VIDEO-PRODUCTION-RULES.md#12-gate-3-实际观看与试听) 检查，交用户观看、试听并确认。

模板不自动生成分镜，不决定视觉方案，不限制 Agent 可用的对象、组件或动作。

## 主体动效与标题的职责

主体画面承载对象、关系和状态变化，标题帮助观众定位主题或段落。两者按当前设计组合，也可一体实现；标题的位置、时序及与主体的关系由表达需要决定，是否采用标题模板由 Agent 判断。

## 准入标准

模板进入 `templates/visual/<template-id>/` 前必须同时满足：

- 来自本项目原创画面实现，不复制外部案例的源码、业务文案或素材。
- 用能够完整展示模板能力的最小可播放预览，呈现必要的起始状态、变化和结束状态，正常速度观看并获得用户画面质量认可。镜头数量及是否加入字幕、口播、音乐或音效由验证需要决定；涉及声画配合时同时试听。可使用独立预览或已有视频的相关片段，无需为入库另做完整视频。
- 预览保留理解动作和阅读必要文字所需的时间，不截断变化链或为凑时长延长停留；其时长不作为生产时的固定时长。
- 持续循环型主体展示完整循环及衔接，周期由运动闭合决定；非循环画面可保留结果作为结束状态。入场、退场动画均按表达需要选择。
- 包含可运行的 `index.tsx`、中性内容的 `example.tsx` 和说明文件。
- 说明表达任务、输入数据、视觉不变量、可调整项、不适用条件、失败方式和实际验证范围。
- 已去除具体视频业务内容，提取过程不回写已完成视频。

候选实验、案例复现和未获认可的实现保留在 `local/visual-template-candidates/`，不能进入本目录。

### 验证范围

入库时记录预览形式、实际时长、观看／试听范围及用户认可情况。交互预览、Remotion 渲染输出、真实视频应用和跨视频复用分别记录；另一条视频使用真实 Timeline 成功改造并再次验收后，才标记「跨视频验证」。既有模板保留真实历史记录。模板认可只覆盖实际验证范围，不能代替当前视频的检查与用户确认。

## 当前模板

| 模板 | 表达任务 | 验证范围 | 入口 |
| --- | --- | --- | --- |
| `boundary-permission` | 边界限制与许可请求；区域内操作的后果 | 单场景交互预览获用户质量认可并明确要求入库；生产实片与跨视频待验证 | [使用说明](visual/boundary-permission/README.md)、[实现](visual/boundary-permission/index.tsx)、[中性示例](visual/boundary-permission/example.tsx) |
| `document-key-points` | 文档保留来源、让出阅读空间，原文对应三项要点逐项展开，分层收尾 | 10.8秒独立Shot无声交互预览获用户质量认可；生产实片与跨视频待验证 | [使用说明](visual/document-key-points/README.md)、[实现](visual/document-key-points/index.tsx)、[示例](visual/document-key-points/example.tsx) |
| `sources-to-brief` | 三份输入沿路径汇入简报，对应区块生成，结果居中并收起 | 修正播放器适配后的7.4秒独立Shot无声预览获用户质量认可；生产实片与跨视频待验证 | [使用说明](visual/sources-to-brief/README.md)、[实现](visual/sources-to-brief/index.tsx)、[示例](visual/sources-to-brief/example.tsx) |
| `code-walkthrough` | 连续入场推近、固定编辑器逐行高亮、连续拉回收起 | 6.6秒独立Shot无声预览获用户质量认可；提取198帧一致，生产实片与跨视频待验证 | [使用说明](visual/code-walkthrough/README.md)、[实现](visual/code-walkthrough/index.tsx)、[示例](visual/code-walkthrough/example.tsx) |
| `condition-filter` | 同一装置切换筛选条件，两轮相同输入展示通过与拦截差异 | 8.4秒独立Shot无声预览获用户质量认可；提取252帧一致，生产实片与跨视频待验证 | [使用说明](visual/condition-filter/README.md)、[实现](visual/condition-filter/index.tsx)、[示例](visual/condition-filter/example.tsx) |
| `object-comparison` | 独立盒体让位保留对照，双门柜展开分区，合门及双向滑出收尾 | 8.2秒独立Shot无声预览获用户质量认可；提取246帧一致，生产实片与跨视频待验证 | [使用说明](visual/object-comparison/README.md)、[实现](visual/object-comparison/index.tsx)、[示例](visual/object-comparison/example.tsx) |
| `aligned-comparison` | 三列对齐比较、指标逐行呈现与强调，窄条收拢并错峰上滑收尾 | 8秒独立Shot无声预览获用户质量认可；提取240帧一致，生产实片与跨视频待验证 | [使用说明](visual/aligned-comparison/README.md)、[实现](visual/aligned-comparison/index.tsx)、[示例](visual/aligned-comparison/example.tsx) |
| `context-detail` | 输入建立、处理节点展开与重排、收回完成后建立输出并送出，整体上滑收尾 | 串行修正版8秒独立Shot无声预览获用户质量认可；提取240帧一致，生产实片与跨视频待验证 | [使用说明](visual/context-detail/README.md)、[实现](visual/context-detail/index.tsx)、[示例](visual/context-detail/example.tsx) |
| `digital-workspace` | 独立文档、图片和代码保留来源，依次归入统一工作空间，窗口收为顶栏再缩窄上移收尾 | 静帧及7.8秒独立Shot无声预览获用户质量认可；提取234帧一致，生产实片与跨视频待验证 | [使用说明](visual/digital-workspace/README.md)、[实现](visual/digital-workspace/index.tsx)、[示例](visual/digital-workspace/example.tsx) |
| `network-volume` | 曲面网络科技主体固定中心旋转，轨道光点持续绕行，完整画面循环 | 静帧及持续循环独立Shot无声预览获用户质量认可；默认24秒一周期，无入场／离场，生产实片与跨视频待验证 | [使用说明](visual/network-volume/README.md)、[实现](visual/network-volume/index.tsx)、[示例](visual/network-volume/example.tsx) |
| `metal-volume` | 实体金属曲面、浅槽与加工纹理持续转动，固定冷暖光照建立体积 | 持续循环独立Shot无声预览获用户质量认可；默认24秒一周期，无入场／离场；提取渲染逻辑及720帧角度一致，Remotion实片与跨视频待验证 | [使用说明](visual/metal-volume/README.md)、[实现](visual/metal-volume/index.tsx)、[示例](visual/metal-volume/example.tsx) |
| `material-comparison` | 金属球建立并让位、网络球随后建立，左右对照与分层外晕／背光暗面 | 8.8秒双球独立Shot无声预览获用户质量认可；提取264帧状态与SVG一致、绘制代码核对及定向严格类型检查通过，Remotion实片与跨视频待验证 | [使用说明](visual/material-comparison/README.md)、[实现](visual/material-comparison/index.tsx)、[示例](visual/material-comparison/example.tsx) |
| `operation-feedback` | 同一软件环境内修改并发配置、执行并用工作轨道数量回应，结束保留完整结果 | 7.8秒独立Shot无声预览获用户质量认可；无收尾动画；提取234帧状态与SVG一致，定向严格类型检查通过，Remotion实片与跨视频待验证 | [使用说明](visual/operation-feedback/README.md)、[实现](visual/operation-feedback/index.tsx)、[示例](visual/operation-feedback/example.tsx) |
| `context-focus` | 低亮链路保留上下文，来源选择后展开明亮前景，逐项对应细节，结束保留结果 | 6.2秒独立Shot无声预览获用户质量认可；提取186帧状态与SVG一致，定向严格类型检查通过，Remotion实片与跨视频待验证 | [使用说明](visual/context-focus/README.md)、[实现](visual/context-focus/index.tsx)、[示例](visual/context-focus/example.tsx) |
| `chapter-title` | 科技章节标题小幅错位归位，光束建立，阅读后从右到左分解为字形碎片并飘散消失 | 5.1秒独立Shot无声预览获用户质量认可；提取153帧状态／碎片参数／SVG一致，定向严格类型检查通过；其他标题改造、Remotion实片与跨视频待验证 | [使用说明](visual/chapter-title/README.md)、[实现](visual/chapter-title/index.tsx)、[示例](visual/chapter-title/example.tsx) |
| `opening-questions` | 同一任务核心先展开能力问题，再通过操作触及权限边界引出确认问题，结束保留完整画面 | 7.4秒独立Shot无声预览获用户质量认可；提取222帧状态与SVG一致，组件源码核对及定向严格类型检查通过；Remotion实片与跨视频待验证 | [使用说明](visual/opening-questions/README.md)、[实现](visual/opening-questions/index.tsx)、[示例](visual/opening-questions/example.tsx) |

模板在此登记 ID、表达任务、验证状态和入口。目录结构为：

```text
templates/visual/<template-id>/
  README.md
  index.tsx
  example.tsx
```

分镜数据格式查 [Schema 与合法示例](../docs/STORYBOARD-PRODUCTION-CONTRACT.md)，设计方法与案例查 [参考索引](../references/README.md)。
