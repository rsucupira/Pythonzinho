const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const NUMBER = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

const calculators = [
  {
    id: 'juros-compostos',
    icon: '↗',
    title: 'Juros compostos',
    category: 'Investimentos',
    description: 'Projete quanto um valor pode crescer com aportes mensais.',
    tags: 'juros investimento rendimento aporte patrimônio cdi',
    note: 'A taxa anual é convertida para uma taxa mensal equivalente. O cálculo considera aportes ao final de cada mês.',
    fields: [
      { id: 'initial', label: 'Valor inicial', prefix: 'R$', value: 10000, step: 100 },
      { id: 'monthly', label: 'Aporte mensal', prefix: 'R$', value: 500, step: 50 },
      { id: 'annualRate', label: 'Taxa anual', suffix: '% a.a.', value: 10, step: 0.1 },
      { id: 'years', label: 'Período', suffix: 'anos', value: 10, step: 1, min: 0.1 }
    ],
    calculate(values) {
      const months = Math.round(values.years * 12);
      const monthlyRate = Math.pow(1 + values.annualRate / 100, 1 / 12) - 1;
      let balance = values.initial;
      for (let i = 0; i < months; i += 1) balance = balance * (1 + monthlyRate) + values.monthly;
      const invested = values.initial + values.monthly * months;
      const earnings = balance - invested;
      return {
        label: 'Patrimônio estimado',
        main: BRL.format(balance),
        subtitle: `Em ${NUMBER.format(values.years)} anos, com taxa de ${NUMBER.format(values.annualRate)}% ao ano.`,
        metrics: [
          ['Total investido', BRL.format(invested)],
          ['Rendimento', BRL.format(earnings)],
          ['Taxa mensal equivalente', `${NUMBER.format(monthlyRate * 100)}%`]
        ]
      };
    }
  },
  {
    id: 'financiamento',
    icon: '⌂',
    title: 'Financiamento',
    category: 'Crédito',
    description: 'Estime parcela, juros e custo total pelo sistema Price.',
    tags: 'financiamento parcela price crédito empréstimo imóvel carro juros',
    note: 'Estimativa pelo sistema Price. Não inclui seguros, tarifas, impostos, CET ou outras cobranças da instituição financeira.',
    fields: [
      { id: 'principal', label: 'Valor financiado', prefix: 'R$', value: 100000, step: 1000 },
      { id: 'annualRate', label: 'Taxa anual', suffix: '% a.a.', value: 12, step: 0.1 },
      { id: 'months', label: 'Prazo', suffix: 'meses', value: 48, step: 1, min: 1 }
    ],
    calculate(values) {
      const n = Math.round(values.months);
      const monthlyRate = Math.pow(1 + values.annualRate / 100, 1 / 12) - 1;
      const payment = monthlyRate === 0
        ? values.principal / n
        : values.principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -n));
      const total = payment * n;
      const interest = total - values.principal;
      return {
        label: 'Parcela estimada',
        main: BRL.format(payment),
        subtitle: `${n} parcelas mensais pela tabela Price.`,
        metrics: [
          ['Total pago', BRL.format(total)],
          ['Juros totais', BRL.format(interest)],
          ['Taxa mensal equivalente', `${NUMBER.format(monthlyRate * 100)}%`]
        ]
      };
    }
  },
  {
    id: 'porcentagem',
    icon: '%',
    title: 'Porcentagem',
    category: 'Dia a dia',
    description: 'Descubra rapidamente quanto representa uma porcentagem de um valor.',
    tags: 'porcentagem percentual aumento redução conta matemática',
    note: 'Além do percentual calculado, mostramos o valor original com acréscimo e com redução do mesmo percentual.',
    fields: [
      { id: 'base', label: 'Valor base', prefix: 'R$', value: 1000, step: 10 },
      { id: 'percent', label: 'Porcentagem', suffix: '%', value: 15, step: 0.1 }
    ],
    calculate(values) {
      const part = values.base * values.percent / 100;
      return {
        label: `${NUMBER.format(values.percent)}% de ${BRL.format(values.base)}`,
        main: BRL.format(part),
        subtitle: 'Resultado direto da porcentagem informada.',
        metrics: [
          ['Com acréscimo', BRL.format(values.base + part)],
          ['Com redução', BRL.format(values.base - part)],
          ['Valor original', BRL.format(values.base)]
        ]
      };
    }
  },
  {
    id: 'desconto',
    icon: '−',
    title: 'Desconto',
    category: 'Compras',
    description: 'Calcule preço final e economia depois de um desconto.',
    tags: 'desconto promoção preço compra economia percentual',
    note: 'Cálculo simples de desconto percentual sobre o preço original.',
    fields: [
      { id: 'price', label: 'Preço original', prefix: 'R$', value: 500, step: 10 },
      { id: 'discount', label: 'Desconto', suffix: '%', value: 20, step: 0.1 }
    ],
    calculate(values) {
      const saved = values.price * values.discount / 100;
      const finalPrice = values.price - saved;
      return {
        label: 'Preço com desconto',
        main: BRL.format(finalPrice),
        subtitle: `Você economiza ${BRL.format(saved)} nesta compra.`,
        metrics: [
          ['Preço original', BRL.format(values.price)],
          ['Economia', BRL.format(saved)],
          ['Desconto', `${NUMBER.format(values.discount)}%`]
        ]
      };
    }
  },
  {
    id: 'regra-de-tres',
    icon: '∝',
    title: 'Regra de três',
    category: 'Matemática',
    description: 'Resolva proporções diretas do tipo A está para B assim como C está para X.',
    tags: 'regra de três proporção matemática razão x',
    note: 'Usa a relação A / B = C / X, portanto X = (B × C) / A.',
    fields: [
      { id: 'a', label: 'A', value: 2, step: 0.1 },
      { id: 'b', label: 'B', value: 10, step: 0.1 },
      { id: 'c', label: 'C', value: 5, step: 0.1 }
    ],
    validate(values) {
      if (values.a === 0) return 'O valor A precisa ser diferente de zero.';
      return null;
    },
    calculate(values) {
      const x = values.b * values.c / values.a;
      return {
        label: 'Valor de X',
        main: NUMBER.format(x),
        subtitle: `${NUMBER.format(values.a)} / ${NUMBER.format(values.b)} = ${NUMBER.format(values.c)} / X`,
        metrics: [
          ['A', NUMBER.format(values.a)],
          ['B', NUMBER.format(values.b)],
          ['C', NUMBER.format(values.c)]
        ]
      };
    }
  },
  {
    id: 'roi',
    icon: '◎',
    title: 'ROI',
    category: 'Negócios',
    description: 'Meça o retorno percentual de um investimento ou projeto.',
    tags: 'roi retorno investimento negócio lucro rentabilidade projeto',
    note: 'ROI = (valor retornado − investimento) / investimento. Não considera prazo nem risco do investimento.',
    fields: [
      { id: 'investment', label: 'Valor investido', prefix: 'R$', value: 10000, step: 100 },
      { id: 'returned', label: 'Valor retornado', prefix: 'R$', value: 13500, step: 100 }
    ],
    validate(values) {
      if (values.investment === 0) return 'O investimento precisa ser maior que zero.';
      return null;
    },
    calculate(values) {
      const profit = values.returned - values.investment;
      const roi = profit / values.investment * 100;
      return {
        label: 'ROI estimado',
        main: `${NUMBER.format(roi)}%`,
        subtitle: roi >= 0 ? `Ganho de ${BRL.format(profit)} sobre o capital investido.` : `Perda de ${BRL.format(Math.abs(profit))} sobre o capital investido.`,
        metrics: [
          ['Investimento', BRL.format(values.investment)],
          ['Retorno', BRL.format(values.returned)],
          ['Resultado', BRL.format(profit)]
        ]
      };
    }
  },
  {
    id: 'margem-markup',
    icon: '◫',
    title: 'Margem e markup',
    category: 'Negócios',
    description: 'Veja lucro, margem sobre a venda e markup sobre o custo.',
    tags: 'margem markup lucro preço custo venda negócio comércio',
    note: 'Margem usa o preço de venda como base. Markup percentual usa o custo como base.',
    fields: [
      { id: 'cost', label: 'Custo', prefix: 'R$', value: 80, step: 1 },
      { id: 'sale', label: 'Preço de venda', prefix: 'R$', value: 120, step: 1 }
    ],
    validate(values) {
      if (values.cost === 0 || values.sale === 0) return 'Custo e preço de venda precisam ser maiores que zero.';
      return null;
    },
    calculate(values) {
      const profit = values.sale - values.cost;
      const margin = profit / values.sale * 100;
      const markup = profit / values.cost * 100;
      const factor = values.sale / values.cost;
      return {
        label: 'Margem sobre a venda',
        main: `${NUMBER.format(margin)}%`,
        subtitle: `Lucro unitário estimado de ${BRL.format(profit)}.`,
        metrics: [
          ['Markup', `${NUMBER.format(markup)}%`],
          ['Fator de markup', `${NUMBER.format(factor)}×`],
          ['Lucro unitário', BRL.format(profit)]
        ]
      };
    }
  },
  {
    id: 'combustivel',
    icon: '◇',
    title: 'Custo de combustível',
    category: 'Veículos',
    description: 'Estime litros, custo da viagem e custo por quilômetro.',
    tags: 'gasolina etanol diesel combustível carro viagem km consumo',
    note: 'O resultado usa consumo médio constante e não inclui pedágios, manutenção, estacionamento ou depreciação.',
    fields: [
      { id: 'distance', label: 'Distância', suffix: 'km', value: 300, step: 10 },
      { id: 'consumption', label: 'Consumo médio', suffix: 'km/L', value: 12, step: 0.1 },
      { id: 'price', label: 'Preço do combustível', prefix: 'R$', suffix: '/L', value: 6.2, step: 0.01 }
    ],
    validate(values) {
      if (values.consumption <= 0) return 'O consumo médio precisa ser maior que zero.';
      return null;
    },
    calculate(values) {
      const liters = values.distance / values.consumption;
      const cost = liters * values.price;
      const perKm = values.distance === 0 ? 0 : cost / values.distance;
      return {
        label: 'Custo estimado da viagem',
        main: BRL.format(cost),
        subtitle: `Aproximadamente ${NUMBER.format(liters)} litros para ${NUMBER.format(values.distance)} km.`,
        metrics: [
          ['Litros necessários', `${NUMBER.format(liters)} L`],
          ['Custo por km', BRL.format(perKm)],
          ['Consumo médio', `${NUMBER.format(values.consumption)} km/L`]
        ]
      };
    }
  }
];

