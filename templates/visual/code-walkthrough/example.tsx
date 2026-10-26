import {CodeWalkthroughMotion,type CodeContent} from './index';

export const exampleContent:CodeContent={
 fileName:'title-utils.js',
 focusLines:[1,2,3],
 lines:[
 [['keyword','const '],['name','cleanTitle'],['plain',' = (text) => {']],
 [['plain','  '],['keyword','const '],['plain','trimmed = text.'],['name','trim'],['plain','();']],
 [['plain','  '],['keyword','const '],['plain','compact = trimmed.'],['name','replace'],['plain','('],['string','/\\s+/g, " "'],['plain',');']],
 [['plain','  '],['keyword','return '],['plain','compact.'],['name','slice'],['plain','('],['number','0, 24'],['plain',');']],
 [['plain','};']]
]
};
export const CodeWalkthroughExample=()=> <CodeWalkthroughMotion content={exampleContent}/>;
export const codeWalkthroughExampleMetadata={id:'CodeWalkthroughExample',width:1920,height:1080,fps:30,durationInFrames:198};
