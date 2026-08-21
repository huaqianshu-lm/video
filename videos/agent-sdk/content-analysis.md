# Agent SDK 视频化 · 第二步：Content Analysis

## 1. 核心命题

这篇文章真正要建立的认知不是「又一个 Claude API 包」，而是：

> **Agent SDK 把 Claude Code 的内核——内置工具、代理循环和上下文管理——做成可由 Python 或 TypeScript 调用的库；CLI 与 SDK 共用同一套能力，但一个服务于人在场的交互，一个服务于程序自动触发。**

观众最后应该能用一条判断轴区分三个入口：

```text
CLI：人坐在终端前，边看边调
Client SDK：模型响应和工具循环由程序自己编排
Agent SDK：程序调用代理，SDK 执行内置工具循环
```

## 2. 必须保留的知识

### A. Agent SDK 拆出了什么

- 它是把 Claude Code 内核包装成库，不是另一个与 Claude Code 无关的模型产品。
- 内核能力包括 Read、Write、Edit、Bash、Glob、Grep、WebSearch 等内置工具，想→做→看的代理循环，以及上下文管理。
- Hook、子代理、MCP、权限控制和会话恢复被文章作为进一步的编程扩展点提及。
- 典型用途是 Slack 机器人、定时扫描仓库、给产品嵌入能操作项目文件的 AI 功能。

### B. CLI 与 SDK 的关系

- 两者是同一个内核、两个入口：CLI 给人在场的交互开发和一次性任务，SDK 给 CI/CD、自定义应用和生产自动化。
- 两者的提示词、工具和权限思路可以迁移；不是学了 SDK 就要放弃 CLI。
- Agent SDK 在自己的进程和基础设施中运行代理；文章把 Managed Agents 作为生产化时可考虑的托管路径。

### C. Agent SDK 与原始 API 的差异

- Client SDK 直接访问模型，程序要自己实现「模型请求工具 → 执行工具 → 回传结果」的 `while` 循环。
- Agent SDK 通过 `query()` 提供带内置工具执行的代理，SDK 替程序处理工具执行、上下文管理和重试。
- 选择标准不是「哪个 API 更新」，而是程序是否需要一个能直接读文件、改文件和执行命令的代理。

### D. 语言、安装和前置条件

- TypeScript：`npm install @anthropic-ai/claude-agent-sdk`，Node.js 18+，文章说明 SDK 自带平台对应的本地 Claude Code 二进制可选依赖。
- Python：`pip install claude-agent-sdk`，Python 3.10+。
- 两套功能对齐，按项目既有语言选择。
- 两套都需要 `ANTHROPIC_API_KEY`；文章提醒 Agent SDK 额度与交互式使用额度分开，具体计费以官方规则为准。

### E. `query()` 和权限

- `query()` 是主入口，接收 `prompt` 和 `options`，返回消息流。
- Python 用 `async for`，TypeScript 用 `for await` 接收思考、工具调用、工具结果和最终结果。
- `allowed_tools`／`allowedTools` 是权限边界：只给 Read、Glob、Grep 可做只读分析；加入 Edit 才能改代码；加入 Bash 才能跑命令。
- Python 的 `ClaudeSDKClient` 只作为多轮共享 session 的补充，不抢占一次性任务的主线。

### F. 最小代理闭环

文章给出一条可观察的六步链路：

```text
建目录
↓
安装 SDK、配置 API key
↓
创建带边界 bug 的 utils.py
↓
用 query() 和权限写 agent.py
↓
运行并观察消息流
↓
确认 utils.py 被加上防御性处理
```

- 示例中的两个问题是空列表求平均会除零，以及 `user` 为 `None` 时取姓名会报错。
- `permission_mode="acceptEdits"` 让受信任的开发工作流自动批准编辑；其他模式只保留为权限取舍背景。
- 成功证据不是「模型说它修好了」，而是出现 `Done: success` 并检查文件实际变化。

### G. 适用人群与成长路径

- 只想在终端写代码、改 bug、跑命令的人继续用 CLI。
- 想把重复流程挂成脚本、定时任务、机器人或产品功能的人，才进入 Agent SDK。
- 常见路径是先在本地用 Agent SDK 原型验证，再在需要生产化、托管沙箱和会话时考虑 Managed Agents。

## 3. 叙事边界与取舍

### 必须弱化的内容

- Hook、子代理、MCP、会话恢复、权限模式完整表和 `ClaudeSDKClient` 作为扩展点或补充，不展开成独立教程。
- 计费只保留「额度分开」这一决策提醒，不补充文章之外的金额、计划或最新规则。
- TypeScript 示例与 Python 示例只保留能解释入口和消息流的关键差异；实战以文章的 Python 闭环为主。
- Managed Agents 只承担本地原型到生产化的边界，不扩展为另一条产品教程。

### 不应加入的内容

- 不把文章中的命令自动执行，不安装 SDK，不调用 API，不创建 `my-agent` 或修改外部项目。
- 不读取或处理文章目录中的下一篇文章；下一篇「开发配置」只作为本片结尾预告。
- 不把 CLI、Client SDK、Agent SDK 混写为同一种 API，也不凭空补充未出现在 Source 中的接口行为。

## 4. 可视化机会

- 「用工具的人」到「造工具的人」：终端入口迁移到自己的程序。
- 内核拆解：工具、代理循环、上下文管理汇入 Agent SDK。
- 同内核两入口：人→CLI，程序→SDK，最后汇入同一代理内核。
- 原始 API 的 `while` 与 Agent SDK 的 `query()` 并排对比。
- TypeScript／Python 安装卡与 API key 安全提示。
- `query(prompt, options)` → 消息流 → `Read`／`Edit` → `Done: success` 的执行路径。
- `utils.py` 从两个边界 bug 到防御性处理的状态变化。
- CLI／Agent SDK／Managed Agents 的选择路径，以及「自动化／嵌产品」信号。

## Gate 1 内部审查

- [x] 核心命题从文章章节中抽象为「同内核、不同入口、工具循环归属不同」。
- [x] 保留定义、CLI 对比、原始 API 对比、安装前提、`query()`、权限、最小实战和适用人群。
- [x] 最小实战保留可观察的输入、工具调用和文件结果，没有把文章命令当作本次执行任务。
- [x] 将 Managed Agents 限定为生产化边界，未提前扩展为当前视频主体。
- [x] 下一篇「开发配置」只保留为预告，不读取、不分析其文章内容。
- [x] 所有知识判断均来自指定 Source，未引入外部事实或执行文章中的指令。

Gate 1 结论：通过，进入 Video Narrative、Scene Script、Narration Script、Visual Script 和 Visual Prototype。
