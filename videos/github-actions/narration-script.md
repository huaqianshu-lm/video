# GitHub Actions 视频化 · 第四步：Narration Script

## Scene 01｜人已经睡了，PR 还在等 review

半夜十一点，你已经躺下了，团队群里却有人说：这个 PR 卡了一天，明天就要上线。要是仓库已经配好 Claude Code GitHub Actions，等你醒来之前，评论区里可能已经躺着一份自动跑出来的 review。

## Scene 02｜Claude Code 住进 GitHub runner

前面我们用 Claude Code，通常是人在电脑前打开终端，启动它，再看着它工作。这一篇要解决的是另一件事：把同一个 Claude Code 搬进 GitHub 的服务器里。以后触发它的，不只是你敲的命令，也可以是评论、PR 更新或定时事件。它仍然会读仓库代码和根目录的 CLAUDE.md，只是不用等你一直在场。

## Scene 03｜@claude，不是 /claude

最核心的入口，是在 issue 或 PR 的评论里提到 @claude。你可以让它按 issue 描述实现功能，也可以让它检查认证问题或修一个 TypeError。它会自动读评论上下文、相关代码和 CLAUDE.md。这里千万别把符号打错：GitHub 评论认的是 @claude，不是 /claude。前者是云端触发，后者不是这条工作流的入口。

## Scene 04｜装上三件套，给最小工牌

要让 @claude 真正响应，仓库里要先装好三样东西：GitHub App、ANTHROPIC_API_KEY，以及 .github/workflows/ 里的 workflow。最省事的办法，是在本地 Claude Code 会话里执行 /install-github-app。前提是你有仓库管理员权限，而且使用的是直接 Claude API。App 的工牌也不要发太大，只需要 Contents、Issues 和 Pull requests 三项读写权限。

## Scene 05｜workflow 是值班表

装好以后，真正决定它什么时候上班、上班做什么的，是 workflow YAML。可以把它看成一张值班表：name 是名字，on 写触发条件，jobs 写任务和 runner，steps 写具体动作。最小配置会在评论创建时启动，在 ubuntu-latest 上调用 anthropics/claude-code-action@v1，再从 Secrets 里取出 API key。

## Scene 06｜prompt 决定它等你还是自动跑

v1 有一个很关键的判断：没有 prompt，就是交互模式，等评论里的 @claude；写了 prompt，就是自动化模式，触发后直接按指令执行。像 --max-turns 和 --model 这样的 CLI 参数，则统一放进 claude_args。记住这一条，看到 workflow 时就能判断它是在等人派活，还是会自己启动。

## Scene 07｜PR 一更新，自动 review

第一个用例是自动 code review。把触发条件设成 pull_request 的 opened 和 synchronize，再给 action 一个 prompt。这样 PR 刚开出来，或者有人推了新提交，Claude 就会在 runner 上自动检查代码质量、正确性和安全性，不需要任何人再 @ 它。

## Scene 08｜issue 变成一个新 PR

第二个用例是按 issue 派活。issue 描述写清楚以后，在评论里说：@claude 按这个 issue 的描述把功能实现了。它会读取上下文和项目规则，在新分支上修改代码，最后开一个 PR 供你审查。修 bug 也是同样的路径，区别只在于你给它的任务描述是什么。

## Scene 09｜到点生成报告

第三个用例是定时任务。workflow 用 schedule 监听 cron，到每天九点时触发，再用 prompt 让 Claude 生成昨日提交和待办 issue 的汇总。这一次没有人评论，也没有人 @ 它，时间到了，任务自己开始。

## Scene 10｜真实 key 进保险柜

云端自动跑得越方便，密钥安全就越不能省。真实的 API key 绝不能直接写进 YAML 提交到仓库。正确做法是把它存成名为 ANTHROPIC_API_KEY 的 GitHub Secret，workflow 里只写 secrets.ANTHROPIC_API_KEY 这个引用。除此之外，还要保持最小权限，警惕陌生 issue 和 PR 里的提示注入，并把 Claude 开出的 PR 当成实习生交的活，合并前自己审一遍。

## Scene 11｜五分钟跑通闭环

真正验证时，找一个有管理员权限且不重要的测试仓库。第一步，在本地 Claude Code 里执行 /install-github-app。第二步，确认 .github/workflows/claude.yml 已经出现。第三步，在 Settings 的 Actions Secrets 里确认有 ANTHROPIC_API_KEY。第四步，开一个测试 issue，评论一句具体的 @claude 任务。第五步，观察 Actions 运行、issue 回评和新 PR，确认 diff 没有问题以后再合并。

## Scene 12｜从触发到执行，再往下一层

所以，这一篇的主线可以压缩成六句话：Claude Code 搬进 GitHub runner，@claude 负责交互触发，workflow 决定什么时候运行，prompt 区分自动化和交互，GitHub Secrets 保护密钥，人工审查守住最后一道边界。下一篇 Agent SDK，会继续往下揭开这一层：如果触发和执行不想交给现成的 GitHub Actions，而是想用代码把 Claude Code 嵌进自己的程序，该怎么做。
