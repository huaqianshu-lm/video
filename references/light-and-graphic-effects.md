# 光、介质与图形反馈

本页从 Shotcraft 效果类文档提炼视觉方法，尚未在本项目实际画面验收。先确定正在表达的对象、状态与介质，再选择光和图形；不以效果数量、亮度或震动幅度衡量质感。所有来源参数保留在原资料中，不成为本项目默认值。

纸墨风格的完整字标设计见 [品牌墨迹开场](techniques/light-and-material/brand-ink-open.md)：区分图形压印与真实材质、短划与反射，展开字形／字距／负空间、占位、逐字压落、光标与静止口径、末帧残留及中文教程原创接棒。它负责身份建立，不能替代真实内容镜头，也不能把上游参数当成统一片头规范。

## 光承担什么职责

单主体的详细设计见 [聚光主体展示](techniques/subject-and-composition/spotlight-hero-card.md)：分开屏幕空间的寻光、页面空间的卡形软孔、表面受光、边缘光与体积光；列出遮罩交接、注记合成、简化阴影和尾部残留的具体限制，并用原创任务条目镜头连接实际解释与操作。

| 职责 | 可观察变化 | 保持成立的条件 |
|---|---|---|
| 引导视线 | 重点区域从环境中获得辨识度 | 主体内部仍能读，周边保留必要位置线索 |
| 解释材质 | 高光随表面朝向和光源关系变化 | 高光依附表面，不是固定白条横扫 |
| 表现处理状态 | 扫描位置与当前检查或形成区域对应 | 到达、确认和结果有依据，不假造执行事实 |
| 表现信号抵达 | 路径端点响应，环境可辅助反馈 | 起点、终点和方向正确，非全屏一起闪 |
| 组织段落 | 色彩或明暗变化标记章节转折 | 文案与画面交接清楚，亮度不破坏阅读 |

同样一条扫线可以表示观察、施工、连接或纯装饰，含义由对象关系决定。没有可解释对象时，先重做画面设计，再决定是否需要扫线。

## 四类可以迁移的设计

### 扫描与结果出现

“检查已存在的对象”可以让对象稳定，扫描经过后建立标注；“结构正在形成”可以先给槽位，再让对应内容在扫描到达时完成。触发时刻从对象边界与扫描路径求得，不另写一套碰巧接近的时间表。标签、计数和完成状态对应实际结果。教程如只是在示意分析，表达范围应与材料一致，不模拟未经证实的内部算法。

### 材质与环境互相解释

光照在主体之外也应留下合适的线索：纸上墨色叠合、金属窄高光、玻璃后的透色、发光物附近的受光。线索共同服务材质辨认，数量并非越多越好。浅底可用加深、局部色差和边缘变化，暗底可用受光与亮度；同一套数值不能跨背景直接使用。

光效的裁切取决于身份：反射在表面内，发光可以向外溢，投影落在支撑面上。把所有光都裁进同一矩形，或让所有光无边界扩散，都可能产生错误空间。

### 反馈不是全屏抖动

先让实际对象发生变化，再用局部反馈帮助确认。要表现受力传播，接收对象应先稳定，按传播到达时刻响应；一起晃动只能说明整画面在动。震屏、负片、集中线和颗粒属于强风格选择，需符合当前内容，不默认用于教程。

### 特效何时结束

扩散距离与消散强度可以有不同过程，避免“刚出现就没了”。扫光完成、标签落稳或主体接管后，临时效果应结束。检查最后一个对象与最后一层效果，防止末帧仍在扫描、漂移、随机闪烁。移除效果层前后，主体位置、颜色和清晰度保持连续；不把上游所有效果残留都当成同一种技术根因。

## 来源与迁移判断

| 来源资料 | 学习的视觉关系 | 迁移边界与失败修正 |
|---|---|---|
| [assemble-then-type-flyin](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/effects/assemble-then-type-flyin.md) | 先结构后语义，阶段变化由信息职责支持 | 不默认所有中文逐字旋转；末块有足够阅读时间 |
| [aurora-bloom-bg-flip](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/effects/aurora-bloom-bg-flip.md) | 环境酝酿后变化，旧新句交接形成转折 | 清理浅底专用光层，避免暗场灰雾与两句重影 |
| [brand-frame-snap](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/effects/brand-frame-snap.md) | 包装颜色、内容模式和标签同步编码 | 不压缩主体空间；颜色含义跨镜保持一致 |
| [fui-hud-moves](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/effects/fui-hud-moves.md) | 框选建立注意目标，锁定后再解释 | 角标不挡信息，也不把普通页面包装成虚构侦测系统 |
| [glow-flyline-moves](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/effects/glow-flyline-moves.md) | 路径、接收节点与环境反馈围绕同次抵达 | 连线不替代因果证据，漂移停止要自然 |
| [icon-performance-moves](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/effects/icon-performance-moves.md) | 图标作为有行为的主体，引出后续内容 | 递增跳动需有叙事用途，不能让小装饰反复求关注 |
| [impact-feedback](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/effects/impact-feedback.md) | 命中、反馈与恢复的时间差塑造冲量 | 游戏式连击和负片不是教程默认；不叠多套时间重映射 |
| [light-play-moves](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/effects/light-play-moves.md) | 揭示文字的光与表现材质的高光职责不同 | 主体转向与反射对应；光离开后要能读完整内容 |
| [radial-ripple-phone-chips](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/effects/radial-ripple-phone-chips.md) | 主体、环境和功能标签各自分工 | 屏内内容与标签可读，环境不必持续呼吸 |
| [riso-print-hits](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/effects/riso-print-hits.md) | 同样的错位反馈可由印刷介质重新解释 | 墨色叠合区别于屏幕色散，效果局限于有意义的主体 |
| [scan-bracket-sweep](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/effects/scan-bracket-sweep.md) | 稳定对象与移动检查区域分工 | 尾迹跟随方向及速度，转向不突然跳到前面 |
| [scanline-annotate-focus](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/effects/scanline-annotate-focus.md) | 对象被经过之后获得命名与局部解释 | 标签触发取决于边界，标注颜色区别于原页面语义 |
| [scanline-assemble-flyin](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/effects/scanline-assemble-flyin.md) | 空槽、到达和装配完成相互对应 | 是施工示意还是实际过程先明确，不能先报完成后补组件 |
| [slam-entrance-moves](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/effects/slam-entrance-moves.md) | 方向、重量和传播是不同强调任务 | 选需要表达的一种，避免所有冲击效果一起堆 |
| [spotlight-sweep-moves](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/effects/spotlight-sweep-moves.md) | 光决定局部出现与退场，可构成观看路径 | 光的坐标依附界面；扩张终值应匹配最远边界 |

## 原创迁移练习：同一结果的三种视觉语言

对同一个有依据的“检查完成”结果，可分别研究纸面勾注、界面状态变化和简洁几何定位。三者都保持检查对象、完成依据和结果文字一致，只改变介质表达。先比较是否更容易辨认和理解，再看质感；不要同时改内容、机位、配色和动作后，把差异全部归功于某个光效。该练习未实现。
