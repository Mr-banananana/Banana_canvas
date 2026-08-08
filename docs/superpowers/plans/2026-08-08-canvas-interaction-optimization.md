# Canvas Interaction Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve RunningHub-style operation while making 100-300 node canvases responsive, predictable, and recoverable during drag, selection, connection, pan, zoom, and minimap navigation.

**Architecture:** Keep the current dependency-free HTML/CSS/JavaScript application. Add a small pure `CanvasEngine` helper for interaction state, snapping, frame scheduling, and save debouncing; change `app.js` so high-frequency pointer events patch transforms and SVG geometry instead of rebuilding all node DOM. Structural changes continue to use the existing full render path.

**Tech Stack:** Browser DOM APIs, Pointer Events, SVG paths, `requestAnimationFrame`, `localStorage`, Node.js built-in `assert`, PowerShell regression checks.

## Global Constraints

- Preserve existing RunningHub-style mouse and keyboard habits.
- Support 100-300 ordinary nodes per canvas.
- Do not add frontend frameworks or runtime dependencies.
- Do not change Agnes API request formats or persisted canvas schema.
- Do not add 3D, editing, director, or audio placeholders.
- Images and videos must keep the same DOM instance during drag and pan.
- One gesture creates at most one undo transaction.

---

### Task 1: Pure Interaction Engine

**Files:**
- Create: `public/canvas-engine.js`
- Create: `work/canvas-engine.test.js`
- Modify: `public/index.html`
- Modify: `package.json`

**Interfaces:**
- Produces: `window.CanvasEngine.createInteractionController(initialMode?)`
- Produces: `window.CanvasEngine.createFrameScheduler(flush)`
- Produces: `window.CanvasEngine.calculateSnap(input)` returning `{ dx, dy, guides }`
- Produces: `window.CanvasEngine.createDebouncedCommit(commit, delay)`

- [ ] **Step 1: Write the failing unit tests**

Create `work/canvas-engine.test.js` that loads the browser script with `vm.runInNewContext` and verifies mode transitions, frame coalescing, 16-pixel grid snapping, six-screen-pixel alignment threshold, `Alt` bypass, and debounced commit flushing.

```js
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const context = { window: {}, setTimeout, clearTimeout };
vm.runInNewContext(fs.readFileSync("public/canvas-engine.js", "utf8"), context);
const engine = context.window.CanvasEngine;

const controller = engine.createInteractionController();
assert.equal(controller.begin("dragging", { pointerId: 7 }), true);
assert.equal(controller.begin("panning", { pointerId: 8 }), false);
assert.equal(controller.end(7).mode, "idle");

const snapped = engine.calculateSnap({
  origin: { x: 17, y: 31 }, delta: { x: 9, y: 2 }, scale: 1,
  gridSize: 16, thresholdPx: 6, altKey: false, movingBounds: null, targets: []
});
assert.deepEqual({ x: snapped.dx, y: snapped.dy }, { x: 15, y: 1 });

const free = engine.calculateSnap({
  origin: { x: 17, y: 31 }, delta: { x: 9, y: 2 }, scale: 1,
  gridSize: 16, thresholdPx: 6, altKey: true, movingBounds: null, targets: []
});
assert.deepEqual({ x: free.dx, y: free.dy }, { x: 9, y: 2 });
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node work/canvas-engine.test.js`

Expected: FAIL because `public/canvas-engine.js` or `window.CanvasEngine` does not exist.

- [ ] **Step 3: Implement the engine**

Implement an IIFE that exports the four interfaces. `createFrameScheduler` must retain only the latest payload before a frame flush; `calculateSnap` must perform grid snapping first, then replace an axis with the closest alignment candidate inside `thresholdPx / scale`; `altKey` must return the raw delta and no guides.

```js
(function exposeCanvasEngine(global) {
  function createInteractionController(initialMode = "idle") {
    let current = { mode: initialMode, pointerId: null, payload: null };
    return {
      get value() { return current; },
      begin(mode, payload = {}) {
        if (current.mode !== "idle") return false;
        current = { mode, pointerId: payload.pointerId ?? null, payload };
        return true;
      },
      end(pointerId) {
        if (current.pointerId !== null && pointerId !== current.pointerId) return current;
        current = { mode: "idle", pointerId: null, payload: null };
        return current;
      },
      cancel() { current = { mode: "idle", pointerId: null, payload: null }; return current; }
    };
  }
  global.CanvasEngine = { createInteractionController, createFrameScheduler, calculateSnap, createDebouncedCommit };
})(window);
```

