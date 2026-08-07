(() => {
  if (typeof ScenarioCodec === 'undefined') return;

  const panel = document.querySelector('#calculator-panel');
  let applyingSharedValues = false;
  let syncTimer = null;

  function getActiveCalculator() {
    return calculators.find((calc) => calc.id === state.activeId) || null;
  }

  function getActiveForm() {
    return panel.querySelector('#active-form');
  }

  function formValues(calc, form) {
    const values = {};
    calc.fields.forEach((field) => {
      const input = form.elements[field.id];
      if (input) values[field.id] = input.value;
    });
    return values;
  }

  function buildScenarioUrl(calc, form) {
    return new URL(ScenarioCodec.encode(calc.id, calc.fields, formValues(calc, form)), window.location.origin);
  }

  function syncBrowserUrl(calc, form) {
    if (applyingSharedValues) return;
    const url = buildScenarioUrl(calc, form);
    history.replaceState(null, '', `${url.pathname}${url.search}`);
  }

  function scheduleUrlSync(calc, form) {
    window.clearTimeout(syncTimer);
    syncTimer = window.setTimeout(() => syncBrowserUrl(calc, form), 180);
  }

  function loadScenarioFromUrl() {
    const calc = getActiveCalculator();
    const form = getActiveForm();
    if (!calc || !form) return;

    const values = ScenarioCodec.decode(window.location.search, calc.fields);
    const entries = Object.entries(values);
    if (!entries.length) return;

    applyingSharedValues = true;
    entries.forEach(([key, value]) => {
      if (form.elements[key]) form.elements[key].value = value;
    });
    applyingSharedValues = false;
    calculateActive(calc, form);
  }

  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  }

  async function copyScenario(button, calc, form) {
    const url = buildScenarioUrl(calc, form);
    let copied = false;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url.href);
        copied = true;
      } else {
        copied = fallbackCopy(url.href);
      }
    } catch (_) {
      copied = fallbackCopy(url.href);
    }

    if (copied) {
      history.replaceState(null, '', `${url.pathname}${url.search}`);
      const previous = button.textContent;
      button.textContent = 'Link copiado ✓';
      button.disabled = true;
      window.setTimeout(() => {
        button.textContent = previous;
        button.disabled = false;
      }, 1600);
    } else {
      button.textContent = 'Copie a URL do navegador';
    }
  }

  function enhanceActiveForm() {
    const calc = getActiveCalculator();
    const form = getActiveForm();
    if (!calc || !form) return;

    const actions = form.querySelector('.calc-actions');
    if (!actions) return;

    if (!actions.querySelector('[data-share-scenario]')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'secondary-btn';
      button.dataset.shareScenario = 'true';
      button.textContent = 'Copiar link';
      button.setAttribute('aria-label', 'Copiar link desta simulação');
      button.addEventListener('click', () => copyScenario(button, getActiveCalculator(), getActiveForm()));
      actions.appendChild(button);
    }

    if (!form.dataset.shareUrlBound) {
      form.dataset.shareUrlBound = 'true';
      form.addEventListener('input', () => {
        const currentCalc = getActiveCalculator();
        const currentForm = getActiveForm();
        if (currentCalc && currentForm) scheduleUrlSync(currentCalc, currentForm);
      });

      const reset = form.querySelector('#reset-calc');
      if (reset) {
        reset.addEventListener('click', () => {
          window.setTimeout(() => {
            const currentCalc = getActiveCalculator();
            if (!currentCalc) return;
            history.replaceState(null, '', ScenarioCodec.pathFor(currentCalc.id));
          }, 0);
        });
      }
    }
  }

  const observer = new MutationObserver(() => enhanceActiveForm());
  observer.observe(panel, { childList: true, subtree: true });

  window.addEventListener('DOMContentLoaded', () => {
    window.setTimeout(() => {
      loadScenarioFromUrl();
      enhanceActiveForm();
    }, 0);
  });
})();