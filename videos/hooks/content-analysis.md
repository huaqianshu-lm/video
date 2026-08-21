# 33 · 钩子（Hooks）：在固定时机自动扣扳机 · Content Analysis

## 1. 核心命题

Hook 是挂在 Claude Code 生命周期固定事件上的自动动作：事件发生时，命令或请求必然执行，不依赖 Claude 是否记得、是否愿意主动选择。它把写在 `CLAUDE.md` 里的“请求”变成可验证的“保证”。

本片需要建立一条可执行的理解链：

```text
重复且不能漏做的动作
    ↓
它应该靠提醒，还是靠确定性触发？
    ↓
选择正确的生命周期事件
    ↓
用 matcher 收窄触发范围
    ↓
用 stdin JSON、退出码和 stdout 与 Claude Code 对话
    ↓
从格式化、拦截、通知三个例子看到结果
    ↓
用 /hooks、日志和手动输入排查
```

## 2. 观众需要完成的认知变化

1. 从“让 Claude 记得做”转为“让事件触发时必然做”。
2. 分清 `PreToolUse` 能在工具前拦截，`PostToolUse` 只能在工具后补动作。
3. 能根据会话、对话轮次和工具调用的位置选择 `SessionStart`、`Stop`、`PreToolUse` 或 `PostToolUse` 等事件。
4. 知道 Hook 写在 settings 文件中，并能按个人、项目和本地范围选择位置。
5. 能用区分大小写的 `matcher` 把工具 Hook 收窄到 `Edit`、`Write` 或 `Bash`。
6. 理解 Hook 的输入来自 stdin JSON，脚本用退出码和 stdout 返回控制结果。
7. 记住 `exit 2` 才能阻止工具调用，退出码与结构化 JSON 不应混用；Hook 只能收紧权限，不能绕过拒绝规则。
8. 能看懂自动格式化、危险命令拦截和桌面通知三种常见配置。
9. 能用 `/hooks`、手动喂 JSON、`--debug` 和脚本权限检查定位 Hook 不触发或报错。

## 3. 必须保留的信息

### A. 开头的重复动作与核心对比

- 一周手动补敲 `prettier --write` 23 次，漏掉两次并被 CI 格式检查打回，是 Hook 的问题钩子。
- `CLAUDE.md` 中的“改完文件记得跑 prettier”只是请求，不是保证。
- Hook 在事件发生时自动执行，把重复动作变成确定性控制。

### B. Hook 的定义与生命周期

- Hook 是某个事件一发生，就自动执行的一段命令或请求；最常见的是 shell 命令，也支持 HTTP 端点、MCP 工具和 LLM 提示等形式。
- 常见事件包括 `SessionStart`、`SessionEnd`、`UserPromptSubmit`、`Stop`、`PreToolUse` 和 `PostToolUse`。
- `PreToolUse` 发生在工具执行前，适合拦危险命令；`PostToolUse` 发生在工具成功执行后，适合格式化或 lint；`Stop` 是 Claude 答完一轮；`SessionStart` 是会话开始或恢复。
- 文章还提到 `PreCompact`、`PostCompact`、`FileChanged`、`ConfigChange`、`SubagentStart` 和 `SubagentStop` 等扩展事件，但不作为本片的主要操作展开。

### C. 配置范围与 matcher

- `~/.claude/settings.json` 影响当前用户的所有项目；`.claude/settings.json` 只影响当前项目且可提交给团队；`.claude/settings.local.json` 只影响当前项目中的当前用户且不进入 git。
- Hook 配置由事件、`matcher` 和动作组成。
- 工具事件的 `matcher` 匹配工具名，`Edit|Write` 表示二选一，`Bash` 表示单个工具，空字符串或省略表示全部匹配。
- `matcher` 区分大小写；`UserPromptSubmit` 和 `Stop` 等没有工具名的事件不支持用 matcher 收窄。

### D. Hook 与 Claude 的通信协议

- Claude Code 把事件数据作为 JSON 从 stdin 传给 Hook，常见字段有 `session_id`、`cwd`、`hook_event_name`、`tool_name` 和 `tool_input`。
- 退出码 `0` 表示继续，退出码 `2` 表示阻止；其他非零退出码表示 Hook 出错但通常不阻止操作。
- `Pre` 类事件能真正拦截，`PostToolUse` 的退出码 2 只能反馈，因为工具已经完成。
- stdout 可以返回结构化 JSON，例如 `permissionDecision: "deny"`、`"ask"`、`"allow"` 或 `"defer"`；退出码 2 与 JSON 控制不要混用。
- Hook 返回 `allow` 不能覆盖设置里的拒绝规则；即使跳过权限提示，`deny` Hook 仍然可以阻止操作。

### E. 三个可复用例子

