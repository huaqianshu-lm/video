# Claude Code 订阅套餐与计费视频化 · 第三步：Scene Script

> 目标：把 Video Narrative 拆成可制作的视频场景。每个 Scene 只承担一个主要认知任务，并明确声音、画面与视频表达价值。

## Scene 01｜账单为什么会失控

### sceneId
`scene-01`

### title
账单为什么会失控

### purpose
建立“Claude Code 成本不透明”的真实问题，提出“我到底在为什么付钱”。

### narrativeRole
开场冲突。

### narrationIntent
解释官方文档中的高额平均值和个人账单经历只是提醒，不是所有人的固定成本；引出需要理解计费逻辑。

### visualIntent
让一张看不懂的账单从总额拆出模型请求和上下文消耗。

### visualType
`OpeningScene`

### keyOnScreenText
```text
我到底在为什么付钱？
```

### videoValue
账单数字从模糊总额变成不断增长的请求轨迹，能快速制造“成本会失控”的直觉，静态定义无法替代这种变化。

### 信息分工
- 口播：建立问题和事实边界。
- 画面：表现账单增长和疑问。

## Scene 02｜Token：模型的计价单位

### sceneId
`scene-02`

### title
Token 到底怎么计费

### purpose
让观众理解费用和输入、输出、上下文之间的关系。

### narrativeRole
解释机制。

### narrationIntent
用出租车里程类比 token，并说明读大文件、长对话和扩展思考会增加处理量。

### visualIntent
把一条请求拆成 `Input`、`Context`、`Output` 三段计量带，随着内容增加同步增长。

### visualType
`ConceptScene`

### keyOnScreenText
```text
不是问了几次
而是每次带了多少上下文
```

### videoValue
token 的抽象计量通过“内容进入计价器”的动态过程变得可感知，帮助观众建立后续省钱动作的因果基础。

### 信息分工
- 口播：解释 token、输入、输出和上下文。
- 画面：演示不同内容如何增加计量。

## Scene 03｜三条付费路径

### sceneId
`scene-03`

### title
三条付费路径怎么选

### purpose
把按量计费、官方订阅和国产 Coding Plan 从价格比较题改成条件选择题。

### narrativeRole
展开选择。

### narrationIntent
说明三种方案的收费机制、适用人群和主要代价，不写死随时变化的金额。

### visualIntent
用三列卡片对比“官方原生、固定支出、国内成本／网络”，每张卡片同时显示一个风险标签。

### visualType
`ComparisonScene`

### keyOnScreenText
```text
按量计费
官方订阅
国产 Coding Plan
```

### videoValue
三列卡片根据用户条件亮起不同路径，表达“没有绝对最优解”，比静态表格更适合做选择判断。

### 信息分工
- 口播：说明选择条件和时效边界。
- 画面：建立三种路径的结构对比。

## Scene 04｜Coding Plan 的计费分流

### sceneId
`scene-04`

### title
买了套餐，为什么还会多一笔账单

### purpose
解释 Base URL 和专属 Key 配错会绕过 Coding Plan 额度的高风险陷阱。

### narrativeRole
制造风险并完成关键转折。

### narrationIntent
说明源文档中的火山方舟示例：`/api/coding` 与 `/api/v3` 可能对应不同计费路径；同时提醒 Key 也要使用套餐专属版本，具体以当前厂商资料为准。

### visualIntent
让同一请求从配置入口分流：正确路径进入套餐额度，错误路径进入按量账单，并在旁边标出 Key 校验。

### visualType
`TerminalScene`

### keyOnScreenText
```text
买了套餐 ≠ 一定走套餐
```

### videoValue
分流动画能直接证明配置错误如何改变钱的去向，这是文章文字描述不容易形成的空间直觉。

### 信息分工
- 口播：解释因果、示例性质和时效边界。
- 画面：证明 URL 和 Key 的错误会导致不同计费结果。

## Scene 05｜三个命令盯住用量

### sceneId
`scene-05`

### title
三个命令分别看什么

### purpose
建立 `/usage`、`/usage-credits`、`/status` 的职责边界。

### narrativeRole
从风险转向可观测的控制手段。

### narrationIntent
解释看明细、设上限、核配置分别由哪个命令承担，并提醒 `/usage` 金额只是本地估算。

