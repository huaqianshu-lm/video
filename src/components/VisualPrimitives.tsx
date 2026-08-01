import type {CSSProperties, ReactNode} from 'react';
import type {VisualBeat, VisualTone} from '../lib/videoTypes';
import {colors} from './SceneContainer';

const toneColors: Record<VisualTone, string> = {
  muted: colors.muted,
  accent: colors.accent,
  success: '#86efac',
  warning: '#fbbf24',
};

export const getToneColor = (tone: VisualTone = 'accent') => {
  return toneColors[tone];
};

type VisualCardProps = {
  children: ReactNode;
  active?: boolean;
  style?: CSSProperties;
};

export const VisualCard = ({children, active = false, style}: VisualCardProps) => {
  return (
    <div
      style={{
        background: active ? colors.cardStrong : colors.card,
        border: `1px solid ${active ? colors.accent : colors.line}`,
        borderRadius: 28,
        boxShadow: active ? '0 0 42px rgba(125, 211, 252, 0.18)' : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

type StatusChipProps = {
  children: ReactNode;
  tone?: VisualTone;
  active?: boolean;
  style?: CSSProperties;
};

export const StatusChip = ({children, tone = 'accent', active = false, style}: StatusChipProps) => {
  const color = getToneColor(tone);

  return (
    <span
      style={{
        background: active ? `${color}26` : 'rgba(255,255,255,0.08)',
        border: `1px solid ${active ? color : colors.line}`,
        borderRadius: 999,
        color: active ? color : colors.muted,
        display: 'inline-flex',
        fontSize: 22,
        fontWeight: 760,
        letterSpacing: 0.4,
        padding: '10px 14px',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  );
};

type MockWindowProps = {
  title: string;
  children: ReactNode;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
};

export const MockWindow = ({title, children, style, bodyStyle}: MockWindowProps) => {
  return (
    <div
      style={{
        background: 'rgba(2, 6, 23, 0.82)',
        border: `1px solid ${colors.line}`,
        borderRadius: 28,
        boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          alignItems: 'center',
          background: 'rgba(255,255,255,0.06)',
          borderBottom: `1px solid ${colors.line}`,
          display: 'flex',
          gap: 10,
          padding: '18px 22px',
        }}
      >
        {['#ef4444', '#f59e0b', '#22c55e'].map((dot) => (
          <span
            key={dot}
            style={{
              background: dot,
              borderRadius: 999,
              display: 'block',
              height: 13,
              width: 13,
            }}
          />
        ))}
        <span
          style={{
            color: colors.muted,
            fontSize: 21,
            fontWeight: 700,
            marginLeft: 10,
          }}
        >
          {title}
        </span>
      </div>
      <div style={{padding: 24, ...bodyStyle}}>{children}</div>
    </div>
  );
};

type CodeLineProps = {
  children: ReactNode;
  active?: boolean;
  diff?: 'add' | 'remove';
};

export const CodeLine = ({children, active = false, diff}: CodeLineProps) => {
  const diffColor = diff === 'add' ? '#86efac' : diff === 'remove' ? '#fca5a5' : colors.muted;

  return (
    <div
      style={{
        background: active ? 'rgba(125, 211, 252, 0.14)' : 'transparent',
        borderRadius: 10,
        color: active ? colors.text : diffColor,
        fontFamily: 'Menlo, Monaco, Consolas, monospace',
        fontSize: 22,
        fontWeight: active ? 760 : 520,
        lineHeight: 1.55,
        padding: '4px 10px',
        whiteSpace: 'nowrap',
      }}
    >
      {diff ? (diff === 'add' ? '+ ' : '- ') : '  '}
      {children}
    </div>
  );
};

type MiniFlowProps = {
  items: VisualBeat[];
  activeIndex: number;
  compact?: boolean;
};

export const MiniFlow = ({items, activeIndex, compact = false}: MiniFlowProps) => {
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: compact ? 10 : 14}}>
      {items.map((item, index) => {
        const isActive = index <= activeIndex;
        const color = getToneColor(isActive ? item.tone ?? 'accent' : 'muted');

        return (
          <div key={`${item.title}-${index}`} style={{alignItems: 'center', display: 'flex', gap: 12}}>
            <div
              style={{
                alignItems: 'center',
                background: isActive ? `${color}24` : 'rgba(255,255,255,0.08)',
                border: `1px solid ${isActive ? color : colors.line}`,
                borderRadius: 999,
                color,
                display: 'flex',
                flexShrink: 0,
                fontSize: compact ? 18 : 21,
                fontWeight: 850,
                height: compact ? 34 : 42,
                justifyContent: 'center',
                width: compact ? 34 : 42,
              }}
            >
              {index + 1}
            </div>
            <div style={{minWidth: 0}}>
              <div
                style={{
                  color: isActive ? colors.text : colors.muted,
                  fontSize: compact ? 21 : 25,
                  fontWeight: 780,
                }}
              >
                {item.title}
              </div>
              {item.description ? (
                <div
                  style={{
                    color: colors.muted,
                    fontSize: compact ? 17 : 20,
                    lineHeight: 1.35,
                    marginTop: 3,
                  }}
                >
                  {item.description}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
