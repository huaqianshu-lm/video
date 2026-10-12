import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createFixture} from './helpers/production-fixture.mjs';
import {loadProject, writeJson} from '../src/storage.mjs';
import {main} from '../src/cli.mjs';
import {runRenderDelivery} from '../src/render-delivery.mjs';
import {resolveRenderBackend} from '../src/render-backend.mjs';
import {extractLocalAssets, localRenderEnvironment, reconcileLocalJob, refreshLocalRenderJobs} from '../src/local-render.mjs';
import {createJobRecord, getJob, listJobs, updateJob} from '../src/jobs.mjs';
import {acquireProductionTask, activeProductionTask, releaseProductionTask} from '../src/production-lock.mjs';
import {approveGate, validateStage, beginExecutorStage, completeAdapterStage, rejectGate} from '../src/runner.mjs';
import {createBatch, runBatch, getBatch} from '../src/batches.mjs';
import {createRemoteJobMonitor} from '../src/remote-jobs.mjs';
import {prepareBatchRenderDelivery} from '../src/batch-delivery.mjs';
import {createWebServer} from '../src/server.mjs';

const repository = path.resolve(new URL('../..', import.meta.url).pathname);
function fixture(t, overrides = {}) {
  const previous = {...process.env};
  const f = createFixture();
  const workspace = process.env.HARNESS_WORKSPACE_ROOT;
  const slug = f.slug;
  process.env.HARNESS_BATCHES_DIR = path.join(workspace, 'local/test-batches');
  const write = (relative, value, executable = false) => {
    const file = path.join(workspace, relative);
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, value);
    if (executable) fs.chmodSync(file, 0o755);
    return file;
  };
  fs.cpSync(path.join(repository, 'harness/src'), path.join(workspace, 'harness/src'), {recursive: true});
  for (const directory of ['templates', 'styles', 'docs']) fs.cpSync(path.join(repository, directory), path.join(workspace, directory), {recursive: true});
  write('package.json', '{"type":"module"}');
  const binary = source => `#!${process.execPath}\n${source}\n`;
  const ffmpeg = write('bin/ffmpeg', `#!/bin/sh
if [ "$1" = '-version' ]; then major=$TEST_FFMPEG_MAJOR; [ -n "$major" ] || major=9; printf 'ffmpeg version %s.0.2\\n' "$major"; exit 0; fi
case "$2" in
  -encoders) [ -n "$TEST_NO_AAC" ] && echo libx264 || echo 'libx264 aac' ;;
  -filters) echo amix ;;
  -h) echo normalize ;;
  *) [ -z "$TEST_DECODE_FAIL" ] ;;
esac
`, true);
  const ffprobe = write('bin/ffprobe', `#!/bin/sh
if [ "$1" = '-version' ]; then echo ffprobe9; exit 0; fi
width=1920; frames=30; codec=aac; duration=1
[ -z "$TEST_BAD_WIDTH" ] || width=1280
[ -z "$TEST_BAD_FRAMES" ] || frames=31
[ -z "$TEST_BAD_CODEC" ] || codec=mp3
[ -z "$TEST_BAD_AUDIO" ] || duration=NaN
[ -z "$TEST_BAD_DURATION" ] || duration=2
printf '{"streams":[{"codec_type":"video","codec_name":"h264","width":%s,"height":1080,"r_frame_rate":"30/1","nb_frames":"%s"},{"codec_type":"audio","codec_name":"%s","duration":"%s"}]}\\n' "$width" "$frames" "$codec" "$duration"
`, true);
  const browser = write('bin/browser', binary('process.exit(0)'), true);
  const compositor = write('bin/compositor', binary('process.exit(0)'), true);
  write('node_modules/@remotion/renderer/package.json', '{"version":"4.0.496","main":"dist/index.js"}');
  write('node_modules/@remotion/renderer/dist/compositor/get-executable-path.js', `exports.getExecutableDir = () => ${JSON.stringify(path.dirname(compositor))};`);
  fs.copyFileSync(compositor, path.join(workspace, 'bin/remotion'));
  write('node_modules/@remotion/renderer/dist/browser/BrowserFetcher.js', `exports.TESTED_VERSION='test';exports.readVersionFile=()=> 'test';exports.getRevisionInfo=()=>({local:true,executablePath:${JSON.stringify(browser)}});`);
  write('node_modules/@remotion/renderer/dist/index.js', `const fs=require('node:fs');exports.openBrowser=async()=>({close:async()=>{}});exports.selectComposition=async()=>({id:'fixture-video',width:1920,height:1080,fps:30,durationInFrames:30});exports.renderMedia=async options=>{await new Promise(r=>setTimeout(r,Number(process.env.TEST_RENDER_DELAY||20)));if(process.env.TEST_RENDER_FAIL)throw new Error('synthetic render failure');fs.writeFileSync(options.outputLocation,process.env.TEST_EMPTY_OUTPUT?'':'synthetic video');options.onProgress({renderedFrames:30,encodedFrames:30,progress:1});};`);
  write('node_modules/@remotion/bundler/index.js', 'exports.bundle=async()=> "synthetic://bundle";');
  // The worker loads real shared path validation; only browser/encoding are synthetic.
  fs.symlinkSync(path.join(repository, 'node_modules/@remotion/paths'), path.join(workspace, 'node_modules/@remotion/paths'), 'dir');
  fs.mkdirSync(path.join(workspace, 'assets'));
  execFileSync('zip', ['-q', '-r', path.join(workspace, 'assets', `${slug}-assets.zip`), slug], {cwd: path.join(workspace, 'public/local-assets')});
  const project = loadProject(slug, {refresh: false});
  for (const stage of Object.values(project.state.stages)) stage.status = 'succeeded';
  for (const gate of ['gate-2','gate-3']) project.state.stages[gate].review = {decision:'approved',reviewedAt:new Date().toISOString()};
  project.state.currentStage = 'render'; project.state.stages.render.status = 'ready'; project.state.stages['gate-4'].status = 'pending';
  writeJson(project.files.state, project.state);
  const environment = {...process.env, HARNESS_LOCAL_FFMPEG: ffmpeg, HARNESS_LOCAL_FFPROBE: ffprobe, HARNESS_LOCAL_BROWSER: browser, ...overrides};
  for (const key of ['GITHUB_TOKEN', 'GH_TOKEN', 'GITHUB_REPOSITORY', 'HARNESS_RENDER_INPUT_TOKEN']) delete environment[key];
  let remoteCalls = 0;
  const forbidden = () => {remoteCalls++; throw new Error('local must not invoke remote delivery');};
  const dependencies = {environment, checkPreparation: forbidden, publishInput: forbidden, bindInput: forbidden, commitDelivery: forbidden, monitor: {submit: forbidden}};
  const delivery = (action, options = {}) => runRenderDelivery(action, slug, options, dependencies);
  const wait = async id => {
    for (let n = 0; n < 150; n++) {
      const job = await reconcileLocalJob(getJob(slug, id));
      if (['succeeded', 'failed'].includes(job.status)) {
        // A result can be durable before the worker exits. Wait for our test
        // process to exit before exercising the explicit retry contract.
        for (let n = 0; n < 100 && job.local.pid; n++) {
          try { process.kill(job.local.pid, 0); } catch (error) { if (error.code === 'ESRCH') break; throw error; }
          await new Promise(r => setTimeout(r, 20));
        }
        return job;
      }
      await new Promise(r => setTimeout(r, 40));
    }
    throw new Error(`worker timed out: ${fs.readFileSync(getJob(slug,id).local.logPath,'utf8')}`);
  };
  t.after(() => {
    // Only stop test-owned synthetic workers, never a production process.
    for (const job of listJobs(slug)) if (job.local?.pid && ['queued','running'].includes(job.status)) {try {process.kill(job.local.pid, 'SIGTERM');} catch {}}
    for (const key of Object.keys(process.env)) if (!(key in previous)) delete process.env[key];
    Object.assign(process.env, previous);
  });
  return {slug, workspace, project, write, environment, dependencies, delivery, wait, remoteCalls: () => remoteCalls};
}

