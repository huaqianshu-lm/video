# 动态文字与阅读顺序

动态文字负责安排“先读谁、何时理解、什么保留”。本页从 Shotcraft 的文字资料提炼设计关系，未移植其实现；来源表覆盖该版本的全部文字类文档。文案、字号、时长和强调依据当前视频重新设计，参数默认值仍查质量规范。

需要设计完整镜头时，选读 [大标题连续变为节标签](examples/title-to-section-label.md)：对照准确 demo、视觉实现与样片，展开字体造型、负空间、正文关系接棒和“按需展开”原创设计，并保留显露、站稳、缩移锚点、内容遮罩、选区与下一节接替的实现关系。含可观察判据；原创实现及正常速度观看待验。本页其余来源归纳不等于已有同等深度的案例解析。

## 文字承担哪一种变化

| 当前需要 | 适合研究 | 结束时应看见 |
|---|---|---|
| 建立一句话 | 按语义分组揭示，位置、清晰度协调收敛 | 完整、稳定、可读的句子 |
| 展开同一句式的多个实例 | 固定句干，替换一个槽位 | 观众能记住哪些词是实例、哪句是结论 |
| 从主张进入讲解 | 主标题转换为短节标签，内容接管 | 主题身份保留，阅读重心已改变 |
| 强调已读信息 | 下划线、局部色块、字重或短促材质变化 | 强调与原句的语义关系明确 |
| 逐步揭晓一个已知词 | 笔画建立或字符归位 | 可识别瞬间之后有完整阅读时间 |
| 用文字组织证据 | 主张换词与对应图像同步交接 | 每个词都有对应画面依据 |

文字入场不是每句话必有的表演。解释较长、结构较复杂时，直接呈现稳定排版通常更便于理解。

## 支点、槽位与字形

缩放中的短语若同时移动，应明确固定哪一点：首词中心、左边缘或基线。先测最终字体与排版，再连接起终态；不要靠估算字宽掩盖偏移。位置不动的句干和定宽槽位有助于持续阅读；确实要表现“新词把句子撑开”时才采用自适应宽度，并让整句重心变化可控。

中文按语义分组，不能照搬空格分词，也不默认逐字飞入。中文字体的字面、标点、换行和字重变化都要重新核对。单线书写、字体轮廓描画和遮罩显露是不同效果；需要笔画生长时，轮廓描边不能冒充书写顺序。

## 四种可展开的设计关系

### 同一句式的实例轮换

先给完整句式，再只替换变量。旧词退出可读区后，新词进入；保留足够时间读完每个实例，末项若为结论应与前面的实例有依据的层级差。固定槽、弹性胶囊、裸词滚轮分别体现稳定、徽章或机械选择，按语义选择一种，不混成特效拼盘。

### 标题让位给内容

标题先完成宣告，再连续改变尺度与位置，最终成为仍可阅读的短标签。内容可在不争抢焦点的位置开始建立；依赖说明要等标题交接清楚。下一章到来时旧标签让位或明确退出，避免角落累积。长句应重新提炼短标签，不能缩成一条细线。

### 主张和证据接力

固定主体名，当前动词与当前证据画面对应。切词时证据换位，停留时让它稳定供观看；图文用共同对齐线或连接关系对应。持续自动滚图不能替代证据交接。没有明确对应时，宁可单独解释一个实例。

### 强调发生在理解之后

先让标题或数据站稳，再用局部笔触强调真正的关键词。笔触的形状、边缘、方向和介质相符：纸面墨迹、显示屏光效、机械符号各有不同语言。整句都变色、每词都发光会抹掉重点。和旁白逐词同步只在有词级证据时采用；没有证据就按现有字幕及语义段呈现。

## 来源与迁移判断

