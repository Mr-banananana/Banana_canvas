// Uses an isolated Edge profile and a local server; never calls a generation API.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const {spawn} = require('node:child_process');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function freePort() {
  const socket = net.createServer();
  await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve));
  const port = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  return port;
}
async function connect(url) {
  const ws = new WebSocket(url);
  await new Promise((resolve,reject) => {ws.onopen=resolve;ws.onerror=reject;});
  let seq=0;const pending=new Map();
  ws.onmessage = event => {
    const data=JSON.parse(event.data);const waiter=pending.get(data.id);
    if (!waiter) return;
    pending.delete(data.id);clearTimeout(waiter.timer);
    if(data.error)waiter.reject(new Error(JSON.stringify(data.error)));else waiter.resolve(data.result);
  };
  const send=(method,params={}) => new Promise((resolve,reject)=>{
    const id=++seq;
    const timer=setTimeout(()=>{pending.delete(id);reject(new Error(`CDP timeout: ${method}`));},15000);
    pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));
  });
  const evaluate=async expression => {
    const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
    if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  return {send,evaluate,close:()=>ws.close()};
}
async function waitFor(probe) {
  let last;
  for(let i=0;i<100;i++) {try {const value=await probe();if(value)return value;}catch(error){last=error;}await delay(100);}
  throw last || new Error('Timed out waiting for browser/server');
}
(async()=>{
  const port=await freePort(), debugPort=await freePort();
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'banana-browser-audit-'));
  const server=spawn(process.execPath,['server.js'],{env:{...process.env,HOST:'127.0.0.1',PORT:String(port)},windowsHide:true,stdio:'ignore'});
  let edge,cdp;
  try {
    await waitFor(async()=> (await fetch(`http://127.0.0.1:${port}/healthz`)).ok);
    const executable=process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    edge=spawn(executable,['--headless=new','--no-first-run','--disable-extensions','--disable-gpu',`--user-data-dir=${profile}`,`--remote-debugging-port=${debugPort}`,`http://127.0.0.1:${port}/`],{windowsHide:true,stdio:'ignore'});
    const target=await waitFor(async()=> (await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json()).find(item=>item.type==='page' && item.url.includes(`:${port}`)));
    cdp=await connect(target.webSocketDebuggerUrl);
    await waitFor(()=>cdp.evaluate('typeof state !== "undefined" && state.cards.length > 0'));
    const setup=await cdp.evaluate(`(async()=>{
      const canvas=document.createElement('canvas');canvas.width=400;canvas.height=400;
      const context=canvas.getContext('2d'), pixels=context.createImageData(400,400);
      crypto.getRandomValues(pixels.data.subarray(0,65536));
      for(let i=65536;i<pixels.data.length;i+=65536)crypto.getRandomValues(pixels.data.subarray(i,Math.min(i+65536,pixels.data.length)));
      context.putImageData(pixels,0,0);window.auditAsset=canvas.toDataURL('image/png');
      window.auditOrigin=canvasLibrary.activeCanvasId;
      createNewCanvas();
      // Mimic a large response arriving after its original canvas became inactive.
      mutateCanvasById(auditOrigin,target=>{target.commerceWorkspace.results.unshift({id:'audit-asset',url:auditAsset,mime:'image/png',status:'done'});});
      flushLocalSave();await Promise.all([...workspaceAssetWritePromises.values()]);flushLocalSave();
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));
      return {size:auditAsset.length,url:saved.canvases.find(item=>item.id===auditOrigin).commerceWorkspace.results[0].url,
        memory:canvasLibrary.canvases.find(item=>item.id===auditOrigin).commerceWorkspace.results[0].url===auditAsset};
    })()`);
    assert(setup.size>256*1024);assert.equal(setup.url,'banana-asset://audit-asset');assert(setup.memory);
    console.log('PASS browser: inactive canvas persists a real large PNG in IndexedDB and stores only a reference in localStorage');
    const firstLoad=await cdp.evaluate('performance.timeOrigin');
    await cdp.send('Page.reload');
    await waitFor(()=>cdp.evaluate(`performance.timeOrigin !== ${firstLoad} && typeof exportJson === 'function'`));
    await waitFor(()=>cdp.evaluate(`typeof canvasLibrary !== 'undefined' && canvasLibrary.canvases.some(canvas=>canvas.commerceWorkspace.results.some(result=>result.id==='audit-asset' && result.url.startsWith('data:')))`));
    console.log('PASS browser: refresh restores inactive canvas image bytes from IndexedDB');
    const backup=await cdp.evaluate(`(async()=>{
      let blob;const original=URL.createObjectURL,click=HTMLAnchorElement.prototype.click;
      URL.createObjectURL=value=>{blob=value;return original(value);};HTMLAnchorElement.prototype.click=function(){};
      try {await exportJson();return await blob.text();} finally {URL.createObjectURL=original;HTMLAnchorElement.prototype.click=click;}
    })()`);
    const parsed=JSON.parse(backup);const result=parsed.canvases.flatMap(canvas=>canvas.commerceWorkspace.results).find(result=>result.id==='audit-asset');
    assert(result.url.startsWith('data:image/png;base64,'));
    console.log('PASS browser: exported backup contains full image bytes');
    // Use a separate browser context with no source localStorage or IndexedDB.
    const browserInfo=await (await fetch(`http://127.0.0.1:${debugPort}/json/version`)).json();
    const browserConnection=await connect(browserInfo.webSocketDebuggerUrl);
    const context=await browserConnection.send('Target.createBrowserContext');
    const fresh=await browserConnection.send('Target.createTarget',{url:`http://127.0.0.1:${port}/`,browserContextId:context.browserContextId});
    browserConnection.close();
    const freshTarget=await waitFor(async()=> (await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json()).find(item=>item.id===fresh.targetId));
    cdp.close();cdp=await connect(freshTarget.webSocketDebuggerUrl);
    await waitFor(()=>cdp.evaluate('typeof state !== "undefined" && state.cards.length > 0 && !canvasLibrary.canvases.some(canvas=>canvas.commerceWorkspace.results.some(result=>result.id==="audit-asset"))'));
    await cdp.evaluate(`importJson({target:{files:[new File([${JSON.stringify(backup)}],'backup.json',{type:'application/json'})],value:'backup'}})`);
    await waitFor(()=>cdp.evaluate(`canvasLibrary.canvases.some(canvas=>canvas.commerceWorkspace.results.some(result=>result.id==='audit-asset' && result.url.startsWith('data:')))`));
    const recovered=await cdp.evaluate(`(async()=>{
      flushLocalSave();await Promise.all([...workspaceAssetWritePromises.values()]);flushLocalSave();
      const canvas=canvasLibrary.canvases.find(canvas=>canvas.commerceWorkspace.results.some(result=>result.id==='audit-asset'));
      switchCanvas(canvas.id);return state.commerceWorkspace.results.find(result=>result.id==='audit-asset').url;
    })()`);
    assert.equal(recovered,result.url);
    console.log('PASS browser: backup imports into empty browser storage and survives switching canvases');
    // Import a v1.0.5-style backup: its product task has IDs but no saved model.
    const legacyBackup={schema:2,activeCanvasId:'legacy',settings:{provider:'agnes',videoModel:'agnes-video-v2.0'},canvases:[{id:'legacy',name:'legacy',
      cards:[{id:'legacy-new',type:'video',model:'agnes-video-v2.0',prompt:'cat',status:'error',duration:15,videoResolution:'1080p'},
        {id:'legacy-task',type:'video',model:'agnes-video-v2.0',task:{video_id:'paid-old'},status:'running'}],
      productVideoWorkspace:{status:'running',task:{video_id:'paid-product-old'}}}]};
    await cdp.evaluate(`importJson({target:{files:[new File([${JSON.stringify(JSON.stringify(legacyBackup))}],'old.json',{type:'application/json'})],value:'old'}})`);
    await waitFor(()=>cdp.evaluate(`canvasLibrary.activeCanvasId==='legacy'`));
    assert.deepEqual(await cdp.evaluate(`({setting:settings.videoModel,model:findCard('legacy-new').model,duration:findCard('legacy-new').duration,resolution:findCard('legacy-new').videoResolution,
      task:findCard('legacy-task').task.model,product:state.productVideoWorkspace.task.model})`),
      {setting:'agnes-video-2.5-flash',model:'agnes-video-2.5-flash',duration:12,resolution:'720p',task:'agnes-video-v2.0',product:'agnes-video-v2.0'});
    console.log('PASS browser: old backup migrates new generations and preserves both old task models');
    // Simulate the old on-disk settings to exercise startup migration separately.
    await cdp.evaluate(`settings.videoModel='agnes-video-v2.0';state.productVideoWorkspace.task={video_id:'paid-product-old'};findCard('legacy-new').model='agnes-video-v2.0';
      flushLocalSave();localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));`);
    const legacyLoad=await cdp.evaluate('performance.timeOrigin');await cdp.send('Page.reload');
    await waitFor(()=>cdp.evaluate(`performance.timeOrigin!==${legacyLoad} && typeof findCard==='function' && canvasLibrary.activeCanvasId==='legacy'`));
    assert.deepEqual(await cdp.evaluate(`({setting:settings.videoModel,model:findCard('legacy-new').model,product:state.productVideoWorkspace.task.model})`),
      {setting:'agnes-video-2.5-flash',model:'agnes-video-2.5-flash',product:'agnes-video-v2.0'});
    console.log('PASS browser: startup migration preserves legacy product tasks with no stored model');
    const channelError=await cdp.evaluate(`(async()=>{
      const original=window.fetch;let calls=0,model;
      window.fetch=async(url,options)=>{calls++;model=JSON.parse(options.body).model;return new Response(JSON.stringify({error:'Upstream API request failed.',details:{status:503,response:{error:{code:'model_not_found',message:'No available channel for model '+model+' under group default (request id: screenshot-regression)'}}}}),{status:503,headers:{'content-type':'application/json'}});};
      try {els.apiKey.value='fixture-key';setApiKey('fixture-key');selectSingle('legacy-new');await generateSelected();return {calls,model,error:findCard('legacy-new').error,status:findCard('legacy-new').status};}
      finally {window.fetch=original;}
    })()`);
    assert.equal(channelError.calls,1);assert.equal(channelError.model,'agnes-video-2.5-flash');assert.equal(channelError.status,'error');assert.match(channelError.error,/没有可用通道/);assert.match(channelError.error,/screenshot-regression/);
    console.log('PASS browser: unavailable channel is actionable, preserves request ID and submits only once');
    const queueCancelled=await cdp.evaluate(`(async()=>{
      const original=window.fetch;let calls=0;
      window.fetch=async()=>{calls++;return new Response(JSON.stringify({error:'Upstream API request failed.',requestId:'queue-browser-proof',retryAfterSeconds:240,details:{status:503,response:{error:{code:'video_queue_full',message:'Video queue is full'}}}}),{status:503,headers:{'content-type':'application/json'}});};
      try {
        selectSingle('legacy-new');const pending=generateSelected();
        await new Promise(resolve=>setTimeout(resolve,30));
        const button=document.getElementById('cancelVideoWait'),visible=!button.classList.contains('hidden');
        const message=document.querySelector('#videoQueuePanel [data-queue-diagnostic]').value;button.click();await pending;
        return {calls,visible,message,stopped:findCard('legacy-new').error,hidden:button.classList.contains('hidden')};
      } finally {window.fetch=original;}
    })()`);
    assert.equal(queueCancelled.calls,1);assert(queueCancelled.visible);assert(queueCancelled.hidden);assert.match(queueCancelled.message,/queue-browser-proof/);assert.match(queueCancelled.stopped,/停止本次视频等待/);
    console.log('PASS browser: real queue countdown exposes a working stop button and never resubmits after cancellation');
    const imageUI=await cdp.evaluate(`(()=>{const image=createCard('image',{prompt:'product'});selectSingle(image.id);renderInspector();
      return {request:agnesImageRequest(image,'fixture-key','product'),menu:els.sizePickerMenu.innerHTML,summary:els.sizePickerButton.textContent};})()`);
    assert(!('quality'in imageUI.request));assert(!imageUI.menu.includes('data-size-action="imageQuality"'));assert(!imageUI.summary.includes('中'));
    console.log('PASS browser: Agnes image quality is absent from requests and hidden in generation controls');
    const paidBackup={schema:2,activeCanvasId:'paid',settings:{provider:'agnes',videoModel:'agnes-video-2.5'},canvases:[{id:'paid',name:'paid',
      cards:[{id:'paid-new',type:'video',model:'agnes-video-2.5',prompt:'cat',duration:15,videoResolution:'1080p'},
        {id:'paid-task',type:'video',model:'agnes-video-2.5',task:{video_id:'existing-standard'},status:'running'}],
      productVideoWorkspace:{status:'running',task:{video_id:'existing-standard-product'}}}]};
    await cdp.evaluate(`importJson({target:{files:[new File([${JSON.stringify(JSON.stringify(paidBackup))}],'paid.json',{type:'application/json'})],value:'paid'}})`);
    await waitFor(()=>cdp.evaluate(`canvasLibrary.activeCanvasId==='paid'`));
    const paidMigration=await cdp.evaluate(`(()=>{selectSingle('paid-new');renderInspector();return {
      setting:settings.videoModel,readOnly:els.videoModel.readOnly,model:findCard('paid-new').model,duration:findCard('paid-new').duration,
      resolution:findCard('paid-new').videoResolution,options:[...els.cardModel.options].map(o=>o.value),
      task:findCard('paid-task').task.model,product:state.productVideoWorkspace.task.model};})()`);
    assert.deepEqual(paidMigration,{setting:'agnes-video-2.5-flash',readOnly:true,model:'agnes-video-2.5-flash',duration:12,resolution:'720p',
      options:['agnes-video-2.5-flash'],task:'agnes-video-2.5',product:'agnes-video-2.5'});
    console.log('PASS browser: paid settings and new nodes migrate to Flash while existing task queries retain their original model');
    const providerToggle=await cdp.evaluate(`(()=>{els.provider.value='custom';els.provider.dispatchEvent(new Event('change'));
      const editable=!els.videoModel.readOnly;els.videoModel.value='private-video';collectSettings();
      const customModel=settings.videoModel;els.provider.value='agnes';els.provider.dispatchEvent(new Event('change'));collectSettings();
      return {editable,customModel,readOnly:els.videoModel.readOnly,agnesModel:settings.videoModel};})()`);
    assert.deepEqual(providerToggle,{editable:true,customModel:'private-video',readOnly:true,agnesModel:'agnes-video-2.5-flash'});
    console.log('PASS browser: switching providers permits custom models and restores the Flash-only Agnes setting');
    const regenerated=await cdp.evaluate(`(async()=>{const card=findCard('paid-task');card.task=null;card.model='agnes-video-2.5';card.duration=15;card.videoResolution='1080p';card.prompt='cat';
      const original=window.fetch;let request;
      window.fetch=async(url,options)=>{request=JSON.parse(options.body);return new Response(JSON.stringify({error:'test stop',details:{status:503,response:{code:'model_not_found',message:'test stop'}}}),{status:503,headers:{'content-type':'application/json'}});};
      try {selectSingle(card.id);await generateSelected();return {model:request.model,resolution:request.resolution,duration:request.duration,storedModel:card.model,storedResolution:card.videoResolution};}
      finally {window.fetch=original;}})()`);
    assert.deepEqual(regenerated,{model:'agnes-video-2.5-flash',resolution:'720p',duration:12,storedModel:'agnes-video-2.5-flash',storedResolution:'720p'});
    console.log('PASS browser: a finished standard task starts a new Flash generation with valid parameters without requiring a reload');
    const documentedFailure=await cdp.evaluate(`(async()=>{const card=findCard('paid-task');card.task={video_id:'video_doc_failed',model:'agnes-video-2.5-flash',agnesRegion:'global'};card.status='running';
      const originalFetch=window.fetch,originalSleep=sleep;let queries=0;sleep=async()=>{};
      window.fetch=async()=>{queries++;return new Response(JSON.stringify({ok:true,response:{id:'task_doc_failed',video_id:'video_doc_failed',object:'video',status:'failed',progress:100,error:{message:'Invalid reference media'}}}),{status:200,headers:{'content-type':'application/json'}});};
      try {selectSingle(card.id);await generateSelected();return {queries,task:card.task,status:card.status,error:card.error};}
      finally {window.fetch=originalFetch;sleep=originalSleep;}})()`);
    assert.equal(documentedFailure.queries,1);assert.equal(documentedFailure.task,null);assert.equal(documentedFailure.status,'error');assert.match(documentedFailure.error,/Invalid reference media/);
    console.log('PASS browser: documented failed video query ends the node task and displays the provider reason');
    const delayedResult=await cdp.evaluate(`(async()=>{const card=findCard('paid-task');card.task=null;card.status='idle';
      const originalFetch=window.fetch,originalSleep=sleep;let creates=0,queries=0,earlyAssets=0;sleep=async()=>{};
      window.fetch=async(url)=>{let response;
        if(url==='/api/agnes/video'){creates++;response={id:'task_doc_waiting',video_id:'video_doc_waiting',status:'queued',url:'https://example.test/premature.mp4'};}
        else{queries++;earlyAssets+=state.cards.filter(c=>c.resultUrl==='https://example.test/premature.mp4').length;
          response=queries===1?{status:'in_progress',progress:50,url:'https://example.test/premature.mp4'}:{status:'completed',progress:100,internal_status:'pending',internal_progress:0,url:'https://example.test/doc-ready.mp4'};}
        return new Response(JSON.stringify({ok:true,response}),{status:200,headers:{'content-type':'application/json'}});};
      try {selectSingle(card.id);await generateSelected();return {creates,queries,earlyAssets,task:card.task,status:card.status,url:card.resultUrl};}
      finally {window.fetch=originalFetch;sleep=originalSleep;}})()`);
    assert.deepEqual(delayedResult,{creates:1,queries:2,earlyAssets:0,task:null,status:'done',url:'https://example.test/doc-ready.mp4'});
    console.log('PASS browser: video URL is delivered only after completed status, regardless of pending internal fields');
    const failedProduct=await cdp.evaluate(`(async()=>{const workspace=state.productVideoWorkspace;workspace.task={video_id:'video_product_failed',model:'agnes-video-2.5-flash',agnesRegion:'global'};workspace.status='running';
      const originalFetch=window.fetch,originalSleep=sleep;let queries=0;sleep=async()=>{};
      window.fetch=async()=>{queries++;return new Response(JSON.stringify({ok:true,response:{id:'task_product_failed',video_id:'video_product_failed',object:'video',status:'failed',progress:100,error:{message:'Invalid reference media'}}}),{status:200,headers:{'content-type':'application/json'}});};
      try {await generateProductVideo();return {queries,task:workspace.task,status:workspace.status,error:workspace.error};}
      finally {window.fetch=originalFetch;sleep=originalSleep;}})()`);
    assert.equal(failedProduct.queries,1);assert.equal(failedProduct.task,null);assert.equal(failedProduct.status,'error');assert.match(failedProduct.error,/Invalid reference media/);
    console.log('PASS browser: documented failed product video query clears the task and stops polling');
  } finally {
    if(cdp) {try{await cdp.send('Browser.close');}catch{}cdp.close();}
    if(edge)edge.kill();server.kill();
    // Leave the isolated profile in the OS temp folder if Edge still holds files.
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