test('backend defaults, explicit selections, historical sessions and batch restrictions', () => {
  assert.equal(resolveRenderBackend(), 'local');
  assert.equal(resolveRenderBackend({backend:'github'}), 'github');
  assert.equal(resolveRenderBackend({session:{}}), 'github');
  assert.equal(resolveRenderBackend({session:{backend:'local'}}), 'local');
  assert.equal(resolveRenderBackend({remoteOptions:true}), 'github');
  assert.throws(()=>resolveRenderBackend({session:{backend:'invalid'}}),{code:'render-backend-invalid'});
  assert.equal(resolveRenderBackend({batchId:'batch'}), 'github');
  assert.throws(()=>resolveRenderBackend({backend:'local',batchId:'batch'}), {code:'batch-local-render-disabled'});
  for (const backend of ['invalid',null,{},true]) assert.throws(()=>resolveRenderBackend({backend}), {code:'render-backend-invalid'});
});

test('local prepare uses no credentials or remote writes; missing confirmation and stale code block start', async t => {
  const f = fixture(t);
  const plan = await f.delivery('prepare');
  assert.equal(plan.output, `out/local-render/${f.slug}/<jobId>/${f.slug}.mp4`);
  assert.equal(plan.backend, 'local'); assert.deepEqual(plan.files, []);
  await assert.rejects(()=>f.delivery('start'), {code:'render-delivery-confirmation-required'});
  await assert.rejects(()=>f.delivery('start',{backend:'github',confirmPlan:plan.planId}), {code:'render-backend-changed'});
  f.write('src/lib/change.ts','export const changed=true;');
  await assert.rejects(()=>f.delivery('start',{confirmPlan:plan.planId}), {code:'render-delivery-plan-stale'});
  assert.equal(listJobs(f.slug).length,0); assert.equal(f.remoteCalls(),0);
  assert.equal(fs.existsSync(path.join(f.workspace,'local/render-method.json')), false);
});

