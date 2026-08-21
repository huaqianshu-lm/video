# Claude Code 如何工作视频化 · 第五步：Visual Script

## 全局视觉原则

### 1. 先展示动作，再解释机制

画面优先展示测试、文件、命令和结果状态，旁白负责把这些动作归纳为代理循环。

### 2. 统一使用“工作台、工具箱、闸门、循环”语言

以深色终端和项目面板作为统一空间，用蓝色表达正常流程，绿色表达验证通过，红色只用于错误和急停。

### 3. 一个 Scene 只表达一个视觉中心

不同时堆叠循环、权限、工具分类和实验步骤；每幕只让一个状态变化成为焦点。

### 4. 屏幕文字克制

主标题控制在 1—2 行，工具类别和命令只保留必要关键词，底部字幕预留安全区。

### 5. 原型交互只服务预览

上一幕／下一幕、自动播放和进度提示属于原型外壳；幕内只保留未来 Composition 需要表达的画面内容。

## Scene 01｜一句问题，连续几步

### 视觉目标

让观众看到一句问题如何变成一串真实项目动作。

### 画面结构

左侧为终端，右侧为 `validateEmail` 文件卡和测试状态卡。

### 动画

依次出现测试失败、`undefined`、文件打开、`return` 修改和 `Tests passed`。最后所有状态连成一条轨迹。

### 屏幕文字

```text
测试失败
validateEmail → undefined
少了 return
Tests passed ✓
```

### Visual Type

`Opening Process Simulation`

## Scene 02｜聊天框与 Claude Code

### 视觉目标

把“返回文字”和“在项目中行动”并置，建立问题意识。

### 画面结构

左右两块面板：左侧聊天框只有一段回复；右侧 Claude Code 面板依次显示读、改、跑、验证。

### 动画

左侧回复停留不变；右侧四个状态依次点亮，中央出现“为什么？”。

### 屏幕文字

```text
普通聊天框
只返回文字

Claude Code
读 · 改 · 跑 · 验证
```

### Visual Type

`Comparison Scene`

## Scene 03｜代理循环：想 → 做 → 看

### 视觉目标

建立全片唯一的主循环视觉母题。

### 画面结构

三个大节点横向排列，右侧“看”通过回路线返回“想”。

### 动画

节点按“想→做→看”顺序亮起；验证状态出现“结果不对”，回线亮起并重新进入“想”。

### 屏幕文字

```text
想
收集上下文
做
采取行动
看
验证结果
agentic loop
```

### Visual Type

`Agent Loop Diagram`

## Scene 04｜一轮修复如何展开

### 视觉目标

把抽象闭环映射到一次失败测试的工具路径。

### 画面结构

六个步骤组成横向时间线，每个步骤下方标注工具类别；上方保留“模型：想 / 工具：做和看”。

### 动画

步骤逐个出现，当前步骤放大并高亮；第六步完成后回到第三步的搜索节点，暗示复杂任务会多轮。

### 屏幕文字

```text
跑测试 → 读输出 → 搜文件
读逻辑 → 改文件 → 再测试
模型：想
工具：做 / 看
```

### Visual Type

`Workflow Timeline`

## Scene 05｜Esc：立刻叫停

### 视觉目标

表现用户可以在循环中及时刹车。

### 画面结构

终端中央显示“正在修改 5 个文件…”，右下角显示 `Esc` 键提示。

### 动画

改动计数从 1 增加到 5；`Esc` 键亮起后，进度条冻结，状态切为 `Tool call cancelled`。

### 屏幕文字

```text
正在修改 5 个文件…
Esc
Tool call cancelled
```

### Visual Type

`Interrupt Simulation`

## Scene 06｜补充指令：不打断当前动作

### 视觉目标

让观众理解补充指令和急停是两种不同的时间关系。

### 画面结构

上方是仍在运行的工具进度条，下方输入框出现“只改 validateEmail”。

### 动画

进度条继续向前；补充指令进入“待读取”胶囊，当前动作完成后胶囊变为“已读取”。

### 屏幕文字

```text
当前操作继续中
只改 validateEmail
完成当前动作后读取
迭代 > 一次性完美提示
```

### Visual Type

`Queued Instruction UI`

## Scene 07｜五类工具箱

### 视觉目标

把工具从抽象能力变成可辨认的五个工具槽。

### 画面结构

中央工具箱，五张卡片分别连接到代码文件、搜索、终端、网页和 IDE 标记。

### 动画

卡片从工具箱中依次弹出；代码智能卡使用较暗边框，并标注“需插件”。

### 屏幕文字

```text
文件操作
搜索
执行
网络
代码智能 · 需插件
```

### Visual Type

`Toolbox Taxonomy`

## Scene 08｜模型自己选择工具

### 视觉目标

展示模型如何根据每次返回结果选择下一种工具。

### 画面结构

全宽终端面板，右侧窄栏显示当前工具类别。

### 动画

六行命令／结果按顺序打印；每行出现时右侧工具类别切换，最后绿色验证结果出现。

### 屏幕文字

```text
1 执行：跑测试
2 执行：读输出
3 搜索：找文件
4 文件：读逻辑
5 文件：改 bug
6 执行：再验证
```

