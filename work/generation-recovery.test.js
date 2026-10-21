const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const app=fs.readFileSync('public/app.js','utf8'),server=fs.readFileSync('server.js','utf8');
function extract(source,name){const match=source.match(new RegExp(`^(?:async )?function ${name}\\([^]*?^}`, 'm'));assert(match,`Missing ${name}`);return match[0];}
function context(values,source,names){const ctx=vm.createContext(values);vm.runInContext(names.map(name=>extract(source,name)).join('\n'),ctx);return ctx;}
const tests=[];
tests.push(['Agnes image generation never forwards the rejected quality parameter',async()=>{
 for(const refs of [[],['https://example.test/product.png']]){
  let body;const ctx=context({parseBody:async()=>({apiKey:'fixture',prompt:'product',quality:'high',size:'1K',imageRefs:refs}),requireApiKey:()=> 'fixture',agnesBaseFor:()=> 'https://api.test',agnesHeaders:()=>({}),compactObject:x=>x,fetchJson:async(url,opts)=>{body=JSON.parse(opts.body);return {data:[{url:'https://example.test/result.png'}]};},sendJson(){}},server,['handleAgnesImage']);
  await ctx.handleAgnesImage({},{});assert(!('quality'in body));assert.equal(body.extra_body.image?.length||0,refs.length);
 }
}]);
tests.push(['Retry-After seconds and HTTP-date are preserved without an early retry cap',()=>{
 const now=Date.parse('2026-10-21T00:00:00Z');const ctx=context({Date},server,['parseRetryAfter']);
 assert.equal(ctx.parseRetryAfter('240',now),240);assert.equal(ctx.parseRetryAfter('Wed, 21 Oct 2026 00:03:00 GMT',now),180);assert.equal(ctx.parseRetryAfter('garbage',now),0);
 const front=context({},app,['videoQueueRetryDelay']);assert.equal(front.videoQueueRetryDelay({retryAfterSeconds:240},0),240000);assert(front.videoQueueRetryDelay({},0)>=60000);
}]);
tests.push(['queue rejection is not mislabeled as a network failure',()=>{
 const ctx=context({},app,['isUpstreamNetworkError']);assert.equal(ctx.isUpstreamNetworkError({status:503,retryable:true,upstreamCode:'video_queue_full'}),false);
}]);
tests.push(['structured non-queue errors and already-created tasks are never replayed',()=>{
 const ctx=context({},app,['isVideoQueueFullError']);
 assert.equal(ctx.isVideoQueueFullError({status:503,upstreamCode:'model_not_found',message:'video queue is full'}),false);
 assert.equal(ctx.isVideoQueueFullError({status:503,upstreamCode:'video_queue_full',submissionUnknown:true}),false);
 assert.equal(ctx.isVideoQueueFullError({status:503,upstreamCode:'video_queue_full',data:{details:{response:{video_id:'already-paid'}}}}),false);
}]);
tests.push(['persistent queue message retains site, model and upstream request ID',()=>{
 const ctx=context({settings:{agnesRegion:'global'}},app,['videoQueueFullMessage']);
 const message=ctx.videoQueueFullMessage(0,3,3,{upstreamMessage:'Video queue is full (request id: queue-proof-123)',upstreamCode:'video_queue_full'},{model:'agnes-video-2.5-flash',agnesRegion:'china'});
 assert.match(message,/queue-proof-123/);assert.match(message,/agnes-video-2.5-flash/);assert.match(message,/api\.agnes-ai\.cn/);
}]);
function gateFixture(){let now=100000;const ctx=context({crypto,videoSubmissionGates:new Map(),Date:{now:()=>now},setTimeout,clearTimeout},server,['withVideoSubmissionSlot']);ctx.tick=ms=>now+=ms;return ctx;}
tests.push(['video submissions for one site and credential cannot run concurrently',async()=>{
 const ctx=gateFixture();let resolve,requests=0;
 const first=ctx.withVideoSubmissionSlot('fixture','global',()=>{requests++;return new Promise(done=>resolve=done);});
 await assert.rejects(ctx.withVideoSubmissionSlot('fixture','global',async()=>{requests++;}),error=>error.upstreamCode==='local_video_submission_busy');
 resolve({video_id:'accepted'});await first;assert.equal(requests,1);
}]);
tests.push(['queue cooldown blocks fresh clicks from other nodes but not another credential',async()=>{
 const ctx=gateFixture();let requests=0;
 await assert.rejects(ctx.withVideoSubmissionSlot('fixture','global',async()=>{requests++;throw Object.assign(new Error('queue'),{status:503,upstreamCode:'video_queue_full',retryAfterSeconds:240});}));
 ctx.tick(61000);
 await assert.rejects(ctx.withVideoSubmissionSlot('fixture','global',async()=>{requests++;}),error=>error.retryAfterSeconds>=179);
 await ctx.withVideoSubmissionSlot('other','global',async()=>({video_id:'other-task'}));assert.equal(requests,1);
 ctx.tick(180000);await ctx.withVideoSubmissionSlot('fixture','global',async()=>({video_id:'accepted'}));
}]);
tests.push(['Bearer copied with the credential is normalized before authorization',()=>{
 const ctx=context({},server,['requireApiKey']);assert.equal(ctx.requireApiKey({apiKey:' "Bearer fixture-key" '}),'fixture-key');
 assert.throws(()=>ctx.requireApiKey({apiKey:'bad\r\nheader'}));
}]);
function retryFixture(){let now=0;const ctx=context({Date:{now:()=>now},settings:{agnesRegion:'global'},videoSubmissionWaits:new Map(),sleep:async ms=>{now+=ms;},postJson:async()=>({response:{video_id:'accepted'}})},app,['isVideoQueueFullError','videoQueueRetryDelay','videoQueueFullMessage','cancelVideoQueueWait','requestAgnesVideo']);ctx.time=()=>now;return ctx;}
tests.push(['automatic retry never submits before the complete upstream cooldown',async()=>{
 const ctx=retryFixture();let calls=0;ctx.postJson=async()=>{if(++calls===1)throw Object.assign(new Error('queue'),{status:503,upstreamCode:'video_queue_full',retryAfterSeconds:240});assert(ctx.time()>=240000);return {response:{video_id:'accepted'}};};
 await ctx.requestAgnesVideo({model:'agnes-video-2.5-flash'});assert.equal(calls,2);
}]);
tests.push(['persistent saturation stops after bounded retries and preserves diagnostics',async()=>{
 const ctx=retryFixture();let calls=0;ctx.postJson=async()=>{calls++;throw Object.assign(new Error('queue'),{status:503,upstreamCode:'video_queue_full',requestId:'persist-proof'});};
 await assert.rejects(ctx.requestAgnesVideo({model:'agnes-video-2.5-flash'}),error=>/persist-proof/.test(error.message));assert.equal(calls,4);assert.equal(ctx.time(),420000);
}]);
tests.push(['stop waiting cancels retries without cancelling an accepted task',async()=>{
 const ctx=retryFixture();let calls=0;ctx.postJson=async()=>{calls++;throw Object.assign(new Error('queue'),{status:503,upstreamCode:'video_queue_full'});};
 await assert.rejects(ctx.requestAgnesVideo({model:'agnes-video-2.5-flash'},{waitKey:'one',onQueueWait:()=>ctx.cancelVideoQueueWait('one')}),error=>error.code==='VIDEO_WAIT_CANCELLED');
 assert.equal(calls,1);assert.equal(ctx.videoSubmissionWaits.size,0);
}]);
tests.push(['queue rejection containing a task ID is returned for polling without another POST',async()=>{
 const ctx=retryFixture();let calls=0;ctx.postJson=async()=>{calls++;throw Object.assign(new Error('queue'),{status:503,upstreamCode:'video_queue_full',data:{details:{response:{video_id:'already-created'}}}});};
 const result=await ctx.requestAgnesVideo({model:'agnes-video-2.5-flash'});assert.equal(result.response.video_id,'already-created');assert.equal(calls,1);
}]);
tests.push(['very long Retry-After stops automatic waiting without an early resubmission',async()=>{
 const ctx=retryFixture();let calls=0;ctx.postJson=async()=>{calls++;throw Object.assign(new Error('queue'),{status:503,upstreamCode:'video_queue_full',retryAfterSeconds:1200});};
 await assert.rejects(ctx.requestAgnesVideo({model:'agnes-video-2.5-flash'}));assert.equal(calls,1);assert.equal(ctx.time(),0);
}]);
tests.push(['HTTP 200 error envelopes are classified and Retry-After/request ID survive',async()=>{
 const ctx=context({URL,Date,proxyFor:()=>null,requestUpstream:async()=>({status:200,headers:{'content-type':'application/json','retry-after':'240','x-request-id':'header-proof'},body:JSON.stringify({error:{code:'video_queue_full',message:'Video queue is full'}})})},server,['parseRetryAfter','fetchJson']);
 await assert.rejects(ctx.fetchJson('https://api.test/v1/videos',{method:'POST'}),error=>error.status===503&&error.retryAfterSeconds===240&&error.requestId==='header-proof');
}]);
tests.push(['root and nested task identifiers in queue errors never create a duplicate job',async()=>{
 for(const existing of [{id:'task_existing'}, {error:{task_id:'nested-task'}}, {error:{video_id:'nested-video'}}, {error:{id:'task_nested'}}]) {
  const ctx=retryFixture();let calls=0;ctx.postJson=async()=>{calls++;throw Object.assign(new Error('queue'),{status:503,upstreamCode:'video_queue_full',data:{details:{response:existing}}});};
  const result=await ctx.requestAgnesVideo({model:'agnes-video-2.5-flash'});assert(result.response.video_id||result.response.task_id);assert.equal(calls,1);
 }
}]);
tests.push(['ambiguous identifiers stop retries without being mistaken for a video task',async()=>{
 const ctx=retryFixture();let calls=0;ctx.postJson=async()=>{calls++;throw Object.assign(new Error('queue'),{status:503,upstreamCode:'video_queue_full',data:{details:{response:{id:'unknown-identifier'}}}});};
 await assert.rejects(ctx.requestAgnesVideo({}),error=>error.submissionUnknown);assert.equal(calls,1);
}]);
tests.push(['digits in request IDs never turn a parameter error into timeout or rate limiting',()=>{
 const ctx=context({},app,['isRateLimitError','isUpstreamTimeout']);const error={status:400,upstreamStatus:400,message:'quality unsupported (request id: 20261021429504)'};
 assert.equal(ctx.isRateLimitError(error),false);assert.equal(ctx.isUpstreamTimeout(error),false);
}]);
(async()=>{let failed=0;for(const [name,test]of tests){try{await test();console.log(`PASS ${name}`);}catch(error){failed++;console.error(`FAIL ${name}: ${error.message}`);}}if(failed)process.exitCode=1;})();