test('missing binaries, unsupported FFmpeg and missing encoder fail before creating a Job', async t => {
  const f = fixture(t);
  assert.throws(()=>localRenderEnvironment(f.workspace,{...f.environment,HARNESS_LOCAL_FFMPEG:'/missing/ffmpeg'}), {code:'local-render-binary-missing'});
  // Executable output is controlled by its own environment, not the parent test environment.
  process.env.TEST_FFMPEG_MAJOR='4';
  assert.throws(()=>localRenderEnvironment(f.workspace,f.environment), {code:'local-render-ffmpeg-unsupported'});
  delete process.env.TEST_FFMPEG_MAJOR; process.env.TEST_NO_AAC='1';
  assert.throws(()=>localRenderEnvironment(f.workspace,f.environment), {code:'local-render-codecs-missing'});
  assert.equal(listJobs(f.slug).length,0);
});

test('local asset extraction handles a bundled duplicate without waiting for unzip input', t => {
  const f=fixture(t);
  const sourceRoot=path.join(f.workspace,'asset-source');
  const archive=path.join(f.workspace,'assets','duplicate-assets.zip');
  const destination=path.join(f.workspace,'worker','public','local-assets');
  f.write('asset-source/fixture-video/cover/cover.png','asset archive copy');
  fs.mkdirSync(path.dirname(archive),{recursive:true});
  execFileSync('zip',['-q','-r',archive,'fixture-video'],{cwd:sourceRoot});
  f.write('worker/public/local-assets/fixture-video/cover/cover.png','frozen package copy');
  extractLocalAssets(archive,destination);
  assert.equal(fs.readFileSync(path.join(destination,'fixture-video/cover/cover.png'),'utf8'),'asset archive copy');
});

test('actual CLI starts a frozen synthetic worker once; resume finishes at human Gate 4', async t => {
  const f = fixture(t,{TEST_RENDER_DELAY:'300'});
  const plan = await f.delivery('prepare');
  const messages=[]; const original=console.log; console.log=v=>messages.push(v);
  try {assert.equal(await main(['render-delivery','start',f.slug,'--confirm-plan',plan.planId],{deliveryDependencies:f.dependencies}),0);} finally {console.log=original;}
  const started=JSON.parse(messages.at(-1));
  assert.equal(started.output, path.join(f.workspace, 'out/local-render', f.slug, started.job.id, `${f.slug}.mp4`));
  const repeated=await f.delivery('start',{confirmPlan:plan.planId});
  assert.equal(repeated.job.id,started.job.id); assert.equal(listJobs(f.slug).length,1);
  const job=await f.wait(started.job.id);
  assert.equal(job.status,'succeeded',JSON.stringify(job.error));
  assert.equal(job.local.output, started.output);
  assert.ok(fs.statSync(job.local.output).size > 0);
  const current=loadProject(f.slug,{refresh:false});
  assert.equal(current.state.currentStage,'gate-4'); assert.equal(current.state.stages['gate-4'].status,'waiting'); assert.equal(current.state.stages['gate-4'].review,null);
  assert.equal(activeProductionTask(current),null); assert.equal(f.remoteCalls(),0);
  assert.equal((await f.delivery('resume')).job.id,job.id);
  fs.appendFileSync(job.local.output,'tampered');
  assert.ok(validateStage(loadProject(f.slug,{refresh:false}),'gate-4').some(i=>i.code==='local-render-output-invalid'));
  assert.throws(()=>approveGate(loadProject(f.slug,{refresh:false}),'gate-4'));
});

