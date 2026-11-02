# 渲染交付与成功基线的复用

## 渲染方式

本轮是在现有项目内迭代共享交付能力。当前生产须符合唯一 Storyboard 契约；旧生产资料通过正常返工补齐，旧 Job 的历史读取不构成继续旧流程的许可，completed 永久只读。

单条新交付默认 `local`，可显式选择 `github`；批量只允许 `github`，服务端拒绝本地批量。两种方式共享 `render-delivery prepare／start／resume` 和人工 Gate 3／Gate 4。旧 session／Job 没有 backend 时解释为 github，恢复沿用原方式，不因默认值变更而重新派发。已有任务先恢复，不能换方式绕过原任务。

本地：`render-delivery prepare <slug> --backend local` 校验生产资料及本机环境（当前执行器要求 FFmpeg 9），保存绑定代码／输入／环境的计划，展示输出与日志路径；`start <slug> --confirm-plan <planId>` 确认后创建持久化 Job，由独立 worker 调用 Remotion 无头浏览器和系统 FFmpeg（并发 1）。不需要 GitHub Token、远端基线、输入包发布、commit 或 push。新版滤镜文件参数兼容与内置 AAC 选择由执行器负责。应用不提升宿主权限；启动失败明确报告权限／浏览器或环境问题。输出须通过规格、帧数、音轨和解码检查后才进入 Gate 4；用户人工验收不自动通过。

`resume` 核实同一 worker 及保存结果，不启动第二次渲染；进程已退出且缺少有效结果时明确失败。经用户要求重试，或本地成片被 Gate 4 驳回后，用 `prepare --retry-job <原JobId>` 生成新计划并确认后启动，属于重新渲染，不是帧级续跑。即使重试计划指纹相同，也必须创建新 Job；旧 worker 进程组仍存活时先阻断重试。新成片按视频名称（项目 slug）命名为 `<slug>.mp4`；本地按 Job 隔离保存在忽略的 `out/local-render/<slug>/<jobId>/<slug>.mp4`，GitHub 沿用 `out/<slug>.mp4`。旧 Job 恢复使用记录中的原路径，不重命名历史成片。日志和执行快照保存在 `local/local-render/<slug>/<jobId>/`。机器记录不代替实际音画验收。代码与自动回归已完成，真实入口整片与跨视频验收待完成，具体状态以 ROADMAP.md 为准。

GitHub：`prepare <slug> --backend github` 及所有批量交付继续按下文远程基线／发布／精确清单授权执行，不修改既有 Actions 配置。下文有关 Git、发布、认证和远程 Run 的要求只适用于 github。

本手册是所有渲染入口的准备检查和独立输入包发布步骤的权威来源。成功基线包含实际执行环境、认证来源、完整 Render Run 和该 Run 的代码提交。具体视频的 Run、报告和输入包绑定记录保存在本地忽略目录；凭据不得写入记录。

## GitHub 路径的固定交付服务

统一入口为 `node harness/src/cli.mjs render-delivery <prepare|start|resume> <slug>`。Web UI 的准备／提交／恢复操作复用同一服务；批量使用 `batch delivery prepare／start／resume`，合并精确文件计划只提交一次，每条视频保留自己的输入包、交付记录和 Job。共享入口已实现并有隔离回归，真实交付与跨视频验收待完成，见 ROADMAP.md。生产者为当前视频资料／独立输入包与 Git 交付计划，消费者为现有 Render Monitor 和 GitHub Actions；不改变 Workflow、输入包 schema、人工 Gate 或 Actions 配置。旧 `remote-run` CLI 入口停用并指向新入口；低层输入包命令保留作诊断，不能替代完整交付。