const state = { activeId: 'juros-compostos', query: '' };
const listEl = document.querySelector('#calculator-list');
const panelEl = document.querySelector('#calculator-panel');
const searchEl = document.querySelector('#calculator-search');
const countEl = document.querySelector('#calculator-count');
const emptyEl = document.querySelector('#empty-state');

function normalizeText(value) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function renderList() {
  const q = normalizeText(state.query.trim());
  const filtered = calculators.filter((calc) => {
    const haystack = normalizeText(`${calc.title} ${calc.category} ${calc.description} ${calc.tags}`);
    return !q || haystack.includes(q);
  });

  countEl.textContent = filtered.length;
  emptyEl.hidden = filtered.length !== 0;
  listEl.innerHTML = filtered.map((calc) => `
    <button class="calculator-card ${calc.id === state.activeId ? 'active' : ''}" data-id="${calc.id}" type="button">
      <span class="card-icon" aria-hidden="true">${calc.icon}</span>
      <span class="card-copy">
        <strong>${calc.title}</strong>
        <small>${calc.category}</small>
      </span>
      <span class="card-arrow" aria-hidden="true">→</span>
    </button>
  `).join('');

  listEl.querySelectorAll('[data-id]').forEach((button) => {
    button.addEventListener('click', () => openCalculator(button.dataset.id));
  });
}

