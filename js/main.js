(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const number = (value, digits = 2) => value.toLocaleString('es-AR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const svgLine = (x1, y1, x2, y2, stroke, opacity = 1, extra = '') =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" opacity="${opacity}" ${extra}/>`;
  const svgText = (x, y, value, fill, size = 9, anchor = 'start', extra = '') =>
    `<text x="${x}" y="${y}" fill="${fill}" font-family="Alfa Mono, monospace" font-size="${size}" text-anchor="${anchor}" ${extra}>${value}</text>`;
  const linePath = (values, x, y) => values.map((value, index) =>
    `${index ? 'L' : 'M'}${x(index).toFixed(2)},${y(value).toFixed(2)}`).join(' ');

  // Seeded, synthetic OHLC observations. No live quotes or performance claims.
  function seededRandom(seed) {
    return () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  const random = seededRandom(12423);
  const gaussian = () => Math.sqrt(-2 * Math.log(Math.max(random(), 1e-12))) *
    Math.cos(2 * Math.PI * random());
  const observations = [];
  let previous = 100;
  for (let i = 0; i < 144; i++) {
    const drift = i < 23 ? 0.08 : i < 40 ? -0.18 : i < 72 ? 0.25 : i < 99 ? -0.19 : i < 125 ? 0.28 : -0.03;
    const open = previous;
    const close = Math.max(50, open + drift + gaussian() * 0.55);
    observations.push({
      open,
      close,
      high: Math.max(open, close) + Math.abs(gaussian()) * 0.24 + 0.08,
      low: Math.min(open, close) - Math.abs(gaussian()) * 0.24 - 0.08,
      change: ((close - open) / open) * 100,
    });
    previous = close;
  }
  const closes = observations.map(point => point.close);
  const returns = observations.map(point => point.change);
  const rolling = closes.map((_, index) => {
    const windowValues = closes.slice(Math.max(0, index - 15), index + 1);
    const mean = windowValues.reduce((total, value) => total + value, 0) / windowValues.length;
    const variance = windowValues.reduce((total, value) => total + (value - mean) ** 2, 0) /
      Math.max(1, windowValues.length - 1);
    return { mean, sd: Math.sqrt(variance) };
  });

  let chartMode = 'candles';
  let bandVisible = true;
  let cursorIndex = observations.length - 1;
  const plot = { left: 10, right: 650, top: 40, bottom: 239 };
  let domainMin = Math.min(...observations.map(point => point.low), ...rolling.map(point => point.mean - 2 * point.sd)) - 0.5;
  let domainMax = Math.max(...observations.map(point => point.high), ...rolling.map(point => point.mean + 2 * point.sd)) + 0.5;
  const x = index => plot.left + (index / (observations.length - 1)) * (plot.right - plot.left);
  const y = value => plot.bottom - ((value - domainMin) / (domainMax - domainMin)) * (plot.bottom - plot.top);
  const splitIndex = 99;
  const splitX = x(splitIndex);

  function drawHeroChart(animate = false) {
    let staticSvg = `<rect x="${splitX}" y="26" width="${660 - splitX}" height="232" fill="#b9d8eb" opacity=".025"/>`;
    for (let i = 0; i < 5; i++) {
      const value = domainMin + ((domainMax - domainMin) * i) / 4;
      const position = y(value);
      staticSvg += svgLine(10, position, 660, position, '#b2cee0', 0.09);
      staticSvg += svgText(714, position + 3, number(value, 1), '#8b9faf', 9, 'end');
    }
    [0, 36, 72, 108, 143].forEach(index => {
      staticSvg += svgLine(x(index), 27, x(index), 250, '#b2cee0', 0.045);
      staticSvg += svgText(x(index), 321, `t${String(index).padStart(3, '0')}`, '#7c94a7', 8, index === 143 ? 'end' : 'start');
    });
    staticSvg += svgLine(splitX, 25, splitX, 301, '#9bc2dd', 0.5, 'stroke-dasharray="3 5"');
    staticSvg += svgText(11, 14, 'EXPLORACIÓN', '#7f98ad', 8);
    staticSvg += svgText(splitX + 10, 14, 'FUERA DE MUESTRA', '#a9c9de', 8);
    staticSvg += svgText(713, 282, 'rₜ', '#92aabd', 10, 'end');
    staticSvg += svgLine(10, 283, 660, 283, '#96b3ca', 0.15);
    const maxReturn = Math.max(...returns.map(Math.abs));
    observations.forEach((point, index) => {
      const height = (point.change / maxReturn) * 18;
      staticSvg += `<rect x="${x(index) - 1.2}" y="${height > 0 ? 283 - height : 283}" width="2.4" height="${Math.max(Math.abs(height), 0.45)}" fill="${height >= 0 ? '#76baff' : '#586ec4'}" opacity=".42"/>`;
    });
    $('#chart-static').innerHTML = staticSvg;

    const upperPath = linePath(rolling.map(point => point.mean + 2 * point.sd), x, y);
    const lowerPath = rolling.map((point, index) => ({ point, index })).reverse()
      .map(({ point, index }) => `L${x(index).toFixed(2)},${y(point.mean - 2 * point.sd).toFixed(2)}`).join(' ');
    let dataSvg = `<g class="stat-band" visibility="${bandVisible ? 'visible' : 'hidden'}"><path d="${upperPath} ${lowerPath} Z" fill="url(#band-area)"/>`;
    dataSvg += `<path d="${upperPath}" fill="none" stroke="#5596ff" stroke-opacity=".25" stroke-width=".7"/>`;
    dataSvg += `<path d="${linePath(rolling.map(point => point.mean - 2 * point.sd), x, y)}" fill="none" stroke="#5596ff" stroke-opacity=".25" stroke-width=".7"/></g>`;

    if (chartMode === 'candles') {
      const candleWidth = ((plot.right - plot.left) / observations.length) * 0.57;
      observations.forEach((point, index) => {
        const color = point.close >= point.open ? '#99dbff' : '#7c9de6';
        dataSvg += `<g class="candle" ${animate ? `style="--delay:${(index / observations.length) * 0.65}s"` : 'style="animation:none;opacity:1"'}>`;
        dataSvg += svgLine(x(index), y(point.high), x(index), y(point.low), color, 0.75, 'stroke-width=".8"');
        dataSvg += `<rect x="${x(index) - candleWidth / 2}" y="${Math.min(y(point.open), y(point.close))}" width="${candleWidth}" height="${Math.max(1, Math.abs(y(point.open) - y(point.close)))}" fill="${color}" opacity=".95"/></g>`;
      });
    } else {
      const path = linePath(closes, x, y);
      dataSvg += `<path d="${path} L${plot.right},258 L${plot.left},258 Z" fill="url(#price-area)"/>`;
      dataSvg += `<path d="${path}" fill="none" stroke="#90ccff" stroke-width="1.7" stroke-linejoin="round"/>`;
    }
    dataSvg += `<path d="${linePath(rolling.map(point => point.mean), x, y)}" class="${animate ? 'chart-line-reveal' : ''}" fill="none" stroke="#4f92ff" stroke-opacity=".85" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>`;
    $('#chart-data').innerHTML = dataSvg;
  }

  function setCursor(index, visible = true, announce = false) {
    cursorIndex = clamp(Math.round(index), 0, observations.length - 1);
    const point = observations[cursorIndex];
    const px = x(cursorIndex);
    const py = y(point.close);
    $('#crosshair-x').setAttribute('x1', px);
    $('#crosshair-x').setAttribute('x2', px);
    $('#crosshair-y').setAttribute('y1', py);
    $('#crosshair-y').setAttribute('y2', py);
    $('#crosshair-dot').setAttribute('cx', px);
    $('#crosshair-dot').setAttribute('cy', py);
    $('#chart-cursor').setAttribute('visibility', visible ? 'visible' : 'hidden');
    $('#price-readout').textContent = number(point.close);
    $('#sample-readout').textContent = visible ? `t${String(cursorIndex).padStart(3, '0')} · SERIE SINTÉTICA` : 'ÍNDICE · BASE 100';
    if (announce) {
      $('#market-chart').setAttribute('aria-label', `Observación ${cursorIndex} de 143. Precio ${number(point.close)}. Usá las flechas para recorrer el gráfico.`);
    }
  }

  drawHeroChart(!reducedMotion.matches);
  setCursor(observations.length - 1, false);
  const chart = $('#market-chart');
  function pointerCursor(event) {
    const rect = $('#hero-chart').getBoundingClientRect();
    const chartX = ((event.clientX - rect.left) / rect.width) * 720;
    setCursor(((chartX - plot.left) / (plot.right - plot.left)) * (observations.length - 1));
  }
  chart.addEventListener('pointermove', pointerCursor, { passive: true });
  chart.addEventListener('pointerdown', pointerCursor, { passive: true });
  chart.addEventListener('pointerleave', () => setCursor(observations.length - 1, false));
  chart.addEventListener('blur', () => setCursor(observations.length - 1, false));
  chart.addEventListener('keydown', event => {
    let nextIndex = cursorIndex;
    if (event.key === 'ArrowLeft') nextIndex -= 1;
    else if (event.key === 'ArrowRight') nextIndex += 1;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = observations.length - 1;
    else return;
    event.preventDefault();
    setCursor(nextIndex, true, true);
  });
  $$('.chart-mode').forEach(button => button.addEventListener('click', () => {
    chartMode = button.dataset.chartMode;
    $$('.chart-mode').forEach(item => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    drawHeroChart();
  }));
  $('#band-toggle').addEventListener('click', event => {
    bandVisible = !bandVisible;
    event.currentTarget.setAttribute('aria-pressed', String(bandVisible));
    $('.stat-band').setAttribute('visibility', bandVisible ? 'visible' : 'hidden');
  });

  function drawDistribution() {
    const mean = returns.reduce((total, value) => total + value, 0) / returns.length;
    const sd = Math.sqrt(returns.reduce((total, value) => total + (value - mean) ** 2, 0) / (returns.length - 1));
    const normalized = returns.map(value => (value - mean) / sd);
    const binCount = 19;
    const bins = Array(binCount).fill(0);
    normalized.forEach(value => bins[clamp(Math.floor(((value + 3) / 6) * binCount), 0, binCount - 1)]++);
    const peak = Math.max(...bins);
    let markup = svgLine(6, 65, 194, 65, '#8fafc6', 0.2);
    bins.forEach((count, i) => {
      const height = (count / peak) * 46;
      markup += `<rect x="${9 + i * 9.7}" y="${65 - height}" width="6.7" height="${height}" fill="${i < 8 ? '#3a68d2' : '#76b5ff'}" opacity="${i < 8 ? '.48' : '.64'}"/>`;
    });
    const points = Array.from({ length: 65 }, (_, i) => {
      const z = -3 + (i / 64) * 6;
      return { x: 9 + (i / 64) * 183, y: 65 - Math.exp(-0.5 * z * z) * 48 };
    });
    markup += `<path d="${points.map((point, i) => `${i ? 'L' : 'M'}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ')}" fill="none" stroke="#b3d9ff" stroke-width="1" opacity=".78"/>`;
    markup += svgLine(101, 11, 101, 67, '#adcedf', 0.32, 'stroke-dasharray="2 3"');
    markup += svgText(30, 81, '−2σ', '#8da4b7', 8);
    markup += svgText(101, 81, 'μ', '#b3d9ff', 9, 'middle');
    markup += svgText(176, 81, '+2σ', '#8da4b7', 8, 'end');
    $('#hero-distribution').innerHTML = markup;
  }
  drawDistribution();

  function drawObservation() {
    const left = 3;
    const right = 565;
    const min = Math.min(...closes) - 0.7;
    const max = Math.max(...closes) + 0.7;
    const px = index => left + (index / (closes.length - 1)) * (right - left);
    const py = value => 125 - ((value - min) / (max - min)) * 107;
    let priceMarkup = '';
    for (let i = 0; i < 3; i++) {
      const value = min + ((max - min) * i) / 2;
      priceMarkup += svgLine(left, py(value), right, py(value), '#6b9cdd', 0.12);
      priceMarkup += svgText(617, py(value) + 3, number(value, 1), '#91b9ed', 8, 'end');
    }
    const path = linePath(closes, px, py);
    priceMarkup += `<path d="${path} L${right},128 L${left},128 Z" fill="#306bff" opacity=".1"/>`;
    priceMarkup += `<path d="${path}" fill="none" stroke="#6badff" stroke-width="1.6" stroke-linejoin="round"/>`;
    priceMarkup += `<circle cx="${px(closes.length - 1)}" cy="${py(closes.at(-1))}" r="2.8" fill="#6badff"/>`;
    $('#observation-price').innerHTML = priceMarkup;

    let returnMarkup = svgLine(left, 44, right, 44, '#6badff', 0.25);
    const maxReturn = Math.max(...returns.map(Math.abs));
    returns.forEach((value, index) => {
      const height = (value / maxReturn) * 32;
      returnMarkup += `<rect x="${px(index) - 1.1}" y="${height > 0 ? 44 - height : 44}" width="2.2" height="${Math.max(Math.abs(height), 0.4)}" fill="${height >= 0 ? '#619eff' : '#6c86d8'}" opacity=".75"/>`;
    });
    returnMarkup += svgText(617, 47, '0', '#91b9ed', 8, 'end');
    returnMarkup += svgText(left, 96, 't000', '#91b9ed', 8);
    returnMarkup += svgText(right, 96, 't143', '#91b9ed', 8, 'end');
    $('#observation-returns').innerHTML = returnMarkup;
  }
  drawObservation();

  // Tab selection also works with arrows, Home and End.
  const tabs = $$('.method-tabs [role=tab]');
  const panels = $$('.method-panel');
  function activateTab(index, focus = false) {
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[i].hidden = !selected;
    });
    if (focus) tabs[index].focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(index));
    tab.addEventListener('keydown', event => {
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      activateTab(next, true);
    });
  });

  $('#explore-edge').addEventListener('click', () => activateTab(2));

  // A transparent mathematical illustration, not a backtest.
  const costInput = $('#cost-input');
  function updateExpectancy() {
    const cost = Number(costInput.value);
    const expectancy = 0.54 * 1.4 - (1 - 0.54) * 1 - cost;
    const sign = expectancy >= 0 ? '+' : '−';
    $('#edge-output').innerHTML = `${sign}${number(Math.abs(expectancy), 3)} <small>R</small>`;
    $('#edge-output').classList.toggle('negative', expectancy < 0);
    $('#cost-output').textContent = `${number(cost)} R`;
    $('#edge-marker').style.left = `${clamp(((expectancy + 0.32) / 0.64) * 100, 0, 100)}%`;
    costInput.setAttribute('aria-valuetext', `Costo ${number(cost)} R. Expectativa neta ${expectancy < 0 ? 'menos ' : ''}${number(Math.abs(expectancy), 3)} R.`);
  }
  costInput.addEventListener('input', updateExpectancy);
  updateExpectancy();

  const menuButton = $('.menu-button');
  const nav = $('#main-nav');
  function closeMenu(returnFocus = false) {
    menuButton.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
    $('.menu-label').textContent = 'Menú';
    if (returnFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    $('.menu-label').textContent = open ? 'Cerrar' : 'Menú';
  });
  $$('#main-nav a').forEach(link => link.addEventListener('click', () => closeMenu()));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') closeMenu(true);
  });
  document.addEventListener('pointerdown', event => {
    if (!$('#site-header').contains(event.target)) closeMenu();
  });
  const desktopQuery = window.matchMedia('(min-width: 761px)');
  desktopQuery.addEventListener('change', event => {
    if (event.matches) closeMenu();
  });

  // Content is visible by default; motion is progressive enhancement.
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    document.documentElement.classList.add('motion-ready');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -15px 0px' });
    $$('.reveal').forEach(element => observer.observe(element));
  }
  reducedMotion.addEventListener('change', event => {
    if (event.matches) document.documentElement.classList.remove('motion-ready');
  });
  $('#year').textContent = String(new Date().getFullYear());

  // An evolving mathematical scene. The visible chart is always synthetic.
  const hero = $('#inicio');
  const scene = $('.research-composition');
  const canvas = $('#quantum-field');
  const context = canvas.getContext('2d', { alpha: true });
  const pauseButton = $('#scene-toggle');
  let motionOn = !reducedMotion.matches;
  let explicitMotionChoice = null;
  let heroVisible = true;
  let animationId = 0;
  let lastFrame = 0;
  let lastPaint = 0;
  let elapsed = 0;
  let lastTick = 0;
  let barAge = 0;
  let streamHoldUntil = 0;
  let hoverChart = false;
  let sceneWidth = 1;
  let sceneHeight = 1;
  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let renderedFrames = 0;

  const codeBlock = $('.code-fragment code');
  codeBlock.innerHTML = codeBlock.innerHTML.split('\n').map(line => `<span class="code-row">${line}</span>`).join('');
  const codeRows = $$('.code-row');
  let codeStep = -1;
  const executionLabels = ['Separando la serie', 'Ajustando el modelo', 'Evaluando fuera de muestra', 'Incorporando costos'];

  function recomputeSeries() {
    observations.forEach((point, index) => {
      closes[index] = point.close;
      returns[index] = point.change;
      const values = closes.slice(Math.max(0, index - 15), index + 1);
      const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
      const sd = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, values.length - 1));
      rolling[index] = { mean, sd };
    });
    const nextMin = Math.min(...observations.map(point => point.low), ...rolling.map(point => point.mean - 2 * point.sd)) - .5;
    const nextMax = Math.max(...observations.map(point => point.high), ...rolling.map(point => point.mean + 2 * point.sd)) + .5;
    domainMin += (nextMin - domainMin) * .12;
    domainMax += (nextMax - domainMax) * .12;
  }

  function evolveChart(delta) {
    if (hoverChart || document.activeElement === chart || performance.now() < streamHoldUntil) return;
    barAge += delta;
    const previousClose = observations[observations.length - 1].close;
    if (barAge >= 2400) {
      observations.shift();
      observations.push({ open: previousClose, close: previousClose, high: previousClose + .06, low: previousClose - .06, change: 0 });
      barAge = 0;
    }
    const current = observations[observations.length - 1];
    const drift = Math.sin(elapsed * .00009) * .04 + .007;
    current.close = Math.max(65, current.close + gaussian() * .09 + drift);
    current.high = Math.max(current.high, current.close + .025);
    current.low = Math.min(current.low, current.close - .025);
    current.change = (current.close / current.open - 1) * 100;
    recomputeSeries();
    drawHeroChart();
    setCursor(observations.length - 1, false);
    const reading = $('.chart-reading');
    reading.classList.toggle('flash-up', current.close >= previousClose);
    reading.classList.toggle('flash-down', current.close < previousClose);
    if (barAge === 0) {
      drawDistribution();
      drawObservation();
    }
  }

  chart.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') hoverChart = true;
  });
  chart.addEventListener('pointerleave', () => { hoverChart = false; });
  chart.addEventListener('pointerdown', () => { streamHoldUntil = performance.now() + 3000; }, { passive: true });

  function resizeScene() {
    if (!context) return;
    const rect = hero.getBoundingClientRect();
    sceneWidth = rect.width;
    sceneHeight = rect.height;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, sceneWidth < 760 ? 1.35 : 1.6);
    canvas.width = Math.round(sceneWidth * pixelRatio);
    canvas.height = Math.round(sceneHeight * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    paintField(elapsed / 1000);
  }

  // A mixture of Gaussian surfaces, projected into three dimensions.
  // This is mathematical artwork, not a price forecast or a trading signal.
  function paintField(time) {
    if (!context) return;
    context.clearRect(0, 0, sceneWidth, sceneHeight);
    const narrow = sceneWidth < 760;
    const centerX = sceneWidth * (narrow ? .69 : .77);
    const centerY = sceneHeight * (narrow ? .65 : .61);
    const scale = sceneWidth * (narrow ? .155 : .088);
    const yaw = -.38 + Math.sin(time * .19) * .13 + pointerX * .15;
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    const phase = Math.sin(time * .31);
    const spread = 1.12 + Math.sin(time * .25) * .15;
    function project(a, b) {
      const primary = 2.3 * Math.exp(-((a - phase * .45) ** 2) / (2 * spread ** 2) - ((b + .2) ** 2) / 1.9);
      const secondary = .9 * Math.exp(-((a + 2.15) ** 2) / 1.3 - ((b - 1.1 - phase * .15) ** 2) / 1.4);
      const height = primary + secondary;
      const rotatedX = a * cos - b * sin;
      const rotatedZ = a * sin + b * cos;
      const perspective = 1 / (1 + rotatedZ * .045);
      return {
        x: centerX + rotatedX * scale * perspective,
        y: centerY + (rotatedZ * .45 - height * .91) * scale * perspective + pointerY * 8,
        height,
      };
    }
    const columns = narrow ? 32 : 48;
    const rows = narrow ? 17 : 24;
    const mesh = [];
    for (let row = 0; row <= rows; row++) {
      const points = [];
      for (let col = 0; col <= columns; col++) points.push(project(-4.8 + col / columns * 9.6, -3.1 + row / rows * 6.2));
      mesh.push(points);
    }
    context.lineWidth = .75;
    for (let row = 0; row <= rows; row++) {
      context.beginPath();
      mesh[row].forEach((point, col) => col ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
      const intensity = .09 + Math.sin(row / rows * Math.PI) * .2;
      context.strokeStyle = `rgba(57,123,255,${intensity})`;
      context.stroke();
    }
    for (let col = 0; col <= columns; col++) {
      context.beginPath();
      mesh.forEach((row, i) => i ? context.lineTo(row[col].x, row[col].y) : context.moveTo(row[col].x, row[col].y));
      context.strokeStyle = col % 4 === 0 ? 'rgba(114,174,255,.3)' : 'rgba(48,107,255,.14)';
      context.stroke();
    }
    const travelingRow = Math.floor((time * .7) % rows);
    context.beginPath();
    mesh[travelingRow].forEach((point, col) => col ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
    context.strokeStyle = 'rgba(143,202,255,.62)';
    context.lineWidth = 1;
    context.stroke();
    for (let i = 0; i < (narrow ? 9 : 17); i++) {
      const a = -4.8 + ((time * .35 + i * .61) % 9.6);
      const b = Math.sin(i * 2.17) * 2.9;
      const point = project(a, b);
      const radius = 1.2 + point.height * .35;
      const glow = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, 11);
      glow.addColorStop(0, 'rgba(82,151,255,.45)');
      glow.addColorStop(1, 'rgba(48,107,255,0)');
      context.fillStyle = glow;
      context.fillRect(point.x - 11, point.y - 11, 22, 22);
      context.beginPath();
      context.arc(point.x, point.y, radius, 0, Math.PI * 2);
      context.fillStyle = '#8bc8ff';
      context.fill();
    }
    renderedFrames++;
    canvas.dataset.frame = String(renderedFrames);
  }

  function queueFrame() {
    if (!animationId && motionOn && heroVisible && !document.hidden) animationId = requestAnimationFrame(animateScene);
  }
  function animateScene(now) {
    animationId = 0;
    if (!motionOn || !heroVisible || document.hidden) return;
    const delta = lastFrame ? Math.min(now - lastFrame, 80) : 16;
    lastFrame = now;
    elapsed += delta;
    pointerX += (pointerTargetX - pointerX) * .08;
    pointerY += (pointerTargetY - pointerY) * .08;
    const interval = sceneWidth < 760 ? 1000 / 24 : 1000 / 32;
    if (now - lastPaint >= interval) {
      paintField(elapsed / 1000);
      lastPaint = now;
    }
    if (elapsed - lastTick >= 320) {
      evolveChart(elapsed - lastTick);
      lastTick = elapsed;
      const nextStep = Math.floor(elapsed / 2500) % 4;
      if (nextStep !== codeStep) {
        codeStep = nextStep;
        codeRows.forEach((row, index) => row.classList.toggle('executing', index === codeStep));
        $('#execution-label').textContent = executionLabels[codeStep];
      }
    }
    queueFrame();
  }
  function stopFrames() {
    if (animationId) cancelAnimationFrame(animationId);
    animationId = 0;
    lastFrame = 0;
  }
  function applyMotion(value) {
    motionOn = value;
    document.documentElement.classList.toggle('effects-paused', !value);
    document.documentElement.classList.toggle('user-motion-on', value && reducedMotion.matches);
    pauseButton.setAttribute('aria-pressed', String(!value));
    pauseButton.setAttribute('aria-label', value ? 'Pausar animaciones y simulación' : 'Reproducir animaciones y simulación');
    $('.scene-toggle-label').textContent = value ? 'Pausar' : 'Animar';
    $('.pause-symbol').textContent = value ? 'Ⅱ' : '▷';
    hero.dataset.motion = value ? 'running' : 'paused';
    if (value) queueFrame();
    else stopFrames();
  }
  pauseButton.addEventListener('click', () => {
    explicitMotionChoice = !motionOn;
    applyMotion(explicitMotionChoice);
  });
  reducedMotion.addEventListener('change', event => {
    if (explicitMotionChoice === null) applyMotion(!event.matches);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopFrames();
    else queueFrame();
  });

  if ('IntersectionObserver' in window) {
    const sceneObserver = new IntersectionObserver(entries => {
      heroVisible = entries[0].isIntersecting;
      document.documentElement.classList.toggle('scene-outside', !heroVisible);
      if (heroVisible) queueFrame();
      else { stopFrames(); drawObservation(); }
    }, { threshold: .03 });
    sceneObserver.observe(hero);
  }
  if ('ResizeObserver' in window) new ResizeObserver(resizeScene).observe(hero);
  else window.addEventListener('resize', resizeScene, { passive: true });

  hero.addEventListener('pointermove', event => {
    if (!motionOn || event.pointerType === 'touch') return;
    const rect = hero.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    pointerTargetX = (px - .5) * 2;
    pointerTargetY = (py - .5) * 2;
    hero.style.setProperty('--pointer-x', `${px * 100}%`);
    hero.style.setProperty('--pointer-y', `${py * 100}%`);
    scene.style.setProperty('--scene-rx', `${2.5 - pointerTargetY * 2.4}deg`);
    scene.style.setProperty('--scene-ry', `${-3.5 + pointerTargetX * 3.5}deg`);
    scene.style.setProperty('--card-x', `${px * 100}%`);
    scene.style.setProperty('--card-y', `${py * 100}%`);
  }, { passive: true });
  hero.addEventListener('pointerleave', () => {
    pointerTargetX = pointerTargetY = 0;
    scene.style.setProperty('--scene-rx', '3deg');
    scene.style.setProperty('--scene-ry', '-5deg');
  });

  $$('.button-light,.rgg-arrow').forEach(button => {
    button.addEventListener('pointermove', event => {
      if (!motionOn || event.pointerType === 'touch') return;
      const rect = button.getBoundingClientRect();
      const mx = (event.clientX - rect.left - rect.width / 2) * .1;
      const my = (event.clientY - rect.top - rect.height / 2) * .15;
      button.style.transform = `translate(${mx}px,${my}px)`;
    }, { passive: true });
    button.addEventListener('pointerleave', () => { button.style.transform = ''; });
  });
  let scrollQueued = false;
  function updateScroll() {
    const maxScroll = document.documentElement.scrollHeight - innerHeight;
    $('.scroll-progress').style.transform = `scaleX(${maxScroll > 0 ? scrollY / maxScroll : 0})`;
    $('#site-header').classList.toggle('scrolled', scrollY > 30);
    scrollQueued = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScroll); }
  }, { passive: true });
  resizeScene();
  updateScroll();
  applyMotion(motionOn);

})();
