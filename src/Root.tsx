import {Composition} from 'remotion';
import {getTotalDurationFrames} from './lib/timing';
import {ClaudeCodeWhatIsVideo} from './videos/claude-code-what-is/ClaudeCodeWhatIsVideo';
import {videoConfig} from './videos/claude-code-what-is/video.config';

export const Root = () => {
  return (
    <Composition
      id={videoConfig.slug}
      component={ClaudeCodeWhatIsVideo}
      durationInFrames={getTotalDurationFrames(videoConfig)}
      fps={videoConfig.fps}
      width={videoConfig.width}
      height={videoConfig.height}
    />
  );
};