function fieldTemplate(field) {
  return `
    <div class="field">
      <label for="field-${field.id}">${field.label}</label>
      <div class="field-shell">
        ${field.prefix ? `<span>${field.prefix}</span>` : ''}
        <input
          id="field-${field.id}"
          name="${field.id}"
          type="number"
          inputmode="decimal"
          value="${field.value}"
          step="${field.step ?? 'any'}"
          ${field.min !== undefined ? `min="${field.min}"` : ''}
          ${field.max !== undefined ? `max="${field.max}"` : ''}
          required
        />
        ${field.suffix ? `<span>${field.suffix}</span>` : ''}
      </div>
    </div>
  `;
}

function renderPanel() {
  const calc = calculators.find((item) => item.id === state.activeId) || calculators[0];
  panelEl.innerHTML = `
    <div class="panel-head">
      <div class="panel-title-wrap">
        <div class="panel-icon" aria-hidden="true">${calc.icon}</div>
        <div>
          <h2>${calc.title}</h2>
          <p>${calc.description}</p>
        </div>
      </div>
      <span class="category-pill">${calc.category}</span>
    </div>

    <form id="active-form" class="calc-form">
      <div class="fields-grid">
        ${calc.fields.map(fieldTemplate).join('')}
      </div>
      <div class="calc-actions">
        <button class="primary-btn" type="submit">Calcular</button>
        <button class="secondary-btn" type="button" id="reset-calc">Limpar</button>
      </div>
      <div id="error-slot"></div>
      <div id="result-slot"></div>
      <div class="formula-note">${calc.note}</div>
    </form>
  `;

  const form = panelEl.querySelector('#active-form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    calculateActive(calc, form);
  });
  panelEl.querySelector('#reset-calc').addEventListener('click', () => {
    calc.fields.forEach((field) => {
      form.elements[field.id].value = field.value;
    });
    panelEl.querySelector('#result-slot').innerHTML = '';
    panelEl.querySelector('#error-slot').innerHTML = '';
  });

  calculateActive(calc, form);
}

