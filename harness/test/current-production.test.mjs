import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import test from 'node:test';
import {initializeProject, loadProject, writeJson, projectFiles, assertProjectMutable} from '../src/storage.mjs';
import {createWorkflowStagesState} from '../src/workflows/registry.mjs';
import {artifactManifestFor} from '../src/artifacts.mjs';
import {runStage, resumeProject, retryStage, approveGate, rejectGate} from '../src/runner.mjs';
import {claimDialogueTask, failAgentTask, getAgentJob, recoverInterruptedAgentJobs} from '../src/agent-jobs.mjs';
import {ensureRemotionTask, recoverInterruptedRemotionTasks} from '../src/remotion-tasks.mjs';
import {createBatch, runBatch} from '../src/batches.mjs';
import {runRenderDelivery} from '../src/render-delivery.mjs';
import {prepareStoryboardRework, startStoryboardRework} from '../src/storyboard-rework.mjs';
import {buildNextAction} from '../src/reports.mjs';
import {createWebServer} from '../src/web/server.mjs';
import {createProjectActionService} from '../src/web/services/project-actions.mjs';
import {acquireProductionTask, releaseProductionTask} from '../src/production-lock.mjs';
import {adoptExistingProjectToGate2, markHistoricalProjectCompleted} from '../src/adoption.mjs';

const repository = path.resolve(new URL('../..', import.meta.url).pathname);
const reworkOptions = {returnTo: 'storyboard', reason: '按当前规则重新制作'};
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'current-production-'));
  const previous = {};
  for (const [key, dir] of Object.entries({HARNESS_WORKSPACE_ROOT:'workspace', HARNESS_PROJECTS_DIR:'projects', HARNESS_AGENT_JOBS_DIR:'agent-jobs', HARNESS_REMOTION_TASKS_DIR:'remotion-tasks', HARNESS_BATCHES_DIR:'batches', HARNESS_SERIES_DIR:'series'})) {
    previous[key] = process.env[key]; process.env[key] = path.join(root, dir);
  }
  const workspace = process.env.HARNESS_WORKSPACE_ROOT;
  fs.mkdirSync(path.join(workspace, 'styles/current'), {recursive:true});
  fs.copyFileSync(path.join(repository, 'styles/current/STYLE.md'), path.join(workspace, 'styles/current/STYLE.md'));
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) if (value === undefined) delete process.env[key]; else process.env[key] = value;
    fs.rmSync(root, {recursive:true, force:true});
  });
  const source = slug => {const dir = path.join(workspace, 'videos', slug); fs.mkdirSync(dir, {recursive:true}); fs.writeFileSync(path.join(dir,'source.md'),'# Source\n测试制作流程。\n');};
  const historical = (slug, contract, version) => {
    source(slug); initializeProject(slug);
    const p = loadProject(slug, {refresh:false});
    p.config.productionContract = contract;
    if (version === undefined) delete p.config.storyboardSchemaVersion; else p.config.storyboardSchemaVersion = version;
    if (contract === undefined) delete p.config.productionContract;
    p.state.stages = createWorkflowStagesState(p); p.state.currentStage = 'source';
    writeJson(p.files.config,p.config); writeJson(p.files.state,p.state); writeJson(p.files.artifacts,{...p.artifacts,stages:artifactManifestFor(p)});
    return loadProject(slug,{refresh:false});
  };
  const snapshot = () => {
    const result = {};
    function walk(dir) {if (!fs.existsSync(dir)) return; for (const item of fs.readdirSync(dir,{withFileTypes:true})) {const file=path.join(dir,item.name); if(item.isDirectory())walk(file);else result[path.relative(root,file)]=fs.readFileSync(file).toString('base64');}}
    walk(root); return result;
  };
  const cli = args => spawnSync(process.execPath,[path.join(repository,'harness/src/cli.mjs'),...args],{cwd:repository,env:process.env,encoding:'utf8'});
  return {root,workspace,source,historical,snapshot,cli};
}

