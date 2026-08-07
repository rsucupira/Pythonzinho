(() => {
  const panel = document.querySelector('#calculator-panel');
  if (!panel || typeof SensitivityMath === 'undefined') return;

  let renderTimer = null;

  function activeCalculator() {
    return calculators.find((calc) => calc.id === state.activeId) || null;
  }

  function activeForm() {
    return panel.querySelector('#active-form');
  }

  function readValues(calc, form) {
    const values = {};
    for (const field of calc.fields) {
      const input = form.elements[field.id];
      if (!input || input.value === '') return null;
      const value = Number(input.value);
      if (!Number.isFinite(value)) return null;
      if (field.min !== undefined && value < field.min) return null;
      if (field.max !== undefined && value > field.max) return null;
      values[field.id] = value;
    }
    const customError = calc.validate ? calc.validate(values) : null;
    return customError ? null : values;
  }

  function outcomeLabel(outcome) {
    if (outcome === 'buy') return 'Comprar';
    if (outcome === 'rent') return 'Alugar + investir';
    return 'Empate';
  }

  function thresholdDirection(point, unit) {
    if (!point.found) return null;
    const below = point.belowOutcome;
    const above = point.aboveOutcome;
    if (below === above) return `Empate próximo de ${unit}`;
    if (above === 'buy') return `Comprar passa a vencer acima de ${unit}`;
    if (above === 'rent') return `Alugar + investir passa a vencer acima de ${unit}`;
    if (below === 'buy') return `Comprar tende a vencer abaixo de ${unit}`;
    if (below === 'rent') return `Alugar + investir tende a vencer abaixo de ${unit}`;
    return `Ponto de equilíbrio próximo de ${unit}`;
  }

  function noCrossingText(point, rangeText) {
    if (point.minOutcome === point.maxOutcome) {
      return `${outcomeLabel(point.minOutcome)} vence em toda a faixa analisada (${rangeText}).`;
    }
    return `Não foi encontrado um cruzamento estável dentro da faixa ${rangeText}.`;
  }

  function propertyBaseline(current, baseline) {
    if (!current.found || !baseline?.found) return '';
    if (Math.abs(current.value - baseline.value) < 0.005) return '';
    return `<small class="sensitivity-baseline">Sem custos detalhados: ${NUMBER.format(baseline.value)}% a.a.</small>`;
  }

  function rentBaseline(current, baseline) {
    if (!current.found || !baseline?.found) return '';
    if (Math.abs(current.value - baseline.value) < 1) return '';
    return `<small class="sensitivity-baseline">Sem custos detalhados: ${BRL.format(baseline.value)}/mês</small>`;
  }

  function propertyCard(point, baseline) {
    if (!point.found) {
      return `
        <article class="sensitivity-card">
          <span>Valorização de equilíbrio</span>
          <strong>Fora da faixa</strong>
          <p>${noCrossingText(point, '−20% a 30% a.a.')}</p>
        </article>`;
    }
    const formatted = `${NUMBER.format(point.value)}% a.a.`;
    return `
      <article class="sensitivity-card">
        <span>Valorização de equilíbrio</span>
        <strong>${formatted}</strong>
        <p>${thresholdDirection(point, formatted)}.</p>
        ${propertyBaseline(point, baseline)}
      </article>`;
  }

  function rentCard(point, baseline) {
    if (!point.found) {
      return `
        <article class="sensitivity-card">
          <span>Aluguel de equilíbrio</span>
          <strong>Fora da faixa</strong>
          <p>${noCrossingText(point, `${BRL.format(point.min)} a ${BRL.format(point.max)}/mês`)}</p>
        </article>`;
    }
    const formatted = `${BRL.format(point.value)}/mês`;
    return `
      <article class="sensitivity-card">
        <span>Aluguel de equilíbrio</span>
        <strong>${formatted}</strong>
        <p>${thresholdDirection(point, formatted)}.</p>
        ${rentBaseline(point, baseline)}
      </article>`;
  }

  function matrixCell(cell, isCurrent) {
    const label = cell.recommendation === 'buy' ? 'Comprar' : cell.recommendation === 'rent' ? 'Alugar' : '≈';
    const className = cell.recommendation === 'buy'
      ? 'sensitivity-buy'
      : cell.recommendation === 'rent'
        ? 'sensitivity-rent'
        : 'sensitivity-equal';
    const difference = cell.difference >= 0
      ? `Compra +${BRL.format(cell.difference)}`
      : `Aluguel +${BRL.format(Math.abs(cell.difference))}`;
    return `<td class="${className}${isCurrent ? ' sensitivity-current' : ''}" title="${difference}">${label}</td>`;
  }

  function renderMatrix(data, values) {
    const header = data.investmentRates.map((rate) => {
      const current = Math.abs(rate - values.investmentReturn) < 1e-9;
      return `<th${current ? ' class="sensitivity-current-axis"' : ''}>${NUMBER.format(rate)}%</th>`;
    }).join('');

    const rows = data.matrix.map((row) => {
      const currentRow = Math.abs(row.propertyAppreciation - values.propertyAppreciation) < 1e-9;
      const cells = row.cells.map((cell) => matrixCell(
        cell,
        currentRow && Math.abs(cell.investmentReturn - values.investmentReturn) < 1e-9
      )).join('');
      return `
        <tr>
          <th${currentRow ? ' class="sensitivity-current-axis"' : ''}>${NUMBER.format(row.propertyAppreciation)}%</th>
          ${cells}
        </tr>`;
    }).join('');

    return `
      <div class="sensitivity-table-wrap">
        <table class="sensitivity-table">
          <caption>Linhas: valorização do imóvel · Colunas: retorno dos investimentos</caption>
          <thead><tr><th>Imóvel ↓ / Invest. →</th>${header}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="sensitivity-legend" aria-label="Legenda da matriz">
        <span><i class="sensitivity-buy"></i>Comprar</span>
        <span><i class="sensitivity-rent"></i>Alugar + investir</span>
        <span><i class="sensitivity-equal"></i>Empate aproximado</span>
      </div>`;
  }

  function renderSensitivity() {
    const calc = activeCalculator();
    const form = activeForm();
    const existing = panel.querySelector('#sensitivity-panel');

    if (!calc || calc.id !== 'comprar-ou-alugar' || !form) {
      existing?.remove();
      return;
    }

    const values = readValues(calc, form);
    if (!values) {
      existing?.remove();
      return;
    }

    const data = SensitivityMath.buyVsRentSensitivity(values);
    let section = existing;
    if (!section) {
      section = document.createElement('section');
      section.id = 'sensitivity-panel';
      section.className = 'sensitivity-panel';
      form.appendChild(section);
    }

    section.innerHTML = `
      <div class="sensitivity-heading">
        <div>
          <span class="section-kicker">Sensibilidade</span>
          <h3>O que precisa mudar para inverter a decisão?</h3>
          <p>Os pontos de equilíbrio e a matriz abaixo usam somente o Cenário A. Quando custos detalhados estão ativos, os cards também mostram o threshold equivalente sem esses custos.</p>
        </div>
        <div class="sensitivity-current-result">
          <span>Resultado atual</span>
          <strong>${outcomeLabel(data.current.recommendation)}</strong>
          <small>diferença de ${BRL.format(Math.abs(data.current.difference))}</small>
        </div>
      </div>
      <div class="sensitivity-cards">
        ${propertyCard(data.propertyBreakEven, data.noDetailed.propertyBreakEven)}
        ${rentCard(data.rentBreakEven, data.noDetailed.rentBreakEven)}
      </div>
      <div class="sensitivity-matrix-head">
        <div>
          <h4>Matriz de decisão</h4>
          <p>Teste simultaneamente valorização do imóvel e retorno da carteira em passos de 2 pontos percentuais.</p>
        </div>
      </div>
      ${renderMatrix(data, values)}
      <p class="sensitivity-note">A análise altera uma ou duas premissas por vez e não substitui cenários completos. Os custos detalhados informados no Cenário A permanecem ativos em toda a matriz.</p>
    `;
  }

  function scheduleRender() {
    window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(renderSensitivity, 140);
  }

  panel.addEventListener('input', (event) => {
    if (event.target.closest('#compare-panel')) return;
    scheduleRender();
  });
  panel.addEventListener('submit', scheduleRender);

  const observer = new MutationObserver((mutations) => {
    const relevant = mutations.some((mutation) => {
      const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
      return !target?.closest('#sensitivity-panel');
    });
    if (relevant) scheduleRender();
  });
  observer.observe(panel, { childList: true, subtree: true });

  window.addEventListener('DOMContentLoaded', () => window.setTimeout(renderSensitivity, 0));
})();
