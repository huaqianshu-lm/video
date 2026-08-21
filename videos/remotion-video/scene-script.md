# Remotion 视频化 · 第三步：Scene Script

> 目标：把 Video Narrative 拆成 12 个可制作的视觉事件。每幕只承担一个主要认知任务；命令只作为文章中的屏幕内容，不执行。

## Scene 01｜视频也可以写

### 目的
用“每个用户一条年度总结视频”的批量场景制造问题，让观众先理解手工剪辑为什么会在数量上失效。

### narrativeRole
开场钩子：从真实产能问题引出程序化视频。

### narrationIntent
解释同一模板换数据可以产生大量不同视频，手工逐条剪辑会失去效率。

### visualIntent
展示一个模板被不同数据填充并连续生成多个版本，让“参数化”先于术语出现。

### visualType
`Process + Data Visualization`

### keyOnScreenText
```text
同一模板
不同数据
几千条视频
```

### videoValue
数量从 1 变成多个的动态变化，能直接证明批量复用为什么是视频代码的价值。

### 信息分工
- **声音**：提出批量视频的实际问题。
- **画面**：展示模板不变、数据变化、输出增加。

## Scene 02｜一帧一帧的翻页书

### 目的
用最小直觉解释 Remotion 的核心模型。

### narrativeRole
概念建立：从“代码做视频”的反直觉进入“帧序列”。

### narrationIntent
解释每一页是静止画面，快速连续翻动后才形成动作；Remotion 用代码计算每一页。

### visualIntent
展示第 0、30、60 帧上的同一文字从屏外到中央，再连接成连续运动。

### visualType
`Concept Diagram + Motion Study`

### keyOnScreenText
```text
第 0 帧
第 30 帧
第 60 帧
React 画面
```

### videoValue
只有连续的帧变化能让观众同时看到“静止页面”和“运动结果”的关系。

### 信息分工
- **声音**：给出翻页书类比和 Remotion 定义。
- **画面**：让帧的位置和画面变化可见。

## Scene 03｜剪辑、模板、代码三条路

### 目的
明确 Remotion 的生态位，避免观众误以为它是剪辑软件的全面替代。

### narrativeRole
边界对比：说明什么问题适合哪种工具。

### narrationIntent
对比剪辑软件、在线模板和 Remotion 的做法、强项和限制。

### visualIntent
三条路径分别接入“实拍素材”“现成模板”“参数化代码”，最后突出精确、批量、可复用。

### visualType
`Comparison`

### keyOnScreenText
```text
剪辑软件
在线模板
Remotion
精确 · 批量 · 可复用
```

### videoValue
并排路径和结果标签能快速表达工具边界，避免用一段口播平铺三张定义卡。

### 信息分工
- **声音**：解释三种工具的适用范围。
- **画面**：用路径和结果标签完成比较。

## Scene 04｜框架提供可能，Claude 负责动手

### 目的
解释 Remotion 和 Claude Code 的分工，并纠正“Claude Code 自己会做视频”的误解。

### narrativeRole
组合关系：从工具生态位转入协作方式。

### narrationIntent
说明 Remotion 把视频变成 React 代码，Claude Code 把自然语言需求转成代码；人负责审美和拍板。

### visualIntent
让“自然语言需求”经过 Claude Code 进入 React／Remotion，再变成预览画面；旁边保留人的判断节点。

### visualType
`Connection Diagram + Task Routing`

### keyOnScreenText
```text
自然语言需求
Claude Code
React / Remotion
预览
人：审美与拍板
```

### videoValue
动态连线能把“框架”和“协作者”的职责边界建立成一条可回看的路径。

### 信息分工
- **声音**：解释两者不是同一个产品能力。
- **画面**：演示需求、代码和预览之间的转换。

## Scene 05｜帧与时间

### 目的
让观众看懂 `frame`、`fps` 和 `durationInFrames` 的关系。

### narrativeRole
概念拆解：进入 Remotion 代码的第一个阅读入口。

### narrationIntent
解释当前帧、帧率和总帧数；用 6 秒、30fps、180 帧建立具体换算。

### visualIntent
时间轴从 0 走到 180，标出 30fps 和 6 秒的对应关系。

### visualType
`Timeline Diagram`

### keyOnScreenText
```text
总帧数 = 秒数 × fps
6 秒 × 30fps = 180 帧
useCurrentFrame()
```

### videoValue
帧数移动和公式同步出现，比单独朗读 API 名称更容易形成时间直觉。

### 信息分工
- **声音**：解释帧是翻页书的一页。
- **画面**：展示时间和帧数如何对应。

## Scene 06｜插值与弹性

### 目的
用一个平滑变化和一个回弹变化解释两个常见动画函数。

### narrativeRole
概念落地：从“第几帧”继续到“这一帧该长什么样”。

### narrationIntent
解释 `interpolate()` 负责 A 到 B 的过渡，`spring()` 负责有弹性的运动。

### visualIntent
左侧让透明度从 0 变 1，右侧让 Logo 从小变大并轻微回弹；函数名随动作出现。

### visualType
`Motion Study + Code Annotation`

### keyOnScreenText
```text
interpolate()
A → B
spring()
弹一下，稳住
```

### videoValue
运动本身就是概念的证明，不能用一张静态代码卡替代。

### 信息分工
- **声音**：用人话说明两个函数的感觉。
- **画面**：展示平滑和弹性的差异。

## Scene 07｜从空目录到预览闭环

### 目的
给出从环境到输出的流程全景，但保留预览反馈的回路。

### narrativeRole
流程总览：把概念转为可执行的工作模型。

### narrationIntent
依次讲 Node.js 18+、描述需求、生成代码、预览、反馈修改和最后渲染。

