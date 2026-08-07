const test = require('node:test');
const assert = require('node:assert/strict');
const math = require('../formulas.js');
const sensitivity = require('../amortization-sensitivity-core.js');

const BASE = { capital: 20000, debtRate: 14, investmentRate: 10, years: 5 };

test('equilíbrio de amortizar vs investir ocorre quando as taxas se igualam', () => {
  const data = sensitivity.analyze(BASE);
  assert.equal(data.investmentBreakEven, 14);
  assert.equal(data.debtBreakEven, 10);
  assert.equal(data.spread, 4);

  const investmentAtBreakEven = math.amortizeVsInvest({ ...BASE, investmentRate: data.investmentBreakEven });
  const debtAtBreakEven = math.amortizeVsInvest({ ...BASE, debtRate: data.debtBreakEven });
  assert.equal(investmentAtBreakEven.recommendation, 'equivalent');
  assert.equal(debtAtBreakEven.recommendation, 'equivalent');
});

test('matriz dívida x investimento tem 5x5 centrada nas taxas atuais', () => {
  const data = sensitivity.analyze(BASE);
  assert.deepEqual(data.debtRates, [10, 12, 14, 16, 18]);
  assert.deepEqual(data.investmentRates, [6, 8, 10, 12, 14]);
  assert.equal(data.matrix.length, 5);
  data.matrix.forEach((row) => assert.equal(row.cells.length, 5));

  assert.equal(data.matrix[2].cells[2].recommendation, 'amortize');
  assert.equal(data.matrix[0].cells[2].recommendation, 'equivalent');
  assert.equal(data.matrix[0].cells[4].recommendation, 'invest');
});

test('aumentar o retorno acima do custo da dívida inverte a decisão', () => {
  assert.equal(math.amortizeVsInvest({ ...BASE, investmentRate: 16 }).recommendation, 'invest');
  assert.equal(math.amortizeVsInvest({ ...BASE, investmentRate: 12 }).recommendation, 'amortize');
});
