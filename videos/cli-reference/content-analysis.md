# Claude Code 视频化 · 第一步：Content Analysis

## 1. 内容范围

- 来源：`34-cli-reference.md`
- 视频 slug：`cli-reference`
- 主题：Claude Code CLI 的命令、标志、headless／管道用法和退出码
- 本分析只使用指定文章正文；文章中提到的上一篇、下一篇和示例命令只作为当前文章的叙事或知识来源，不读取其他文章。
- 文章中的命令是待分析内容，不在本阶段执行。

## 2. 核心命题

`claude` 不只是打开交互聊天界面的入口，而是一个可以被脚本、管道和 CI 编排的命令行工具。理解命令、标志、输入输出和退出码，才能把 Claude Code 从“手动对话窗口”变成“工作流里的可组合零件”。

视频需要让观众完成这条认知迁移：

```text
只会敲 claude
    ↓
分清 command 与 flag
    ↓
用 -p 进入 headless
    ↓
用管道和 JSON 把它接进脚本
    ↓
用权限参数与退出码控制边界
    ↓
把 Claude 放进可判断、可恢复的自动化链路
```

## 3. 观众需要完成的认知变化

1. 知道 `claude` 后面不是只有一个交互入口，还有子命令和大量标志。
2. 能区分命令是“子动作”，标志是“调整这趟运行方式的勾选框”。
3. 能在 `-c`（当前目录最近会话）和 `-r`（指定会话）之间做选择，并知道 `--name` 让会话更容易恢复。
4. 理解 `-p`／`--print` 是 headless 模式的地基：直接输出、退出、不进入聊天界面。
5. 能把 stdin 管道喂给 Claude，再用重定向或 `jq` 接住输出。
6. 能理解模型、权限、目录、输出格式和脚本保险丝这些标志各自控制哪一层。
7. 知道 `--append-system-prompt` 是追加，`--system-prompt` 是替换；脚本场景通常优先追加。
8. 知道 `0` 表示成功、非 `0` 表示问题，并用 `$?` 或 `||` 让脚本据此继续或停止。
9. 能照着文章的四步链路完成一次裸调用、管道输入、结构化输出和退出码判断。
10. 记住 `--help` 不列出每个标志，查完整能力要回到 CLI 参考文档。

## 4. 知识骨架与关系

### A. 命令与标志的层级关系

- 程序：`claude`
- 子命令：`update`、`install`、`auth login`、`auth status` 等，通常执行后退出。
- 标志：`-p`、`--model`、`--permission-mode` 等，调整当前调用。
- 初始提示：可以跟在 `claude` 后面，作为进入会话时的第一句话。
- 错误子命令不会启动会话，而会建议接近的匹配项并退出。

### B. 会话入口关系

- `claude`：进入交互模式。
- `claude "解释这个项目"`：带初始提示进入会话。
- `claude -p "解释这个函数"`：headless，直接打印结果。
- `-c`／`--continue`：继续当前目录最近会话。
- `-r`／`--resume`：按 ID 或名字恢复指定会话。
- `-n`／`--name`：给会话设置显示名，方便恢复。
- `update`、`install`、`auth`：维护版本和账户。

### C. Headless 数据流

```text
文件／git diff
    ↓ stdin 管道
claude -p
    ↓ text／json／stream-json
终端、文件或 jq
    ↓
脚本根据退出码决定下一步
```

文章给出的具体能力包括：管道输入上限 10MB、`--output-format json` 返回 `.result`／`.session_id`／`total_cost_usd`、通过 session ID 和 `--resume` 串起多轮调用。

### D. 控制与边界关系

- `--model`：临时覆盖默认模型。
- `--permission-mode`：启动时选择权限模式。
- `--dangerously-skip-permissions`：等同于 `bypassPermissions`，需要明确隔离环境。
- `--add-dir`：增加文件访问目录，但不自动继承这些目录里的配置。
- `--allowedTools`／`--disallowedTools`：分别预放行或拒绝工具。
- `--max-turns`／`--max-budget-usd`：限制脚本回合数或预算。
- `--bare`：跳过 hooks、skills、plugins、MCP、自动内存和 CLAUDE.md 自动发现，适合更可控的脚本启动。