test('CLI and shared initialization default to the sole current graph; old requests write nothing',t=>{
  const f=fixture(t); f.source('cli-default');
  const result=f.cli(['init','cli-default']); assert.equal(result.status,0,result.stderr);
  const p=loadProject('cli-default',{refresh:false});
  assert.equal(p.config.productionContract,'storyboard-v1'); assert.equal(p.config.storyboardSchemaVersion,3);
  assert.ok(p.state.stages.storyboard); assert.equal(p.state.stages['visual-prototype'],undefined);
  for(const options of [{productionContract:'legacy-v1'},{productionContract:'unified-v1'},{storyboardSchemaVersion:1},{storyboardSchemaVersion:2},{storyboardSchemaVersion:99}]) {
    const before=f.snapshot(); assert.throws(()=>initializeProject('refused',options),{code:'production-rework-required'}); assert.deepEqual(f.snapshot(),before);
  }
  const before=f.snapshot(); assert.notEqual(f.cli(['init','refused','--production-contract','unified-v1']).status,0); assert.deepEqual(f.snapshot(),before);
});

test('single execution, task claims, gates, batches and delivery block every historical contract before effects',async t=>{
  const f=fixture(t);
  for(const [contract,version] of [[undefined,undefined],['legacy-v1',undefined],['unified-v1',undefined],['storyboard-v1',1],['storyboard-v1',2]]) {
    const slug=`old-${version ?? contract ?? 'missing'}`; const p=f.historical(slug,contract,version); const before=f.snapshot();
    assert.equal(buildNextAction(p).action,'rework-required');
    for(const action of [()=>runStage(p),()=>resumeProject(p),()=>retryStage(p),()=>claimDialogueTask(slug),()=>ensureRemotionTask({slug}),()=>approveGate(p,'gate-2'),()=>rejectGate(p,'gate-2','narration-script','返工'),()=>createBatch({type:'to-gate-2',slugs:[slug]})]) assert.throws(action,{code:'production-rework-required'});
    let called=false;
    await assert.rejects(runRenderDelivery('prepare',slug,{}, {prepareInputs:()=>{called=true;}}),{code:'production-rework-required'});
    assert.equal(called,false); assert.deepEqual(f.snapshot(),before);
    loadProject(slug); assert.deepEqual(f.snapshot(),before);
  }
});

test('normal rework rebuilds old graphs from the earliest unverified input and is resumable without inheriting gates',t=>{
  const f=fixture(t);
  for(const contract of ['legacy-v1','unified-v1','storyboard-v1']) {
    const slug=`rework-${contract}`; const old=f.historical(slug,contract,1);
    old.state.stages['gate-2'].review={decision:'approved',marker:'historical'};
    writeJson(old.files.state,old.state); const before=f.snapshot();
    assert.throws(()=>prepareStoryboardRework(slug,{...reworkOptions,returnTo:'remotion'}),{code:'storyboard-rework-input'});
    const plan=prepareStoryboardRework(slug,reworkOptions); assert.equal(plan.returnTo,'source'); assert.deepEqual(f.snapshot(),before);
    assert.throws(()=>startStoryboardRework(slug,'0'.repeat(64),reworkOptions),{code:'storyboard-rework-stale'}); assert.deepEqual(f.snapshot(),before);
    startStoryboardRework(slug,plan.reworkVersion,reworkOptions);
    const p=loadProject(slug,{refresh:false}); assert.equal(p.config.productionContract,'storyboard-v1');assert.equal(p.config.storyboardSchemaVersion,3);
    assert.equal(p.state.currentStage,'source');assert.equal(p.state.stages['gate-2'].review,null);assert.equal(p.state.stages['visual-prototype'],undefined);
    const journal=JSON.parse(fs.readFileSync(plan.writePaths.find(file=>file.includes('/storyboard-rework/')),'utf8'));
    assert.equal(journal.previous.state.stages['gate-2'].review.marker,'historical');
    assert.equal(startStoryboardRework(slug,plan.reworkVersion,reworkOptions).resumed,true);
    runStage(p,'source');const task=claimDialogueTask(slug);assert.deepEqual(task.stages,['content-analysis','video-narrative']);
  }
});

test('admission checks persisted configuration even if a caller holds an old in-memory view',t=>{
  const f=fixture(t);f.source('stale-view');initializeProject('stale-view');const p=loadProject('stale-view',{refresh:false});
  writeJson(p.files.config,{...p.config,storyboardSchemaVersion:1});const before=f.snapshot();
  assert.throws(()=>assertProjectMutable(p),{code:'production-rework-required'});assert.throws(()=>runStage(p),{code:'production-rework-required'});assert.deepEqual(f.snapshot(),before);
});

