$app = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '..\public\app.js')
$styles = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '..\public\styles.css')
$html = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '..\public\index.html')
$server = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '..\server.js')
$package = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '..\package.json')
$readme = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '..\README.md')
$fixturePath = Join-Path $PSScriptRoot 'canvas-performance-fixture.js'
$fixture = if (Test-Path $fixturePath) { Get-Content -Raw -LiteralPath $fixturePath } else { '' }
$dockerfile = if (Test-Path (Join-Path $PSScriptRoot '..\Dockerfile')) { Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '..\Dockerfile') } else { '' }
$render = if (Test-Path (Join-Path $PSScriptRoot '..\render.yaml')) { Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '..\render.yaml') } else { '' }
$gitignore = if (Test-Path (Join-Path $PSScriptRoot '..\.gitignore')) { Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '..\.gitignore') } else { '' }
$startBat = if (Test-Path (Join-Path $PSScriptRoot '..\start.bat')) { Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '..\start.bat') } else { '' }
$startPs1 = if (Test-Path (Join-Path $PSScriptRoot '..\start.ps1')) { Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '..\start.ps1') } else { '' }
$startCommand = if (Test-Path (Join-Path $PSScriptRoot '..\start.command')) { Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '..\start.command') } else { '' }
$startSh = if (Test-Path (Join-Path $PSScriptRoot '..\start.sh')) { Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '..\start.sh') } else { '' }
$assetGrid = [regex]::Match($styles, '\.commerce-asset-grid\s*\{[^}]*\}').Value
$pointerDownBlock = [regex]::Match($app, 'els\.viewport\.addEventListener\("pointerdown", event => \{[\s\S]*?if \(event\.button === 2\)').Value
$wheelBlock = [regex]::Match($app, 'els\.viewport\.addEventListener\("wheel", event => \{[\s\S]*?\}, \{ passive: false \}\);').Value
$minimapBlock = [regex]::Match($app, 'function renderMinimap\(\) \{[\s\S]*?\n\}').Value
$cardSelectBlock = [regex]::Match($app, 'const cardEl = event\.target\.closest\("\.card"\);[\s\S]*?scheduleInteractionFrame\(\{ selection: true, dock: true[^}]*\}\);').Value
$blankSelectionBlock = [regex]::Match($app, 'setSelected\(\[\]\);[\s\S]*?state\.selectionBox = \{[\s\S]*?scheduleInteractionFrame\(\{ selection: true, dock: true[^}]*\}\);').Value
$lassoMoveBlock = [regex]::Match($app, 'if \(state\.selectionBox\) \{[\s\S]*?currentClientY = event\.clientY;[\s\S]*?scheduleInteractionFrame\(\{ selection: true, dock: true[^}]*\}\);').Value
$lassoUpBlock = [regex]::Match($app, 'if \(state\.selectionBox\) \{[\s\S]*?state\.selectionBox = null;[\s\S]*?scheduleInteractionFrame\(\{ selection: true, dock: true[^}]*\}\);').Value
$pointerMoveBlock = [regex]::Match($app, 'window\.addEventListener\("pointermove", event => \{[\s\S]*?\n\s*\}\);').Value
$pointerUpBlock = [regex]::Match($app, 'window\.addEventListener\("pointerup", event => \{[\s\S]*?\n\s*\}\);').Value
$pointerCancelBlock = [regex]::Match($app, 'window\.addEventListener\("pointercancel", (?:\(\)|event) => \{[\s\S]*?\n\s*\}\);').Value
$pendingDragBlock = [regex]::Match($app, 'function beginPendingCardDrag\(card, event\) \{[\s\S]*?\n\}').Value
$commitPendingDragBlock = [regex]::Match($app, 'function commitPendingDrag\(event\) \{[\s\S]*?\n\}').Value
$pendingClickBlock = [regex]::Match($app, 'function commitPendingCardClick\(event\) \{[\s\S]*?\n\}').Value
$duplicateBlock = [regex]::Match($app, 'function duplicateSelectedNodes\(\) \{[\s\S]*?\n\}').Value
$escapeBlock = [regex]::Match($app, 'if \(event\.key === "Escape"\) \{[\s\S]*?return;[\s\S]*?\n\s*\}').Value
$cancelInteractionBlock = [regex]::Match($app, 'function cancelCanvasInteraction\(\) \{[\s\S]*?\n\}').Value
$lassoSelectionBlock = [regex]::Match($app, 'function lassoSelectionIds\(box, rect\) \{[\s\S]*?\n\}').Value
$updateDraggedCardsBlock = [regex]::Match($app, 'function updateDraggedCards\(clientX, clientY, altKey = false\) \{[\s\S]*?\n\}').Value
$flushInteractionBlock = [regex]::Match($app, 'function flushInteractionFrame\(flags\) \{[\s\S]*?\n\}').Value
$connectionPointerBlock = [regex]::Match($app, 'const output = event\.target\.closest\("\.port\.output"\);[\s\S]*?scheduleInteractionFrame\(\{ edges: true \}\);').Value
$edgePointerBlock = [regex]::Match($app, 'const edgePathNode = event\.target\.closest\("\[data-edge-id\]"\);[\s\S]*?return;').Value
$connectionMoveBlock = [regex]::Match($app, 'if \(state\.connecting\) \{[\s\S]*?setConnectionTarget\([\s\S]*?scheduleInteractionFrame\(\{ edges: true \}\);[\s\S]*?return;').Value
$connectionUpBlock = [regex]::Match($app, 'if \(state\.connecting\) \{[\s\S]*?showConnectionCreateMenu\(from, event\.clientX, event\.clientY\);[\s\S]*?return;').Value
$deleteKeyBlock = [regex]::Match($app, 'function setupKeyboardShortcuts\(\) \{[\s\S]*?if \(event\.key === "Delete" \|\| event\.key === "Backspace"\) \{[\s\S]*?return;[\s\S]*?\n\s*\}').Value
$deleteEdgeBlock = [regex]::Match($app, 'function deleteSelectedEdge\(\) \{[\s\S]*?\n\}').Value
$stagePointerGuardBlock = [regex]::Match($app, 'els\.stage\.addEventListener\("pointerdown", event => \{[\s\S]*?\n\s*\}\);').Value
$connectionMenuPointerBlock = [regex]::Match($app, 'els\.connectionCreateMenu\.addEventListener\("pointerdown", event =>[\s\S]*?\);').Value
$minimapClientBlock = [regex]::Match($app, 'function minimapClientToWorld\(clientX, clientY\) \{[\s\S]*?\n\}').Value
$minimapPointBlock = [regex]::Match($app, 'function minimapPointToViewport\(clientX, clientY\) \{[\s\S]*?\n\}').Value
$beginMinimapBlock = [regex]::Match($app, 'function beginMinimapPan\(event\) \{[\s\S]*?\n\}').Value
$updateMinimapBlock = [regex]::Match($app, 'function updateMinimapPan\(event\) \{[\s\S]*?\n\}').Value
$endMinimapBlock = [regex]::Match($app, 'function endMinimapPan\(event\) \{[\s\S]*?\n\}').Value
$normalizeEdgesBlock = [regex]::Match($app, 'function normalizeCanvasEdges\(edges\) \{[\s\S]*?\n\}').Value
$renderBlock = [regex]::Match($app, 'function render\(\) \{[\s\S]*?\n\}').Value
$setConnectionTargetBlock = [regex]::Match($app, 'function setConnectionTarget\(cardId, validity\) \{[\s\S]*?\n\}').Value
$selectEdgeBlock = [regex]::Match($app, 'function selectEdge\(id\) \{[\s\S]*?\n\}').Value
$edgeKeyBlock = [regex]::Match($app, 'function handleEdgeKeydown\(event\) \{[\s\S]*?\n\}').Value
$minimapKeyBlock = [regex]::Match($app, 'function handleMinimapKeydown\(event\) \{[\s\S]*?\n\}').Value
$beginHistoryTransactionBlock = [regex]::Match($app, 'function beginHistoryTransaction\(label\) \{[\s\S]*?\n\}').Value
$commitHistoryTransactionBlock = [regex]::Match($app, 'function commitHistoryTransaction\(\) \{[\s\S]*?\n\}').Value
$cancelHistoryTransactionBlock = [regex]::Match($app, 'function cancelHistoryTransaction\(\) \{[\s\S]*?\n\}').Value
$beginPendingCardDragBlock = [regex]::Match($app, 'function beginPendingCardDrag\(card, event\) \{[\s\S]*?\n\}').Value
$switchCanvasBlock = [regex]::Match($app, 'function switchCanvas\(id\) \{[\s\S]*?\n\}').Value
$createNewCanvasBlock = [regex]::Match($app, 'function createNewCanvas\(\) \{[\s\S]*?\n\}').Value
$deleteActiveCanvasBlock = [regex]::Match($app, 'function deleteActiveCanvas\(\) \{[\s\S]*?\n\}').Value
$exportJsonBlock = [regex]::Match($app, 'function exportJson\(\) \{[\s\S]*?\n\}').Value
$importJsonBlock = [regex]::Match($app, 'function importJson\(event\) \{[\s\S]*?\n\}').Value
$setWorkspaceModeBlock = [regex]::Match($app, 'function setWorkspaceMode\(mode\) \{[\s\S]*?\n\}').Value
$postJsonBlock = [regex]::Match($app, 'async function postJson\(url, body\) \{[\s\S]*?\n\}').Value
$flushLocalSaveBlock = [regex]::Match($app, 'function flushLocalSave\(\) \{[\s\S]*?\n\}').Value
$captureLocalSavePayloadBlock = [regex]::Match($app, 'function captureLocalSavePayload\([^)]*\) \{[\s\S]*?\n\}').Value
$commitScheduledLocalSaveBlock = [regex]::Match($app, 'function commitScheduledLocalSave\([^)]*\) \{[\s\S]*?\n\}').Value
$scheduleLocalSaveBlock = [regex]::Match($app, 'function scheduleLocalSave\([^)]*\) \{[\s\S]*?\n\}').Value
$persistCanvasLibraryBlock = [regex]::Match($app, 'function persistCanvasLibrary\(payload\) \{[\s\S]*?\n\}').Value
$showPersistenceErrorBlock = [regex]::Match($app, 'function showPersistenceError\([^)]*\) \{[\s\S]*?\n\}').Value
$clearPersistenceErrorBlock = [regex]::Match($app, 'function clearPersistenceError\(\) \{[\s\S]*?\n\}').Value
$retryPendingSettingsBlock = [regex]::Match($app, 'function retryPendingSettings\(\) \{[\s\S]*?\n\}').Value
$persistSettingsBlock = [regex]::Match($app, 'function persistSettings\(\) \{[\s\S]*?\n\}').Value
$canvasStateForBlock = [regex]::Match($app, 'function canvasStateFor\(canvasId\) \{[\s\S]*?\n\}').Value
$mutateCanvasByIdBlock = [regex]::Match($app, 'function mutateCanvasById\(canvasId, mutate, renderActive = render\) \{[\s\S]*?\n\}').Value
$settleHistoryBlock = [regex]::Match($app, 'function settleHistoryInteractionForRestore\(\) \{[\s\S]*?\n\}').Value
$undoCanvasBlock = [regex]::Match($app, 'function undoCanvas\(\) \{[\s\S]*?\n\}').Value
$redoCanvasBlock = [regex]::Match($app, 'function redoCanvas\(\) \{[\s\S]*?\n\}').Value
$restoreNamedSnapshotBlock = [regex]::Match($app, 'function restoreNamedCanvasSnapshot\(id\) \{[\s\S]*?\n\}').Value
$performanceFixturePass = $false
if ($fixture) {
  $performanceFixtureProbe = @'
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync(process.env.CANVAS_PERFORMANCE_FIXTURE_PATH, "utf8");
const hiddenContext = { window: {} };
vm.runInNewContext(source, hiddenContext);
if ("createCanvasPerformanceFixture" in hiddenContext.window) process.exit(1);
const context = { window: { __CANVAS_PERFORMANCE_FIXTURE__: true } };
vm.runInNewContext(source, context);
const createFixture = context.window.createCanvasPerformanceFixture;
if (typeof createFixture !== "function") process.exit(1);
for (const count of [100, 300]) {
  const result = createFixture(count);
  if (!result || result.cards.length !== count || result.edges.length !== count - 1) process.exit(1);
  if (result.cards[0].id !== "perf_0" || result.cards[count - 1].id !== `perf_${count - 1}`) process.exit(1);
  if (result.cards[20].x !== 0 || result.cards[20].y !== 280) process.exit(1);
  if (result.cards.some(card => card.resultUrl || card.status !== "idle")) process.exit(1);
  if (result.edges.some((edge, index) => edge.from !== `perf_${index}` || edge.to !== `perf_${index + 1}`)) process.exit(1);
}
if (createFixture(7).cards.length !== 100) process.exit(1);
'@
  $env:CANVAS_PERFORMANCE_FIXTURE_PATH = $fixturePath
  $env:CANVAS_PERFORMANCE_FIXTURE_PROBE = $performanceFixtureProbe
  & node -e 'eval(process.env.CANVAS_PERFORMANCE_FIXTURE_PROBE)'
  $performanceFixturePass = $LASTEXITCODE -eq 0
  Remove-Item Env:\CANVAS_PERFORMANCE_FIXTURE_PATH
  Remove-Item Env:\CANVAS_PERFORMANCE_FIXTURE_PROBE
}
$edgeNormalizationFixturePass = $false
if ($normalizeEdgesBlock) {
  $edgeNormalizationProbe = @"
let edgeSequence = 0;
function uid() { return "edge_generated_" + (++edgeSequence); }
$normalizeEdgesBlock
const result = normalizeCanvasEdges([
  { id: "keep", from: "a", to: "b" },
  { id: 7, from: "b", to: "c" },
  { id: 7, from: "c", to: "d" },
  { id: "keep", from: "d", to: "e" },
  { id: "", from: "e", to: "f" },
  { from: "f", to: "g" },
  { id: 9, from: "g", to: "h" },
  { id: "9", from: "h", to: "i" }
]);
const ids = result.map(edge => edge.id);
if (ids[0] !== "keep" || ids[1] !== "7" || ids[7] !== "9") process.exit(1);
if (ids.some(id => typeof id !== "string" || !id.length)) process.exit(1);
if (new Set(ids).size !== ids.length) process.exit(1);
"@
  $env:EDGE_NORMALIZATION_PROBE = $edgeNormalizationProbe
  & node -e 'eval(process.env.EDGE_NORMALIZATION_PROBE)'
  $edgeNormalizationFixturePass = $LASTEXITCODE -eq 0
  Remove-Item Env:\EDGE_NORMALIZATION_PROBE
}

