# Narration Script：Claude Code 常见问题排查

## Scene 01｜四十分钟，错在一行旧配置

刚换了一台 Mac，Claude Code 一启动就弹出 `This organization has been disabled`。你可能先怀疑账号被封了，查完订阅又怀疑网络，甚至重装了两遍。结果真正的原因，只是 `~/.zshrc` 里残留了一行半年前的 `ANTHROPIC_API_KEY`。环境变量优先于订阅登录，Claude Code 拿着已经失效的旧 key 去认证，当然会被告知组织已禁用。删掉它，问题立刻消失。排查最忌讳靠猜，先找证据，才能找到根因。

## Scene 02｜先给症状分诊

遇到问题，第一步不是动手修，而是先判断它属于哪一类。`command not found`、PATH 和 `EACCES`，往安装方向查；反复登录、403 和 organization disabled，先查认证；设置、hooks、MCP 或权限没生效，查配置；卡顿、高内存和搜索失灵，查性能；5xx、529、额度和请求过大，则进入 API 报错分支。类别定错，后面所有动作都会跑偏。

## Scene 03｜先敲 `/doctor`，解决不了再上报

如果你还能进入 Claude Code，先运行 `/doctor`。它会检查安装、设置、MCP 和上下文。如果 Claude 根本启动不了，就在终端运行 `claude doctor`。诊断结果有问题时，可以按 `f` 把报告交给 Claude 一起看。文档查过、体检也做过，问题仍然解决不了，再用 `/feedback` 上报。先体检，再求助，这个顺序能省掉很多无效尝试。

## Scene 04｜`/status` 先告诉你谁在登录

认证类问题，先运行 `/status`，看当前使用的是订阅登录，还是某个 API key。如果你明明是 Max 用户，状态里却显示 API key，就要查环境变量。尤其是 `ANTHROPIC_API_KEY`，它可能从 shell 配置或 `.env` 里加载，并且压过你的订阅。先在当前终端运行 `unset ANTHROPIC_API_KEY`，再清理 `~/.zshrc`、`~/.bashrc` 或其他配置文件里的旧 export。重启后再次运行 `/status`，确认身份已经回到预期状态。

## Scene 05｜别猜配置，查实际加载

配置写了却没生效，先不要继续改文件。用 `/context` 看上下文里加载了什么，用 `/memory` 看规则文件，用 `/hooks` 看 hook 是否注册，用 `/mcp` 看服务器状态，用 `/permissions` 看当前真正生效的权限，再用 `/status` 看设置来源。hook 没触发，要检查 matcher 的大小写和配置位置；MCP 不出现，要检查文件是不是放在仓库根目录并完成批准。你以为写进去的配置，和 Claude 实际读到的配置，可能不是同一份。

## Scene 06｜CLAUDE.md 是请求，不是硬保证

权限问题还要分清软边界和硬边界。`CLAUDE.md` 里的“不要编辑某个文件”是请求，不是无论如何都能拦住的保证。真正需要强制执行的限制，应使用 `deny` 规则或 `PreToolUse` hook。还要注意，像 `Bash(rm *)` 这样的前缀规则匹配的是字面命令字符串，不会自动覆盖 `/bin/rm` 或 `find . -delete`。先用 `/permissions` 看实际规则，再检查每一种命令变体是否真的匹配。

## Scene 07｜先收拾工作台

Claude Code 越用越慢、内存越来越高，先怀疑上下文太满。定期用 `/compact`，在主要任务之间重启；彻底卡住时按 Ctrl+C，不行就重新打开终端，用 `claude --resume` 接回会话。遇到自动压缩反复把上下文填满，让它分块读取大文件，或者只保留计划和 diff，必要时用 `/clear` 重开。搜索和 `@file` 补全失灵时，检查系统版 `ripgrep`；集成终端乱码，则运行 `/terminal-setup`。先清理工作台，再考虑更深的故障。

## Scene 08｜服务器、额度，还是你的请求

看到 API 红字，先判断锅在谁那儿。`API Error: 500`、`529 Overloaded` 和服务器限流，通常是服务端问题，等一会儿、查状态页，必要时换模型。`You've hit your limit` 是额度用完，查 `/usage`，等待重置或调整额度。`Prompt is too long` 和 `Request too large` 是输入太大，用 `/compact`、`/clear` 或分块读取。`Unable to connect` 则先在同一个终端用 curl 检查网络、代理和防火墙。不同的锅，不能用同一种修法。

## Scene 09｜实时日志加干净配置对照

如果症状很怪，先让系统把过程显示出来。`claude --debug` 看通用日志，`claude --debug mcp` 看 MCP 连接，`claude --debug hooks` 看事件和 matcher。还可以开一个干净会话：从 `/tmp` 启动，并把 `CLAUDE_CONFIG_DIR` 指向空目录。如果问题消失，根因就在用户或项目配置里；接下来一次只加回一个文件或变量，直到问题重现。如果干净会话里仍然有问题，就继续查环境变量、托管设置或安装本身。把变量砍掉一半，问题才会变得可定位。

## Scene 10｜从版本到干净会话

现在把这套方法完整走一遍。先运行 `claude --version`，确认命令存在并且能打印版本。进入会话后运行 `/doctor`，看安装、设置、MCP 和上下文是否健康。接着运行 `/status`，确认当前凭证符合预期。需要时，再运行 `cd /tmp && CLAUDE_CONFIG_DIR=/tmp/claude-clean claude`，获得一个不加载平时配置的对照环境。版本、体检、凭证、干净会话，这四步就是一条可以重复使用的排查主干。

## Scene 11｜先分诊，再查证据

把今天的方法记成四个动作：先分诊，确定问题类别；再查状态，用 `/doctor` 找方向、用 `/status` 看凭证；然后按根因处理，分别面对配置、上下文、网络、额度或服务端；最后留证据，用运行结果、`--debug` 日志或干净配置对照确认。以后再遇到报错，不要先重装，也不要连续乱试。先问它属于哪一类，再问下一条证据在哪里。

## Scene 12｜下一篇：术语表

下一篇是第 52 篇“术语表，小白友好”。CLAUDE.md、上下文窗口、MCP、Subagent、Hook、检查点和 auto-compact，这些词会按主题整理成一句话就能查懂的解释。排查是把问题定位出来，术语表则帮你把一路遇到的概念彻底捋清楚。

## Gate 2 口播边界检查

- 每个 Scene 正文只包含实际需要朗读的内容。
- 没有把视觉说明、制作备注、Gate 清单或 TTS 指令放入 Scene 正文。
- 口播承担解释、因果、转折和结论；没有逐字复述所有屏幕文字。
- Scene 顺序与 Scene Script 的 12 个 sceneId 一一对应。

**Gate 2 口播部分：通过。**
