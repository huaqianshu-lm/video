import {DocumentKeyPointsMotion,type DocumentContent} from './index';

export const exampleContent:DocumentContent={
  name:'发布前检查',description:'确认范围、预览与恢复准备',footer:'CHECKLIST',page:'01',
  items:[
    {label:'影响',source:'列出本次改动涉及的页面和功能',title:'明确影响范围',detail:'页面与功能一起核对'},
    {label:'预览',source:'核对主要页面、文字与图片显示',title:'先看实际页面',detail:'检查文字、图片和布局'},
    {label:'恢复',source:'保存上一版及恢复步骤',title:'保留恢复路径',detail:'上一版与恢复步骤一并保存'},
  ],
};
export const DocumentKeyPointsExample=()=> <DocumentKeyPointsMotion content={exampleContent}/>;
export const documentKeyPointsExampleMetadata={id:'DocumentKeyPointsExample',width:1920,height:1080,fps:30,durationInFrames:324};