| 来源资料 | 提炼的方法 | 适用边界或失败修正 |
|---|---|---|
| [blur-slide](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/typography/blur-slide.md) | 同组文字协调合焦，主副层级可由位移幅度区分 | 主副同场不等于同时争抢；不能升级为所有标题默认模糊 |
| [brace-expand](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/typography/brace-expand.md) | 符号边界实际控制内容揭示 | 符号须与内容语义相关；文字揭示不能脱离括号内缘 |
| [countdown-arc-scatter](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/typography/countdown-arc-scatter.md) | 读数保留身份，进入标题成为句子一部分 | 示意数列不是性能证据；保留真实量程和单位 |
| [document-typewriter-reveal](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/typography/document-typewriter-reveal.md) | 正文、侧栏与历史信息按职责建立 | 光标只对应正在写的位置；密集正文不强求短镜读完 |
| [flying-words](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/typography/flying-words.md) | 关键词沿深度分布，中心留给前景阅读 | 氛围词云不承担完整清单或真实数量说明 |
| [glitch-cycle](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/typography/glitch-cycle.md) | 单槽位状态轮换，切换阶段与稳定阶段有区别 | 故障风格须合语境；最终文字清楚，不伪造系统进度 |
| [gradient-word-sweep](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/typography/gradient-word-sweep.md) | 通过局部波前区分强调发生处与完成处 | 强调限于有意义的词；光晕不盖住字形 |
| [lead-word-zoom-assemble](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/typography/lead-word-zoom-assemble.md) | 首词先建立，再归入完整语句；基线支点维持稳定 | 最终句宽与首词位置需实测，不让缩放造成基线漂移 |
| [marker-underline-title](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/typography/marker-underline-title.md) | 已读关键词之后追加带介质感的强调笔触 | 线贴近字形且不碰笔画；慢扫不可误像进度条 |
| [outline-word-fill](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/typography/outline-word-fill.md) | 准备与确认采用不同的视觉状态 | 强调短词可用；原作对比读数不迁移为本视频事实 |
| [paper-title-card](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/typography/paper-title-card.md) | 章间短句降低密度并定位下一表达 | 不把同一句主张反复插播；纸墨不是固定风格 |
| [pill-chip-slot-cycle-handled](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/typography/pill-chip-slot-cycle-handled.md) | 可变词宽推动句子两侧，让变量具有分量 | 字体加载后测宽；长短差过大时改用固定槽 |
| [pill-slot-cycle](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/typography/pill-slot-cycle.md) | 句干固定，实例轮换后补成结论 | 句干不随内容重排，结论仍属于同一句话 |
| [text-column-converge](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/typography/text-column-converge.md) | 稳定对置之后的一次合拢形成揭晓 | 无揭晓关系时不硬套；原示例小字号须按本项目重审 |
| [title-demote-to-label](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/typography/title-demote-to-label.md) | 标题保留身份但降低层级，内容接管 | 标签仍可读；多章替换不堆积 |
| [type-assembly-moves](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/typography/type-assembly-moves.md) | 裂升、漂移归位、沿语义路径行进表达不同性格 | 路径文字按实际字宽排，不让字符追越挤成团 |
| [type-entrance-moves](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/typography/type-entrance-moves.md) | 接触、衰减与最终对齐建立文字的身体感 | 风格需允许趣味表演；字形下伸部与落地线单独核对 |
| [type-rhythm-sync](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/typography/type-rhythm-sync.md) | 在场文字可用字重或颜色回应声音 | 最粗字重不挤压邻字；跟读须真实词级证据 |
| [typewriter-moves](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/typography/typewriter-moves.md) | 输入、犹豫、删除和修正可组成叙事 | 教程真实输入不为戏剧性伪造错误；光标随当前行为改变 |
| [vertical-word-roll-blur-cycle](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/typography/vertical-word-roll-blur-cycle.md) | 中心清晰与邻项衰减建立滚轮选择感 | 停靠与阅读分开预算；槽宽容纳中文最长词组 |
| [word-relay-filmstrip](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/typography/word-relay-filmstrip.md) | 主张换词与证据步进互相对应 | 新旧词避免交叠成错词，图文中线保持对应 |
| [word-relay-geometry](https://github.com/Vincentwei1021/video-shotcraft/blob/5a2e98daade313c4f376120f38427eb19a108e8c/references/shots/typography/word-relay-geometry.md) | 不同动词可以有对应的几何行为 | 几何是比喻，不能冒充性能论证；结论的强调要有内容依据 |

## 原创迁移练习：同一操作的三种作用

当资料确实支持三个用途时，先建立共同操作名，再依次替换作用词，每次同时展示对应结果局部；共同操作名留在原位。三个结果需要比较时，末段改成稳定并列，不继续滚轮。这样学习的是句式、证据和注意力的关系，而非复制品牌标语与字体造型。该练习未实现。
