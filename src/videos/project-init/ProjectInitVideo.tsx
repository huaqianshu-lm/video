import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import type {CSSProperties, ReactNode} from 'react';
import {TimedCaption} from '../../components/TimedCaption';
import {getTotalDurationFrames, secondsToFrames} from '../../lib/timing';
import {videoConfig} from './video.config';
import subtitleManifest from './generated/subtitle-manifest.json';
import timelineManifest from './generated/timeline-manifest.json';

const colors = {
  background: '#09101f',
  panel: '#111b31',
  panelRaised: '#16233d',
  text: '#eef3ff',
  muted: '#9caaca',
  line: '#2b3b60',
  accent: '#91a8ff',
  success: '#65d6a0',
  warning: '#f2c56c',
  danger: '#ff7d89',
};

const panel: CSSProperties = {
  background: `linear-gradient(180deg, ${colors.panelRaised}, ${colors.panel})`,
  border: `1px solid ${colors.line}`,
  borderRadius: 18,
  boxShadow: '0 18px 50px rgba(0,0,0,.24)',
};

const fade = (frame: number, start = 0, distance = 18) => interpolate(frame, [start, start + distance], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const slide = (frame: number, start = 0, distance = 18) => interpolate(frame, [start, start + distance], [22, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

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

const reveal = (sceneId: string, cueIndex: number, fallback: number) => sceneCueFrames[sceneId]?.[cueIndex] ?? fallback;

const Shell = ({children}: {children: ReactNode}) => (
  <AbsoluteFill style={{background: `radial-gradient(circle at 15% 10%, rgba(145,168,255,.14), transparent 34%), radial-gradient(circle at 85% 85%, rgba(101,214,160,.08), transparent 32%), ${colors.background}`, color: colors.text, fontFamily: '"Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", Arial, sans-serif', overflow: 'hidden'}}>
    <div style={{backgroundImage: 'linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)', backgroundSize: '42px 42px', inset: 25, opacity: 0.7, position: 'absolute'}} />
    <div style={{border: `1px solid ${colors.line}`, borderRadius: 24, inset: 25, position: 'absolute'}} />
    <div style={{bottom: 155, left: 110, position: 'absolute', right: 110, top: 74, zIndex: 1}}>{children}</div>
  </AbsoluteFill>
);

const Title = ({label, children}: {label: string; children: ReactNode}) => {
  const frame = useCurrentFrame();
  return <>
    <div style={{color: colors.accent, fontSize: 22, fontWeight: 800, letterSpacing: 4, marginBottom: 14, opacity: fade(frame)}}>{label}</div>
    <div style={{fontSize: 52, fontWeight: 850, letterSpacing: -1.5, lineHeight: 1.16, opacity: fade(frame, 6), transform: `translateY(${slide(frame, 6)}px)`}}>{children}</div>
  </>;
};

const Window = ({title, children, style}: {title: string; children: ReactNode; style?: CSSProperties}) => (
  <div style={{...panel, overflow: 'hidden', ...style}}>
    <div style={{alignItems: 'center', background: 'rgba(255,255,255,.045)', borderBottom: `1px solid ${colors.line}`, display: 'flex', gap: 8, padding: '13px 18px'}}>
      {['#ff7d89', '#f2c56c', '#65d6a0'].map((tone) => <span key={tone} style={{background: tone, borderRadius: 99, height: 10, width: 10}} />)}
      <span style={{color: colors.muted, fontFamily: 'Menlo, Monaco, Consolas, monospace', fontSize: 17, fontWeight: 700, marginLeft: 8}}>{title}</span>
    </div>
    <div style={{padding: 22}}>{children}</div>
  </div>
);

const Badge = ({children, tone = colors.accent, style}: {children: ReactNode; tone?: string; style?: CSSProperties}) => (
  <span style={{background: `${tone}1c`, border: `1px solid ${tone}`, borderRadius: 999, color: tone, display: 'inline-flex', fontSize: 18, fontWeight: 800, padding: '7px 13px', whiteSpace: 'nowrap', ...style}}>{children}</span>
);

const Arrow = ({tone = colors.accent}: {tone?: string}) => <span style={{color: tone, fontSize: 30, fontWeight: 800}}>→</span>;

const FileRow = ({name, status, tone = colors.muted, style}: {name: string; status?: string; tone?: string; style?: CSSProperties}) => (
  <div style={{alignItems: 'center', borderTop: '1px solid rgba(255,255,255,.09)', display: 'flex', justifyContent: 'space-between', padding: '13px 0', ...style}}>
    <span style={{fontFamily: 'Menlo, Monaco, Consolas, monospace', fontSize: 19}}>{name}</span>
    {status ? <span style={{color: tone, fontSize: 16, fontWeight: 750}}>{status}</span> : null}
  </div>
);

const Scene01 = () => {
  const frame = useCurrentFrame();
  const starts = [reveal('01', 0, 0), reveal('01', 5, 292), reveal('01', 7, 424)];
  return <Shell><Title label="SCENE 01 · WORKFLOW SIMULATION">同一个项目问题，反复从头问</Title><div style={{alignItems: 'center', display: 'grid', gap: 24, gridTemplateColumns: '1fr 1.35fr', height: 470, marginTop: 38}}>
    <Window title="project/" style={{opacity: fade(frame), transform: `translateY(${slide(frame)}px)`}}><FileRow name="├─ package.json" /><FileRow name="├─ src/" /><FileRow name="├─ tests/" /><FileRow name="└─ README.md" /></Window>
    <div style={{display: 'grid', gap: 12}}>{starts.map((start, index) => <div key={index} style={{...panel, borderColor: index === 2 && frame >= start ? colors.warning : colors.line, opacity: fade(frame, start), transform: `translateY(${slide(frame, start)}px)`, padding: '17px 21px'}}><div style={{alignItems: 'center', display: 'flex', justifyContent: 'space-between'}}><strong style={{color: colors.accent, fontSize: 17}}>新会话 {String(index + 1).padStart(2, '0')}</strong><span style={{color: colors.muted, fontSize: 15}}>{index < 2 ? '扫描 package.json' : '再次摸索'}</span></div><div style={{fontSize: 25, marginTop: 12}}>{index < 2 ? '测试怎么跑？' : 'npm 还是 pnpm？'}</div></div>)}</div>
  </div><div style={{color: colors.muted, fontSize: 21, marginTop: 20, opacity: fade(frame, reveal('01', 8, 490)), textAlign: 'center'}}>每次都从零摸索 · 问题计数 1 → 2 → 3</div></Shell>;
};

const Scene02 = () => {
  const frame = useCurrentFrame();
  const docStart = reveal('02', 1, 62);
  const connectStart = reveal('02', 4, 280);
  return <Shell><Title label="SCENE 02 · CONCEPT VISUALIZATION">根因不是 Claude 笨</Title><div style={{alignItems: 'center', display: 'grid', gap: 28, gridTemplateColumns: '1fr 120px 1fr', height: 500, marginTop: 38}}>
    <div style={{...panel, alignItems: 'center', borderStyle: 'dashed', color: colors.muted, display: 'flex', fontSize: 27, height: 310, justifyContent: 'center', opacity: fade(frame)}}>从零摸索</div>
    <div style={{alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 13, opacity: fade(frame, connectStart)}}><span style={{background: frame >= connectStart ? colors.accent : colors.danger, borderRadius: 99, height: 16, width: 16}} /><div style={{borderLeft: `2px ${frame >= connectStart ? 'solid' : 'dashed'} ${frame >= connectStart ? colors.accent : colors.danger}`, height: 120}} /><Arrow tone={frame >= connectStart ? colors.accent : colors.danger} /></div>
    <div style={{...panel, minHeight: 340, opacity: fade(frame, docStart), transform: `translateY(${slide(frame, docStart)}px)`, padding: 24}}><div style={{fontFamily: 'Menlo, Monaco, Consolas, monospace', fontSize: 28, fontWeight: 800}}>CLAUDE.md</div><div style={{display: 'grid', gap: 13, marginTop: 27}}>{['项目架构', '常用命令', '项目约定'].map((item, index) => <div key={item} style={{borderLeft: `3px solid ${colors.accent}`, background: '#172642', borderRadius: 7, opacity: fade(frame, docStart + index * 28), padding: '13px 15px'}}>{item}</div>)}</div><div style={{color: colors.success, fontSize: 18, marginTop: 23}}>项目说明书</div></div>
  </div><div style={{color: colors.muted, fontSize: 21, marginTop: 12, opacity: fade(frame, reveal('02', 5, 380)), textAlign: 'center'}}>缺少的是项目说明书</div></Shell>;
};

const Scene03 = () => {
  const frame = useCurrentFrame();
  const scanStart = reveal('03', 1, 102);
  const draftStart = reveal('03', 2, 178);
  return <Shell><Title label="SCENE 03 · TERMINAL SIMULATION">/init：先把项目读一遍</Title><div style={{display: 'grid', gap: 24, gridTemplateColumns: '1.15fr .85fr', marginTop: 38}}>
    <Window title="Claude Code · terminal" style={{opacity: fade(frame), transform: `translateY(${slide(frame)}px)`}}><div style={{fontFamily: 'Menlo, Monaco, Consolas, monospace', fontSize: 23}}><div><span style={{color: colors.muted}}>&gt; </span><span style={{color: colors.accent}}>/init</span><span style={{background: colors.accent, display: 'inline-block', height: 23, marginLeft: 6, verticalAlign: -3, width: 10}} /></div><div style={{color: colors.muted, lineHeight: 2, marginTop: 22, opacity: fade(frame, scanStart)}}>Scanning project structure...</div><div style={{color: colors.muted, lineHeight: 2, opacity: fade(frame, scanStart + 28)}}>Reading visible project facts...</div><div style={{color: colors.success, lineHeight: 2, opacity: fade(frame, draftStart)}}>Created: CLAUDE.md · draft</div></div></Window>
    <div style={{display: 'grid', gap: 16, marginTop: 18}}><div style={{...panel, opacity: fade(frame, scanStart), padding: 24}}><div style={{color: colors.muted, fontSize: 17}}>项目文件树</div>{['package.json', 'src/', 'README.md'].map((name, index) => <FileRow key={name} name={`├─ ${name}`} style={{opacity: fade(frame, scanStart + index * 20)}} />)}</div><div style={{...panel, borderColor: frame >= draftStart ? colors.success : colors.line, opacity: fade(frame, draftStart), transform: `translateY(${slide(frame, draftStart)}px)`, padding: 24}}><div style={{color: colors.success, fontFamily: 'Menlo, Monaco, Consolas, monospace', fontSize: 25}}>CLAUDE.md</div><Badge tone={colors.success} style={{marginTop: 19}}>草稿已生成</Badge></div></div>
  </div><div style={{color: colors.muted, fontSize: 21, marginTop: 22, textAlign: 'center'}}>扫描 → 生成草稿</div></Shell>;
};

const Scene04 = () => {
  const frame = useCurrentFrame();
  const starts = [reveal('04', 1, 38), reveal('04', 3, 178), reveal('04', 4, 235)];
  const steps = ['cd /path/to/your-project', 'claude', '/init'];
  return <Shell><Title label="SCENE 04 · TERMINAL DEMO">进入根目录，输入一个命令</Title><div style={{...panel, margin: '40px auto 0', maxWidth: 1380, padding: '23px 30px'}}><div style={{display: 'grid', gap: 10, fontFamily: 'Menlo, Monaco, Consolas, monospace', fontSize: 22}}>{steps.map((step, index) => <div key={step} style={{color: index === 2 ? colors.accent : colors.text, opacity: fade(frame, starts[index]), transform: `translateX(${interpolate(frame, [starts[index], starts[index] + 18], [-16, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}px)`}}><span style={{color: colors.muted}}>{index === 2 ? '&gt;' : '$'} </span>{step}</div>)}<div style={{color: colors.warning, opacity: fade(frame, reveal('04', 5, 306))}}>&nbsp;&nbsp;Analyzing project...</div></div></div><div style={{alignItems: 'center', display: 'flex', gap: 17, justifyContent: 'center', marginTop: 52}}>{steps.map((step, index) => <span key={step} style={{alignItems: 'center', display: 'flex', gap: 17}}><div style={{...panel, borderColor: frame >= starts[index] ? colors.accent : colors.line, color: index === 2 ? colors.accent : colors.text, fontFamily: index === 0 || index === 1 ? 'Menlo, Monaco, Consolas, monospace' : 'inherit', fontSize: 21, padding: '18px 24px'}}>{step}</div>{index < steps.length - 1 ? <Arrow /> : null}</span>)}</div><div style={{color: colors.muted, fontSize: 21, marginTop: 32, textAlign: 'center'}}>三步：进根目录 → 启动 → 输入</div></Shell>;
};

const Scene05 = () => {
  const frame = useCurrentFrame();
  const starts = [reveal('05', 1, 46), reveal('05', 2, 150), reveal('05', 3, 238), reveal('05', 4, 340)];
  const sources = [['package.json', 'Dependencies'], ['README.md', 'README'], ['config/', 'Configuration'], ['src/', 'Code Structure']];
  return <Shell><Title label="SCENE 05 · CODEBASE SCAN">从依赖、文档和结构开始扫描</Title><div style={{alignItems: 'center', display: 'grid', gap: 32, gridTemplateColumns: '1fr 1.15fr', height: 480, marginTop: 35}}><div style={{display: 'grid', gap: 13, gridTemplateColumns: '1fr 1fr'}}>{sources.map(([name, label], index) => <div key={name} style={{...panel, borderColor: frame >= starts[index] ? colors.accent : colors.line, opacity: fade(frame, starts[index]), transform: `translateY(${slide(frame, starts[index])}px)`, padding: '22px 20px'}}><div style={{fontFamily: 'Menlo, Monaco, Consolas, monospace', fontSize: 21}}>{name}</div><div style={{color: colors.muted, fontSize: 16, marginTop: 9}}>{label}</div></div>)}</div><div style={{position: 'relative'}}><div style={{...panel, padding: 27}}><div style={{border: `1px solid ${colors.accent}`, borderRadius: 12, color: colors.accent, fontFamily: 'Menlo, Monaco, Consolas, monospace', fontSize: 23, padding: '16px 18px', textAlign: 'center', opacity: fade(frame, reveal('05', 4, 340))}}>CLAUDE.md · draft</div><div style={{display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr', marginTop: 22}}>{['技术栈', '项目用途', '目录', '入口'].map((item, index) => <div key={item} style={{background: '#1b2c4c', borderRadius: 8, color: colors.text, fontSize: 18, opacity: fade(frame, reveal('05', 4, 340) + index * 15), padding: 13, textAlign: 'center'}}>{item}</div>)}</div></div><div style={{color: colors.muted, fontSize: 20, marginTop: 18, textAlign: 'center'}}>把看得见的事实整理成草稿</div></div></div></Shell>;
};

const Scene06 = () => {
  const frame = useCurrentFrame();
  const fileStart = reveal('06', 1, 44);
  const suggestionStart = reveal('06', 3, 202);
  return <Shell><Title label="SCENE 06 · FILE STATE COMPARISON">已有 CLAUDE.md：建议改进，不直接覆盖</Title><div style={{alignItems: 'center', display: 'grid', gap: 42, gridTemplateColumns: '1fr 1fr', height: 480, marginTop: 38}}><div style={{...panel, borderColor: colors.success, minHeight: 250, opacity: fade(frame, fileStart), transform: `translateY(${slide(frame, fileStart)}px)`, padding: 34, textAlign: 'center'}}><div style={{fontFamily: 'Menlo, Monaco, Consolas, monospace', fontSize: 27}}>CLAUDE.md</div><Badge tone={colors.success} style={{marginTop: 25}}>unchanged</Badge><div style={{color: colors.muted, fontSize: 18, marginTop: 20}}>原文件保留</div></div><div style={{display: 'grid', gap: 14}}>{['补充命令', '补充约定'].map((item, index) => <div key={item} style={{...panel, borderColor: colors.warning, color: colors.warning, fontSize: 22, opacity: fade(frame, suggestionStart + index * 30), transform: `translateX(${interpolate(frame, [suggestionStart + index * 30, suggestionStart + index * 30 + 18], [-18, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}px)`, padding: '19px 22px'}}>＋ {item}</div>)}<div style={{color: colors.muted, fontSize: 18, marginTop: 8, opacity: fade(frame, reveal('06', 4, 282))}}>建议改进</div></div></div><div style={{color: colors.muted, fontSize: 21, textAlign: 'center'}}>检查与改进，不是粗暴覆盖</div></Shell>;
};

const Scene07 = () => {
  const frame = useCurrentFrame();
  const start = reveal('07', 1, 48);
  const sections = ['项目概述', '技术栈', '目录结构', '常用命令', '开发规范'];
  const questions = ['项目是做什么的？', '测试怎么跑？', '文件在哪里？'];
  return <Shell><Title label="SCENE 07 · DOCUMENT REVEAL">一份项目说明书的五个区块</Title><div style={{alignItems: 'center', display: 'grid', gap: 34, gridTemplateColumns: '1.15fr .85fr', height: 500, marginTop: 30}}><Window title="CLAUDE.md" style={{opacity: fade(frame, start), transform: `translateY(${slide(frame, start)}px)`}}><div style={{display: 'grid', gap: 9}}>{sections.map((item, index) => <div key={item} style={{background: '#172642', borderLeft: `3px solid ${colors.accent}`, borderRadius: 7, fontSize: 21, opacity: fade(frame, start + index * 28), padding: '14px 16px'}}>{item}</div>)}</div></Window><div style={{display: 'grid', gap: 14}}>{questions.map((question, index) => <div key={question} style={{...panel, color: colors.text, fontSize: 21, opacity: fade(frame, reveal('07', 2 + index * 2, 145 + index * 75)), transform: `translateY(${slide(frame, reveal('07', 2 + index * 2, 145 + index * 75))}px)`, padding: '19px 20px'}}>{question}</div>)}<div style={{color: colors.muted, fontSize: 18, marginTop: 8, opacity: fade(frame, reveal('07', 7, 440))}}>每个区块，对掉一类重复问题</div></div></div></Shell>;
};

const Scene08 = () => {
  const frame = useCurrentFrame();
  const fileStart = reveal('08', 1, 66);
  const commandStart = reveal('08', 4, 286);
  const resultStart = reveal('08', 5, 378);
  const resultLines = ['init-demo', 'Node.js / JavaScript', 'echo test ok'];
  return <Shell><Title label="SCENE 08 · MINIMAL PROJECT DEMO">用两个文件验证 /init</Title><div style={{display: 'grid', gap: 26, gridTemplateColumns: '.9fr 1.1fr', height: 510, marginTop: 30}}><div style={{display: 'grid', gap: 15}}><Window title="init-demo/" style={{opacity: fade(frame, fileStart)}}><FileRow name="├─ package.json" style={{opacity: fade(frame, fileStart)}} /><FileRow name="└─ index.js" style={{opacity: fade(frame, fileStart + 25)}} /></Window><div style={{...panel, fontFamily: 'Menlo, Monaco, Consolas, monospace', fontSize: 18, lineHeight: 1.85, opacity: fade(frame, commandStart), padding: 20}}><div>$ mkdir init-demo</div><div>$ cd init-demo</div><div style={{color: colors.warning}}>&gt; /init</div><div style={{color: colors.success}}>✓ CLAUDE.md generated</div></div></div><Window title="CLAUDE.md" style={{opacity: fade(frame, resultStart), transform: `translateY(${slide(frame, resultStart)}px)`}}><div style={{display: 'grid', gap: 11}}>{resultLines.map((line, index) => <div key={line} style={{background: '#172743', borderLeft: `3px solid ${index === 1 ? colors.accent : colors.success}`, borderRadius: 8, fontSize: 20, opacity: fade(frame, resultStart + index * 25), padding: '14px 16px'}}>{line}</div>)}</div><div style={{color: colors.muted, fontSize: 18, marginTop: 20, opacity: fade(frame, reveal('08', 10, 680))}}>这个项目的测试命令是什么？</div></Window></div><div style={{color: colors.muted, fontSize: 21, marginTop: 12, textAlign: 'center'}}>输入文件 → 生成文件 → 再次提问</div></Shell>;
};

const Scene09 = () => {
  const frame = useCurrentFrame();
  const leftStart = reveal('09', 0, 20);
  const rightStart = reveal('09', 1, 92);
  const mergeStart = reveal('09', 6, 425);
  const columns = [{title: '客观事实', tone: colors.accent, items: ['技术栈', '目录结构', '常用命令'], start: leftStart}, {title: '团队约定', tone: colors.warning, items: ['分支命名', '部署流程', 'Review 与业务背景'], start: rightStart}];
  return <Shell><Title label="SCENE 09 · COMPARISON + CHECKLIST">自动扫描是起点，不是终稿</Title><div style={{display: 'grid', gap: 28, gridTemplateColumns: '1fr 1fr', height: 405, marginTop: 40}}>{columns.map((column) => <div key={column.title} style={{...panel, borderColor: column.tone, opacity: fade(frame, column.start), transform: `translateY(${slide(frame, column.start)}px)`, padding: 25}}><h3 style={{color: column.tone, fontSize: 25, margin: '0 0 16px'}}>{column.title}</h3>{column.items.map((item, index) => <div key={item} style={{background: column.tone === colors.warning ? '#302c1d' : '#1b2b49', borderRadius: 8, color: colors.text, fontSize: 20, marginTop: 10, opacity: fade(frame, column.start + index * 26), padding: '13px 15px'}}>{item}</div>)}</div>)}</div><div style={{alignItems: 'center', display: 'flex', gap: 16, justifyContent: 'center', marginTop: 28, opacity: fade(frame, mergeStart)}}><Arrow /><div style={{...panel, borderColor: colors.success, color: colors.success, fontSize: 23, fontWeight: 800, padding: '15px 26px'}}>可用 CLAUDE.md · 持续迭代</div><Arrow tone={colors.success} /></div></Shell>;
};

const Scene10 = () => {
  const frame = useCurrentFrame();
  const route = ['根目录', 'claude', '/init', '扫描', 'CLAUDE.md 草稿', '审阅', '迭代'];
  const teaserStart = reveal('10', 6, 424);
  return <Shell><Title label="SCENE 10 · SUMMARY + NEXT EPISODE PREVIEW">先 /init，再审阅和迭代</Title><div style={{alignItems: 'center', display: 'flex', gap: 11, justifyContent: 'center', marginTop: 95}}>{route.map((item, index) => {const start = reveal('10', Math.min(index + 1, 6), 36 + index * 60); return <span key={item} style={{alignItems: 'center', display: 'flex', gap: 11}}><div style={{...panel, borderColor: index >= 5 ? colors.success : colors.accent, color: index >= 5 ? colors.success : colors.text, fontSize: 20, opacity: fade(frame, start), padding: '18px 17px', textAlign: 'center', transform: `translateY(${slide(frame, start)}px)`}}>{item}</div>{index < route.length - 1 ? <Arrow tone={index >= 5 ? colors.success : colors.accent} /> : null}</span>;})}</div><div style={{alignItems: 'center', display: 'flex', gap: 12, justifyContent: 'center', marginTop: 58, opacity: fade(frame, reveal('10', 3, 215))}}><Badge>扫描</Badge><Arrow /><Badge tone={colors.accent}>草稿</Badge><Arrow /><Badge tone={colors.success}>审阅</Badge><Arrow tone={colors.success} /><Badge tone={colors.success}>迭代</Badge></div><div style={{...panel, borderColor: colors.warning, bottom: 4, padding: '20px 28px', position: 'absolute', right: 0, textAlign: 'center', width: 400, opacity: fade(frame, teaserStart), transform: `translateY(${slide(frame, teaserStart)}px)`}}><div style={{color: colors.warning, fontSize: 17, letterSpacing: 3}}>下一篇</div><div style={{fontSize: 27, fontWeight: 800, marginTop: 8}}>项目结构</div></div><div style={{color: colors.muted, fontSize: 21, marginTop: 50, textAlign: 'center'}}>把“重新认识”变成“有一份起点”</div></Shell>;
};

const Scene = ({sceneId}: {sceneId: string}) => {
  switch (sceneId) {
    case 'scene-01': return <Scene01 />;
    case 'scene-02': return <Scene02 />;
    case 'scene-03': return <Scene03 />;
    case 'scene-04': return <Scene04 />;
    case 'scene-05': return <Scene05 />;
    case 'scene-06': return <Scene06 />;
    case 'scene-07': return <Scene07 />;
    case 'scene-08': return <Scene08 />;
    case 'scene-09': return <Scene09 />;
    case 'scene-10': return <Scene10 />;
    default: return null;
  }
};

export const ProjectInitVideo = () => {
  const durationInFrames = getTotalDurationFrames(videoConfig);
  let sceneFromFrame = 0;
  const sceneSequences = videoConfig.scenes.map((scene) => {
    const from = sceneFromFrame;
    const durationInFrames = secondsToFrames(scene.durationSeconds, videoConfig.fps);
    sceneFromFrame += durationInFrames;
    return {scene, from, durationInFrames};
  });

  return <>
    {videoConfig.audioTracks?.map((track) => <Sequence key={track.id ?? track.src} from={secondsToFrames(track.startSeconds ?? 0, videoConfig.fps)} durationInFrames={Math.max(1, Math.ceil(track.durationSeconds * videoConfig.fps))} name={`Audio ${track.id ?? track.src}`} premountFor={videoConfig.fps * 2}><Audio pauseWhenBuffering src={staticFile(track.src)} /></Sequence>)}
    {sceneSequences.map(({scene, from, durationInFrames: sceneDuration}) => <Sequence key={scene.id} from={from} durationInFrames={sceneDuration} name={scene.id}><Scene sceneId={scene.id} /></Sequence>)}
    {videoConfig.subtitleCues ? <Sequence from={0} name="Subtitles"><TimedCaption bottomMargin={34} cues={videoConfig.subtitleCues} /></Sequence> : null}
    <div style={{display: 'none'}} data-duration-frames={durationInFrames} />
  </>;
};
