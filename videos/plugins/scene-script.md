# 插件（Plugins）视频化 · 第三步：Scene Script

> 目标：把“散件配置如何变成可复用插件，以及如何安全地安装插件”拆成可独立表达的视觉事件。每个 Scene 只承担一个主要认知任务。

## Scene 01｜散件交接，最容易漏一处

### purpose
用新同事接手一套 `subagent + hook + MCP` 配置的场景制造问题，展示配置散落在多个位置时的交接风险。

### narrativeRole
Hook：先让观众看到“文件都讲过了但还是跑不一样”，引出打包需求。

### narrationIntent
解释 `agents/`、`settings.json`、`.mcp.json` 分散存在，靠口头交代容易漏项；问题来自散件管理的结构，而不是某个人粗心。

### visualIntent
把多个配置文件从不同抽屉递给新同事，其中一个 hook 或 MCP 文件掉在交接路径外，最终状态显示配置不一致。

### visualType
`Process + Before/After`

### keyOnScreenText
```text
agents/
settings.json
.mcp.json
交接结果：漏了一处
散件管理：又累又容易出错
```

### videoValue
“分散、口头交接、漏项、结果不一致”是连续过程，视频可以用文件移动和状态变化让风险直接可见。

## Scene 02｜插件是一个整体盒子

### purpose
给出插件定义，并让观众看到零碎扩展如何被收进一个自包含的文件夹。

### narrativeRole
Definition：在问题出现后给出官方答案的核心模型。

### narrationIntent
说明插件把 commands、subagents、skills、hooks、MCP server 和 LSP server 打成一个能整体安装、停用和分发的包。

### visualIntent
散件从多个文件位置沿连接线进入一个 Plugin 盒子，盒子展开五类组件，并标记“整体装／整体停／整体分发”。

### visualType
`Concept Diagram + Connection Diagram`

### keyOnScreenText
```text
Plugin
自包含文件夹
Skill / Command
Subagent · Hook · MCP server · LSP server
整体装 · 整体停 · 整体分发
```

### videoValue
插件的“容器”和“整体操作”需要通过聚拢与展开建立空间直觉，比只读定义更清楚。

## Scene 03｜散装还是插件，看你要不要规模化

### purpose
建立散装配置与插件的适用边界，避免观众把插件当成所有场景的默认选择。

### narrativeRole
Choice：从“插件是什么”推进到“什么时候值得用”。

### narrationIntent
说明单项目自用、个人工作流和快速试验可用散装；团队／社区共享、跨项目复用和版本化发布更适合插件，并解释命名空间和版本号的差异。

### visualIntent
中央任务卡向两侧分流：小范围个人试验进入 `.claude/`，共享／复用／更新需求进入 Plugin；命名空间和版本号在右侧亮起。

### visualType
`Decision Diagram + Comparison`

### keyOnScreenText
```text
散装配置：单项目 · 个人 · 快速试验
插件：团队共享 · 跨项目复用 · 版本化发布
/hello  →  /my-plugin:hello
version → 更新路径
```

### videoValue
适用场景是选择关系，不是属性列表；分流动画能让观众记住“规模化才是插件价值”。

## Scene 04｜市场是两步：先加货架，再装插件

### purpose
纠正“加市场就等于装好插件”的常见误解，建立市场两步模型。

### narrativeRole
Mechanism：把市场概念变成可操作的顺序。

### narrationIntent
讲清 `/plugin marketplace add` 只是注册一个市场、让 Claude Code 看见货架；`/plugin install` 才是从指定市场安装具体插件。

### visualIntent
左侧货架由 `marketplace add` 注册并亮起，右侧具体插件仍未安装；第二步才把一个插件从货架移动到已安装区域。

### visualType
`Process + UI Simulation`

### keyOnScreenText
```text
1  加市场
/plugin marketplace add owner/repo
货架已出现 · 插件尚未安装
2  装插件
/plugin install plugin-name@marketplace-name
```

