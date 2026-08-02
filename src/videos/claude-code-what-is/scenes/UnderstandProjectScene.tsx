import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, SceneContainer} from '../../../components/SceneContainer';
import {MockWindow, StatusChip, VisualCard} from '../../../components/VisualPrimitives';
import {segmentFrame} from '../sceneTiming';

type UnderstandProjectSceneProps = {
  durationInFrames: number;
};

type FileRowProps = {
  depth: number;
  detail: string;
  label: string;
  progress: number;
  scanning: boolean;
};

const reveal = (frame: number, start: number, end = start + 16) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const clampFrame = (frame: number, delay: number) => Math.max(0, frame - delay);

const FileRow = ({depth, detail, label, progress, scanning}: FileRowProps) => (
  <div
    style={{
      alignItems: 'center',
      background: scanning ? 'rgba(125, 211, 252, 0.16)' : 'transparent',
      border: `1px solid ${scanning ? 'rgba(125, 211, 252, 0.48)' : 'transparent'}`,
      borderRadius: 10,
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) auto',
      minHeight: 48,
      opacity: progress,
      padding: '7px 12px',
      transform: `translateX(${(1 - progress) * -12}px)`,
    }}
  >
    <div
      style={{
        color: scanning ? colors.text : colors.muted,
        fontSize: 19,
        fontWeight: scanning ? 800 : 620,
        paddingLeft: depth * 22,
      }}
    >
      <span style={{color: scanning ? colors.accent : 'rgba(255,255,255,0.42)', marginRight: 10}}>
        {depth === 0 ? '▾' : '├─'}
      </span>
      {label}
    </div>
    <div style={{color: scanning ? colors.accent : 'rgba(255,255,255,0.34)', fontSize: 13, fontWeight: 720}}>{detail}</div>
  </div>
);

const FlowNode = ({label, detail, progress}: {label: string; detail: string; progress: number}) => (
  <div
    style={{
      background: 'rgba(9, 18, 31, 0.96)',
      border: `1px solid rgba(125, 211, 252, ${0.24 + progress * 0.5})`,
      borderRadius: 16,
      boxShadow: progress > 0.8 ? '0 0 28px rgba(125, 211, 252, 0.13)' : 'none',
      minWidth: 132,
      opacity: progress,
      padding: '20px 18px',
      textAlign: 'center',
      transform: `translateY(${(1 - progress) * 18}px) scale(${0.92 + progress * 0.08})`,
    }}
  >
    <div style={{fontSize: 27, fontWeight: 900}}>{label}</div>
    <div style={{color: colors.muted, fontSize: 14, marginTop: 7}}>{detail}</div>
  </div>
);

