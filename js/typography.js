(() => {
  'use strict';

  const charts = [...document.querySelectorAll('#hero-chart, #hero-distribution, #observation-price, #observation-returns')];

  function sizeLabels(svg) {
    const box = svg.viewBox.baseVal;
    const scale = Math.min(svg.clientWidth / box.width, svg.clientHeight / box.height);
    if (!Number.isFinite(scale) || scale <= 0) return;
    const targetPixels = parseFloat(getComputedStyle(svg).getPropertyValue('--type-data')) || 10;
    svg.style.setProperty('--chart-label-size', `${(targetPixels / scale).toFixed(2)}px`);
  }

  charts.forEach(svg => {
    svg.classList.add('readable-svg');
    sizeLabels(svg);
  });

  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(entries => entries.forEach(entry => sizeLabels(entry.target)));
    charts.forEach(svg => observer.observe(svg));
  } else {
    window.addEventListener('resize', () => charts.forEach(sizeLabels), { passive:true });
  }
})();
