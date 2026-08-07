(() => {
  const panel = document.querySelector('#calculator-panel');
  if (!panel) return;

  const SUPPORTED = new Set([
    'juros-compostos',
    'financiamento',
    'avista-ou-parcelado',
    'amortizar-ou-investir',
    'meta-de-patrimonio',
    'comprar-ou-alugar'
  ]);

  let renderTimer = null;

  function activeCalculator() {
    return calculators.find((calc) => calc.id === state.activeId) || null;
  }

  function activeForm() {
    return panel.querySelector('#active-form');
  }

  function formatField(field, value) {
    if (field.prefix === 'R$') return BRL.format(value);
    const formatted = NUMBER.format(value);
    const prefix = field.prefix ? `${field.prefix} ` : '';
    const suffix = field.suffix ? ` ${field.suffix}` : '';
    return `${prefix}${formatted}${suffix}`;
  }

  function assumptions(calc, form, prefix = '') {
    return calc.fields.map((field) => {
      const input = form.elements[`${prefix}${field.id}`];
      if (!input) return null;
      const value = Number(input.value);
      if (!Number.isFinite(value)) return null;
      return { label: field.label, value: formatField(field, value) };
    }).filter(Boolean);
  }

  function readResult(scope) {
    const box = scope?.querySelector('.result-box');
    if (!box) return null;
    return {
      label: box.querySelector('.result-label')?.textContent?.trim() || '',
      main: box.querySelector('.result-main')?.textContent?.trim() || '',
      subtitle: box.querySelector('.result-subtitle')?.textContent?.trim() || '',
      metrics: [...box.querySelectorAll('.metric')].map((metric) => ({
        label: metric.querySelector('span')?.textContent?.trim() || '',
        value: metric.querySelector('strong')?.textContent?.trim() || ''
      })).filter((item) => item.label || item.value)
    };
  }

  function collectAnalysis() {
    const selectors = [
      '#sensitivity-panel .sensitivity-card',
      '#amortization-sensitivity-panel .amortization-sensitivity-card',
      '#cash-sensitivity-panel .cash-sensitivity-card',
      '#financing-sensitivity-panel .financing-sensitivity-card'
    ];
    return selectors.flatMap((selector) => [...panel.querySelectorAll(selector)]).map((card) => ({
      label: card.querySelector('span')?.textContent?.trim() || '',
      value: card.querySelector('strong')?.textContent?.trim() || ''
    })).filter((item) => item.label && item.value).slice(0, 6);
  }

  function listHtml(items, max = 10) {
    return `<ul class="decision-report-list">${items.slice(0, max).map((item) => `<li><span>${item.label}</span><strong>${item.value}</strong></li>`).join('')}</ul>`;
  }

  function reportText(data) {
    const lines = [
      'PYTHONZINHO CALCULA — RESUMO DA DECISÃO',
      data.title,
      '',
      `Resultado: ${data.result.main}`,
      data.result.subtitle,
      ''
    ];

    if (data.result.metrics.length) {
      lines.push('Métricas');
      data.result.metrics.forEach((item) => lines.push(`- ${item.label}: ${item.value}`));
      lines.push('');
    }

    lines.push('Premissas do Cenário A');
    data.assumptionsA.forEach((item) => lines.push(`- ${item.label}: ${item.value}`));

    if (data.analysis.length) {
      lines.push('', 'Pontos de equilíbrio / sensibilidade');
      data.analysis.forEach((item) => lines.push(`- ${item.label}: ${item.value}`));
    }

    if (data.resultB) {
      lines.push('', 'Cenário B', `- Resultado: ${data.resultB.main}`);
      if (data.resultB.subtitle) lines.push(`- ${data.resultB.subtitle}`);
    }

    lines.push('', 'Link do cenário', data.url, '', 'Resultados são estimativas educacionais e não constituem recomendação financeira.');
    return lines.join('\n');
  }

  async function copyText(text, button) {
    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        copied = true;
      }
    } catch (_) {}

    if (!copied) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      copied = document.execCommand('copy');
      textarea.remove();
    }

    const original = button.textContent;
    button.textContent = copied ? 'Resumo copiado ✓' : 'Não foi possível copiar';
    window.setTimeout(() => { button.textContent = original; }, 1500);
  }

  function printReport(section) {
    document.querySelector('.print-report-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.className = 'print-report-overlay';
    const clone = section.cloneNode(true);
    clone.querySelectorAll('button').forEach((button) => button.remove());
    overlay.appendChild(clone);
    document.body.appendChild(overlay);
    document.body.classList.add('printing-decision-report');

    const cleanup = () => {
      document.body.classList.remove('printing-decision-report');
      overlay.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
    window.setTimeout(() => {
      if (document.body.classList.contains('printing-decision-report')) cleanup();
    }, 1000);
  }

  function buildData(calc, form) {
    const result = readResult(panel.querySelector('#result-slot'));
    if (!result) return null;
    const compareForm = panel.querySelector('#compare-form');
    const resultB = compareForm ? readResult(compareForm.querySelector('[data-compare-result]')) : null;
    return {
      title: calc.title,
      result,
      resultB,
      assumptionsA: assumptions(calc, form),
      assumptionsB: compareForm ? assumptions(calc, compareForm, 'b_') : [],
      analysis: collectAnalysis(),
      note: calc.note,
      url: window.location.href
    };
  }

  function renderReport() {
    const calc = activeCalculator();
    const form = activeForm();
    const existing = panel.querySelector('#decision-report');

    if (!calc || !SUPPORTED.has(calc.id) || !form) {
      existing?.remove();
      return;
    }

    const data = buildData(calc, form);
    if (!data) {
      existing?.remove();
      return;
    }

    let section = existing;
    if (!section) {
      section = document.createElement('section');
      section.id = 'decision-report';
      section.className = 'decision-report';
      form.appendChild(section);
    }

    const analysisHtml = data.analysis.length
      ? `<div class="decision-report-analysis">${data.analysis.map((item) => `<article><span>${item.label}</span><strong>${item.value}</strong></article>`).join('')}</div>`
      : '<p class="decision-report-note">Esta ferramenta não possui ponto de equilíbrio adicional nesta versão.</p>';

    const scenarioBHtml = data.resultB
      ? `<div class="decision-report-block"><h4>Cenário B</h4><div class="decision-report-outcome">${data.resultB.main}</div><div class="decision-report-subtitle">${data.resultB.subtitle}</div>${listHtml(data.assumptionsB, 8)}</div>`
      : '';

    section.innerHTML = `
      <div class="decision-report-head">
        <div>
          <span class="section-kicker">Resumo da decisão</span>
          <h3>${data.title}</h3>
          <p>Resultado, premissas, sensibilidade e link reunidos em um único registro.</p>
        </div>
        <div class="decision-report-actions">
          <button type="button" class="secondary-btn" data-copy-report>Copiar resumo</button>
          <button type="button" class="secondary-btn" data-print-report>Imprimir / salvar PDF</button>
        </div>
      </div>
      <div class="decision-report-grid">
        <div class="decision-report-block">
          <h4>${data.result.label || 'Resultado'}</h4>
          <div class="decision-report-outcome">${data.result.main}</div>
          <div class="decision-report-subtitle">${data.result.subtitle}</div>
          ${listHtml(data.result.metrics, 10)}
        </div>
        <div class="decision-report-block">
          <h4>Premissas do Cenário A</h4>
          ${listHtml(data.assumptionsA, 12)}
        </div>
        <div class="decision-report-block">
          <h4>Pontos de equilíbrio / sensibilidade</h4>
          ${analysisHtml}
        </div>
        ${scenarioBHtml}
      </div>
      <div class="decision-report-link"><strong>Link do cenário:</strong> ${data.url}</div>
      <p class="decision-report-note" style="margin-top:10px">${data.note}</p>
    `;

    section.querySelector('[data-copy-report]').addEventListener('click', (event) => copyText(reportText(data), event.currentTarget));
    section.querySelector('[data-print-report]').addEventListener('click', () => printReport(section));
  }

  function scheduleRender(delay = 100) {
    window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(renderReport, delay);
  }

  panel.addEventListener('input', () => scheduleRender(220));
  panel.addEventListener('submit', () => scheduleRender(20));
  window.addEventListener('comparisonchange', () => scheduleRender(20));

  const observer = new MutationObserver((mutations) => {
    const relevant = mutations.some((mutation) => {
      const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
      return !target?.closest('#decision-report');
    });
    if (relevant) scheduleRender(80);
  });
  observer.observe(panel, { childList: true, subtree: true });

  window.addEventListener('DOMContentLoaded', () => window.setTimeout(renderReport, 0));
})();
