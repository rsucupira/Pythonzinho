(() => {
  const panel = document.querySelector('#calculator-panel');
  if (!panel || typeof CashSensitivityMath === 'undefined') return;

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

  function outcomeLabel(value) {
    if (value === 'cash') return 'À vista';
    if (value === 'installments') return 'Parcelado';
    return '≈ empate';
  }

  function resultClass(value) {
    if (value === 'cash') return 'cash-sensitivity-cash';
    if (value === 'installments') return 'cash-sensitivity-installments';
    return 'cash-sensitivity-equal';
  }

  function renderReturnCard(point) {
    if (!point.found) {
      return `
        <article class="cash-sensitivity-card">
          <span>Retorno de equilíbrio</span>
          <strong>Fora da faixa</strong>
          <small>Não houve empate entre −90% e 200% a.a. com as demais premissas fixas.</small>
        </article>`;
    }
    return `
      <article class="cash-sensitivity-card">
        <span>Retorno de equilíbrio</span>
        <strong>${NUMBER.format(point.value)}% a.a.</strong>
        <small>Nesse retorno alternativo, o valor presente das parcelas fica aproximadamente igual ao preço à vista.</small>
      </article>`;
  }

  function renderMatrix(data, values) {
    const header = data.returnRates.map((rate) => `<th>${NUMBER.format(rate)}%</th>`).join('');
    const rows = data.matrix.map((row) => {
      const currentRow = Math.abs(row.cashPrice - values.cashPrice) < 0.01;
      const cells = row.cells.map((cell) => {
        const current = currentRow && Math.abs(cell.annualReturn - values.annualReturn) < 1e-9;
        const title = cell.difference >= 0
          ? `À vista economiza ${BRL.format(Math.abs(cell.difference))} em valor presente`
          : `Parcelado economiza ${BRL.format(Math.abs(cell.difference))} em valor presente`;
        return `<td class="${resultClass(cell.recommendation)}${current ? ' cash-sensitivity-current' : ''}" title="${title}">${outcomeLabel(cell.recommendation)}</td>`;
      }).join('');
      return `<tr><th>${BRL.format(row.cashPrice)}</th>${cells}</tr>`;
    }).join('');

    return `
      <div class="cash-sensitivity-table-wrap">
        <table class="cash-sensitivity-table">
          <caption>Linhas: preço à vista · Colunas: retorno alternativo</caption>
          <thead><tr><th>À vista ↓ / retorno →</th>${header}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="cash-sensitivity-legend">
        <span><i class="cash-sensitivity-cash"></i>À vista</span>
        <span><i class="cash-sensitivity-installments"></i>Parcelado</span>
        <span><i class="cash-sensitivity-equal"></i>Empate aproximado</span>
      </div>`;
  }

  function renderSensitivity() {
    const calc = activeCalculator();
    const form = activeForm();
    const existing = panel.querySelector('#cash-sensitivity-panel');

    if (!calc || calc.id !== 'avista-ou-parcelado' || !form) {
      existing?.remove();
      return;
    }

    const values = readValues(calc, form);
    if (!values) {
      existing?.remove();
      return;
    }

    const data = CashSensitivityMath.cashVsInstallmentsSensitivity(values);
    let section = existing;
    if (!section) {
      section = document.createElement('section');
      section.id = 'cash-sensitivity-panel';
      section.className = 'cash-sensitivity-panel';
      form.appendChild(section);
    }

    section.innerHTML = `
      <span class="section-kicker">Sensibilidade</span>
      <h3>Quando a decisão muda?</h3>
      <p>Mantendo as demais premissas constantes, estes são os pontos em que o valor presente das duas alternativas se iguala.</p>
      <div class="cash-sensitivity-cards">
        <article class="cash-sensitivity-card">
          <span>Preço à vista de equilíbrio</span>
          <strong>${BRL.format(data.breakEvenCashPrice)}</strong>
          <small>Equivale a um desconto de ${NUMBER.format(data.breakEvenDiscount)}% sobre o total nominal parcelado.</small>
        </article>
        <article class="cash-sensitivity-card">
          <span>Parcela de equilíbrio</span>
          <strong>${BRL.format(data.breakEvenInstallmentValue)}</strong>
          <small>Com ${NUMBER.format(values.installments)} parcelas e o retorno informado, esse valor deixa as opções aproximadamente equivalentes.</small>
        </article>
        ${renderReturnCard(data.returnBreakEven)}
      </div>
      <div style="margin-top:18px">
        <h4>Matriz de decisão</h4>
        <p>Varia o preço à vista em ±10% e o retorno alternativo em passos de 2 p.p. ao redor do cenário atual.</p>
      </div>
      ${renderMatrix(data, values)}
    `;
  }

  function scheduleRender() {
    window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(renderSensitivity, 120);
  }

  panel.addEventListener('input', (event) => {
    if (event.target.closest('#compare-panel')) return;
    scheduleRender();
  });
  panel.addEventListener('submit', scheduleRender);

  const observer = new MutationObserver((mutations) => {
    const relevant = mutations.some((mutation) => {
      const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
      return !target?.closest('#cash-sensitivity-panel');
    });
    if (relevant) scheduleRender();
  });
  observer.observe(panel, { childList: true, subtree: true });

  window.addEventListener('DOMContentLoaded', () => window.setTimeout(renderSensitivity, 0));
})();
