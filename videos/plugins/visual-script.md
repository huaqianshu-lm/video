# 插件（Plugins）视频化 · 第六步：Visual Script

> 目标：基于 Scene Script 和 Narration Script，为每个 Scene 明确视觉表达。声音负责解释，画面负责演示、证明和建立直觉。

## 全局视觉原则

### 1. 画面不重复口播

口播解释插件的价值、选择和安全判断，画面展示散件聚拢、市场状态、目录层级、组件触发和安装范围变化。不要把口播全文直接铺在屏幕上。

### 2. 用聚拢、货架、目录和信任闸门组织视觉语言

本片的核心视觉语言是“散件 → 盒子”“货架 → 条目”“根目录 → 组件”“来源 → 权限范围”。抽象概念通过连接和状态变化呈现。

### 3. 一个 Scene 只有一个视觉中心

散件痛点、市场两步、安装清单、目录结构和信任三查分别占据不同 Scene，不在同一幕堆叠完整插件教程页面。

### 4. 命令和配置只做屏幕内容

所有命令、路径、预期状态和配置片段都是原型中的模拟文字。本任务不执行文章中的命令，不把原型控件当成正式视频交互。

### 5. 动画必须传递信息

优先使用文件聚拢、货架注册、插件移动、清单展开、命令出现、目录移动、权限收缩和状态切换；少用无意义粒子、旋转和装饰性弹跳。

## Scene 01｜散件交接，最容易漏一处

### 视觉目标

让“散落在多个位置”和“交接后漏项”先于插件定义出现。

### 主要画面

深色工作台中显示 `agents/`、`settings.json`、`.mcp.json` 三个文件卡。文件卡沿交接箭头移动，其中一张被落在路径外，右侧结果面板显示配置不一致。

### 动画

1. 三张散件卡从不同位置出现。
2. 交接箭头依次连接文件卡。
3. 一张卡偏离路径并变为警告色。
4. 结果从“配置齐全”切换到“漏了一处”。

### 屏幕文字

```text
agents/ · settings.json · .mcp.json
口头交代
交接结果：漏了一处
```

### Visual Type

`Process + Before/After`

## Scene 02｜插件是一个整体盒子

### 视觉目标

把插件从抽象名词变成“可以整体移动的自包含文件夹”。

### 主要画面

左侧散件文件卡向中央 `Plugin` 盒子聚拢。盒子展开五个组件节点，并在底部显示整体装、整体停、整体分发。

### 动画

1. 散件从不同位置沿线汇入盒子。
2. 盒子盖合并显示 `self-contained folder`。
3. 盒子展开 `Skill / Command`、`Subagent`、`Hook`、`MCP server`、`LSP server`。
4. 三个整体操作标签依次亮起。

### 屏幕文字

```text
Plugin
self-contained folder
Skill / Command · Subagent · Hook
MCP server · LSP server
整体装 · 整体停 · 整体分发
```

### Visual Type

`Concept Diagram + Connection Diagram`

## Scene 03｜散装还是插件，看你要不要规模化

### 视觉目标

展示选择关系，而不是重复“散装和插件的特点”。

### 主要画面

中央出现“我要怎么用？”任务卡，向左分流到 `.claude/` 个人项目，向右分流到 Plugin 的团队、多个项目和版本节点。右侧命名空间示例从 `/hello` 变为 `/my-plugin:hello`。

### 动画

1. 个人快速试验路径先亮起。
2. 团队共享节点连接到 Plugin。
3. 多个项目节点被一条插件线覆盖。
4. 版本号出现并触发“更新”标记。

### 屏幕文字

```text
散装：单项目 · 个人 · 快速试验
插件：团队共享 · 跨项目复用 · 版本化发布
/hello  →  /my-plugin:hello
version → 更新
```

### Visual Type

`Decision Diagram + Comparison`

## Scene 04｜市场是两步：先加货架，再装插件

### 视觉目标

清楚区分“添加市场”和“安装插件”的状态边界。

### 主要画面

左侧是空的插件货架，终端输入 marketplace add 后货架名称出现；右侧“已安装”仍为空。第二步输入 install，具体插件条目才移动到已安装区域。

### 动画

1. 高亮 `1 加市场`，货架从不可见变为可浏览。
2. 货架亮起但“已安装”保持空状态。
3. 高亮 `2 装插件`，插件条目从货架移动到已安装。

