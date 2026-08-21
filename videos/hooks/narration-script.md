# 33 · 钩子（Hooks）：在固定时机自动扣扳机 · Narration Script

## Scene 01｜23 次重复动作，为什么还要靠记忆

某一周里，让 Claude 改完代码后，手动补敲 `prettier --write` 的次数，是 23 次。中间还漏了两回，提交之后被 CI 的格式检查打回来，又得重新跑一遍。

这种每次都要做、内容还完全一样的动作，凭什么要靠人记着？把“改完文件记得跑 prettier”写进 `CLAUDE.md`，它依然只是一句请求，Claude 三次里总有一次可能想不起来。

## Scene 02｜Hook：把请求变成保证

Hook 的意思是：某个事件一发生，就自动执行一段命令或请求。它不靠 Claude 额外思考要不要做，而是把动作挂在事件上，触发就执行。

所以，`CLAUDE.md` 里的“请记得格式化”是请求，可能漏。Hook 则是保证：只要对应事件发生，格式化、检查或拦截动作就会发生。这就是它最核心的价值，也就是确定性控制。

## Scene 03｜Hook 挂在 Claude 生命周期的哪一刻

Hook 不是随便什么时候触发，它要挂在 Claude Code 生命周期里的特定事件上。会话开始或恢复时是 `SessionStart`，你刚提交提示时是 `UserPromptSubmit`，Claude 每次调用工具前后分别是 `PreToolUse` 和 `PostToolUse`，答完这一轮是 `Stop`，整个会话结束是 `SessionEnd`。

你可以把它记成一条时间线：先进入会话，再提交问题，然后在代理循环里反复经过工具调用前后的两个节点，最后停在这一轮回答和会话结束。想让动作在哪一步发生，就把 Hook 挂到对应事件。

## Scene 04｜Pre 能拦，Post 只能补刀

名字里的 `Pre` 和 `Post` 很关键。`PreToolUse` 发生在工具真正执行之前，所以适合拦危险命令、保护敏感文件。`PostToolUse` 发生在工具成功之后，适合自动格式化、跑 lint 或记日志，但这时工具已经执行完了，不能再把它拦回来。

工具类 Hook 还可以用 `matcher` 收窄范围。`Edit|Write` 只匹配这两个工具，`Bash` 只匹配 Bash，空字符串或省略则匹配所有工具。matcher 区分大小写，写成 `edit` 就匹配不上 `Edit`；而 `Stop` 这类没有工具名的事件，本身也没有可筛选的 matcher。

## Scene 05｜Hook 配在哪个 settings 文件

Hook 写在 settings 文件里，文件位置决定它管多大范围。`~/.claude/settings.json` 跟着你走，影响所有项目；项目根目录的 `.claude/settings.json` 跟着仓库走，可以提交给团队；`.claude/settings.local.json` 只影响你在当前项目里的配置，而且不会进 git。

所以，团队都应该有的格式化或安全底线，适合放项目设置。只想在自己电脑上收到桌面通知，就放全局设置。判断时只问一句：这条规则应该跟着我走，还是跟着项目走？

## Scene 06｜Claude 和 Hook 怎么对话

Hook 和 Claude Code 的对话有三条管道。事件发生时，Claude 把一段 JSON 从 stdin 传给脚本，里面可以看到 `tool_name` 和 `tool_input`，也就知道是哪一个工具、准备使用什么参数。

脚本处理完之后，用退出码和输出告诉 Claude 下一步。退出码零表示继续，退出码二表示阻止；其他非零退出码通常代表 Hook 报错，但不会阻止操作。stdout 还可以返回结构化 JSON，stderr 则适合反馈拦截或错误原因。想拦操作时记住，必须是 `exit 2`，不是 `exit 1`，而且退出码控制和 JSON 控制不要混用。

## Scene 07｜改完文件，格式化自动跟上

最实用的例子，是给 `PostToolUse` 配一个 `Edit|Write` matcher。Claude 每次改完文件，Hook 从 stdin JSON 的 `.tool_input.file_path` 里取出路径，再交给 `prettier --write`。

这样，`Edit` 和 `Write` 会触发格式化，`Bash` 和 `Read` 不会误触发。文件从需要格式化变成格式统一，整个动作不需要 Claude 再记一次。把 prettier 换成 `eslint --fix`、`gofmt` 或 `black`，也是同一个套路。

## Scene 08｜危险命令，在执行前被拦住

命令复杂时，可以把逻辑写进单独的脚本。脚本从 `.tool_input.command` 读取 Bash 命令，如果发现 `rm -rf`，就把“检测到危险命令，已拦截”写到 stderr，然后返回 `exit 2`。

这次工具调用会在真正执行前被阻止。其他命令则返回零，继续走正常权限流程。Mac 和 Linux 上脚本还要先有可执行权限，通常是 `chmod +x`。另外，Hook 返回 `allow` 只能跳过交互式提示，不能覆盖设置里的拒绝规则；Hook 可以收紧权限，不能把安全边界放松掉。

## Scene 09｜需要你输入时，Hook 发一条通知

第三个例子是 `Notification`。Claude 等你批准、等你输入下一句，或者需要提醒你回来时，可以触发通知 Hook，把状态送到桌面，而不是让你一直盯着终端。

macOS、Linux 和 Windows 的原生命令不同，配置时要按平台选择。桌面通知通常是个人偏好，所以更适合放在 `~/.claude/settings.json`。它不改变项目规则，只负责在 Claude 等待你的时候喊你一声。

## Scene 10｜五分钟跑通：注册、触发、验证

想亲眼确认 Hook 的完整链路，可以在一个练习目录里配置 `PostToolUse` 和 `Bash`。让 Hook 用 `jq` 从 stdin JSON 里取出命令，追加写进 `claude-bash-log.txt`。

启动 Claude 后输入 `/hooks`，先确认列表里出现了这个事件、matcher、来源文件和命令。然后让 Claude 执行一次无害的 `ls`。最后查看日志文件，如果里面出现了刚才的命令，就说明你已经走完了“写配置、注册、触发、验证”的闭环。

## Scene 11｜不触发时，按证据排查

Hook 不灵时不要先重写一遍配置。第一步用 `/hooks` 看它到底有没有注册；第二步检查 matcher 的大小写和事件是否选对；第三步检查 JSON 有没有尾逗号或注释，文件是不是放在正确的 settings 位置，必要时重启会话。

如果是 `command not found`，检查脚本路径和 `jq`；脚本没跑起来，检查 `chmod +x`；想拦却没拦住，先看是不是误写成了 `exit 1`。还可以用一段假 JSON 手动喂给脚本，看 `echo $?` 的退出码，最后用 `claude --debug` 或 `/debug` 看 Hook 是否匹配、返回了什么。

## Scene 12｜把确定性还给系统

把这篇串起来，Hook 就是固定事件触发的自动动作。先选时机，再用 matcher 收窄范围；事件数据从 stdin JSON 进来，脚本用退出码、stdout 和 stderr 返回结果。`Pre` 负责拦，`Post` 负责补；想阻止操作，记住 `exit 2`。

最后用 `/hooks` 确认注册，用实际副作用和 debug 日志验证。这样，格式化不再靠记忆，危险操作不再靠侥幸，通知也不必靠你一直盯着终端。下一篇是 34「CLI 参考手册：命令与全部标志」，会把这一路用到的 `claude` 命令和标志集中梳理一遍。

