(() => {
  const CHART_IDS = new Set(['juros-compostos', 'financiamento', 'meta-de-patrimonio', 'comprar-ou-alugar']);
  const panel = document.querySelector('#calculator-panel');
  if (!panel || typeof CalculadoraMath === 'undefined') return;

  const safeNumber = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  function formValues(calc, form) {
    const values = {};
    calc.fields.forEach((field) => {
      values[field.id] = safeNumber(form.elements[field.id]?.value, field.value ?? 0);
    });
    return values;
  }

  function comparisonValues(calc) {
    const comparison = window.CalculatorComparison;
    if (!comparison?.enabled || comparison.activeId !== calc.id || !comparison.values) return null;
    return comparison.values;
  }

  function sampleSeries(points, maxPoints = 72) {
    if (points.length <= maxPoints) return points;
    const step = (points.length - 1) / (maxPoints - 1);
    return Array.from({ length: maxPoints }, (_, i) => points[Math.round(i * step)]);
  }

  function mapped(points, mapper) {
    return sampleSeries(points.map(mapper));
  }

  function compoundData(values, compare) {
    const a = CalculadoraMath.compoundSeries(values);
    const aPoints = mapped(a.points, (p) => ({ x: p.month, value: p.balance, contributed: p.contributed }));
    if (compare) {
      const b = CalculadoraMath.compoundSeries(compare);
      const bPoints = mapped(b.points, (p) => ({ x: p.month, value: p.balance }));
      return {
        title: 'Cenário A × Cenário B',
        subtitle: 'Compare a evolução do patrimônio sob duas combinações de capital, aporte, taxa e horizonte.',
        series: [
          { label: 'A · patrimônio', className: 'chart-line-primary', points: aPoints, key: 'value' },
          { label: 'B · patrimônio', className: 'chart-line-secondary', dashed: true, points: bPoints, key: 'value' }
        ],
        formatX: timeLabel
      };
    }
    return {
      title: 'Evolução do patrimônio',
      subtitle: 'Patrimônio projetado versus capital efetivamente aportado.',
      series: [
        { label: 'Patrimônio', className: 'chart-line-primary', points: aPoints, key: 'value' },
        { label: 'Capital aportado', className: 'chart-line-secondary', points: aPoints, key: 'contributed' }
      ],
      formatX: timeLabel
    };
  }

  function financingData(values, compare) {
    const a = CalculadoraMath.priceSchedule(values);
    const aPoints = mapped(a.points, (p) => ({ x: p.month, balance: p.balance, amortized: p.cumulativePrincipal, interest: p.cumulativeInterest }));
    if (compare) {
      const b = CalculadoraMath.priceSchedule(compare);
      const bPoints = mapped(b.points, (p) => ({ x: p.month, balance: p.balance }));
      return {
        title: 'Saldo devedor: cenário A × B',
        subtitle: 'Compare prazo, principal e taxa observando a velocidade de queda da dívida.',
        series: [
          { label: 'A · saldo', className: 'chart-line-primary', points: aPoints, key: 'balance' },
          { label: 'B · saldo', className: 'chart-line-secondary', dashed: true, points: bPoints, key: 'balance' }
        ],
        formatX: (x) => `${Math.round(x)}m`
      };
    }
    return {
      title: 'Evolução do financiamento',
      subtitle: 'Saldo devedor, amortização acumulada e juros acumulados ao longo do prazo.',
      series: [
        { label: 'Saldo devedor', className: 'chart-line-primary', points: aPoints, key: 'balance' },
        { label: 'Amortização', className: 'chart-line-secondary', points: aPoints, key: 'amortized' },
        { label: 'Juros', className: 'chart-line-tertiary', points: aPoints, key: 'interest' }
      ],
      formatX: (x) => `${Math.round(x)}m`
    };
  }

  function targetData(values, compare) {
    const a = CalculadoraMath.targetSeries(values);
    const aPoints = mapped(a.points, (p) => ({ x: p.month, balance: p.balance, contributed: p.contributed, target: p.target }));
    if (compare) {
      const b = CalculadoraMath.targetSeries(compare);
      const bPoints = mapped(b.points, (p) => ({ x: p.month, balance: p.balance, target: p.target }));
      return {
        title: 'Caminho até a meta: A × B',
        subtitle: 'Compare como aportes, patrimônio inicial, retorno e meta alteram o tempo necessário.',
        series: [
          { label: 'A · patrimônio', className: 'chart-line-primary', points: aPoints, key: 'balance' },
          { label: 'B · patrimônio', className: 'chart-line-secondary', dashed: true, points: bPoints, key: 'balance' },
          { label: 'A · meta', className: 'chart-line-goal', dashed: true, points: aPoints, key: 'target' },
          { label: 'B · meta', className: 'chart-line-tertiary', dashed: true, points: bPoints, key: 'target' }
        ],
        formatX: timeLabel
      };
    }
    return {
      title: 'Caminho até a meta',
      subtitle: a.reached ? 'A curva mostra quando o patrimônio projetado cruza a meta informada.' : 'A meta não foi atingida dentro do limite de 100 anos do simulador.',
      series: [
        { label: 'Patrimônio', className: 'chart-line-primary', points: aPoints, key: 'balance' },
        { label: 'Capital aportado', className: 'chart-line-secondary', points: aPoints, key: 'contributed' },
        { label: 'Meta', className: 'chart-line-goal', dashed: true, points: aPoints, key: 'target' }
      ],
      formatX: timeLabel
    };
  }

  function housingData(values, compare) {
    const a = CalculadoraMath.buyVsRentSeries(values);
    const aPoints = mapped(a.points, (p) => ({ x: p.month, buy: p.buyerNetWorth, rent: p.renterNetWorth }));
    if (compare) {
      const b = CalculadoraMath.buyVsRentSeries(compare);
      const bPoints = mapped(b.points, (p) => ({ x: p.month, buy: p.buyerNetWorth, rent: p.renterNetWorth }));
      return {
        title: 'Comprar × alugar em dois cenários',
        subtitle: 'Linhas contínuas representam o cenário A; linhas tracejadas representam o cenário B.',
        series: [
          { label: 'A · comprar', className: 'chart-line-primary', points: aPoints, key: 'buy' },
          { label: 'A · alugar', className: 'chart-line-secondary', points: aPoints, key: 'rent' },
          { label: 'B · comprar', className: 'chart-line-primary', dashed: true, points: bPoints, key: 'buy' },
          { label: 'B · alugar', className: 'chart-line-secondary', dashed: true, points: bPoints, key: 'rent' }
        ],
        formatX: timeLabel
      };
    }
    return {
      title: 'Patrimônio: comprar × alugar',
      subtitle: 'As curvas usam o mesmo orçamento habitacional mensal e investem a diferença de custo entre as alternativas.',
      series: [
        { label: 'Comprar', className: 'chart-line-primary', points: aPoints, key: 'buy' },
        { label: 'Alugar + investir', className: 'chart-line-secondary', points: aPoints, key: 'rent' }
      ],
      formatX: timeLabel
    };
  }

  function timeLabel(x) {
    return x >= 12 ? `${(x / 12).toFixed(x % 12 === 0 ? 0 : 1)}a` : `${Math.round(x)}m`;
  }

  function chartData(calc, values, compare) {
    if (calc.id === 'juros-compostos') return compoundData(values, compare);
    if (calc.id === 'financiamento') return financingData(values, compare);
    if (calc.id === 'meta-de-patrimonio') return targetData(values, compare);
    if (calc.id === 'comprar-ou-alugar') return housingData(values, compare);
    return null;
  }

  function compactMoney(value) {
    const abs = Math.abs(value);
    if (abs >= 1e9) return `R$ ${(value / 1e9).toFixed(1)} bi`;
    if (abs >= 1e6) return `R$ ${(value / 1e6).toFixed(1)} mi`;
    if (abs >= 1e3) return `R$ ${(value / 1e3).toFixed(0)} mil`;
    return `R$ ${Math.round(value)}`;
  }

  function linePath(points, key, scaleX, scaleY) {
    return points.map((point, index) => `${index ? 'L' : 'M'} ${scaleX(point.x).toFixed(2)} ${scaleY(point[key]).toFixed(2)}`).join(' ');
  }

  function renderSvg(data) {
    const width = 720;
    const height = 300;
    const margin = { top: 18, right: 22, bottom: 42, left: 72 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const allPoints = data.series.flatMap((series) => series.points);
    const xs = allPoints.map((p) => p.x);
    const values = data.series.flatMap((series) => series.points.map((p) => safeNumber(p[series.key], 0)));
    const xMin = Math.min(...xs);
    const xMaxRaw = Math.max(...xs);
    const xMax = xMaxRaw === xMin ? xMin + 1 : xMaxRaw;
    const yMin = Math.min(0, ...values);
    const yMaxRaw = Math.max(...values, 1);
    const yPadding = Math.max(1, (yMaxRaw - yMin) * 0.08);
    const yMax = yMaxRaw + yPadding;

    const scaleX = (x) => margin.left + ((x - xMin) / (xMax - xMin)) * innerWidth;
    const scaleY = (y) => margin.top + innerHeight - ((y - yMin) / (yMax - yMin)) * innerHeight;
    const yTicks = Array.from({ length: 5 }, (_, i) => yMin + ((yMax - yMin) * i) / 4);
    const xTicks = Array.from({ length: 5 }, (_, i) => xMin + ((xMax - xMin) * i) / 4);

    const grid = yTicks.map((tick) => `
      <line class="chart-grid" x1="${margin.left}" y1="${scaleY(tick)}" x2="${width - margin.right}" y2="${scaleY(tick)}" />
      <text class="chart-axis-label" x="${margin.left - 10}" y="${scaleY(tick) + 4}" text-anchor="end">${compactMoney(tick)}</text>`).join('');
    const xAxis = xTicks.map((tick) => `<text class="chart-axis-label" x="${scaleX(tick)}" y="${height - 15}" text-anchor="middle">${data.formatX(tick)}</text>`).join('');
    const paths = data.series.map((series) => `<path class="chart-line ${series.className}${series.dashed ? ' chart-line-dashed' : ''}" d="${linePath(series.points, series.key, scaleX, scaleY)}" />`).join('');
    const endpoints = data.series.map((series) => {
      const last = series.points[series.points.length - 1];
      return `<circle class="chart-endpoint ${series.className}" cx="${scaleX(last.x)}" cy="${scaleY(last[series.key])}" r="3.5" />`;
    }).join('');

    return `<svg class="scenario-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${data.title}">
      ${grid}${xAxis}
      <line class="chart-axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" />
      <line class="chart-axis" x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" />
      ${paths}${endpoints}
    </svg>`;
  }

  function renderChart() {
    const calc = calculators.find((item) => item.id === state.activeId);
    const form = panel.querySelector('#active-form');
    const result = panel.querySelector('#result-slot');
    if (!calc || !form || !result || !CHART_IDS.has(calc.id)) return;

    const values = formValues(calc, form);
    const customError = calc.validate ? calc.validate(values) : null;
    if (customError) return;
    const compare = comparisonValues(calc);
    const data = chartData(calc, values, compare);
    if (!data) return;

    let slot = panel.querySelector('#chart-slot');
    if (!slot) {
      slot = document.createElement('section');
      slot.id = 'chart-slot';
      slot.className = 'chart-box';
      slot.setAttribute('aria-live', 'polite');
      result.insertAdjacentElement('afterend', slot);
    }

    slot.innerHTML = `
      <div class="chart-heading">
        <div><span class="result-label">Visualização</span><h3>${data.title}</h3><p>${data.subtitle}</p></div>
        <div class="chart-legend">${data.series.map((series) => `<span><i class="${series.className}${series.dashed ? ' chart-line-dashed' : ''}"></i>${series.label}</span>`).join('')}</div>
      </div>
      <div class="chart-scroll">${renderSvg(data)}</div>`;
  }

  let renderTimer = null;
  function scheduleRender() {
    window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(renderChart, 40);
  }

  panel.addEventListener('input', scheduleRender);
  panel.addEventListener('submit', () => window.setTimeout(renderChart, 0));
  window.addEventListener('comparisonchange', scheduleRender);

  const observer = new MutationObserver((mutations) => {
    const relevant = mutations.some((mutation) => {
      const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
      return !target?.closest('#chart-slot');
    });
    if (relevant) scheduleRender();
  });
  observer.observe(panel, { childList: true, subtree: true });
  window.addEventListener('DOMContentLoaded', () => window.setTimeout(renderChart, 0));
})();