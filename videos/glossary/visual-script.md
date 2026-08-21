# Claude Code 术语表视频化 · 第五步：Visual Script

## 全局视觉原则

### 1. 画面不能只是重复术语

口播负责把术语翻译成人话，画面负责展示它们的关系、层级、顺序和边界。屏幕上只保留当前认知中心所需的词，不把全文条目一次性铺满。

### 2. 统一使用“工作台、装备、扩展坞、门禁、路线”隐喻

六族分别使用有限工作台、装配卡、扩展坞、多层门禁和运行路线，但都使用同一套深色面板、浅色文字、蓝紫主强调色和绿色成功状态，保持教程感。

### 3. 一个 Scene 只表达一个视觉中心

每幕只保留一个主要图形：闭环、工作台、装备包、扩展坞、门禁、路线、对照卡、终端流程或索引地图。辅助文字不抢主图形。

### 4. 先展示状态，再展示术语

先让观众看到“工具返回结果”“工作台变满”“连接变成 Connected”“两边的区别轴”，再把术语标签贴到状态上，避免画面成为词汇表。

### 5. 控制信息密度

16:9 横屏按 1920 × 1080 构图。主标题 1～2 行，主图留在中央，屏幕文字优先短语或代码片段。每个卡片最多 3～5 个主要词条；需要展示的长命令拆成终端多行。

### 6. 原型交互只服务预览

保留上一幕、下一幕、自动播放和进度提示，作为原型外壳。它们不属于视频画面语义，后续进入 Remotion 时必须隔离在 Composition 外。

## Scene 01｜术语表不是课文

### 视觉目标

完成“密集黑话 → 六张速查卡”的认知重构。

### 主要画面

左侧是一面短暂闪现的词条墙：`agentic loop`、`context window`、`MCP`、`checkpoint`、`transport`。中间出现一张大卡片“术语表不是课文”，随后词条按颜色归入六张主题卡。

### 动画

词条先轻微错位堆叠；“速查卡”出现后，词条分别滑入“代理循环、上下文、扩展点、MCP、安全权限、入口运行”。最后只保留“遇到 · 定位 · 查清”。

### 屏幕文字

```text
术语表不是课文
是一张速查卡
遇到 · 定位 · 查清
```

### Visual Type

`Opening Reframing`

## Scene 02｜代理循环：想、做、看

### 视觉目标

让 agentic loop 成为术语地图的运行地基。

### 画面结构

中央四节点闭环：`收集上下文` → `采取行动` → `验证结果` → `再来一圈`。环外固定放置 `Tool`、`Harness`、`Turn`、`Verification loop` 四张零件卡，底部短暂出现 `Extended thinking` 与 `Effort level`。

### 动画

蓝色光点沿闭环移动；到“采取行动”时 Tool 卡亮起；到“验证结果”时显示绿色检查；条件文字“不够？”让光点回到第一节点。

### 屏幕文字

```text
agentic loop
收集上下文 → 采取行动 → 验证结果
不够？再来一圈
```

### Visual Type

`Agent Loop Diagram`

## Scene 03｜上下文：一张有限的工作台

### 视觉目标

展示上下文容量、整理动作和会话粒度。

### 画面结构

中央工作台有五个文件夹／卡片：`对话`、`文件`、`工具输出`、`CLAUDE.md`、`Skill`。顶部容量条从“可用”逐渐接近满格；右侧有 `Compaction` 和 `Auto-compact` 整理抽屉。

### 动画

卡片依次落到工作台，容量条变满；整理抽屉打开，把旧工具输出收成“精简版”；新的 `Turn` 卡放入工作台，旁边保留 `Session` 标签。

### 屏幕文字

```text
Context window
对话 / 文件 / 工具输出 / CLAUDE.md / Skill
Compaction → 精简版
Session · Turn
```

### Visual Type

`Context Workspace`

## Scene 04｜扩展点：给 Claude 加装备

### 视觉目标

把扩展点的作用位置和分发层级可视化。

### 画面结构

中央是“代理循环”简化轨道，六件装备从不同位置接入：`Skill` 接入主桌面，`Subagent` 进入独立小桌面，`Hook` 接在事件闸门上，`Command` 是操作按钮，`Plugin` 是装备箱，`Marketplace` 在远侧作为来源。

### 动画

装备逐件出现并接入不同位置；Subagent 的内部过程留在小桌面，最后只回传“结论”；Plugin 展开后显示 `Skill / Hook / Subagent / MCP server`。

### 屏幕文字

```text
Skill · Subagent · Hook
Command · Plugin · Marketplace
不同位置，不同作用
```

