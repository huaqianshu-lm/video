# 31 · settings.json：用户级 / 项目级配置 · Content Analysis

## 1. 核心命题

`settings.json` 的难点不在 JSON 语法，而在于理解“配置写在哪一层、哪一层覆盖哪一层、改完如何确认已经生效”。它是 Claude Code 的行为开关总成，和负责自然语言约定的 `CLAUDE.md` 分工不同。

本片要建立一条可执行的配置判断链：

```text
先分清它管什么
    ↓
判断配置属于用户、项目还是本地
    ↓
区分单值覆盖与数组合并
    ↓
按字段的生效时机和文件归属配置
    ↓
用 /status 验证实际加载来源
```

## 2. 观众需要完成的认知变化

1. 从“配置写错了”转为优先检查“配置是否写错楼层”。
2. 分清 `CLAUDE.md` 管自然语言规矩，`settings.json` 管机器行为开关。
3. 能区分用户级、项目级和本地级设置的路径、影响范围与版本控制边界。
4. 记住 Managed、命令行、本地、项目、用户的单值优先级顺序。
5. 认识到权限等数组跨层合并、连接并去重，不按单值规则整体覆盖。
6. 知道 `model`、`permissions`、`env`、`hooks`、`statusLine` 的用途和常见放置层级。
7. 能区分 `settings.json` 与 `~/.claude.json`，并知道 `/config` 不是完整配置文件浏览器。
8. 能根据字段选择热加载、重启或 `/model`，并用 `/status` 查看 Setting sources。
9. 能用用户级 + 项目级配置的练习流程把“写入 → 加载 → 验证”串起来。

## 3. 必须保留的信息

### A. 分工与问题钩子

- `settings.json` 通过分层设置配置 Claude Code 的机器行为。
- `CLAUDE.md` 是给 Claude 看的自然语言项目约定；`settings.json` 是权限、环境、模型、Hook、状态栏等开关。
- `defaultMode: "auto"` 写在项目设置中会被忽略，移动到用户级才生效；这是“放错层”而不是语法错误。

### B. 三个常规层级

| 层级 | 文件位置 | 影响范围 | 版本控制 | 典型内容 |
| --- | --- | --- | --- | --- |
| 用户级 | `~/.claude/settings.json` | 所有项目中的当前用户 | 不进项目 git | 个人模型、状态栏和跨项目偏好 |
| 项目级 | `.claude/settings.json` | 当前仓库所有协作者 | 进入 git | 团队权限、Hook 和共享约定 |
| 本地级 | `.claude/settings.local.json` | 当前仓库中的当前用户 | 自动 gitignore | 私人覆盖和实验性配置 |

另有企业 IT 管理的 Managed 层，它是最高优先级的强制策略。

### C. 优先级与合并语义

- 单值优先级从高到低：Managed → 命令行参数 → 本地级 → 项目级 → 用户级。
- `model`、`defaultMode` 等单值由更高层覆盖更低层。
- `permissions.allow`、`permissions.deny` 等数组跨层合并、连接并去重，不是项目级一写就抹掉用户级。

### D. 高频字段和文件边界

- `model`：默认模型；个人偏好可放用户级，项目统一模型可放项目级，启动时读取，或用 `/model` 现切。
- `permissions`：工具和命令的 allow、ask、deny；团队安全底线通常放项目级。
- `env`：注入会话及子进程的环境变量；按全局或项目专属范围放置。
- `hooks`：在固定生命周期自动执行动作；团队卡点放项目级，个人习惯放用户级。
- `statusLine`：自定义底部状态栏，通常是用户级个人偏好。
- `$schema`：帮助编辑器自动补全和内联校验。
- `~/.claude.json`：登录会话、用户／本地作用域 MCP、信任状态和缓存等幕后数据；`autoConnectIde`、`teammateDefaultModel` 等少数字段不属于 `settings.json`。

### E. 编辑、生效与验证