test('normal rework can stop a historical batch without enabling its other old members',async t=>{
  const f=fixture(t);for(const slug of ['batch-one','batch-two']) {f.source(slug);initializeProject(slug);}
  const batch=createBatch({type:'to-gate-2',slugs:['batch-one','batch-two']});
  for(const slug of ['batch-one','batch-two']) {const p=loadProject(slug,{refresh:false});writeJson(p.files.config,{...p.config,storyboardSchemaVersion:1});}
  const other=fs.readFileSync(projectFiles('batch-two').config,'utf8');const plan=prepareStoryboardRework('batch-one',reworkOptions);
  startStoryboardRework('batch-one',plan.reworkVersion,reworkOptions);
  assert.equal(fs.readFileSync(projectFiles('batch-two').config,'utf8'),other);
  const saved=JSON.parse(fs.readFileSync(path.join(process.env.HARNESS_BATCHES_DIR,`${batch.id}.json`),'utf8'));assert.equal(saved.items[0].status,'failed');
  await assert.rejects(runBatch(batch.id),{code:'production-rework-required'});
});

test('rework resumes a partial graph write and refuses changed input or occupied projects',t=>{
  const f=fixture(t),slug='partial-rework';const old=f.historical(slug,'unified-v1',1);
  acquireProductionTask(old,{id:'occupied',stage:'source',mode:'dialogue'});
  assert.throws(()=>prepareStoryboardRework(slug,reworkOptions),{code:'storyboard-rework-busy'});releaseProductionTask(old,'occupied');
  const plan=prepareStoryboardRework(slug,reworkOptions);startStoryboardRework(slug,plan.reworkVersion,reworkOptions);
  const file=plan.writePaths.find(file=>file.includes('/storyboard-rework/')),journal=JSON.parse(fs.readFileSync(file,'utf8'));
  journal.status='applying';writeJson(file,journal);writeJson(projectFiles(slug).config,journal.previous.config);
  assert.equal(startStoryboardRework(slug,plan.reworkVersion,reworkOptions).currentStage,'source');
  journal.status='applying';writeJson(file,journal);fs.appendFileSync(path.join(f.workspace,'videos',slug,'source.md'),'改变输入');
  const before=f.snapshot();assert.throws(()=>startStoryboardRework(slug,plan.reworkVersion,reworkOptions),{code:'storyboard-rework-stale'});assert.deepEqual(f.snapshot(),before);
});

test('completed historical projects remain immutable including reads and rework',async t=>{
  const f=fixture(t),p=f.historical('completed-history','legacy-v1',1);
  p.state.currentStage='completed';writeJson(p.files.state,p.state);const before=f.snapshot();
  assert.equal(loadProject(p.config.slug).state.currentStage,'completed');assert.equal(buildNextAction(p).action,'complete');
  assert.throws(()=>prepareStoryboardRework(p.config.slug,reworkOptions),{code:'completed-project-readonly'});
  assert.throws(()=>claimDialogueTask(p.config.slug),{code:'completed-project-readonly'});
  await assert.rejects(runRenderDelivery('prepare',p.config.slug),{code:'completed-project-readonly'});
  assert.deepEqual(f.snapshot(),before);
});

test('background recovery and saved batches cannot resume old production or rewrite it',async t=>{
  const f=fixture(t);f.source('saved-batch');initializeProject('saved-batch');const batch=createBatch({type:'to-gate-2',slugs:['saved-batch']});
  const p=loadProject('saved-batch',{refresh:false});p.config.storyboardSchemaVersion=1;writeJson(p.files.config,p.config);
  fs.mkdirSync(process.env.HARNESS_AGENT_JOBS_DIR,{recursive:true});
  fs.writeFileSync(path.join(process.env.HARNESS_AGENT_JOBS_DIR,'old-job.json'),JSON.stringify({id:'old-job',slug:'saved-batch',stage:'source',status:'running',mode:'background'}));
  fs.mkdirSync(process.env.HARNESS_REMOTION_TASKS_DIR,{recursive:true});
  fs.writeFileSync(path.join(process.env.HARNESS_REMOTION_TASKS_DIR,'old-task.json'),JSON.stringify({id:'old-task',slug:'saved-batch',stage:'remotion',status:'in-progress'}));
  const before=f.snapshot();recoverInterruptedAgentJobs();recoverInterruptedRemotionTasks();
  await assert.rejects(runBatch(batch.id),{code:'production-rework-required'});assert.deepEqual(f.snapshot(),before);
});

