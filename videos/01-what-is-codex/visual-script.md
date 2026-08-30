# 认识 Codex 与四种入口 · 第五步：Visual Script

> 目标：把 10 个 Scene 设计为可验证的横屏视觉事件。声音负责解释意义，画面负责展示入口路由、项目动作、状态变化和选择依据。

## 全局视觉原则

### 1. 一个核心，四种入口

全片持续使用“Codex 核心节点 + 四入口颜色”的视觉语法：

- 桌面 App：蓝绿色。
- CLI：绿色。
- IDE 扩展：紫色。
- 云端 Web：蓝色。
- 人工 Gate 与风险边界：琥珀色。

四种颜色只用于入口识别，不扩展成无关装饰。

### 2. 画面演示动作，不复述整段口播

口播解释“为什么”，画面呈现“发生了什么”：文件树状态改变、终端测试通过、diff 等待审查、任务卡路由到入口。屏幕文字只保留关键词、状态和必要命令。

### 3. 横屏结构与字幕安全区

- 画布按 1920 × 1080、16:9 构图。
- 主内容位于中上部，底部保留约 150px 字幕安全区。
- 标题最多两行，卡片正文保持短句。
- Scene 10 的下一集预告卡放在字幕区上方，独立停留约 2～3 秒。

### 4. 统一界面语言

- 深色背景，辅以低强度蓝绿光晕。
- 文件树、终端、diff、任务状态使用同一套圆角面板和等宽字体。
- 不模拟完整真实产品界面，只保留能说明认知任务的结构。
- 不出现预览导航、调试标记或制作说明以外的无关文案。

### 5. 动画服务于关系

- 汇聚动画解释“多个入口、一个核心”。
- 连线动画解释“入口到执行环境”。
- 状态推进解释“代理执行过程”。
- Gate 动画解释“执行不等于正确”。
- 不使用与内容无关的旋转、粒子爆炸或高强度发光。

# Scene 01｜到底哪个才是 Codex

## 视觉目标

先制造“四个产品”的错觉，再把四块界面合并成同一个 Codex 的四种入口。

## 画面结构

- 顶部标题：“到底哪个才是 Codex？”
- 中央是带问号的 Codex 核心圆环。
- 四角分别为桌面窗口、终端、IDE 侧栏、浏览器任务面板。
- 收束后中央文案变为“一个 Codex · 四种入口”。

## 动画

1. 四块界面依次从四角进入。
2. 每块出现入口名称，中央问号轻微脉冲。
3. 四条连线同时连到核心，问号翻转为 Codex 标识。
4. 四块保持分布，不叠成一个窗口，强调入口不同但核心相同。

## 屏幕文字

```text
桌面 App
CLI
IDE 扩展
云端 Web
一个 Codex · 四种入口
```

## Visual Type

`OpeningScene + Interface Montage`

# Scene 02｜回答代码，和执行任务

## 视觉目标

用同一问题的两条路径证明“回答”和“执行”的差异。

## 画面结构

- 左侧：“给建议”，含聊天气泡、代码片段和“等待复制”。
- 右侧：“进入项目执行”，含文件树、终端、测试和 diff。
- 中间放置相同任务：“项目跑不起来了”。

## 动画

1. 任务同时进入左右两侧。
2. 左侧生成代码片段后停住。
3. 右侧继续点亮 Read、Edit、Test、Diff 四个节点。
4. 底部结论从“回答”向“执行”移动并高亮右侧。

## 屏幕文字

```text
项目跑不起来了
回答：给你建议
等待复制
代理：进入项目执行
Read · Edit · Test · Diff
```

## Visual Type

`ComparisonScene + Workflow`

# Scene 03｜一个目标如何变成结果

## 视觉目标

把 Agent 的五步动作链展示成项目状态变化。

## 画面结构

- 左侧窄栏为任务卡：“修到测试通过”。
- 中间为五步纵向状态链。
- 右侧为模拟工作区：文件树、错误行、终端和 diff 标签页。

## 动画

1. 扫描光经过文件树，对应“读取项目”。
2. 错误日志锁定依赖行，对应“定位问题”。
3. 两个文件从 Modified 变为已保存。
4. 终端由 failing 变为 tests passed。
5. diff 卡进入“等待验收”，而不是自动 Complete。

## 屏幕文字