for (const [flag,code] of [['TEST_RENDER_FAIL','local-render-failed'],['TEST_DECODE_FAIL','local-render-decode-failed'],['TEST_BAD_AUDIO','local-render-output-invalid'],['TEST_BAD_FRAMES','local-render-output-invalid'],['TEST_BAD_WIDTH','local-render-output-invalid'],['TEST_BAD_CODEC','local-render-output-invalid'],['TEST_BAD_DURATION','local-render-output-invalid'],['TEST_EMPTY_OUTPUT','local-render-output-empty']]) {
  test(`${flag}: invalid output stays failed at render and requires explicit retry`, async t => {
    const f=fixture(t,{[flag]:'1'}); const plan=await f.delivery('prepare');
    const started=await f.delivery('start',{confirmPlan:plan.planId}); const job=await f.wait(started.job.id);
    assert.equal(job.status,'failed'); assert.equal(job.error.code,code);
    assert.equal(loadProject(f.slug,{refresh:false}).state.currentStage,'render');
    assert.equal(activeProductionTask(loadProject(f.slug,{refresh:false})),null);
    await assert.rejects(()=>f.delivery('prepare'),{code:'render-delivery-existing-job'});
  });
}

test('interrupted worker does not rerender; terminal job releases its leftover claim', async t => {
  const f=fixture(t);
  const directory=path.join(f.workspace,'local/interrupted'); fs.mkdirSync(directory,{recursive:true});
  const job=createJobRecord({slug:f.slug,stage:'render',metadata:{backend:'local',local:{directory,pid:null,resultPath:path.join(directory,'result.json')}}});
  updateJob(f.slug,job.id,{createdAt:'2020-01-01T00:00:00Z'});
  acquireProductionTask(f.project,{id:job.id,stage:'render',mode:'local-render'});
  const failed=await reconcileLocalJob(getJob(f.slug,job.id));
  assert.equal(failed.error.code,'local-render-interrupted'); assert.equal(listJobs(f.slug).length,1);
  acquireProductionTask(loadProject(f.slug,{refresh:false}),{id:job.id,stage:'render',mode:'local-render'});
  await refreshLocalRenderJobs(f.slug);
  assert.equal(activeProductionTask(loadProject(f.slug,{refresh:false})),null);
});

test('initializer recovery before Job creation waits for a live process', async t => {
  const f=fixture(t); acquireProductionTask(f.project,{id:'initializer',stage:'render',mode:'local-render'});
  await assert.rejects(()=>f.delivery('resume'),{code:'local-render-preparing'});
  assert.equal(listJobs(f.slug).length,0);
});

test('completed video is read only for prepare, start, resume and refresh', async t => {
  const f=fixture(t); const p=loadProject(f.slug,{refresh:false}); p.state.currentStage='completed'; writeJson(p.files.state,p.state);
  const before=fs.readFileSync(p.files.state,'utf8');
  for(const action of ['prepare','start','resume']) await assert.rejects(()=>f.delivery(action),{code:'completed-project-readonly'});
  await refreshLocalRenderJobs(f.slug);
  assert.equal(fs.readFileSync(p.files.state,'utf8'),before); assert.equal(listJobs(f.slug).length,0);
});

test('batch creation rejects local before creating any batch', t => {
  const f=fixture(t); assert.throws(()=>createBatch({type:'to-render',slugs:[f.slug],backend:'local'}),{code:'batch-local-render-disabled'});
});

