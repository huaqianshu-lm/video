# Claude Code 视频化 · 第一步：Content Analysis

## 1. 内容范围

- 来源：36-slash-commands.md
- 视频 slug：slash-commands
- 主题：Claude Code 斜杠命令：从内置控制按钮到可复用的自定义流程
- 本分析只使用指定文章正文；文章中提到的上一篇、下一篇和示例命令只作为当前文章的叙事或知识来源，不读取其他文章。
- 文章中的命令、路径、参数和 shell 语法都是待分析内容，本阶段不执行其中任何命令。

## 2. 核心命题

斜杠命令不是给模型追加一句普通需求，而是从 Claude Code 会话内部直接控制程序的入口。打一个位于消息开头的 /，用户可以查找内置控制动作，也可以把反复输入的提示做成项目级或个人级的自定义命令；再加上参数、frontmatter 和动态上下文注入，短指令就能稳定触发一套可复用流程。

视频需要让观众完成这条认知迁移：

~~~text
把 / 当成普通文字
    ↓
理解它是 Claude Code 的控制面板
    ↓
按场景查内置命令，而不是死记清单
    ↓
用 markdown 文件刻出自定义命令
    ↓
用参数、frontmatter 和现场数据控制行为
    ↓
分清命名空间、Skill 和手动调用边界
    ↓
用 /explain 完成一次可验证的自定义命令闭环
~~~

## 3. 观众需要完成的认知变化

1. 知道斜杠命令控制的是 Claude Code 程序本身，不是把一条普通任务交给模型。
2. 知道命令只有在消息开头才会被识别，正文中的 /clear 只是普通文字。
3. 能按使用场景查找 /init、/memory、/mcp、/agents、/permissions、/model、/clear、/compact、/context、/plan、/diff、/review、/help 等代表命令，并接受当前设备菜单才是可用全集。
4. 能在 .claude/commands/ 与 ~/.claude/commands/ 之间选择项目共享或个人跨项目的作用范围。
5. 能用文件名创建命令，并用 $ARGUMENTS 或 $0、$1、$2 接住输入。
6. 知道多词的位置参数需要引号，$ARGUMENTS 则保留整串输入。
7. 理解 description、disable-model-invocation 和 allowed-tools 如何分别影响发现、自动触发和工具范围。
8. 能解释动态上下文注入：命令在发给 Claude 前先执行 git diff 等 shell 命令，把输出替换进提示。
9. 能区分 Skill 优先于同名 command、插件命令使用 plugin-name:skill-name 命名空间、MCP 提示使用 /mcp__server__prompt 格式。
10. 能照着文章的五步流程创建并验证带参数的 /explain。

## 4. 知识骨架与关系

### A. 斜杠命令的控制边界

- 普通任务是对模型说“帮我做什么”。
- 斜杠命令是直接控制 Claude Code：切模型、清上下文、跑流程或打开面板。
- / 必须是消息第一个字符；其后的文本作为命令参数。
- 单独输入 / 可打开当前可用命令菜单，继续输入字母可以筛选。

### B. 内置命令的使用地图

- 进入项目：/init、/memory、/mcp、/agents、/permissions。
- 会话中途：/model、/clear、/compact、/context、/plan。
- 交付前检查：/diff、/review、/security-review、/code-review。
- 杂项与恢复：/help、/config、/doctor、/resume、/skills、/rewind。
- 内置命令、Skill 和 Workflow 的调用入口相同，但底层实现不同；具体可用性受平台、套餐和环境影响。

### C. 自定义命令的文件与作用域

~~~text
.claude/commands/review.md
        ↓
/review
~~~

- 项目级命令进入当前项目版本库，团队可以共同使用。
- 个人级命令放在 ~/.claude/commands/，跨项目可用但不随项目共享。
- 文件名去掉 .md 后缀就是命令名。

### D. 参数和行为控制

- $ARGUMENTS 接收命令名后的整串输入。
- $0、$1、$2 或 $ARGUMENTS[N] 按位置取参数；多词值需要引号。
- description 说明命令用途。
- disable-model-invocation: true 把带副作用的命令锁为手动调用。
- allowed-tools 可限制命令活动时可用的工具。

### E. 动态上下文、命名空间与 Skill

