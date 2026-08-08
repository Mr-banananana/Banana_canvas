const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const frameCallbacks = [];
const timers = new Map();
let nextTimerId = 0;
const context = {
  window: {},
  setTimeout(callback, delay) {
    const id = ++nextTimerId;
    timers.set(id, { callback, delay });
    return id;
  },
  clearTimeout(id) {
    timers.delete(id);
  },
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
const commit = engine.createDebouncedCommit(value => committed.push(value), 300);
commit("draft");
commit("final");
assert.deepEqual(committed, []);
assert.equal(timers.size, 1);
assert.equal([...timers.values()][0].delay, 300);
const idleCommit = [...timers.values()][0].callback;
idleCommit();
assert.deepEqual(committed, ["final"]);

commit("next");
commit.flush();
assert.deepEqual(committed, ["final", "next"]);
assert.equal(timers.size, 0);

commit("cancelled");
commit.cancel();
assert.equal(timers.size, 0);
assert.deepEqual(committed, ["final", "next"]);

let retryAttempts = 0;
const retryingCommit = engine.createDebouncedCommit(value => {
  retryAttempts += 1;
  if (retryAttempts === 1) throw new Error("storage unavailable");
  committed.push(value);
}, 300);
retryingCommit("retry-payload");
assert.throws(() => retryingCommit.flush(), /storage unavailable/);
assert.equal(retryAttempts, 1);
retryingCommit.flush();
assert.equal(retryAttempts, 2);
assert.deepEqual(committed, ["final", "next", "retry-payload"]);
