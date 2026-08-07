(() => {
  const panel = document.querySelector('#calculator-panel');
  if (!panel || typeof ScenarioPresets === 'undefined') return;

  function activeCalc() {
    return calculators.find((calc) => calc.id === state.activeId) || null;
  }

  function applyProfile(calc, form, profileKey, prefix = '') {
    const values = ScenarioPresets.valuesFor(profileKey, calc.id);
    const profile = ScenarioPresets.PROFILES[profileKey];
    if (!values || !profile) return;

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
          ${Object.entries(ScenarioPresets.PROFILES).map(([key, profile]) => `<button type="button" class="secondary-btn" data-profile="${key}" data-prefix="${prefix}">${profile.label}</button>`).join('')}
          <small data-preset-status></small>
        </div>
      </section>`;
  }

  function enhanceForm(form, calc, prefix = '') {
    if (!form || !ScenarioPresets.supports(calc.id) || form.querySelector('[data-scenario-presets]')) return;
    const fields = form.querySelector('.fields-grid');
    if (!fields) return;
    fields.insertAdjacentHTML('beforebegin', presetHtml(prefix));
    form.querySelectorAll('[data-profile]').forEach((button) => {
      button.addEventListener('click', () => applyProfile(calc, form, button.dataset.profile, prefix));
    });
  }

  function enhance() {
    const calc = activeCalc();
    if (!calc || !ScenarioPresets.supports(calc.id)) return;
    enhanceForm(panel.querySelector('#active-form'), calc, '');
    enhanceForm(panel.querySelector('#compare-form'), calc, 'b_');
  }

  const observer = new MutationObserver(() => enhance());
  observer.observe(panel, { childList: true, subtree: true });
  window.addEventListener('DOMContentLoaded', () => window.setTimeout(enhance, 0));
})();