### videoValue
两步的差异由状态先后定义，画面能明确证明“看见货架”和“拥有插件”不是同一个动作。

## Scene 05｜三个市场，三种取用判断

### purpose
区分官方、社区和演示市场的定位，给观众一条取用顺序。

### narrativeRole
Classification：把“市场”从抽象货架拆成三类不同信任和用途。

### narrationIntent
说明官方市场自带且最稳，社区市场要手动添加并固定到具体提交，演示市场用于学习和试水；日常优先官方，缺少时再看社区。

### visualIntent
三层市场货架依次出现：官方精选、社区审核／固定提交、演示样板；每层显示是否需要添加和适用场景。

### visualType
`Comparison + Trust Gradient`

### keyOnScreenText
```text
claude-plugins-official · 官方精选 · 自带
claude-community · 社区贡献 · 固定提交
claude-code-plugins · 官方演示 · 学习试水
取用顺序：官方 → 社区 → 演示
```

### videoValue
市场名称、来源和用途是分层关系，画面排序能避免观众把三个名字当成同一种商店。

## Scene 06｜安装前看清内容，安装后刷新生效

### purpose
展示安装前的“将安装”清单、上下文成本和安装后的 `/reload-plugins`，把组件认知连接到实际使用。

### narrativeRole
Demonstration：从选择市场进入插件管理闭环。

### narrationIntent
说明插件可能带 skill、subagent、hook、MCP 和 LSP，不同组件的触发方式不同；安装前看清清单和上下文成本，安装或停用后用 `/reload-plugins` 刷新。

### visualIntent
`/plugin` 详情面板逐项展开组件和上下文成本，安装范围被选定；随后刷新按钮使命名空间命令出现在命令列表。

### visualType
`UI Simulation + State Change`

### keyOnScreenText
```text
将安装
Skills / Commands · Subagents · Hooks
MCP server · LSP server
上下文成本：先看清
/reload-plugins
/commit-commands:commit
```

### videoValue
“安装了什么”和“什么时候生效”依赖多个状态，视频可以把清单、成本、刷新和命令出现串成一条链。

## Scene 07｜plugin.json 在里面，组件目录在外面

### purpose
解释插件目录的身份证和根目录组件关系，并突出 `.claude-plugin/` 不能塞入其他目录的坑。

### narrativeRole
Mechanism：把插件盒子落到可以检查的文件结构。

### narrationIntent
说明 `.claude-plugin/plugin.json` 声明 name、description、version，skills、agents、hooks、`.mcp.json` 和 `.lsp.json` 位于插件根目录；`.claude-plugin/` 里只放 `plugin.json`。

### visualIntent
先展示正确目录树，随后把 `skills/` 错误拖入 `.claude-plugin/` 并显示“skill 不出现”，再移回根目录并恢复命名空间。

### visualType
`Code Exploration + Before/After`

### keyOnScreenText
```text
my-first-plugin/
├── .claude-plugin/plugin.json
├── skills/hello/SKILL.md
├── agents/
└── hooks/hooks.json
.claude-plugin/：只放 plugin.json
```

### videoValue
目录层级和错误位置会改变插件组件是否出现，树形结构移动比静态文字更能留下路径记忆。

## Scene 08｜不用发市场，也能本地测试插件

### purpose
展示开发者如何直接加载本地插件目录，完成修改、刷新和检查。

### narrativeRole
Demonstration：把目录结构从“认识”推进到“可验证”。

### narrationIntent
说明本地开发测试可用 `claude --plugin-dir ./my-first-plugin`，改完后运行 `/reload-plugins`，不用先发到市场再测试。

### visualIntent
终端输入本地目录启动命令，右侧插件目录树被加载，刷新后命名空间 skill 从缺失变为可用。

### visualType
`Terminal Demo + Process`