- [ ] **Step 4: Load the engine and include it in the test command**

Insert `<script src="/canvas-engine.js?v=canvas-interactions-1"></script>` immediately before `app.js`. Change `npm test` so the Node unit test runs before the existing PowerShell regression file.

- [ ] **Step 5: Run tests and verify GREEN**

Run: `npm test`

Expected: the new engine tests and all existing regression checks pass.

- [ ] **Step 6: Commit**

```bash
git add public/canvas-engine.js public/index.html package.json work/canvas-engine.test.js
git commit -m "Add canvas interaction engine"
```

### Task 2: Incremental Interaction Rendering

**Files:**
- Modify: `public/app.js`
- Modify: `public/styles.css`
- Modify: `work/canvas-interaction-regression.ps1`

**Interfaces:**
- Consumes: `CanvasEngine.createFrameScheduler(flush)`
- Produces: `scheduleInteractionFrame(flags)`
- Produces: `flushInteractionFrame(flags)`
- Produces: `updateCardTransforms()`, `updateEdgeGeometry()`, `updateSelectionGeometry()`, `updateViewportGeometry()`

- [ ] **Step 1: Add failing regression checks**

Add checks requiring pointer-move branches to call `scheduleInteractionFrame` instead of `render()`, requiring cached `.card[data-id]` elements to receive transforms, and requiring media nodes to remain untouched by interaction-frame updates.

```powershell
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
    $app -notmatch 'function updateCardTransforms\([\s\S]*?innerHTML'
}
```

- [ ] **Step 2: Run the regression suite and verify RED**

Run: `npm test`

Expected: FAIL on the two new incremental-render checks.

- [ ] **Step 3: Implement frame-patched geometry**

Create one scheduler and use dirty flags for `viewport`, `cards`, `edges`, `selection`, `dock`, and `minimap`. During drag and pan, update CSS transforms and SVG path `d` attributes directly. Keep `render()` for structural changes only.

```js
const interactionFrame = CanvasEngine.createFrameScheduler(flushInteractionFrame);

function scheduleInteractionFrame(flags) {
  interactionFrame.schedule(flags);
}

function updateCardTransforms() {
  state.cards.forEach(card => {
    const node = els.stage.querySelector(`.card[data-id="${card.id}"]`);
    if (node) node.style.transform = `translate3d(${card.x}px, ${card.y}px, 0)`;
  });
}
```

Change card structural styles from `left/top` to stable `transform` positioning. During pan, only call `applyViewport`, update the dock, and throttle minimap redraw.

- [ ] **Step 4: Verify media identity manually in the browser**

Upload an image, record the image element reference, drag the node, and assert the same element remains connected.

```js
const before = document.querySelector('.card img');
// perform drag
const after = document.querySelector('.card img');
console.assert(before === after);
```

- [ ] **Step 5: Run all tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add public/app.js public/styles.css work/canvas-interaction-regression.ps1
git commit -m "Patch canvas geometry during pointer interactions"
```

### Task 3: Predictable Selection, Drag Threshold, and Snapping

**Files:**
- Modify: `public/app.js`
- Modify: `public/index.html`
- Modify: `public/styles.css`
- Modify: `work/canvas-engine.test.js`
- Modify: `work/canvas-interaction-regression.ps1`

**Interfaces:**
- Consumes: `CanvasEngine.createInteractionController()`
- Consumes: `CanvasEngine.calculateSnap(input)`
- Produces: `beginPendingCardDrag(card, event)`, `commitPendingDrag(event)`, `renderAlignmentGuides(guides)`

- [ ] **Step 1: Add failing tests**

Test that movement below four screen pixels stays a click, `Shift` toggles selection without clearing the existing set, grid snapping uses 16 pixels, alignment guides use a six-screen-pixel threshold, and `Alt` bypasses all snapping.

```powershell
@{
  Name = 'drag begins only after a four pixel threshold'
  Pass = $app -match 'DRAG_THRESHOLD_PX\s*=\s*4' -and $app -match 'function commitPendingDrag\('
},
@{
  Name = 'shift click toggles canvas selection'
  Pass = $app -match 'event\.shiftKey' -and $app -match 'toggleSelected\('
},
@{
  Name = 'alignment guides render without intercepting input'
  Pass = $html -match 'id="alignmentGuides"' -and $css -match '\.alignment-guides[\s\S]*?pointer-events:\s*none'
}
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test`

Expected: FAIL on threshold, Shift selection, and guide overlay checks.

- [ ] **Step 3: Implement the unified gesture path**

Add `state.pendingDrag`, start actual movement only after `Math.hypot(dx, dy) >= 4`, and call the interaction controller before entering each mode. Compute one snapped delta for the entire selection set and apply it to every selected origin. Create `#alignmentGuides` inside the stage and render vertical/horizontal guide lines from engine output.