$historyTransactionFixturePass = $false
if ($beginHistoryTransactionBlock -and $commitHistoryTransactionBlock -and $cancelHistoryTransactionBlock) {
  $historyTransactionProbe = @"
function cloneData(value) { return JSON.parse(JSON.stringify(value)); }
function snapshotKey(snapshot) { return JSON.stringify(snapshot || {}); }
function canvasSnapshot() { return { cards: cloneData(state.cards), edges: [], groups: [], viewport: cloneData(state.viewport) }; }
function renderHistoryMenu() {}
function pushHistorySnapshot(snapshot) {
  state.historyPast.push(cloneData(snapshot));
  state.historyPast = state.historyPast.slice(-50);
  state.historyFuture = [];
}
function assert(condition) { if (!condition) process.exit(1); }
const state = {
  cards: [{ id: "card_1", x: 0, y: 0 }],
  viewport: { x: 300, y: 160, scale: 1 },
  historyTransaction: null,
  historyPast: [],
  historyFuture: [{ cards: [] }],
  historyRestoring: false
};
let lastCanvasSnapshot = canvasSnapshot();
$beginHistoryTransactionBlock
$commitHistoryTransactionBlock
$cancelHistoryTransactionBlock
assert(beginHistoryTransaction("drag") === true);
state.cards[0].x = 24;
assert(commitHistoryTransaction() === true);
assert(state.historyPast.length === 1 && state.historyPast[0].cards[0].x === 0);
assert(state.historyFuture.length === 0);
assert(commitHistoryTransaction() === false && state.historyPast.length === 1);
assert(beginHistoryTransaction("pan") === true);
assert(commitHistoryTransaction() === false && state.historyPast.length === 1);
assert(beginHistoryTransaction("minimap") === true);
state.viewport.x = 120;
assert(commitHistoryTransaction() === true && state.historyPast.length === 2);
assert(beginHistoryTransaction("drag") === true);
state.cards[0].x = 48;
state.cards[0].x = 24;
cancelHistoryTransaction();
assert(state.historyPast.length === 2 && state.historyTransaction === null);
"@
  $env:HISTORY_TRANSACTION_PROBE = $historyTransactionProbe
  & node -e 'eval(process.env.HISTORY_TRANSACTION_PROBE)'
  $historyTransactionFixturePass = $LASTEXITCODE -eq 0
  Remove-Item Env:\HISTORY_TRANSACTION_PROBE
}

$lazySaveFixturePass = $false
if ($captureLocalSavePayloadBlock -and $commitScheduledLocalSaveBlock -and $scheduleLocalSaveBlock) {
  $immutableSaveProbe = @"
let cloneCalls = 0;
function cloneData(value) { cloneCalls += 1; return JSON.parse(JSON.stringify(value)); }
const CANVAS_LIBRARY_SCHEMA = "schema-v1";
const state = { cards: [{ id: "a-card", value: "live" }], groups: [], historyTransaction: null };
let canvasLibrary = {
  schema: "schema-v1",
  activeCanvasId: "canvas-a",
  canvases: [
    { id: "canvas-a", cards: [{ id: "a-card", value: "library" }] },
    { id: "canvas-b", cards: [{ id: "b-card", value: "untouched" }] }
  ]
};
let captureCalls = 0;
function captureCurrentCanvas() {
  captureCalls += 1;
  return { id: canvasLibrary.activeCanvasId, cards: JSON.parse(JSON.stringify(state.cards)) };
}
function canvasSnapshot() { return { cards: JSON.parse(JSON.stringify(state.cards)) }; }
function normalizeCanvasGroup(group) { return group; }
const committed = [];
function commitLocalState(payload) { committed.push(JSON.parse(JSON.stringify(payload))); }
let queuedMarker = null;
let scheduleCalls = 0;
function debouncedLocalSave(marker) { scheduleCalls += 1; queuedMarker = marker; }
let transactionCommits = 0;
function commitHistoryTransaction() { transactionCommits += 1; state.historyTransaction = null; }
function assert(condition) { if (!condition) process.exit(1); }
$captureLocalSavePayloadBlock
$commitScheduledLocalSaveBlock
$scheduleLocalSaveBlock

scheduleLocalSave("canvas-a");
scheduleLocalSave("canvas-a");
scheduleLocalSave("canvas-a");
assert(captureCalls === 0 && cloneCalls === 0 && scheduleCalls === 3);
assert(queuedMarker.canvasId === "canvas-a" && Object.keys(queuedMarker).length === 1);

state.historyTransaction = { label: "wheel" };
commitScheduledLocalSave(queuedMarker);
assert(transactionCommits === 1 && captureCalls === 1 && cloneCalls === 1);
assert(committed.length === 1 && committed[0].snapshot.cards[0].value === "live");

captureCalls = 0;
cloneCalls = 0;
queuedMarker = null;
state.historyTransaction = { label: "drag" };
commitScheduledLocalSave({ canvasId: "canvas-a" });
assert(captureCalls === 0 && cloneCalls === 0 && committed.length === 1);
assert(queuedMarker.canvasId === "canvas-a");
state.historyTransaction = null;
commitScheduledLocalSave(queuedMarker);
assert(captureCalls === 1 && cloneCalls === 1 && committed.length === 2);

captureCalls = 0;
cloneCalls = 0;
canvasLibrary.canvases[1].cards[0].value = "origin-result";
scheduleLocalSave("canvas-b");
assert(captureCalls === 0 && cloneCalls === 0);
commitScheduledLocalSave(queuedMarker);
const inactivePayload = committed[2];
assert(captureCalls === 1 && cloneCalls === 1);
assert(inactivePayload.canvasId === "canvas-b" && inactivePayload.activeCanvasId === "canvas-a");
assert(inactivePayload.snapshot.cards[0].value === "live");
assert(inactivePayload.library.canvases[1].cards[0].value === "origin-result");
"@
  $env:IMMUTABLE_SAVE_PROBE = $immutableSaveProbe
  & node -e 'eval(process.env.IMMUTABLE_SAVE_PROBE)'
  $lazySaveFixturePass = $LASTEXITCODE -eq 0
  Remove-Item Env:\IMMUTABLE_SAVE_PROBE
}

