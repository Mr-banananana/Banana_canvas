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
  } finally {
    if(cdp) {try{await cdp.send('Browser.close');}catch{}cdp.close();}
    if(edge)edge.kill();server.kill();
    // Leave the isolated profile in the OS temp folder if Edge still holds files.
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