- [ ] **Step 4: Add keyboard behavior**

Implement `Ctrl + D` through the existing clipboard clone path with a fixed 24-pixel world offset, select the duplicates, render once, and save once. `Escape` cancels the current controller mode and clears pending drag and guides.

- [ ] **Step 5: Run tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add public/app.js public/index.html public/styles.css work/canvas-engine.test.js work/canvas-interaction-regression.ps1
git commit -m "Improve node selection and snapping"
```

### Task 4: Connection Feedback and Interactive Minimap

**Files:**
- Modify: `public/app.js`
- Modify: `public/styles.css`
- Modify: `work/canvas-interaction-regression.ps1`

**Interfaces:**
- Produces: `state.selectedEdgeId`
- Produces: `setConnectionTarget(cardId, validity)`
- Produces: `minimapPointToViewport(clientX, clientY)`
- Produces: `beginMinimapPan(event)`, `updateMinimapPan(event)`, `endMinimapPan(event)`

- [ ] **Step 1: Add failing regression checks**

Require edge IDs on SVG paths, selectable edge styling, expanded port hit areas, valid/invalid connection target classes, a minimap viewport rectangle, and minimap pointer handlers.

```powershell
@{
  Name = 'connections can be selected and deleted'
  Pass = $app -match 'data-edge-id' -and $app -match 'selectedEdgeId' -and
    $css -match '\.connection-path\.selected'
},
@{
  Name = 'minimap supports click and drag navigation'
  Pass = $app -match 'function beginMinimapPan\(' -and
    $app -match 'function updateMinimapPan\(' -and
    $app -match 'minimapPointToViewport'
}
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test`

Expected: FAIL on connection selection and minimap interaction.

- [ ] **Step 3: Implement connection feedback**

Render each path with `data-edge-id`, select it on left click, clear node selection, and delete it before nodes when `Delete` is pressed. Add a transparent wide stroke hit path if needed. While connecting, use `document.elementFromPoint` to mark valid targets with `.connection-valid` and self/duplicate targets with `.connection-invalid`.

- [ ] **Step 4: Implement minimap navigation**

Calculate world bounds once per minimap draw. Render the viewport rectangle after node blocks. Clicking or dragging the minimap converts canvas coordinates to a viewport center and schedules a viewport geometry update without starting main-canvas selection.

- [ ] **Step 5: Run tests and verify browser behavior**

Run: `npm test`

Browser checks: select and delete an edge; click the minimap; drag its viewport rectangle; confirm node selection does not change.

- [ ] **Step 6: Commit**

```bash
git add public/app.js public/styles.css work/canvas-interaction-regression.ps1
git commit -m "Improve connections and minimap navigation"
```

### Task 5: Gesture Transactions and Debounced Local Saving

**Files:**
- Modify: `public/app.js`
- Modify: `work/canvas-engine.test.js`
- Modify: `work/canvas-interaction-regression.ps1`

**Interfaces:**
- Consumes: `CanvasEngine.createDebouncedCommit(commit, 300)`
- Produces: `beginHistoryTransaction(label)`, `commitHistoryTransaction()`, `cancelHistoryTransaction()`
- Produces: `scheduleLocalSave()`, `flushLocalSave()`

- [ ] **Step 1: Add failing tests**

Test that multiple scheduled commits collapse into one, `.flush()` commits immediately, one drag adds one history entry, no-op gestures add none, and wheel events do not call synchronous local storage writes for each event.

```powershell
@{
  Name = 'gesture history commits once per completed interaction'
  Pass = $app -match 'function beginHistoryTransaction\(' -and
    $app -match 'function commitHistoryTransaction\(' -and
    $app -match 'historyTransaction'
},
@{
  Name = 'local canvas saving is debounced during navigation'
  Pass = $app -match 'function scheduleLocalSave\(' -and
    $app -match 'function flushLocalSave\(' -and
    $app -match 'createDebouncedCommit\([^,]+,\s*300\)'
}
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test`

Expected: FAIL on transaction and debounced-save checks.

- [ ] **Step 3: Implement history transactions**

Capture the pre-gesture `canvasSnapshot()` at pointer-down. On pointer-up, compare with the final snapshot; push only the pre-gesture snapshot when they differ. Cancelled and click-only gestures must not create history entries.

- [ ] **Step 4: Implement save scheduling**

Use a 300-millisecond debounced commit for wheel navigation and drag completion. Flush immediately before switching canvases, importing/exporting, page unload, and starting or completing generation tasks. Keep settings storage independent.

- [ ] **Step 5: Run tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add public/app.js work/canvas-engine.test.js work/canvas-interaction-regression.ps1
git commit -m "Coalesce canvas history and local saves"
```

