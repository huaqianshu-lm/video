# 视觉模板库

`templates/` 只保存经过原创独立 Shot 预览、正常速度观看与用户画面质量验收，且可运行、可改造的 React／Remotion 视觉实现。它不是生产资料骨架、JSON Schema、设计参考或外部案例复现的收纳目录。

## 使用顺序

1. 先根据当前内容、冻结分镜和 `references/` 设计画面。
2. 再查看本索引，判断是否存在表达任务、对象关系和适用条件均匹配的模板。
3. 匹配时按当前视频内容和真实 Timeline 改造；没有匹配项时，由 Agent 编写所需 React／Remotion 实现。
4. 每次使用仍需经过当前视频的 Gate 3 正常速度观看与试听，历史验收不能代替本次验收。

模板不自动生成分镜，不决定视觉方案，不限制 Agent 可用的对象、组件或动作。

## 主体动效与标题的职责

主体画面模板只负责对象造型、构图、关系和状态变化，不内置章节标题、场景大标题或标题动画。标题表达由专门的标题模板承担，在具体视频中按设计组合；主体模板不预设标题文案或标题占位。用于理解主体关系的对象标签仍属于画面设计。

## 准入标准

模板进入 `templates/visual/<template-id>/` 前必须同时满足：

- 来自本项目原创画面实现，不复制外部案例的源码、业务文案或素材。
- 用独立 Shot 的可播放预览展示完整的建立、变化与收尾，并通过正常速度观看及用户画面质量认可。模板验证不要求真实生产视频或完整 Timeline；不使用完整 Scene，不添加字幕、口播、音乐或音效。
- 预览保持短时长，只保留理解动作和阅读必要文字所需的时间；不为凑时长延长停留，不为缩短而截断变化链。预览时长不作为生产时的固定时长。
- 持续循环型主体可从完整状态开始，以连续的循环边界代替入场与收尾；周期由运动闭合决定，不强加入场、离场或重复建立。
- 包含可运行的 `index.tsx`、中性内容的 `example.tsx` 和说明文件。
- 说明表达任务、输入数据、视觉不变量、可调整项、不适用条件、失败方式和实际验证范围。
- 已去除具体视频业务内容，提取过程不回写已完成视频。

候选实验、案例复现和未获认可的实现保留在 `local/visual-template-candidates/`，不能进入本目录。入库时标记“Shot预览认可”，记录实际时长和观看范围；交互预览可以用于画面认可，不宣称已经渲染Remotion成片。真实视频应用及跨视频验证分别记录；另一条视频使用真实 Timeline 成功改造并再次验收后，才标记“跨视频验证”。既有模板保留真实历史验证范围，不改写为未发生的Shot验收。

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

预览认可不表示完整视频 Gate 3／Gate 4、Remotion 渲染输出或另一内容复用已验收。生产使用仍按当前视频的真实 Timeline、冻结分镜和人工 Gate 验证；入库不要求先制作完整场景或带字幕／声音的视频。

模板在此登记 ID、表达任务、验证状态和入口。目录结构为：

```text
templates/visual/<template-id>/
  README.md
  index.tsx
  example.tsx
```

生产数据契约位于 `contracts/video-production/`，空白资料骨架位于 `scaffolds/video-production/`，退役流程资料位于 `legacy/video-production/`，设计方法与案例解析位于 `references/`。
