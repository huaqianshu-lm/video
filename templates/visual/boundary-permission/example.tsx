import {BoundaryPermissionMotion, type MotionContent, type Phase} from './index';
// An explicitly disabled action never enters. These examples are silent, neutral demos.
const off=Number.POSITIVE_INFINITY;
const requestEvents:Record<Phase,number>={write:30,network:65,enforce:100,approval:135,claim:215,closed:275,reassure:off,noPrompt:off,return:off,damage:off,final:off};
const requestContent:MotionContent={scopeLabel:'操作区域',permissionLabel:'许可',pendingLabel:'等待',claimLabel:'请求说明',summaries:{write:'区域内操作',network:'请求到达边界',enforce:'范围限制',approval:'申请许可',claim:'说明不等于许可',closed:'通路保持关闭'}};
export const BoundaryRequestExample=()=> <BoundaryPermissionMotion events={requestEvents} content={requestContent}/>;
export const boundaryRequestExampleMetadata={id:'BoundaryRequestExample',width:1920,height:1080,fps:30,durationInFrames:315};
// Independent in-scope effect: it does not require playing the request mechanism first.
const effectEvents:Record<Phase,number>={write:30,network:off,enforce:off,approval:off,claim:off,closed:off,reassure:off,noPrompt:off,return:off,damage:90,final:135};
const effectContent:MotionContent={scopeLabel:'操作区域',permissionLabel:'',pendingLabel:'',claimLabel:'',showPermission:false,summaries:{write:'区域内操作',damage:'对象状态改变',final:'范围与操作后果分别判断'}};
export const WithinScopeEffectExample=()=> <BoundaryPermissionMotion events={effectEvents} content={effectContent}/>;
export const withinScopeEffectExampleMetadata={id:'WithinScopeEffectExample',width:1920,height:1080,fps:30,durationInFrames:180};
