(() => {
  const SUPPORTED = new Set(['juros-compostos', 'financiamento', 'meta-de-patrimonio', 'comprar-ou-alugar']);
  const panel = document.querySelector('#calculator-panel');
  if (!panel) return;

  let syncTimer = null;

  function activeCalc() {
    return calculators.find((calc) => calc.id === state.activeId) || null;
  }

  function activeForm() {
    return panel.querySelector('#active-form');
  }

  function readValues(calc, form, prefix = '') {
    const values = {};
    for (const field of calc.fields) {
      const input = form.elements[`${prefix}${field.id}`];
      if (!input || input.value === '') return { error: `Preencha corretamente “${field.label}”.` };
      const value = Number(input.value);
      if (!Number.isFinite(value)) return { error: `Preencha corretamente “${field.label}”.` };
      if (field.min !== undefined && value < field.min) return { error: `“${field.label}” precisa ser no mínimo ${field.min}.` };
      if (field.max !== undefined && value > field.max) return { error: `“${field.label}” precisa ser no máximo ${field.max}.` };
      values[field.id] = value;
    }
    const customError = calc.validate ? calc.validate(values) : null;
    return customError ? { error: customError } : { values };
  }

  function fieldHtml(field, value) {
    return `
      <div class="field">
        <label for="compare-field-${field.id}">${field.label}</label>
        <div class="field-shell">
          ${field.prefix ? `<span>${field.prefix}</span>` : ''}
          <input id="compare-field-${field.id}" name="b_${field.id}" type="number" inputmode="decimal"
            value="${value}" step="${field.step ?? 'any'}"
            ${field.min !== undefined ? `min="${field.min}"` : ''}
            ${field.max !== undefined ? `max="${field.max}"` : ''} required />
          ${field.suffix ? `<span>${field.suffix}</span>` : ''}
        </div>
      </div>`;
  }

  function resultHtml(result) {
    return `
      <div class="result-box compare-result-box">
        <div class="result-label">Cenário B · ${result.label}</div>
        <div class="result-main">${result.main}</div>
        <div class="result-subtitle">${result.subtitle}</div>
        <div class="metrics">
          ${result.metrics.map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`).join('')}
        </div>
      </div>`;
  }

  function queryValues(calc) {
    const params = new URLSearchParams(window.location.search);
    const values = {};
    let hasAny = false;
    calc.fields.forEach((field) => {
      const raw = params.get(`b_${field.id}`);
      if (raw === null) return;
      const value = Number(raw);
      if (!Number.isFinite(value)) return;
      values[field.id] = value;
      hasAny = true;
    });
    return { values, hasAny, requested: params.get('compare') === '1' || hasAny };
  }

  function syncQuery(calc, values) {
    const url = new URL(window.location.href);
    url.searchParams.set('compare', '1');
    calc.fields.forEach((field) => url.searchParams.set(`b_${field.id}`, String(values[field.id])));
    history.replaceState(null, '', `${url.pathname}?${url.searchParams.toString()}`);
  }

  function clearCompareQuery() {
    const url = new URL(window.location.href);
    url.searchParams.delete('compare');
    [...url.searchParams.keys()].filter((key) => key.startsWith('b_')).forEach((key) => url.searchParams.delete(key));
    const query = url.searchParams.toString();
    history.replaceState(null, '', `${url.pathname}${query ? `?${query}` : ''}`);
  }

  function publish(calc, values) {
    window.CalculatorComparison = { enabled: true, activeId: calc.id, values: { ...values } };
    window.dispatchEvent(new CustomEvent('comparisonchange', { detail: window.CalculatorComparison }));
  }

  function calculateB(calc, form) {
    const resultSlot = form.querySelector('[data-compare-result]');
    const errorSlot = form.querySelector('[data-compare-error]');
    const read = readValues(calc, form, 'b_');
    if (read.error) {
      resultSlot.innerHTML = '';
      errorSlot.innerHTML = `<div class="error-message">${read.error}</div>`;
      return;
    }
    errorSlot.innerHTML = '';
    resultSlot.innerHTML = resultHtml(calc.calculate(read.values));
    publish(calc, read.values);
    window.clearTimeout(syncTimer);
    syncTimer = window.setTimeout(() => syncQuery(calc, read.values), 120);
  }

  function closeComparison() {
    panel.querySelector('#compare-panel')?.remove();
    const toggle = panel.querySelector('[data-compare-toggle]');
    if (toggle) toggle.textContent = 'Comparar cenário B';
    window.CalculatorComparison = { enabled: false, activeId: null, values: null };
    clearCompareQuery();
    window.dispatchEvent(new CustomEvent('comparisonchange', { detail: window.CalculatorComparison }));
  }

  function openComparison(calc) {
    if (panel.querySelector('#compare-panel')) return;
    const sourceForm = activeForm();
    if (!sourceForm) return;
    const fromQuery = queryValues(calc);
    const source = readValues(calc, sourceForm);
    if (source.error) return;
    const initial = Object.fromEntries(calc.fields.map((field) => [field.id, fromQuery.values[field.id] ?? source.values[field.id]]));

    const section = document.createElement('section');
    section.id = 'compare-panel';
    section.className = 'compare-panel';
    section.innerHTML = `
      <div class="compare-head">
        <div><span class="section-kicker">Comparação</span><h3>Cenário B</h3><p>Altere apenas as premissas que deseja comparar com o cenário A acima.</p></div>
        <button type="button" class="secondary-btn compare-close" data-compare-close>Fechar comparação</button>
      </div>
      <form id="compare-form" class="calc-form compare-form">
        <div class="fields-grid">${calc.fields.map((field) => fieldHtml(field, initial[field.id])).join('')}</div>
        <div class="compare-actions"><button class="primary-btn" type="submit">Recalcular cenário B</button></div>
        <div data-compare-error></div>
        <div data-compare-result></div>
      </form>`;
    panel.appendChild(section);

    const form = section.querySelector('#compare-form');
    form.addEventListener('submit', (event) => { event.preventDefault(); calculateB(calc, form); });
    form.addEventListener('input', () => calculateB(calc, form));
    section.querySelector('[data-compare-close]').addEventListener('click', closeComparison);
    const toggle = panel.querySelector('[data-compare-toggle]');
    if (toggle) toggle.textContent = 'Remover cenário B';
    calculateB(calc, form);
  }

  function enhance() {
    const calc = activeCalc();
    const form = activeForm();
    if (!calc || !form) return;

    if (!SUPPORTED.has(calc.id)) {
      if (panel.querySelector('#compare-panel')) closeComparison();
      return;
    }

    const actions = form.querySelector('.calc-actions');
    if (!actions) return;
    if (!actions.querySelector('[data-compare-toggle]')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'secondary-btn';
      button.dataset.compareToggle = 'true';
      button.textContent = 'Comparar cenário B';
      button.addEventListener('click', () => panel.querySelector('#compare-panel') ? closeComparison() : openComparison(activeCalc()));
      actions.appendChild(button);
    }

    const requested = queryValues(calc).requested;
    if (requested && !panel.querySelector('#compare-panel')) openComparison(calc);
  }

  const observer = new MutationObserver((mutations) => {
    const relevant = mutations.some((mutation) => {
      const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
      return !target?.closest('#compare-panel');
    });
    if (relevant) enhance();
  });
  observer.observe(panel, { childList: true, subtree: true });

  window.addEventListener('DOMContentLoaded', () => window.setTimeout(enhance, 0));
})();
