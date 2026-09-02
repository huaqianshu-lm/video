import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import type {CSSProperties, ReactNode} from 'react';
import {SeriesCover} from '../../components/SeriesCover';
import {TimedCaption} from '../../components/TimedCaption';
import {getContentStartFrame, getSceneStartFrame, getTotalDurationFrames, secondsToFrames} from '../../lib/timing';
import {codexBackground, codexGridBackground, codexPalette as colors} from '../../styles/codex';
import {videoConfig} from './video.config';
import subtitleManifest from './generated/subtitle-manifest.json';
import timelineManifest from './generated/timeline-manifest.json';

const success = '#72dfaa';

const panel: CSSProperties = {
  background: 'linear-gradient(180deg, rgba(14, 28, 39, .92), rgba(8, 18, 27, .96))',
  border: `1px solid ${colors.line}`,
  borderRadius: 18,
  boxShadow: '0 18px 50px rgba(0,0,0,.24)',
};

const mono: CSSProperties = {fontFamily: 'Menlo, Monaco, Consolas, monospace'};

const fade = (frame: number, start = 0, distance = 18) => interpolate(frame, [start, start + distance], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const slide = (frame: number, start = 0, distance = 18) => interpolate(frame, [start, start + distance], [24, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

const sceneCueFrames = Object.fromEntries(subtitleManifest.scenes.map((scene) => {
  const timing = timelineManifest.scenes.find((item) => item.sceneId === scene.sceneId);
  const frames = timing
    ? scene.segments.flatMap((segment) => {
      const segmentTiming = timing.segments.find((item) => item.segmentId === segment.segmentId);
      return segmentTiming ? segment.cues.map((cue) => secondsToFrames(segmentTiming.offset + cue.start, videoConfig.fps)) : [];
    })
    : [];
  return [scene.sceneId, frames];
})) as Record<string, number[]>;

const revealFrame = (sceneId: string, cueIndex: number, fallback: number) => sceneCueFrames[sceneId]?.[cueIndex] ?? fallback;

const Shell = ({children}: {children: ReactNode}) => (
  <AbsoluteFill style={{background: codexBackground, color: colors.text, fontFamily: '"Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", Arial, sans-serif', overflow: 'hidden'}}>
    <div style={{backgroundImage: codexGridBackground, backgroundSize: '42px 42px', inset: 24, opacity: .22, position: 'absolute'}} />
    <div style={{border: `1px solid ${colors.line}`, borderRadius: 24, inset: 24, position: 'absolute'}} />
    <div style={{bottom: 112, left: 116, position: 'absolute', right: 116, top: 80, zIndex: 1}}>{children}</div>
  </AbsoluteFill>
);

const Title = ({label, children, subtitle}: {label: string; children: ReactNode; subtitle?: string}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{left: 0, position: 'absolute', top: 0, zIndex: 2}}>
      <div style={{color: colors.accent, fontSize: 23, fontWeight: 800, letterSpacing: 3.2, opacity: fade(frame)}}>{label}</div>
      <div style={{fontSize: 53, fontWeight: 850, letterSpacing: -2, lineHeight: 1.12, marginTop: 12, maxWidth: 1050, opacity: fade(frame, 6), transform: `translateY(${slide(frame, 6)}px)`}}>{children}</div>
      {subtitle ? <div style={{color: colors.muted, fontSize: 22, marginTop: 14, opacity: fade(frame, 14)}}>{subtitle}</div> : null}
    </div>
  );
};

const Panel = ({children, style}: {children: ReactNode; style?: CSSProperties}) => <div style={{...panel, ...style}}>{children}</div>;

const Badge = ({children, tone = colors.accent, style}: {children: ReactNode; tone?: string; style?: CSSProperties}) => (
  <span style={{background: `${tone}1b`, border: `1px solid ${tone}`, borderRadius: 999, color: tone, display: 'inline-flex', fontSize: 18, fontWeight: 800, padding: '8px 14px', whiteSpace: 'nowrap', ...style}}>{children}</span>
);

const Arrow = ({tone = colors.accent, children = '→', style}: {tone?: string; children?: ReactNode; style?: CSSProperties}) => (
  <span style={{color: tone, fontSize: 30, fontWeight: 800, ...style}}>{children}</span>
);

const Node = ({children, tone = colors.accent, active = false, style}: {children: ReactNode; tone?: string; active?: boolean; style?: CSSProperties}) => (
  <div style={{...panel, borderColor: active ? tone : colors.line, boxShadow: active ? `0 0 0 5px ${tone}14, 0 16px 44px rgba(0,0,0,.25)` : panel.boxShadow, color: active ? colors.text : colors.muted, padding: '16px 20px', textAlign: 'center', ...style}}>{children}</div>
);

const Window = ({title, children, style}: {title: string; children: ReactNode; style?: CSSProperties}) => (
  <Panel style={{overflow: 'hidden', ...style}}>
    <div style={{alignItems: 'center', background: 'rgba(255,255,255,.045)', borderBottom: `1px solid ${colors.line}`, display: 'flex', gap: 8, padding: '13px 18px'}}>
      {['#fb7185', '#f2b85b', '#72dfaa'].map((tone) => <span key={tone} style={{background: tone, borderRadius: 99, height: 10, width: 10}} />)}
      <span style={{...mono, color: colors.muted, fontSize: 17, marginLeft: 8}}>{title}</span>
    </div>
    <div style={{padding: 22}}>{children}</div>
  </Panel>
);

const Scene01 = () => {
  const frame = useCurrentFrame();
  const commandStart = revealFrame('01', 0, 20);
  const conditionStarts = [2, 3, 4].map((cue, index) => revealFrame('01', cue, 140 + index * 55));
  const pathStart = revealFrame('01', 8, 420);
  return <Shell>
    <Title label="SCENE 01 · START WITH CONDITIONS" subtitle="一条命令的背后，仍有三项会影响后续步骤的条件。">先别急着复制安装命令</Title>
    <Window title="terminal · waiting" style={{left: 55, opacity: fade(frame, commandStart), position: 'absolute', top: 220, transform: `translateY(${slide(frame, commandStart)}px)`, width: 620}}>
      <div style={{...mono, color: colors.muted, fontSize: 24, lineHeight: 1.7}}><span style={{color: colors.accent}}>$</span> install codex</div>
      <div style={{color: colors.warning, fontSize: 20, marginTop: 12, opacity: fade(frame, commandStart + 18)}}>○ 先确认条件，再执行</div>
    </Window>
    <div style={{left: 700, opacity: fade(frame, commandStart + 20), position: 'absolute', top: 270}}><Arrow tone={colors.warning}>立即安装</Arrow></div>
    <div style={{background: colors.warning, height: 2, left: 675, opacity: fade(frame, commandStart + 20), position: 'absolute', top: 303, width: 120}} />
    <div style={{display: 'grid', gap: 18, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', left: 55, position: 'absolute', right: 820, top: 505}}>
      {['使用入口', '账号路径', '网络连通性'].map((text, index) => <Node key={text} active={frame >= conditionStarts[index] + 12} style={{minWidth: 0, opacity: fade(frame, conditionStarts[index]), transform: `translateY(${slide(frame, conditionStarts[index])}px)`}}>{text}</Node>)}
    </div>
    <div style={{background: `linear-gradient(90deg, ${colors.accent}, ${colors.accentStrong})`, height: 2, left: 885, opacity: fade(frame, pathStart - 24), position: 'absolute', top: 535, width: 125}} />
    <div style={{left: 1040, opacity: fade(frame, pathStart), position: 'absolute', top: 505, transform: `translateY(${slide(frame, pathStart)}px)`, width: 500}}><Node active tone={success}>我的启动路径</Node><div style={{color: colors.muted, fontSize: 18, marginTop: 12, textAlign: 'center'}}>先确认条件，再选择路径</div></div>
  </Shell>;
};

const Scene02 = () => {
  const frame = useCurrentFrame();
  const entryStart = revealFrame('02', 0, 24);
  const linuxStart = revealFrame('02', 4, 240);
  const tagsStart = revealFrame('02', 6, 300);
  return <Shell>
    <Title label="SCENE 02 · CHOOSE AN ENTRY">工作方式决定入口</Title>
    <div style={{display: 'grid', gap: 34, gridTemplateColumns: '1fr 1fr', left: 68, position: 'absolute', right: 68, top: 210}}>
      <Window title="desktop app · macOS／Windows" style={{borderColor: frame >= entryStart + 16 ? colors.web : colors.line, opacity: fade(frame, entryStart), transform: `translateY(${slide(frame, entryStart)}px)`}}>
        <div style={{alignItems: 'center', display: 'flex', gap: 22}}><div style={{border: `1px solid ${colors.web}`, borderRadius: 10, height: 108, padding: 12, width: 140}}><div style={{background: colors.web, height: 7, marginBottom: 12, opacity: .7, width: '55%'}} /><div style={{background: colors.line, height: 8, marginBottom: 10, width: '85%'}} /><div style={{background: colors.line, height: 8, width: '68%'}} /></div><div><h2 style={{fontSize: 28, margin: 0}}>桌面 App</h2><div style={{color: colors.muted, fontSize: 20, marginTop: 12}}>图形项目工作流</div><Badge tone={colors.web} style={{fontSize: 16, marginTop: 18}}>macOS／Windows</Badge></div></div>
      </Window>
      <Window title="terminal · automation" style={{borderColor: frame >= entryStart + 16 ? colors.cli : colors.line, opacity: fade(frame, entryStart), transform: `translateY(${slide(frame, entryStart)}px)`}}>
        <div style={{alignItems: 'center', display: 'flex', gap: 22}}><div style={{...mono, background: '#061018', border: `1px solid ${colors.cli}`, borderRadius: 10, color: colors.cli, fontSize: 30, padding: '30px 22px', width: 140}}>&gt;_</div><div><h2 style={{fontSize: 28, margin: 0}}>CLI</h2><div style={{color: colors.muted, fontSize: 20, marginTop: 12}}>终端操作 · 自动化任务</div><div style={{display: 'flex', gap: 10, marginTop: 18}}><Badge tone={colors.cli} style={{fontSize: 15}}>官方独立安装器</Badge><Badge tone={colors.cli} style={{fontSize: 15}}>不要求 Node.js</Badge></div></div></div>
      </Window>
    </div>
    <div style={{alignItems: 'center', display: 'flex', gap: 20, justifyContent: 'center', left: 0, opacity: fade(frame, linuxStart), position: 'absolute', right: 0, top: 505, transform: `translateY(${slide(frame, linuxStart)}px)`}}><Badge tone={colors.web}>Linux</Badge><Arrow>→</Arrow><Node active tone={colors.cli} style={{minWidth: 220}}>CLI</Node><span style={{color: colors.muted, fontSize: 19}}>共同目标：完成同一类工作</span></div>
    <div style={{display: 'flex', gap: 18, justifyContent: 'center', left: 0, opacity: fade(frame, tagsStart), position: 'absolute', right: 0, top: 625}}><Badge tone={colors.web}>图形项目工作流</Badge><Badge tone={colors.cli}>终端操作</Badge><Badge tone={colors.cli}>自动化任务</Badge></div>
  </Shell>;
};

const Scene03 = () => {
  const frame = useCurrentFrame();
  const starts = [0, 2, 5].map((cue, index) => revealFrame('03', cue, 30 + index * 58));
  const branchesStart = revealFrame('03', 8, 250);
  const filesystemStart = revealFrame('03', 13, 480);
  const columns = [
    {title: '系统', items: ['macOS', 'Linux', 'Windows'], tone: colors.web},
    {title: '安装路径', items: ['芯片架构 → Shell', 'CLI → Shell', 'PowerShell／WSL2'], tone: colors.accent},
    {title: '运行边界', items: ['elevated', 'unelevated', 'Linux 文件系统'], tone: success},
  ];
  return <Shell>
    <Title label="SCENE 03 · MATCH THE ENVIRONMENT">匹配系统与运行环境</Title>
    <div style={{alignItems: 'stretch', display: 'flex', gap: 16, left: 55, position: 'absolute', right: 55, top: 205}}>
      {columns.map((column, columnIndex) => <div key={column.title} style={{alignItems: 'center', display: 'flex', flex: 1, gap: 16}}><Panel style={{borderColor: frame >= starts[columnIndex] + 12 ? column.tone : colors.line, flex: 1, minHeight: 300, opacity: fade(frame, starts[columnIndex]), padding: 20, transform: `translateY(${slide(frame, starts[columnIndex])}px)`}}><h2 style={{color: column.tone, fontSize: 23, margin: '0 0 20px'}}>{column.title}</h2>{column.items.map((item, index) => <Node key={item} tone={column.tone} active={frame >= starts[columnIndex] + 28 + index * 20} style={{fontSize: 18, marginTop: 12, padding: '14px 10px'}}>{item}</Node>)}</Panel>{columnIndex < columns.length - 1 ? <Arrow style={{opacity: fade(frame, starts[columnIndex] + 20)}}>→</Arrow> : null}</div>)}
    </div>
    <div style={{alignItems: 'center', display: 'flex', gap: 18, justifyContent: 'center', left: 0, opacity: fade(frame, branchesStart), position: 'absolute', right: 0, top: 565}}><Badge tone={colors.accent}>系统决定路径</Badge><Arrow>→</Arrow><Badge tone={colors.warning}>PowerShell / WSL2</Badge><Arrow>→</Arrow><Badge tone={success}>环境决定边界</Badge></div>
    <div style={{alignItems: 'center', display: 'flex', gap: 20, justifyContent: 'center', left: 0, opacity: fade(frame, filesystemStart), position: 'absolute', right: 0, top: 665}}><Node active tone={success}>Linux 文件系统</Node><span style={{color: colors.muted, fontSize: 20}}>项目位置</span><Node tone={colors.warning}>/mnt/c/...</Node><Badge tone={colors.warning}>不推荐位置</Badge></div>
  </Shell>;
};

const Scene04 = () => {
  const frame = useCurrentFrame();
  const commandStart = revealFrame('04', 0, 24);
  const resultStart = revealFrame('04', 5, 170);
  const failureStart = revealFrame('04', 10, 350);
  const repairStart = revealFrame('04', 11, 480);
  return <Shell>
    <Title label="SCENE 04 · VERIFY THE COMMAND">用版本号验证 CLI 已可执行</Title>
    <Window title="terminal · new session" style={{left: 55, opacity: fade(frame, commandStart), position: 'absolute', top: 210, transform: `translateY(${slide(frame, commandStart)}px)`, width: 900}}>
      <div style={{...mono, background: '#040a0f', borderRadius: 10, fontSize: 27, lineHeight: 2, padding: '24px 30px'}}><div><span style={{color: colors.accent}}>$</span> codex --version</div><div style={{color: success, opacity: fade(frame, resultStart)}}>codex &lt;版本号&gt;</div><div><span style={{color: colors.accent}}>$</span> <span style={{animation: 'none', borderRight: `3px solid ${colors.accent}`, display: 'inline-block', height: 28, opacity: fade(frame, resultStart + 18), width: 4}} /></div></div>
      <div style={{marginTop: 24, opacity: fade(frame, resultStart)}}><Badge tone={success}>● CLI 可执行</Badge><span style={{color: colors.muted, fontSize: 19, marginLeft: 16}}>能看到版本号，才算命令可用</span></div>
    </Window>
    <Panel style={{borderColor: colors.danger, left: 1015, opacity: fade(frame, failureStart), padding: 28, position: 'absolute', top: 250, transform: `translateY(${slide(frame, failureStart)}px)`, width: 445}}><h2 style={{...mono, color: colors.danger, fontSize: 25, margin: 0}}>command not found</h2><div style={{display: 'grid', gap: 14, marginTop: 30}}><Badge tone={colors.warning}>检查 PATH</Badge><Badge tone={colors.warning}>检查多重安装</Badge></div><div style={{color: colors.muted, fontSize: 18, marginTop: 24}}>不触发重装动作</div></Panel>
    <div style={{color: colors.muted, fontSize: 20, left: 1100, opacity: fade(frame, repairStart), position: 'absolute', top: 555}}>先排查边界，再继续登录</div>
  </Shell>;
};

const Scene05 = () => {
  const frame = useCurrentFrame();
  const identityStart = revealFrame('05', 0, 40);
  const loginStart = revealFrame('05', 6, 260);
  const deviceStart = revealFrame('05', 9, 390);
  const authenticationStart = revealFrame('05', 10, 550);
  const cacheStart = revealFrame('05', 11, 620);
  const securityStart = revealFrame('05', 12, 700);
  return <Shell>
    <Title label="SCENE 05 · COMPLETE AUTHENTICATION">完成登录，连接身份与使用边界</Title>
    <div style={{alignItems: 'center', display: 'flex', gap: 16, justifyContent: 'center', left: 0, opacity: fade(frame, identityStart), position: 'absolute', right: 0, top: 205}}><Node active tone={success}>CLI 可执行</Node><Arrow>→</Arrow><Node tone={colors.web} style={{minWidth: 190}}>ChatGPT 账号</Node><Node tone={colors.cli} style={{minWidth: 160}}>API key</Node><div style={{color: colors.warning, fontSize: 23, fontWeight: 800, marginLeft: 10}}>可执行 ≠ 可工作</div></div>
    <div style={{alignItems: 'center', display: 'flex', gap: 18, justifyContent: 'center', left: 100, opacity: fade(frame, loginStart), position: 'absolute', right: 100, top: 355}}><div style={{alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 14}}><Badge tone={colors.web}>浏览器登录</Badge><span style={{color: colors.muted, fontSize: 18}}>正常图形环境</span></div><Arrow>→</Arrow><Node active={frame >= authenticationStart} tone={success} style={{minWidth: 260}}>已认证工作环境</Node><Arrow>←</Arrow><div style={{alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 14, opacity: fade(frame, deviceStart)}}><Badge tone={colors.accent}>设备码登录</Badge><span style={{color: colors.muted, fontSize: 18}}>远程 · headless · localhost</span></div></div>
    <div style={{display: 'flex', gap: 14, justifyContent: 'center', left: 0, opacity: fade(frame, cacheStart), position: 'absolute', right: 0, top: 545}}><Badge tone={colors.accent}>共享登录缓存</Badge><Badge tone={colors.warning}>凭据受保护</Badge></div>
    <div style={{color: colors.muted, fontSize: 19, left: 0, opacity: fade(frame, securityStart), position: 'absolute', right: 0, textAlign: 'center', top: 650}}>CLI 与 IDE 扩展共享状态，凭据不要暴露</div>
  </Shell>;
};

const Scene06 = () => {
  const frame = useCurrentFrame();
  const coreStart = revealFrame('06', 0, 20);
  const issueStarts = [2, 3, 4, 7].map((cue, index) => revealFrame('06', cue, 120 + index * 60));
  const warningStart = revealFrame('06', 10, 520);
  const conclusionStart = revealFrame('06', 13, 650);
  const issues = [
    ['找不到 codex', 'PATH / 多重安装', colors.danger],
    ['下载超时', '网络连通性', colors.warning],
    ['浏览器登录失败', '回调环境 / 设备码', colors.web],
    ['Windows 沙箱失败', '权限策略 / 运行环境', colors.accentStrong],
  ] as const;
  return <Shell>
    <Title label="SCENE 06 · RECOVER BY CAUSE" subtitle="每种现象都有不同的首查方向。">遇到问题，回到失败发生的边界</Title>
    <Node active tone={colors.accent} style={{fontSize: 24, left: '50%', opacity: fade(frame, coreStart), position: 'absolute', top: 295, transform: 'translateX(-50%)', width: 340}}>失败发生在哪一步？</Node>
    {issues.map(([title, detail, tone], index) => <Panel key={title} style={{borderColor: frame >= issueStarts[index] + 16 ? tone : colors.line, left: index % 2 === 0 ? 60 : undefined, opacity: fade(frame, issueStarts[index]), padding: 20, position: 'absolute', right: index % 2 === 1 ? 60 : undefined, top: index < 2 ? 190 : 455, transform: `translateY(${slide(frame, issueStarts[index])}px)`, width: 490}}><div style={{alignItems: 'center', display: 'flex', justifyContent: 'space-between'}}><strong style={{fontSize: 22}}>{title}</strong><Arrow tone={tone}>↺</Arrow></div><div style={{color: tone, fontSize: 18, marginTop: 15}}>{detail}</div></Panel>)}
    <div style={{alignItems: 'center', display: 'flex', gap: 14, justifyContent: 'center', left: 0, opacity: fade(frame, warningStart), position: 'absolute', right: 0, top: 570}}><Badge tone={colors.danger}>sudo</Badge><Arrow tone={colors.danger}>✕</Arrow><Badge tone={success}>修正用户 Node 环境</Badge><Arrow>→</Arrow><Badge tone={success}>官方独立安装器</Badge></div>
    <div style={{color: success, fontSize: 23, fontWeight: 800, left: 0, opacity: fade(frame, conclusionStart), position: 'absolute', right: 0, textAlign: 'center', top: 670}}>按现象找根因 · 不要盲目重装</div>
  </Shell>;
};

const Scene07 = () => {
  const frame = useCurrentFrame();
  const nodeStarts = [1, 2, 2, 3, 4].map((cue, index) => revealFrame('07', cue, 30 + index * 45));
  const endStart = revealFrame('07', 7, 480);
  const teaserStart = revealFrame('07', 11, 650);
  const steps = ['选择入口', '匹配环境', '验证命令', '完成登录', '按根因排错'];
  const completedPathOpacity = interpolate(frame, [teaserStart - 30, teaserStart + 30], [1, .3], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <Shell>
    <Title label="SCENE 07 · STABLE START">建立一条可验证、可恢复的启动路径</Title>
    <div style={{alignItems: 'center', display: 'flex', gap: 0, justifyContent: 'center', left: 0, opacity: completedPathOpacity, position: 'absolute', right: 0, top: 245}}>
      {steps.map((step, index) => <div key={step} style={{alignItems: 'center', display: 'flex'}}><div style={{alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 16, opacity: fade(frame, nodeStarts[index]), transform: `translateY(${slide(frame, nodeStarts[index])}px)`}}><div style={{alignItems: 'center', background: frame >= nodeStarts[index] + 14 ? colors.accent : colors.panel, border: `2px solid ${frame >= nodeStarts[index] + 14 ? colors.accent : colors.line}`, borderRadius: 999, boxShadow: frame >= nodeStarts[index] + 14 ? `0 0 0 8px ${colors.accent}15` : 'none', display: 'flex', height: 76, justifyContent: 'center', width: 76}}><span style={{fontSize: 30}}>{['⌁', '◇', '>_', '▣', '↺'][index]}</span></div><span style={{color: colors.muted, fontSize: 18, whiteSpace: 'nowrap'}}>{step}</span></div>{index < steps.length - 1 ? <div style={{background: frame >= nodeStarts[index + 1] ? colors.accent : colors.line, height: 3, margin: '0 14px 44px', width: 115}} /> : null}</div>)}
    </div>
    <Node active tone={success} style={{fontSize: 23, left: '50%', opacity: fade(frame, endStart), position: 'absolute', top: 465, transform: 'translateX(-50%)', width: 500}}>可验证、可登录、可安全工作</Node>
    <div style={{color: colors.accent, fontSize: 25, fontWeight: 800, left: 0, opacity: fade(frame, endStart + 18), position: 'absolute', right: 0, textAlign: 'center', top: 565}}>安装不是终点　→　稳定启动才是</div>
    <Panel style={{borderColor: colors.accentStrong, bottom: 0, opacity: fade(frame, teaserStart), padding: '20px 28px', position: 'absolute', right: 0, transform: `translateY(${slide(frame, teaserStart)}px)`, width: 500}}><div style={{color: colors.accentStrong, fontSize: 16, fontWeight: 800, letterSpacing: 3}}>下一集</div><div style={{fontSize: 25, fontWeight: 800, marginTop: 10}}>ChatGPT 套餐登录 vs API key</div><div style={{color: colors.muted, fontSize: 18, marginTop: 8}}>用量边界与计费选择</div></Panel>
  </Shell>;
};

const SceneContent = ({sceneId}: {sceneId: string}) => {
  switch (sceneId) {
    case 'scene-01-preflight-path': return <Scene01 />;
    case 'scene-02-entry-routing': return <Scene02 />;
    case 'scene-03-environment-map': return <Scene03 />;
    case 'scene-04-command-verification': return <Scene04 />;
    case 'scene-05-authentication-flow': return <Scene05 />;
    case 'scene-06-root-cause-recovery': return <Scene06 />;
    case 'scene-07-stable-start': return <Scene07 />;
    default: return null;
  }
};

export const InstallVideo = () => {
  const contentStartFrame = getContentStartFrame(videoConfig);
  const durationInFrames = getTotalDurationFrames(videoConfig);

  return <>
    {videoConfig.series?.coverSrc ? <Sequence from={0} durationInFrames={contentStartFrame} name={`Series Cover · ${videoConfig.series.id}`}><SeriesCover src={videoConfig.series.coverSrc} /></Sequence> : null}
    {videoConfig.audioTracks?.map((track) => <Sequence key={track.id ?? track.src} from={contentStartFrame + secondsToFrames(track.startSeconds ?? 0, videoConfig.fps)} durationInFrames={Math.max(1, Math.ceil(track.durationSeconds * videoConfig.fps))} name={`Audio ${track.id ?? track.src}`} premountFor={videoConfig.fps * 2}><Audio pauseWhenBuffering src={staticFile(track.src)} /></Sequence>)}
    {videoConfig.scenes.map((scene, index) => <Sequence key={scene.id} from={contentStartFrame + getSceneStartFrame(videoConfig.scenes, index, videoConfig.fps)} durationInFrames={secondsToFrames(scene.durationSeconds, videoConfig.fps)} name={scene.id}><SceneContent sceneId={scene.id} /></Sequence>)}
    {videoConfig.subtitleCues ? <Sequence from={contentStartFrame} name="Subtitles"><TimedCaption bottomMargin={34} cues={videoConfig.subtitleCues} /></Sequence> : null}
    <div style={{display: 'none'}} data-duration-frames={durationInFrames} />
  </>;
};
