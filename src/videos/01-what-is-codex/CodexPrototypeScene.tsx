import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CSSProperties, ReactNode} from 'react';
import type {
  ComparisonSceneConfig,
  SceneConfig,
  StepListSceneConfig,
  SummarySceneConfig,
  TerminalSceneConfig,
} from '../../lib/videoTypes';

type Props = {scene: SceneConfig};

const palette = {
  app: '#39d7c2',
  cli: '#78dd6b',
  ide: '#ad88ff',
  web: '#5da8ff',
  warning: '#f2b85b',
  danger: '#fb7185',
  text: '#f4f9fb',
  muted: '#9bb0bd',
  line: 'rgba(155, 200, 220, 0.18)',
  panel: 'rgba(14, 28, 39, 0.88)',
};

const fontFamily =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
const mono = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';

const fade = (frame: number, start: number, duration = 14) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const revealFrame = (scene: SceneConfig, index: number, fallback: number, fps: number) =>
  scene.visualRevealSeconds?.[index] === undefined
    ? fallback
    : Math.round(scene.visualRevealSeconds[index] * fps);

const Panel = ({children, style}: {children: ReactNode; style?: CSSProperties}) => (
  <div
    style={{
      background: palette.panel,
      border: `1px solid ${palette.line}`,
      borderRadius: 18,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.025)',
      padding: 22,
      ...style,
    }}
  >
    {children}
  </div>
);

const Label = ({children, color = palette.muted}: {children: ReactNode; color?: string}) => (
  <div style={{color, fontSize: 18, fontWeight: 750, letterSpacing: 1.6, textTransform: 'uppercase'}}>
    {children}
  </div>
);

const Big = ({children, color = palette.text, style}: {children: ReactNode; color?: string; style?: CSSProperties}) => (
  <div style={{color, fontSize: 34, fontWeight: 820, lineHeight: 1.18, ...style}}>{children}</div>
);

const Chip = ({children, color = palette.app}: {children: ReactNode; color?: string}) => (
  <div
    style={{
      alignItems: 'center',
      border: `1px solid ${palette.line}`,
      borderRadius: 999,
      color,
      display: 'inline-flex',
      fontSize: 18,
      gap: 8,
      padding: '8px 13px',
      width: 'fit-content',
    }}
  >
    <span style={{background: color, borderRadius: '50%', boxShadow: `0 0 13px ${color}`, height: 8, width: 8}} />
    {children}
  </div>
);

const Step = ({index, children, active = true}: {index: string; children: ReactNode; active?: boolean}) => (
  <div
    style={{
      alignItems: 'center',
      background: 'rgba(255,255,255,.025)',
      border: `1px solid ${active ? 'rgba(57,215,194,.42)' : palette.line}`,
      borderRadius: 12,
      color: active ? palette.text : palette.muted,
      display: 'flex',
      fontSize: 22,
      gap: 12,
      padding: '12px 14px',
    }}
  >
    <span
      style={{
        background: 'rgba(57,215,194,.13)',
        borderRadius: 9,
        color: palette.app,
        display: 'grid',
        fontSize: 18,
        fontWeight: 800,
        height: 30,
        placeItems: 'center',
        width: 30,
      }}
    >
      {index}
    </span>
    {children}
  </div>
);

const Layout = ({
  scene,
  eyebrow,
  lede,
  headline,
  children,
}: {
  scene: SceneConfig;
  eyebrow: string;
  lede?: string;
  headline?: string;
  children: ReactNode;
}) => {
  const frame = useCurrentFrame();
  const entrance = fade(frame, 0, 18);

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(circle at 14% 12%, rgba(57,215,194,.12), transparent 30%), radial-gradient(circle at 86% 18%, rgba(93,168,255,.11), transparent 31%), linear-gradient(145deg, #08131c, #050b10 68%)',
        color: palette.text,
        fontFamily,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
          inset: 24,
          opacity: 0.22,
          position: 'absolute',
        }}
      />
      <div
        style={{
          border: '1px solid rgba(155, 200, 220, 0.2)',
          borderRadius: 24,
          inset: 24,
          position: 'absolute',
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          opacity: entrance,
          padding: '76px 116px 166px',
          transform: `translateY(${(1 - entrance) * 12}px)`,
        }}
      >
        <div style={{color: palette.app, fontSize: 20, fontWeight: 800, letterSpacing: 3.2, textTransform: 'uppercase'}}>
          {eyebrow}
        </div>
        <h1 style={{fontSize: 64, letterSpacing: -2.8, lineHeight: 1.08, margin: '12px 0 8px'}}>
          {headline ?? scene.headline}
        </h1>
        {lede ? <p style={{color: palette.muted, fontSize: 25, lineHeight: 1.5, margin: 0}}>{lede}</p> : null}
        {children}
      </div>
    </AbsoluteFill>
  );
};

