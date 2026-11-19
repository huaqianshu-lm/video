# 界面动作、内容生成与数据表达

本页整理从操作到结果的可见关系。来源表覆盖所研究 Shotcraft 版本的交互、界面入场和数据三类资料；它们提供设计候选，不是本项目已验组件。数字、字段、节点、操作与结果都要由当前视频资料支持。动画可以突出真实变化，不能制造不存在的能力、数值或执行过程。

跨容器动作的具体设计见 [列表行迁入画布](examples/list-to-canvas-transfer.md)：除选择、坐标、飞行与形态交接外，还对照准确 demo 及视觉实现，展开字体／表面、最终关系构图、主次运动、中段构图和目录组成的原创设计推导；原卡与源码不一致处单列。尚未完成原创实现与正常速度观看，本页其余来源归纳不等于已有同等深度的案例解析。

共同结果的具体设计见 [多源汇聚](examples/sources-to-unified-structure.md)：区分实体合并与引用，拆开路径建立、沿线传递、接收和清场，保留弧长定位、共用曲线、坐标转换、收缩及接收遮挡；原创演绎让引用进入结果的实际段落。代码阅读、差异与运行证据见 [代码走读与结果](examples/code-to-result.md)，原句和结论对应见 [文档到要点](examples/document-to-key-points.md)。其余来源仍需逐例深化，不能以来源表覆盖代替。

## 先区分动作的含义

收音与转写的连续状态见 [实时语音波形](techniques/interaction-and-feedback/voice-waveform-live.md)：保留暖白表面与大字、实际764宽波形区、确定性采样、历史延迟、转写／气泡／计时和十六帧；明确短暂停顿不清空历史、两端零权重及提交时间驱动的限制。原创封面评审让版本、语音、转写、保存与回听对应，不把录下意见等同于自动返修，也不让教程解说或配乐冒充输入声源。

同一内容只换外观见 [同布局主题切换](techniques/interaction-and-feedback/theme-switch-moves.md)：分别展开开关斜扫与命令面板收点涟漪的完整美术、动作链、共同坐标、边界光与二十八帧；单列实际中线时点、深层独有缩放破坏严格配准、亮点交叠与播放器数值问题。原创照片库以主图、文件名与选择保持为证据，不把换主题当成图像处理、保存或发布。

二选一操作的特写与内容接棒见 [分段控件切换主体](techniques/interaction-and-feedback/segmented-thumb-hero.md)：保留凹槽／白面材质、指针尖端、触点与滑块分层、双边形变和图标布局；单列实际约25%拉长、图标占位阈值跳变及到位后才可见的新身份。完整原创通过同一编辑器的推近、切换、拉回，证明源码和预览内容对应，不把模式变化当成保存或发布。

固定位置逐项阅读见 [固定焦点中的选项轮换](techniques/interaction-and-feedback/picker-carousel-feature-cycle.md)：拆开内容列移动、位置保持与焦点框呼吸，保留距离衰减、图标占位、遮罩、设计坐标及实际启用的模糊；七项不等于七次停靠。完整原创用同一图片与方形画框比较三种适配方式，让留白、裁切和比例变化成为选择依据，不用名称轮播代替教程内容。

输入如何改变集合见 [输入与筛选](techniques/interaction-and-feedback/type-and-filter.md)：从完成态倒推搜索区与结果构图，拆开输入可读性、退场与滑位、相机／指针共用坐标、点击及详情交棒；单列原卡数量、时序和底图计数／分类缺口。原创资料库保留三个合法命中结果，再通过年份与类型选择，避免把“搜索”误讲成“自动决定正确对象”。

| 含义 | 可设计的变化链 | 最重要的对应 |
|---|---|---|
| 选择 | 候选建立 → 操作 → 选中确认 → 结果 | 没选中的对象仍可辨认，选中不是随机消失 |
| 调参 | 基准 → 控件改变 → 几何或状态变化 → 核对 | 数字、测量标记与结果来自同一变量 |
| 迁移或复制 | 来源选定 → 提交 → 内容进入目的地 → 两端确认 | 原位变化符合移动、复制或引用的真实语义 |
| 生成 | 输入 → 有依据的处理示意 → 结构形成 → 完整阅读 | 生成顺序与实际依赖、讲解顺序一致 |
| 接入或传播 | 节点建立 → 通道可见 → 信号抵达 → 接收反馈 | 接通、传输和完成是不同状态 |
| 数量与组成 | 单位和总量建立 → 分类或重组 → 对照 | 数量守恒、比例、单位和聚合关系成立 |

