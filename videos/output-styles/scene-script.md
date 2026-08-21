# Scene Script｜Output Styles

## Scene 01｜默认工程师，不等于所有角色

- **sceneId**：`scene-01`
- **title**：默认工程师，不等于所有角色
- **purpose**：用改简历的错位说明“把回应方式写进 CLAUDE.md”并不稳定。
- **narrativeRole**：问题钩子
- **narrationIntent**：解释默认工程师人格与写作助手需求的冲突，提出 output style 的问题。
- **visualIntent**：左侧展示简历任务，右侧弹出“拆函数／加测试”的工程化回应，形成错位。
- **visualType**：双窗口错位对比
- **keyOnScreenText**：`改简历`、`拆函数`、`加测试`、`这不是项目知识问题`
- **videoValue**：用同屏对照同时呈现需求与错误回应，直观看到角色错位。

## Scene 02｜改的是方式，不是知识

- **sceneId**：`scene-02`
- **title**：改的是方式，不是知识
- **purpose**：钉住本片核心命题，区分“知道什么”和“怎么回应”。
- **narrativeRole**：核心定义
- **narrationIntent**：说明 output styles 修改系统提示中的角色、语气和格式，不给项目增加新知识。
- **visualIntent**：同一 Claude 卡片保持不变，向两侧分出“项目知识”和“响应方式”，只点亮后者。
- **visualType**：概念分层图
- **keyOnScreenText**：`Output styles`、`知道什么`、`怎么回应`、`系统提示`
- **videoValue**：动画高亮“怎么回应”而不是只读定义，建立视觉直觉。

## Scene 03｜四档内置样式怎么选

- **sceneId**：`scene-03`
- **title**：四档内置样式怎么选
- **purpose**：让观众能按任务选择 Default、Proactive、Explanatory、Learning。
- **narrativeRole**：选项展开
- **narrationIntent**：解释四档样式的行为差异、使用场景，以及 Explanatory 和 Learning 响应更长。
- **visualIntent**：四张卡片依次亮起，最后两张显示“更长响应”的提醒。
- **visualType**：四卡片对照
- **keyOnScreenText**：`Default`、`Proactive`、`Explanatory`、`Learning`、`更长响应`
- **videoValue**：卡片并列与逐项高亮比连续口播更容易形成选择记忆。

## Scene 04｜切换入口已经变了

- **sceneId**：`scene-04`
- **title**：切换入口已经变了
- **purpose**：解决旧教程仍使用 `/output-style` 的版本变更坑。
- **narrativeRole**：操作转折
- **narrationIntent**：说明旧命令在 `v2.1.73` 弃用、`v2.1.91` 移除，现在使用 `/config` 或 `outputStyle`。
- **visualIntent**：旧命令被划掉，当前两条路径分别流向菜单和 settings 字段。
- **visualType**：命令迁移图
- **keyOnScreenText**：`/output-style`、`v2.1.73`、`v2.1.91`、`/config`、`outputStyle`
- **videoValue**：用迁移动画把“不能再用”与“现在怎么做”同时呈现。

## Scene 05｜切完为什么没变化

- **sceneId**：`scene-05`
- **title**：切完为什么没变化
- **purpose**：解释样式在会话开始读取，修改后需要 `/clear` 或新会话。
- **narrativeRole**：排坑说明
- **narrationIntent**：解释选择保存不等于当前会话立刻重组系统提示。
- **visualIntent**：时间线从“选择样式”停在旧会话，经过 `/clear` 或“新会话”后进入“新系统提示”。
- **visualType**：生效时间线
- **keyOnScreenText**：`会话开始读取`、`/clear`、`新会话`、`新系统提示`
- **videoValue**：状态停顿和重新点亮能证明生效时机，而不只是声明规则。

## Scene 06｜自定义样式就是一个 Markdown 文件

- **sceneId**：`scene-06`
- **title**：自定义样式就是一个 Markdown 文件
- **purpose**：把自定义样式的文件结构与作用范围具体化。
- **narrativeRole**：能力展开
- **narrationIntent**：说明 frontmatter、正文、文件名命名规则和三个存放级别。
- **visualIntent**：展开 `diagrams-first.md`，上方是 frontmatter，下方是正文，旁边分出三个存放级别。
- **visualType**：文件结构与作用域分层
- **keyOnScreenText**：`diagrams-first.md`、`frontmatter`、`正文`、`用户级`、`项目级`、`托管策略级`
- **videoValue**：文件展开、字段高亮和作用域分流适合用动画建立结构关系。

## Scene 07｜`keep-coding-instructions` 的二分题

- **sceneId**：`scene-07`
- **title**：`keep-coding-instructions` 的二分题
- **purpose**：让观众根据是否仍编程决定保留还是移除工程指令。
- **narrativeRole**：关键判断
- **narrationIntent**：解释 `true` 与省略字段的适用条件及按反后的角色偏移。
- **visualIntent**：从“这样式 Claude 还编程吗？”分到两个结果：`true` 保留工程指令，省略字段移除工程指令。
- **visualType**：二分决策图
- **keyOnScreenText**：`这样式 Claude 还编程吗？`、`true`、`省略字段`、`保留工程指令`、`移除工程指令`
- **videoValue**：分支动画能把一个容易混淆的字段变成可执行判断。

