# 远程渲染成功基线的复用

本手册是 Agent／CLI 渲染准备检查和独立输入包发布步骤的权威来源。成功基线包含实际执行环境、认证来源、完整 Render Run 和该 Run 的代码提交。具体视频的 Run、报告和输入包绑定记录保存在本地忽略目录；凭据不得写入记录。

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

绑定入口下载并验证实际字节，将 URL、SHA、包指纹与视频归属持久化到当前视频的 delivery 记录。发布成功但绑定失败时，保留已发布资产并恢复绑定，不重新生成包或上传重复资产。不得只把 URL／SHA 留在临时 shell 变量中。

## 3. 检查范围与剩余交付

准备检查会更新 Git 引用，不修改视频状态、人工 Gate、工作区内容，不 commit／push／派发。`ok=true` 只表示认证、权限和代码基线通过，仍需现有资源／Manifest 校验、绑定记录校验、精确文件清单确认、定向提交推送、完整 Render 和 Gate 4。

当前该入口由 Agent／CLI 显式调用，尚未自动接入 Web UI／批量派发；Release 发布是已验证的操作步骤，尚不是自动发布功能。新增检查的全路径集成和跨视频完整渲染验证仍待完成，不能据此声明整个渲染流程已经固化。