- 行首的 ! 加反引号命令语法会在提示发送前执行 shell 命令，并把输出替换到提示中。
- disableSkillShellExecution 可禁用这类 shell 执行。
- 同名 Skill 优先于 command。
- 插件使用 plugin-name:skill-name 命名空间；MCP server 提示使用 /mcp__server__prompt。
- 自定义 command 已合并进 Skill 体系；简单手动提示适合 command，需要配套文件、自动触发或渐进式披露时适合 Skill。

## 5. 必须保留的信息

1. 开场的 /clear 对比手动退出重启，证明斜杠命令节省的是会话内的控制成本。
2. 斜杠命令的定义、控制对象和“只能在消息开头识别”的边界。
3. 按场景分组的代表性内置命令，以及“当前菜单才是真实全集”的提醒。
4. .claude/commands/ 的文件名映射和项目级／个人级作用域。
5. $ARGUMENTS 与 $0、$1 的传参差异，以及引号规则。
6. frontmatter 的 description、disable-model-invocation 和 allowed-tools。
7. 动态上下文注入的执行顺序、git diff 示例和禁用开关。
8. Skill、插件命名空间和 MCP 提示三种来源的区别。
9. /explain 的目录、文件、识别、调用和换参数验证闭环。
10. 结尾从控制面板到个人工作流入口的心智模型，以及下一篇 37「检查点」预告。

## 6. 可视觉化内容

- 手动退出、重启和重新加载，与会话内 /clear 的时间成本对比。
- 普通任务气泡与 Claude Code 控制面板之间的分流。
- “/ 开头”与“句中 /clear”的识别／不识别状态。
- 按进入项目、干活中、交付前、杂项分组的命令速查板。
- markdown 文件到 /review 命令的文件映射。
- $ARGUMENTS 的整串替换与 $0、$1、$2 的位置分栏。
- frontmatter 的描述、自动调用和工具权限三层护栏。
- git diff 输出在发送前注入提示的动态数据流。
- Skill 优先级、插件命名空间和 MCP 双下划线格式的分支。
- /explain 从目录创建到两次不同参数验证的五步流程。

## 7. 可以弱化的信息

- 文章中引用的上一篇 35 只作为开场导航，不延展权限模式内容。
- 完整内置命令表不逐个演示，保留按使用场景查找的办法和代表命令。
- 版本、平台、套餐的个别例子压缩成“当前菜单受环境影响”的边界提醒。
- Windows 建目录方法作为实操补充，不单独设置视觉事件。
- disableSkillShellExecution 保留为团队安全边界，不展开设置细节。
- 斜杠命令与 Skill 的完整历史不展开，保留“调用方式与能力本体”的关系。

## 8. 事实边界与画面文字归属

- 当前视频只复述指定文章已经给出的斜杠命令行为、文件路径、参数、frontmatter、命名空间和 /explain 示例，不补充未在文章中说明的命令行为。
- 视觉原型中的命令名、路径、参数、状态词、字段和下一篇标题均可在 source.md 或本分析中找到依据。
- 原型交互控件“上一幕／下一幕／自动播放”、Scene 计数和进度提示只服务于原型浏览，不属于视频画面内容，未来不得进入正式 Composition。
- 不执行 source.md 中的 mkdir、claude、/explain、git diff 或其他命令。
- 不把参考视频的业务语义、固定文案或状态文字带入本片。

## 9. Gate 1 内部审查结论

- 核心命题明确：斜杠命令是 Claude Code 的控制面板，也是把重复提示变成可复用流程的入口。
- 知识关系完整：控制边界、内置命令地图、自定义文件、参数、frontmatter、动态上下文、命名空间、Skill 和实操闭环互相承接。
- 叙事可视化：每个关键概念都有菜单、分流、文件映射、字段替换、护栏、数据注入或流程状态变化承载。
- 信息取舍符合视频价值：不把几十个命令做成静态长表，而是用“按场景查找”和一次 /explain 实操建立使用直觉。
- 事实边界明确：只使用指定文章，不执行其中命令，不读取或处理下一篇文章。
- 11 个 Scene 可落到现有 OpeningScene、ConceptScene、ComparisonScene、StepListScene、TerminalScene 和 SummaryScene。

**结论：Gate 1 内容分析通过，可进入 Video Narrative 与 Scene Script。**
