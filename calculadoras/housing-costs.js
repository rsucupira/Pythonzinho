(() => {
  const panel = document.querySelector('#calculator-panel');
  if (!panel) return;

  const COST_FIELDS = [
    'ownerCostRate',
    'purchaseCostRate',
    'saleCostRate',
    'propertyTaxRate',
    'maintenanceRate',
    'ownerInsuranceMonthly',
    'hoaExtraMonthly',
    'investmentTaxRate'
  ];

  const REALISTIC_REFERENCE = {
    ownerCostRate: 0,
    purchaseCostRate: 4.5,
    saleCostRate: 5,
    propertyTaxRate: 0.6,
    maintenanceRate: 0.8,
    ownerInsuranceMonthly: 100,
    hoaExtraMonthly: 150,
    investmentTaxRate: 15
  };

  const CONSOLIDATED_REFERENCE = {
    ownerCostRate: 1.5,
    purchaseCostRate: 0,
    saleCostRate: 0,
    propertyTaxRate: 0,
    maintenanceRate: 0,
    ownerInsuranceMonthly: 0,
    hoaExtraMonthly: 0,
    investmentTaxRate: 0
  };

  function activeCalculator() {
    return calculators.find((calc) => calc.id === state.activeId) || null;
  }

  function applyValues(form, prefix, values) {
    Object.entries(values).forEach(([key, value]) => {
      const input = form.elements[`${prefix}${key}`];
      if (input) input.value = value;
    });

    form.dispatchEvent(new Event('input', { bubbles: true }));

    if (form.id === 'active-form') {
      const calc = activeCalculator();
      if (calc?.id === 'comprar-ou-alugar') calculateActive(calc, form);
    }
  }

  function costFieldNodes(form, prefix) {
    return COST_FIELDS
      .map((key) => form.elements[`${prefix}${key}`]?.closest('.field'))
      .filter(Boolean);
  }

  function enhanceForm(form, prefix = '') {
    if (!form || form.dataset.housingCostsEnhanced === 'true') return;
    const nodes = costFieldNodes(form, prefix);
    if (nodes.length !== COST_FIELDS.length) return;

    const actions = form.querySelector(prefix ? '.compare-actions' : '.calc-actions');
    if (!actions) return;

    const details = document.createElement('details');
    details.className = 'housing-costs-panel';
    details.innerHTML = `
      <summary>
        <span>
          <strong>Custos imobiliários detalhados</strong>
          <small>Opcional · compra, posse, venda e tributação simplificada</small>
        </span>
        <span class="housing-costs-chevron" aria-hidden="true">⌄</span>
      </summary>
      <div class="housing-costs-body">
        <p class="housing-costs-help">Você pode manter o custo consolidado atual ou abrir as premissas em componentes. O preset é apenas uma referência editável, não uma tabela oficial de impostos ou tarifas.</p>
        <div class="housing-costs-grid"></div>
        <div class="housing-costs-presets">
          <button type="button" class="secondary-btn" data-cost-preset="realistic">Aplicar referência detalhada</button>
          <button type="button" class="secondary-btn" data-cost-preset="consolidated">Usar consolidado 1,5%</button>
        </div>
      </div>`;

    const grid = details.querySelector('.housing-costs-grid');
    nodes.forEach((node) => grid.appendChild(node));
    actions.insertAdjacentElement('beforebegin', details);

    details.querySelector('[data-cost-preset="realistic"]').addEventListener('click', () => {
      applyValues(form, prefix, REALISTIC_REFERENCE);
      details.open = true;
    });

    details.querySelector('[data-cost-preset="consolidated"]').addEventListener('click', () => {
      applyValues(form, prefix, CONSOLIDATED_REFERENCE);
      details.open = true;
    });

    form.dataset.housingCostsEnhanced = 'true';
  }

  function enhance() {
    const calc = activeCalculator();
    if (!calc || calc.id !== 'comprar-ou-alugar') return;
    enhanceForm(panel.querySelector('#active-form'));
    enhanceForm(panel.querySelector('#compare-form'), 'b_');
  }

  const observer = new MutationObserver(() => enhance());
  observer.observe(panel, { childList: true, subtree: true });
  window.addEventListener('DOMContentLoaded', () => window.setTimeout(enhance, 0));
})();