```text
修到测试通过
读取项目
定位问题
修改文件
运行测试
交付 diff
等待验收
```

## Visual Type

`StepListScene + Project State Change`

# Scene 04｜三扇门在本机，一扇门去云端

## 视觉目标

用路由图建立本机与云端的执行位置差异。

## 画面结构

- 左侧为四个入口按钮。
- 中央竖线区分“本机”和“云端”。
- 本机区域包含 Local Project、Files、Shell。
- 云端区域包含 Remote Repo、Isolated Environment。

## 动画

1. App、CLI、IDE 三条线依次进入 Local Project。
2. Files 与 Shell 出现本机状态脉冲。
3. Web 连线跨过环境边界进入 Isolated Environment。
4. Remote Repo 向隔离环境传入项目快照，完成两区对照。

## 屏幕文字

```text
本机
App · CLI · IDE
Local Project · Files · Shell
云端
Web · Remote Repo · Isolated Environment
```

## Visual Type

`ConceptScene + Routing Diagram`

# Scene 05｜按工作场景选入口

## 视觉目标

把四种入口从功能列表变成任务选择器。

## 画面结构

- 左侧依次出现四张任务卡。
- 右侧为 App、CLI、IDE、Web 四个入口槽位。
- 顶部固定选择问题：“这个任务适合在哪里执行？”

## 动画

1. “可视化 diff／多任务”卡滑入 App。
2. “终端／SSH”卡滑入 CLI。
3. “编辑器内开发”卡滑入 IDE。
4. “后台长任务”卡滑入 Web。
5. 四个槽位同时亮起，中央出现“没有唯一入口”。

## 屏幕文字

```text
这个任务适合在哪里执行？
可视化 diff / 多任务
终端 / SSH
编辑器内开发
后台长任务
没有唯一入口 · 按场景选择
```

## Visual Type

`ComparisonScene + Task Routing`

# Scene 06｜可以委托的五类工作

## 视觉目标

让能力清单变成同一执行队列中的不同任务和结果。

## 画面结构

- 左侧为五张短任务卡。
- 中间为 Codex 处理队列。
- 右侧为项目状态板，显示 Created、Indexed、Reviewed、Fixed、Migrated。

## 动画

1. 任务卡逐张进入队列，每次只突出一张。
2. 队列完成后，右侧对应状态从灰色变为蓝绿色。
3. 五项完成后组合成“理解上下文 + 执行动作”。

## 屏幕文字

```text
写代码 → Created
理解项目 → Indexed
代码审查 → Reviewed
调试修复 → Fixed
自动化杂活 → Migrated
理解上下文 + 执行动作
```

## Visual Type

`StepListScene + Status Board`

# Scene 07｜执行可以交给 AI，判断不能

## 视觉目标

用责任分区和验收 Gate 表达人机协作边界。

## 画面结构

- 左侧“Human”区域：目标、边界、技术方向、验收。
- 右侧“AI”区域：分析、执行、重复劳动。
- 中央下方为 Review Gate，连接 diff 与 Accepted 状态。

## 动画

1. AI 区快速完成分析和执行，生成一个 diff 包。
2. diff 未带 Review 状态时被 Gate 拦住，出现琥珀色提示。
3. Human 区依次点亮“看 diff”“跑验证”“拍板”。
4. Gate 变为 Accepted，屏幕结论出现。

## 屏幕文字

```text
Human：目标 · 边界 · 审查 · 验收
AI：分析 · 执行 · 重复劳动
Review Required
完成执行 ≠ 自动正确
```

## Visual Type

`ComparisonScene + Gate State`

# Scene 08｜问答工具与编程代理

## 视觉目标

先按工作方式分类，再说明 Codex 与 Claude Code 的稳定差异。

## 画面结构

- 中央横轴：“问答与建议”到“执行项目任务”。
- ChatGPT 卡靠近问答侧。
- Codex 与 Claude Code 卡位于代理侧。
- 下方只放稳定标签：OpenAI／Anthropic、`AGENTS.md`／`CLAUDE.md`、入口侧重。

## 动画

1. 横轴出现，ChatGPT 卡停在问答侧。
2. Codex 和 Claude Code 同时移动到代理区域。
3. 两张代理卡展开各自稳定标签。
4. 跑分和价格图标被淡出，留下“按任务分工”。