const Scene01 = ({scene}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entries = [
    {icon: 'A', title: '桌面 App', detail: '图形界面 · diff · 多任务', color: palette.app},
    {icon: '›_', title: 'CLI', detail: '终端 · 脚本 · SSH', color: palette.cli},
    {icon: '{ }', title: 'IDE 扩展', detail: '代码旁边的代理', color: palette.ide},
    {icon: '☁', title: '云端 Web', detail: '远程 · 后台 · 并行', color: palette.web},
  ];

  return (
    <Layout scene={scene} eyebrow="Scene 01 · Opening" lede="四种形态，不是四个彼此竞争的产品。">
      <div
        style={{
          display: 'grid',
          flex: 1,
          gap: 24,
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gridTemplateRows: 'repeat(2, minmax(0, 1fr))',
          marginTop: 24,
          minHeight: 0,
          position: 'relative',
        }}
      >
        {entries.map((entry, index) => {
          const opacity = fade(frame, revealFrame(scene, index, 30 + index * 18, fps));
          const isRightColumn = index % 2 === 1;
          return (
            <Panel
              key={entry.title}
              style={{
                alignItems: isRightColumn ? 'flex-end' : 'flex-start',
                color: entry.color,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 0,
                opacity,
                padding: isRightColumn ? '24px 30px 24px 180px' : '24px 180px 24px 30px',
                textAlign: isRightColumn ? 'right' : 'left',
                transform: `translateY(${(1 - opacity) * 22}px)`,
              }}
            >
              <div style={{border: `1px solid ${entry.color}`, borderRadius: 12, display: 'grid', fontFamily: index === 1 ? mono : fontFamily, fontSize: 24, fontWeight: 900, height: 64, placeItems: 'center', width: 64}}>
                {entry.icon}
              </div>
              <div>
                <Big color={entry.color} style={{fontSize: 40}}>{entry.title}</Big>
                <div style={{color: palette.muted, fontSize: 22, marginTop: 7}}>{entry.detail}</div>
              </div>
            </Panel>
          );
        })}
        <div
          style={{
            alignItems: 'center',
            aspectRatio: '1',
            background: 'radial-gradient(circle, rgba(57,215,194,.18), rgba(9,23,31,.95) 66%)',
            border: '1px solid rgba(57,215,194,.55)',
            borderRadius: '50%',
            boxShadow: '0 0 52px rgba(57,215,194,.14)',
            display: 'flex',
            flexDirection: 'column',
            fontSize: 34,
            fontWeight: 850,
            justifyContent: 'center',
            left: '50%',
            opacity: fade(frame, revealFrame(scene, 3, 84, fps)),
            position: 'absolute',
            textAlign: 'center',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 320,
          }}
        >
          一个 Codex
          <span style={{color: palette.muted, fontSize: 20, marginTop: 16}}>四种入口</span>
        </div>
      </div>
    </Layout>
  );
};

const Scene02 = ({scene}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const columns = [
    {label: '回答：给你建议', items: ['分析报错', '返回代码片段', '等待你复制、粘贴、再运行'], active: false},
    {label: '代理：进入项目执行', items: ['Read project', 'Edit files', 'Run tests', 'Deliver diff'], active: true},
  ];
  return (
    <Layout scene={scene} eyebrow="Scene 02 · Comparison" lede="同一个“项目跑不起来了”，两条工作流停在不同位置。">
      <div style={{display: 'grid', flex: 1, gap: 40, gridTemplateColumns: '1fr 1fr', marginTop: 34}}>
        {columns.map((column, columnIndex) => (
          <Panel key={column.label} style={{borderColor: column.active ? 'rgba(57,215,194,.42)' : palette.line, padding: 30}}>
            <Label color={column.active ? palette.app : palette.muted}>{column.label}</Label>
            <div style={{display: 'flex', flexDirection: 'column', gap: 13, marginTop: 26}}>
              {column.items.map((item, index) => {
                const opacity = fade(frame, revealFrame(scene, columnIndex, 34 + columnIndex * 70, fps) + index * 12);
                return <div key={item} style={{opacity}}><Step index={index === column.items.length - 1 && !column.active ? '…' : column.active ? ['R', 'E', 'T', 'D'][index] : String(index + 1)} active={column.active || index < 2}>{item}</Step></div>;
              })}
            </div>
          </Panel>
        ))}
      </div>
    </Layout>
  );
};