$canvasOwnershipFixturePass = $false
if ($canvasStateForBlock -and $mutateCanvasByIdBlock) {
  $canvasOwnershipProbe = @"
const state = { cards: [{ id: "active-card", status: "idle" }] };
const canvasLibrary = {
  activeCanvasId: "canvas-active",
  canvases: [
    { id: "canvas-active", cards: state.cards },
    { id: "canvas-origin", cards: [{ id: "origin-card", status: "running" }] }
  ]
};
let renders = 0;
let immediateSaves = 0;
const scheduledCanvasIds = [];
function render() { renders += 1; }
function save() { immediateSaves += 1; }
function scheduleLocalSave(canvasId) { scheduledCanvasIds.push(canvasId); }
function assert(condition) { if (!condition) process.exit(1); }
$canvasStateForBlock
$mutateCanvasByIdBlock
mutateCanvasById("canvas-origin", target => {
  target.cards[0].status = "done";
  target.cards.push({ id: "result-card", status: "done" });
});
assert(state.cards.length === 1 && state.cards[0].status === "idle");
assert(canvasLibrary.canvases[1].cards.length === 2);
assert(renders === 0 && immediateSaves === 0 && scheduledCanvasIds.length === 1);
assert(scheduledCanvasIds[0] === "canvas-origin");
mutateCanvasById("canvas-active", target => { target.cards[0].status = "done"; });
assert(renders === 1 && immediateSaves === 1 && scheduledCanvasIds.length === 1);
"@
  $env:CANVAS_OWNERSHIP_PROBE = $canvasOwnershipProbe
  & node -e 'eval(process.env.CANVAS_OWNERSHIP_PROBE)'
  $canvasOwnershipFixturePass = $LASTEXITCODE -eq 0
  Remove-Item Env:\CANVAS_OWNERSHIP_PROBE
}

$persistenceFailureFixturePass = $false
if ($persistCanvasLibraryBlock) {
  $persistenceFailureProbe = @"
const STORAGE_KEY = "canvas-state";
let pendingLocalSavePayload = null;
let shouldThrow = true;
let writes = 0;
let shownErrors = 0;
let clearedErrors = 0;
const localStorage = { setItem() { if (shouldThrow) throw new Error("quota"); writes += 1; } };
function showPersistenceError() { shownErrors += 1; }
function clearPersistenceError() { clearedErrors += 1; }
function renderCanvasLibrary() {}
function assert(condition) { if (!condition) process.exit(1); }
$persistCanvasLibraryBlock
const payload = { library: { schema: "schema-v1", activeCanvasId: "canvas-a", canvases: [] } };
assert(persistCanvasLibrary(payload) === false);
assert(pendingLocalSavePayload === payload && shownErrors === 1 && writes === 0);
shouldThrow = false;
assert(persistCanvasLibrary(pendingLocalSavePayload) === true);
assert(pendingLocalSavePayload === null && clearedErrors === 1 && writes === 1);
"@
  $env:PERSISTENCE_FAILURE_PROBE = $persistenceFailureProbe
  & node -e 'eval(process.env.PERSISTENCE_FAILURE_PROBE)'
  $persistenceFailureFixturePass = $LASTEXITCODE -eq 0
  Remove-Item Env:\PERSISTENCE_FAILURE_PROBE
}

$settingsRetryFixturePass = $false
if ($showPersistenceErrorBlock -and $clearPersistenceErrorBlock -and $retryPendingSettingsBlock -and $persistSettingsBlock) {
  $settingsRetryProbe = @"
const SETTINGS_KEY = "settings";
const settings = { apiKey: "retained" };
let pendingLocalSavePayload = null;
let pendingSettingsPayload = null;
let shouldThrow = true;
let writes = 0;
const els = {
  saveState: {
    textContent: "",
    classList: {
      values: new Set(),
      add(value) { this.values.add(value); },
      remove(value) { this.values.delete(value); },
      contains(value) { return this.values.has(value); }
    }
  }
};
const localStorage = { setItem() { if (shouldThrow) throw new Error("quota"); writes += 1; } };
function assert(condition) { if (!condition) process.exit(1); }
$showPersistenceErrorBlock
$clearPersistenceErrorBlock
$retryPendingSettingsBlock
$persistSettingsBlock
assert(persistSettings() === false);
assert(pendingSettingsPayload === JSON.stringify(settings));
assert(els.saveState.classList.contains("error"));
pendingLocalSavePayload = { library: {} };
shouldThrow = false;
assert(retryPendingSettings() === true && writes === 1 && pendingSettingsPayload === null);
assert(els.saveState.classList.contains("error"));
pendingLocalSavePayload = null;
clearPersistenceError();
assert(!els.saveState.classList.contains("error"));
"@
  $env:SETTINGS_RETRY_PROBE = $settingsRetryProbe
  & node -e 'eval(process.env.SETTINGS_RETRY_PROBE)'
  $settingsRetryFixturePass = $LASTEXITCODE -eq 0
  Remove-Item Env:\SETTINGS_RETRY_PROBE
}

$historySettlementFixturePass = $false
if ($settleHistoryBlock -and $undoCanvasBlock) {
  $historySettlementProbe = @"
function cloneData(value) { return JSON.parse(JSON.stringify(value)); }
const events = [];
const interactionController = { value: { mode: "dragging" } };
const state = {
  cards: [{ id: "card", x: 20 }], edges: [], groups: [], viewport: { x: 0, y: 0, scale: 1 },
  historyPast: [{ cards: [{ id: "card", x: -10 }], edges: [], groups: [], viewport: { x: 0, y: 0, scale: 1 } }],
  historyFuture: [], historyRestoring: false
};
function canvasSnapshot() { return { cards: cloneData(state.cards), edges: [], groups: [], viewport: cloneData(state.viewport) }; }
function cancelCanvasInteraction() { events.push("cancel"); interactionController.value.mode = "idle"; state.cards[0].x = 0; }
function flushLocalSave() { events.push("flush"); }
function restoreCanvasState(snapshot) { events.push("restore"); state.cards = cloneData(snapshot.cards); }
function render() { events.push("render"); }
let throwOnSave = false;
function save() { events.push("save"); if (throwOnSave) throw new Error("save failed"); }
function assert(condition) { if (!condition) process.exit(1); }
$settleHistoryBlock
$undoCanvasBlock
undoCanvas();
assert(events.slice(0, 3).join(",") === "cancel,flush,restore");
assert(state.cards[0].x === -10 && state.historyRestoring === false);
state.historyPast.push({ cards: [{ id: "card", x: -20 }], edges: [], groups: [], viewport: { x: 0, y: 0, scale: 1 } });
throwOnSave = true;
try { undoCanvas(); } catch {}
assert(state.historyRestoring === false);
"@
  $env:HISTORY_SETTLEMENT_PROBE = $historySettlementProbe
  & node -e 'eval(process.env.HISTORY_SETTLEMENT_PROBE)'
  $historySettlementFixturePass = $LASTEXITCODE -eq 0
  Remove-Item Env:\HISTORY_SETTLEMENT_PROBE
}

