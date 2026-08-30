import {AbsoluteFill, Img, staticFile} from 'remotion';

export const SeriesCover = ({src}: {src: string}) => {
  return (
    <AbsoluteFill style={{backgroundColor: '#050912'}}>
      <Img
        src={staticFile(src)}
        style={{height: '100%', objectFit: 'cover', width: '100%'}}
      />
    </AbsoluteFill>
  );
};
