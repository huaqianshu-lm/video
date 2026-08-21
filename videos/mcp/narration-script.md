# MCP：给 Claude 接上外部世界 · Narration Script

> 目标：基于 Scene Script 生成完整口播。Scene 下只保留实际需要朗读的内容。

## Scene 01｜参数位置错了，server 连不上

我装第一个 MCP server 的时候，对着终端报错折腾了快一个小时。

当时我抄了一条命令，大概是 `claude mcp add db -- npx server --transport stdio`。网络怀疑过，包也删了重装好几遍，但就是连不上。

后来才发现，问题不是网络，而是参数的位置。`--transport` 这些选项必须放在 server 名称之前，`--` 后面跟的才是启动 server 的命令。更关键的是，stdio 本来就是默认传输，所以正确写法其实是 `claude mcp add db -- npx server`。

这一个小时的坑，正好说明 MCP 最容易出错的地方：不是概念多难，而是位置、作用域和批准这些细节。

## Scene 02｜MCP 是 Claude 的外部扩展坞

Claude Code 默认主要会读本地文件、改代码、跑命令。

但你的 Jira 工单、生产数据库和 Figma 设计稿，并不在它眼前。以前你只能自己去另一个工具里找资料，再复制粘贴到聊天里。

MCP，也就是 Model Context Protocol，可以理解成一个给 Claude 接外部世界的扩展坞。它是一套用于 AI 工具集成的开放标准。接上以后，外部服务提供的工具和数据，就可以出现在 Claude 面前。

所以当你发现自己总在把另一个工具里的数据复制进聊天时，就该想起 MCP。

## Scene 03｜三种 transport：本地、远程、已弃用

接 server 之前，先问一个问题：它是跑在自己的机器上，还是托管在远程网址上？

本地进程通常用 stdio。它是默认传输，不需要额外写 `--transport`，`--` 后面跟的是 Claude Code 用来启动这个小程序的命令。

云服务通常用 HTTP。给它一个网址，Claude Code 就去连接远程 server，这是官方推荐的远程方式。

还有一种 SSE，也就是 Server-Sent Events。它是旧的远程传输方式，官方已经标记为已弃用。新加 server 时，能用 HTTP 就不要再选 SSE。

## Scene 04｜`add` 命令的四个区段

现在把命令拆开看。

`claude mcp add` 自己的选项，比如 `--transport`、`--env`、`--scope` 和 `--header`，全部放在 server 名称之前。

server 名称之后的 `--` 是一条分界线。它后面的内容，不再是 Claude Code 的选项，而是传给 MCP server 的启动命令和参数。

所以 HTTP server 是前面写 transport 和网址；stdio server 则是不写 transport，在 `--` 后面写 `npx` 或其他启动命令。记住这条分界线，开头那种“看起来合理但连不上”的命令就不会再混淆了。

## Scene 05｜三种 scope：这个 server 给谁用

加 server 时还要决定，它到底在哪些项目里可用。

`local` 是默认选择，只在当前项目生效，适合个人实验或不想把凭据放进版本库的配置。

`project` 也只针对当前项目，但会写入项目根目录的 `.mcp.json`，可以通过版本控制和团队共享。它本质上是配置即代码。

`user` 则是你自己的跨项目配置。加一次，所有项目都能使用，但仍然只是你个人的设置。

所以可以这样记：个人实验用 local，团队共享用 project，自己跨项目反复使用用 user。改完 `.mcp.json`，还要退出并重启会话才会生效。

## Scene 06｜工具出现了，但还要过两道闸

server 加好以后，它带来的工具会注册到 Claude 面前。

在终端里可以用 `claude mcp list` 查看配置的 server 和连接状态；进入 Claude 会话后，也可以用 `/mcp` 查看每个 server 的状态和工具。

你会看到 Connected、Needs authentication、Failed to connect，或者 Pending approval 这些状态。尤其是项目 `.mcp.json` 里的 server，第一次使用前需要你批准，防止一个陌生仓库未经同意就在你的机器上启动进程。

而且即使 server 已经加载，Claude 第一次真正调用某个工具时，还会再询问一次工具权限。也就是两道闸：项目 server 批准一次，工具首次调用再批准一次。

## Scene 07｜第三方 server 不是自动可信

MCP 能接外部世界，也意味着你要认真看它接进来的是什么。

MCP server 可能是第三方代码或服务，Anthropic 不会替你审计每一个 server。尤其是会抓取网页、工单和邮件内容的 server，可能把提示注入带进 Claude 的上下文。

所以优先选择官方目录或大厂官方 server。遇到来源不明的第三方 server，先看源码和维护情况，再决定要不要接。

如果要连数据库，能用只读账号就不要给写权限。连接能力越强，凭据就越应该收敛到完成任务所需的最小范围。

## Scene 08｜实战第一段：add，然后看 list

下面用官方文档 server 练一遍。它是远程 HTTP server，不需要登录或额外配置，适合先熟悉流程。

第一步，在终端里添加它：`claude mcp add --transport http claude-code-docs https://code.claude.com/docs/mcp`。

看到 Added，说明配置已经写入。

第二步，运行 `claude mcp list`。

列表里出现 `claude-code-docs`，旁边是 `✓ Connected`，才说明它真的连上了。如果是 Failed to connect，就回头检查命令和网络，而不是继续盲目重装。

## Scene 09｜实战第二段：批准、调用，再 remove

第三步，进入 Claude 会话，点名这个 server，问它：用 `claude-code-docs` 查一下 `MCP_TIMEOUT` 这个环境变量是干什么的。

第一次调用时，Claude 会停下来询问你是否允许使用新工具。批准之后，它才会继续调用。

返回结果时，工具调用旁边会标着 `claude-code-docs`。这个标记能帮助你确认答案确实经过了这个外部 server，而不是模型只凭记忆回答。

第四步，练完以后用 `claude mcp remove claude-code-docs` 清理。每个连接的 server 都会占用一点上下文窗口，不用的连接及时移除，也是在给工作台腾空间。

## Scene 10｜接外部能力，也要保留判断

把整篇串起来，MCP 是 Claude 接触外部工具和数据的开放接口。

本地工具优先看 stdio，云服务优先看 HTTP，SSE 只需要认识，因为它已经弃用。添加时把选项放在 server 名称前，`--` 后面只放启动命令；再用 local、project 或 user 选择合适的作用域。

加好之后，用 `list` 或 `/mcp` 检查状态，记住项目 server 和首次工具调用各有一道批准闸。连接第三方服务前验证信任，数据库尽量只读，完成后移除不用的 server。

下一篇是 23「子代理（Subagent）」：当一个 Claude 接上的工具越来越多，怎么把任务拆给带独立上下文的专项小帮手。
