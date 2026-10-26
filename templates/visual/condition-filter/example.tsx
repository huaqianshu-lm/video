import {ConditionFilterMotion,type FilterLabels} from './index';
export const exampleLabels:FilterLabels={input:'输入',before:'全部通过',after:'仅圆形',passed:'通过',blocked:'拦截'};
export const ConditionFilterExample=()=> <ConditionFilterMotion labels={exampleLabels}/>;
export const conditionFilterExampleMetadata={id:'ConditionFilterExample',width:1920,height:1080,fps:30,durationInFrames:252};
