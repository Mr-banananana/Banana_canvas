const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('public/app.js', 'utf8');
function functions(...names) {
  return names.map(name => {
    const match = source.match(new RegExp(`^(?:async )?function ${name}\\([^]*?^}`, 'm'));
    assert(match, `Missing function ${name}`);
    return match[0];
  }).join('\n');
}
function fixture(records = []) {
  const result = { id: 'asset', url: 'data:image/png;base64,actual-image' };
  const state = { cards: [], edges: [], groups: [], commerceWorkspace: { results: [{ ...result }] }, productVideoWorkspace: { results: [] } };
  const library = { activeCanvasId: 'one', canvases: [{ id: 'one', commerceWorkspace: state.commerceWorkspace, productVideoWorkspace: state.productVideoWorkspace }] };
  const ctx = {
    console, state, canvasLibrary: library, CANVAS_LIBRARY_SCHEMA: 2,
    settings: {}, persistedWorkspaceAssetUrls: new Map([['one:commerce:asset', result.url]]), workspaceAssetWritePromises: new Map(),
    ASSET_REF_PREFIX: 'banana-asset://', INLINE_ASSET_STORAGE_LIMIT: 5, ASSET_STORE_NAME: 'assets',
    cloneData: value => JSON.parse(JSON.stringify(value)),
    uid: () => 'generated', normalizeCanvasGroup: value => value,
    createCanvasRecord: (name, record) => ({ ...record, name }), canvasSnapshot: () => ({}),
    scheduleLocalSave() {}, persistWorkspaceAssetsForCanvas() {},
    assetDatabaseAvailable: () => true,
    openAssetDatabase: async () => ({ transaction: () => ({ objectStore: () => ({ getAll() {
      const request = { result: records }; queueMicrotask(() => request.onsuccess()); return request;
    } }) }) }),
    canvasStateFor: id => id === library.activeCanvasId ? state : library.canvases.find(item => item.id === id),
    exported: null, clicked: false, alerted: '',
    Blob: class { constructor(parts) { ctx.exported = JSON.parse(parts[0]); } },
    URL: { createObjectURL: () => 'blob:backup', revokeObjectURL() {} },
    document: { createElement: () => ({ click() { ctx.clicked = true; } }) },
    alert: message => { ctx.alerted = message; },
    flushLocalSave() {
      library.canvases[0] = { ...library.canvases[0], commerceWorkspace: state.commerceWorkspace, productVideoWorkspace: state.productVideoWorkspace };
    }
  };
  vm.createContext(ctx);
  vm.runInContext(functions('assetRecordKey', 'workspaceStorageSnapshot', 'captureCurrentCanvas', 'captureLocalSavePayload', 'hydratePersistedWorkspaceAssets', 'exportJson', 'validateCanvasImport', 'importJson'), ctx);
  return ctx;
}
const tests = [
  ['saving starts large-asset persistence for inactive canvases too', async () => {
    const ctx = fixture();
    const background = { results: [{ id: 'large', url: 'data:image/png;base64,background' }] };
    ctx.canvasLibrary.canvases.push({ id: 'background', commerceWorkspace: background, productVideoWorkspace: { results: [] } });
    const writes = [];
    ctx.persistWorkspaceAssetsForCanvas = (id, commerce) => writes.push([id, commerce.results[0]?.url]);
    ctx.captureLocalSavePayload();
    assert(writes.some(([id, url]) => id === 'background' && url === background.results[0].url));
  }],
  ['memory canvas retains full asset URLs when saving or switching canvases', async () => {
    const ctx = fixture();
    assert.match(ctx.captureCurrentCanvas().commerceWorkspace.results[0].url, /^data:/);
  }],
  ['local storage serializes references for active and inactive canvases without changing memory', async () => {
    const ctx = fixture();
    ctx.canvasLibrary.canvases.push({ id: 'two', commerceWorkspace: { results: [{ id:'other', url:'data:image/png;base64,other' }] }, productVideoWorkspace: { results: [] } });
    ctx.persistedWorkspaceAssetUrls.set('two:commerce:other', 'data:image/png;base64,other');
    const payload = ctx.captureLocalSavePayload();
    assert.equal(payload.library.canvases[0].commerceWorkspace.results[0].url, 'banana-asset://asset');
    assert.equal(payload.library.canvases[1].commerceWorkspace.results[0].url, 'banana-asset://other');
    assert.match(ctx.canvasLibrary.canvases[0].commerceWorkspace.results[0].url, /^data:/);
    assert.match(ctx.canvasLibrary.canvases[1].commerceWorkspace.results[0].url, /^data:/);
  }],
  ['hydration never resurrects results absent from the saved/imported canvas', async () => {
    const ctx = fixture([{ key:'one:commerce:removed', canvasId:'one', kind:'commerce', result:{ id:'removed', url:'data:old' } }]);
    ctx.state.commerceWorkspace.results = [];
    await ctx.hydratePersistedWorkspaceAssets();
    assert.equal(ctx.state.commerceWorkspace.results.length, 0);
  }],
  ['hydration never overwrites an inline asset imported with the same ID', async () => {
    const ctx = fixture([{ key:'one:commerce:asset', canvasId:'one', kind:'commerce', result:{ id:'asset', url:'data:outdated' } }]);
    const original = ctx.state.commerceWorkspace.results[0].url;
    await ctx.hydratePersistedWorkspaceAssets();
    assert.equal(ctx.state.commerceWorkspace.results[0].url, original);
  }],
  ['portable JSON export hydrates local references before downloading', async () => {
    const ctx = fixture([{ key:'one:commerce:asset', canvasId:'one', kind:'commerce', result:{ id:'asset', url:'data:image/png;base64,backup' } }]);
    ctx.state.commerceWorkspace.results[0].url = 'banana-asset://asset';
    await ctx.exportJson();
    assert.match(ctx.exported.canvases[0].commerceWorkspace.results[0].url, /^data:/);
    assert.equal(ctx.clicked, true);
  }],
  ['export reports missing local assets instead of producing an incomplete backup', async () => {
    const ctx = fixture();
    ctx.state.commerceWorkspace.results[0].url = 'banana-asset://missing';
    await ctx.exportJson();
    assert.equal(ctx.clicked, false);
    assert.match(ctx.alerted, /资产|资源/);
  }],
  ['reused IDs with a new image remain inline until that exact image is persisted', async () => {
    const ctx = fixture();
    ctx.state.commerceWorkspace.results[0].url = 'data:image/png;base64,new-import';
    const snapshot = ctx.workspaceStorageSnapshot(ctx.state.commerceWorkspace, 'one', 'commerce');
    assert.match(snapshot.results[0].url, /new-import$/);
  }],
  ['invalid imports and duplicate IDs are rejected before replacing existing data', async () => {
    const ctx = fixture();
    const original = JSON.stringify(ctx.state);
    for (const input of [{canvases:[null]}, {cards:[null]}, {cards:[{id:'same'},{id:'same'}]}, {canvases:[{id:'same'},{id:'same'}]}]) {
      ctx.FileReader = class { readAsText() { this.result=JSON.stringify(input);this.onload(); } };
      ctx.importJson({target:{files:[{}],value:'backup'}});
      assert.match(ctx.alerted, /导入失败/);
      assert.equal(JSON.stringify(ctx.state), original);
    }
  }]
];
(async () => {
  let failed = 0;
  for (const [name, test] of tests) {
    try { await test(); console.log(`PASS ${name}`); }
    catch (error) { failed++; console.error(`FAIL ${name}: ${error.message}`); }
  }
  if (failed) process.exitCode = 1;
})();