## 入场如何服务结构

单选决定的具体设计见 [单选与候选退让](techniques/interaction-and-feedback/chip-grid-single-select-blackout.md)：分开按下、选中与结果，保留候选原位，拆解深色表面、勾选占位、轻回弹、回中线及结果排印；单列原值未落稳就划线、结果实际142帧才全结束等差异。完整原创以选择排序规则改变文件顺序，不把选择确认等同于执行成功，也不为套价格海报而虚构数值。

**整体揭幕**可让一组组件作为一个整体完成；**逐区巡览**可错开局部开始时间，让相邻动作适当重叠；**依赖步骤**则按真实前后发生。先判断内容关系，再选齐动、错峰、分组或串行。不能把某个案例的“全部同时”或“越落越快”变成所有场景的规则。

批量内容先预留真实落位区域，再设计来源、路径和末项完成态。整体需要从一摞变成一组时，可先建立集合，再展开；要表达已排列内容逐渐可见，则原位揭示更准确。数量展示与细节阅读分工：快速经过的材料只交代范围，关键条目另留可读状态，不能声称观众已读完全部材料。

## 四种值得展开的动作设计

### 跨容器改变表示

从输入字符确认成可归类对象，见 [输入词变成标签实体](techniques/construction-and-transformation/hashtag-to-pill-materialize.md)：保留两次硬切与一次统一缩移，展开纸面／图标／文字支点、归位槽、阴影与方向模糊；区分输入组居中与文字原位，说明版面静止而颗粒仍动。完整原创由报销笔记的待补原因出发，先添加属性，再按标签找到两篇合法匹配，不能把表示变化当成保存或报销成功。

先让观众认出被选内容，操作后沿可追踪路径到目的地，内容名称或图形身份持续对应，最终改变为适合目的地的版式。迁移时原位可变为空槽或已迁移提示；复制时来源保留；引用时保留来源关系。形态交接可以选遮挡、暂时简化或受控换层，不要求任何两种版式强行连续变形。

### 结构逐层形成

字段构成详情对象的详细设计见 [详情对象逐字段形成](techniques/construction-and-transformation/product-card-progressive-assemble.md)：先设计完整结果，再组织字段、骨架和填充提示；区分普通出现、真实填写和关键修正，保留旧值阅读与依据。含完整原创任务整理镜头，不把自动入场冒充真实抓取，也不把按钮填满视作提交成功。

先确定根节点、层级和边的真实含义。解释依赖时可以让关系引出下一节点；解释已有网络时则先展示节点再补关系。观察范围随新增结构扩展，末态全图仍看得清；节点多时分区展开，不靠缩字容纳整棵树。线头、描线边界和节点端口使用一致几何。

### 参数和结果同步

先固定基准与单位，控件、标注和结果由同一个实际参数派生。连续量连续变化，离散选项明确切换。弹性可以用于控件或强调外观，不让业务数值超出合法范围；多变量同时改变会削弱因果，除非讲解的就是联动。现有面板已清楚报数时，不再叠一个竞争的大读数。

具体设计见 [间距调节驱动布局](techniques/interaction-and-feedback/autolayout-gap-dial.md)：展开轻重字形、固定读数占位、对象表面、选择与测量的颜色分工、居中几何、速度模糊和中段构图，并以完整工具栏镜头区分“间隙扩大”与“按钮变宽”。原卡的回弹极值、颜色停留、预备比例与实现／样片的差异单列；展示用自动回弹不应无条件迁入真实操作教学。

### 让图表变化保持可信

