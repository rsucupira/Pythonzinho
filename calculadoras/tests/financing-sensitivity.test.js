const test = require('node:test');
const assert = require('node:assert/strict');
const math = require('../formulas.js');
const financing = require('../financing-sensitivity-core.js');
const scenario = require('../scenario.js');

const BASE = {
  principal: 100000,
  annualRate: 12,
  months: 48,
  targetPayment: 2500
};

function approx(actual, expected, tolerance = 1e-6) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `esperado ${expected} ± ${tolerance}, recebido ${actual}`);
}

test('cenário padrão do financiamento mantém a parcela Price conhecida', () => {
  const data = financing.financingSensitivity(BASE);
  approx(data.current.payment, 2603.3644941990356, 1e-6);
  approx(data.current.interest, 24961.495721553714, 1e-6);
  assert.ok(data.paymentGap > 0);
});

test('taxa máxima para parcela de 2500 é aproximadamente 9,64% a.a.', () => {
  const point = financing.maxRateForTarget(BASE);
  assert.equal(point.found, true);
  approx(point.value, 9.64345646, 1e-5);
  approx(math.priceFinancing({ principal: BASE.principal, annualRate: point.value, months: BASE.months }).payment, 2500, 0.01);
});

test('principal máximo e redução necessária reproduzem a parcela-alvo', () => {
  const limit = financing.maxPrincipalForTarget(BASE);
  approx(limit.maxPrincipal, 96029.58039762168, 0.01);
  approx(limit.reductionNeeded, 3970.419602378315, 0.01);
  const result = math.priceFinancing({ principal: limit.maxPrincipal, annualRate: BASE.annualRate, months: BASE.months });
  approx(result.payment, BASE.targetPayment, 0.01);
});

test('prazo mínimo para a parcela-alvo é 51 meses', () => {
  const point = financing.minimumMonthsForTarget(BASE);
  assert.equal(point.found, true);
  assert.equal(point.months, 51);
  assert.ok(point.payment <= BASE.targetPayment);
  assert.ok(math.priceFinancing({ principal: BASE.principal, annualRate: BASE.annualRate, months: 50 }).payment > BASE.targetPayment);
});

test('um ponto percentual adicional aumenta parcela e juros totais', () => {
  const data = financing.financingSensitivity(BASE);
  assert.ok(data.plusOnePoint.paymentIncrease > 0);
  assert.ok(data.plusOnePoint.interestIncrease > 0);
  approx(data.plusOnePoint.payment, 2647.35974844117, 1e-6);
});

test('matriz taxa x prazo tem 5x5 e centro reproduz o cenário atual', () => {
  const data = financing.financingSensitivity(BASE);
  assert.deepEqual(data.rates, [8, 10, 12, 14, 16]);
  assert.deepEqual(data.terms, [24, 36, 48, 60, 72]);
  assert.equal(data.matrix.length, 5);
  data.matrix.forEach((row) => assert.equal(row.cells.length, 5));
  const center = data.matrix[2].cells[2];
  approx(center.payment, data.current.payment, 1e-8);
  assert.equal(center.meetsTarget, false);
});

test('solver informa quando nem taxa zero alcança uma parcela muito baixa', () => {
  const point = financing.maxRateForTarget({ ...BASE, targetPayment: 1500 });
  assert.equal(point.found, false);
  assert.equal(point.reason, 'below-minimum');
  assert.ok(point.paymentAtMin > 1500);
});

test('URL de financiamento preserva parcela-alvo e cenário B', () => {
  const fields = [
    { id: 'principal' }, { id: 'annualRate' }, { id: 'months' }, { id: 'targetPayment' }
  ];
  const path = scenario.encode('financiamento', fields, BASE);
  assert.equal(path, '/financiamento?principal=100000&annualRate=12&months=48&targetPayment=2500');
  assert.deepEqual(scenario.decode(path.slice(path.indexOf('?')), fields), BASE);

  const params = new URLSearchParams(path.slice(path.indexOf('?')));
  params.set('compare', '1');
  params.set('b_targetPayment', '3000');
  assert.equal(Number(params.get('b_targetPayment')), 3000);
});
