# GitHub Actions 视频化 · 第三步：Scene Script

> 目标：把 Video Narrative 拆成可制作的视频场景；每幕只承担一个主要认知任务。

## Scene 01｜人已经睡了，PR 还在等 review

- sceneId：`github-actions-01`
- title：人已经睡了，PR 还在等 review
- purpose：用深夜 PR 卡住的真实场景建立观看动机。
- narrativeRole：问题钩子。
- narrationIntent：说明本地 Claude Code 依赖人在场，而云端自动化解决的是人不在电脑前时的任务。
- visualIntent：展示睡眠状态、同事催上线和 PR review 自动出现的时间差。
- visualType：UI Simulation / Process Timeline
- keyOnScreenText：`PR 卡了一天`、`明天要上线`、`自动 review`、`空指针风险`
- videoValue：时间变化和结果先出现，能直接让观众感受无人值守的价值。

## Scene 02｜Claude Code 住进 GitHub runner

- sceneId：`github-actions-02`
- title：Claude Code 住进 GitHub runner
- purpose：给出 GitHub Actions 版 Claude Code 的核心定义。
- narrativeRole：概念建立。
- narrationIntent：解释它不是另一个产品，而是把本地 Claude Code 搬到 GitHub 服务器，由仓库事件触发。
- visualIntent：让 Claude Code 从本地终端迁移到 GitHub runner，并继续读取项目和 `CLAUDE.md`。
- visualType：Connection Diagram / UI Simulation
- keyOnScreenText：`本地 Claude Code`、`GitHub runner`、`仓库事件`、`CLAUDE.md`
- videoValue：运行地点和触发来源的迁移必须通过动态连接建立直觉。

## Scene 03｜@claude，不是 /claude

- sceneId：`github-actions-03`
- title：@claude，不是 /claude
- purpose：拆开最核心的评论触发方式并消除符号误解。
- narrativeRole：使用入口。
- narrationIntent：说明 issue、PR 评论和代码行 review 评论都可以用 `@claude` 派活，评论要具体；`/claude` 不会触发这里的云端流程。
- visualIntent：展示评论从 issue／PR 进入 workflow，同时把 `@` 亮起、`/` 置为不触发。
- visualType：UI Simulation / Decision Diagram
- keyOnScreenText：`@claude`、`/claude`、`issue`、`PR comment`、`具体要求`
- videoValue：一个字符决定触发与否，动态对照比文字解释更清楚。

## Scene 04｜装上三件套，给最小工牌

- sceneId：`github-actions-04`
- title：装上三件套，给最小工牌
- purpose：让观众理解安装不是只有一个命令，而是 App、Secret、workflow 和权限的组合。
- narrativeRole：进入配置。
- narrationIntent：说明 `/install-github-app` 在本地会话中引导安装 GitHub App、配置 API key 和写入 workflow；前提是管理员和直接 Claude API。
- visualIntent：三个安装件汇入测试仓库，旁边只亮出 Contents、Issues、Pull requests 三项读写权限。
- visualType：Connection Diagram / Permission Map
- keyOnScreenText：`/install-github-app`、`GitHub App`、`ANTHROPIC_API_KEY`、`.github/workflows/`、`Contents`、`Issues`、`Pull requests`
- videoValue：安装对象和权限边界之间的关系需要汇入和收束动作。

## Scene 05｜workflow 是值班表

- sceneId：`github-actions-05`
- title：workflow 是值班表
- purpose：建立 workflow 的四块结构。
- narrativeRole：配置骨架。
- narrationIntent：解释 `name`、`on`、`jobs`、`steps` 分别描述名称、触发、执行位置和具体动作。
- visualIntent：一份 YAML 从四个区块依次展开，事件沿 `on` 进入 job，再通过 step 调用 Action。
- visualType：Code Exploration / Task Routing
- keyOnScreenText：`name`、`on`、`jobs`、`steps`、`ubuntu-latest`、`claude-code-action@v1`
- videoValue：配置文件的运行路径比整份 YAML 静态展示更能解释它如何工作。

## Scene 06｜prompt 决定它等你还是自动跑

- sceneId：`github-actions-06`
- title：prompt 决定它等你还是自动跑
- purpose：建立 v1 模式判断和 CLI 参数入口。
- narrativeRole：规则揭示。
- narrationIntent：说明无 `prompt` 时进入交互模式等待 `@claude`，有 `prompt` 时进入自动化模式；`claude_args` 可以传入 `--max-turns` 和 `--model` 等参数。
- visualIntent：同一 workflow 分成「无 prompt → 等评论」和「有 prompt → 触发即执行」两条路径。
- visualType：Decision Diagram / Task Routing
- keyOnScreenText：`prompt`、`@claude`、`自动化模式`、`交互模式`、`claude_args`、`--max-turns`、`--model`
- videoValue：模式由一个配置字段切换，分支动画能直接证明因果关系。

## Scene 07｜PR 一更新，自动 review