示波流线适合有时间采样的数据；点群重组适合可定义单位或权重的组成关系；坐标重标适合确实需要扩大量程的情况。重标时刻度、网格和旧数据同步变化，并让观众看到尺度已变。不能用“冲破天花板”掩盖任意夸张数值，装饰波形也不能冒充人声或真实监测结果。

## 交互来源

| 来源资料 | 可迁移的设计关系 | 失败修正 |
|---|---|---|
| [autolayout-gap-dial](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/interaction/autolayout-gap-dial.md) | 数值、间距与测量同步变化 | 外观过冲不造成非法数值，标尺不滞后 |
| [canvas-materialize-moves](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/interaction/canvas-materialize-moves.md) | 内容跨容器改表示；结构按层形成 | 移动、复制、引用区分；节点生成不等于已有图活跃 |
| [chip-grid-single-select-blackout](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/interaction/chip-grid-single-select-blackout.md) | 按压、选中与后续结算有先后 | 确认前不重排候选；价格数据不沿用示例 |
| [collab-cursor-moves](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/interaction/collab-cursor-moves.md) | 身份标记与协作行为持续对应 | 只有协作语境才使用多人光标，漂移不挡正文 |
| [glass-pill-dictation-typing](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/interaction/glass-pill-dictation-typing.md) | 待命光退让给输入内容，材质和环境共同变化 | 输入条宽度足够，不能用装饰光暗冒充真实识别状态 |
| [hashtag-to-pill-materialize](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/interaction/hashtag-to-pill-materialize.md) | 输入词确认为实体，再进入布局 | 确认可以干脆切换；不为连续动画杜撰中间操作 |
| [picker-carousel-feature-cycle](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/interaction/picker-carousel-feature-cycle.md) | 内容穿过固定焦点，落稳后读选项 | 焦点框不能随列表漂移，停靠不是连续加载 |
| [segmented-thumb-hero](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/interaction/segmented-thumb-hero.md) | 点击、滑块到位、新模式反馈构成因果 | 高亮位置、指针点击点与真实控件对应 |
| [theme-switch-moves](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/interaction/theme-switch-moves.md) | 同布局换主题，触发点与变化源关联 | 两主题分别设计；滤镜反相不能替代真实深色界面 |
| [type-and-filter](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/interaction/type-and-filter.md) | 输入、候选收敛、进入目标保持来源关系 | 筛选理由需可见，目标回到合法槽位 |
| [voice-waveform-live](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/interaction/voice-waveform-live.md) | 发声、停顿、转写与提交有不同状态 | 有人声就用真实音频依据，不能合成假同步 |

## 集合与界面形成来源

