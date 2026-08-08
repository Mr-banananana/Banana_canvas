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
      cancel() {
        current = { mode: "idle", pointerId: null, payload: null };
        return current;
      }
    };
  }

  function createFrameScheduler(flush) {
    let frameId = null;
    let pending = null;
    let hasPending = false;

    const requestFrame = typeof requestAnimationFrame === "function"
      ? requestAnimationFrame
      : callback => setTimeout(callback, 16);

    function run() {
      frameId = null;
      const payload = pending;
      pending = null;
      const shouldFlush = hasPending;
      hasPending = false;
      if (shouldFlush) flush(payload);
    }

    return payload => {
      pending = payload;
      hasPending = true;
      if (frameId === null) frameId = requestFrame(run);
    };
  }

  function boundsOf(bounds) {
    if (!bounds) return null;
    const x = Number(bounds.x ?? bounds.left ?? 0);
    const y = Number(bounds.y ?? bounds.top ?? 0);
    const width = Number(bounds.width ?? Math.max(0, (bounds.right ?? x) - x));
    const height = Number(bounds.height ?? Math.max(0, (bounds.bottom ?? y) - y));
    return {
      x,
      y,
      width,
      height,
      right: Number(bounds.right ?? x + width),
      bottom: Number(bounds.bottom ?? y + height),
      centerX: x + width / 2,
      centerY: y + height / 2
    };
  }

  function alignmentCandidates(moving, target, axis) {
    if (axis === "x") {
      return [
        { correction: target.x - moving.x, position: target.x },
        { correction: target.right - moving.right, position: target.right },
        { correction: target.x - moving.right, position: target.x },
        { correction: target.right - moving.x, position: target.right },
        { correction: target.centerX - moving.centerX, position: target.centerX }
      ];
    }
    return [
      { correction: target.y - moving.y, position: target.y },
      { correction: target.bottom - moving.bottom, position: target.bottom },
      { correction: target.y - moving.bottom, position: target.y },
      { correction: target.bottom - moving.y, position: target.bottom },
      { correction: target.centerY - moving.centerY, position: target.centerY }
    ];
  }

  function closestAlignment(moving, targets, axis, threshold) {
    let closest = null;
    targets.forEach((targetValue, targetIndex) => {
      const target = boundsOf(targetValue);
      if (!target) return;
      alignmentCandidates(moving, target, axis).forEach(candidate => {
        if (Math.abs(candidate.correction) > threshold) return;
        if (!closest || Math.abs(candidate.correction) < Math.abs(closest.correction)) {
          closest = { ...candidate, axis, targetIndex };
        }
      });
    });
    return closest;
  }

  function calculateSnap(input = {}) {
    const origin = input.origin || { x: 0, y: 0 };
    const delta = input.delta || { x: 0, y: 0 };
    const raw = { dx: Number(delta.x || 0), dy: Number(delta.y || 0), guides: [] };
    if (input.altKey) return raw;

    const gridSize = Number(input.gridSize || 16);
    const scale = Math.max(Number(input.scale || 1), Number.EPSILON);
    const threshold = Number(input.thresholdPx ?? 6) / scale;
    const snapped = {
      dx: Math.round((Number(origin.x || 0) + raw.dx) / gridSize) * gridSize - Number(origin.x || 0),
      dy: Math.round((Number(origin.y || 0) + raw.dy) / gridSize) * gridSize - Number(origin.y || 0),
      guides: []
    };
    const moving = boundsOf(input.movingBounds);
    const targets = Array.isArray(input.targets) ? input.targets : [];
    if (!moving || targets.length === 0) return snapped;

    const moved = boundsOf({
      x: moving.x + snapped.dx,
      y: moving.y + snapped.dy,
      width: moving.width,
      height: moving.height
    });
    const xGuide = closestAlignment(moved, targets, "x", threshold);
    const yGuide = closestAlignment(moved, targets, "y", threshold);
    if (xGuide) {
      snapped.dx += xGuide.correction;
      snapped.guides.push({ axis: "x", position: xGuide.position, targetIndex: xGuide.targetIndex });
    }
    if (yGuide) {
      snapped.dy += yGuide.correction;
      snapped.guides.push({ axis: "y", position: yGuide.position, targetIndex: yGuide.targetIndex });
    }
    return snapped;
  }

  function createDebouncedCommit(commit, delay) {
    let timer = null;
    let pending;
    let hasPending = false;

    function flush() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      if (!hasPending) return;
      const value = pending;
      pending = undefined;
      hasPending = false;
      commit(value);
    }

    function debounced(value) {
      pending = value;
      hasPending = true;
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(flush, delay);
    }

    debounced.flush = flush;
    debounced.cancel = () => {
      if (timer !== null) clearTimeout(timer);
      timer = null;
      pending = undefined;
      hasPending = false;
    };
    return debounced;
  }

  global.CanvasEngine = {
    createInteractionController,
    createFrameScheduler,
    calculateSnap,
    createDebouncedCommit
  };
})(window);
