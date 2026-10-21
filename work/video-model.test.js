const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const server=fs.readFileSync('server.js','utf8'), app=fs.readFileSync('public/app.js','utf8');
function extract(source,name) { const match=source.match(new RegExp(`^(?:async )?function ${name}\\([^]*?^}`, 'm'));assert(match,`Missing ${name}`);return match[0]; }
const tests=[];
function serverFixture(payload) {
  const ctx={URL,parseBody:async()=>payload,requireApiKey:()=> 'fixture-key',compactObject:value=>Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined)),
    agnesHeaders:()=>({}),agnesBaseFor:()=> 'https://apihub.agnes-ai.com',normalizeVideoFrameCount:x=>x,
    fetchJson:async(url,options)=>{ctx.url=url;ctx.body=options.body?JSON.parse(options.body):null;return {video_id:'video-accepted',status:'queued'};},
    withVideoSubmissionSlot:async(key,region,submit)=>submit(),
    sendJson:(res,status,data)=>{ctx.status=status;ctx.data=data;}};
  vm.createContext(ctx);
  vm.runInContext(['buildAgnesVideoRequest','videoTaskFromResponse','handleAgnesVideo','handleAgnesVideoResult'].map(name=>extract(server,name)).join('\n'),ctx);
  return ctx;
}
tests.push(['retired model create request migrates to Flash with 2.5 parameters',async()=>{
  const ctx=serverFixture({model:'agnes-video-v2.0',prompt:'cat',num_frames:121,frame_rate:24,width:1280,height:720});
  await ctx.handleAgnesVideo({},{});
  assert.equal(ctx.body.model,'agnes-video-2.5-flash');assert.equal(ctx.body.seconds,'5');assert.equal(ctx.body.mode,'text');assert.equal(ctx.body.size,'720P');assert.equal(ctx.body.aspect_ratio,'16:9');
  for(const key of ['width','height','num_frames','frame_rate','negative_prompt','generate_audio','extra_body'])assert(!(key in ctx.body),key);
}]);
tests.push(['single image uses keyframe and multiple images use reference mode',async()=>{
  for(const refs of [['https://example.test/one.png'],['https://example.test/one.png','https://example.test/two.png']]) {
    const ctx=serverFixture({prompt:'product',imageRefs:refs,seconds:'8',aspect:'9:16'});await ctx.handleAgnesVideo({},{});
    assert.equal(ctx.body.seconds,'8');assert.equal(ctx.body.aspect_ratio,'9:16');
    if(refs.length===1){assert.equal(ctx.body.mode,'keyframe');assert.equal(ctx.body.first_frame,refs[0]);}else{assert.equal(ctx.body.mode,'reference');assert.equal(ctx.body.images.length,2);}
  }
}]);
tests.push(['Flash validates unsupported resolution, duration, aspect and image count before submission',async()=>{
  for(const extra of [{resolution:'1080p'},{seconds:'15'},{aspect:'auto-invalid'},{imageRefs:Array(6).fill('https://example.test/a.png')},{imageRefs:['data:image/png;base64,local']}]) {
    const ctx=serverFixture({prompt:'test',...extra});await assert.rejects(ctx.handleAgnesVideo({},{}));assert.equal(ctx.url,undefined);
  }
}]);
tests.push(['paid and unknown Agnes video models are rejected before any upstream submission',async()=>{
  for(const model of ['agnes-video-2.5','private-model','AGNES-VIDEO-2.5']) {
    const ctx=serverFixture({prompt:'test',model,resolution:'720p'});
    await assert.rejects(ctx.handleAgnesVideo({},{}),error=>error.status===400 && /Flash/.test(error.message));
    assert.equal(ctx.url,undefined);
  }
}]);
tests.push(['existing retired and standard task polling preserves its original model',async()=>{
  for(const model of ['agnes-video-v2.0','agnes-video-2.5']) {
    const old=serverFixture({model,video_id:'old-video'});await old.handleAgnesVideoResult({},{});
    assert.equal(new URL(old.url).searchParams.get('model_name'),model);assert.equal(old.body,null);
  }
}]);
tests.push(['only new Agnes generations migrate, custom models and saved task models stay unchanged',async()=>{
  const ctx={settings:{provider:'agnes',videoModel:'agnes-video-v2.0'}};vm.createContext(ctx);vm.runInContext(extract(app,'resolveVideoModel'),ctx);
  for(const model of ['agnes-video-v2.0','agnes-video-2.5','private-model','']) assert.equal(ctx.resolveVideoModel(model),'agnes-video-2.5-flash');
  ctx.settings.provider='custom';
  for(const model of ['agnes-video-v2.0','agnes-video-2.5','private-model']) assert.equal(ctx.resolveVideoModel(model),model);
}]);
tests.push(['Flash text request matches the documented field types and excludes obsolete options',async()=>{
  const ctx=serverFixture({prompt:'cat',seconds:'5',size:'720P',aspect_ratio:'16:9',quality:'high',n:3});
  await ctx.handleAgnesVideo({},{});
  assert.deepEqual(JSON.parse(JSON.stringify(ctx.body)),{model:'agnes-video-2.5-flash',prompt:'cat',seconds:'5',size:'720P',aspect_ratio:'16:9',n:1,mode:'text'});
}]);
tests.push(['model_not_found becomes actionable and never triggers a generation retry',async()=>{
  const ctx={settings:{agnesRegion:'global'},flushLocalSave(){},fetch:async()=>({ok:false,status:503,json:async()=>({error:'Upstream API request failed.',details:{status:503,response:{error:{code:'model_not_found',message:'No available channel for model agnes-video-v2.0 under group default (distributor) (request id: abc123)'}}}})})};
  vm.createContext(ctx);vm.runInContext(['postJson','isUpstreamTimeout','isUpstreamNetworkError','isModelUnavailableError','modelUnavailableMessage','isVideoQueueFullError','requestAgnesVideo'].map(name=>extract(app,name)).join('\n'),ctx);
  let requests=0;const original=ctx.postJson;ctx.postJson=(...args)=>{requests++;return original(...args);};
  await assert.rejects(ctx.requestAgnesVideo({model:'agnes-video-v2.0'}),error=>/模型.*不可用|模型.*通道/.test(error.message)&&/abc123/.test(error.message)&&!error.retryable);
  assert.equal(requests,1);
}]);
(async()=>{let failed=0;for(const [name,test]of tests){try{await test();console.log(`PASS ${name}`);}catch(error){failed++;console.error(`FAIL ${name}: ${error.message}`);}}if(failed)process.exitCode=1;})();