### visualIntent
六个状态依次亮起，预览和反馈之间用回环箭头连接，渲染放在终点。

### visualType
`Process Diagram`

### keyOnScreenText
```text
Node.js 18+
描述需求
生成代码
预览
反馈修改
最后渲染
```

### videoValue
流程的顺序、返回和终点用动画表达，能避免观众把渲染误解成第一步。

### 信息分工
- **声音**：解释每一步的职责。
- **画面**：展示流程状态和预览回路。

## Scene 08｜预览才是调试现场

### 目的
把“自然语言改视频”的核心体验具体化。

### narrativeRole
工作方式：强调一次生成不是完成，预览反馈才是迭代现场。

### narrationIntent
说明看到文字太快或发光太强时，用一句具体反馈让 Claude Code 修改，再回预览确认。

### visualIntent
展示预览中的文字从过快、过亮变为较慢、较克制，反馈气泡和代码数值同步变化。

### visualType
`UI Simulation + State Change`

### keyOnScreenText
```text
这个字飞太快了
发光弱一点
预览 → 反馈 → 再预览
```

### videoValue
前后状态变化能证明“自然语言改视频”不是口号，而是一个可重复的预览循环。

### 信息分工
- **声音**：给出具体反馈方式。
- **画面**：展示反馈前后的视觉差异。

## Scene 09｜最小示例的预期输出

### 目的
把文章中的最小实战压缩成可识别的终端状态，帮助观众知道每一步应该看到什么。

### narrativeRole
实践确认：把流程总览落到命令和预期输出，但不展开成操作教程。

### narrationIntent
说明 Node 版本确认、依赖安装、Studio 预览和 Composition ID／mp4 输出各自的位置。

### visualIntent
终端按顺序显示命令和结果；顶部明确这是文章示例画面，本次不执行。

### visualType
`Terminal Simulation`

### keyOnScreenText
```text
文章中的示例命令 · 本次不执行
node --version
npm install
npx remotion studio
npx remotion render HelloVideo out/hello.mp4
```

### videoValue
终端状态和预期输出能把“跑通链路”变成可检查的视觉记忆，同时保持任务边界。

### 信息分工
- **声音**：说明命令分别验证什么。
- **画面**：展示命令与状态，不执行命令。

## Scene 10｜参数化模板才是主场

### 目的
帮助观众判断自己的视频是可复用模板还是一次性艺术品。

### narrativeRole
选型分叉：从“能不能做”转向“值不值得做”。

### narrationIntent
列出批量年度总结、数据可视化、技术演示等适用场景，并对比实拍和一次性创意。

### visualIntent
一条路径进入“同模板换数据”，另一条进入“一次性艺术品”；中间显示“参数化／批量／数据驱动”。

### visualType
`Decision Diagram + Comparison`

### keyOnScreenText
```text
能换数据复用的模板
一次性艺术品
参数化 · 批量 · 数据驱动
```

### videoValue
选择分叉能把文章的适用边界变成观众对自己项目的即时判断。

### 信息分工
- **声音**：解释适合和不适合的案例。
- **画面**：展示两条路的结果差异。

## Scene 11｜成本与避坑

### 目的
在结尾前加入现实成本，防止视频变成单向宣传。

### narrativeRole
风险校正：承认渲染、复杂度和动画细节带来的成本。

### narrationIntent
说明渲染吃机器和时间；复杂任务要先拆小；预览优先；延迟 `spring` 不要传负帧数。

### visualIntent
四个警示标记依次亮起，并把“先做简单版本 → 逐场景增加”作为安全路线。

### visualType
`Checklist + Process`

### keyOnScreenText
```text
渲染吃性能和时间
先做简单版本
逐场景增加
spring：避免负帧数
```

### videoValue
风险状态和修正路线用视觉顺序呈现，比把坑堆成一段提醒更容易记住。

### 信息分工
- **声音**：解释成本和应对方式。
- **画面**：展示警示与安全路线。

## Scene 12｜知道这条路，再回到真实问题

### 目的
收束全片，保留选读篇的克制判断，并结束系列。

### narrativeRole
结论收束：把技术知识转化为投入决策。

### narrationIntent
回顾 Remotion、Claude Code、三个概念、预览循环和适用边界；说明没有真实需求时知道这条路就够了。

### visualIntent
四个核心节点汇聚到“真实需求”，最后停留在“有复用价值再投入”。由于文章明确称本篇是教程最后一站，不虚构下一集预告。

### visualType
`SummaryScene`

### keyOnScreenText
```text
Remotion：视频变代码
Claude Code：写和改代码
预览—反馈—再预览
有真实复用价值，再投入
```

### videoValue
节点汇聚和最终停留能把分散的技术点收束为一个选择标准，并给观众留下判断时间。

### 信息分工
- **声音**：完成知识回顾和选型结论。
- **画面**：将核心节点收束到真实需求。

## Gate 1 内部审查

- 12 个 Scene 的 `sceneId`、标题、目的、叙事作用、口播方向、视觉方向、视觉类型、屏幕重点和 Video Value 均已明确。
- Scene 01–04 建立“为什么代码化”和“谁负责什么”；Scene 05–06 建立概念直觉；Scene 07–09 完成流程和示例；Scene 10–12 完成选型、风险和结论。
- 屏幕文字全部来自文章内容或本资料对文章内容的结构化压缩，没有复用其他视频的业务文案。
- Scene 09 明确命令只作画面内容，不执行。
- Scene 12 未添加下一集预告，因为指定原文明确把本篇定位为整套教程最后一站；不凭空扩展系列主题。

## 下一步

基于本 Scene Script 生成纯口播 Narration Script、Visual Script 和横屏 Visual Prototype。
