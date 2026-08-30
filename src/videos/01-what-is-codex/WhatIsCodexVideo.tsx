import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {SeriesCover} from '../../components/SeriesCover';
import {getContentStartFrame, getSceneStartFrame, secondsToFrames} from '../../lib/timing';
import type {SubtitleCue} from '../../lib/videoTypes';
import {CodexPrototypeScene} from './CodexPrototypeScene';
import {videoConfig} from './video.config';

const PrototypeCaption = ({cues}: {cues: SubtitleCue[]}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cue = cues.find((item) => frame >= Math.floor(item.startSeconds * fps) && frame < Math.ceil(item.endSeconds * fps));

  if (!cue) return null;

  const cueFrame = frame - Math.floor(cue.startSeconds * fps);
  const opacity = interpolate(cueFrame, [0, 9], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{alignItems: 'center', display: 'flex', justifyContent: 'flex-end', pointerEvents: 'none', zIndex: 1000}}>
      <div
        style={{
          alignItems: 'center',
          background: 'rgba(2, 7, 11, .82)',
          border: '1px solid rgba(255,255,255,.11)',
          borderRadius: 12,
          color: '#fff',
          display: 'flex',
          fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
          fontSize: 31,
          justifyContent: 'center',
          lineHeight: 1.4,
          marginBottom: 45,
          minHeight: 76,
          opacity,
          padding: '12px 28px',
          textAlign: 'center',
          width: '84%',
        }}
      >
        {cue.text}
      </div>
    </AbsoluteFill>
  );
};

export const WhatIsCodexVideo = () => {
  const contentStartFrame = getContentStartFrame(videoConfig);

  return (
    <>
      {videoConfig.series?.coverSrc ? (
        <Sequence from={0} durationInFrames={contentStartFrame} name={`Series Cover · ${videoConfig.series.id}`}>
          <SeriesCover src={videoConfig.series.coverSrc} />
        </Sequence>
      ) : null}
      {videoConfig.audioTracks?.map((track) => (
        <Sequence
          key={track.id ?? track.src}
          from={contentStartFrame + secondsToFrames(track.startSeconds ?? 0, videoConfig.fps)}
          durationInFrames={Math.max(1, Math.ceil(track.durationSeconds * videoConfig.fps))}
          name={`Audio ${track.id ?? track.src}`}
          premountFor={videoConfig.fps * 2}
        >
          <Audio pauseWhenBuffering src={staticFile(track.src)} />
        </Sequence>
      )) ?? null}
      {videoConfig.scenes.map((scene, index) => {
        const from = contentStartFrame + getSceneStartFrame(videoConfig.scenes, index, videoConfig.fps);
        const durationInFrames = secondsToFrames(scene.durationSeconds, videoConfig.fps);

        return (
          <Sequence key={scene.id} from={from} durationInFrames={durationInFrames} name={scene.id}>
            <CodexPrototypeScene scene={scene} />
          </Sequence>
        );
      })}
      {videoConfig.subtitleCues ? (
        <Sequence from={contentStartFrame} name="Subtitles">
          <PrototypeCaption cues={videoConfig.subtitleCues} />
        </Sequence>
      ) : null}
    </>
  );
};
