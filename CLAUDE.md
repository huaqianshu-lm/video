# CLAUDE.md

本文件是本项目唯一的项目级规范源；全局规则来自 `~/.claude/CLAUDE.md`。AGENTS.md 等仅做兼容指引，不复制维护规则。

## 项目定位

本项目维护「制作规范＋必要脚本＋Remotion」。Agent 与用户直接协作：原始内容 → 合并策划与内部检查 → 纯口播／Storyboard 联合收敛 → Agent 审核口播、完成独立设计审查与修订 → 用户确认分镜 → TTS／字幕／真实 Timeline → Agent 编写 React／Remotion → Agent 完整观看、正常速度试听并修正问题 → 用户实际观看、试听并确认画面 → 明确授权渲染 → 用户验收成片。

只制作口播教程，使用 Scene → Shot → Event 分镜格式。

## 规则与 Skill 路由

- 当前制作入口、人工确认、变更范围及只读边界：`docs/DIRECT-VIDEO-PRODUCTION.md`。
- 策划、口播与分镜：`.claude/skills/video-production/SKILL.md`。
- TTS、字幕与 Timeline：`.claude/skills/narrated-video-tts/SKILL.md`。
- 分镜实现及观看／试听：`.claude/skills/visual-prototype-remotion/SKILL.md`。
- 输入包、Studio、本地／GitHub 交付：`.claude/skills/video-render/SKILL.md`。
- 系列选择、封面快照与统一片头：`docs/AGENT-SERIES-COVER.md`；先列实际名称和封面状态，由用户选择，不按文件名推断。
- 分镜数据与设计质量：`docs/STORYBOARD-PRODUCTION-CONTRACT.md`、`docs/STORYBOARD-EXECUTION-QUALITY.md`。
- 内容、画面、声音与审美：`docs/VIDEO-PRODUCTION-RULES.md`；8.6 为量化参数唯一来源，12.2 规定审美与感官检查；参考方法与模板维护分别见 `references/README.md`、`templates/README.md`。Skill／模板不重复维护数值。
- TTS 环境与外发：`docs/TTS-SETUP.md`；渲染认证与成功基线：`docs/RENDER-DELIVERY-BASELINE.md`。
- 分镜及实现先读 `references/README.md`，按表达问题选读案例／方法；设计成立后再查 `templates/README.md`，不默认加载全部参考。

`docs/` 是当前稳定规范；`drafts/` 是方案，不具有规范效力；`notes/` 是按需排障笔记。工具命令只在 `scripts/README.md` 维护。

## 仓库边界

长期维护并提交：`scripts/` 单项工具及其必要内部模块／测试，`src/components/`、`src/scenes/`、`src/lib/` 通用Remotion能力，`styles/`、`templates/`、`contracts/`、`references/`、当前Skills与docs，以及README和ROADMAP。

具体视频资料和资源只在本地，不提交：`videos/`、`src/videos/`、`assets/`、`series/`、`public/local-assets/`、`public/series-assets/`、`local/`、`out/`、`drafts/`、`notes/`、媒体及临时 `src/RenderInputRoot.tsx`。

`harness/` 中已有记录、缓存及百炼虚拟环境原位保留；只读使用完成状态与 provider 配置等资料。

具体视频不得成为远端唯一规范或模板来源。Schema／合法示例放 contracts。references 只收可复用设计方法、观察与必要来源，不收上游源码、媒体或具体视频业务资料。

## 项目底线

- 人工确认只能由用户明确决定；Agent 自检、机器检查或文件存在不能代替用户确认。
- `completed` 永久只读，覆盖内容、资料、代码、配置、媒体、字幕、Timeline／Manifest、审核、状态、进度、尝试次数、历史Job／任务及所有关联产物。只读检查和已有包预览允许；必须制作新版本时新建标识或独立副本，不回写原视频。
- 提交分镜前完成独立设计审查；提交画面前完整观看并正常速度试听，如实记录未验范围，技术检查不能替代实际观看与试听。

## 直接制作与变更

制作记录、确认范围、变更返修及已有资料承接按 `docs/DIRECT-VIDEO-PRODUCTION.md` 执行。

视频制作授权与流程改造分开。新增强制生成器、工具、表达限制或依赖前须说明原方式、新方式、实际调用及影响，取得相应授权；不能以内部实现或阶段名称未变隐藏变更。已明确授权范围不重复请求确认。

## 预览与交付

正式渲染须用户明确授权当前输入；远程发布、代码提交推送和派发按各自明确授权执行。保护正在使用的预览，不因工具升级自动关闭或覆盖。

输入包、交付方式、认证、恢复及 Smoke 检查按 `docs/RENDER-DELIVERY-BASELINE.md` 执行，命令与路径查 `scripts/README.md`。

## 工程和质量沉淀

使用React、TypeScript和Remotion，Node.js18+，TypeScript固定 `~5.8.3`。不引入数据库、登录、后端服务、复杂状态管理或无关依赖。

按当前视频的表达需要选择、改造或编写组件；有复用价值的实现，再按 `templates/README.md` 的模板准入要求沉淀。历史认可不替代当前视频检查。

文档更新、代码实现与实际入口验证分别报告，不超出实际证据宣称完成。改动后主动验证当前改动及直接影响行为；整套回归仅在用户明确要求时运行。工程检查、排障及修复沉淀见 `scripts/README.md`。

## 进度与交付

开发、修复、文档补齐或重要调研后同步 ROADMAP，记录当前阶段、下一步、阻塞及验证缺口。未验证不写完成，待实际入口或跨视频验证须明确标注。

交付说明按 `docs/DIRECT-VIDEO-PRODUCTION.md` 执行，如实区分已验与未验、预期与实际结果。

按用户要求停用record-project-event，不生成Project Event，历史记录保留。