- 可以直接编辑对应文件，也可以用 `/config` 修改少数固定开关；`/config` 不展示完整 `settings.json`。
- `permissions`、`hooks` 和凭证助手等大多数设置支持热加载。
- `model` 和 `outputStyle` 是启动时只读的一类例外；`model` 可重启或用 `/model`，`outputStyle` 可重启或 `/clear` 后重建。
- `/status` 的 `Setting sources` 用来确认当前会话实际加载了哪些设置源；语法或值错误应从状态报错定位。

### F. 实战流程与总结

- 练习项目 `settings-demo` 同时创建项目级 `settings.json` 与本地级 `settings.local.json`。
- 项目级示例允许 `npm run test`、拒绝 `curl`；本地级示例额外允许 `git status`。
- `git status --short` 用于观察项目级文件和自动忽略的本地级文件差异；进入 Claude Code 后用 `/status`、`/permissions` 验证加载和合并。
- 总结必须收束到：分清分工、层级、优先级、数组合并、常用字段和 `/status` 验证。
- 结尾保留源文已有的下一篇预告：32「输出样式（Output Styles）」；不读取或处理下一篇文章。

## 4. 因果、对比与流程关系

### 核心因果

```text
配置语法完全正确
    ↓
仍然可能因作用域、文件归属或生效时机不对而无效
    ↓
先判断楼层，再确认合并和加载来源
```

### 对比关系

- `CLAUDE.md` vs `settings.json`：自然语言规矩 vs 机器行为开关。
- 用户级 vs 项目级 vs 本地级：跨项目个人默认 vs 团队共享配置 vs 当前仓库私人配置。
- 单值覆盖 vs 数组合并：高层替换 vs 跨层连接去重。
- `settings.json` vs `~/.claude.json`：行为开关 vs 会话状态、MCP 和缓存。
- 热加载字段 vs 启动时读取字段：存盘后生效 vs 重启或对应命令后生效。

### 流程关系

```text
创建项目
    ↓
写入项目级和本地级配置
    ↓
查看 git 忽略边界
    ↓
进入会话
    ↓
/status 查看 Setting sources
    ↓
/permissions 交叉确认规则
```

## 5. 可视觉化内容

- 配置写错楼层的开场：同一行 `defaultMode: "auto"` 在项目层被忽略，移动到用户层后亮起。
- `CLAUDE.md` 与 `settings.json` 的档案柜／电闸盒双窗口对比。
- 用户、项目、本地三层文件路径和影响范围的空间分层。
- Managed → CLI → Local → Project → User 的优先级堆栈。
- 单值覆盖与数组合并的两条不同路径。
- 高频字段卡片连接到用户级或项目级，并用 `$schema` 校验标记。
- `settings.json` 与 `~/.claude.json` 的文件边界分流。
- 编辑、热加载、重启例外、`/status` 的时间线。
- “配置不生效”排查表逐行高亮。
- 用户级 + 项目级练习配置进入 `/status` 和 `/permissions` 验证面板。

## 6. 内容取舍与边界

- 保留源文 01—07 节的完整知识骨架，但按“问题 → 分层 → 语义例外 → 字段 → 验证 → 实战 → 总结”重新组织 Scene。
- 保留源文中的路径、命令、字段和配置示例作为屏幕文字；本任务只把它们作为视频内容，不执行任何命令。
- Managed 层只作为最高策略的简短说明，不展开企业部署细节。
- 下一篇只显示源文已有的标题和预告，不读取文章目录中的下一篇文章。
- 不生成 `tts-script.json`、音频、字幕、Timeline，不修改 `src/videos/`，不进入 Remotion 或渲染。

## 7. Gate 1 内部一致性检查

- [x] 核心命题明确：配置问题首先是作用域、合并语义和生效时机问题。
- [x] 必须信息覆盖源文 01—07 节：分工、三层、优先级、数组合并、字段、文件边界、验证、实战和总结。
- [x] 11 个 Scene 按观众认知过程重组，没有机械平铺文章小节。
- [x] 对比、因果、优先级、合并和验证流程均可回溯到 `source.md`。
- [x] 屏幕文字范围仅使用当前源文及本目录后续生产资料中的语义，不引入其他视频的业务文案。
- [x] 未执行源文命令，未读取或处理下一篇文章，未进入 TTS、Remotion 或渲染。

