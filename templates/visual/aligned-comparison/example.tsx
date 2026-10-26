import {AlignedComparisonMotion,type AlignedComparisonData} from './index';
export const exampleData:AlignedComparisonData={
 names:['方案 A','方案 B','方案 C'],
 rows:['处理位置','连接方式','管理方式'],
 values:[['本地','离线','独立'],['云端','联网','统一'],['混合','按需','分层']],
};
export const AlignedComparisonExample=()=> <AlignedComparisonMotion data={exampleData}/>;
export const alignedComparisonExampleMetadata={id:'AlignedComparisonExample',width:1920,height:1080,fps:30,durationInFrames:240};