$checks = @(
  @{
    Name = 'performance fixture is deterministic gated and connects adjacent cards'
    Pass = $performanceFixturePass -and
      $fixture -match '__CANVAS_PERFORMANCE_FIXTURE__' -and
      $fixture -match 'window\.createCanvasPerformanceFixture\s*=\s*createCanvasPerformanceFixture' -and
      $fixture -notmatch 'state\.cards|localStorage|dispatchEvent'
  },
  @{
    Name = 'local performance fixture loader is explicit and cache busted'
    Pass = $html -match 'canvasPerformanceFixture' -and
      $html -match 'new Set\(\["localhost", "127\.0\.0\.1", "::1"\]\)' -and
      $html -match 'if \(!localHosts\.has\(window\.location\.hostname\) \|\| !\["100", "300"\]\.includes\(fixtureCount\)\) return;' -and
      $html -match 'window\.__CANVAS_PERFORMANCE_FIXTURE__ = true' -and
      $html -match 'document\.createElement\("script"\)' -and
      $html -match 'canvas-performance-fixture\.js\?v=canvas-interactions-2'
  },
  @{
    Name = 'canvas engine and app scripts are cache busted together'
    Pass = $html -match 'canvas-engine\.js\?v=canvas-interactions-2' -and
      $html -match 'app\.js\?v=canvas-interactions-2'
  },
  @{
    Name = 'README documents optimized canvas interactions'
    Pass = $readme -match '左键.*框选' -and
      $readme -match 'Shift.*框选' -and
      $readme -match '4px.*拖动' -and
      $readme -match '16px.*网格.*对齐参考线' -and
      $readme -match 'Alt.*绕过吸附' -and
      $readme -match 'Ctrl\+D' -and
      $readme -match '点击连线.*Delete' -and
      $readme -match '小地图.*点击定位.*拖动导航.*方向键' -and
      $readme -match '中键.*平移画布' -and
      $readme -match '普通滚轮.*垂直平移.*Ctrl\+滚轮.*缩放' -and
      $readme -match 'Ctrl\+Z.*撤销.*Ctrl\+Shift\+Z.*重做' -and
      $readme -match '仅保存在当前浏览器本地.*画布切换器'
  },
  @{
    Name = 'debounced saves capture one immutable canvas-owned payload at commit time'
    Pass = $lazySaveFixturePass -and
      $scheduleLocalSaveBlock -notmatch 'captureLocalSavePayload|cloneData' -and
      $commitScheduledLocalSaveBlock -match 'captureLocalSavePayload'
  },
  @{
    Name = 'async canvas mutations remain owned by their origin canvas'
    Pass = $canvasOwnershipFixturePass -and
      $app -match 'const originCanvasId = canvasLibrary\.activeCanvasId' -and
      $app -match 'generateCustom\([^,]+,[^,]+,[^,]+,\s*originCanvasId\)' -and
      $app -match 'generateAgnesImage\([^,]+,[^,]+,[^,]+,\s*originCanvasId\)' -and
      $app -match 'generateAgnesVideo\([^,]+,[^,]+,[^,]+,\s*originCanvasId\)' -and
      $app -match 'storeProductVideoResult\([^)]*originCanvasId\)' -and
      $app -match 'createCommerceResultCard\([^)]*originCanvasId\)'
  },
  @{
    Name = 'history restores settle interactions and always reset restoration state'
    Pass = $historySettlementFixturePass -and
      $redoCanvasBlock -match 'settleHistoryInteractionForRestore\(\)' -and
      $restoreNamedSnapshotBlock -match 'settleHistoryInteractionForRestore\(\)' -and
      $redoCanvasBlock -match 'try\s*\{[\s\S]*?finally\s*\{[\s\S]*?historyRestoring = false' -and
      $restoreNamedSnapshotBlock -match 'try\s*\{[\s\S]*?finally\s*\{[\s\S]*?historyRestoring = false'
  },
  @{
    Name = 'local storage failures retain retryable state and surface one status'
    Pass = $persistenceFailureFixturePass -and $settingsRetryFixturePass -and
      $app -match '本地保存失败'
  },
  @{
    Name = 'gesture history commits once per completed interaction'
    Pass = $historyTransactionFixturePass -and
      $beginPendingCardDragBlock -match 'beginHistoryTransaction\("drag"\)' -and
      $pointerDownBlock -match 'beginHistoryTransaction\("pan"\)' -and
      $beginMinimapBlock -match 'beginHistoryTransaction\("minimap"\)' -and
      $pointerUpBlock -match 'commitHistoryTransaction\(\)[\s\S]*?scheduleLocalSave\(\)' -and
      $endMinimapBlock -match 'commitHistoryTransaction\(\)[\s\S]*?scheduleLocalSave\(\)'
  },
  @{
    Name = 'click no-op and cancelled gestures add no history'
    Pass = $pendingClickBlock -match 'cancelHistoryTransaction\(\)' -and
      $cancelInteractionBlock -match 'cancelHistoryTransaction\(\)' -and
      $commitHistoryTransactionBlock -match 'snapshotKey\([^)]+\)\s*===\s*transaction\.key[\s\S]*?return false'
  },
  @{
    Name = 'wheel bursts commit one transaction after idle'
    Pass = $wheelBlock -match 'beginHistoryTransaction\("wheel"\)' -and
      $wheelBlock -match 'scheduleLocalSave\(\)' -and
      $wheelBlock -notmatch '\bsave\(\)' -and
      $app -match 'createDebouncedCommit\([^,]+,\s*300\)' -and
      $app -match 'historyTransaction(?:\?\.|\.)label === "wheel"[\s\S]*?commitHistoryTransaction\(\)'
  },
  @{
    Name = 'local canvas saving is debounced during navigation'
    Pass = $app -match 'function scheduleLocalSave\(' -and
      $app -match 'function flushLocalSave\(' -and
      $app -match 'createDebouncedCommit\([^,]+,\s*300\)' -and
      $flushLocalSaveBlock -match 'debouncedLocalSave\.cancel\(\)[\s\S]*?captureLocalSavePayload\(canvasLibrary\.activeCanvasId\)' -and
      $pointerMoveBlock -notmatch '\bsave\(|persistCanvasLibrary\(|localStorage\.setItem' -and
      $wheelBlock -notmatch '\bsave\(|persistCanvasLibrary\(|localStorage\.setItem'
  },
  @{
    Name = 'pending local saves flush at state and async boundaries'
    Pass = $switchCanvasBlock -match 'flushLocalSave\(\)' -and
      $createNewCanvasBlock -match 'flushLocalSave\(\)' -and
      $deleteActiveCanvasBlock -match 'flushLocalSave\(\)' -and
      $exportJsonBlock -match 'flushLocalSave\(\)' -and
      $importJsonBlock -match 'flushLocalSave\(\)' -and
      $setWorkspaceModeBlock -match 'flushLocalSave\(\)' -and
      $postJsonBlock -match 'flushLocalSave\(\)' -and
      $app -match 'addEventListener\("beforeunload", flushLocalSave\)' -and
      $app -match 'addEventListener\("pagehide", flushLocalSave\)'
  },
  @{
    Name = 'pointer movement uses incremental interaction frames'
    Pass = $app -match 'function scheduleInteractionFrame\(' -and
      $app -match 'function flushInteractionFrame\(' -and
      $app -match 'if \(state\.drag\)[\s\S]*?scheduleInteractionFrame' -and
      $app -notmatch 'if \(state\.drag\)[\s\S]{0,500}?render\(\)'
  },
  @{
    Name = 'interaction frames preserve media DOM'
    Pass = $app -match 'function updateCardTransforms\(' -and
      $app -match 'node\.style\.transform' -and
      $app -match 'function updateCardTransforms\(\)\s*\{(?:(?!innerHTML)[\s\S])*?\n\}'
  },
  @{
    Name = 'selection frames synchronize the dock inspector'
    Pass = $app -match 'if \(dirty\.selection\) \{[\s\S]*?syncInteractionInspector\(\);' -and
      $app -match 'function syncInteractionInspector\(\)' -and
      $app -match 'renderInspector\(\);'
  },
  @{
    Name = 'selection-changing interaction frames invalidate the minimap'
    Pass = $cardSelectBlock -match 'scheduleInteractionFrame\(\{ selection: true, dock: true, minimap: true \}\);' -and
      $blankSelectionBlock -match 'scheduleInteractionFrame\(\{ selection: true, dock: true, minimap: true \}\);' -and
      $lassoMoveBlock -match 'scheduleInteractionFrame\(\{ selection: true, dock: true, minimap: true \}\);' -and
      $lassoUpBlock -match 'scheduleInteractionFrame\(\{ selection: true, dock: true, minimap: true \}\);' -and
      $pointerCancelBlock -match 'cancelCanvasInteraction\(\)' -and
      $cancelInteractionBlock -match 'scheduleInteractionFrame\(\{[^}]*selection: true[^}]*minimap: true[^}]*\}\);'
  },
  @{
    Name = 'drag begins only after a four screen pixel threshold'
    Pass = $app -match 'DRAG_THRESHOLD_PX\s*=\s*4' -and
      $app -match 'pendingDrag:\s*null' -and
      $commitPendingDragBlock -match 'Math\.hypot\(' -and
      $commitPendingDragBlock -match 'DRAG_THRESHOLD_PX' -and
      $commitPendingDragBlock -match 'state\.drag\s*='
  },
  @{
    Name = 'shift click toggles canvas selection without clearing the set'
    Pass = $app -match 'function toggleSelected\(' -and
      $pendingDragBlock -match 'event\.shiftKey' -and
      $pendingClickBlock -match 'pending\.shiftKey[\s\S]*?toggleSelected\('
  },
  @{
    Name = 'shift lasso toggles hits relative to the prior selection'
    Pass = $lassoSelectionBlock -match 'new Set\(box\.selectionBefore' -and
      $lassoSelectionBlock -match 'selected\.has\(id\)[\s\S]*?selected\.delete\(id\)[\s\S]*?selected\.add\(id\)' -and
      $app -match 'shiftKey:\s*event\.shiftKey' -and
      $lassoUpBlock -match 'state\.selectionBox\.shiftKey[\s\S]*?state\.selectionBox\.selectionBefore'
  },
  @{
    Name = 'active pointer modes ignore unrelated pointers and release capture'
    Pass = $app -match 'function isActiveInteractionPointer\(event\)' -and
      $pointerMoveBlock -match 'if \(!isActiveInteractionPointer\(event\)\) return;' -and
      $pointerUpBlock -match 'if \(!isActiveInteractionPointer\(event\)\) return;' -and
      $pointerCancelBlock -match 'if \(!isActiveInteractionPointer\(event\)\) return;' -and
      $connectionPointerBlock -match 'setPointerCapture\(event\.pointerId\)' -and
      $app -match 'lostpointercapture[\s\S]*?cancelCanvasInteraction\(\)'
  },
  @{
    Name = 'pointer cancellation rolls back without saving partial state'
    Pass = $pointerCancelBlock -match 'cancelCanvasInteraction\(\)' -and
      $pointerCancelBlock -notmatch 'save\(' -and
      $commitPendingDragBlock -match 'viewX:\s*state\.viewport\.x' -and
      $cancelInteractionBlock -match 'state\.viewport\.x\s*=\s*state\.drag\.viewX'
  },
  @{
    Name = 'middle pan propagates through canvas controls and overlays'
    Pass = $stagePointerGuardBlock -match 'event\.button === 0[\s\S]*?stopPropagation\(\)' -and
      $connectionMenuPointerBlock -match 'event\.button === 0[\s\S]*?stopPropagation\(\)' -and
      $beginMinimapBlock -match 'if \(event\.button !== 0\) return;[\s\S]*?event\.stopPropagation\(\)'
  },
  @{
    Name = 'drag frames reuse indexed cards and schedule guide DOM updates'
    Pass = $commitPendingDragBlock -match 'const cardsById = new Map\(' -and
      $commitPendingDragBlock -match 'origins:[\s\S]*?card,' -and
      $updateDraggedCardsBlock -notmatch 'findCard\(' -and
      $updateDraggedCardsBlock -match 'state\.alignmentGuides = snapped\.guides' -and
      $updateDraggedCardsBlock -notmatch 'renderAlignmentGuides\(' -and
      $flushInteractionBlock -match 'dirty\.guides[\s\S]*?renderAlignmentGuides\(state\.alignmentGuides\)'
  },
  @{
    Name = 'card dragging uses one snapped group delta'
    Pass = $app -match 'CanvasEngine\.calculateSnap\(' -and
      $app -match 'gridSize:\s*16' -and
      $app -match 'thresholdPx:\s*6' -and
      $app -match 'drag\.origins\.forEach\([\s\S]*?origin\.x \+ snapped\.dx[\s\S]*?origin\.y \+ snapped\.dy'
  },
  @{
    Name = 'alignment guides render without intercepting input'
    Pass = $html -match 'id="alignmentGuides"' -and
      $app -match 'function renderAlignmentGuides\(guides\)' -and
      $styles -match '\.alignment-guides[\s\S]*?pointer-events:\s*none'
  },
  @{
    Name = 'alt bypasses grid and alignment snapping'
    Pass = $app -match 'altKey:\s*event\.altKey' -and
      $commitPendingDragBlock -match 'altKey:\s*event\.altKey'
  },
  @{
    Name = 'ctrl d duplicates selection once with a world offset'
    Pass = $duplicateBlock -match 'copyNodes\("selected"\)' -and
      $duplicateBlock -match 'if \(!selectedIds\(\)\.length\) return;' -and
      $app -match 'DUPLICATE_OFFSET_WORLD\s*=\s*24' -and
      ([regex]::Matches($duplicateBlock, 'render\(\)').Count -eq 1) -and
      ([regex]::Matches($duplicateBlock, 'save\(\)').Count -eq 1) -and
      $app -match 'event\.ctrlKey && event\.key\.toLowerCase\(\) === "d"'
  },
  @{
    Name = 'escape cancels active canvas interaction and guides'
    Pass = $app -match 'CanvasEngine\.createInteractionController\(' -and
      $escapeBlock -match 'cancelCanvasInteraction\(\)' -and
      $cancelInteractionBlock -match 'interactionController\.cancel\(\)' -and
      $cancelInteractionBlock -match 'state\.pendingDrag\s*=\s*null' -and
      $cancelInteractionBlock -match 'state\.alignmentGuides\s*=\s*\[\]' -and
      $cancelInteractionBlock -match 'guides: true'
  },
  @{
    Name = 'wheel interactions use incremental frames without render'
    Pass = $wheelBlock -match 'scheduleInteractionFrame\(\{ viewport: true, dock: true, minimap: true \}\);' -and
      $wheelBlock -notmatch 'render\(\)'
  },
  @{
    Name = 'completed edges use one structural render for connected UI'
    Pass = $app -match 'if \(input && input\.dataset\.id !== from\) \{[\s\S]*?addEdge\(from, input\.dataset\.id\);[\s\S]*?state\.connecting = null;[\s\S]*?render\(\);[\s\S]*?save\(\);'
  },
  @{
    Name = 'connections expose visible and expanded selectable paths'
    Pass = $app -match 'selectedEdgeId:\s*null' -and
      $app -match 'class="connection-hit"[^>]*data-edge-id=' -and
      $app -match 'class="connection-path[^\"]*"[^>]*data-edge-id=' -and
      $edgePointerBlock -match 'selectEdge\(edgePathNode\.dataset\.edgeId\)' -and
      $styles -match '\.connection-hit\s*\{[\s\S]*?stroke-width:\s*(1[4-9]|2[0-4])' -and
      $styles -match '\.connection-path\.selected\s*\{'
  },
  @{
    Name = 'imported edge ids normalize to unique nonempty strings'
    Pass = $edgeNormalizationFixturePass -and
      $normalizeEdgesBlock -match 'reservedStringIds' -and
      $normalizeEdgesBlock -match 'typeof edge\?\.id === "string"' -and
      $normalizeEdgesBlock -match 'Number\.isFinite\(edge\?\.id\)' -and
      $normalizeEdgesBlock -match 'String\(edge\.id\)' -and
      $normalizeEdgesBlock -match 'usedIds\.has\(' -and
      $normalizeEdgesBlock -match 'uid\("edge"\)' -and
      $app -match 'edges:\s*normalizeCanvasEdges\(' -and
      $app -match 'state\.edges = normalizeCanvasEdges\(state\.edges\)' -and
      $selectEdgeBlock -match 'const normalizedId = String\(id \?\? ""\)' -and
      $selectEdgeBlock -match 'state\.selectedEdgeId = edge\.id;'
  },
  @{
    Name = 'structural render reapplies active connection target feedback'
    Pass = $app -match 'function restoreConnectionFeedback\(\)' -and
      $renderBlock -match 'cacheCardNodes\(\);[\s\S]*?restoreConnectionFeedback\(\);' -and
      $setConnectionTargetBlock -notmatch 'targetId === cardId && connecting\.targetValidity === validity\) return;'
  },
  @{
    Name = 'edge hit paths expose keyboard selection and deletion'
    Pass = $app -match 'class="connection-hit"[^>]*tabindex="0"[^>]*role="button"[^>]*aria-label=' -and
      $app -match 'class="connection-path[^\"]*"[^>]*aria-hidden="true"' -and
      $app -match '<svg class="connection-svg" role="group" aria-label=' -and
      $app -notmatch '<svg class="connection-svg" aria-hidden="true"' -and
      $edgeKeyBlock -match 'event\.key === "Enter" \|\| event\.key === " "' -and
      $edgeKeyBlock -match 'selectEdge\(edgePathNode\.dataset\.edgeId\)' -and
      $edgeKeyBlock -match 'event\.key === "Delete" \|\| event\.key === "Backspace"' -and
      $edgeKeyBlock -match 'deleteSelectedEdge\(\)' -and
      $app -match 'els\.stage\.addEventListener\("keydown", handleEdgeKeydown\)'
  },
  @{
    Name = 'minimap is keyboard accessible with incremental arrow navigation'
    Pass = $app -match 'minimapCanvas\.tabIndex = 0' -and
      $app -match 'minimapCanvas\.setAttribute\("role", "application"\)' -and
      $app -match 'minimapCanvas\.setAttribute\("aria-label"' -and
      $app -match 'minimapCanvas\.addEventListener\("keydown", handleMinimapKeydown\)' -and
      $minimapKeyBlock -match 'ArrowLeft' -and $minimapKeyBlock -match 'ArrowRight' -and
      $minimapKeyBlock -match 'ArrowUp' -and $minimapKeyBlock -match 'ArrowDown' -and
      $minimapKeyBlock -match 'event\.shiftKey' -and
      $minimapKeyBlock -match 'scheduleInteractionFrame\(\{ viewport: true, dock: true, minimap: true \}\);' -and
      $minimapKeyBlock -notmatch 'render\(\)'
  },
  @{
    Name = 'minimap disables native touch gestures'
    Pass = $styles -match '\.minimap canvas\s*\{[^}]*touch-action:\s*none'
  },
  @{
    Name = 'minimap backing store scales for device pixel ratio in css coordinates'
    Pass = $minimapBlock -match 'window\.devicePixelRatio' -and
      $minimapBlock -match 'canvas\.width\s*=\s*Math\.round\(width \* pixelRatio\)' -and
      $minimapBlock -match 'canvas\.height\s*=\s*Math\.round\(height \* pixelRatio\)' -and
      $minimapBlock -match 'ctx\.setTransform\(pixelRatio, 0, 0, pixelRatio, 0, 0\)' -and
      $minimapBlock -match '__mapBounds\s*=\s*\{[\s\S]*?width,[\s\S]*?height' -and
      $minimapClientBlock -match 'bounds\.width / rect\.width' -and
      $beginMinimapBlock -match 'bounds\.width / rect\.width'
  },
  @{
    Name = 'delete removes a selected edge before selected cards'
    Pass = $app -match 'function deleteSelectedEdge\(\)' -and
      $app -match 'state\.edges = state\.edges\.filter\(edge => edge\.id !== state\.selectedEdgeId\)' -and
      $deleteKeyBlock -match 'if \(deleteSelectedEdge\(\)\) return;' -and
      $deleteKeyBlock -match 'deleteSelectedNode\(\);' -and
      $deleteEdgeBlock -match 'scheduleInteractionFrame\(\{ edges: true, minimap: true \}\);' -and
      $deleteEdgeBlock -notmatch 'render\(\)'
  },
  @{
    Name = 'card selection predictably clears edge selection'
    Pass = $app -match 'function setSelected\(ids\) \{[\s\S]*?state\.selectedEdgeId = null;' -and
      $app -match 'function selectEdge\(id\) \{[\s\S]*?setSelected\(\[\]\);[\s\S]*?state\.selectedEdgeId = edge\.id;'
  },
  @{
    Name = 'connection drag marks valid and invalid input targets'
    Pass = $app -match 'function setConnectionTarget\(cardId, validity\)' -and
      $connectionMoveBlock -match 'document\.elementFromPoint\(event\.clientX, event\.clientY\)' -and
      $connectionMoveBlock -match 'connectionTargetValidity\(' -and
      $styles -match '\.card\.connection-valid' -and
      $styles -match '\.card\.connection-invalid'
  },
  @{
    Name = 'self and duplicate connection drops are rejected without opening create menu'
    Pass = $app -match 'function connectionTargetValidity\(from, to\)' -and
      $app -match 'if \(!to \|\| from === to\) return "invalid";' -and
      $app -match 'state\.edges\.some\(edge => edge\.from === from && edge\.to === to\)' -and
      $connectionUpBlock -match 'if \(validity === "invalid"\)[\s\S]*?return;' -and
      $connectionUpBlock.IndexOf('if (validity === "invalid")') -lt $connectionUpBlock.IndexOf('showConnectionCreateMenu(from, event.clientX, event.clientY)')
  },
  @{
    Name = 'ports use expanded stable hit areas around fixed visual dots'
    Pass = $styles -match '\.port\s*\{[\s\S]*?width:\s*(3[2-9]|4[0-4])px;[\s\S]*?height:\s*(3[2-9]|4[0-4])px;' -and
      $styles -match '\.port::before\s*\{[\s\S]*?width:\s*17px;[\s\S]*?height:\s*17px;' -and
      $styles -match '\.port:hover::before'
  },
  @{
    Name = 'minimap viewport rectangle uses actual viewport and scale'
    Pass = $minimapBlock -match 'els\.viewport\.getBoundingClientRect\(\)' -and
      $minimapBlock -match 'worldLeft\s*=\s*-state\.viewport\.x\s*/\s*state\.viewport\.scale' -and
      $minimapBlock -match 'viewportRect\.width\s*/\s*state\.viewport\.scale' -and
      $minimapBlock -match 'state\.minimapPan\?\.mapBounds' -and
      $minimapBlock -match '__mapBounds\s*=\s*\{[\s\S]*?viewportCanvasRect'
  },
  @{
    Name = 'minimap click and drag navigation use pointer capture and incremental frames'
    Pass = $minimapClientBlock -match 'bounds\.width / rect\.width' -and
      $minimapClientBlock -match 'state\.minimapPan\?\.mapBounds \|\| canvas\?\.__mapBounds' -and
      $minimapPointBlock -match 'viewportRect\.width / 2' -and
      $beginMinimapBlock -match 'interactionController\.begin\("minimap-panning"' -and
      $beginMinimapBlock -match 'setPointerCapture\(event\.pointerId\)' -and
      $beginMinimapBlock -match 'mapBounds:' -and
      $updateMinimapBlock -match 'minimapPointToViewport\(event\.clientX, event\.clientY\)' -and
      $updateMinimapBlock -match 'scheduleInteractionFrame\(\{ viewport: true, dock: true, minimap: true \}\);' -and
      $updateMinimapBlock -notmatch 'render\(\)' -and
      $endMinimapBlock -match 'updateMinimapPan\(event\);[\s\S]*?interactionController\.end\(event\.pointerId\)'
  },
  @{
    Name = 'minimap respects pointer ownership and lets middle pan propagate'
    Pass = $beginMinimapBlock -match 'if \(event\.button !== 0\) return;' -and
      $beginMinimapBlock -match 'event\.stopPropagation\(\)' -and
      $beginMinimapBlock -match 'pointerId:\s*event\.pointerId' -and
      $app -match 'if \(state\.minimapPan\) \{[\s\S]*?updateMinimapPan\(event\);[\s\S]*?return;' -and
      $app -match 'if \(state\.minimapPan\) \{[\s\S]*?endMinimapPan\(event\);[\s\S]*?return;'
  },
  @{
    Name = 'interaction hot paths cache selected cards edges and groups'
    Pass = $app -match 'const edgeNodes = new Map\(\);' -and
      $app -match 'const selectedIdSet = new Set\(state\.selectedIds\);' -and
      $app -match 'const cardsById = new Map\(state\.cards\.map\(card => \[card\.id, card\]\)\);' -and
      $app -match 'const groupById = new Map\(state\.groups\.map\(group => \[group\.id, group\]\)\);'
  },
  @{
    Name = 'interaction updates avoid imported ID selector interpolation'
    Pass = $app -notmatch 'querySelector\(`[^`]*\$\{(card|edge)\.'
  },
  @{
    Name = 'minimap uses measured card layout height'
    Pass = $minimapBlock -match 'card\.layoutH \?\? card\.h'
  },
  @{
    Name = 'state tracks a lasso selection rectangle'
    Pass = $app -match 'selectionBox:\s*null'
  },
  @{
    Name = 'blank left pointer starts selection instead of viewport pan'
    Pass = $app -match 'state\.selectionBox\s*=\s*\{[\s\S]*?startWorld' -and
      $app -notmatch 'state\.selectedId\s*=\s*null;\s*state\.pan\s*=\s*\{\s*startX:\s*event\.clientX'
  },
  @{
    Name = 'selection rectangle is rendered on the canvas'
    Pass = $app -match 'class="selection-box"'
  },
  @{
    Name = 'selection rectangle has visible styling'
    Pass = $styles -match '\.selection-box'
  },
  @{
    Name = 'left add button explicitly opens palette and stops bubbling'
    Pass = $app -match 'els\.addNodeButton\.addEventListener\("click",\s*event\s*=>\s*\{[\s\S]*?event\.stopPropagation\(\);[\s\S]*?els\.nodePalette\.classList\.remove\("hidden"\);[\s\S]*?\}\);'
  },
  @{
    Name = 'node palette clicks are ignored by canvas pointer selection'
    Pass = $app -match 'event\.target\.closest\("\.context-menu"\) \|\| event\.target\.closest\("\.node-control-dock"\) \|\| event\.target\.closest\("\.connection-create-menu"\) \|\| event\.target\.closest\("\.node-palette"\)\) return;'
  },
  @{
    Name = 'node dock is offset below selected node without crowding'
    Pass = $app -match 'const gap = (2[4-9]|3[0-6]);'
  },
  @{
    Name = 'dock has custom hover size picker shell'
    Pass = $html -match 'id="sizePicker"' -and $html -match 'id="sizePickerMenu"' -and $styles -match '\.size-picker:hover\s+\.size-popover'
  },
  @{
    Name = 'image and video size menus render distinct controls'
    Pass = $app -match 'function renderImageSizeMenu' -and $app -match 'function renderVideoSizeMenu' -and $app -match '图像质量' -and $app -match '生成视频音频'
  },
  @{
    Name = 'size picker actions update card generation parameters'
    Pass = $app -match 'setupSizePicker' -and $app -match 'data-size-action' -and $app -match 'applySizePickerAction' -and $app -match 'imageQuality' -and $app -match 'generate_audio'
  },
  @{
    Name = 'video request includes selected audio flag'
    Pass = $app -match 'generate_audio: card\.generate_audio' -and $server -match 'generate_audio: typeof payload\.generate_audio === "boolean" \? payload\.generate_audio : undefined'
  },
  @{
    Name = 'size picker hover bridge keeps popover reachable'
    Pass = $styles -match '\.size-picker::before' -and $styles -match 'height:\s*2[0-9]px' -and $styles -match 'bottom:\s*100%'
  },
  @{
    Name = 'reference preview floats above dock popovers'
    Pass = $styles -match '\.ref-thumb:hover\s*\{[\s\S]*?z-index:\s*2[0-9]{2}' -and $styles -match '\.ref-thumb i\s*\{[\s\S]*?z-index:\s*3[0-9]{2}'
  },
  @{
    Name = 'middle-button pan is handled before dock pointer guard'
    Pass = $pointerDownBlock.IndexOf('if (event.button === 1)') -ge 0 -and $pointerDownBlock.IndexOf('if (event.button === 1)') -lt $pointerDownBlock.IndexOf('event.target.closest(".node-control-dock")')
  },
  @{
    Name = 'middle-button pan has a clear active cursor and cancellation cleanup'
    Pass = $app -match 'classList\.add\("is-panning"\)' -and
      $app -match 'classList\.remove\("is-panning"\)' -and
      $app -match 'pointercancel' -and
      $styles -match '\.canvas-viewport\.is-panning'
  },
  @{
    Name = 'mouse wheel pans the canvas without changing zoom'
    Pass = $wheelBlock -match 'isZoomGesture' -and
      $wheelBlock -match 'state\.viewport\.y\s*[-+]=[\s\S]*?event\.deltaY[\s\S]*?scheduleInteractionFrame' -and
      $wheelBlock -notmatch 'render\(\)' -and
      $wheelBlock -match 'else' -and
      $wheelBlock -match 'state\.viewport\.scale\s*='
  },
  @{
    Name = 'ctrl wheel zooms around the pointer position'
    Pass = $wheelBlock -match 'const isZoomGesture = event\.ctrlKey' -and
      $wheelBlock -match 'clientToWorld\(event\.clientX, event\.clientY\)' -and
      $wheelBlock -match 'Math\.min\(2\.5[\s\S]*?Math\.max\(0\.25' -and
      $wheelBlock -match 'event\.clientX[\s\S]*?state\.viewport\.x' -and
      $wheelBlock -match 'event\.clientY[\s\S]*?state\.viewport\.y'
  },
  @{
    Name = 'ctrl wheel is not blocked by the node dock guard'
    Pass = $wheelBlock -match 'if \(!isZoomGesture && event\.target\.closest\("\.node-control-dock"\)\) return;' -and
      $wheelBlock -match 'if \(isZoomGesture\)'
  },
  @{
    Name = 'edge anchors use measured node layout height'
    Pass = $app -match 'function syncCardLayoutMetrics\(' -and $app -match 'card\.layoutH \?\? card\.h'
  },
  @{
    Name = 'node dock uses measured node bottom'
    Pass = $app -match 'card\.layoutH \?\? card\.h'
  },
  @{
    Name = 'node dock sits close to selected node without overlap'
    Pass = $app -match 'const gap = (2[4-9]|3[0-6]);' -and $app -match 'card\.layoutH \?\? card\.h'
  },
  @{
    Name = 'node dock clamps horizontally inside the canvas viewport'
    Pass = $app -match 'const rawLeft = nodeCenterX - dockWidth / 2' -and
      $app -match 'Math\.min\(Math\.max\(margin, rawLeft\), maxLeft\)'
  },
  @{
    Name = 'node dock avoids overlapping neighboring cards when possible'
    Pass = $app -match 'const otherCards = state\.cards[\s\S]*?\.filter' -and
      $app -match 'top < otherBottom' -and
      $app -match 'top = otherBottom \+ gap'
  },
  @{
    Name = 'node dock may be clipped instead of panning the canvas'
    Pass = $app -match 'dock\.style\.top = `\$\{Math\.round\(top\)\}px`' -and
      $app -notmatch 'const dockOverflow = top \+ dockHeight'
  },
  @{
    Name = 'node palette is positioned as a viewport overlay'
    Pass = $styles -match '\.node-palette\s*\{[\s\S]*position:\s*fixed' -or $app -match 'function positionNodePalette\('
  },
  @{
    Name = 'size popover is clamped inside the browser viewport'
    Pass = $app -match 'function positionSizePopover\(' -and $app -match 'sizePopover'
  },
  @{
    Name = 'reference preview is positioned next to the thumbnail with a hover bridge'
    Pass = $styles -match '\.ref-thumb::before' -and $styles -match 'left:\s*calc\(100% - 2px\)' -and $styles -match '\.ref-thumb i\s*\{[\s\S]*?left:\s*calc\(100% \+ 6px\)' -and $styles -match '\.ref-thumb i a\s*\{[\s\S]*?pointer-events:\s*auto'
  },
  @{
    Name = 'aspect icons preserve the selected ratio inside a fixed frame'
    Pass = $app -match 'aspectIconStyle\(option\)' -and $app -match '--aspect-w' -and $app -match '--aspect-h' -and $styles -match '\.aspect-icon-frame' -and $styles -match 'width:\s*var\(--aspect-w\)' -and $styles -match 'height:\s*var\(--aspect-h\)'
  },
  @{
    Name = 'import and export controls use the shared button typography'
    Pass = $styles -match '\.text-btn,\s*\.ghost-btn,\s*\.primary-btn\s*\{[\s\S]*?font:\s*inherit' -and $styles -match '\.file-label\s*\{[\s\S]*?font:\s*inherit'
  },
  @{
    Name = 'connections and nodes have responsive interaction motion'
    Pass = $styles -match '\.connection-path\s*\{[\s\S]*transition:' -and $styles -match '\.card\s*\{[\s\S]*transition:' -and $styles -match '@media \(prefers-reduced-motion: reduce\)'
  },
  @{
    Name = 'opening operation instructions closes other canvas overlays'
    Pass = $app -match 'function openShortcuts\(\)\s*\{[\s\S]*?hideContextMenu\(\);[\s\S]*?hideConnectionCreateMenu\(\);[\s\S]*?els\.nodePalette\.classList\.add\("hidden"\);'
  },
  @{
    Name = 'canvas management persists groups and local snapshots'
    Pass = $app -match 'groups:' -and
      $app -match 'canvasSnapshots:' -and
      $app -match 'normalizeCanvasGroup' -and
      $app -match 'canvasSnapshot'
  },
  @{
    Name = 'local canvas library supports migration, switching, and persistence'
    Pass = $html -match 'id="openCanvasLibrary"' -and
      $html -match 'id="newCanvas"' -and
      $html -match 'id="canvasLibraryList"' -and
      $app -match 'CANVAS_LIBRARY_SCHEMA' -and
      $app -match 'function switchCanvas\(' -and
      $app -match 'function createNewCanvas\(' -and
      $app -match 'Array\.isArray\(saved\.canvases\)'
  },
  @{
    Name = 'canvas library exports and imports all local workflows'
    Pass = $app -match 'canvases: cloneData\(canvasLibrary\.canvases\)' -and
      $app -match 'if \(Array\.isArray\(data\.canvases\)\)' -and
      $app -match 'applyCanvasRecord\(activeCanvasRecord\(\)\)'
  },
  @{
    Name = 'deleting the last canvas creates a new empty canvas'
    Pass = $app -match 'function deleteActiveCanvas\(\)' -and
      $app -match 'if \(!canvasLibrary\.canvases\.length\)' -and
      $app -match 'createCanvasRecord\("未命名画布"' -and
      $app -match 'canvasLibrary\.canvases\.push\(blank\)'
  },
  @{
    Name = 'canvas supports grouping and dependency-aware auto layout'
    Pass = $html -match 'id="groupSelection"' -and
      $html -match 'id="autoLayout"' -and
      $app -match 'function groupSelectedCards\(' -and
      $app -match 'function autoLayoutCards\(' -and
      $app -match 'data-group-id'
  },
  @{
    Name = 'canvas exposes minimap and node search'
    Pass = $html -match 'id="canvasSearch"' -and
      $html -match 'id="minimapCanvas"' -and
      $app -match 'function renderMinimap\(' -and
      $app -match 'function focusCard\('
  },
  @{
    Name = 'minimap is visible by default at a readable size'
    Pass = $html -match '<aside id="minimap" class="minimap"' -and
      $html -match '<canvas id="minimapCanvas" width="300" height="190"' -and
      $styles -match '\.minimap\s*\{[^}]*width:\s*300px' -and
      $styles -match '\.minimap\s*\{[^}]*height:\s*190px'
  },
  @{
    Name = 'canvas exposes undo redo and named history snapshots'
    Pass = $html -match 'id="historyMenu"' -and
      $app -match 'function undoCanvas\(' -and
      $app -match 'function redoCanvas\(' -and
      $app -match 'function createCanvasSnapshot\(' -and
      $html -match 'Ctrl\+Z'
  },
  @{
    Name = 'topbar dropdowns are not clipped by the scrolling command row'
    Pass = $styles -notmatch '\.top-actions\s*\{[^}]*overflow-y:\s*hidden'
  },
  @{
    Name = 'node dragging calculates a browser-edge auto-pan velocity'
    Pass = $app -match 'function dragEdgeVelocity\(' -and
      $app -match 'DRAG_EDGE_MARGIN' -and
      $app -match 'DRAG_EDGE_MAX_SPEED'
  },
  @{
    Name = 'node dragging keeps moving while the pointer stays at the edge'
    Pass = $app -match 'function continueDragAutoPan\(' -and
      $app -match 'requestAnimationFrame\(continueDragAutoPan\)' -and
      $app -match 'state\.viewport\.x\s*\+=' -and
      $app -match 'updateDraggedCards\(drag\.lastClientX, drag\.lastClientY, drag\.altKey\)'
  },
  @{
    Name = 'commerce is a dedicated left-toolbar workspace entry'
    Pass = $html -match 'id="commerceTool"' -and $html -match 'data-tool="commerce"' -and $html -notmatch 'data-create="commerce"'
  },
  @{
    Name = 'product video is a dedicated left-toolbar workspace entry'
    Pass = $html -match 'id="productVideoTool"' -and $html -match 'data-tool="product-video"' -and $html -notmatch 'data-create="product-video"'
  },
  @{
    Name = 'left toolbar removes upload and select movement entries'
    Pass = $html -notmatch 'id="uploadBtn"' -and $html -notmatch 'data-tool="select"'
  },
  @{
    Name = 'left toolbar exposes a canvas return entry'
    Pass = $html -match 'id="returnCanvasTool"' -and $html -match 'data-tool="canvas"' -and $html -match 'title="返回画布"'
  },
  @{
    Name = 'canvas return entry switches workspace mode to canvas'
    Pass = $app -match 'returnCanvasTool' -and $app -match 'els\.returnCanvasTool\.addEventListener\("click"' -and $app -match 'setWorkspaceMode\("canvas"\)'
  },
  @{
    Name = 'upload remains available from the node palette'
    Pass = $html -match 'id="paletteUpload"' -and $app -match 'document\.getElementById\("paletteUpload"\)' -and $app -match 'document\.getElementById\("uploadInput"\)\.addEventListener\("change", handleUpload\)'
  },
  @{
    Name = 'product video workspace exposes product upload and generation controls'
    Pass = $html -match 'id="productVideoWorkspace"' -and
      $html -match 'id="productVideoUploadInput"' -and
      $html -match 'data-product-video-slot="product"' -and
      $html -match 'id="productVideoPrompt"' -and
      $html -match 'id="productVideoGenerate"'
  },
  @{
    Name = 'product video workspace exposes supported video parameters'
    Pass = $html -match 'id="productVideoAspect"' -and
      $html -match 'id="productVideoResolution"' -and
      $html -match 'id="productVideoDuration"' -and
      $html -match 'id="productVideoFps"' -and
      $html -match 'id="productVideoAudio"'
  },
  @{
    Name = 'product video workspace has a scrollable temporary video library'
    Pass = $html -match 'id="productVideoAssetLibrary"' -and
      $html -match 'id="productVideoAssetGrid"' -and
      $styles -match '\.commerce-asset-library\s*\{[\s\S]*overflow-y:\s*auto' -and
      $styles -match '\.product-video-workspace\s+\.commerce-asset-media'
  },
  @{
    Name = 'product video state is persisted and normalized'
    Pass = $app -match 'productVideoWorkspace:' -and
      $app -match 'normalizeProductVideoWorkspace' -and
      $app -match 'productVideoWorkspace: state.productVideoWorkspace' -and
      $app -match 'data.productVideoWorkspace'
  },
  @{
    Name = 'product video uploads an image and validates the product requirement'
    Pass = $app -match 'handleProductVideoUpload' -and
      $app -match '产品视频只支持图片文件' -and
      $app -match '先上传产品图'
  },
  @{
    Name = 'product video calls Agnes create and result endpoints'
    Pass = $app -match 'generateProductVideo' -and
      $app -match 'pollProductVideo' -and
      $app -match 'postJson\("/api/agnes/video"' -and
      $app -match 'postJson\("/api/agnes/video-result"'
  },
  @{
    Name = 'product video sends the product image as the only reference'
    Pass = $app -match 'imageRefs: \[workspace\.productRef\.url\]' -and
      $app -match 'productVideoPrompt'
  },
  @{
    Name = 'product video results are independent and offer canvas and download actions'
    Pass = $app -match 'function storeProductVideoResult' -and
      $app -match 'workspace\.results\.unshift' -and
      $app -match 'addProductVideoResultToCanvas' -and
      $app -match 'downloadProductVideoResult' -and
      $app -match 'data-product-video-action="add"' -and
      $app -match 'data-product-video-action="download"'
  },
  @{
    Name = 'commerce workspace has product model and scene upload slots'
    Pass = $html -match 'id="commerceWorkspace"' -and
      $html -match 'data-commerce-workspace-slot="product"' -and
      $html -match 'data-commerce-workspace-slot="model"' -and
      $html -match 'data-commerce-workspace-slot="scene"'
  },
  @{
    Name = 'commerce workspace has a scrollable temporary asset library'
    Pass = $html -match 'id="commerceAssetLibrary"' -and $styles -match '\.commerce-asset-library[\s\S]*overflow-y:\s*auto'
  },
  @{
    Name = 'commerce workspace uses equal-width control and asset columns'
    Pass = $styles -match '\.commerce-workspace\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)'
  },
  @{
    Name = 'commerce asset preview offers add-to-canvas and download actions'
    Pass = $app -match 'addCommerceWorkspaceResultToCanvas' -and
      $app -match 'downloadCommerceWorkspaceResult' -and
      $app -match 'data-commerce-preview-action="add"' -and
      $app -match 'data-commerce-preview-action="download"'
  },
  @{
    Name = 'commerce generation stores results outside canvas until explicitly added'
    Pass = $app -match 'commerceWorkspace\.results' -and
      $app -match 'renderCommerceWorkspace' -and
      $app -match 'createCard\("upload"'
  },
  @{
    Name = 'commerce workflow validates required product image'
    Pass = $app -match '请先上传商品图' -and $app -match 'generateCommercePromo'
  },
  @{
    Name = 'commerce workflow sends role-aware image references'
    Pass = $app -match 'imageRoles' -and $app -match 'productRef' -and $app -match 'sceneRef'
  },
  @{
    Name = 'custom API receives all commerce references'
    Pass = $app -match 'imageRefs: refs\.imageRefs' -and $server -match 'imageRoles'
  },
  @{
    Name = 'commerce results create independent image asset cards'
    Pass = $app -match 'createCommerceResultCard' -and $app -match 'commerceResultIds'
  },
  @{
    Name = 'commerce references belong to the selected commerce card'
    Pass = $app -match 'selectedCommerceCard' -and $app -match 'card\.productRef' -and $app -match 'card\.sceneRef'
  },
  @{
    Name = 'commerce workspace exposes optional Agnes prompt generation mode'
    Pass = $html -match 'id="commerceWorkspacePromptMode"' -and
      $html -match 'id="commerceWorkspacePromptButton"' -and
      $app -match 'commerceWorkspacePromptMode'
  },
  @{
    Name = 'commerce prompt generation calls Agnes chat completions'
    Pass = $app -match 'generateCommercePrompt' -and
      $app -match '/api/agnes/prompt' -and
      $server -match 'handleAgnesPrompt' -and
      $server -match 'chat/completions'
  },
  @{
    Name = 'Agnes prompt generation sends role-aware multimodal image content'
    Pass = $server -match 'image_url' -and
      $server -match 'imageRoles' -and
      $app -match 'promptModel'
  },
  @{
    Name = 'commerce image generation requires an auto-generated prompt when mode is enabled'
    Pass = $app -match '请先生成提示词' -and
      $app -match 'commercePromptMode === "auto"'
  },
  @{
    Name = 'Agnes image requests use supported size and ratio fields'
    Pass = $app -match 'function agnesImageRatio\(' -and
      $app -match 'function agnesImageSize\(' -and
      $app -match 'request\.ratio = agnesImageRatio' -and
      $server -match 'ratio: payload\.ratio' -and
      $app -notmatch 'model: settings\.imageModel,[\s\S]*?size: "1024x1280"'
  },
  @{
    Name = 'Agnes prompt generation builds product detail page selling points'
    Pass = $server -match '商品类别' -and
      $server -match '核心卖点' -and
      $server -match '单张海报' -and
      $server -match '单一画面' -and
      $server -match '不得臆造'
  },
  @{
    Name = 'commerce generation is restricted to one poster composition'
    Pass = $app -match 'type === "commerce" \? "2k"' -and
      $server -match '不要多屏' -and
      $server -match '不要九宫格' -and
      $server -match '不要生成小字'
  },
  @{
    Name = 'commerce asset thumbnails use compact cards while keeping hover preview'
    Pass = $assetGrid -match 'grid-template-columns:\s*repeat\(auto-fill, minmax\(1[4-8][0-9]px, 1fr\)\)' -and
      $assetGrid -match 'gap:\s*1[0-4]px' -and
      $styles -match '\.commerce-asset-card:hover \.commerce-asset-large'
  },
  @{
    Name = 'server routes Agnes requests through the configured HTTPS proxy'
    Pass = $server -match 'HTTPS_PROXY' -and
      $server -match 'CONNECT' -and
      $server -match 'proxy-authorization'
  },
  @{
    Name = 'Agnes commerce prompt forbids multi-screen prompt structures'
    Pass = $server -match '画面一、画面二、画面三' -and
      $server -match '最多三个简短卖点标签' -and
      $server -match '只返回一段'
  },
  @{
    Name = 'Agnes prompt generation requests a fresh variation each time'
    Pass = $app -match 'promptGeneration' -and
      $app -match 'generationId' -and
      $server -match 'variation' -and
      $server -match 'temperature:\s*0\.(7[0-9]|8[0-9])'
  },
  @{
    Name = 'Agnes prompt generation reads the current textarea value'
    Pass = $app -match 'promptHintFor\(workspace,\s*els\.commerceWorkspacePrompt\.value\)' -and
      $app -match 'current\s*!==\s*String\(target\.lastGeneratedPrompt'
  },
  @{
    Name = 'commerce image policy blocks use one safe retry and a readable error'
    Pass = $app -match 'function isContentPolicyViolation\(' -and
      $app -match 'function commerceSafePrompt\(' -and
      $app -match 'isContentPolicyViolation\(error\)' -and
      $app -match 'content_policy_violation' -and
      $app -match 'const safeRequest = \{ \.\.\.request, prompt: commerceSafePrompt\(\) \}' -and
      $app -match 'retryError\.message = commercePolicyErrorMessage'
  },
  @{
    Name = 'Agnes commerce prompt avoids sensitive expansions that can trigger policy blocks'
    Pass = $server -match '只使用安全、普通、适合电商的内容' -and
      $server -match '医疗功效' -and
      $server -match '最多三个简短卖点标签'
  },
  @{
    Name = 'commerce image requests protect Chinese typography and product identity'
    Pass = $app -match 'COMMERCE_IMAGE_GUARDRAILS' -and
      $app -match 'workflow: card\.type' -and
      $server -match 'payload\.workflow === "commerce"' -and
      $server -match '不要生成任何可读文字' -and
      $server -match '商品身份锁定'
  },
  @{
    Name = 'Agnes prompt responses support OpenAI and wrapped text formats'
    Pass = $app -match 'function promptValueText\(' -and
      $app -match 'output_text' -and
      $app -match 'response\?\.choices' -and
      $app -match 'response\?\.output' -and
      $app -match 'response\?\.data'
  },
  @{
    Name = 'Agnes prompt responses support delta, body, JSON, and SSE wrappers'
    Pass = $app -match 'value\.delta\?\.content' -and
      $app -match 'value\.body' -and
      $app -match 'value\.prompt' -and
      $app -match 'JSON\.parse\(trimmed\)' -and
      $app -match 'data:\\s\*'
  },
  @{
    Name = 'Agnes prompt 504s retry once and show a readable timeout error'
    Pass = $app -match 'function isUpstreamTimeout\(' -and
      $app -match 'function requestAgnesPrompt\(' -and
      $app -match 'await sleep\(1[0-9]{3}\)' -and
      $app -match 'isUpstreamTimeout\(error\)' -and
      $app -match 'if \(isUpstreamTimeout\(error\)\) error\.message' -and
      $app -match '上游响应超时' -and
      $app -match 'typeof data\.details\?\.response === "string"'
  },
  @{
    Name = 'Agnes empty prompt responses expose refusal and finish diagnostics'
    Pass = $app -match 'reasoning_content' -and
      $app -match 'function promptResponseError\(' -and
      $app -match 'finish_reason' -and
      $app -match 'refusal' -and
      $app -match '响应字段'
  },
  @{
    Name = 'prompt fixes are cache-busted in the served page'
    Pass = $html -match 'app\.js\?v=canvas-interactions-2' -and $html -match 'styles\.css\?v=canvas-controls-9'
  },
  @{
    Name = 'server exposes a deployment health endpoint'
    Pass = $server -match 'url\.pathname === "/healthz"' -and $server -match 'status: "ok"'
  },
  @{
    Name = 'repository includes a production container entrypoint'
    Pass = $dockerfile -match 'FROM node:18' -and $dockerfile -match 'CMD \["npm", "start"\]' -and $dockerfile -match 'EXPOSE 5177'
  },
  @{
    Name = 'repository includes Render deployment metadata'
    Pass = $render -match 'type:\s*web' -and $render -match 'healthCheckPath:\s*/healthz' -and $render -match 'startCommand:\s*npm start'
  },
  @{
    Name = 'repository ignores local secrets and runtime files'
    Pass = $gitignore -match '\.env' -and $gitignore -match 'node_modules/' -and $gitignore -match 'outputs/'
  },
  @{
    Name = 'README documents public deployment and API key handling'
    Pass = $readme -match 'Render' -and $readme -match 'Docker' -and $readme -match 'API Key' -and $readme -match 'GitHub Pages'
  },
  @{
    Name = 'Windows starter launches the local server and browser'
    Pass = $startBat -match 'node server\.js' -and $startBat -match 'localhost:5177' -and $startBat -match 'where node'
  },
  @{
    Name = 'PowerShell starter works without npm installation'
    Pass = $startPs1 -match '-FilePath "node"' -and $startPs1 -match '-ArgumentList "server\.js"' -and $startPs1 -match 'localhost:5177' -and $startPs1 -notmatch 'npm install'
  },
  @{
    Name = 'README has a download and double-click quick start'
    Pass = ($readme -match '下载 ZIP' -or $readme -match 'Download ZIP') -and $readme -match 'start\.bat' -and $readme -match '不需要.*npm install'
  },
  @{
    Name = 'macOS starter launches the local server and browser'
    Pass = $startCommand -match '#!/bin/bash' -and $startCommand -match 'node server\.js' -and $startCommand -match 'open.*localhost:5177' -and $startSh -match 'node server\.js'
  },
  @{
    Name = 'README documents macOS double-click startup'
    Pass = $readme -match 'start\.command' -and $readme -match 'macOS'
  }
)

$failed = $checks | Where-Object { -not $_.Pass }
foreach ($check in $checks) {
  $mark = if ($check.Pass) { 'PASS' } else { 'FAIL' }
  Write-Host "$mark $($check.Name)"
}

if ($failed) {
  exit 1
}