### 屏幕文字

```text
1  加市场
/plugin marketplace add owner/repo
货架已出现 · 插件尚未安装
2  装插件
/plugin install plugin-name@marketplace-name
```

### Visual Type

`Process + UI Simulation`

## Scene 05｜三个市场，三种取用判断

### 视觉目标

让市场名称、来源和用途形成清晰的分层。

### 主要画面

三层深色货架卡从上到下排列：官方精选、社区贡献、官方演示。官方卡有“自带”徽标，社区卡显示“固定提交”，演示卡显示“学习试水”。

### 动画

1. 官方货架先亮起。
2. 社区货架出现“手动添加”和“固定提交”。
3. 演示货架出现“样板插件”标签。
4. 取用箭头按“官方 → 社区 → 演示”依次经过。

### 屏幕文字

```text
claude-plugins-official · 官方精选 · 自带
claude-community · 社区贡献 · 固定提交
claude-code-plugins · 官方演示 · 学习试水
官方 → 社区 → 演示
```

### Visual Type

`Comparison + Trust Gradient`

## Scene 06｜安装前看清内容，安装后刷新生效

### 视觉目标

把安装前检查、上下文成本、安装范围和刷新生效串成一条操作路径。

### 主要画面

模拟 `/plugin` 详情面板，左侧是“将安装”组件清单，右侧是上下文成本仪表。下方选择用户／项目／本地范围，最后切换到 `/reload-plugins` 和命名空间命令状态。

### 动画

1. 组件清单逐行展开。
2. 上下文成本从未知变为可见。
3. 安装范围被选定。
4. `/reload-plugins` 刷新，命名空间命令亮起。

### 屏幕文字

```text
将安装
Skills / Commands · Subagents · Hooks
MCP server · LSP server
上下文成本
/reload-plugins
/commit-commands:commit
```

### Visual Type

`UI Simulation + State Change`

## Scene 07｜plugin.json 在里面，组件目录在外面

### 视觉目标

用目录树和错误移动展示插件结构的关键边界。

### 主要画面

左侧显示正确目录树，右侧放大 `.claude-plugin/plugin.json` 的 name、description、version。随后 `skills/` 被拖进 `.claude-plugin/`，skill 状态消失，再回到根目录恢复。

### 动画

1. `plugin.json` 的三个字段依次高亮。
2. `skills/`、`agents/`、`hooks/` 在根目录出现。
3. `skills/` 错误移入 `.claude-plugin/`，显示“skill 不出现”。
4. 移回根目录，显示“结构正确”。

### 屏幕文字

```text
.claude-plugin/plugin.json
name · description · version
skills/ · agents/ · hooks/
.claude-plugin/：只放 plugin.json
```

### Visual Type

`Code Exploration + Before/After`

## Scene 08｜不用发市场，也能本地测试插件

### 视觉目标

展示本地开发测试的最短闭环。

### 主要画面

左侧 Terminal 输入 `claude --plugin-dir ./my-first-plugin`，中间显示本地插件目录，右侧命令状态先为“未加载”，刷新后变为“本地插件已加载”。

### 动画

1. 启动命令输入完成。
2. 本地目录树连接到 Claude Code。
3. 修改标记出现在目录旁。
4. `/reload-plugins` 后命令状态变为可用。

### 屏幕文字

```text
claude --plugin-dir ./my-first-plugin
修改插件目录
/reload-plugins
本地插件已加载
```

### Visual Type

`Terminal Demo + Process`

## Scene 09｜第三方插件，先过信任三查

### 视觉目标

把“插件可以运行代码”转换为安装前可执行的三道检查。

### 主要画面

左侧是来源卡，中间是“将安装”组件卡，右侧是范围选择卡。陌生来源、hook／MCP／bin 和用户范围分别触发警告；通过检查后范围切换为本地。

### 动画

1. 来源卡先经过“可信来源？”闸门。
2. 组件卡展开 hook、MCP server、可执行文件。
3. 用户范围向所有项目扩散，随后被收缩回本地范围。
4. 三道检查通过后才出现“允许安装”。

### 屏幕文字

```text
信任三查
来源可信吗？
它带了什么？
范围给到哪？
用户范围 → 本地范围
```

### Visual Type

`Security Diagram + Trust Gate`

## Scene 10｜插件强在规模，安装前还要判断

### 视觉目标

