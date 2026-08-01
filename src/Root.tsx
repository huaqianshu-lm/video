import {Composition} from 'remotion';
import {getTotalDurationFrames} from './lib/timing';
import {ClaudeCodeWhatIsVideo} from './videos/claude-code-what-is/ClaudeCodeWhatIsVideo';
import {ClaudeCodeWhatIsVideo14} from './videos/claude-code-what-is/ClaudeCodeWhatIsVideo14';
import {videoConfig} from './videos/claude-code-what-is/video.config';
import {getVideo14TotalDurationFrames, video14Config} from './videos/claude-code-what-is/video14.config';

export const Root = () => {
  return (
    <>
      <Composition
        id={`${videoConfig.slug}-legacy`}
        component={ClaudeCodeWhatIsVideo}
        durationInFrames={getTotalDurationFrames(videoConfig)}
        fps={videoConfig.fps}
        width={videoConfig.width}
        height={videoConfig.height}
      />
      <Composition
        id={video14Config.slug}
        component={ClaudeCodeWhatIsVideo14}
        durationInFrames={getVideo14TotalDurationFrames()}
        fps={video14Config.fps}
        width={video14Config.width}
        height={video14Config.height}
      />
    </>
  );
};
