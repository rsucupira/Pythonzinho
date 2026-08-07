(() => {
  const panel = document.querySelector('#calculator-panel');
  if (!panel || typeof AmortizationSensitivityMath === 'undefined') return;

  let timer = null;

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
    if (value === 'amortize') return 'Amortizar';
    if (value === 'invest') return 'Investir';
    return 'Empate';
  }

  function renderMatrix(data, values) {
    const header = data.investmentRates.map((rate) => {
      const current = Math.abs(rate - values.investmentRate) < 1e-9;
      return `<th${current ? ' class="amort-current-axis"' : ''}>${NUMBER.format(rate)}%</th>`;
    }).join('');

    const rows = data.matrix.map((row) => {
      const currentRow = Math.abs(row.debtRate - values.debtRate) < 1e-9;
      const cells = row.cells.map((cell) => {
        const current = currentRow && Math.abs(cell.investmentRate - values.investmentRate) < 1e-9;
        const cls = cell.recommendation === 'amortize' ? 'amort-win' : cell.recommendation === 'invest' ? 'invest-win' : 'amort-equal';
        const label = cell.recommendation === 'amortize' ? 'Amort.' : cell.recommendation === 'invest' ? 'Invest.' : '≈';
        return `<td class="${cls}${current ? ' amort-current' : ''}" title="Diferença: ${BRL.format(Math.abs(cell.difference))}">${label}</td>`;
      }).join('');
      return `<tr><th${currentRow ? ' class="amort-current-axis"' : ''}>${NUMBER.format(row.debtRate)}%</th>${cells}</tr>`;
    }).join('');

    return `
      <div class="amort-table-wrap">
        <table class="amort-table">
          <caption>Linhas: custo da dívida · Colunas: retorno do investimento</caption>
          <thead><tr><th>Dívida ↓ / Invest. →</th>${header}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function render() {
    const calc = activeCalculator();
    const form = activeForm();
    const existing = panel.querySelector('#amortization-sensitivity');
    if (!calc || calc.id !== 'amortizar-ou-investir' || !form) {
      existing?.remove();
      return;
    }

    const values = readValues(calc, form);
    if (!values) {
      existing?.remove();
      return;
    }

    const data = AmortizationSensitivityMath.analyze(values);
    let section = existing;
    if (!section) {
      section = document.createElement('section');
      section.id = 'amortization-sensitivity';
      section.className = 'amort-sensitivity';
      form.appendChild(section);
    }

    const spreadText = data.spread > 0
      ? `A dívida está ${NUMBER.format(Math.abs(data.spread))} p.p. acima do retorno esperado.`
      : data.spread < 0
        ? `O investimento está ${NUMBER.format(Math.abs(data.spread))} p.p. acima do custo da dívida.`
        : 'As taxas estão no ponto de equilíbrio.';

    section.innerHTML = `
      <div class="amort-sensitivity-head">
        <div>
          <span class="section-kicker">Sensibilidade</span>
          <h3>Qual taxa muda a decisão?</h3>
          <p>Como este MVP compara taxas efetivas anuais de forma direta, o equilíbrio ocorre quando as duas taxas se igualam.</p>
        </div>
        <div class="amort-current-result">
          <span>Resultado atual</span>
          <strong>${outcomeLabel(data.current.recommendation)}</strong>
          <small>${spreadText}</small>
        </div>
      </div>
      <div class="amort-thresholds">
        <article>
          <span>Retorno mínimo para investir empatar</span>
          <strong>${NUMBER.format(data.investmentBreakEven)}% a.a.</strong>
          <p>Acima dessa taxa, investir passa a superar a amortização no modelo simplificado.</p>
        </article>
        <article>
          <span>Custo máximo da dívida para investir empatar</span>
          <strong>${NUMBER.format(data.debtBreakEven)}% a.a.</strong>
          <p>Abaixo dessa taxa, investir passa a superar a amortização.</p>
        </article>
      </div>
      <div class="amort-matrix-head">
        <h4>Matriz dívida × investimento</h4>
        <p>Passos de 2 pontos percentuais ao redor das taxas atuais.</p>
      </div>
      ${renderMatrix(data, values)}
      <p class="amort-note">A comparação não considera impostos, risco, liquidez, prazo efetivo da dívida nem benefícios específicos da amortização. Use o resultado como referência educacional.</p>`;
  }

  function schedule() {
    window.clearTimeout(timer);
    timer = window.setTimeout(render, 100);
  }

  panel.addEventListener('input', (event) => {
    if (event.target.closest('#compare-panel')) return;
    schedule();
  });
  panel.addEventListener('submit', schedule);

  const observer = new MutationObserver((mutations) => {
    const relevant = mutations.some((mutation) => {
      const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
      return !target?.closest('#amortization-sensitivity');
    });
    if (relevant) schedule();
  });
  observer.observe(panel, { childList: true, subtree: true });

  window.addEventListener('DOMContentLoaded', () => window.setTimeout(render, 0));
})();
