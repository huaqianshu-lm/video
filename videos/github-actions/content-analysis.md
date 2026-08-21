# GitHub Actions 视频化 · 第一步：Content Analysis

> 目标：从原始文章中提取这条视频必须建立的知识、关系和可视化证据；不把文章章节直接改成口播或卡片。

## 1. 核心命题

这篇文章真正要建立的认知不是「GitHub Actions 有哪些 YAML 配置」，而是：

> **GitHub Actions 版 Claude Code 把原本必须人在电脑前执行的 Claude Code，搬到 GitHub runner 上，由仓库事件触发；你在 issue 或 PR 评论里写一句 `@claude`，它就能按项目规则分析代码、修改内容并把结果带回来。**

观众最后应该记住：

```text
本地 Claude Code：人启动、人在场、逐步确认
GitHub Actions：仓库事件触发、云端执行、结果回到 issue / PR
```

但云端无人值守不等于无需治理。密钥必须放进 GitHub Secrets，权限只给完成任务所需的范围，Claude 生成的 PR 必须人工审查，尤其要警惕 issue／PR 内容里的提示注入。

## 2. 必须保留的知识

### A. 它是什么

- GitHub Actions 版 Claude Code 仍然是 Claude Code，不是另一个孤立产品。
- 它运行在 GitHub 提供的 runner 上，读取仓库上下文和根目录 `CLAUDE.md`。
- 触发源从本地终端变成仓库事件，例如评论、PR 更新和定时任务。
- 它可以分析代码、修改文件、创建 PR、修复错误；文章把它类比成不用睡觉的夜班同事。

### B. `@claude` 如何触发

- 交互模式的核心入口是 issue 或 PR 评论中的 `@claude`。
- 可以出现在 PR 评论、PR 代码行 review 评论，以及 issue 正文或评论中。
- 评论应尽量具体；上下文包括 issue、相关代码和 `CLAUDE.md`。
- `@claude` 与 `/claude` 不能混淆：前者是 GitHub 评论触发，后者不是这里的触发方式。

### C. 安装前提与权限

- `/install-github-app` 是在本地 Claude Code 会话中执行的安装入口，不是 GitHub 评论命令。
- 自动安装涉及 GitHub App、`ANTHROPIC_API_KEY` 和 `.github/workflows/` 中的 workflow。
- 前提是仓库管理员，并且使用直接 Claude API；Bedrock／Vertex AI 需要走相应手动配置路径。
- GitHub App 的最小必需权限是 Contents、Issues、Pull requests 的读写。

### D. Workflow 的运行逻辑

最小交互 workflow 由四块组成：

```text
name：工作流名称
on：何时触发
jobs：在哪个 runner 上执行
steps：调用哪个 Claude Code Action，并传入密钥
```

- `issue_comment.created` 和 `pull_request_review_comment.created` 监听新评论。
- `runs-on: ubuntu-latest` 表示运行在 GitHub runner。
- `anthropics/claude-code-action@v1` 是文章示例中的 Action。
- `anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}` 只从 Secrets 取密钥。
- v1 自动检测模式：没有 `prompt` 时等待 `@claude`，给了 `prompt` 时进入自动化模式。
- `claude_args` 是传递 `--max-turns`、`--model` 等 CLI 参数的出口。

### E. 三种使用场景

| 场景 | 触发 | `prompt` | 模式 | 视频要证明的关系 |
| --- | --- | --- | --- | --- |
| 自动 code review | `pull_request` 的 `opened`／`synchronize` | 有 | 自动化 | PR 开出或更新后自动留下 review |
| 按 issue 自动改 | `issue_comment` 中 `@claude` | 无 | 交互 | 具体任务进入 issue，Claude 开新分支和 PR |
| 定时任务 | `schedule` + cron | 有 | 自动化 | 到点运行并生成报告 |

贯穿三者的判断轴是：

> **给 `prompt`，触发后自动照着做；不给 `prompt`，等待评论里的 `@claude`。**

### F. 安全边界

- 真实 API key 绝不能直接提交到仓库，尤其不能写进 YAML。
- 正确做法是把它存为名为 `ANTHROPIC_API_KEY` 的 GitHub repository secret，并在 workflow 中引用。
- 只授予 Contents、Issues、Pull requests 三项必要读写权限。
- 陌生人可以提交 issue 或 PR 内容，云端 Agent 读这些内容时要警惕提示注入。
- Claude 开出的 PR 仍然要在合并前人工审查。

### G. 可视化验证闭环

文章给出一条五步实战链路：

```text
/install-github-app
↓
确认 .github/workflows/claude.yml
↓
确认 Secrets 中有 ANTHROPIC_API_KEY
↓
开测试 issue，评论 @claude
↓
看到 workflow 与 PR 后审查再合并
```

视频要展示状态变化和预期结果，不只是列五个步骤：workflow 运行、issue 回评、PR 生成、人工审查。

## 3. 叙事边界与取舍

### 必须弱化的内容

- 官方 Code Review 独立服务、GitLab CI/CD 只作为边界提示，不展开成新支线。
- `claude_args` 的完整参数表只保留代表性参数和用途，不逐项做教程。
- 网络环境、订阅类型、模型选择等前置说明服务于安装判断，不抢占主叙事。

### 不应加入的内容

- 不把文章里提到的下一篇 Agent SDK 提前讲成当前视频的知识主体。
- 不凭空补充 GitHub 权限、计费、Action 版本或供应商行为的外部结论。
- 不执行文章中的命令，不连接 GitHub，不创建 workflow，不生成真实 PR。

## 4. 可视化机会

- 「人在场」到「云端运行」：本地终端与 GitHub runner 的空间迁移。
- `@claude` 与 `/claude`：符号差异直接造成触发／不触发。
- 安装三件套与最小权限：App、Secret、workflow 汇入仓库。
- workflow 四块：`on`、`jobs`、`steps` 和密钥引用按顺序展开。
- `prompt` 开关：有／无决定自动化模式或交互模式。
- 三种用例：PR、issue、schedule 分别展示触发与结果。
- Secrets 保险柜：真实 key 被隐藏，YAML 只留下引用。
- 五步验证：从安装到 PR，再以人工审查收束。

## Gate 1 内部审查

- [x] 核心命题不是文章目录复述，而是「触发位置改变了 Claude Code 的工作边界」。
- [x] 保留了定义、触发、安装前提、workflow、三种用例、安全边界和验证闭环。
- [x] 明确区分了本地 `/install-github-app` 与云端评论 `@claude`。
- [x] 明确区分 `prompt` 有无与自动化／交互模式。
- [x] 安全内容没有被功能演示吞没，包含 Secrets、最小权限、提示注入和人工审查。
- [x] 下一篇 Agent SDK 只作为结尾预告，不提前扩展当前主题。
- [x] 所有事实和示例均限定在 Source 文章提供的范围内，未执行其中任何命令。

Gate 1 结论：通过，进入 Narration Script、Visual Script 和 Visual Prototype。
