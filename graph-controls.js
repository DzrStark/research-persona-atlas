function mountGraphControls() {
  const graph = /** @type {SVGSVGElement} */ (document.querySelector('#graph'));
  const controls = document.createElement('div');
  controls.innerHTML = '<button class="button ghost" data-zoom="1.25" aria-label="放大图谱">＋</button> <button class="button ghost" data-zoom="0.8" aria-label="缩小图谱">−</button> <button class="button ghost" id="resetGraph">重置视图</button> <label>视图 <select id="graphMode"><option value="both">相似关系与路径</option><option value="similarity">相似关系</option><option value="paths">发展路径</option></select></label><p>可拖动图谱背景平移，使用加减按钮缩放；窄屏可横向滑动。实主/实副与理主/理副标记不依赖颜色。</p>';
  controls.className = 'graph-controls';
  document.querySelector('.atlas-layout').before(controls);
  let viewport = [0, 0, 900, 560];
  const apply = () => graph.setAttribute('viewBox', viewport.join(' '));
  controls.querySelectorAll('[data-zoom]').forEach(button => {
    button.addEventListener('click', () => {
      const factor = Number(button.getAttribute('data-zoom'));
      const width = Math.max(300, Math.min(1800, viewport[2] / factor));
      const height = width * 560 / 900;
      viewport = [viewport[0] + (viewport[2] - width) / 2, viewport[1] + (viewport[3] - height) / 2, width, height];
      apply();
    });
  });
  document.querySelector('#resetGraph').addEventListener('click', () => { viewport = [0, 0, 900, 560]; apply(); });
  document.querySelector('#graphMode').addEventListener('change', event => {
    const selected = /** @type {HTMLSelectElement} */ (event.target);
    graph.classList.toggle('only-similarity', selected.value === 'similarity');
    graph.classList.toggle('only-paths', selected.value === 'paths');
  });
  let drag = null;
  graph.onpointerdown = event => {
    if (/** @type {Element} */ (event.target).closest('.node')) return;
    drag = { x: event.clientX, y: event.clientY, viewport: [...viewport] };
    graph.setPointerCapture(event.pointerId);
  };
  graph.onpointermove = event => {
    if (!drag) return;
    const rectangle = graph.getBoundingClientRect();
    viewport[0] = drag.viewport[0] - (event.clientX - drag.x) * viewport[2] / rectangle.width;
    viewport[1] = drag.viewport[1] - (event.clientY - drag.y) * viewport[3] / rectangle.height;
    apply();
  };
  graph.onpointerup = graph.onpointercancel = () => { drag = null; };
}
