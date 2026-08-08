(function exposeCanvasPerformanceFixture() {
  const requestedCount = Number(window?.__CANVAS_PERFORMANCE_FIXTURE__?.count);
  if (![100, 300].includes(requestedCount)) return;

  function createCanvasPerformanceFixture(count) {
    const fixtureCount = Number(count) === 300 ? 300 : 100;
    const cards = Array.from({ length: fixtureCount }, (_, index) => ({
      id: `perf_${index}`,
      type: index % 3 === 0 ? "text" : "image",
      title: `节点 ${index + 1}`,
      x: (index % 20) * 360,
      y: Math.floor(index / 20) * 280,
      w: 320,
      h: 220,
      prompt: "性能测试",
      status: "idle",
      resultUrl: "",
      mime: ""
    }));
    const edges = cards.slice(1).map((card, index) => ({
      id: `perf_edge_${index}`,
      from: cards[index].id,
      to: card.id
    }));

    return { cards, edges };
  }

  window.createCanvasPerformanceFixture = createCanvasPerformanceFixture;
  window.dispatchEvent(new Event("canvas-performance-fixture-ready"));
})();