export const UnderstandProjectScene = ({durationInFrames}: UnderstandProjectSceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const windowProgress = reveal(frame, segmentFrame('07', '07-03'), segmentFrame('07', '07-03') + 20);
  const fileStart = segmentFrame('07', '07-04');
  const fileEnd = segmentFrame('07', '07-06', 0.75);
  const fileStarts = [0, 1, 2, 3, 4, 5, 6, 7].map((index) => Math.round(fileStart + ((fileEnd - fileStart) * index) / 7));
  const scanIndex = Math.min(7, Math.max(0, Math.floor(interpolate(frame, [fileStart, fileEnd], [0, 8], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }))));
  const mappingProgress = reveal(frame, segmentFrame('07', '07-06'), segmentFrame('07', '07-06') + 24);
  const architectureProgress = reveal(frame, segmentFrame('07', '07-07'), segmentFrame('07', '07-07') + 24);
  const nodeStarts = ['07-07', '07-08', '07-09', '07-10'].map((id) => segmentFrame('07', id));
  const insightStarts = ['07-08', '07-09', '07-10'].map((id) => segmentFrame('07', id));
  const scanComplete = reveal(frame, segmentFrame('07', '07-11'), segmentFrame('07', '07-11') + 18);
  const finalStart = segmentFrame('07', '07-12');
  const finalProgress = reveal(frame, finalStart, finalStart + 24);
  const finalScale = spring({
    fps,
    frame: clampFrame(frame, finalStart),
    config: {damping: 18, mass: 0.78, stiffness: 120},
  });
  const workspaceOpacity = interpolate(finalProgress, [0, 1], [1, 0.14]);
  const workspaceScale = interpolate(finalProgress, [0, 1], [1, 0.95]);

  const files = [
    {depth: 0, label: 'src/', detail: '42 files'},
    {depth: 1, label: 'api/', detail: 'routes'},
    {depth: 1, label: 'auth/', detail: 'core'},
    {depth: 1, label: 'components/', detail: 'UI'},
    {depth: 1, label: 'hooks/', detail: 'state'},
    {depth: 1, label: 'services/', detail: 'logic'},
    {depth: 1, label: 'utils/', detail: 'shared'},
    {depth: 1, label: 'tests/', detail: 'verify'},
  ];

  const nodes = [
    {label: 'UI', detail: 'components/'},
    {label: 'Auth', detail: 'auth/'},
    {label: 'Service', detail: 'services/'},
    {label: 'API', detail: 'api/'},
  ];

  const insights = [
    {label: '入口文件', value: 'src/main.tsx'},
    {label: '核心模块', value: 'auth/session.ts'},
    {label: '数据流', value: 'UI → Auth → API'},
  ];

  return (
    <SceneContainer>
      <div
        style={{
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
          height: '100%',
          paddingBottom: 62,
          position: 'relative',
        }}
      >
        <div style={{alignItems: 'center', display: 'flex', justifyContent: 'space-between'}}>
          <div>
            <div
              style={{
                color: colors.accent,
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: 2.4,
                marginBottom: 10,
                textTransform: 'uppercase',
              }}
            >
              Scene 07 · Codebase → Architecture
            </div>
            <div style={{fontSize: 52, fontWeight: 880, letterSpacing: -1.5}}>第一层能力：先把陌生项目看懂</div>
          </div>
          <StatusChip active={scanComplete > 0.5} tone="success">
            {scanComplete > 0.5 ? 'project mapped' : 'reading codebase'}
          </StatusChip>
        </div>

        <div
          style={{
            display: 'grid',
            flex: 1,
            gap: 22,
            gridTemplateColumns: '620px 92px minmax(0, 1fr)',
            minHeight: 0,
            opacity: workspaceOpacity,
            transform: `scale(${workspaceScale})`,
          }}
        >
          <MockWindow
            title="unknown-project / Explorer"
            style={{height: '100%', opacity: windowProgress, transform: `translateX(${(1 - windowProgress) * -28}px)`}}
            bodyStyle={{height: 'calc(100% - 74px)', padding: '16px 18px', position: 'relative'}}
          >
            <div
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(125, 211, 252, 0.34), transparent)',
                height: 46,
                left: 10,
                opacity: reveal(frame, segmentFrame('07', '07-02'), segmentFrame('07', '07-02') + 18),
                position: 'absolute',
                right: 10,
                top: 16 + scanIndex * 51,
                transition: 'none',
              }}
            />
            <div style={{display: 'flex', flexDirection: 'column', gap: 3, position: 'relative'}}>
              {files.map((file, index) => (
                <FileRow
                  key={file.label}
                  {...file}
                  progress={reveal(frame, fileStarts[index], fileStarts[index] + 14)}
                  scanning={scanIndex === index && frame < fileEnd}
                />
              ))}
            </div>
          </MockWindow>

          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              opacity: mappingProgress,
            }}
          >
            <div style={{color: colors.muted, fontSize: 14, fontWeight: 780, lineHeight: 1.35, textAlign: 'center'}}>scan<br />relations</div>
            <div
              style={{
                color: colors.accent,
                fontSize: 48,
                margin: '8px 0',
                textShadow: '0 0 24px rgba(125, 211, 252, 0.5)',
                transform: `translateX(${(1 - mappingProgress) * -24}px)`,
              }}
            >
              →
            </div>
            <div style={{color: colors.accent, fontSize: 14, fontWeight: 800, lineHeight: 1.35, textAlign: 'center'}}>build<br />map</div>
          </div>

          <VisualCard
            active
            style={{
              background: 'rgba(8, 14, 28, 0.95)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: 0,
              opacity: architectureProgress,
              padding: '24px 26px',
              transform: `translateX(${(1 - architectureProgress) * 30}px)`,
            }}
          >
            <div style={{alignItems: 'center', display: 'flex', justifyContent: 'space-between'}}>
              <div>
                <div style={{color: colors.accent, fontSize: 16, fontWeight: 800, letterSpacing: 1.5}}>ARCHITECTURE MAP</div>
                <div style={{fontSize: 30, fontWeight: 880, marginTop: 7}}>项目结构与调用关系</div>
              </div>
              <StatusChip active={scanComplete > 0.4} tone="success" style={{fontSize: 14, padding: '7px 10px'}}>
                {scanComplete > 0.4 ? 'ready' : 'mapping'}
              </StatusChip>
            </div>

            <div style={{alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginTop: 32}}>
              {nodes.map((node, index) => {
                const nodeProgress = reveal(frame, nodeStarts[index], nodeStarts[index] + 18);
                const lineProgress = reveal(frame, nodeStarts[index] + 12, nodeStarts[index] + 30);

                return (
                  <div key={node.label} style={{alignItems: 'center', display: 'flex', flex: index === nodes.length - 1 ? '0 0 auto' : 1}}>
                    <FlowNode {...node} progress={nodeProgress} />
                    {index < nodes.length - 1 ? (
                      <div
                        style={{
                          color: colors.accent,
                          flex: 1,
                          fontSize: 29,
                          opacity: lineProgress,
                          textAlign: 'center',
                          textShadow: '0 0 16px rgba(125, 211, 252, 0.42)',
                          transform: `scaleX(${lineProgress})`,
                        }}
                      >
                        →
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div style={{display: 'grid', gap: 12, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginTop: 'auto'}}>
              {insights.map((insight, index) => {
                const progress = reveal(frame, insightStarts[index], insightStarts[index] + 18);

                return (
                  <div
                    key={insight.label}
                    style={{
                      background: index === 1 ? 'rgba(167, 139, 250, 0.12)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${index === 1 ? 'rgba(167, 139, 250, 0.48)' : colors.line}`,
                      borderRadius: 14,
                      opacity: progress,
                      padding: '16px 15px',
                      transform: `translateY(${(1 - progress) * 12}px)`,
                    }}
                  >
                    <div style={{color: colors.muted, fontSize: 14, fontWeight: 760}}>{insight.label}</div>
                    <div style={{color: index === 1 ? '#c4b5fd' : colors.text, fontFamily: 'Menlo, Monaco, Consolas, monospace', fontSize: 16, fontWeight: 760, marginTop: 9}}>{insight.value}</div>
                  </div>
                );
              })}
            </div>
          </VisualCard>
        </div>

        <div
          style={{
            alignItems: 'center',
            background: 'rgba(7, 11, 23, 0.98)',
            border: '1px solid rgba(125, 211, 252, 0.55)',
            borderRadius: 24,
            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.52), 0 0 40px rgba(125, 211, 252, 0.13)',
            display: 'grid',
            gridTemplateColumns: '250px minmax(0, 1fr)',
            left: '50%',
            minHeight: 230,
            opacity: finalProgress,
            padding: '34px 54px',
            position: 'absolute',
            top: '55%',
            transform: `translate(-50%, -50%) scale(${0.92 + finalScale * 0.08})`,
            width: 1180,
            zIndex: 5,
          }}
        >
          <div style={{borderRight: `1px solid ${colors.line}`, paddingRight: 38, textAlign: 'center'}}>
            <div style={{color: colors.accent, fontSize: 18, fontWeight: 820, letterSpacing: 2}}>第一层能力</div>
            <div style={{fontSize: 46, fontWeight: 920, marginTop: 12}}>理解</div>
          </div>
          <div style={{paddingLeft: 48}}>
            <div style={{color: colors.muted, fontSize: 24, fontWeight: 720}}>面对陌生项目</div>
            <div style={{fontSize: 44, fontWeight: 920, marginTop: 12}}>不是先写，而是先真正看懂</div>
            <div style={{color: '#86efac', fontSize: 22, fontWeight: 760, marginTop: 12}}>复杂代码 → 结构理解</div>
          </div>
        </div>
      </div>
    </SceneContainer>
  );
};
