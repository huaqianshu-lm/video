# 紧凑分镜设计审计

先按 `docs/STORYBOARD-EXECUTION-QUALITY.md` 完成全片创作与独立审查；SQ-1～10 是设计方法，不逐事件或逐 Shot 重复填表。

正式输出为 storyboard-design-audit.json，schemaVersion 3。结构以 `contracts/video-production/current/storyboard-design-audit.schema.json` 为准。

- 绑定当前 videoSlug、inputVersion（当前 designInputVersion）、storyboardFingerprint、narrationFingerprint 和 ruleVersion。
- reviewedSceneIds：实际审查覆盖的全部 Scene ID，不以列出 ID 代替审查。
- status：设计已审查为 ready；设计尚不能判断为 pending。
- summary：全片视觉主线、具体判断和依据；无需复述完整分镜。
- findings：仅实际发现的问题，可为空。按需定位 Scene／Shot／Event，记录 problem、status 和 resolution；open 阻断，resolved 说明修正，gate-3 说明真实画面或试听待验范围。

ready 不是人工批准，也不是实际观看证明；没有实际观看不得声称已验证。旧格式只读，不自动转换。