### Visual Type

`Terminal Process Simulation`

## Scene 09｜当前目录是工作范围

### 视觉目标

同时表现 Claude Code 的跨文件能力和访问边界。

### 画面结构

中央为“当前工作目录”，周围环绕项目文件、终端、git、`CLAUDE.md` 和扩展；外圈为暗色硬盘轮廓。

### 动画

资源从工作目录向外连接；硬盘外圈出现“需要权限”的低亮提示，不展开具体敏感文件。

### 屏幕文字

```text
当前工作目录
项目文件 · 终端 · git
CLAUDE.md · 扩展
不是整个硬盘
```

### Visual Type

`Workspace Scope Diagram`

## Scene 10｜两道安全闸

### 视觉目标

区分权限模式和检查点的作用位置。

### 画面结构

左侧为动作进入前的 Permission Mode／Plan Mode 闸门，右侧为编辑完成后的 Checkpoint 存档；远处外部副作用停在边界外。

### 动画

复杂任务先经过 Plan Mode；批准后进入编辑；编辑完成后生成 Checkpoint；数据库、API、部署等外部副作用保持在闸门外。

### 屏幕文字

```text
Permission mode
Plan Mode：先读、先搜、先计划
Checkpoint：恢复本地编辑
外部副作用：不会自动回滚
```

### Visual Type

`Security Layer Diagram`

## Scene 11｜空目录实验：先想再做

### 视觉目标

用最小实验把 Plan Mode 的“先计划、后批准”变成可见状态。

### 画面结构

终端面板从启动命令开始，随后出现 Plan Mode 标签、三步计划和等待批准的按钮状态。

### 动画

`mkdir`、`claude` 逐行出现；计划三行依次打印；文件区保持空白，直到“需要我开始？”停住。

### 屏幕文字

```text
mkdir -p ~/cc-demo && cd ~/cc-demo
claude
Plan Mode
1 创建 add.py
2 创建测试
3 运行测试
需要我开始吗？
```

### Visual Type

`Terminal Demo`

## Scene 12｜验证失败，再来一轮

### 视觉目标

用一次人为制造的失败收束代理循环，并引出下一篇。

### 画面结构

左侧为测试状态时间线，中央回路返回“想”，右下为下一篇预告卡。

### 动画

先出现 `Tests passed`，再把 add 改成减法，状态变为 `Tests failed`；红色回路返回“想”，最后预告卡淡入并停留。

### 屏幕文字

```text
Tests passed ✓
改成减法
Tests failed
回到“想”
下一篇 04｜API 配置
```

### Visual Type

`Loop Recap + Next Episode Preview`

## 全片视觉类型／组件／动画标准

### 视觉类型

```text
Opening Process Simulation
Comparison Scene
Agent Loop Diagram
Workflow Timeline
Interrupt Simulation
Queued Instruction UI
Toolbox Taxonomy
Terminal Process Simulation
Workspace Scope Diagram
Security Layer Diagram
Terminal Demo
Loop Recap
```

### 原型组件

```text
<SceneShell />
<TerminalPanel />
<StatusCard />
<LoopDiagram />
<ToolCard />
<ScopeBoundary />
<GuardLayer />
<PlanPanel />
<NextEpisodeCard />
```

### 动画标准

- 一级信息动画：状态按顺序出现、节点连接、工具类别切换、回路返回、命令逐行打印。
- 二级注意力动画：当前工具高亮、`Esc` 急停使用克制红色、测试通过使用绿色。
- 三级装饰动画：只使用轻微渐变、面板呼吸和短距离位移，不使用复杂粒子或花哨转场。
- 每个 Scene 的主要信息完整出现后保留阅读停顿；Scene 12 的下一篇预告卡至少停留约 2～3 秒。

## Gate 2 内部审查

- 12 个 Scene 已与 Scene Script 的 ID、标题、叙事顺序和视觉类型对齐。
- 视觉与口播完成互补分工：动作时间线、循环回路、急停、排队指令、工具选择、工作范围和安全闸门均不是对口播的逐字复述。
- 所有画面文字均可追溯到 `source.md`、Content Analysis、Video Narrative、Scene Script 或本 Visual Script；未带入其他视频的业务语义、固定状态文字或参考残留。
- 横屏构图按 16:9、1920 × 1080 设计；主标题、流程面板和底部字幕预留安全区，Scene 12 预告卡不与字幕区域叠放。
- 原型导航、自动播放、进度提示和预览外壳与幕内画面分离，不属于最终 Composition。
- 终端命令、测试结果和计划均为文章内容的模拟画面；未执行实验。TTS、音频、字幕、Timeline 和 Remotion 配置已从冻结版 `tts-script.json` 派生，仍需在可用 Chromium 环境完成人工 TTS 质检与 Gate 3。

## 下一步

用户已确认继续推进本条视频。已使用项目既定 TTS 以显式 `+25%` 语速生成逐 Segment 音频，并由实际音频生成字幕 Manifest、Timeline Manifest 和 Remotion 配置；下一步进行人工 TTS 质检与 Gate 3 音画预览检查。