function calculateActive(calc, form) {
  const values = {};
  for (const field of calc.fields) {
    const raw = form.elements[field.id].value;
    const value = Number(raw);
    if (raw === '' || !Number.isFinite(value)) {
      showError(`Preencha corretamente o campo “${field.label}”.`);
      return;
    }
    if (field.min !== undefined && value < field.min) {
      showError(`O campo “${field.label}” precisa ser no mínimo ${field.min}.`);
      return;
    }
    values[field.id] = value;
  }

  const customError = calc.validate ? calc.validate(values) : null;
  if (customError) {
    showError(customError);
    return;
  }

  const result = calc.calculate(values);
  panelEl.querySelector('#error-slot').innerHTML = '';
  panelEl.querySelector('#result-slot').innerHTML = `
    <div class="result-box">
      <div class="result-label">${result.label}</div>
      <div class="result-main">${result.main}</div>
      <div class="result-subtitle">${result.subtitle}</div>
      <div class="metrics">
        ${result.metrics.map(([label, value]) => `
          <div class="metric">
            <span>${label}</span>
            <strong>${value}</strong>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function showError(message) {
  panelEl.querySelector('#result-slot').innerHTML = '';
  panelEl.querySelector('#error-slot').innerHTML = `<div class="error-message">${message}</div>`;
}

function openCalculator(id) {
  if (!calculators.some((calc) => calc.id === id)) return;
  state.activeId = id;
  renderList();
  renderPanel();
  const workspaceTop = document.querySelector('.workspace').getBoundingClientRect().top + window.scrollY - 22;
  if (window.innerWidth < 900) window.scrollTo({ top: workspaceTop, behavior: 'smooth' });
  history.replaceState(null, '', `#${id}`);
}

searchEl.addEventListener('input', (event) => {
  state.query = event.target.value;
  renderList();
});

searchEl.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  const q = normalizeText(state.query.trim());
  const match = calculators.find((calc) => normalizeText(`${calc.title} ${calc.tags}`).includes(q));
  if (match) openCalculator(match.id);
});

document.querySelectorAll('[data-open]').forEach((button) => {
  button.addEventListener('click', () => openCalculator(button.dataset.open));
});

const hashId = window.location.hash.replace('#', '');
if (calculators.some((calc) => calc.id === hashId)) state.activeId = hashId;

renderList();
renderPanel();