### E. 退出码关系

```text
命令运行
    ↓
exit 0 → 成功，继续
非 0 → 问题，停止／处理错误
```

文章明确举例：`auth status` 已登录为 `0`、未登录为 `1`；达到 `--max-turns`、管道超过 10MB 时以非零状态退出；脚本可用 `echo $?` 查看，或用 `||` 接住失败。

## 5. 必须保留的信息

1. 开头的“只会光敲 `claude`”与 CLI 能力被低估的反差。
2. command 与 flag 的差异，至少出现 `claude update` 和 `claude -p ... --model sonnet`。
3. `-c` 与 `-r` 的“最近／指定”区别，以及 `--name` 的恢复作用。
4. `-p` 是 headless 的地基，不打开交互界面。
5. 管道、`--output-format json`、`jq` 和 `session_id` 的串联方式。
6. `--permission-mode`、`--allowedTools`、`--add-dir` 和危险权限开关的边界。
7. `--append-system-prompt` 与 `--system-prompt` 的追加／替换差异。
8. `--bare`、`--max-turns` 和 `--max-budget-usd` 作为脚本控制手段。
9. `0`／非 `0` 退出码，以及 `auth status` 的具体例子。
10. 四步 headless 动手链路。
11. 完整标志表的“查阅而非背诵”定位。
12. 下一篇“35 · 控制与模式”的系列预告。

## 6. 可视觉化内容

- 终端命令的结构拆解：程序、子命令、标志、参数。
- 交互模式与 headless 模式的左右对比。
- `-c`／`-r` 的最近会话与指定会话分岔。
- 文件／diff → stdin → Claude → JSON／文本 → `jq`／文件的管道流。
- 权限与目录控制的开关层级。
- JSON 字段进入 `jq` 后只留下 `.result` 的状态变化。
- `auth status` 的退出码从命令传给脚本判断。
- 四步完整链路的连续终端执行过程。
- 按用途分组的标志速查表。
- 结尾从“聊天窗口”到“流水线零件”的角色变化。

## 7. 可以弱化的信息

- 文章中对国内网络环境、联网和额度的提醒作为口播背景弱化，不做主视觉事件。
- 全部偏门标志不逐个演示，以分类速查表保留检索价值。
- `daemon status` 只在退出码表中作为边界例子，不单独展开。
- `stream-json` 可以与 `text`／`json` 一并说明，不需要模拟完整流式事件。
- 版本号 `2.1.118`、`2.1.128` 保留在说明文档或速查文字中，不让版本号抢占主叙事。

## 8. 事实边界与画面文字归属

- 当前视频只复述源文章已经给出的 CLI 行为和示例，不额外推断未在文章中说明的参数行为。
- 视觉原型中的命令、选项、字段名、退出码、状态词和下一篇标题均可在 `source.md` 或本分析中找到依据。
- 不把上一篇 Hooks 的业务语义、固定文案或状态文字带入本片；只使用 CLI 文章本身提到的 `--bare`、hooks 等术语作为 CLI 参数语境。
- 预览控件“上一幕／下一幕／自动播放”、进度条和原型说明属于原型交互，不属于视频画面内容，不能进入未来正式 Composition。

## 9. Gate 1 内部审查结论

- 核心命题明确：从交互入口升级为可编排 CLI。
- 知识关系完整：命令／标志、会话、headless 数据流、控制边界、退出码和实操闭环均有承接。
- 信息取舍符合视频价值：以状态变化、管道流和命令执行证明概念，不按文章目录逐节做静态摘要。
- 事实边界明确：不执行源文章命令，不引入其他文章内容。
- Scene 规划可落到现有 `OpeningScene`、`ConceptScene`、`ComparisonScene`、`StepListScene`、`TerminalScene` 和 `SummaryScene`。

**结论：Gate 1 内容分析通过，可进入 Video Narrative 与 Scene Script。**