### keyOnScreenText
```text
claude --plugin-dir ./my-first-plugin
修改插件目录
/reload-plugins
本地插件已加载
```

### videoValue
“本地目录→加载→刷新→出现效果”是可复用的开发闭环，动态状态比单独展示命令更有操作价值。

## Scene 09｜第三方插件，先过信任三查

### purpose
建立插件不是无害小工具的安全边界，并给出安装前的三个检查项。

### narrativeRole
Constraint：在便利性之后补上阻止误装的关键判断。

### narrationIntent
说明插件能通过 hook、MCP server 或可执行文件，以用户权限在机器上运行代码；安装前检查来源、它带了什么和安装范围，不确定时先用本地范围。

### visualIntent
来源卡片经过信任检查，组件清单标出 hook／MCP／可执行文件，安装范围从用户范围收缩到本地范围；陌生来源停在警告闸前。

### visualType
`Security Diagram + Trust Gate`

### keyOnScreenText
```text
信任三查
1  来源可信吗？
2  它带了什么？
3  范围给到哪？
用户范围 → 本地范围
只从信任的来源安装
```

### videoValue
信任判断包含来源、能力和范围三个连续闸门，视频能展示安装范围收缩，而不只是重复安全提醒。

## Scene 10｜插件强在规模，安装前还要判断

### purpose
汇总插件选择、市场流程、目录结构和信任边界，形成可执行的判断线。

### narrativeRole
Summary：将大量命令和路径收束成少数关键选择。

### narrationIntent
回顾自用散装与规模化插件的区别、加市场与装插件的两步、安装前清单和上下文成本、根目录结构与信任三查，强调便利和安全要一起判断。

### visualIntent
四条结论轨道依次锁定：规模需求走插件、市场两步、根目录结构、信任三查；中央结论显示“先看清，再安装”。

### visualType
`Summary + Decision Cards`

### keyOnScreenText
```text
规模化复用 → 插件
加市场 ≠ 装插件
.claude-plugin/ 只放 plugin.json
来源 · 内容 · 范围
先看清，再安装
```

### videoValue
总结需要把流程和判断压缩成映射关系，画面可以让结论按顺序落位，而不是变成一页大段文字。

## Scene 11｜下一篇：记忆系统

### purpose
保留源文档已有的系列承接，把插件之后的主题作为最后一个独立视觉事件。

### narrativeRole
Teaser：结束本片并引出系列下一篇，不展开新主题。

### narrationIntent
只预告“工具装齐了之后，如何让 Claude 跨会话记住偏好和项目规矩”，不讲下一篇文章的具体内容。

### visualIntent
总结卡退场后出现独立的“下一篇 25：记忆系统（memory）”预告卡，停留在字幕安全区上方。

### visualType
`Next Episode Teaser`

### keyOnScreenText
```text
下一篇 25
记忆系统（memory）
让 Claude 跨会话“记住”你
```

### videoValue
系列预告是叙事闭环的最后视觉事件，需要独立停留，不能只藏在口播或制作备注中。

## Gate 1／Scene 结构检查

- 11 个 Scene 与 Video Narrative 一一对应，编号连续且每幕只有一个主要认知任务。
- 每幕均明确 `purpose`、`narrativeRole`、`narrationIntent`、`visualIntent`、`visualType`、`keyOnScreenText` 和 `videoValue`。
- 散件痛点、插件定义、适用选择、市场两步、三个市场、安装管理、目录结构、本地测试、信任检查、总结和下一篇预告均可追溯到 `source.md`。
- 所有命令只作为屏幕内容展示，不执行；未生成 TTS、音频、字幕或 Timeline。
- Scene 11 只使用源文档已有的下一篇标题和预告语义，没有读取或处理下一篇文章。

**Gate 1 结论：通过。**

## 下一步

基于本 Scene Script 生成纯口播 `narration-script.md` 和互补的 `visual-script.md`，再制作横屏 Visual Prototype。
