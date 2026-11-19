# Shotcraft 与 OpenMontage：从可见成果研究导演设计

研究重点是画面如何成立：主体、关键状态、视线、材质、运动及段落衔接。工具架构相同不是收录条件。下列来源的卡片正文、官方方法与样片画面分别标明；设计迁移见 [镜头设计推导](../shot-design-recipes.md)，不移植上游实现。

本页是对标成果与来源的研究入口，不代替具体镜头设计。首批细节解析见 [标题变节标签](title-to-section-label.md)、[界面拆层与复合](exploded-interface-layers.md)、[列表迁入画布](list-to-canvas-transfer.md)。三例补充定点抽帧核对，分别保留原卡参数、画面证据和制作推导；其余来源仍未完成同等深度的拆解，正常速度观看与原创迁移验收也未完成。

**观察边界**：Shotcraft 初轮六段官方 Gallery 样片及 OpenMontage 两部官方作品，已查看每段最多十二张等间隔抽帧；续查四段 Shotcraft 样片，每段按十六个等间隔位置采样并查看联系图。OpenMontage 产品片另查看了四个较大画面。抽帧支持构图、形态和关键状态判断，不能代替正常速度下的运动与声音判断，也可能漏掉短暂穿帮。下列方法没有在本项目实际视频中完成迁移验收。

Shotcraft 的该版本参考正文已按目录逐篇研究：一百二十四份镜头文档及十一份综合、来源和工具说明。镜头方法分别进入 [机位](../camera-and-staging.md)、[动态文字](../kinetic-typography.md)、[界面与数据](../interface-and-data-motion.md)、[光与介质](../light-and-graphic-effects.md)、[运动与转场](../motion-and-transitions.md)、[段落与声音](../sequence-and-sound.md)，各表保留逐项来源及迁移限制。工具说明的阅读不表示引入其导出、工作台或发布能力；文档覆盖也不表示全部动态样片已经观看。

## １．video-shotcraft：有主体和收束的完整动作