用少量映射卡收束“规模价值、两步流程、结构边界、安全检查”。

### 主要画面

四条窄卡依次出现：规模化复用、市场两步、目录铁律、信任三查。中央结论固定为“先看清，再安装”，让信息密度保持在可读范围。

### 动画

1. 四条结论卡按叙事顺序出现。
2. “加市场 ≠ 装插件”短暂放大。
3. `.claude-plugin/` 只放 `plugin.json` 亮起。
4. 来源／内容／范围三项合并为中央结论。

### 屏幕文字

```text
规模化复用 → 插件
加市场 ≠ 装插件
.claude-plugin/ 只放 plugin.json
来源 · 内容 · 范围
先看清，再安装
```

### Visual Type

`Summary + Decision Cards`

## Scene 11｜下一篇：记忆系统

### 视觉目标

把源文档已有的系列预告作为最后一个独立事件，并避开幕内字幕区域。

### 主要画面

总结卡降低亮度后，中央出现下一篇预告卡，标题为“记忆系统（memory）”，下方只保留源文档已有的“让 Claude 跨会话记住你”语义。

### 动画

1. Scene 10 的总结卡淡出。
2. “下一篇 25”标签先出现。
3. “记忆系统（memory）”标题展开。
4. 预告卡停留约 2—3 秒，字幕区域保持空出。

### 屏幕文字

```text
下一篇 25
记忆系统（memory）
让 Claude 跨会话“记住”你
```

### Visual Type

`Next Episode Teaser`

## 全片视觉类型／组件／动画标准

### 视觉类型

- `Process`：散件交接、市场两步、本地测试。
- `Concept Diagram`：插件盒子和组件关系。
- `Decision Diagram`：散装与插件的选择、安装范围。
- `Comparison`：三个市场和信任层级。
- `UI Simulation`：`/plugin` 详情、刷新和命名空间命令。
- `Code Exploration`：插件目录树和 `plugin.json`。
- `Security Diagram`：信任三查与权限范围收缩。
- `Summary + Teaser`：结尾判断和下一篇预告。

### 组件

- 深色 Workspace、File Chip、Plugin Box、Component Node、Shelf Card。
- Decision Rail、Market Layer、Install Manifest、Context Cost Meter、Scope Selector。
- Directory Tree、Command Segment、Trust Gate、Summary Card、Teaser Card、幕内字幕胶囊。

### 动画

- 一级信息动画：文件聚拢、盒子展开、市场注册、插件移动、目录移动、范围收缩。
- 二级注意力动画：高亮 `marketplace add`、`plugin install`、`/reload-plugins`、`plugin.json` 和三项信任检查。
- 三级装饰动画：仅使用轻微光晕、透明度和面板淡入，不使用无意义粒子和复杂转场。

### 输出边界

- 视觉原型包含上一幕／下一幕、自动播放和进度提示，仅服务于原型检查。
- 这些预览控件、调试状态和制作说明不得进入未来正式 Composition 或 MP4。
- 本阶段不生成 TTS、`tts-script.json`、音频、字幕、Timeline，不修改 `src/videos/`。

## Gate 2 内部审查结论

- 11 个 Scene 的口播均只保留实际朗读内容，没有加入“本段作用”、视觉说明、制作备注或 Gate 清单。
- 口播来自 Scene Script，声音承担解释、因果、转折和结论；画面承担文件聚拢、市场流程、目录结构、状态变化和信任检查。
- 所有画面文字均可追溯到指定 `source.md`、Content Analysis、Video Narrative、Scene Script 或本 Visual Script；没有复用其他视频的业务语义或状态文字。
- 散装／插件选择、市场两步、三个市场、安装清单、上下文成本、目录铁律、本地测试和信任三查均有对应视觉事件。
- 最后一幕只展示 source 已给出的下一篇 25“记忆系统（memory）”预告，没有读取或处理下一篇文章。
- 原型导航、进度提示和制作说明只属于预览层，不进入未来正式输出。
- 不执行文章中的命令，不生成 TTS、音频、字幕、Timeline，不进入 Remotion。

**Gate 2 结论：通过，可停止在 Visual Prototype 阶段。**

## 下一步

打开 `visual-prototype.html` 检查整体视觉方向、信息密度、Scene 结构和画面文字归属。本任务在原型检查完成后停止，不进入 TTS 或 Remotion。
