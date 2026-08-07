(() => {
  const panel = document.querySelector('#calculator-panel');
  if (!panel || typeof FinancingSensitivityMath === 'undefined') return;

  let renderTimer = null;

  function activeCalculator() {
    return calculators.find((calc) => calc.id === state.activeId) || null;
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
    return values;
  }

  function rateCard(data) {
    const point = data.rateBreakEven;
    if (!point.found) {
      const message = point.reason === 'below-minimum'
        ? `Mesmo a 0% a.a., a parcela seria ${BRL.format(point.paymentAtMin)}, acima do alvo.`
        : `A parcela permanece abaixo do alvo até ${NUMBER.format(point.max)}% a.a. na faixa analisada.`;
      return `<article class="financing-sensitivity-card"><span>Taxa máxima para o alvo</span><strong>Fora da faixa</strong><p>${message}</p></article>`;
    }
    return `<article class="financing-sensitivity-card"><span>Taxa máxima para o alvo</span><strong>${NUMBER.format(point.value)}% a.a.</strong><p>Acima dessa taxa, a parcela ultrapassa ${BRL.format(data.targetPayment)}.</p></article>`;
  }

  function principalCard(data, values) {
    const limit = data.principalLimit;
    const detail = limit.reductionNeeded > 0
      ? `Reduza o principal em aproximadamente ${BRL.format(limit.reductionNeeded)} — equivalente a aumentar a entrada nessa magnitude.`
      : `Há folga aproximada de ${BRL.format(limit.headroom)} no principal antes de superar a parcela-alvo.`;
    return `<article class="financing-sensitivity-card"><span>Valor financiado máximo</span><strong>${BRL.format(limit.maxPrincipal)}</strong><p>${detail}</p></article>`;
  }

  function termCard(data) {
    if (!data.monthsNeeded.found) {
      return `<article class="financing-sensitivity-card"><span>Prazo mínimo para o alvo</span><strong>Acima de 100 anos</strong><p>Mesmo em 1.200 meses a parcela não atinge o valor informado.</p></article>`;
    }
    return `<article class="financing-sensitivity-card"><span>Prazo mínimo para o alvo</span><strong>${NUMBER.format(data.monthsNeeded.months)} meses</strong><p>Nesse prazo, a parcela estimada fica em ${BRL.format(data.monthsNeeded.payment)}.</p></article>`;
  }

  function onePointCard(data) {
    const p = data.plusOnePoint;
    return `<article class="financing-sensitivity-card"><span>Impacto de +1 p.p. na taxa</span><strong>+${BRL.format(p.paymentIncrease)}/mês</strong><p>Os juros totais aumentam aproximadamente ${BRL.format(p.interestIncrease)} mantendo principal e prazo.</p></article>`;
  }

  function renderMatrix(data, values) {
    const header = data.terms.map((months) => `<th${months === Math.round(values.months) ? ' class="financing-current-axis"' : ''}>${NUMBER.format(months)}m</th>`).join('');
    const rows = data.matrix.map((row) => {
      const currentRow = Math.abs(row.annualRate - values.annualRate) < 1e-9;
      const cells = row.cells.map((cell) => {
        const current = currentRow && cell.months === Math.round(values.months);
        const cls = `${cell.meetsTarget ? 'financing-meets' : 'financing-misses'}${current ? ' financing-current' : ''}`;
        return `<td class="${cls}" title="Juros totais: ${BRL.format(cell.interest)}"><strong>${BRL.format(cell.payment)}</strong><small>${cell.meetsTarget ? 'dentro do alvo' : 'acima do alvo'}</small></td>`;
      }).join('');
      return `<tr><th>${NUMBER.format(row.annualRate)}%</th>${cells}</tr>`;
    }).join('');
    return `<div class="financing-table-wrap"><table class="financing-table"><caption>Linhas: taxa anual · Colunas: prazo</caption><thead><tr><th>Taxa ↓ / Prazo →</th>${header}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function renderSensitivity() {
    const calc = activeCalculator();
    const form = panel.querySelector('#active-form');
    const existing = panel.querySelector('#financing-sensitivity-panel');

    if (!calc || calc.id !== 'financiamento' || !form) {
      existing?.remove();
      return;
    }

    const values = readValues(calc, form);
    if (!values) {
      existing?.remove();
      return;
    }

    let data;
    try {
      data = FinancingSensitivityMath.financingSensitivity(values);
    } catch (_) {
      existing?.remove();
      return;
    }
    window.FinancingSensitivityData = data;

    let section = existing;
    if (!section) {
      section = document.createElement('section');
      section.id = 'financing-sensitivity-panel';
      section.className = 'financing-sensitivity-panel';
      form.appendChild(section);
    }

    const gap = data.paymentGap;
    const status = gap <= 0 ? 'Parcela dentro do alvo' : 'Parcela acima do alvo';
    const gapText = gap <= 0
      ? `${BRL.format(Math.abs(gap))} de folga por mês`
      : `${BRL.format(gap)} acima do alvo por mês`;

    section.innerHTML = `
      <div class="financing-sensitivity-head">
        <div>
          <span class="section-kicker">Sensibilidade</span>
          <h3>O que precisa mudar para caber na parcela?</h3>
          <p>Os limites abaixo usam o mesmo sistema Price do cálculo principal e mantêm as demais premissas constantes.</p>
        </div>
        <div class="financing-target-status">
          <span>Parcela-alvo</span>
          <strong>${BRL.format(data.targetPayment)}</strong>
          <small>${status} · ${gapText}</small>
        </div>
      </div>
      <div class="financing-sensitivity-cards">
        ${rateCard(data)}
        ${principalCard(data, values)}
        ${termCard(data)}
        ${onePointCard(data)}
      </div>
      <div class="financing-matrix-head">
        <h4>Matriz taxa × prazo</h4>
        <p>Cada célula mostra a parcela Price. Células destacadas indicam se a parcela fica dentro ou acima do alvo informado.</p>
      </div>
      ${renderMatrix(data, values)}
      <p class="financing-sensitivity-note">Não inclui CET, seguros, tarifas, impostos ou regras específicas da instituição financeira. “Entrada adicional” representa apenas a redução equivalente do valor financiado.</p>`;
  }

  function scheduleRender(delay = 120) {
    window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(renderSensitivity, delay);
  }

  panel.addEventListener('input', (event) => {
    if (event.target.closest('#compare-panel')) return;
    scheduleRender();
  });
  panel.addEventListener('submit', () => scheduleRender(20));

  const observer = new MutationObserver((mutations) => {
    const relevant = mutations.some((mutation) => {
      const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
      return !target?.closest('#financing-sensitivity-panel');
    });
    if (relevant) scheduleRender(60);
  });
  observer.observe(panel, { childList: true, subtree: true });
  window.addEventListener('DOMContentLoaded', () => window.setTimeout(renderSensitivity, 0));
})();