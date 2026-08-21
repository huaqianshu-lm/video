# 插件参考手册：Content Analysis

## 1. 核心命题

插件不是黑盒，而是一套有明确结构、组件边界、路径规则和分发机制的可复用配置包。理解它的内部构造，才能从“会安装别人的插件”进一步走到“能造、能测、能发布自己的插件”。

## 2. 观众需要带走的知识

### 2.1 插件的基本模型

- 插件是一个目录。
- `.claude-plugin/` 只放 `plugin.json`，其他组件目录必须放在插件根目录。
- 插件根目录里的 `CLAUDE.md` 不会作为项目上下文加载。
- `plugin.json` 是可选的，但正式发布时用于声明身份、元数据、组件路径和依赖。

### 2.2 清单字段与路径行为

- `name` 是写入 `plugin.json` 时唯一必填字段，采用 kebab-case，并决定组件命名空间。
- `displayName`、`version`、`description`、`author`、`homepage`、`repository`、`license`、`keywords` 用于描述和发布。
- `commands`、`agents`、`outputStyles` 是替换默认目录的路径字段。
- `skills` 是追加到默认 `skills/` 的额外路径字段。
- `hooks`、`mcpServers`、`lspServers` 可以指向配置文件或直接内联。
- `dependencies` 声明插件依赖及可选的 semver 版本范围。

### 2.3 七类组件及边界

| 组件 | 标准位置 | 主要作用 |
|---|---|---|
| Skills | `skills/<name>/SKILL.md` | 可调用的专项能力 |
| Commands | `commands/*.md` | skill 的扁平旧写法 |
| Agents | `agents/*.md` | 专项 subagent |
| Hooks | `hooks/hooks.json` | 生命周期事件触发的动作 |
| MCP servers | `.mcp.json` | 连接外部服务 |
| LSP servers | `.lsp.json` | 提供代码智能 |
| Monitors | `monitors/monitors.json` | 后台监视日志或状态 |

需要特别保留的限制：插件提供的 agent 不支持 `hooks`、`mcpServers`、`permissionMode`；monitor 是实验性能力，只在交互式会话中运行，并要求 Claude Code v2.1.105 以上。`bin/` 可执行文件会进入 Bash 工具的 PATH，`settings.json` 当前支持 `agent` 和 `subagentStatusLine` 两个键。

### 2.4 可视化的开发与发布链路

- 本地开发内循环：`claude plugin init` 起骨架，写 skill，用 `--plugin-dir` 加载，用命名空间调用，再用 `/reload-plugins` 重新加载需要刷新的组件。
- 市场由根目录的 `.claude-plugin/marketplace.json` 描述。
- “市场源”指向目录文件，“插件源”指向每个插件本体；两者可以不是同一处。
- 发布前用 `claude plugin validate` 校验市场或具体插件。
- 自用、开发、团队／社区发布分别适合 skills 目录插件、`--plugin-dir` 和 marketplace。

### 2.5 发布风险

- `plugin.json` 一旦写入 `version`，后续发布必须递增版本号，否则用户可能继续使用旧缓存；如果不写 `version`，Git 提交 SHA 可作为版本变化依据。
- 不要同时在 `plugin.json` 和市场条目里维护互相冲突的版本号；清单中的值会覆盖市场条目。
- `dependencies` 可声明依赖插件和 semver 范围；卸载时 `--prune` 只清理为满足依赖而自动安装的插件，不会清理用户手动安装的插件。

## 3. 信息取舍

### 必须保留

- `.claude-plugin/` 的位置铁律。
- `name` 与命名空间的关系。
- 路径字段“替换”和“追加”的区别。
- 七类组件及 agent 安全限制、monitor 实验性边界。
- `CLAUDE_PLUGIN_ROOT`、`CLAUDE_PLUGIN_DATA`、`CLAUDE_PROJECT_DIR` 的职责差异。
- `plugin init`、`--plugin-dir`、`/reload-plugins` 的本地开发内循环。
- marketplace 的市场源／插件源区别和 `plugin validate`。
- 三种分发路径。
- version 与 dependencies 两个发布坑。

### 适合弱化

- Hook 的完整事件清单，不在视频中逐项枚举。
- `author` 等元数据字段的所有子字段，不逐字段展开。
- git-subdir、npm 等所有插件源形式，只保留为市场源可选形式的示例。
- `settings.json` 的细节只作为边角信息出现。

### 不进入本片

- 第 24 篇已经讲过的安装别人插件的完整流程。
- 文章中的下一篇“实战入门”具体内容；只在结尾做主题预告。

## 4. 事实边界与风险

- 本片依据输入文章中的插件参考信息组织，不把示例命令当成已经在本项目执行过的事实。
- `Monitors` 的实验性状态、版本要求和插件 agent 的字段限制必须保留限定语，不把它们表达为普遍稳定能力。
- 本片用“插件里的 `CLAUDE.md` 不会作为项目上下文加载”作为文章中的规则说明，不延伸为对其他上下文机制的概括。

## 5. 可视觉化内容

- 目录树：说明书与零件盒的空间关系。
- `plugin.json`：字段填入、命名空间生成和路径扫描规则。
- 七类组件：从同一个插件盒中分格出现。
- agent 的受限字段与 monitor 的实验性标签：用边界和状态表达，而非大段解释。
- 三个路径变量：ROOT、DATA、PROJECT_DIR 的指向关系。
- 开发内循环：命令、skill 调用和 reload 的状态变化。
- 市场源与插件源：商场目录和商品供货地的连接关系。
- 分发路线：自用、开发、发布的选择。
- version 与 dependencies：更新触发和依赖链。

