import {SourcesToBriefMotion,type SourcesContent} from './index';

export const exampleContent:SourcesContent={
  resultName:'制作简报',
  items:[
    {name:'目标',body:'确定要解决的问题'},
    {name:'材料',body:'整理可用的信息'},
    {name:'限制',body:'明确时间与范围'},
  ],
};
export const SourcesToBriefExample=()=> <SourcesToBriefMotion content={exampleContent}/>;
export const sourcesToBriefExampleMetadata={id:'SourcesToBriefExample',width:1920,height:1080,fps:30,durationInFrames:222};
