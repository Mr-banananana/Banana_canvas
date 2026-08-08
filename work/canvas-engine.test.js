const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const frameCallbacks = [];
const context = {
  window: {},
  setTimeout,
  clearTimeout,
  requestAnimationFrame(callback) {
    frameCallbacks.push(callback);
    return frameCallbacks.length;
  },
  cancelAnimationFrame() {}
};
vm.runInNewContext(fs.readFileSync("public/canvas-engine.js", "utf8"), context);
const engine = context.window.CanvasEngine;

const controller = engine.createInteractionController();
assert.equal(controller.value.mode, "idle");
assert.equal(controller.begin("dragging", { pointerId: 7 }), true);
assert.equal(controller.value.mode, "dragging");
assert.equal(controller.begin("panning", { pointerId: 8 }), false);
assert.equal(controller.end(8).mode, "dragging");
assert.equal(controller.end(7).mode, "idle");
assert.equal(controller.begin("selecting", { pointerId: 9 }), true);
assert.equal(controller.cancel().mode, "idle");

const flushed = [];
const schedule = engine.createFrameScheduler(payload => flushed.push(payload));
schedule("first");
schedule("latest");
assert.deepEqual(flushed, []);
assert.equal(frameCallbacks.length, 1);
frameCallbacks.shift()();
assert.deepEqual(flushed, ["latest"]);

const snapped = engine.calculateSnap({
  origin: { x: 17, y: 31 }, delta: { x: 9, y: 2 }, scale: 1,
  gridSize: 16, thresholdPx: 6, altKey: false, movingBounds: null, targets: []
});
assert.deepEqual({ x: snapped.dx, y: snapped.dy }, { x: 15, y: 1 });

const aligned = engine.calculateSnap({
  origin: { x: 17, y: 31 }, delta: { x: 9, y: 2 }, scale: 1,
  gridSize: 16, thresholdPx: 6, altKey: false,
  movingBounds: { x: 17, y: 31, width: 20, height: 10 },
  targets: [{ x: 55, y: 80, width: 20, height: 12 }]
});
assert.equal(aligned.dx, 18);
assert.equal(aligned.guides.length > 0, true);

const scaledThreshold = engine.calculateSnap({
  origin: { x: 0, y: 0 }, delta: { x: 10, y: 10 }, scale: 2,
  gridSize: 16, thresholdPx: 6, altKey: false,
  movingBounds: { x: 0, y: 0, width: 10, height: 10 },
  targets: [{ x: 29, y: 30, width: 10, height: 10 }]
});
assert.equal(scaledThreshold.dx, 19);

const outsideScaledThreshold = engine.calculateSnap({
  origin: { x: 0, y: 0 }, delta: { x: 10, y: 10 }, scale: 2,
  gridSize: 16, thresholdPx: 6, altKey: false,
  movingBounds: { x: 0, y: 0, width: 10, height: 10 },
  targets: [{ x: 30, y: 30, width: 10, height: 10 }]
});
assert.deepEqual({ x: outsideScaledThreshold.dx, y: outsideScaledThreshold.dy }, { x: 16, y: 16 });
assert.equal(outsideScaledThreshold.guides.length, 0);

const free = engine.calculateSnap({
  origin: { x: 17, y: 31 }, delta: { x: 9, y: 2 }, scale: 1,
  gridSize: 16, thresholdPx: 6, altKey: true,
  movingBounds: { x: 17, y: 31, width: 20, height: 10 },
  targets: [{ x: 46, y: 43, width: 20, height: 10 }]
});
assert.deepEqual({ x: free.dx, y: free.dy }, { x: 9, y: 2 });
assert.equal(free.guides.length, 0);

const groupSnap = engine.calculateSnap({
  origin: { x: 19, y: 35 }, delta: { x: 10, y: 10 }, scale: 1,
  gridSize: 16, thresholdPx: 6, altKey: false,
  movingBounds: { x: 19, y: 35, width: 98, height: 70 }, targets: []
});
const movedGroup = [
  { x: 19 + groupSnap.dx, y: 35 + groupSnap.dy },
  { x: 67 + groupSnap.dx, y: 83 + groupSnap.dy }
];
assert.deepEqual(movedGroup, [{ x: 32, y: 48 }, { x: 80, y: 96 }]);
assert.deepEqual(
  { x: movedGroup[1].x - movedGroup[0].x, y: movedGroup[1].y - movedGroup[0].y },
  { x: 48, y: 48 }
);

const committed = [];
const commit = engine.createDebouncedCommit(value => committed.push(value), 10);
commit("draft");
commit("final");
assert.deepEqual(committed, []);
commit.flush();
assert.deepEqual(committed, ["final"]);
