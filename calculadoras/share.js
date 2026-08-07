(() => {
  const PATH_BY_ID = {
    'juros-compostos': '/juros-compostos',
    financiamento: '/financiamento',
    porcentagem: '/porcentagem',
    desconto: '/desconto',
    'regra-de-tres': '/regra-de-tres',
    roi: '/roi',
    'margem-markup': '/margem-e-markup',
    combustivel: '/custo-de-combustivel',
    'avista-ou-parcelado': '/avista-ou-parcelado',
    'amortizar-ou-investir': '/amortizar-ou-investir',
    'meta-de-patrimonio': '/meta-de-patrimonio'
  };

  const panel = document.querySelector('#calculator-panel');
  let applyingSharedValues = false;
  let syncTimer = null;

  function getActiveCalculator() {
    return calculators.find((calc) => calc.id === state.activeId) || null;
  }

  function getActiveForm() {
    return panel.querySelector('#active-form');
  }

  function cleanNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? String(number) : null;
  }

  function buildScenarioUrl(calc, form) {
    const path = PATH_BY_ID[calc.id] || window.location.pathname || '/';
    const url = new URL(path, window.location.origin);

    calc.fields.forEach((field) => {
      const input = form.elements[field.id];
      if (!input) return;
      const value = cleanNumber(input.value);
      if (value !== null) url.searchParams.set(field.id, value);
    });

    return url;
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

    const params = new URLSearchParams(window.location.search);
    let loadedAny = false;
    applyingSharedValues = true;

    calc.fields.forEach((field) => {
      const raw = params.get(field.id);
      if (raw === null) return;
      const value = cleanNumber(raw);
      if (value === null) return;
      form.elements[field.id].value = value;
      loadedAny = true;
    });

    applyingSharedValues = false;

    if (loadedAny) {
      calculateActive(calc, form);
    }
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
    const text = url.href;
    let copied = false;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        copied = true;
      } else {
        copied = fallbackCopy(text);
      }
    } catch (_) {
      copied = fallbackCopy(text);
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
            const path = PATH_BY_ID[currentCalc.id] || '/';
            history.replaceState(null, '', path);
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