- `prepare`：先持久化本次 github 方式和准备阶段，发布／绑定中断后再次 prepare 保持同一方式；未生成计划时 start／resume 提示先恢复准备。读取本地固定方法配置，强制 gh 系统凭据来源与成功基线预检，准备／校验当前输入包，发布独立私有 Release 并绑定，保存精确交付清单供用户确认。首次指定 `--repository`、`--input-repository`、`--ref`、`--baseline-run`；检查通过后保存在忽略的 `local/render-method.json`，以后复用。多组件可用 `--component-file`／`--component-export` 明确入口。
- `start --confirm-plan <planId>`：仅在用户明确确认展示过的精确清单后调用；重新检查代码、输入包和文件清单，定向 commit／push 后创建持久化 Job 并发起完整 Render。没有确认或计划变化时停止。原工作区与远端分叉时先按本手册准备独立交付工作区，不自动合并或推送无关提交。
- `resume`：恢复当前视频已确认的交付与既有 Job，不重新准备包、不重复创建 Release 或渲染。提交成功而推送失败时复用已记录的提交；有 Run ID 时查询该 Run，不能用本地等待超时覆盖远端实际成功。远端成功且有效 Artifact 存在后停在 Gate 4，用户下载与验收。

远端已明确失败且用户要求重新渲染时，使用 `prepare <slug> --retry-job <原JobId>` 重新准备并展示清单；本地超时、网络中断、派发结果不确定或 Artifact 过期都不能作为自动重渲染的理由。新计划仍须明确确认后 start。

发布与绑定采用相同固定认证环境；网络／凭据错误保留断点并明确区分，不能解释为 Release 不存在。方法配置不含 Token，既有发布资产不覆盖。完成态视频不执行写操作。机器检查只能核对权限、字节、指纹、Git 与远端结果，不替代人工确认文件清单和 Gate。

验收：AC-1 [MUST] 从实际 CLI 入口走通准备、确认后发起和恢复；AC-2 [MUST] 过期计划／绑定阻断派发；AC-3 [MUST] 发布、推送与派发后的中断能复用断点且不重复副作用；AC-4 [MUST] 超时后核实同一 Run／Artifact 并保持 Gate 4 人工验收；AC-5 [MUST] 不修改已完成视频或无关工作区内容。实现、隔离入口验证与真实交付验收分别登记；未完成实际路径验收时保持“待实际入口验证”；新的真实生产渲染须另有用户授权。

## 1. 在实际交付工作区检查成功基线

已有成功完整 Render 时，Agent／CLI 在整理交付文件清单前必须运行：

```bash
node harness/src/render-preflight.mjs \
  --workspace "<实际交付工作区>" \
  --repository "<owner/code-repo>" \
  --input-repository "<owner/input-repo>" \
  --ref "<实际派发分支>" \
  --baseline-run "<已验证的完整Render Run ID>" \
  > "local/render-input/<slug>.preflight.json"
```

退出码为 0 且报告 `ok=true` 才能继续。入口读取现有 `gh` 系统凭据，清除子进程的 `GITHUB_TOKEN`／`GH_TOKEN` 覆盖，检查实际 API 身份、两个仓库写权限、完整 Render Workflow、成功 Run 和实际远端分支；随后 fetch 并检查远端及工作区 HEAD 都包含成功 Run 的提交。API 与 fetch 快照不一致时必须重新检查。

沙箱不能读取钥匙串或联网时，Agent 必须通过执行工具获准的宿主访问方式运行检查。应用代码不提升权限。后续发布、绑定、获准推送、派发和监控必须在同一具备权限的环境执行。只有宿主环境证实凭据缺失或 GitHub 实际拒绝认证时才重新登录；网络错误、沙箱错误和代码缺失分别处理。

`render-code-baseline-missing` 表示代码未继承成功版本，不能通过更换 Token 解决。优先整合已发布修复；开发分支有无关改动或与远端分叉时，从核实过的远端提交建立隔离交付工作区，保留原工作区，重新计算本次渲染必需的精确差异。该检查采用提交祖先关系，不自动认可 cherry-pick 的等价修复；这类情况必须另行审查并建立新的已验证基线。

没有历史成功 Run 的首次环境验证不能伪造基线，应按现有独立 Smoke Render 规则完成验证。

## 2. 发布当前视频自己的独立输入包

使用当前 Workflow 的 prepare／package 入口；多主组件时显式指定当前入口。已有有效绑定包可以按既有指纹复用规则保留原 ZIP，不能复用其他视频的包：

```bash
node harness/src/cli.mjs render-input prepare <slug>
node harness/src/cli.mjs render-input package <slug>
shasum -a 256 "local/render-input/<slug>.zip"
```

