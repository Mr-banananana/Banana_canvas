const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const app = fs.readFileSync('public/app.js','utf8');
const server = fs.readFileSync('server.js','utf8');
function extract(source,name) {
  const match=source.match(new RegExp(`^(?:async )?function ${name}\\([^]*?^}`, 'm'));
  assert(match, name); return match[0];
}
const tests=[];
tests.push(['non-idempotent video/image POST is not replayed after lost response', async()=>{
  let calls=0;
  const ctx={URL, proxyFor:()=>({}), requestUpstream:async()=>{calls++; throw Object.assign(new Error('connection reset'),{code:'ECONNRESET'});},
    isTransientNetworkError:()=>true, upstreamErrorCode:()=> 'ECONNRESET', networkErrorMessage:()=> 'network error', setTimeout:fn=>fn()};
  vm.createContext(ctx); vm.runInContext(extract(server,'fetchJson'),ctx);
  await assert.rejects(ctx.fetchJson('https://upstream.example/v1/videos',{method:'POST'}));
  assert.equal(calls,1);
}]);
tests.push(['GET polling retains safe network fallback', async()=>{
  let calls=0;
  const ctx={URL, proxyFor:()=>({}), requestUpstream:async()=>{if(++calls===1) throw new Error('reset'); return {status:200,headers:{},body:'{"ok":true}'};},
    isTransientNetworkError:()=>true, setTimeout:fn=>fn()};
  vm.createContext(ctx); vm.runInContext(extract(server,'fetchJson'),ctx);
  assert.equal((await ctx.fetchJson('https://upstream.example/result',{method:'GET'})).ok,true);
  assert.equal(calls,2);
}]);
tests.push(['permanent proxy errors do not bypass the proxy', async()=>{
  let calls=0;
  const ctx={URL, proxyFor:()=>({}), requestUpstream:async()=>{calls++; throw new Error('proxy authentication failed');},
    isTransientNetworkError:()=>false, upstreamErrorCode:()=> 'PROXY_AUTH', networkErrorMessage:()=> 'error'};
  vm.createContext(ctx); vm.runInContext(extract(server,'fetchJson'),ctx);
  await assert.rejects(ctx.fetchJson('https://upstream.example/result',{method:'GET'}));
  assert.equal(calls,1);
}]);
tests.push(['explicit task region survives a settings change', async()=>{
  let region;
  const ctx={settings:{agnesRegion:'china'}, flushLocalSave(){}, fetch:async(url,options)=>{
    region=JSON.parse(options.body).agnesRegion; return {ok:true,json:async()=>({response:{}})};
  }};
  vm.createContext(ctx); vm.runInContext(extract(app,'postJson'),ctx);
  await ctx.postJson('/api/agnes/video-result',{agnesRegion:'global'});
  assert.equal(region,'global');
}]);
function generationFixture() {
  const card={id:'video',type:'video',status:'idle',progress:0,prompt:'prompt'};
  const ctx={card, canvasLibrary:{activeCanvasId:'canvas'}, settings:{provider:'agnes'}, generationLocks:new Set(),
    selectedCard:()=>card, collectSettings(){},getApiKey:()=> 'fixture-key',combinedPrompt:()=> 'prompt',
    updateSelected:patch=>Object.assign(card,patch), updateCard:(id,patch)=>Object.assign(card,patch),
    isRateLimitError:()=>false, renderInspector(){}, els:{settingsModal:{classList:{remove(){}}}},
    generates:0, polls:0, generateAgnesVideo:async()=>{ctx.generates++;},pollVideo:async()=>{ctx.polls++;}
  };
  vm.createContext(ctx);vm.runInContext(extract(app,'generateSelected'),ctx); return ctx;
}
tests.push(['rapid repeat clicks create only one request for the same node', async()=>{
  const ctx=generationFixture();let release;
  ctx.generateAgnesVideo=async()=>{ctx.generates++;await new Promise(resolve=>{release=resolve;});};
  const first=ctx.generateSelected();const second=ctx.generateSelected();
  assert.equal(ctx.generates,1);release();await Promise.all([first,second]);
  assert.equal(ctx.generationLocks.size,0);
}]);
tests.push(['retrying interrupted polling queries the saved task instead of creating another', async()=>{
  const ctx=generationFixture();ctx.card.task={video_id:'old',agnesRegion:'global',model:'saved-model'};
  ctx.card.status='error';ctx.card.error='temporary 502';
  await ctx.generateSelected();assert.equal(ctx.generates,0);assert.equal(ctx.polls,1);
}]);
tests.push(['late polling response cannot overwrite a replaced task', async()=>{
  const card={id:'video',task:{video_id:'original'},status:'running'};
  let writes=0,results=0;
  const ctx={canvasLibrary:{activeCanvasId:'canvas'},settings:{pollInterval:12000},normalizePollInterval:()=>12000,
    findCanvasCard:()=>card,sleep:async()=>{},cloneData:x=>JSON.parse(JSON.stringify(x)),
    postJson:async()=>{card.task={video_id:'replacement'};return {response:{status:'completed',url:'https://result.example/video.mp4'}};},
    isRateLimitError:()=>false,updateCard:()=>writes++,duplicateResultCard:()=>results++};
  vm.createContext(ctx);vm.runInContext(extract(app,'pollVideo'),ctx);
  await ctx.pollVideo('video','fixture-key','canvas',card.task);
  assert.equal(writes,0);assert.equal(results,0);
}]);
function productFixture(task = {video_id:'saved',agnesRegion:'global',model:'old-model',prompt:'old prompt'}) {
  const workspace={productRef:{url:'data:image/png;base64,fixture'},status:'queued',task,prompt:'new prompt',results:[]};
  const ctx={state:{productVideoWorkspace:workspace},canvasLibrary:{activeCanvasId:'canvas'},generationLocks:new Set(),
    settings:{provider:'agnes',agnesRegion:'china',videoModel:'new-model'},collectSettings(){},getApiKey:()=> 'fixture-key',
    renderProductVideoWorkspace(){},save(){},mutateCanvasById:(id,fn)=>fn({productVideoWorkspace:workspace}),
    els:{settingsModal:{classList:{remove(){}}}}, creates:0,polls:0,
    productVideoRequest:()=>({model:'new-model',prompt:'new prompt'}),
    requestAgnesVideo:async()=>{ctx.creates++;return {response:{video_id:'created'}};},
    pollProductVideo:async()=>{ctx.polls++;}
  };
  vm.createContext(ctx);vm.runInContext(extract(app,'generateProductVideo'),ctx);return ctx;
}
tests.push(['product workspace with a queued saved task resumes instead of creating', async()=>{
  const ctx=productFixture();await ctx.generateProductVideo();assert.equal(ctx.creates,0);assert.equal(ctx.polls,1);
}]);
tests.push(['product polling error preserves task ID for the next retry', async()=>{
  const ctx=productFixture(null);ctx.pollProductVideo=async()=>{ctx.polls++;throw new Error('temporary 502');};
  await ctx.generateProductVideo();assert.equal(ctx.state.productVideoWorkspace.task.video_id,'created');
  await ctx.generateProductVideo();assert.equal(ctx.creates,1);assert.equal(ctx.polls,2);
}]);
tests.push(['product video polling pins region and model and treats queued as busy', async()=>{
  const workspace={task:{video_id:'saved',agnesRegion:'global',model:'old-model'},progress:12};let polls=0;
  const ctx={canvasLibrary:{activeCanvasId:'canvas'},settings:{agnesRegion:'china',videoModel:'new-model'},
    cloneData:x=>JSON.parse(JSON.stringify(x)),normalizePollInterval:()=>12000,canvasStateFor:()=>({productVideoWorkspace:workspace}),sleep:async()=>{},
    renderProductVideoWorkspace(){},mutateCanvasById:(id,fn)=>fn({productVideoWorkspace:workspace}),
    postJson:async(url,body)=>{assert.equal(body.agnesRegion,'global');assert.equal(body.model,'old-model');
      if(++polls===1)return {response:{status:'queued'}};
      assert.equal(workspace.status,'running');return {response:{status:'completed',url:'https://example.test/video.mp4'}};
    },storeProductVideoResult:()=>{workspace.task=null;},isRateLimitError:()=>false};
  vm.createContext(ctx);vm.runInContext(extract(app,'pollProductVideo'),ctx);
  await ctx.pollProductVideo('fixture-key','canvas','prompt',workspace.task);assert.equal(polls,2);
}]);
tests.push(['async product upload stays with its original canvas and preserves running task', async()=>{
  const one={productVideoWorkspace:{task:{video_id:'paid-task'}}};const two={productVideoWorkspace:{productRef:null}};let reader;
  const ctx={state:one,canvasLibrary:{activeCanvasId:'one'},renderProductVideoWorkspace(){},
    mutateCanvasById:(id,fn)=>fn(id==='one'?one:two),FileReader:class{constructor(){reader=this;}readAsDataURL(){}}};
  vm.createContext(ctx);vm.runInContext(extract(app,'handleProductVideoUpload'),ctx);
  ctx.handleProductVideoUpload({target:{files:[{type:'image/png',name:'product'}],value:'file'}});
  ctx.canvasLibrary.activeCanvasId='two';ctx.state=two;reader.result='data:image/png;base64,new';reader.onload();
  assert.equal(one.productVideoWorkspace.productRef.url,reader.result);assert.equal(two.productVideoWorkspace.productRef,null);
  assert.equal(one.productVideoWorkspace.task.video_id,'paid-task');
}]);
function commerceFixture() {
  const workspace={productRef:{url:'data:fixture'},promptMode:'auto',prompt:'prompt',status:'idle',results:[]};
  const card={...workspace,id:'commerce',commercePromptMode:'auto'};
  const ctx={state:{commerceWorkspace:workspace},canvasLibrary:{activeCanvasId:'canvas'},settings:{provider:'custom',customBody:'{}',customResultPath:'original'},
    collectSettings(){},getApiKey:()=> 'fixture-key',renderCommerceWorkspace(){},render(){},save(){},
    selectedCommerceCard:()=>card,commerceWorkspaceReferences:()=>({imageRefs:[],imageRoles:[]}),commerceReferencePayload:()=>({imageRefs:[],imageRoles:[]}),
    commerceWorkspacePrompt:()=> 'prompt',commercePrompt:()=> 'prompt',sizeForImage:()=> '1024x1024',commerceOutputSize:()=> '1024x1024',
    nextPromptGeneration:()=>({}),promptHintFor:()=> 'hint',els:{commerceWorkspacePrompt:{value:'hint'}},
    cleanGeneratedPrompt:x=>x,promptResultText:()=> 'generated',pathGet:(data,path)=>data[path],uid:()=> 'result',
    writes:0,mutateCanvasById:(id,fn)=>{ctx.writes++;fn({commerceWorkspace:workspace,cards:[card]});},
    updateCard:(id,patch)=>{ctx.writes++;Object.assign(card,patch);},
    createCommerceResultCard:(card,url)=>{ctx.writes++;ctx.createdUrl=url;}};
  vm.createContext(ctx);return ctx;
}
for (const name of ['generateCommerceWorkspacePrompt','generateCommerceWorkspacePromo','generateCommercePrompt','generateCommercePromo']) {
  tests.push([`${name} discards responses after backup import replaces the library`,async()=>{
    const ctx=commerceFixture();let release;
    ctx.postJson=ctx.requestAgnesPrompt=()=>new Promise(resolve=>{release=resolve;});
    vm.runInContext(extract(app,name),ctx);const pending=ctx[name]();
    ctx.canvasLibrary={activeCanvasId:'canvas'};release({response:{original:'https://example.test/old.png'}});await pending;
    assert.equal(ctx.writes,0);
  }]);
}
for (const name of ['generateCommerceWorkspacePromo','generateCommercePromo','generateCustom']) {
  tests.push([`${name} pins custom response path while settings change`,async()=>{
    const ctx=commerceFixture();let release;
    ctx.cardRefs=()=>[];ctx.duplicateResultCard=(card,type,url)=>{ctx.writes++;ctx.createdUrl=url;};
    ctx.postJson=()=>new Promise(resolve=>{release=resolve;});
    vm.runInContext(extract(app,name),ctx);
    const pending=ctx[name]({id:'image',type:'image'},'fixture-key','prompt','canvas');
    ctx.settings.customResultPath='replacement';ctx.settings.provider='agnes';
    release({response:{original:'https://example.test/success.png'}});await pending;
    assert(ctx.writes>0);
    assert.notEqual(ctx.state.commerceWorkspace.status,'error');
    if(name==='generateCommerceWorkspacePromo')assert.equal(ctx.state.commerceWorkspace.results[0].url,'https://example.test/success.png');
    else assert.equal(ctx.createdUrl,'https://example.test/success.png');
  }]);
}
(async()=>{let failed=0;for(const [name,test] of tests){try{await test();console.log(`PASS ${name}`);}catch(error){failed++;console.error(`FAIL ${name}: ${error.message}`);}}if(failed)process.exitCode=1;})();