## Scene 08｜样式如何进入系统提示

- **sceneId**：`scene-08`
- **title**：样式如何进入系统提示
- **purpose**：解释样式拼入系统提示末尾、持续提醒和 token 影响。
- **narrativeRole**：机制解释
- **narrationIntent**：把“每个回应都生效”“会话中反复提醒”“输入与输出成本”串成一个底层模型。
- **visualIntent**：系统提示容器依次接收工程指令、样式说明和会话提醒；自定义样式的工程指令按开关保留或移除。
- **visualType**：系统提示组装图
- **keyOnScreenText**：`系统提示`、`内置工程指令`、`样式说明`、`会话提醒`、`prompt caching`
- **videoValue**：拼装与重复提醒是时间上的机制，动画比静态列表更能表达。

## Scene 09｜五种工具，各管一个抽屉

- **sceneId**：`scene-09`
- **title**：五种工具，各管一个抽屉
- **purpose**：消除 output style 与 CLAUDE.md、参数、Subagent、Skill 的混淆。
- **narrativeRole**：边界归纳
- **narrationIntent**：按持续方式、内容类型和作用范围区分五种工具。
- **visualIntent**：五列矩阵逐列点亮，顶部用“方式／内容／一次性／独立任务／按需工作流”归类。
- **visualType**：功能边界矩阵
- **keyOnScreenText**：`output style`、`CLAUDE.md`、`--append-system-prompt`、`Subagent`、`Skill`
- **videoValue**：矩阵能同时呈现多个工具的差异，避免逐个解释后仍混淆。

## Scene 10｜实操：建文件并选择样式

- **sceneId**：`scene-10`
- **title**：实操：建文件并选择样式
- **purpose**：把抽象规则落到一个可复现的自定义样式。
- **narrativeRole**：实操开始
- **narrationIntent**：说明创建文件、写入 frontmatter 和正文、在 `/config` 中选择的预期结果。
- **visualIntent**：终端只展示 `mkdir -p ~/.claude/output-styles`，编辑器展示 `diagrams-first.md`，菜单出现样式名与描述。
- **visualType**：文件编辑与菜单模拟
- **keyOnScreenText**：`mkdir -p ~/.claude/output-styles`、`Diagrams first`、`每次解释都先画图，再用文字说明`、`/config`
- **videoValue**：文件、菜单和被识别状态的连续出现形成“做了什么→看到什么”的验证链。

## Scene 11｜实操：`/clear` 后验证差异

- **sceneId**：`scene-11`
- **title**：实操：`/clear` 后验证差异
- **purpose**：用一个具体问题确认自定义样式改变了回应顺序。
- **narrativeRole**：实操验证
- **narrationIntent**：解释 `/clear` 后提问，预期先出现 Mermaid 图，再出现文字；切回 Default 可做对照。
- **visualIntent**：依次出现 `/clear`、请求路径 Mermaid 图、文字解释，再切到 Default 显示“只给文字”的对照。
- **visualType**：验证前后对比
- **keyOnScreenText**：`/clear`、`解释一下用户登录的请求是怎么从前端走到数据库的`、`Mermaid`、`图在前，文字在后`、`Default`
- **videoValue**：前后状态差异是 output style“改变怎么回应”的直接证据。

## Scene 12｜换方式，不换知识；下一篇 Hooks

- **sceneId**：`scene-12`
- **title**：换方式，不换知识；下一篇 Hooks
- **purpose**：收束核心规则并完成系列承接。
- **narrativeRole**：总结与预告
- **narrationIntent**：回顾六个核心判断，强调方式归 output style、内容归 CLAUDE.md，最后预告第 33 篇 Hooks。
- **visualIntent**：六个关键词汇聚后，最后才出现 `33「钩子（Hooks）」` 预告卡，避开字幕区域。
- **visualType**：总结汇聚与系列预告
- **keyOnScreenText**：`怎么回应`、`Default / Proactive / Explanatory / Learning`、`/config`、`/clear`、`keep-coding-instructions`、`33「钩子（Hooks）」`
- **videoValue**：汇聚动画让分散规则形成记忆路径，预告作为最后事件完成系列连续性。

## Gate 1 内部审查结果

- [x] 12 个 Scene 均包含 `sceneId`、`title`、`purpose`、`narrativeRole`、`narrationIntent`、`visualIntent`、`visualType`、`keyOnScreenText`、`videoValue`。
- [x] 每幕只有一个主要认知任务，且均有明确 Video Value。
- [x] Scene 01—12 与 Video Narrative 的认知顺序一致。
- [x] Scene 12 的下一集预告是最后一个视觉事件。