## 屏幕文字

```text
问答与建议
执行项目任务
Codex：OpenAI · AGENTS.md
Claude Code：Anthropic · CLAUDE.md
同类代理 · 不同产品体系
按任务分工
```

## Visual Type

`ComparisonScene + Concept Map`

# Scene 09｜电脑认不认识 Codex

## 视觉目标

用真实终端分支展示一个不产生副作用的检查动作。

## 画面结构

- 主体为大尺寸终端窗口。
- 输入行固定为 `$ codex --version`。
- 下半部分分成版本号和 command not found 两张结果卡。

## 动画

1. 命令逐字输入并回车。
2. 终端分屏，左侧出现“版本号”，右侧出现“command not found”。
3. 两张卡分别显示“已安装”和“尚未安装”。
4. 两条分支汇入共同状态“状态已确认”。

## 屏幕文字

```text
$ codex --version
版本号 → 已安装
command not found → 尚未安装
状态已确认
```

## Visual Type

`TerminalScene + Result Branch`

# Scene 10｜一张地图，三个判断

## 视觉目标

用三张总结卡压缩本集知识，再让下一集预告成为最后一个独立视觉事件。

## 画面结构

- 上半部为三张总结卡。
- 下半部在总结完成后升起下一集预告卡。
- 预告卡位于字幕安全区上方，与底部字幕不重叠。

## 动画

1. “一个 Codex · 四种入口”卡锁定。
2. “按场景选择”卡锁定。
3. “AI 执行 · 人来验收”卡锁定。
4. 三卡上移，下一集预告卡从右侧进入。
5. 术语逐项点亮，预告卡保持约 2～3 秒可读停留。

## 屏幕文字

```text
一个 Codex · 四种入口
按场景选择
AI 执行 · 人来验收
下一集：02 核心概念速览
代理循环 · 上下文 · AGENTS.md
审批 · 沙箱 · Skills · MCP
```

## Visual Type

`SummaryScene + Next Episode Teaser`

# 全片视觉类型分布

| 类型 | Scene | 用途 |
| --- | --- | --- |
| Opening / Montage | 01 | 建立四入口与同一核心 |
| Comparison | 02、05、07、08 | 对比工作方式、入口选择和责任边界 |
| Step / Status | 03、06 | 展示任务过程与结果状态 |
| Routing Diagram | 04 | 解释本机与云端执行位置 |
| Terminal | 09 | 展示最小检查动作与结果分支 |
| Summary | 10 | 收束知识并承接下一集 |

# 组件与布局标准

- 优先映射现有 `OpeningScene`、`ConceptScene`、`ComparisonScene`、`StepListScene`、`TerminalScene`、`SummaryScene`，不新增场景类型。
- 原型只验证构图、状态、屏幕文字与视觉事件，不设计正式 Remotion 代码。
- 入口卡、任务卡、状态条和 Gate 使用统一 18–24px 圆角与 1px 低对比描边。
- 主标题建议 52–68px，关键结论 36–44px，面板文字 24–30px，字幕区另行保留。
- 列表单幕不超过 5 项；Scene 10 术语分为两行，避免横向拥挤。

# 动画标准

- 主元素入场约 500–800ms，状态切换约 300–500ms。
- 同一 Scene 的步骤按认知顺序出现，不同时抢占注意力。
- 连线先出现起点，再流向终点；Gate 先拦截，再由人工动作放行。
- 发光仅用于当前活动节点，透明度和模糊半径保持克制。
- 自动播放原型每幕仅作结构预览，不代表最终口播时长。

# 画面文字归属审查

- 四入口名称、Agent 动作链、能力、边界、工具关系、`codex --version` 结果均可追溯到 Source、Content Analysis 或 Scene Script。
- “Read · Edit · Test · Diff”“Review Required”“Accepted”等是对已有动作与验收边界的界面化表达，不新增业务结论。
- 没有沿用基线视频的 Claude Code Bug、Copilot、项目文件名或状态文案。
- 预告主题与术语均来自 Source 的下一集导航。

# 下一步

按本 Visual Script 制作 1920 × 1080 横屏构图的无依赖 HTML + CSS Visual Prototype，保留 10 个 Scene 容器、幕内预览字幕、上一幕／下一幕／自动播放和进度提示。
