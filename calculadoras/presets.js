(() => {
  const panel = document.querySelector('#calculator-panel');
  if (!panel) return;

  const PROFILES = {
    conservador: {
      label: 'Conservador',
      values: {
        'juros-compostos': { annualRate: 6 },
        'avista-ou-parcelado': { annualReturn: 6 },
        'amortizar-ou-investir': { investmentRate: 6 },
        'meta-de-patrimonio': { annualRate: 6 },
        'comprar-ou-alugar': { propertyAppreciation: 2, investmentReturn: 6, rentGrowthRate: 4 }
      }
    },
    base: {
      label: 'Base',
      values: {
        'juros-compostos': { annualRate: 10 },
        'avista-ou-parcelado': { annualReturn: 10 },
        'amortizar-ou-investir': { investmentRate: 10 },
        'meta-de-patrimonio': { annualRate: 10 },
        'comprar-ou-alugar': { propertyAppreciation: 4, investmentReturn: 10, rentGrowthRate: 4 }
      }
    },
    otimista: {
      label: 'Otimista',
      values: {
        'juros-compostos': { annualRate: 12 },
        'avista-ou-parcelado': { annualReturn: 12 },
        'amortizar-ou-investir': { investmentRate: 12 },
        'meta-de-patrimonio': { annualRate: 12 },
        'comprar-ou-alugar': { propertyAppreciation: 6, investmentReturn: 12, rentGrowthRate: 4 }
      }
    }
  };

  const SUPPORTED = new Set(Object.keys(PROFILES.base.values));

  function activeCalc() {
    return calculators.find((calc) => calc.id === state.activeId) || null;
  }

  function applyProfile(calc, form, profileKey, prefix = '') {
    const profile = PROFILES[profileKey];
    const values = profile?.values?.[calc.id];
    if (!values) return;

    let lastInput = null;
    Object.entries(values).forEach(([fieldId, value]) => {
      const input = form.elements[`${prefix}${fieldId}`];
      if (!input) return;
      input.value = value;
      lastInput = input;
    });

    if (lastInput) lastInput.dispatchEvent(new Event('input', { bubbles: true }));
    const status = form.querySelector('[data-preset-status]');
    if (status) status.textContent = `${profile.label} aplicado`;
  }

  function presetHtml(prefix = '') {
    return `
      <section class="scenario-presets" data-scenario-presets>
        <div>
          <span class="section-kicker">Cenários ilustrativos</span>
          <p>Atalhos de premissas para testar sensibilidade. Não são projeções de mercado e não alteram taxas contratuais.</p>
        </div>
        <div class="preset-actions">
          ${Object.entries(PROFILES).map(([key, profile]) => `<button type="button" class="secondary-btn" data-profile="${key}" data-prefix="${prefix}">${profile.label}</button>`).join('')}
          <small data-preset-status></small>
        </div>
      </section>`;
  }

  function enhanceForm(form, calc, prefix = '') {
    if (!form || !SUPPORTED.has(calc.id) || form.querySelector('[data-scenario-presets]')) return;
    const fields = form.querySelector('.fields-grid');
    if (!fields) return;
    fields.insertAdjacentHTML('beforebegin', presetHtml(prefix));
    form.querySelectorAll('[data-profile]').forEach((button) => {
      button.addEventListener('click', () => applyProfile(calc, form, button.dataset.profile, prefix));
    });
  }

  function enhance() {
    const calc = activeCalc();
    if (!calc || !SUPPORTED.has(calc.id)) return;
    enhanceForm(panel.querySelector('#active-form'), calc, '');
    enhanceForm(panel.querySelector('#compare-form'), calc, 'b_');
  }

  const observer = new MutationObserver(() => enhance());
  observer.observe(panel, { childList: true, subtree: true });
  window.addEventListener('DOMContentLoaded', () => window.setTimeout(enhance, 0));
})();