### Visual Type

`Extension Kit Diagram`

## Scene 05｜MCP：把 Claude 接到外部世界

### 视觉目标

让 MCP 家族的层级关系一眼可见。

### 画面结构

中央扩展坞写 `MCP`，左侧接入 `MCP server` 设备；设备旁分出两条连接线：本机 `stdio` 和远程 `http`。右侧显示 scope 三档 `local / project / user`，顶部小菜单显示 `Tool Search`。

### 动画

先出现扩展坞标准，再插入 server；切换 transport 时，线缆从本地进程变成远程网址；scope 卡依次高亮；顶部菜单从“只看名字”展开成“按需加载完整说明”。

### 屏幕文字

```text
MCP = AI 接外部工具的标准
server · transport · scope
stdio / http
按需加载
```

### Visual Type

`Connection Diagram`

## Scene 06｜安全与权限：动手前的多层把关

### 视觉目标

把安全机制表现为分层边界，而不是单个安全开关。

### 画面结构

一项“工具操作”从左向右经过四层门：`Permission mode`、`Permission rule`、`Sandboxing`、`Checkpoint`。上方以小卡片展示 `Plan mode` 和 `Auto mode`，侧边出现被拦截的 `Prompt injection`。

### 动画

操作先经过会话级模式，再匹配 `allow / ask / deny`；sandbox 墙亮起；成功路径留下 checkpoint；侧边的提示注入被红色边框拦在门外。

### 屏幕文字

```text
Permission mode → Permission rule
Sandboxing → Checkpoint
Prompt injection？
```

### Visual Type

`Security Layer Diagram`

## Scene 07｜入口与运行：同一个引擎，不同的到岗方式

### 视觉目标

把入口、脚本、云端和隔离方式放进同一张运行地图。

### 画面结构

中央固定一个 `Claude Code engine`，四周出现 `CLI / VS Code / JetBrains / Web`；底部延伸 `-p / --print` 与 `Agent SDK`；右侧用两块区域对比 `本地` 和 `云端沙箱`，并放置 `Worktree isolation`、`Remote Control`、`Teleport`。

### 动画

入口依次接入中央引擎；脚本路线出现“执行一次 → 退出”；云端路线亮起沙箱边界；Remote Control 箭头从手机回到本机，Teleport 箭头从云端回到终端。

### 屏幕文字

```text
同一个引擎
CLI / VS Code / JetBrains / Web
-p / --print · Agent SDK
Remote Control ↔ Teleport
```

### Visual Type

`Runtime Surface Map`

## Scene 08｜易混关系一：上下文与加载边界

### 视觉目标

让观众记住比较轴，而不是死记九组术语。

### 画面结构

画面分为五条横向对照轨道，每条左侧是比较轴，右侧是两个词条：`内容进谁的上下文？` 对应 `Skill / Subagent`，`什么时候加载？` 对应 `CLAUDE.md / Skill`，再依次展示粒度、是否保留和谁写的。

### 动画

五条轨道逐条点亮，轴标签先出现，词条后出现；每一条只保留一条短结论：`主桌面 / 独立桌面`、`自动 / 按需`、`整段 / 一回`、`总结 / 清空`、`用户 / Claude`。

### 屏幕文字

```text
内容进谁的上下文？
什么时候加载？
粒度 · 留不留旧内容 · 谁写的？
```

### Visual Type

`Contrast Cards`

## Scene 09｜易混关系二：控制、连接与协作边界

### 视觉目标

继续用四条比较轴切开控制、连接与协作概念。

### 画面结构

四条对照轨道：`事件触发 / 工具准不准`、`单会话汇报 / 多会话对话`、`大基线 / 细规则`、`本机进程 / 远程服务`。两端分别放 `Hook / 权限规则`、`Subagent / Agent team`、`Permission mode / 权限规则`、`stdio / http`。

### 动画

每次只显示一条轴，左端先亮，右端随后亮；中间短线强调“比较的维度”，避免把两端误认为同一类功能。

### 屏幕文字

```text
事件触发 / 工具准不准
单会话汇报 / 多会话对话
大基线 / 细规则
本机进程 / 远程服务
```

### Visual Type

`Boundary Comparison`

## Scene 10｜官方文档 server：把静态卡变成活字典

### 视觉目标

演示文章中的四步查证流程，明确命令不在本次任务中执行。

### 画面结构

中央终端分为四段时间线：

