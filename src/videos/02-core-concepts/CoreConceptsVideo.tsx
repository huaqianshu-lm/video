import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import type {CSSProperties, ReactNode} from 'react';
import {SeriesCover} from '../../components/SeriesCover';
import {TimedCaption} from '../../components/TimedCaption';
import {getContentStartFrame, getTotalDurationFrames, secondsToFrames} from '../../lib/timing';
import {codexBackground, codexGridBackground, codexPalette as colors} from '../../styles/codex';
import {videoConfig} from './video.config';
import subtitleManifest from './generated/subtitle-manifest.json';
import timelineManifest from './generated/timeline-manifest.json';

const panel: CSSProperties = {
  background: `linear-gradient(180deg, ${colors.panel}, rgba(8, 19, 28, .96))`,
  border: `1px solid ${colors.line}`,
  borderRadius: 22,
  boxShadow: '0 20px 60px rgba(0,0,0,.28)',
};

const fade = (frame: number, start = 0, distance = 18) => interpolate(frame, [start, start + distance], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const slide = (frame: number, start = 0, distance = 18) => interpolate(frame, [start, start + distance], [24, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

const sceneCueFrames = Object.fromEntries(subtitleManifest.scenes.map((scene) => {
  const sceneTiming = timelineManifest.scenes.find((item) => item.sceneId === scene.sceneId);
  const frames = sceneTiming
    ? scene.segments.flatMap((segment) => {
      const segmentTiming = sceneTiming.segments.find((item) => item.segmentId === segment.segmentId);
      return segmentTiming
        ? segment.cues.map((cue) => secondsToFrames(segmentTiming.offset + cue.start, videoConfig.fps))
        : [];
    })
    : [];
  return [scene.sceneId, frames];
})) as Record<string, number[]>;

const revealFrame = (sceneId: string, cueIndex: number, fallback: number) => sceneCueFrames[sceneId]?.[cueIndex] ?? fallback;

const ArrowHead = ({tone = colors.accent, direction = 'right'}: {tone?: string; direction?: 'left' | 'right'}) => (
  <span
    style={direction === 'left'
      ? {borderBottom: '8px solid transparent', borderRight: `13px solid ${tone}`, borderTop: '8px solid transparent', display: 'block', height: 0, width: 0}
      : {borderBottom: '8px solid transparent', borderLeft: `13px solid ${tone}`, borderTop: '8px solid transparent', display: 'block', height: 0, width: 0}}
  />
);

const Shell = ({children}: {children: ReactNode}) => (
  <AbsoluteFill style={{background: codexBackground, color: colors.text, fontFamily: '"Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", Arial, sans-serif', overflow: 'hidden'}}>
    <div style={{backgroundImage: codexGridBackground, backgroundSize: '42px 42px', inset: 24, opacity: 0.22, position: 'absolute'}} />
    <div style={{border: `1px solid ${colors.line}`, borderRadius: 24, inset: 24, position: 'absolute'}} />
    <div style={{bottom: 166, left: 116, position: 'absolute', right: 116, top: 76, zIndex: 1}}>{children}</div>
  </AbsoluteFill>
);

const Title = ({label, children}: {label: string; children: ReactNode}) => {
  const frame = useCurrentFrame();
  return (
    <>
      <div style={{color: colors.accent, fontSize: 25, fontWeight: 800, letterSpacing: 4, marginBottom: 17, opacity: fade(frame)}}>{label}</div>
      <div style={{fontSize: 54, fontWeight: 850, letterSpacing: -2, lineHeight: 1.15, opacity: fade(frame, 6), transform: `translateY(${slide(frame, 6)}px)`}}>{children}</div>
    </>
  );
};

const Window = ({title, children, style}: {title: string; children: ReactNode; style?: CSSProperties}) => (
  <div style={{...panel, overflow: 'hidden', ...style}}>
    <div style={{alignItems: 'center', background: 'rgba(255,255,255,.055)', borderBottom: `1px solid ${colors.line}`, display: 'flex', gap: 9, padding: '15px 20px'}}>
      {['#ef4444', '#f59e0b', '#22c55e'].map((dot) => <span key={dot} style={{background: dot, borderRadius: 99, height: 11, width: 11}} />)}
      <span style={{color: colors.muted, fontFamily: 'Menlo, Monaco, Consolas, monospace', fontSize: 18, fontWeight: 700, marginLeft: 9}}>{title}</span>
    </div>
    <div style={{padding: 24}}>{children}</div>
  </div>
);

const Badge = ({children, tone = colors.accent, style}: {children: ReactNode; tone?: string; style?: CSSProperties}) => (
  <span style={{background: `${tone}1c`, border: `1px solid ${tone}`, borderRadius: 999, color: tone, display: 'inline-flex', fontSize: 19, fontWeight: 800, padding: '8px 13px', whiteSpace: 'nowrap', ...style}}>{children}</span>
);

const Arrow = ({children = '→', style}: {children?: ReactNode; style?: CSSProperties}) => <span style={{color: colors.accent, fontSize: 32, fontWeight: 800, ...style}}>{children}</span>;

const FileState = ({name, status, done, style}: {name: string; status: string; done: boolean; style?: CSSProperties}) => (
  <div style={{alignItems: 'center', borderTop: `1px solid rgba(255,255,255,.09)`, display: 'flex', justifyContent: 'space-between', padding: '16px 0', ...style}}>
    <span style={{fontFamily: 'Menlo, Monaco, Consolas, monospace', fontSize: 20}}>{name}</span>
    <span style={{color: done ? '#72dfaa' : colors.muted, fontSize: 18, fontWeight: 750}}>{status}</span>
  </div>
);

const Scene01 = () => {
  const frame = useCurrentFrame();
  const projectResultFrame = revealFrame('01', 3, 180);
  const questionFrame = revealFrame('01', 6, 410);
  return <Shell><Title label="SCENE 01 · OPENING RESULT">同一个任务，为什么只完成了一半</Title><div style={{alignItems: 'center', display: 'grid', gap: 22, gridTemplateColumns: '1fr 240px 1fr', height: 480, marginTop: 44}}>
    <Window title="项目目录" style={{opacity: fade(frame), transform: `translateY(${slide(frame)}px)`}}><FileState name={frame >= projectResultFrame ? 'draft.md → final.md' : 'draft.md'} status={frame >= projectResultFrame ? '已修改' : '未修改'} done={frame >= projectResultFrame} /></Window>
    <div style={{alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 26}}><div style={{...panel, padding: '21px 30px', textAlign: 'center', opacity: fade(frame, revealFrame('01', 0, 42)), transform: `translateY(${slide(frame, revealFrame('01', 0, 42))}px)`}}><strong style={{fontSize: 27}}>统一重命名</strong></div><Arrow>↔</Arrow></div>
    <Window title="桌面目录" style={{opacity: fade(frame), transform: `translateY(${slide(frame)}px)`}}><FileState name="draft.md" status="未修改" done={false} /></Window>
  </div><div style={{fontSize: 30, fontWeight: 760, marginTop: 12, opacity: fade(frame, questionFrame), textAlign: 'center', transform: `translateY(${slide(frame, questionFrame)}px)`}}>它漏做了吗？</div></Shell>;
};

const Scene02 = () => {
  const frame = useCurrentFrame();
  const steps = ['理解目标', '读取', '执行', '查看结果', '调整'];
  const loop = ['运行测试', '读取报错', '修改代码', '再次测试'];
  const stepStarts = [3, 3, 4, 5, 6].map((cueIndex, index) => revealFrame('02', cueIndex, 42 + index * 48) + (index === 1 ? 18 : 0));
  const loopStarts = [7, 8, 8, 9].map((cueIndex, index) => revealFrame('02', cueIndex, 240 + index * 34) + (index === 2 ? 18 : 0));
  return <Shell><Title label="SCENE 02 · AGENT LOOP">先确认谁在行动：Agent</Title><div style={{alignItems: 'center', display: 'grid', gap: 40, gridTemplateColumns: '270px 1fr', height: 510, marginTop: 38}}>
    <div style={{alignItems: 'center', background: 'radial-gradient(circle, #29466d, #14243d 70%)', border: '1px solid #5577a8', borderRadius: 999, boxShadow: '0 0 0 10px rgba(125,211,252,.08)', display: 'flex', height: 220, justifyContent: 'center', opacity: fade(frame, 24), textAlign: 'center', width: 220}}><div><strong style={{fontSize: 32}}>Agent</strong><div style={{color: colors.muted, fontSize: 17, marginTop: 12}}>想 → 做 → 看 → 再决定</div></div></div>
    <div><div style={{alignItems: 'center', display: 'grid', gap: 12, gridTemplateColumns: 'repeat(5, 1fr)'}}>{steps.map((step, index) => {const start = stepStarts[index]; const active = frame >= start + 12; return <div key={step} style={{...panel, background: active ? 'rgba(125,211,252,.16)' : panel.background, borderColor: active ? colors.accent : colors.line, minHeight: 112, opacity: fade(frame, start), padding: '20px 10px', textAlign: 'center', transform: `translateY(${slide(frame, start)}px)`}}><strong style={{fontSize: 21}}>{step}</strong></div>;})}</div><div style={{alignItems: 'center', display: 'flex', gap: 12, justifyContent: 'center', marginTop: 70}}>{loop.map((step, index) => {const start = loopStarts[index]; return <span key={step} style={{alignItems: 'center', display: 'flex', gap: 12, opacity: fade(frame, start), transform: `translateY(${slide(frame, start)}px)`}}><span style={{...panel, borderColor: index === loop.length - 1 && frame > start + 18 ? '#72dfaa' : colors.line, fontSize: 19, padding: '14px 17px'}}>{step}</span>{index < loop.length - 1 ? <Arrow>→</Arrow> : null}</span>;})}</div></div>
  </div></Shell>;
};

const Scene03 = () => {
  const frame = useCurrentFrame();
  const projectResultFrame = revealFrame('03', 9, 390);
  const stopFrame = revealFrame('03', 11, 540);
  const routeProgress = interpolate(frame, [projectResultFrame, projectResultFrame + 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <Shell><Title label="SCENE 03 · BOUNDARY MAP">Sandbox 画出行动边界</Title><div style={{...panel, borderColor: '#4e8b9c', height: 470, marginTop: 48, padding: 34, position: 'relative', opacity: fade(frame)}}><div style={{background: '#0e1c2d', border: '1px solid #4e8b9c', borderRadius: 9, color: colors.accent, fontFamily: 'Menlo, Monaco, Consolas, monospace', fontSize: 19, left: 28, padding: '8px 14px', position: 'absolute', top: -20}}>Sandbox · workspace-write</div><div style={{...panel, background: 'rgba(22,49,40,.55)', border: '1px dashed rgba(114,223,170,.65)', height: 290, left: 45, padding: 25, position: 'absolute', top: 82, width: '49%'}}><h3 style={{margin: 0, fontSize: 24}}>工作区内：可写</h3><FileState name="项目目录 / final.md" status={frame >= projectResultFrame ? '已修改' : '未修改'} done={frame >= projectResultFrame} style={{marginTop: 28}} /></div><div style={{...panel, background: 'rgba(17,26,43,.95)', height: 150, padding: 23, position: 'absolute', right: 45, top: 152, width: '29%', opacity: fade(frame), transform: `translateY(${slide(frame)}px)`}}><div style={{color: colors.muted, fontSize: 19}}>边界之外</div><FileState name="桌面目录 / draft.md" status="未修改" done={false} style={{marginTop: 12}} /></div><div style={{background: '#72dfaa', height: 4, left: '43%', opacity: fade(frame, projectResultFrame), position: 'absolute', top: 285, width: `${18 * routeProgress}%`}} /><div style={{left: `calc(43% + ${18 * routeProgress}%)`, opacity: fade(frame, projectResultFrame), position: 'absolute', top: 277}}><ArrowHead tone="#72dfaa" /></div><div style={{background: '#ff8491', height: 70, left: '61%', opacity: fade(frame, stopFrame), position: 'absolute', top: 252, width: 4}} /></div></Shell>;
};

const Scene04 = () => {
  const frame = useCurrentFrame();
  const paths = [{text: '是 → 执行', tone: '#72dfaa', result: '继续'}, {text: '否 → 请求 Approval', tone: '#f5c86b', result: '等待'}, {text: '获得许可', tone: '#72dfaa', result: '获准范围内继续'}, {text: '未获许可', tone: '#ff8491', result: '停止'}];
  const pathStarts = [3, 4, 6, 8].map((cueIndex, index) => revealFrame('04', cueIndex, 100 + index * 62));
  return <Shell><Title label="SCENE 04 · DECISION FLOW">越过边界之前，还要经过 Approval</Title><div style={{alignItems: 'center', display: 'grid', gap: 20, gridTemplateColumns: '185px 230px 1fr', height: 480, marginTop: 42}}><div style={{...panel, padding: 27, textAlign: 'center', opacity: fade(frame, revealFrame('04', 0, 24))}}><h3 style={{margin: 0, fontSize: 24}}>Sandbox</h3><div style={{color: colors.accent, fontSize: 22, marginTop: 14}}>能不能</div></div><div style={{...panel, padding: 27, textAlign: 'center', opacity: fade(frame, revealFrame('04', 1, 60))}}><h3 style={{fontSize: 22, margin: 0}}>在 Sandbox 内吗</h3><div style={{color: colors.muted, fontSize: 17, marginTop: 14}}>动作请求</div></div><div style={{display: 'flex', flexDirection: 'column', gap: 15}}>{paths.map((path, index) => {const start = pathStarts[index]; return <div key={path.text} style={{alignItems: 'center', display: 'flex', gap: 14, opacity: fade(frame, start), transform: `translateX(${interpolate(frame, [start, start + 18], [-20, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}px)`}}><div style={{...panel, borderColor: path.tone, color: path.tone, flex: '0 0 230px', fontSize: 19, padding: '14px 15px', textAlign: 'center'}}>{path.text}</div><div style={{background: path.tone, height: 2, flex: 1}} /><strong style={{color: path.tone, fontSize: 17, minWidth: 125}}>{path.result}</strong></div>;})}</div></div></Shell>;
};

const Scene05 = () => {
  const frame = useCurrentFrame();
  const rules = ['构建命令', '测试要求', '审查规则', '仓库约定'];
  const ruleStarts = [5, 6, 6, 6].map((cueIndex, index) => revealFrame('05', cueIndex, 55 + index * 35) + index * 14);
  const feedbackStart = revealFrame('05', 9, 275);
  return <Shell><Title label="SCENE 05 · RULE INJECTION">有权限，还要先读项目规则</Title><div style={{alignItems: 'center', display: 'grid', gap: 45, gridTemplateColumns: '260px 1fr', height: 470, marginTop: 44}}><div style={{...panel, padding: 32, textAlign: 'center', opacity: fade(frame, revealFrame('05', 3, 28)), transform: `translateY(${slide(frame, revealFrame('05', 3, 28))}px)`}}><div style={{color: colors.accent, fontSize: 54}}>⌁</div><strong style={{display: 'block', fontFamily: 'Menlo, Monaco, Consolas, monospace', fontSize: 26, marginTop: 12}}>AGENTS.md</strong><div style={{color: colors.muted, fontSize: 18, marginTop: 12}}>规则入口</div></div><div><div style={{alignItems: 'center', display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, 1fr)'}}>{rules.map((rule, index) => {const start = ruleStarts[index]; return <div key={rule} style={{...panel, borderColor: frame >= start + 12 ? colors.accent : colors.line, opacity: fade(frame, start), padding: '25px 12px', textAlign: 'center'}}><strong style={{fontSize: 20}}>{rule}</strong></div>;})}</div><div style={{alignItems: 'center', display: 'flex', gap: 16, justifyContent: 'center', marginTop: 75, opacity: fade(frame, feedbackStart)}}><Badge tone="#ff8491">错误假设</Badge><Arrow>→</Arrow><Badge tone="#72dfaa">用户纠正</Badge><Arrow>→</Arrow><Badge tone="#72dfaa">规则复用</Badge></div></div></div></Shell>;
};

const Scene06 = () => {
  const frame = useCurrentFrame();
  const sources = [{name: 'AGENTS.md', description: '稳定项目规则', tone: colors.accent, position: {left: 0, top: 35}}, {name: 'Memory', description: '过去会话的提炼信息', tone: colors.accentStrong, position: {left: 0, bottom: 30}}, {name: 'Chronicle', description: '近期屏幕活动上下文', tone: '#f5c86b', position: {right: 0, top: 100}}];
  const sourceStarts = [0, 2, 4].map((cueIndex, index) => revealFrame('06', cueIndex, 30 + index * 55));
  const warningStart = revealFrame('06', 7, 270);
  const summaryStart = revealFrame('06', 10, 330);
  return <Shell>
    <Title label="SCENE 06 · CONTEXT MAP">规则负责确定，上下文负责补充</Title>
    <div style={{height: 390, marginTop: 40, position: 'relative'}}>
      {sources.map((source, index) => <div key={source.name} style={{...panel, borderColor: source.tone, boxSizing: 'border-box', height: 144, padding: '18px 21px', position: 'absolute', width: 320, ...source.position, opacity: fade(frame, sourceStarts[index]), transform: `translateY(${slide(frame, sourceStarts[index])}px)`}}><strong style={{fontFamily: 'Menlo, Monaco, Consolas, monospace', fontSize: 23}}>{source.name}</strong><div style={{color: source.tone, fontSize: 18, marginTop: 8}}>{source.description}</div><Badge tone={source.tone} style={{fontSize: 15, marginTop: 12}}>{index === 0 ? '确定性' : '补充性'}</Badge></div>)}
      <div style={{alignItems: 'center', background: '#192e4b', border: '1px solid #5577a8', borderRadius: 18, boxShadow: '0 0 0 8px rgba(125,211,252,.08)', display: 'flex', height: 142, justifyContent: 'center', left: '50%', position: 'absolute', textAlign: 'center', top: 140, transform: 'translateX(-50%)', width: 220, opacity: fade(frame, revealFrame('06', 1, 130))}}><div><strong style={{fontSize: 28}}>Agent</strong><div style={{color: colors.muted, fontSize: 16, marginTop: 9}}>信息汇入上下文</div></div></div>
      <div style={{background: colors.accent, height: 2, left: 320, position: 'absolute', top: 107, transform: 'rotate(13deg)', transformOrigin: 'left center', width: 436, opacity: fade(frame, sourceStarts[0])}} />
      <div style={{left: 745, position: 'absolute', top: 197, opacity: fade(frame, sourceStarts[0])}}><ArrowHead tone={colors.accent} /></div>
      <div style={{background: colors.accentStrong, height: 2, left: 320, position: 'absolute', top: 288, transform: 'rotate(-10.7deg)', transformOrigin: 'left center', width: 441, opacity: fade(frame, sourceStarts[1])}} />
      <div style={{left: 745, position: 'absolute', top: 197, opacity: fade(frame, sourceStarts[1])}}><ArrowHead tone={colors.accentStrong} /></div>
      <div style={{background: '#f5c86b', height: 2, left: 991, position: 'absolute', top: 205, transform: 'rotate(-4.4deg)', transformOrigin: 'left center', width: 426, opacity: fade(frame, sourceStarts[2])}} />
      <div style={{left: 978, position: 'absolute', top: 197, opacity: fade(frame, sourceStarts[2])}}><ArrowHead direction="left" tone="#f5c86b" /></div>
    </div>
    <div style={{alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginTop: 18}}>
      <div style={{display: 'flex', gap: 9, opacity: fade(frame, summaryStart)}}><Badge tone={colors.accent}>规则负责确定性</Badge><Badge tone={colors.accentStrong}>上下文负责补充性</Badge></div>
      <div style={{display: 'flex', gap: 9, opacity: fade(frame, warningStart)}}>{['隐私', '提示注入', '资源限制'].map((item, index) => <Badge key={item} tone="#f5c86b" style={{fontSize: 15, opacity: fade(frame, warningStart + index * 10)}}>{item}</Badge>)}</div>
    </div>
  </Shell>;
};

const Scene07 = () => {
  const frame = useCurrentFrame();
  const rowStarts = [revealFrame('07', 6, 80), revealFrame('07', 9, 240)];
  const conclusionStart = revealFrame('07', 12, 320);
  return <Shell><Title label="SCENE 07 · CONTROLLED EXPERIMENT">请求没变，边界变了，结果就变了</Title><div style={{...panel, alignItems: 'center', display: 'flex', gap: 22, justifyContent: 'center', marginTop: 36, padding: '17px 22px', opacity: fade(frame, revealFrame('07', 0, 18))}}><span style={{color: colors.muted, fontSize: 18}}>同一个请求</span><strong style={{fontFamily: 'Menlo, Monaco, Consolas, monospace', fontSize: 21}}>在当前项目创建 hello.txt</strong><Badge>Agent</Badge></div><div style={{display: 'grid', gap: 18, marginTop: 24}}>{[{mode: 'read-only', round: '第一轮', tree: ['├── source.md', '└── visual-script.md'], result: '未写入', tone: '#ff8491'}, {mode: 'workspace-write', round: '第二轮', tree: ['├── source.md', '├── visual-script.md', '└── hello.txt'], result: 'hello.txt 已创建', tone: '#72dfaa'}].map((row, index) => <div key={row.mode} style={{display: 'grid', gap: 14, gridTemplateColumns: '220px 1fr 250px', opacity: fade(frame, rowStarts[index]), transform: `translateY(${slide(frame, rowStarts[index])}px)`}}><div style={{...panel, borderColor: row.tone, padding: 22}}><strong style={{color: row.tone, display: 'block', fontFamily: 'Menlo, Monaco, Consolas, monospace', fontSize: 22}}>{row.mode}</strong><span style={{color: colors.muted, display: 'block', fontSize: 17, marginTop: 9}}>{row.round}</span></div><div style={{...panel, fontFamily: 'Menlo, Monaco, Consolas, monospace', fontSize: 19, lineHeight: 1.8, padding: '15px 22px'}}><div style={{color: colors.muted, fontFamily: 'inherit', fontSize: 16, marginBottom: 5}}>项目文件树</div>{row.tree.map((line) => <div key={line} style={{color: line.includes('hello') ? '#72dfaa' : colors.text}}>{line}</div>)}</div><div style={{...panel, alignItems: 'center', borderColor: row.tone, color: row.tone, display: 'flex', fontSize: 20, fontWeight: 800, justifyContent: 'center', padding: 20, textAlign: 'center'}}>{row.result}</div></div>)}</div><div style={{color: colors.muted, fontSize: 22, marginTop: 28, opacity: fade(frame, conclusionStart), textAlign: 'center'}}>请求没有变　·　Agent 没有变　·　边界变了　·　结果就变了</div></Shell>;
};

const Scene08 = () => {
  const frame = useCurrentFrame();
  const nodes = [['任务目标', '进入'], ['Agent', '持续行动'], ['Sandbox', '行动边界'], ['Approval', '越界授权']];
  const nodeStarts = [1, 2, 3, 4].map((cueIndex, index) => revealFrame('08', cueIndex, 34 + index * 48));
  const supportStart = revealFrame('08', 5, 250);
  const conclusionStart = revealFrame('08', 11, 360);
  const teaserStart = revealFrame('08', 12, 940);
  const teaserOpacity = fade(frame, teaserStart);
  const mapOpacity = interpolate(frame, [teaserStart - 60, teaserStart + 60], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <Shell><Title label="SCENE 08 · SYSTEM MAP + PREVIEW CARD">把五个概念合成一套工作模型</Title><div style={{position: 'relative'}}><div style={{opacity: mapOpacity}}><div style={{alignItems: 'center', display: 'flex', gap: 12, justifyContent: 'center', marginTop: 72}}>{nodes.map(([title, description], index) => {const start = nodeStarts[index]; return <span key={title} style={{alignItems: 'center', display: 'flex', gap: 12, opacity: fade(frame, start), transform: `translateY(${slide(frame, start)}px)`}}><div style={{...panel, minWidth: 175, padding: '20px 17px', textAlign: 'center'}}><strong style={{display: 'block', fontSize: 22}}>{title}</strong><span style={{color: colors.muted, display: 'block', fontSize: 16, marginTop: 8}}>{description}</span></div>{index < nodes.length - 1 ? <Arrow>→</Arrow> : null}</span>;})}</div><div style={{display: 'flex', gap: 28, justifyContent: 'center', marginTop: 45, opacity: fade(frame, supportStart)}}><Badge>AGENTS.md：稳定规则</Badge><Badge tone={colors.accentStrong}>Memory／Chronicle：补充上下文</Badge></div><div style={{...panel, borderColor: colors.accent, color: colors.accent, fontSize: 29, fontWeight: 800, margin: '55px auto 0', padding: '18px 28px', textAlign: 'center', width: 640, opacity: fade(frame, conclusionStart)}}>给清目标 · 画好边界 · 写下规则</div></div><div style={{...panel, borderColor: colors.accent, left: '50%', maxWidth: 940, padding: '30px 44px', position: 'absolute', textAlign: 'center', top: 62, transform: 'translateX(-50%)', width: '100%', opacity: teaserOpacity}}><div style={{color: colors.accent, fontSize: 19, letterSpacing: 4}}>下一集</div><strong style={{display: 'block', fontSize: 40, marginTop: 15}}>03 · 安装与登录</strong><div style={{color: colors.muted, fontSize: 22, letterSpacing: 3, marginTop: 13}}>Mac　·　Windows　·　Linux</div></div></div></Shell>;
};

const Scene = ({sceneId}: {sceneId: string}) => {
  switch (sceneId) {
    case 'scene-01-split-result': return <Scene01 />;
    case 'scene-02-agent-loop': return <Scene02 />;
    case 'scene-03-boundary-map': return <Scene03 />;
    case 'scene-04-decision-flow': return <Scene04 />;
    case 'scene-05-rule-injection': return <Scene05 />;
    case 'scene-06-context-map': return <Scene06 />;
    case 'scene-07-controlled-experiment': return <Scene07 />;
    case 'scene-08-system-map': return <Scene08 />;
    default: return null;
  }
};

export const CoreConceptsVideo = () => {
  const durationInFrames = getTotalDurationFrames(videoConfig);
  const contentStartFrame = getContentStartFrame(videoConfig);
  let sceneFromFrame = 0;
  const sceneSequences = videoConfig.scenes.map((scene) => {
    const from = sceneFromFrame;
    const durationInFrames = secondsToFrames(scene.durationSeconds, videoConfig.fps);
    sceneFromFrame += durationInFrames;
    return {scene, from, durationInFrames};
  });
  return <>
    {videoConfig.series?.coverSrc ? <Sequence from={0} durationInFrames={contentStartFrame} name={`Series Cover · ${videoConfig.series.id}`}><SeriesCover src={videoConfig.series.coverSrc} /></Sequence> : null}
    {videoConfig.audioTracks?.map((track) => <Sequence key={track.id ?? track.src} from={contentStartFrame + secondsToFrames(track.startSeconds ?? 0, videoConfig.fps)} durationInFrames={Math.max(1, Math.ceil(track.durationSeconds * videoConfig.fps))} name={`Audio ${track.id ?? track.src}`} premountFor={videoConfig.fps * 2}><Audio pauseWhenBuffering src={staticFile(track.src)} /></Sequence>)}
    {sceneSequences.map(({scene, from, durationInFrames}) => <Sequence key={scene.id} from={contentStartFrame + from} durationInFrames={durationInFrames} name={scene.id}><Scene sceneId={scene.id} /></Sequence>)}
    {videoConfig.subtitleCues ? <Sequence from={contentStartFrame} name="Subtitles"><TimedCaption bottomMargin={34} cues={videoConfig.subtitleCues} /></Sequence> : null}
    <div style={{display: 'none'}} data-duration-frames={durationInFrames} />
  </>;
};