test('extensionless FFmpeg wrapper maps codec and filter file arguments and preserves exit status', t => {
  const f=fixture(t); const capture=f.write('bin/capture',`#!${process.execPath}\nconsole.log(JSON.stringify(process.argv.slice(2))); process.exit(7);`,true);
  const wrapper=path.join(f.workspace,'bin/wrapper'); fs.copyFileSync(path.join(repository,'harness/src/local-ffmpeg.mjs'),wrapper); fs.chmodSync(wrapper,0o755);
  const result=spawnSync(wrapper,['-c:a','libfdk_aac','-filter_script:a','mix.txt','-filter_complex_script','complex.txt'],{encoding:'utf8',env:{...process.env,HARNESS_LOCAL_FFMPEG:capture,HARNESS_LOCAL_FFMPEG_MAJOR:'9'}});
  assert.equal(result.status,7,result.stderr); assert.deepEqual(JSON.parse(result.stdout),['-c:a','aac','-/filter:a','mix.txt','-/filter_complex','complex.txt']);
});

test('Web local prepare/start/resume and verified download share the same Job; batches reject local', async t => {
  const f=fixture(t,{TEST_RENDER_DELAY:'200'}); const server=createWebServer({port:0,deliveryDependencies:f.dependencies});
  await server.listen(); t.after(()=>server.close());
  const base=`http://127.0.0.1:${server.server.address().port}`;
  const action=async body=>{const response=await fetch(`${base}/api/projects/${f.slug}/action`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); const payload=await response.json(); assert.ok([200,202].includes(response.status),JSON.stringify(payload)); return payload;};
  const prepared=await action({action:'prepare-render'});
  const denied=await fetch(`${base}/api/projects/${f.slug}/action`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start-render',deliveryPlanId:prepared.result.planId})});
  assert.equal(denied.status,400);assert.equal((await denied.json()).code,'render-delivery-confirmation-required');assert.equal(listJobs(f.slug).length,0);
  const started=await action({action:'start-render',confirmDelivery:true,deliveryPlanId:prepared.result.planId});
  const job=await f.wait(started.result.job.id);
  assert.equal(job.status,'succeeded',JSON.stringify(job.error));
  const resumed=await action({action:'resume-render-delivery'}); assert.equal(resumed.result.job.id,job.id);
  const output=await fetch(`${base}/api/projects/${f.slug}/render-output?jobId=${job.id}`);
  assert.equal(output.status,200,output.status===200?'':await output.text()); assert.equal(await output.text(),'synthetic video');
  fs.appendFileSync(job.local.output,'changed');const changed=await fetch(`${base}/api/projects/${f.slug}/render-output?jobId=${job.id}`);assert.equal(changed.status,400);await changed.text();
  const rejected=await fetch(`${base}/api/batches`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'to-render',slugs:[f.slug],backend:'local'})});
  const rejection=await rejected.json();assert.ok(rejected.status>=400);assert.equal(rejection.code,'batch-local-render-disabled');
});

async function persistedResult(t) {
  const f=fixture(t); await f.delivery('prepare');
  const directory=path.join(f.workspace,'local/recovery'); fs.mkdirSync(directory,{recursive:true});
  const job=createJobRecord({slug:f.slug,stage:'render',metadata:{backend:'local',local:{directory,pid:null,resultPath:path.join(directory,'result.json')}}});
  const outputPath=f.write(`out/local-render/${f.slug}/${job.id}.mp4`,'synthetic verified video');
  const output={kind:'local-render',jobId:job.id,path:outputPath,verified:true,sizeInBytes:fs.statSync(outputPath).size,sha256:createHash('sha256').update(fs.readFileSync(outputPath)).digest('hex')};
  acquireProductionTask(f.project,{id:job.id,stage:'render',mode:'local-render'}); f.project.taskOwner=job.id; beginExecutorStage(f.project,'render');
  writeJson(job.local.resultPath,{ok:true,jobId:job.id,output,elapsedSeconds:1});
  return {...f,job,output};
}

test('result persisted before stage advancement recovers once to Gate 4', async t=>{
  const f=await persistedResult(t); const job=await reconcileLocalJob(f.job);
  assert.equal(job.status,'succeeded'); assert.equal(loadProject(f.slug,{refresh:false}).state.currentStage,'gate-4');
  await reconcileLocalJob(getJob(f.slug,job.id)); assert.equal(listJobs(f.slug).length,1);
});

test('result persisted after stage advancement recovers the original Job', async t=>{
  const f=await persistedResult(t); completeAdapterStage(f.project,'render',{outputs:[f.output]});
  const job=await reconcileLocalJob(f.job); assert.equal(job.status,'succeeded');
  assert.equal(loadProject(f.slug,{refresh:false}).state.stages['gate-4'].status,'waiting');
});

