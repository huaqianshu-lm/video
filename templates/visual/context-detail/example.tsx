import {ContextDetailMotion,type ContextDetailData} from './index';
export const exampleData:ContextDetailData={
 input:'输入',process:'整理',output:'输出',description:'按顺序组织内容',items:['C','A','B'],
};
export const ContextDetailExample=()=> <ContextDetailMotion data={exampleData}/>;
export const contextDetailExampleMetadata={id:'ContextDetailExample',width:1920,height:1080,fps:30,durationInFrames:240};