- `PostToolUse` + `Edit|Write`：从 `.tool_input.file_path` 取路径，交给 `prettier --write`；同一套路也能换成 `eslint --fix`、`gofmt` 或 `black`。
- `PreToolUse` + `Bash`：脚本从 `.tool_input.command` 读取命令，发现 `rm -rf` 时向 stderr 写出原因并 `exit 2`；其他命令 `exit 0`，继续走正常权限流程；脚本需要 `chmod +x`，项目路径可用 `$CLAUDE_PROJECT_DIR`。
- `Notification`：在 macOS、Linux、Windows 使用各自的通知命令，适合 Claude 等待输入或需要批准时提醒用户；个人通知 Hook 放全局设置更合适。

### F. 练习与排查

- 练习在项目级 `.claude/settings.json` 配置 `PostToolUse` + `Bash`，用 `jq` 把 `.tool_input.command` 追加到 `~/claude-bash-log.txt`。
- 用 `/hooks` 查看事件、matcher、来源文件和命令；让 Claude 执行无害的 `ls`，再查看日志验证副作用。
- Hook 不触发时先看是否注册、matcher 大小写和事件是否选对；`/hooks` 不显示时检查 JSON 尾逗号、注释、文件位置和会话重启。
- 报错时手动喂 JSON 测脚本、检查 `command not found`、绝对路径、`jq` 和可执行权限；用 `claude --debug` 或 `/debug` 查看执行状态。
- 临时关闭全部 Hook 可以在设置中使用 `"disableAllHooks": true`。

## 4. 因果、对比与流程关系

### 核心因果

```text
重复动作容易漏做
    ↓
CLAUDE.md 只能提出请求
    ↓
Hook 绑定事件并自动执行
    ↓
结果可持续发生或被确定性拦截
```

### 事件关系

```text
SessionStart
    ↓
UserPromptSubmit
    ↓
PreToolUse → 工具执行 → PostToolUse
    ↺ 代理循环中的下一次工具调用
    ↓
Stop
    ↓
SessionEnd
```

### 控制关系

```text
stdin JSON
    ↓
Hook 脚本读取事件和工具参数
    ↓
exit 0：继续       exit 2：阻止
stdout JSON：结构化控制
stderr：向 Claude 反馈阻止或错误原因
```

## 5. 可视觉化内容

- 23 次重复动作从手动输入变成自动触发，形成“请求／保证”对比。
- 生命周期时间线与工具调用前后两个钩点。
- 全局、项目、本地三个 settings 作用域。
- `Edit|Write` matcher 过滤器只放行目标工具。
- stdin JSON 流入，退出码和 stdout 分流返回。
- 格式化 Hook 的文件路径流转、危险命令 Hook 的红色拦截和通知 Hook 的系统提醒。
- `/hooks` 注册、`ls` 触发、日志出现的验证闭环。
- “不触发／不显示／报错／拦不住”到排查动作的诊断表。

## 6. 可以弱化或删除的信息

- Hook 支持的 HTTP、MCP、LLM 提示只作为定义补充，不展开配置细节。
- `PreCompact`、`PostCompact`、`FileChanged`、`ConfigChange`、`SubagentStart` 和 `SubagentStop` 作为扩展事件点到为止。
- Windows 通知的完整 PowerShell 片段不放入画面，只保留平台差异。
- `jq` 的安装命令不作为主要视觉事件，避免视频变成环境安装教程。
- 练习的清理步骤保留为口播提示，不把删除日志命令做成动作演示。
- 不读取或处理源文末尾下一篇 34「CLI 参考手册」的文章内容，只保留源文已有的下一集标题预告。

## 7. 最终知识骨架

```text
Hook = 固定事件触发的自动动作
├── 价值：请求 → 保证
├── 时机：PreToolUse / PostToolUse / Stop / SessionStart
├── 配置：settings.json + matcher + action
├── 对话：stdin JSON / exit code / stdout
├── 实例：格式化 / 拦危险命令 / 通知
├── 验证：/hooks → 触发 → 日志
└── 排查：注册 → matcher／事件 → 手动 JSON → debug
```

## 8. Gate 1 内部审查结果

- [x] 核心命题从“23 次重复劳动”切入，明确区分请求与保证。
- [x] 叙事关系覆盖事件时机、配置范围、通信协议、实例和排查，不机械复述文章标题顺序。
- [x] `PreToolUse`／`PostToolUse` 的“能拦／只能补刀”差异被单独保留。
- [x] `exit 2`、stdin JSON、stdout 结构化控制、权限不能被 `allow` 放松等事实边界已保留。
- [x] 每个后续 Scene 都能追溯到本分析中的知识骨架；扩展事件和平台差异已控制在必要范围。
- [x] 结尾预告只使用当前 source 中已有的 34「CLI 参考手册」标题，没有读取下一篇文章。