1. `claude mcp add --transport http claude-code-docs https://code.claude.com/docs/mcp`
2. `claude mcp list`，列表出现 `✓ Connected`。
3. `claude` 会话中点名查询 `compaction` 和 `context window`。
4. `claude mcp remove claude-code-docs`，标记为可选。

### 动画

命令按步骤逐行打印；第一步出现 `Added`，第二步出现绿色连接状态，第三步出现工具标记 `claude-code-docs` 和批准提示，第四步以“可选”折叠。

### 屏幕文字

```text
add → list → 查询 → remove（可选）
Added
✓ Connected
claude-code-docs
```

### Visual Type

`Terminal Process Simulation`

## Scene 11｜六族总地图：回来查哪一张

### 视觉目标

把六族变成一张可快速定位的长期索引。

### 画面结构

中央标题 `Claude Code 术语速查卡`，周围六张卡：代理循环、上下文、扩展点、MCP、安全权限、入口运行。每张卡只展示一句定位和 3～4 个镇族术语。

### 动画

六张卡按叙事顺序依次落位，最后连成一圈；观众可见从“代理如何工作”到“在哪里运行”的完整地图。

### 屏幕文字

```text
代理循环｜会自己动手的运转机制
上下文｜记性边界与说话方式
扩展点｜给它加装备
MCP｜接外部世界
安全权限｜动手前的把关
入口运行｜从哪儿用、怎么跑
```

### Visual Type

`Taxonomy Map`

## Scene 12｜查卡收束与下一集预告

### 视觉目标

形成可执行查词闭环，并完成系列视频的下一集预告。

### 画面结构

第一阶段中央显示四步：`遇到术语` → `按族定位` → `看区别` → `必要时现查`。第二阶段清空中央区域，单独出现预告卡：`下一篇 53｜制作视频（Remotion）〔选读〕` 和 `用 React 代码写视频`。

### 动画

四步依次连接并停留；随后流程缩小到左侧，预告卡从右侧进入，成为最后一个视觉事件。预告卡与底部字幕预留区域分开，停留约 2～3 秒。

### 屏幕文字

```text
遇到术语 → 按族定位 → 看区别 → 必要时现查
这是一张速查卡，不是一篇课文
下一篇 53｜制作视频（Remotion）〔选读〕
用 React 代码写视频
```

### Visual Type

`Closing Flow + Next Episode Preview`

## 全片视觉类型／组件／动画标准

### 视觉类型

```text
Opening Reframing
Agent Loop Diagram
Context Workspace
Extension Kit Diagram
Connection Diagram
Security Layer Diagram
Runtime Surface Map
Contrast Cards
Boundary Comparison
Terminal Process Simulation
Taxonomy Map
Closing Flow
```

### 原型组件

```text
<SceneShell />
<TermCard />
<FlowNode />
<LoopDiagram />
<WorkspacePanel />
<ExtensionCard />
<McpDock />
<GuardLayer />
<SurfaceRoute />
<ContrastRail />
<TerminalPanel />
<TaxonomyCard />
<NextEpisodeCard />
```

### 动画标准

- 一级信息动画：节点出现、卡片归类、闭环连接、容量整理、命令逐行打印、状态变成 `✓ Connected`。
- 二级注意力动画：当前节点高亮、比较轴亮起、成功状态使用绿色，风险提示使用克制的红色。
- 三级装饰动画：只使用轻微渐变、扫描线和面板呼吸，不使用无意义粒子、旋转或复杂转场。
- 每个 Scene 的主要信息完整出现后保留阅读停顿；Scene 12 的预告卡至少停留约 2～3 秒。

## Gate 2 内部审查

- 12 个 Scene 已与 Scene Script 的 ID、标题、叙事顺序和视觉类型对齐。
- 视觉与口播完成互补分工：闭环、容量、装配、连接、门禁、路线、比较轴和命令状态均不是对口播的逐字复述。
- 所有画面文字均可追溯到 `source.md`、Content Analysis、Video Narrative、Scene Script 或本 Visual Script；未带入其他视频的业务语义、固定状态文字或参考残留。
- 横屏构图按 16:9、1920 × 1080 设计；主标题、卡片和底部字幕预留安全区，预告卡不与字幕区域叠放。
- 原型导航、自动播放、进度提示和“仅供原型”的交互外壳与幕内画面分离，不属于最终 Composition。
- Scene 10 的命令和状态仅作为文章内容的模拟画面；未生成或调用 TTS、音频、字幕、Timeline，也未进入 Remotion。

## 下一步

本阶段在 Visual Prototype 完成并通过检查后停止。只有用户后续确认视觉原型，才进入 TTS 或 Remotion 相关阶段；本任务不执行这些步骤。
