const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/app.js','utf8');
function extract(name){const match=source.match(new RegExp(`^(?:async )?function ${name}\\([^]*?^}`, 'm'));assert(match,name);return match[0];}
const tests=[];
function nodeFixture(response){
 const card={id:'video',type:'video',model:'agnes-video-2.5-flash',aspect:'16:9',duration:5,videoResolution:'720p'};
 const ctx={card,canvasLibrary:{activeCanvasId:'canvas'},settings:{agnesRegion:'global'},sizeForVideo:()=> '1280x720',parseSize:()=>({width:1280,height:720}),
  normalizeVideoFrameCount:()=>121,durationToFrames:()=>121,resolveVideoModel:()=> 'agnes-video-2.5-flash',cardRefs:()=>[],
  updateCard:(id,patch)=>Object.assign(card,patch),requestAgnesVideo:async()=>({response}),results:[],polls:0,
  duplicateResultCard:(...args)=>ctx.results.push(args),pollVideo:async()=>ctx.polls++};
 vm.createContext(ctx);vm.runInContext(extract('generateAgnesVideo'),ctx);return ctx;
}
function productFixture(response){
 const workspace={productRef:{url:'https://example.test/a.png'},prompt:'cat',results:[],task:null};
 const ctx={state:{productVideoWorkspace:workspace},canvasLibrary:{activeCanvasId:'canvas'},generationLocks:new Set(),settings:{provider:'agnes',agnesRegion:'global'},
  collectSettings(){},getApiKey:()=> 'fixture-key',renderProductVideoWorkspace(){},save(){},mutateCanvasById:(id,fn)=>fn({productVideoWorkspace:workspace}),
  productVideoRequest:()=>({model:'agnes-video-2.5-flash',prompt:'cat'}),requestAgnesVideo:async()=>({response}),
  storeProductVideoResult:url=>workspace.results.push(url),pollProductVideo:async()=>ctx.polls++,polls:0};
 vm.createContext(ctx);vm.runInContext(extract('generateProductVideo'),ctx);return ctx;
}
tests.push(['queued node response with a URL remains a task until completed',async()=>{
 const ctx=nodeFixture({video_id:'video_waiting',id:'task_waiting',status:'queued',url:'https://example.test/not-ready.mp4'});
 await ctx.generateAgnesVideo(ctx.card,'fixture-key','cat','canvas');assert.equal(ctx.results.length,0);assert.equal(ctx.polls,1);assert.equal(ctx.card.task.video_id,'video_waiting');
}]);
tests.push(['failed node create response cannot publish its URL as a successful video',async()=>{
 const ctx=nodeFixture({id:'task_failed',video_id:'video_failed',status:'failed',url:'https://example.test/not-ready.mp4',error:{message:'Invalid reference media'}});
 await assert.rejects(ctx.generateAgnesVideo(ctx.card,'fixture-key','cat','canvas'),/Invalid reference media/);assert.equal(ctx.results.length,0);assert.equal(ctx.polls,0);
}]);
tests.push(['completed node create response delivers its top-level result URL',async()=>{
 const ctx=nodeFixture({status:'completed',url:'https://example.test/ready.mp4',internal_status:'pending',internal_progress:0});
 await ctx.generateAgnesVideo(ctx.card,'fixture-key','cat','canvas');assert.equal(ctx.results.length,1);assert.equal(ctx.results[0][2],'https://example.test/ready.mp4');assert.equal(ctx.polls,0);
}]);
tests.push(['queued product response with a URL remains a task until completed',async()=>{
 const ctx=productFixture({video_id:'video_waiting',status:'queued',url:'https://example.test/not-ready.mp4'});
 await ctx.generateProductVideo();assert.equal(ctx.state.productVideoWorkspace.results.length,0);assert.equal(ctx.polls,1);assert.equal(ctx.state.productVideoWorkspace.task.video_id,'video_waiting');
}]);
tests.push(['failed product create response stops with the provider reason',async()=>{
 const ctx=productFixture({video_id:'video_failed',status:'failed',url:'https://example.test/not-ready.mp4',error:{message:'Invalid reference media'}});
 await ctx.generateProductVideo();assert.equal(ctx.state.productVideoWorkspace.results.length,0);assert.equal(ctx.polls,0);assert.equal(ctx.state.productVideoWorkspace.status,'error');assert.match(ctx.state.productVideoWorkspace.error,/Invalid reference media/);
}]);
tests.push(['terminal polling failure clears a node task and preserves the reason',async()=>{
 const card={id:'video',task:{video_id:'video_failed',model:'agnes-video-2.5-flash'},status:'running'};
 const ctx={canvasLibrary:{activeCanvasId:'canvas'},settings:{agnesRegion:'global',pollInterval:12000},normalizePollInterval:()=>12000,cloneData:x=>JSON.parse(JSON.stringify(x)),
  findCanvasCard:()=>card,sleep:async()=>{},postJson:async()=>({response:{id:'task_failed',video_id:'video_failed',object:'video',status:'failed',progress:100,error:{message:'Invalid reference media'}}}),
  updateCard:(id,patch)=>Object.assign(card,patch),isRateLimitError:()=>false};
 vm.createContext(ctx);vm.runInContext(extract('pollVideo'),ctx);
 await assert.rejects(ctx.pollVideo('video','fixture-key','canvas'),/Invalid reference media/);assert.equal(card.task,null);
}]);
(async()=>{let failed=0;for(const [name,test]of tests){try{await test();console.log('PASS '+name);}catch(error){failed++;console.error('FAIL '+name+': '+error.message);}}if(failed)process.exitCode=1;})();
