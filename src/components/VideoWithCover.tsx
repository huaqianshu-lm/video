import type {ComponentType} from 'react';
import {Sequence} from 'remotion';
import {SeriesCover} from './SeriesCover';

export type VideoCover = {src: string; durationInFrames: number};

// Shift the entire content together, including its audio and subtitles.
export const VideoWithCover = ({content: Content, cover}: {content: ComponentType; cover: VideoCover}) => (
  <>
    <Sequence durationInFrames={cover.durationInFrames}>
      <SeriesCover src={cover.src} />
    </Sequence>
    <Sequence from={cover.durationInFrames}>
      <Content />
    </Sequence>
  </>
);

export const createVideoWithCover = <TCover extends VideoCover,>(content: ComponentType, cover: TCover, config: unknown) => {
  if ((config as {series?: {coverSrc?: string}}).series?.coverSrc) {
    throw new Error('封面已由统一入口添加，正文配置不能重复声明 coverSrc');
  }
  return () => <VideoWithCover content={content} cover={cover} />;
};
