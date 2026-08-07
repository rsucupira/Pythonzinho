const test = require('node:test');
const assert = require('node:assert/strict');
const math = require('../formulas.js');
const sensitivity = require('../cash-sensitivity-core.js');

const BASE = {
  cashPrice: 4500,
  installmentValue: 450,
  installments: 12,
  annualReturn: 10
};

function approx(actual, expected, tolerance = 1e-6) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `esperado ${expected} ± ${tolerance}, recebido ${actual}`);
}

test('preço à vista de equilíbrio é o valor presente das parcelas', () => {
  const data = sensitivity.cashVsInstallmentsSensitivity(BASE);
  approx(data.breakEvenCashPrice, 5130.219523, 0.01);
  const result = math.cashVsInstallments({ ...BASE, cashPrice: data.breakEvenCashPrice });
  assert.equal(result.recommendation, 'equivalent');
});

test('parcela de equilíbrio reproduz o preço à vista em valor presente', () => {
  const data = sensitivity.cashVsInstallmentsSensitivity(BASE);
  approx(data.breakEvenInstallmentValue, 394.719951, 0.01);
  const result = math.cashVsInstallments({ ...BASE, installmentValue: data.breakEvenInstallmentValue });
  assert.ok(Math.abs(result.difference) <= 0.02);
});

test('retorno alternativo de equilíbrio é encontrado no cenário padrão', () => {
  const data = sensitivity.cashVsInstallmentsSensitivity(BASE);
  assert.equal(data.returnBreakEven.found, true);
  approx(data.returnBreakEven.value, 41.2999, 0.02);
  const result = math.cashVsInstallments({ ...BASE, annualReturn: data.returnBreakEven.value });
  assert.ok(Math.abs(result.difference) <= 0.02);
});

test('matriz de decisão tem 5x5 e centro reproduz o cenário atual', () => {
  const data = sensitivity.cashVsInstallmentsSensitivity(BASE);
  assert.equal(data.cashPrices.length, 5);
  assert.equal(data.returnRates.length, 5);
  assert.equal(data.matrix.length, 5);
  data.matrix.forEach((row) => assert.equal(row.cells.length, 5));

  const center = data.matrix[2].cells[2];
  const current = math.cashVsInstallments(BASE);
  assert.equal(center.recommendation, current.recommendation);
  approx(center.difference, current.difference, 1e-8);
});

test('desconto de equilíbrio é medido contra o total nominal parcelado', () => {
  const data = sensitivity.cashVsInstallmentsSensitivity(BASE);
  approx(data.breakEvenDiscount, 4.995935, 0.001);
});