| 来源资料 | 可迁移的设计关系 | 失败修正 |
|---|---|---|
| [avatar-bracket-carousel](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/ui-entrance/avatar-bracket-carousel.md) | 同一职责位置轮换不同身份 | 角色名称与对象同步；身份不能只是随机头像 |
| [bezier-source-converge-merge](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/ui-entrance/bezier-source-converge-merge.md) | 路径建立、输入抵达、目的地接收、通道收束 | 数据传输不要求来源实体消失，按实际语义改造 |
| [card-stack](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/ui-entrance/card-stack.md) | 集合成摞、展开个体、选出目标 | 展开给足空间，层序不在重叠中突然跳变 |
| [carousel-3d](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/ui-entrance/carousel-3d.md) | 循环陈列与前方聚焦共同建立范围 | 正反面文字不镜像，循环陈列不代替逐项解释 |
| [cloner-depth-echo](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/ui-entrance/cloner-depth-echo.md) | 复制与合并解释规模，区别于不同对象的视差 | 副本数量、计数与实际含义对应 |
| [deck-deal-flyin](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/ui-entrance/deck-deal-flyin.md) | 明确来源、批量分发、实际落位与整体收束 | 不为数量感复制虚假业务资料，末项落稳后再核对 |
| [doc-park-left-pill-deal](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/ui-entrance/doc-park-left-pill-deal.md) | 来源让出空间，结论与依据逐项对应 | 自动滚动不能移走正在核对的依据；字幕按真实时序 |
| [draw-svg-trace](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/ui-entrance/draw-svg-trace.md) | 轮廓建立后主体内容接管 | 描线轮廓与实体吻合，不让笔头成为无关装饰 |
| [element-body-moves](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/ui-entrance/element-body-moves.md) | 支撑面上的影子证明离面高度 | 影子与支撑面关联，不能全跟着主体移动 |
| [integration-hub-map](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/ui-entrance/integration-hub-map.md) | 对象建立、连接、持续输送分别表达接入状态 | 连线存在不等于正在传输；并行接入不假画成串行 |
| [list-reveal](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/ui-entrance/list-reveal.md) | 单项出现与集合移动可分层编排 | 阅读需要稳定时取消整体漂移，避免“必须一直动” |
| [list-stack-press](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/ui-entrance/list-stack-press.md) | 新项落位影响集合，计数同步确认 | 数字滚动应在下一次更新前收清，不能反复从零重滚 |
| [neon-frame-forerun](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/ui-entrance/neon-frame-forerun.md) | 先定位区域，再让内容逐区完成，环境让位 | 光效可换为克制的边界提示，不继承霓虹风格 |
| [neon-frame-orbit-drop](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/ui-entrance/neon-frame-orbit-drop.md) | 同步完成可以表达一页作为整体登场 | 与逐区巡览区分；相机和对象不各自再开新动作 |
| [page-waterfall-wall](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/ui-entrance/page-waterfall-wall.md) | 差速内容流建立广度，重点另行展开 | 循环周期包含间距，防回跳和同图重复暴露 |
| [product-card-progressive-assemble](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/ui-entrance/product-card-progressive-assemble.md) | 字段分组建立，关键修正区别于普通显露 | 光标与字段边界同步，旧值先可读再改变 |
| [radial-wave](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/ui-entrance/radial-wave.md) | 距离决定传播延迟，反馈波与建立波分工 | 波源、最远点与终态重算，不把扩散动画当真实覆盖数据 |
| [research-card-stack-scroll](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/ui-entrance/research-card-stack-scroll.md) | 当前材料清晰、旧材料退为历史，体现处理范围 | 快速经过不等于读完；末项需在本镜时限内落定 |
| [row-embed](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/ui-entrance/row-embed.md) | 内容落入已有布局，接口确认完成 | 截图原内容先遮清，不能与飞入副本重影 |
| [value-stagger-gradient](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/ui-entrance/value-stagger-gradient.md) | 错峰可以作用于时间和幅度，原点改变形成对照 | 数据图形的高度不能为装饰梯度任意改写 |
| [wall-reveal-moves](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/ui-entrance/wall-reveal-moves.md) | 已排好结构可原位显形，蓝图与实体逐项对应 | 线框与实体对齐；原位揭示不误称内容迁入 |

## 数据来源

| 来源资料 | 可迁移的设计关系 | 失败修正 |
|---|---|---|
| [before-after-slider-scrub](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/data/before-after-slider-scrub.md) | 同参照下先宣布变化，再留时间核对差异 | 对照版本真实可信，分割杆与揭示边界一致 |
| [chart-live-moves](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/data/chart-live-moves.md) | 采样、单位重组和量程改变是不同数据叙事 | 轴、单位、权重和真值保持可解释，不把示意当实测 |
| [gauge-readout-moves](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/data/gauge-readout-moves.md) | 量程、自检与稳定读数区分 | 自检扫满不等于测量超限；定针滚带也要能读出真实终值 |
| [scroll-brake-moves](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/data/scroll-brake-moves.md) | 长范围经过后停在一个可解释目标 | 停点按内容确定，速度模糊落稳后消退 |
| [timeline-travel](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/data/timeline-travel.md) | 沿历史位置建立前后，再聚焦当前节点 | 真实时间间距与示意排布区分，不能用旅行速度证明发展速度 |

## 原创迁移练习：把资料选段整理成说明结构

在当前资料支持的前提下，先选出三个片段，逐项显示选择理由，再把片段表示迁入对应章节区域。复制原文时来源仍保留，抽取摘要时用来源标识维持对应；最终从动画状态切回清楚的说明结构供阅读。可采用平面连线、局部迁移或分屏核对，具体形态由文字量决定。该练习未实现。