### Task 6: Performance Fixture, Browser Regression, and Documentation

**Files:**
- Create: `work/canvas-performance-fixture.js`
- Modify: `work/canvas-interaction-regression.ps1`
- Modify: `README.md`
- Modify: `public/index.html`

**Interfaces:**
- Produces: `window.createCanvasPerformanceFixture(count)` in development/test context only
- Verifies all interfaces from Tasks 1-5.

- [ ] **Step 1: Add the performance fixture**

Create a deterministic helper that returns 100 or 300 lightweight cards arranged in rows, with every adjacent pair connected. It must not run automatically in production.

```js
function createCanvasPerformanceFixture(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `perf_${index}`, type: index % 3 === 0 ? "text" : "image",
    title: `节点 ${index + 1}`, x: (index % 20) * 360,
    y: Math.floor(index / 20) * 280, w: 320, h: 220,
    prompt: "性能测试", status: "idle", resultUrl: "", mime: ""
  }));
}
```

- [ ] **Step 2: Add final static checks**

Require the performance fixture, cache-busted engine/app scripts, and documentation for Shift selection, Alt snap bypass, edge deletion, minimap navigation, and `Ctrl + D`.

- [ ] **Step 3: Run automated tests**

Run: `npm test`

Expected: all Node and PowerShell checks pass.

- [ ] **Step 4: Run browser regression**

Verify at desktop and compact laptop viewports:

- 100-node drag and pan remain visually continuous.
- 300-node drag completes without lost selection or detached media.
- Middle-button pan works over nodes and the node dock.
- Shift selection, Alt bypass, edge deletion, minimap click/drag, undo/redo, canvas switching, import/export, image generation UI, video generation UI, commerce workspace, and product-video workspace work.
- No menu, dock, reference preview, or size popover blocks the pointer bridge unexpectedly.

- [ ] **Step 5: Measure interaction frames**

Record 120 animation frames while dragging one node. Report median and 95th-percentile frame durations. Acceptance: 100 nodes median no greater than 16 ms; 300 nodes median no greater than 32 ms. Treat remote media loading separately from canvas geometry performance.

- [ ] **Step 6: Run syntax and health checks**

Run: `node --check server.js`

Run: `node -e "const fs=require('fs'); new Function(fs.readFileSync('public/app.js','utf8')); new Function(fs.readFileSync('public/canvas-engine.js','utf8')); console.log('syntax ok')"`

Run against the active local service: `Invoke-WebRequest -UseBasicParsing http://127.0.0.1:5177/healthz`

Expected: syntax output is `syntax ok`; health response contains `{"status":"ok"}`.

- [ ] **Step 7: Commit and publish**

```bash
git add README.md public/index.html work/canvas-performance-fixture.js work/canvas-interaction-regression.ps1
git commit -m "Verify optimized canvas interactions"
git push origin main
```