- sceneId：`github-actions-07`
- title：PR 一更新，自动 review
- purpose：展示自动化模式的第一个实用结果。
- narrativeRole：用例一。
- narrationIntent：说明 `pull_request` 的 `opened` 和 `synchronize` 触发 review workflow，带 `prompt` 后无需人工 @。
- visualIntent：PR 创建或推送新提交，runner 自动运行并在 PR 中留下 code review。
- visualType：Process / UI Simulation
- keyOnScreenText：`pull_request`、`opened`、`synchronize`、`Code Review`、`code quality`、`correctness`、`security`
- videoValue：从事件到 review 结果的自动链路是时间和状态变化。

## Scene 08｜issue 变成一个新 PR

- sceneId：`github-actions-08`
- title：issue 变成一个新 PR
- purpose：展示交互模式如何承接具体开发任务。
- narrativeRole：用例二。
- narrationIntent：说明在 issue 评论里写具体的 `@claude` 任务后，它会读取上下文、实现功能并开 PR，修 bug 也是同一条路径。
- visualIntent：issue 描述和评论进入 runner，随后出现新分支、修改文件和待审 PR。
- visualType：Task Execution / Process
- keyOnScreenText：`@claude`、`按这个 issue 的描述把功能实现了`、`新分支`、`Pull Request`
- videoValue：任务从文字请求变成可审查 PR，需要完整过程展示。

## Scene 09｜到点生成报告

- sceneId：`github-actions-09`
- title：到点生成报告
- purpose：补上不依赖评论的定时自动化场景。
- narrativeRole：用例三。
- narrationIntent：说明 `schedule` 配合 cron 和 `prompt`，可以每天运行并生成昨日提交与待办 issue 汇总。
- visualIntent：时间轴走到 `0 9 * * *`，workflow 启动，报告卡生成。
- visualType：Process / Timeline
- keyOnScreenText：`schedule`、`cron`、`0 9 * * *`、`Daily Report`、`prompt`
- videoValue：定时触发与即时事件触发不同，时间轴能建立区别。

## Scene 10｜真实 key 进保险柜

- sceneId：`github-actions-10`
- title：真实 key 进保险柜
- purpose：建立 API key 和无人值守执行的安全底线。
- narrativeRole：风险转折。
- narrationIntent：明确真实 key 不能写进仓库，应该存为 `ANTHROPIC_API_KEY` Secret，YAML 只引用；同时提醒最小权限、提示注入和合并前审查。
- visualIntent：真实 key 写入 YAML 的路径被阻断，随后进入 GitHub Secrets，workflow 取出的是引用而不是明文。
- visualType：Decision Diagram / Security Flow
- keyOnScreenText：`不要提交 API key`、`GitHub Secrets`、`ANTHROPIC_API_KEY`、`${{ secrets.ANTHROPIC_API_KEY }}`、`合并前审查`
- videoValue：明文、引用和保险柜的状态变化必须被看见。

## Scene 11｜五分钟跑通闭环

- sceneId：`github-actions-11`
- title：五分钟跑通闭环
- purpose：把安装、触发、结果和人工确认串成一个可验证闭环。
- narrativeRole：实战收束。
- narrationIntent：依次说明安装命令、确认 workflow、确认 Secret、发测试 issue、观察 workflow 与 PR、审查后再合并。
- visualIntent：测试仓库依次显示五个检查点，最后从「等待」变为「可审查」，不模拟真实外部调用。
- visualType：Process / Checklist
- keyOnScreenText：`claude.yml`、`ANTHROPIC_API_KEY`、`@claude`、`Actions`、`PR`、`审查再合`
- videoValue：验证结果由多个状态组成，必须按顺序展示而不是只列命令。

## Scene 12｜从触发到执行，再往下一层

- sceneId：`github-actions-12`
- title：从触发到执行，再往下一层
- purpose：总结当前视频的核心规则，并引出 Agent SDK。
- narrativeRole：总结与下一集预告。
- narrationIntent：收束「云端 Claude Code、@claude、workflow、prompt、Secrets、人工审查」六个要点，并预告下一篇 Agent SDK 是更底层的代码驱动层。
- visualIntent：六个关键词收束后，只保留最后出现的 `下一篇：Agent SDK` 卡片。
- visualType：SummaryScene / Preview Card
- keyOnScreenText：`云端 Claude Code`、`@claude`、`workflow`、`prompt`、`GitHub Secrets`、`人工审查`、`下一篇：Agent SDK`
- videoValue：总结和预告需要明确的最后一次状态变化及停留空间。

## Gate 1 字段审查

- [x] 12 个 Scene 均包含 sceneId、title、purpose、narrativeRole、narrationIntent、visualIntent、visualType、keyOnScreenText、videoValue。
- [x] 每个 Scene 只有一个主要认知任务，三种用例分别拆开。
- [x] Scene 06 明确建立 `prompt` 与模式的因果关系。
- [x] Scene 10 将 Secrets、最小权限、提示注入和人工审查作为同一安全转折中的互补边界。
- [x] Scene 12 的下一篇预告是最后一个视觉事件。
- [x] 屏幕文字、命令、路径和配置字段均可追溯到 Source 或前置资料。

Gate 1 结论：通过。
