# Claude Code 视频化 · 第五步：Narration Script

## Scene 01｜三字符替代重启

很多人刚用 Claude Code 时，想清空对话，会先按 Ctrl+C 退出 claude，再重新启动，等它重新加载项目和 CLAUDE.md。前后快十秒，连着做上两周，还以为这就是重开对话的正常方式。

其实在会话里打三个字符就够了：/clear。它会直接开一段空上下文的新对话，旧对话还可以用 /resume 找回来。

## Scene 02｜/ 是 Claude Code 的控制面板

斜杠命令不是说给 Claude 听的普通需求，而是直接控制 Claude Code 这个程序本身。/clear 负责清上下文，/model 可以切换模型，/init 可以为项目生成一份起步的 CLAUDE.md。

你可以把它想成 Claude Code 的遥控器。普通任务是让模型帮你做事，斜杠命令则是在调整这台工具本身。

## Scene 03｜命令只认消息开头

斜杠命令有一个必须记住的边界：/ 必须是这条消息的第一个字符。命令名称后面的文字会作为参数传给它。

所以，单独发送 /clear 会执行清空；但如果你说“帮我解释 /clear 是什么”，中间的 /clear 只是普通文字。这个规则也让你可以安全地讨论命令，而不会一提到它就误触发。

## Scene 04｜按你正在做什么查命令

内置命令有几十个，不需要硬背。刚进项目时，可以看 /init、/memory、/mcp、/agents 和 /permissions；干活中途，常用的是 /model、/clear、/compact、/context 和 /plan；交付前，可以用 /diff、/review、/security-review 和 /code-review。

还有 /help、/config、/doctor、/resume、/skills 和 /rewind 这些杂项与恢复入口。真正要以哪一张菜单为准？打一个 /，再输入几个字母筛选。你当前设备、账号和环境里显示的，才是此刻真正可用的全集。

## Scene 05｜文件名就是命令名

如果有一段提示你反复输入，比如每次审查改动都要提醒同样的三条规则，就别再手打了。把它写进 .claude/commands/review.md，文件名去掉 md 后缀，就会得到一个 /review。

项目级的 .claude/commands/ 会跟着项目进入版本库，适合团队共同使用；个人级的 ~/.claude/commands/ 跨项目都能用，但它属于你自己。一个是项目流程，一个是个人习惯。

## Scene 06｜参数与 frontmatter 给命令加边界

固定提示还不够灵活时，可以用 $ARGUMENTS 接住命令名后的整串输入。比如运行 /fix-issue 123，123 就会被替换到 $ARGUMENTS 的位置。

如果要接收多个独立值，可以用 $0、$1 和 $2。多词的值要放进引号，否则空格会把它拆成多个参数。

命令文件开头的 frontmatter 还能控制行为。description 说明命令是做什么的；disable-model-invocation: true 可以让带副作用的命令只能由你手动喊；allowed-tools 则可以限制它活动时允许使用的工具。

## Scene 07｜发送前注入现场数据

自定义命令还可以在发给 Claude 之前先填入现场数据。比如在命令里写一行行首的感叹号加反引号命令，让它先执行 git diff HEAD，再把真实输出替换进提示。

这样 Claude 收到的就不是“请去查看当前改动”，而是已经带着当前改动的审查任务。这个能力很方便，但团队也可以用 disableSkillShellExecution 把这类 shell 执行关掉，避免共享命令在发送前运行不想运行的内容。

## Scene 08｜命令来源各有自己的名字

当 command、Skill、插件和 MCP 都能出现在斜杠菜单里，命名规则就很重要。如果你自己的 Skill 和 command 同名，Skill 优先。

插件不会直接抢你的名字，而是加上插件名作为命名空间，比如 plugin-name:skill-name。MCP server 暴露的提示则会使用 /mcp__server__prompt 这样的双下划线格式。看到前缀，就能知道命令来自哪里。

## Scene 09｜command 还是 Skill

斜杠命令和 Skill 并不是两套互相排斥的能力。官方已经把自定义 command 合并进 Skill 体系，.claude/commands/deploy.md 和 .claude/skills/deploy/SKILL.md 都可以创建 /deploy。

如果只是一个简单提示，自己手动喊一下，单个 markdown 文件已经够用。想带模板、脚本和其他配套文件，或者希望 Claude 在合适时自动触发，就更适合用 Skill。前者是轻量入口，后者是更完整的能力目录。

## Scene 10｜五分钟刻出 /explain

现在照着五步做一个带参数的 /explain。第一步，在项目里创建 .claude/commands/ 目录。第二步，新建 explain.md，写上 description，再把 $ARGUMENTS 和解释要求放进文件内容里。

第三步启动 Claude，打一个 /，确认菜单里出现 /explain。第四步运行 /explain print(sum([1,2,3]) / len([1,2,3]))，它会把这段代码当作参数，用大白话解释平均值。

第五步换一个参数，再运行 /explain ZeroDivisionError: division by zero。命令模板没有变，但输入变了，解释重点也会变成除数为零的原因和修改方法。

当你看到同一个文件、同一个命令，已经能接住两次不同输入时，就亲手验证了文件名映射、frontmatter 和 $ARGUMENTS 这三件核心能力。

## Scene 11｜把重复提示变成工作流入口

现在回头看，斜杠命令就是 Claude Code 的控制面板。内置命令不用背，按你正在做什么去菜单里查；重复提示可以放进 markdown 文件，变成团队共享或个人复用的快捷动作。

需要变化时，用 $ARGUMENTS 和位置参数传入输入；需要边界时，用 frontmatter 控制自动调用和工具范围；需要现场感时，在发送前注入 git diff。把这些能力串起来，/ 就不再只是一个菜单，而是你自己的工作流入口。

下一篇是 37「检查点」。这一篇只带过的 /rewind，会在那里继续展开：当代码和对话走偏时，怎样像游戏存档一样一起倒带到干净状态。