const Scene03 = ({scene}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const steps = ['读取项目', '定位问题', '修改文件', '运行测试', '交付 diff'];
  return (
    <Layout scene={scene} eyebrow="Scene 03 · Agent Loop" headline="一个目标，如何变成可验收的结果？" lede="五个动作围绕同一个任务推进，最后停在人工验收前。">
      <div style={{display: 'grid', flex: 1, gap: 36, gridTemplateColumns: '.85fr 1.35fr', marginTop: 30}}>
        <Panel style={{display: 'flex', flexDirection: 'column', gap: 10}}>
          <Chip>目标：修到测试通过</Chip>
          {steps.map((step, index) => {
            const opacity = fade(frame, revealFrame(scene, index, 28 + index * 30, fps));
            return <div key={step} style={{opacity}}><Step index={String(index + 1)} active={index < 4}>{step}</Step></div>;
          })}
        </Panel>
        <Panel style={{background: '#03080c', overflow: 'hidden', padding: 0}}>
          <div style={{background: '#0b151d', borderBottom: `1px solid ${palette.line}`, color: palette.muted, fontFamily: mono, fontSize: 19, padding: '13px 18px'}}>workspace / project</div>
          <div style={{fontFamily: mono, fontSize: 23, lineHeight: 1.9, padding: 28}}>
            <div style={{opacity: fade(frame, revealFrame(scene, 1, 60, fps))}}><span style={{color: palette.muted}}>src/</span> app.py <span style={{color: palette.warning}}>Modified</span></div>
            <div style={{opacity: fade(frame, revealFrame(scene, 2, 90, fps))}}><span style={{color: palette.muted}}>config/</span> requirements.txt <span style={{color: palette.warning}}>Modified</span></div>
            <div style={{marginTop: 30, opacity: fade(frame, revealFrame(scene, 3, 120, fps))}}>$ pytest</div>
            <div style={{color: palette.cli, opacity: fade(frame, revealFrame(scene, 3, 138, fps))}}>8 passed in 1.42s</div>
            <div style={{marginTop: 28, opacity: fade(frame, revealFrame(scene, 4, 165, fps))}}><Chip color={palette.warning}>Diff ready · 等待验收</Chip></div>
          </div>
        </Panel>
      </div>
    </Layout>
  );
};