来源版本：[video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft/tree/5a2e98daade313c4f376120f38427eb19a108e8c)；[Gallery](https://vincentwei1021.github.io/video-shotcraft/)；[卡片来源说明](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/ATTRIBUTION.md)。

作者说明，其中一批卡来自公开产品短片、设计师作品、Anime.js 与 Remotion Bits 等站点的手法研究，并独立重写；另有真实制作返修经验。部分来源只留账号与作品描述，没有精确帖子地址，不能当成已经逐条核实的原片来源。具体卡片的成熟度也不同，有的明确标注仍需真实素材回验。

### 六段样片的可见设计

| 场景与来源 | 抽帧可见的关键变化 | 可迁移的设计关系 | 需要重新设计的地方 |
|---|---|---|---|
| [聚焦单主体卡片](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/opening/spotlight-hero-card.md)／[样片](https://vincentwei1021.github.io/video-shotcraft/media/spotlight-hero-card.mp4) | 光池在页面内定位；转入斜侧主体近景；左侧注记、右侧卡片；末段主体回近页面，背景仍保留身份 | 定位、检视、归属组成一条动作弧；附属说明有预留空间 | 正文是否需要正面阅读；何时需要光、何时只需裁切；不要把所有教程对象都做成聚光卡片 |
| [分解与合体](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/camera/space-camera-moves.md)／[样片](https://vincentwei1021.github.io/video-shotcraft/media/exploded-view.mp4) | 斜置完整页面变为分离构件；两侧引线解释；标注撤走后整体恢复 | 展开时仍能辨认原位与组合关系；标注避开主体 | 软件执行依赖与真实层叠不同；层数、朝向、视角取决于当前结构 |
| [结果逐步形成](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/ui-entrance/product-card-progressive-assemble.md)／[样片](https://vincentwei1021.github.io/video-shotcraft/media/product-card-progressive-assemble.mp4) | 骨架内依次形成图、标题、标签、数值与正文；中间有旧值降级、新值接管；末段完整结果稳定 | 信息分组决定动作分组，关键语义变化区别于普通显露 | 商品价格与品牌只是原示例内容；教程要重新确定来源、字段结构和真实变化 |
| [前后滑杆比较](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/data/before-after-slider-scrub.md)／[样片](https://vincentwei1021.github.io/video-shotcraft/media/before-after-slider-scrub.mp4) | 同布局页面随分割杆揭出另一版本，结尾保留两版区域 | 相同参照减少记忆负担，揭示边界承担比较 | 原示例的灰蒙处理只可解释演示效果，不可作为故意弱化对照对象的依据 |
| [参数驱动布局](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/interaction/autolayout-gap-dial.md)／[样片](https://vincentwei1021.github.io/video-shotcraft/media/autolayout-gap-dial.mp4) | 读数、间距标注与导航块的松紧同步呈现不同状态，最后恢复基准 | 数值、几何与测量共享一个控制量；固定参照让变化可比较 | 弹性只用于合适的表现层，不允许制造不合法的业务值；教程未必需要大读数 |
| [输入后筛选](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/interaction/type-and-filter.md)／[样片](https://vincentwei1021.github.io/video-shotcraft/media/type-and-filter.mp4) | 近处输入、回到集合视野、候选收敛、目标获得焦点 | 观看范围依次服务输入、集合变化和单项查看 | 样片很短，不能照用其速度；筛选理由是否可见要由教程另行展开 |

卡片中的光照、阴影、投影锚点、缓动与遮挡安排，支持对作者设计意图的理解；抽帧不足以独立确认它们在全速播放中全部成立。样片的无音轨状态也不能作为声音设计已验证的证据。

### 续查四段样片：标题、证据和形态的交接

下面为实际查看抽帧所得，不是对正文的重复转述。四段媒体均含视频流、未检测到音轨；仍不能以此替代动态观察。

| 官方样片 | 抽帧可见的状态 | 可迁移判断与边界 |
|---|---|---|
| [title-demote-to-label](https://vincentwei1021.github.io/video-shotcraft/media/title-demote-to-label.mp4) | 第一节大标题转成左上短标签，三块内容随后形成；第二节先有选区色块，之后新标签接位、旧标签上移退为次级 | 标题身份保留但层级改变；中文标签需重新设计宽度和路径。抽帧未充分捕获全部中间位置，连续手感仍待全速观察 |
| [word-relay-filmstrip](https://vincentwei1021.github.io/video-shotcraft/media/word-relay-filmstrip.mp4) | 左侧当前证据页依次为分镜、终端、评审页，右侧主体名保持，动词随页更换；邻页退暗虚化，当前图文中心相应对齐 | 换词与证据对应可组织论述；低清缩略只观察版式，不据此评价正文小字清晰度或逐帧零重影 |
| [panel-to-canvas](https://vincentwei1021.github.io/video-shotcraft/media/panel-to-canvas.mp4) | 右侧列表逐项选中，按钮给出选择数；内容向左侧画布形成三张卡，来源位置变为已上板提示，末态两侧保留对应关系 | 样片实际来源在右、目的地在左，不能凭卡名或正文示意猜方向；原位反馈区分已迁入与未选内容，并不要求来源整行物理删除 |
| [line-carry-transition](https://vincentwei1021.github.io/video-shotcraft/media/line-carry-transition.mp4) | 进度达到完成态，原线延伸，观察范围向右改变；线拐弯后组成新画框，框内海报随后形成 | 已有构件承担新职责可保持身份；抽帧可见首尾关系，不能单独证明运动全程速度连续或没有隐藏切点 |

这些是同一作者舞台中的演示。迁移时学习阅读顺序、对象身份、锚点和结果对应，重新设计本视频的内容与视觉语言，不整套照用纸色、版式、字标及海报。

### 声音如何与形体配合

[作者声音文档](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/sound-design.md)将移动、接触、纸、玻璃、机械与光效区分。可迁移为：先定义画面发生什么，再决定声音是否强化它；位移的持续声、接触瞬间与落定余韵各有职责。不是每次出现都要响，也不把品牌短片重击密度套进口播正文。未试听其音效，不评价具体音色。

## ２．OpenMontage：按内容选择画面媒介和解释方式

来源版本：[OpenMontage](https://github.com/calesthio/OpenMontage/tree/195eab24478dc9363326aec437aefc3701635ddf)；[官网展示](https://www.openmontage.video/)；[官方作品与制作说明](https://github.com/calesthio/OpenMontage/blob/195eab24478dc9363326aec437aefc3701635ddf/README.md)。

官方展示包含实拍素材剪辑、代码图形、三维动画和生成视频等不同形式。部分成片质感依赖 Blender、生成运动素材或真实影像；不能将效果归因于一份提示词，也不能声称增加几段 CSS 即可覆盖所有能力。

### 两部作品的可见画面

| 作品与官方媒体 | 已查看的画面 | 可提取的方法与边界 |
|---|---|---|
| [Products Come to Life](https://github.com/user-attachments/assets/c947070c-95ee-4d73-8d76-0bd3dc4826eb) | 深色环境中的头显、电脑、耳机及键盘；完整物体、部件分离和复合状态；上方偏冷受光、后侧暖色亮区、下方地面反射，材质各有区别 | 主体轮廓、硬软材质、接触和反射共同形成实体感；多个主体共享光照语言仍保留形体差异。作者说明使用图生视频，不能把片中内部构件当成真实工程结构证据，也不能据抽帧认定变形全程无瑕疵 |
| [How Salt Made History](https://github.com/user-attachments/assets/a524f02a-2d18-42ca-a2c4-d3dc09503546) | 实物纹理、道路与生产环境影像，交替出现的暗底大字、地图及时间线，结尾回到简短论点；跨媒介仍保持偏暖白文字和克制强调 | 影像提供情境，地图解释空间，时间线组织先后，短词定位段落。视觉统一来自文字与色彩角色，不是所有段落都套卡片。这里研究画面分工，不核验或采用原片历史论断 |

第二部作品提示另一种教程设计：具体对象／真实界面负责展示“看到了什么”，必要图解负责解释“关系是什么”，二者有明确的观看交接。生成素材可以表现氛围或比喻，真实操作、数据、结构和结果仍须有当前内容依据。

### 画面解释资料中可用的部分

| 具体资料 | 作者给出的方法 | 对教程的迁移判断 |
|---|---|---|
| [视觉解释技法](https://github.com/calesthio/OpenMontage/blob/195eab24478dc9363326aec437aefc3701635ddf/.agents/skills/manim-composer/references/visual-techniques.md) | 复杂关系渐进建立，相关表示保留连续性，颜色承担语义，局部与整体建立空间关系 | 可用来设计字段变为参数、局部推导回到整体；与内容没有映射的两物不强行变形 |
| [解释叙事](https://github.com/calesthio/OpenMontage/blob/195eab24478dc9363326aec437aefc3701635ddf/.agents/skills/manim-composer/references/narrative-patterns.md) | 两种视角汇合、具体例子走向一般关系、简单单元组合出整体 | 给重点解释安排可见的发现过程；不照抄它的固定时长与情绪曲线 |
| [单主体界面展示蓝图](https://github.com/calesthio/OpenMontage/blob/195eab24478dc9363326aec437aefc3701635ddf/.agents/skills/hyperframes-animation/blueprints/device-surface-showcase.md) | 同一界面主体经历状态变化，静态展示、局部推近和连续机动为不同变体 | 观看方式随阅读任务选择；需要看清操作时，相机可以停止，不必一直前推 |
| [动效词汇](https://github.com/calesthio/OpenMontage/blob/195eab24478dc9363326aec437aefc3701635ddf/.agents/skills/motion-graphics/references/motion-vocabulary.md) | 将进入、强调、退出与图形强调分开，动作有适合的表达气质 | 能补充不同动词；选择依据仍是对象与关系，不能按词表拼盘 |

**需要保留判断的部分**：[构图文档](https://github.com/calesthio/OpenMontage/blob/195eab24478dc9363326aec437aefc3701635ddf/.agents/skills/hyperframes-creative/references/video-composition.md)包含固定元素数量、多个焦点、持续装饰运动等强偏好。这些不进入本项目的通用规则。可吸收的是按视频尺寸重审文字与结构的可见性；画面密度、焦点和静置仍由理解任务决定。不同风格也可以有纯色背景和充分留白。

## ３．继续向官方设计与动画资料学习

以下已核对正文，未操作网页演示或完整观看嵌入视频。它们提供特定问题的解释依据，不作为已验成片。

| 官方来源 | 可用的具体方法 | 用到画面里时要做的判断 |
|---|---|---|
| [Material：动作编排](https://m1.material.io/motion/choreography.html) | 共享元素维持焦点，多项保留时只突出必要对象，其他内容依附共同运动 | 先找真正连续的对象，再选择转场；无关联不强造共享元素。这是旧版 UI 设计资料，取关系方法，不采用旧版参数 |
| [Material：高度与阴影](https://m1.material.io/material-design/elevation-shadows.html) | 通过表面距离、遮挡与阴影表达空间关系 | 升起、贴合与落下需要相应接触线索；图解层次不必伪装真实物理高度 |
| [School of Motion：预备动作](https://schoolofmotion.com/blog/anticipation-principle-quick-tip) | 主动作之前建立预期，把注意力引到将发生变化的位置 | 可用转向、短暂收拢或视线提示；精确数值演示不为蓄力而伪造数值变化 |
| [School of Motion：跟随与收尾](https://schoolofmotion.com/blog/animation-tricks-follow-through-after-effects) | 主体停止与附属部分停止可以有先后，运动性格来自受力与惯性关系 | 纸张、软体、机械各自不同；阅读文字不随装饰余振持续晃动 |
| [Anime.js：错峰分布](https://animejs.com/documentation/utilities/stagger/) | 顺序、距离和不同属性可以共同决定多目标变化 | 按分组或空间关系分配时机，避免所有列表等间隔点名；只取编排关系，仍用当前确定性帧时间实现 |
| [Remotion Bits](https://remotion-bits.dev/) | 文字分组与位置、清晰度、尺度等属性组合 | 动态短标题与长段正文分别处理；API 存在不代表实际中文字形已验证，不为学习新增依赖 |
| [Ordinary Folk：设计过程](https://www.ordinaryfolk.co/process) | 先决定视觉媒介与造型，运动细节赋予对象性格，声音与设计共同考虑 | 不以先挑动效代替主体设计；也不新增一套生产流程 |
| [Ordinary Folk：Introducing Spline](https://www.ordinaryfolk.co/project/introducing-spline)／[BUCK：IBM Sustainability](https://buck.co/work/ibm-sustainability) | 前者公开风格帧与制作分工，后者说明如何从单一圆形语言扩展微观与宏观表达 | 风格统一可以来自形体和关系，不依赖统一卡片容器；原片观察范围见 [外部案例](external-motion-design.md) |

## ４．把质量目标落到可见差异

对标应该比较画面能力，而不是工具名、卡片数量或代码量。下表是设计诊断方向，不是新的量化规范或额外审核表。

| 维度 | 常见不足 | 值得追求的可见差异 |
|---|---|---|
| 主体 | 通用卡片只换标题 | 轮廓、内部结构和操作位置能解释对象身份 |
| 构图 | 内容平均摊开，始终同一中心堆叠 | 当前任务有清晰的观看入口、关系与结论空间 |
| 材质 | 统一渐变、玻璃和外晕 | 表面、受光、遮挡与接触共同成立，文字仍清楚 |
| 运动 | 所有物体同方向淡入 | 定位、操纵、变化、制动、收束各有内容理由 |
| 连续性 | 每段像新页面，或所有旧物一直常驻 | 有用的身份和空间记忆保留，完成任务的对象及时退出 |
| 节奏 | 均匀点名或持续亢奋 | 关键变化获得展开，解释与阅读有安静阶段 |
| 声画 | 任意叠 whoosh 和鼓点冲击 | 声音强化具体动作及材质，口播与阅读不被抢占 |

相同内容、相同时间依据下的原创实现，经过完整正常速度观看、试听与用户判断后，才有依据评价是否接近这些成果。阅读资料和静帧分析只完成设计知识的准备。
