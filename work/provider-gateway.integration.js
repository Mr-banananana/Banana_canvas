// Real local HTTP routes; the provider boundary is replaced before any request.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),http=require('node:http'),path=require('node:path');
let service,now=Date.parse('2026-10-21T00:00:00Z'),mode='image',upstreamCalls=0;
class Clock extends Date {static now(){return now;}}
const ctx=vm.createContext({require:name=>name==='http'?{...http,createServer:handler=>(service=http.createServer(handler))}:require(name),__dirname:path.resolve('.'),Buffer,URL,Date:Clock,setTimeout,clearTimeout,
 console:{log(){},error:console.error},process:{env:{PORT:'0',HOST:'127.0.0.1'}},upstream:async(url,options)=>{
  upstreamCalls++;const body=options.body?JSON.parse(options.body):{};
  assert.match(options.headers.Authorization,/^Bearer fixture-/);
  assert(!options.headers.Authorization.includes('Bearer Bearer'));
  if(mode==='image'){assert(!('quality'in body));return {status:200,headers:{'content-type':'application/json'},body:JSON.stringify({data:[{url:'https://example.test/image.png'}]})};}
  if(mode==='queue')return {status:503,headers:{'retry-after':new Date(now+240000).toUTCString(),'content-type':'application/json','x-request-id':'gateway-queue-proof'},body:JSON.stringify({error:{code:'video_queue_full',message:'Video queue is full'}})};
  if(mode==='task-with-error')return {status:503,headers:{'content-type':'application/json'},body:JSON.stringify({video_id:'paid-existing',error:{code:'video_queue_full',message:'queue'}})};
  if(mode==='envelope')return {status:200,headers:{'content-type':'application/json'},body:JSON.stringify({error:{code:'video_queue_full',message:'Video queue is full (request id: envelope-proof)'}})};
  return {status:200,headers:{'content-type':'application/json'},body:JSON.stringify({video_id:'accepted'})};
}});
(async()=>{
 try {
  vm.runInContext(fs.readFileSync('server.js','utf8'),ctx);
  vm.runInContext('requestUpstream=(...args)=>upstream(...args)',ctx);
  if(!service.listening)await new Promise(resolve=>service.once('listening',resolve));
  const base=`http://127.0.0.1:${service.address().port}`;
  const post=async(endpoint,key='fixture-one')=>{const response=await fetch(base+endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({apiKey:`Bearer ${key}`,prompt:'product',model:endpoint.endsWith('image')?'agnes-image-2.1-flash':'agnes-video-2.5-flash',quality:'high'})});return {status:response.status,data:await response.json()};};
  assert.equal((await post('/api/agnes/image')).status,200);
  console.log('PASS HTTP: image request strips unsupported quality and normalizes Bearer input');
  mode='queue';const first=await post('/api/agnes/video');assert.equal(first.status,503);assert.equal(first.data.retryAfterSeconds,240);assert.equal(first.data.requestId,'gateway-queue-proof');
  const before=upstreamCalls;const blocked=await post('/api/agnes/video');assert.equal(blocked.status,429);assert.equal(upstreamCalls,before);assert.equal(blocked.data.retryAfterSeconds,240);
  console.log('PASS HTTP: upstream HTTP-date cooldown is shared across separate requests without another provider POST');
  mode='success';assert.equal((await post('/api/agnes/video','fixture-two')).status,200);
  console.log('PASS HTTP: another credential remains independent');
  now+=241000;mode='task-with-error';const task=await post('/api/agnes/video');assert.equal(task.status,200);assert.equal(task.data.response.video_id,'paid-existing');
  console.log('PASS HTTP: rejected response with an existing video ID is returned for polling');
  mode='envelope';const envelope=await post('/api/agnes/video','fixture-three');assert.equal(envelope.status,503);assert.equal(envelope.data.upstreamCode,'video_queue_full');assert.equal(envelope.data.requestId,'envelope-proof');
  console.log('PASS HTTP: HTTP 200 error envelope retains its real queue reason and request ID');
 } finally {if(service){service.closeAllConnections();await new Promise(resolve=>service.close(resolve));}}
})().catch(error=>{console.error(error);process.exitCode=1;});