### visualIntent
终端依次输入三个命令，右侧状态面板分别出现 Session、Limit、Status 三种结果。

### visualType
`TerminalScene`

### keyOnScreenText
```text
/usage
/usage-credits
/status
```

### videoValue
命令执行后状态区域发生不同变化，能让观众记住“一个命令对应一种控制目的”，而不是背孤立名称。

### 信息分工
- 口播：解释命令边界和账单权威来源。
- 画面：演示命令输入和结果类型。

## Scene 06｜少烧 token 的四个习惯

### sceneId
`scene-06`

### title
省钱不是只换便宜套餐

### purpose
把成本控制从“选更便宜的服务”转向“减少无效上下文和返工”。

### narrativeRole
提出方法论。

### narrationIntent
解释 `/clear`、Sonnet、plan mode 和具体提示分别减少陈旧上下文、过高模型成本、错误返工和无关扫描。

### visualIntent
四组坏习惯卡片被逐项替换成好习惯，背景中的上下文长度和返工次数同步缩短。

### visualType
`StepListScene`

### keyOnScreenText
```text
/clear
Sonnet
plan mode
具体提示
```

### videoValue
替换和收缩动作直接表现四个省钱杠杆如何减少成本，避免把方法变成没有节奏的文字清单。

### 信息分工
- 口播：解释每个习惯省在哪。
- 画面：表现上下文、模型档位和返工路径变化。

## Scene 07｜五分钟最小检查闭环

### sceneId
`scene-07`

### title
现在就建立用量感知

### purpose
把前面的机制、命令和习惯变成一套可以立刻执行的动作。

### narrativeRole
行动落地。

### narrationIntent
依次给出启动、`/status`、小任务、`/usage` 和官方 Pro／Max 的 `/usage-credits`；提醒 Coding Plan 用户到厂商控制台核对套餐额度。

### visualIntent
模拟终端清单逐项打勾，并把“配置基准”和“额度上限”分成两个不同状态。

### visualType
`StepListScene`

### keyOnScreenText
```text
/status → 小任务 → /usage → 设置上限
```

### videoValue
一条逐步完成的时间线能把知识压缩成记忆路径，观众可以按顺序复现，而不是只知道命令名称。

### 信息分工
- 口播：说明每一步的目的和适用范围。
- 画面：展示执行顺序和完成状态。

## Scene 08｜总结与下一集预告

### sceneId
`scene-08`

### title
把账、配置和上下文管起来

### purpose
收束本集核心结论，并明确承接下一集内容。

### narrativeRole
总结、系列承接。

### narrationIntent
总结“看懂 token、核对计费路径、控制上下文”，随后预告下一集 07「第一次使用：跑通第一个例子」。

### visualIntent
先出现三条总结卡片；总结卡片淡出后，独立的下一集预告卡片成为最后一个视觉事件，明确显示下一集标题和“跑通第一个真实项目”的期待。

### visualType
`SummaryScene`

### keyOnScreenText
```text
看懂计费
核对路径
控制上下文
```

最后视觉事件：

```text
下一集
07 第一次使用：跑通第一个例子
正式启动 Claude Code，跑通第一个真实项目
```

### videoValue
总结卡片的收束和预告卡片的切换形成明确的结束信号，下一集信息不会被底部字幕或总结内容遮挡；预告依据直接来自 Source 末尾。

### 信息分工
- 口播：先给本集结论，再用一句话完成下集预告。
- 画面：先总结，再独立展示下一集卡片，并保留足够阅读停留时间。

## Gate 1 内部审查

- 8 个 Scene 与 Narrative 的 8 个叙事段落一一对应。
- 每个 Scene 均具备 `sceneId`、`title`、`purpose`、`narrativeRole`、`narrationIntent`、`visualIntent`、`visualType`、`keyOnScreenText` 和 `videoValue`。
- Source 的核心内容均有去处：计费机制在 Scene 02，三条路径在 Scene 03，配置陷阱在 Scene 04，三个命令在 Scene 05，省钱动作在 Scene 06，三步实践在 Scene 07。
- 画面与口播分工清晰：口播承担解释，终端、分流、对比和状态变化承担证明。
- Scene 08 已包含独立的最后视觉事件“下集预告”，后续必须同步写入口播稿、视觉脚本、原型、TTS、字幕和时间轴。
- 现有六类通用场景足以表达本片，不新增场景组件。