for (const changed of ['output','input','state']) test(`recovery rejects changed ${changed} without advancing`,async t=>{
  const f=await persistedResult(t);
  if(changed==='output') fs.appendFileSync(f.output.path,'changed');
  if(changed==='input') f.write(`src/videos/${f.slug}/FixtureVideo.tsx`,'export const FixtureVideo = () => "changed";');
  if(changed==='state'){f.project.state.currentStage='remotion';writeJson(f.project.files.state,f.project.state);}
  const job=await reconcileLocalJob(f.job); assert.equal(job.status,'failed');
  assert.equal(job.error.code,`local-render-${changed==='output'?'output-changed':changed==='input'?'input-stale':'state-changed'}`);
  assert.notEqual(loadProject(f.slug,{refresh:false}).state.currentStage,'gate-4');
});

test('completed video refresh preserves an active Job and claim byte for byte',async t=>{
  const f=await persistedResult(t);f.project.state.currentStage='completed';writeJson(f.project.files.state,f.project.state);
  const before=JSON.stringify(getJob(f.slug,f.job.id)); const claim=JSON.stringify(activeProductionTask(f.project));
  await refreshLocalRenderJobs(f.slug); await reconcileLocalJob(f.job);
  assert.equal(JSON.stringify(getJob(f.slug,f.job.id)),before); assert.equal(JSON.stringify(activeProductionTask(f.project)),claim);
});

test('failed synthetic render explicitly retries with a new Job and preserves original evidence',async t=>{
  const f=fixture(t,{TEST_RENDER_FAIL:'1'});let plan=await f.delivery('prepare');let started=await f.delivery('start',{confirmPlan:plan.planId});
  const original=await f.wait(started.job.id);assert.equal(original.status,'failed');
  delete f.environment.TEST_RENDER_FAIL;
  plan=await f.delivery('prepare',{retryJob:original.id}); started=await f.delivery('start',{confirmPlan:plan.planId});
  const retried=await f.wait(started.job.id);assert.equal(retried.status,'succeeded',JSON.stringify(retried.error));
  assert.notEqual(retried.id,original.id);assert.equal(getJob(f.slug,original.id).status,'failed');assert.equal(listJobs(f.slug).length,2);
});

test('Gate 4 rejection permits explicit rerender but never overwrites the accepted output candidate',async t=>{
  const f=fixture(t);let plan=await f.delivery('prepare');const started=await f.delivery('start',{confirmPlan:plan.planId});
  const original=await f.wait(started.job.id);assert.equal(original.status,'succeeded',JSON.stringify(original.error));
  const before=fs.readFileSync(original.local.output,'utf8');
  rejectGate(loadProject(f.slug,{refresh:false}),'gate-4','render','test rejection');
  plan=await f.delivery('prepare',{retryJob:original.id}); const retry=await f.delivery('start',{confirmPlan:plan.planId});
  assert.notEqual(retry.job.id,original.id);assert.notEqual(retry.job.local.output,original.local.output);
  assert.equal((await f.wait(retry.job.id)).status,'succeeded');assert.equal(fs.readFileSync(original.local.output,'utf8'),before);
  assert.equal(loadProject(f.slug,{refresh:false}).state.stages['gate-4'].status,'waiting');
});


test('worker killed after initialization is recorded as interrupted without a second Job',async t=>{
  const f=fixture(t,{TEST_RENDER_DELAY:'3000'});const plan=await f.delivery('prepare');const started=await f.delivery('start',{confirmPlan:plan.planId});
  const job=started.job;const workerFile=path.join(job.local.directory,'worker.json');
  for(let n=0;n<100&&!fs.existsSync(workerFile);n++) await new Promise(r=>setTimeout(r,20));
  assert.ok(fs.existsSync(workerFile),'synthetic worker initialized');
  process.kill(job.local.pid,'SIGKILL'); await new Promise(r=>setTimeout(r,100));
  updateJob(f.slug,job.id,{createdAt:'2020-01-01T00:00:00Z'});
  const failed=await f.wait(job.id);assert.equal(failed.error.code,'local-render-interrupted');
  assert.equal(listJobs(f.slug).length,1);assert.equal(loadProject(f.slug,{refresh:false}).state.currentStage,'render');
});

