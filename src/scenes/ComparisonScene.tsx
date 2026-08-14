import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {ComparisonColumn, ComparisonSceneConfig, VisualBeat} from '../lib/videoTypes';
import {Caption} from '../components/Caption';
import {getDistributedRevealFrames} from '../lib/timing';
import {colors, SceneContainer} from '../components/SceneContainer';
import {MiniFlow, MockWindow, StatusChip} from '../components/VisualPrimitives';

type ComparisonSceneProps = {
  scene: ComparisonSceneConfig;
};

type RevealTiming = {
  startFrame: number;
  endFrame: number;
};

const getFallbackSteps = (column: ComparisonColumn): VisualBeat[] => {
  return column.items.map((item) => ({title: item}));
};

const getColumns = (scene: ComparisonSceneConfig): ComparisonColumn[] => {
  if (Array.isArray(scene.columns)) {
    return scene.columns;
  }

  return [scene.left, scene.right].filter((column): column is ComparisonColumn => Boolean(column));
};

const getHighlightIndex = (scene: ComparisonSceneConfig) => {
  if (Array.isArray(scene.columns)) {
    return scene.highlightIndex ?? scene.columns.length - 1;
  }

  return scene.highlight === 'left' ? 0 : 1;
};

const getColumnTiming = (columnIndex: number, columnCount: number, durationSeconds: number) => {
  if (columnCount === 2) {
    return {
      leadInSeconds: columnIndex === 0 ? durationSeconds * 0.2 : durationSeconds * 0.58,
      leadOutSeconds: columnIndex === 0 ? durationSeconds * 0.48 : 2.5,
    };
  }

  return {
    leadInSeconds: durationSeconds * (0.18 + columnIndex * 0.17),
    leadOutSeconds: Math.max(2.4, durationSeconds * (0.42 - columnIndex * 0.08)),
  };
};

const WorkflowSketch = ({
  steps,
  active,
  compact,
  workflowTitle,
  workflowStatus,
}: {
  steps: VisualBeat[];
  active: boolean;
  compact: boolean;
  workflowTitle: string;
  workflowStatus: string;
}) => {
  const activeIndex = Math.min(steps.length - 1, active ? 3 : 2);

  return (
    <MockWindow title={workflowTitle} bodyStyle={{padding: compact ? 14 : 18}}>
      <div style={{display: 'grid', gap: compact ? 10 : 14, gridTemplateColumns: '1fr'}}>
        {(compact ? steps : steps.slice(0, 4)).map((step, index) => {
          const isActive = active && index <= activeIndex;

          return (
            <div
              key={`${step.title}-${index}`}
              style={{
                alignItems: 'center',
                background: isActive ? 'rgba(125, 211, 252, 0.12)' : 'rgba(255,255,255,0.055)',
                border: `1px solid ${isActive ? colors.accent : colors.line}`,
                borderRadius: compact ? 14 : 18,
                color: isActive ? colors.text : colors.muted,
                display: 'flex',
                fontSize: compact ? 15 : 18,
                fontWeight: 760,
                gap: compact ? 8 : 10,
                minHeight: compact ? 45 : 56,
                padding: compact ? '9px 10px' : '12px 14px',
              }}
            >
              <span style={{color: isActive ? colors.accent : colors.muted}}>→</span>
              {step.title}
            </div>
          );
        })}
      </div>
      <div style={{marginTop: compact ? 12 : 16}}>
        <StatusChip active={active} tone="accent">
          {workflowStatus}
        </StatusChip>
      </div>
    </MockWindow>
  );
};

const Column = ({
  column,
  active,
  compact,
  revealTiming,
  itemRevealFrames,
}: {
  column: ComparisonColumn;
  active: boolean;
  compact: boolean;
  revealTiming: RevealTiming;
  itemRevealFrames: RevealTiming[];
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [revealTiming.startFrame, revealTiming.endFrame], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const steps = column.visualSteps ?? getFallbackSteps(column);
  const activeIndex = itemRevealFrames.reduce((latest, timing, index) => frame >= timing.startFrame ? index : latest, 0);

  return (
    <div
      style={{
        background: active ? colors.cardStrong : colors.card,
        border: `1px solid ${active ? colors.accent : colors.line}`,
        borderRadius: compact ? 26 : 34,
        boxShadow: active ? '0 0 52px rgba(125, 211, 252, 0.2)' : 'none',
        flex: 1,
        opacity,
        padding: compact ? '22px 18px' : '30px 26px',
        transform: `translateY(${(1 - opacity) * 26}px)`,
      }}
    >
      <div
        style={{
          color: active ? colors.accent : colors.muted,
          fontSize: compact ? 25 : 34,
          fontWeight: 850,
          marginBottom: compact ? 16 : 22,
        }}
      >
        {column.title}
      </div>
      <WorkflowSketch
        steps={steps}
        active={active}
        compact={compact}
        workflowTitle={column.workflowTitle ?? column.title}
        workflowStatus={column.workflowStatus ?? '当前任务路径'}
      />
      <div style={{marginTop: compact ? 18 : 24}}>
        <MiniFlow items={steps} activeIndex={activeIndex} compact />
      </div>
    </div>
  );
};

export const ComparisonScene = ({scene}: ComparisonSceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const columns = getColumns(scene);
  const highlightIndex = getHighlightIndex(scene);
  const compact = columns.length > 2;
  const columnRevealFrames = getDistributedRevealFrames({
    count: columns.length,
    durationSeconds: scene.durationSeconds,
    fps,
    leadInSeconds: Math.max(1.2, scene.durationSeconds * 0.1),
    leadOutSeconds: scene.durationSeconds * (compact ? 0.5 : 0.62),
    revealSeconds: 0.6,
    startSeconds: scene.visualRevealSeconds,
  });
  const itemRevealFrames = columns.map((column, index) => {
    const timing = getColumnTiming(index, columns.length, scene.durationSeconds);

    return getDistributedRevealFrames({
      count: column.items.length,
      durationSeconds: scene.durationSeconds,
      fps,
      leadInSeconds: timing.leadInSeconds,
      leadOutSeconds: timing.leadOutSeconds,
      revealSeconds: 0.5,
    });
  });

  return (
    <>
      <SceneContainer>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: compact ? 52 : 58,
              fontWeight: 840,
              letterSpacing: -2,
              lineHeight: 1.14,
              marginBottom: compact ? 34 : 44,
              opacity: interpolate(frame, [0, 18], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            {scene.headline}
          </div>
          <div style={{display: 'flex', gap: compact ? 16 : 24}}>
            {columns.map((column, index) => (
              <Column
                key={column.title}
                column={column}
                active={index === highlightIndex}
                compact={compact}
                revealTiming={columnRevealFrames[index]}
                itemRevealFrames={itemRevealFrames[index]}
              />
            ))}
          </div>
        </div>
      </SceneContainer>
      {scene.showCaption !== false ? <Caption lines={scene.caption} durationSeconds={scene.durationSeconds} /> : null}
    </>
  );
};