test('explicit task failure can release an old dialogue claim for normal rework without restoring old execution',t=>{
  const f=fixture(t);f.source('old-claim');initializeProject('old-claim');runStage(loadProject('old-claim',{refresh:false}),'source');
  const job=claimDialogueTask('old-claim'),p=loadProject('old-claim',{refresh:false});
  writeJson(p.files.config,{...p.config,storyboardSchemaVersion:1});
  assert.throws(()=>prepareStoryboardRework('old-claim',reworkOptions),{code:'storyboard-rework-busy'});
  failAgentTask(job.id,'明确结束旧制作，按当前规则返工');assert.equal(getAgentJob(job.id).status,'failed');
  assert.throws(()=>claimDialogueTask('old-claim'),{code:'production-rework-required'});
  assert.doesNotThrow(()=>prepareStoryboardRework('old-claim',reworkOptions));
});

test('HTTP import and initialization use the current default and refuse old selections without leftovers',async t=>{
  const f=fixture(t);f.source('http-init');
  const web=createWebServer({port:0,remoteJobMonitor:{start(){},stop(){},async poll(){}}});
  await web.listen();t.after(()=>web.close());
  const base=`http://127.0.0.1:${web.server.address().port}`;
  const request=async (url,options)=>{const res=await fetch(base+url,options);return {status:res.status,body:await res.json()};};
  const init=await request('/api/projects/http-init/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'initialize'})});
  assert.equal(init.status,200,JSON.stringify(init.body));assert.equal(loadProject('http-init',{refresh:false}).config.storyboardSchemaVersion,3);
  const imported=await request('/api/projects/import?slug=http-import&filename=source.md',{method:'PUT',body:'# Source\nHTTP 导入。'});
  assert.equal(imported.status,201,JSON.stringify(imported.body));assert.equal(loadProject('http-import',{refresh:false}).config.productionContract,'storyboard-v1');
  for(const selection of ['productionContract=unified-v1','storyboardSchemaVersion=1']) {
    const before=f.snapshot(),result=await request(`/api/projects/import?slug=http-refused&filename=source.md&${selection}`,{method:'PUT',body:'# Source\n拒绝旧流程。'});
    assert.equal(result.status,400);assert.equal(result.body.code,'production-rework-required');assert.deepEqual(f.snapshot(),before);
  }
  const old=f.historical('http-old','unified-v1',1),before=f.snapshot();
  const refused=await request('/api/projects/http-old/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'run'})});
  assert.equal(refused.status,400);assert.equal(refused.body.code,'production-rework-required');assert.deepEqual(f.snapshot(),before);
  const prepared=await request('/api/projects/http-old/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'prepare-storyboard-rework',...reworkOptions})});
  assert.equal(prepared.status,200);assert.deepEqual(f.snapshot(),before);
  const started=await request('/api/projects/http-old/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'start-storyboard-rework',...reworkOptions,reworkVersion:prepared.body.result.reworkVersion})});
  assert.equal(started.status,200);assert.equal(loadProject(old.config.slug,{refresh:false}).config.storyboardSchemaVersion,3);
});

test('the old conversion command and HTTP action are retired',async t=>{
  const f=fixture(t);assert.notEqual(f.cli(['storyboard-migration','missing','prepare']).status,0);
  const before=f.snapshot();
  assert.throws(()=>adoptExistingProjectToGate2('missing'),{code:'production-entry-retired'});
  assert.throws(()=>markHistoricalProjectCompleted('missing'),{code:'production-entry-retired'});
  assert.deepEqual(f.snapshot(),before);
  await assert.rejects(createProjectActionService({}).execute({slug:'missing',action:'prepare-storyboard-migration'}),{code:'production-entry-retired'});
});