包只存在于忽略的 `local/render-input/`，发布到独立输入仓库。固定使用 `<slug>-input-<sha前缀>` Release tag。操作前先通过 API 查询该 tag：只有明确不存在才能创建；认证失败或网络失败不能当作“没有 Release”。原 tag 下已有同名资产时先核对 digest 或下载内容，不覆盖不一致的资产，应使用新的 tag／版本。

下面命令是发布步骤示例，变量占位必须替换为本次记录中的值。原始 `gh` 命令同样清除环境 Token 覆盖，并在获准宿主环境运行：

```bash
env -u GITHUB_TOKEN -u GH_TOKEN gh api \
  "repos/<owner/input-repo>/releases/tags/<tag>"
# 仅在上述查询明确确认不存在后创建；已有 Release 则复用。
env -u GITHUB_TOKEN -u GH_TOKEN gh release create "<tag>" \
  --repo "<owner/input-repo>" --title "<tag>" --notes "Render input package"
# 仅在资产尚不存在时上传，不使用 --clobber。
env -u GITHUB_TOKEN -u GH_TOKEN gh release upload "<tag>" \
  "local/render-input/<slug>.zip" --repo "<owner/input-repo>"
env -u GITHUB_TOKEN -u GH_TOKEN gh api \
  "repos/<owner/input-repo>/releases/tags/<tag>" \
  --jq '.assets[] | {id,name,url,digest,size}'
```

选择本次 ZIP 的 API 资产 URL，核对远端 digest 与本地 SHA；没有 digest 时下载复核。网页下载地址不能作为绑定 URL。随后绑定：

```bash
node harness/src/cli.mjs render-input bind <slug> \
  --url "https://api.github.com/repos/<owner/input-repo>/releases/assets/<asset-id>" \
  --sha256 "<本次ZIP的SHA-256>"
```

绑定入口优先校验 GitHub Release Asset API 返回的 SHA-256 digest 与本地 ZIP；API 未提供 digest 时，下载完整字节并在 60 秒内验证 SHA-256。绑定成功后，将 URL、SHA、包指纹与视频归属持久化到当前视频的 delivery 记录。发布成功但绑定失败时，保留已发布资产并恢复绑定，不重新生成包或上传重复资产。不得只把 URL／SHA 留在临时 shell 变量中。

## 3. 检查范围与剩余交付

准备检查会更新 Git 引用，不修改视频状态、人工 Gate、工作区内容，不 commit／push／派发。`ok=true` 只表示认证、权限和代码基线通过，仍需现有资源／Manifest 校验、绑定记录校验、精确文件清单确认、定向提交推送、完整 Render 和 Gate 4。

Agent 单条入口已串联本手册的准备检查、独立 Release 发布／绑定、清单确认、定向提交推送、派发和同一 Job 恢复；下述底层命令供诊断和人工恢复参考，不作为日常替代入口。Web UI／批量已接入共享预检、发布绑定与逐视频交付断点；批量提交后的推送恢复和每条视频派发复用统一服务。共享单条／Web／批量已有隔离回归，实际整片交付与跨视频验收尚未完成，不把代码接入或 Fixture 验证视为固化完成。每次真实交付的认证／权限／成功代码基线仍须另行预检；下一条实际视频仍需完成真实 Render 和 Gate 4，不能把 Fixture 当作实际成片。

## 对话、Web UI 与批量操作

- 对话 Agent 使用单条 CLI；制作资料须先 `production-task claim`，返回制作结果后由 Harness 推进，不能自行改状态。
- Web UI 支持准备、确认及恢复交付；Gate 3 等待时可先准备清单，在一次明确提交中分别记录音画审核与文件清单授权。任何一个条件失效都阻断派发。
- 批量：`batch delivery prepare <id>` 展示逐视频绑定及合并文件计划；`batch delivery start <id> --confirm-plan <id>` 明确授权定向提交、推送和真实 Render；`batch delivery resume <id>` 恢复保存的授权、提交及各视频 Job。未经授权的清单不能通过 resume 执行。
- Web UI 批量一次确认可分别授权文件清单、commit、push 与真实 Render；后端分别保存事实。已有仅 commit／push 授权时，仍需显式 Render 授权，不能从提交成功推断渲染许可。
- 单条与批量共用忽略的 local/render-method.json；若派发分支或实际工作区与成功基线不一致，先核实并纠正。开发分支不能自动冒用 main 基线。