test('exited initializer before Job creation releases only its own claim',async t=>{
  const f=fixture(t);const pid=Number(execFileSync(process.execPath,['-e','console.log(process.pid)'],{encoding:'utf8'}));
  acquireProductionTask(f.project,{id:'dead-initializer',stage:'render',mode:'local-render'});
  const file=path.join(path.dirname(f.project.files.state),'production-task.lock.json');const claim=JSON.parse(fs.readFileSync(file));claim.processId=pid;writeJson(file,claim);
  const result=await f.delivery('resume');assert.equal(result.status,'interrupted-before-job');assert.equal(activeProductionTask(f.project),null);assert.equal(listJobs(f.slug).length,0);
});

test('local Gate 4 rejects a symlink escaping the output directory',async t=>{
  const f=await persistedResult(t);await reconcileLocalJob(f.job);
  const external=f.write('outside.mp4','synthetic verified video');const linked=path.join(path.dirname(f.output.path),'escape.mp4');fs.symlinkSync(external,linked);
  const p=loadProject(f.slug,{refresh:false});p.state.stages.render.outputs[0].path=linked;writeJson(p.files.state,p.state);
  assert.ok(validateStage(loadProject(f.slug,{refresh:false}),'gate-4').some(i=>i.code==='local-render-output-invalid'));
});


test('programmatic batch execution and preparation reject local without changing the batch',async t=>{
  const f=fixture(t);const batch=createBatch({type:'to-render',slugs:[f.slug]});const before=JSON.stringify(getBatch(batch.id));
  await assert.rejects(()=>runBatch(batch.id,{backend:'local'}),{code:'batch-local-render-disabled'});
  await assert.rejects(()=>prepareBatchRenderDelivery(batch,{backend:'local'}),{code:'batch-local-render-disabled'});
  assert.equal(JSON.stringify(getBatch(batch.id)),before);
  await assert.rejects(()=>f.delivery('prepare'),{code:'batch-local-render-disabled'});
});

test('GitHub monitor skips local Jobs without consulting an adapter',async t=>{
  const f=fixture(t);const job=createJobRecord({slug:f.slug,stage:'render',metadata:{backend:'local'}});
  const monitor=createRemoteJobMonitor({adapterFactory:()=>{throw new Error('must not create a GitHub adapter');}});
  const before=JSON.stringify(job);await monitor.processJob(job.id);await monitor.poll();
  assert.equal(JSON.stringify(getJob(f.slug,job.id)),before);
});


test('concurrent claim removal tolerates ENOENT but preserves permission errors',t=>{
  const f=fixture(t);acquireProductionTask(f.project,{id:'race',stage:'render',mode:'local-render'});
  const file=path.join(path.dirname(f.project.files.state),'production-task.lock.json');
  const originalRead=fs.readFileSync;let code='ENOENT';
  const read=t.mock.method(fs,'readFileSync',(target,...args)=>{if(target===file)throw Object.assign(new Error('simulated competing finalizer'),{code});return originalRead(target,...args);});
  assert.equal(activeProductionTask(f.project),null);code='EACCES';assert.throws(()=>activeProductionTask(f.project),{code:'EACCES'});read.mock.restore();
  const originalRename=fs.renameSync;
  t.mock.method(fs,'renameSync',(from,to)=>{if(from===file)throw Object.assign(new Error('claim already released'),{code:'ENOENT'});return originalRename(from,to);});
  assert.doesNotThrow(()=>releaseProductionTask(f.project,'race'));
});


test('changed browser binary invalidates the prepared plan before starting',async t=>{
  const f=fixture(t);const plan=await f.delivery('prepare');f.write('bin/browser',`#!${process.execPath}\n// changed executable\nprocess.exit(0)`,true);
  await assert.rejects(()=>f.delivery('start',{confirmPlan:plan.planId}),{code:'render-delivery-plan-stale'});assert.equal(listJobs(f.slug).length,0);
});

test('insufficient disk space blocks preparation before creating a Job',async t=>{
  const f=fixture(t);t.mock.method(fs,'statfsSync',()=>({bavail:1,bsize:4096}));
  await assert.rejects(()=>f.delivery('prepare'),{code:'local-render-disk-space'});assert.equal(listJobs(f.slug).length,0);
});