const Scene04 = ({scene}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const routes = [
    {title: '桌面 App', color: palette.app},
    {title: 'CLI', color: palette.cli},
    {title: 'IDE 扩展', color: palette.ide},
    {title: '云端 Web', color: palette.web},
  ];
  return (
    <Layout scene={scene} eyebrow="Scene 04 · Routing" lede="入口名称不同，最关键的是任务在哪里执行。">
      <div style={{display: 'grid', flex: 1, gap: 28, gridTemplateColumns: '.9fr 1.15fr 1.15fr', marginTop: 34}}>
        <Panel style={{display: 'flex', flexDirection: 'column', gap: 12}}>
          {routes.map((route, index) => {
            const opacity = fade(frame, revealFrame(scene, index, 30 + index * 22, fps));
            return <div key={route.title} style={{borderLeft: `4px solid ${route.color}`, color: route.color, fontSize: 24, fontWeight: 750, opacity, padding: '16px 18px'}}>{route.title}</div>;
          })}
        </Panel>
        <Panel style={{borderColor: 'rgba(57,215,194,.45)', display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center'}}>
          <Label color={palette.app}>本机</Label><Big>Local Project</Big>
          {['Files', 'Shell'].map((item) => <div key={item} style={{border: `1px dashed ${palette.app}`, borderRadius: 14, color: palette.muted, fontSize: 22, padding: 16}}>{item}</div>)}
          <Chip>App · CLI · IDE</Chip>
        </Panel>
        <Panel style={{borderColor: 'rgba(93,168,255,.45)', display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center'}}>
          <Label color={palette.web}>云端</Label><Big>Isolated Environment</Big>
          {['Remote Repo', 'Background Task'].map((item) => <div key={item} style={{border: `1px dashed ${palette.web}`, borderRadius: 14, color: palette.muted, fontSize: 22, padding: 16}}>{item}</div>)}
          <Chip color={palette.web}>Web</Chip>
        </Panel>
      </div>
    </Layout>
  );
};

const Scene05 = ({scene}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const routes = [
    {task: '可视化 diff / 多任务', target: '桌面 App', icon: 'A', color: palette.app},
    {task: '终端 / SSH', target: 'CLI', icon: '›_', color: palette.cli},
    {task: '编辑器内开发', target: 'IDE 扩展', icon: '{ }', color: palette.ide},
    {task: '后台长任务', target: '云端 Web', icon: '☁', color: palette.web},
  ];
  return (
    <Layout scene={scene} eyebrow="Scene 05 · Task Routing" headline="不要找唯一入口，按工作场景选择" lede="这个任务适合在哪里执行？">
      <div style={{display: 'grid', flex: 1, gap: 36, gridTemplateColumns: '1fr 1fr', marginTop: 38}}>
        {[routes.slice(0, 2), routes.slice(2)].map((group, groupIndex) => (
          <Panel key={groupIndex} style={{display: 'flex', flexDirection: 'column', gap: 24, justifyContent: 'center'}}>
            {group.map((route, index) => {
              const routeIndex = groupIndex * 2 + index;
              const opacity = fade(frame, revealFrame(scene, routeIndex, 34 + routeIndex * 26, fps));
              return <div key={route.task} style={{alignItems: 'center', display: 'grid', gap: 16, gridTemplateColumns: '1fr auto 1fr', opacity}}><Panel style={{fontSize: 22, padding: 18}}>{route.task}</Panel><span style={{color: palette.muted, fontSize: 30}}>→</span><Panel style={{alignItems: 'center', color: route.color, display: 'flex', fontSize: 23, justifyContent: 'space-between', padding: 18}}><b>{route.target}</b><span style={{fontFamily: mono}}>{route.icon}</span></Panel></div>;
            })}
          </Panel>
        ))}
      </div>
    </Layout>
  );
};

const Scene06 = ({scene}: {scene: StepListSceneConfig}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const statuses = ['Created', 'Indexed', 'Reviewed', 'Fixed', 'Migrated'];
  const targets = ['feature.ts', 'Repository', 'Pull request', 'Failing test', 'Dependencies'];
  return (
    <Layout scene={scene} eyebrow="Scene 06 · Task Queue" lede="共同点：结合项目上下文，再执行真实动作。">
      <div style={{display: 'grid', flex: 1, gap: 36, gridTemplateColumns: '1fr 1fr', marginTop: 32}}>
        <Panel style={{display: 'flex', flexDirection: 'column', gap: 10}}>
          {scene.steps.map((step, index) => {
            const opacity = fade(frame, revealFrame(scene, index, 28 + index * 28, fps));
            return <div key={step} style={{opacity}}><Step index={String(index + 1)}>{step}</Step></div>;
          })}
        </Panel>
        <Panel style={{display: 'flex', flexDirection: 'column', gap: 14}}>
          <Label>Project Status Board</Label>
          {statuses.map((status, index) => <div key={status} style={{display: 'grid', fontSize: 21, gridTemplateColumns: '1.2fr .8fr', opacity: fade(frame, revealFrame(scene, index, 28 + index * 28, fps))}}><span>{targets[index]}</span><span style={{color: palette.app, fontFamily: mono, textAlign: 'right'}}>{status}</span></div>)}
          <Panel style={{fontSize: 29, fontWeight: 800, marginTop: 'auto', padding: 20, textAlign: 'center'}}>理解上下文 <span style={{color: palette.app}}>+</span> 执行动作</Panel>
        </Panel>
      </div>
    </Layout>
  );
};

const Scene07 = ({scene}: {scene: ComparisonSceneConfig}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const columns = [
    {label: 'Human', title: '定方向与验收', items: ['目标', '边界', '技术方向', '审查与拍板']},
    {label: 'Review Required', title: 'Diff 被拦截', items: ['看 diff → 跑验证 → 拍板'], gate: true},
    {label: 'AI', title: '分析与执行', items: ['读取上下文', '定位问题', '修改文件', '重复劳动']},
  ];
  return (
    <Layout scene={scene} eyebrow="Scene 07 · Review Gate" lede="完成执行，不等于结果自动正确。">
      <div style={{display: 'grid', flex: 1, gap: 30, gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 36}}>
        {columns.map((column, index) => {
          const opacity = fade(frame, revealFrame(scene, Math.min(index, 1), 32 + index * 32, fps));
          return <Panel key={column.label} style={{alignItems: column.gate ? 'center' : 'stretch', background: column.gate ? 'rgba(71,48,17,.23)' : palette.panel, borderColor: column.gate ? 'rgba(242,184,91,.45)' : palette.line, display: 'flex', flexDirection: 'column', justifyContent: 'center', opacity, textAlign: column.gate ? 'center' : 'left'}}><Label color={index === 2 ? palette.app : column.gate ? palette.warning : palette.muted}>{column.label}</Label><Big color={column.gate ? palette.warning : palette.text} style={{marginTop: 14}}>{column.title}</Big>{column.gate ? <><div style={{background: palette.warning, boxShadow: '0 0 18px rgba(242,184,91,.5)', height: 3, margin: '26px auto', width: '70%'}} /><div style={{color: palette.muted, fontSize: 20}}>{column.items[0]}</div><div style={{marginTop: 24}}><Chip>Accepted</Chip></div></> : <ul style={{color: palette.muted, display: 'grid', fontSize: 21, gap: 14, listStyle: 'none', margin: '22px 0 0', padding: 0}}>{column.items.map((item) => <li key={item}>{item}</li>)}</ul>}</Panel>;
        })}
      </div>
    </Layout>
  );
};

const Scene08 = ({scene}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tools = [
    {label: 'ChatGPT', title: '问答与建议', detail: '解释 · 方案 · 代码片段', color: palette.muted},
    {label: 'Codex', title: '编程代理', detail: 'OpenAI · AGENTS.md · 四种入口', color: palette.app},
    {label: 'Claude Code', title: '编程代理', detail: 'Anthropic · CLAUDE.md · 终端侧重', color: palette.ide},
  ];
  return (
    <Layout scene={scene} eyebrow="Scene 08 · Concept Map" headline="先分工作方式，再看产品差异">
      <div style={{background: 'linear-gradient(90deg, #71818b, #39d7c2)', borderRadius: 999, height: 5, margin: '82px 70px 42px', position: 'relative'}}><span style={{color: palette.muted, fontSize: 18, left: 0, position: 'absolute', top: 18}}>问答与建议</span><span style={{color: palette.muted, fontSize: 18, position: 'absolute', right: 0, top: 18}}>执行项目任务</span></div>
      <div style={{display: 'grid', gap: 28, gridTemplateColumns: 'repeat(3, 1fr)'}}>
        {tools.map((tool, index) => <Panel key={tool.label} style={{borderColor: index > 0 ? 'rgba(57,215,194,.38)' : palette.line, minHeight: 174, opacity: fade(frame, revealFrame(scene, index, 34 + index * 32, fps)), padding: 28}}><Label color={tool.color}>{tool.label}</Label><Big style={{marginTop: 16}}>{tool.title}</Big><div style={{color: palette.muted, fontSize: 20, marginTop: 14}}>{tool.detail}</div></Panel>)}
      </div>
      <Panel style={{fontSize: 22, marginTop: 24, padding: 18, textAlign: 'center'}}><span style={{color: palette.app}}>同类代理 · 不同产品体系</span>　按任务分工，不做永远不变的强弱排名</Panel>
    </Layout>
  );
};

const Scene09 = ({scene}: {scene: TerminalSceneConfig}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <Layout scene={scene} eyebrow="Scene 09 · Terminal" headline="30 秒确认电脑认不认识 Codex" lede="一个只读取状态、不改变项目的检查动作。">
      <Panel style={{background: '#03080c', flex: 1, marginTop: 34, overflow: 'hidden', padding: 0}}>
        <div style={{background: '#0b151d', borderBottom: `1px solid ${palette.line}`, color: palette.muted, fontFamily: mono, fontSize: 19, padding: '13px 18px'}}>Terminal</div>
        <div style={{fontFamily: mono, padding: 34}}>
          <div style={{fontSize: 38}}><span style={{color: palette.app}}>$</span> codex --version</div>
          <div style={{display: 'grid', gap: 26, gridTemplateColumns: '1fr 1fr', marginTop: 34}}>
            <div style={{border: `1px solid ${palette.line}`, borderRadius: 14, opacity: fade(frame, revealFrame(scene, 0, 52, fps)), padding: 24}}><div style={{color: palette.cli, fontSize: 23}}>codex 1.x.x</div><Big style={{marginTop: 14}}>已安装</Big><div style={{color: palette.app, fontFamily, fontSize: 21, fontWeight: 750, marginTop: 20}}>✓ 状态已确认</div></div>
            <div style={{border: `1px solid ${palette.line}`, borderRadius: 14, opacity: fade(frame, revealFrame(scene, 1, 100, fps)), padding: 24}}><div style={{color: palette.danger, fontSize: 23}}>command not found: codex</div><Big style={{marginTop: 14}}>尚未安装</Big><div style={{color: palette.app, fontFamily, fontSize: 21, fontWeight: 750, marginTop: 20}}>✓ 状态已确认</div></div>
          </div>
        </div>
      </Panel>
    </Layout>
  );
};

const Scene10 = ({scene}: {scene: SummarySceneConfig}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cards = [
    ['一个 Codex', '四种入口'],
    ['看工作位置', '按场景选择'],
    ['AI 执行', '人来验收'],
  ];
  const teaserStart = Math.round((scene.teaserStartSeconds ?? scene.durationSeconds * 0.72) * fps);
  return (
    <Layout scene={scene} eyebrow="Scene 10 · Summary">
      <div style={{display: 'grid', gap: 26, gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 48}}>
        {cards.map(([title, emphasis], index) => <Panel key={title} style={{alignItems: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 170, opacity: fade(frame, revealFrame(scene, index, 28 + index * 32, fps)), textAlign: 'center'}}><Label>0{index + 1}</Label><Big style={{marginTop: 12}}>{title}<br /><span style={{color: palette.app}}>{emphasis}</span></Big></Panel>)}
      </div>
      <Panel style={{background: 'linear-gradient(90deg, rgba(173,136,255,.13), rgba(93,168,255,.08))', borderColor: 'rgba(173,136,255,.48)', marginTop: 28, opacity: fade(frame, teaserStart, 20), padding: 26}}>
        <Label color={palette.ide}>下一集</Label><Big style={{marginTop: 8}}>02 核心概念速览</Big>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18}}>{['代理循环', '上下文', 'AGENTS.md', '审批模式', '沙箱', 'Skills', 'MCP'].map((term) => <span key={term} style={{border: `1px solid ${palette.line}`, borderRadius: 999, color: palette.text, fontFamily: term === 'AGENTS.md' ? mono : fontFamily, fontSize: 18, padding: '7px 12px'}}>{term}</span>)}</div>
      </Panel>
    </Layout>
  );
};

export const CodexPrototypeScene = ({scene}: Props) => {
  switch (scene.id) {
    case 'scene-01-one-codex-four-entries': return <Scene01 scene={scene} />;
    case 'scene-02-answer-versus-execute': return <Scene02 scene={scene} />;
    case 'scene-03-goal-to-result': return <Scene03 scene={scene} />;
    case 'scene-04-local-and-cloud-routing': return <Scene04 scene={scene} />;
    case 'scene-05-choose-by-workflow': return <Scene05 scene={scene} />;
    case 'scene-06-five-delegated-jobs': return <Scene06 scene={scene as StepListSceneConfig} />;
    case 'scene-07-human-review-gate': return <Scene07 scene={scene as ComparisonSceneConfig} />;
    case 'scene-08-chat-and-coding-agents': return <Scene08 scene={scene} />;
    case 'scene-09-check-cli-status': return <Scene09 scene={scene as TerminalSceneConfig} />;
    case 'scene-10-map-summary': return <Scene10 scene={scene as SummarySceneConfig} />;
    default: return null;
  }
};
