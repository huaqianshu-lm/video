# 制作操作说明速查

需要查安装步骤、工具配置或 Agent 操作方法时，按下面的问题找说明。

## 安装、配置和工具操作

| 想做什么 | 去哪里查 | 阅读位置 |
|---|---|---|
| 克隆项目、安装环境、制作第一条视频 | [项目 README](../README.md)<br><code style="white-space: normal; overflow-wrap: anywhere;">README.md</code> | 「环境准备与安装」「制作第一条视频」；遇到上手问题看「常见问题与验证」。 |
| 查工具需要哪些外部依赖 | [工具 README](../scripts/README.md)<br><code style="white-space: normal; overflow-wrap: anywhere;">scripts/README.md</code> | 「环境与依赖」。 |
| 列出、选择或创建系列，添加封面 | [工具 README](../scripts/README.md)<br><code style="white-space: normal; overflow-wrap: anywhere;">scripts/README.md</code> | 「日常使用」中的 video-series 命令。 |
| 准备 TTS 环境、了解服务外发及失败恢复要求 | [TTS 环境说明](TTS-SETUP.md)<br><code style="white-space: normal; overflow-wrap: anywhere;">docs/TTS-SETUP.md</code> | 「环境与配置」「服务选择与外发授权」「产物交接与失败恢复」；使用百炼时再看对应 ASR 部分。 |
| 设置 TTS 路径和服务配置，生成音频、字幕及 Timeline | [工具 README](../scripts/README.md)<br><code style="white-space: normal; overflow-wrap: anywhere;">scripts/README.md</code> | 「TTS 配置与结果」；调用命令在「日常使用」。 |
| 查组件、配置和正文时长的导出接口 | [工具 README](../scripts/README.md)<br><code style="white-space: normal; overflow-wrap: anywhere;">scripts/README.md</code> | 「组件、配置与时长入口」。 |
| 准备或校验输入包、打开 Studio 预览 | [工具 README](../scripts/README.md)<br><code style="white-space: normal; overflow-wrap: anywhere;">scripts/README.md</code> | 「日常使用」中的 video-input、video-preview 及 preview 命令。 |
| 配置本地渲染环境、检查输入、渲染或查询中断结果 | [工具 README](../scripts/README.md)<br><code style="white-space: normal; overflow-wrap: anywhere;">scripts/README.md</code> | 「本地渲染环境」「本地检查与输出」；check／render／inspect 命令在「日常使用」。 |
| 使用 GitHub 发布输入、绑定、派发或查询结果 | [工具 README](../scripts/README.md)<br><code style="white-space: normal; overflow-wrap: anywhere;">scripts/README.md</code> | 「GitHub 操作」。 |
| 修改工具或代码后，查定向检查命令 | [工具 README](../scripts/README.md)<br><code style="white-space: normal; overflow-wrap: anywhere;">scripts/README.md</code> | 「检查」。 |

## 让 Agent 执行当前工作

四份 Skill 较短，进入对应工作时读取整份；具体命令和配置由工具 README 维护。

| 当前工作 | 操作指引 | 主要内容 |
|---|---|---|
| 策划、纯口播与分镜 | [video-production/SKILL.md](../.claude/skills/video-production/SKILL.md) | 第 1～5 步：策划、设计准备、联合收敛、独立审查及用户分镜确认后的交接。 |
| TTS、字幕与真实时间轴 | [narrated-video-tts/SKILL.md](../.claude/skills/narrated-video-tts/SKILL.md) | 第 1～5 步：输入核对、派生、实际服务与授权核对、生成及产物交接。 |
| React／Remotion 实现、观看试听与返修 | [visual-prototype-remotion/SKILL.md](../.claude/skills/visual-prototype-remotion/SKILL.md) | 第 1～6 步：实现、加载正式预览、检查、返修及用户画面确认。 |
| 输入包、预览与渲染交付 | [video-render/SKILL.md](../.claude/skills/video-render/SKILL.md) | 仅准备预览时看第 1 步；正式交付看第 2～4 步，涵盖执行、恢复及收尾。 |

## 需要查规则或判断问题归属

流程确认、设计质量、分镜格式、系列封面规则，以及 references／styles／templates 的职责与使用环节，统一查[制作文档地图](VIDEO-PRODUCTION-DOCUMENT-MAP.md)。

工具当前缺口、已知问题及尚未实测的范围，查 [ROADMAP](../ROADMAP.md) 的「进行中」「阻塞与待承接资料」。
