const test = require('node:test');
const assert = require('node:assert/strict');
const math = require('../formulas.js');
const sensitivity = require('../sensitivity-core.js');

const BASE = {
  propertyPrice: 500000,
  downPayment: 100000,
  mortgageRate: 11,
  mortgageYears: 30,
  rentMonthly: 2500,
  rentGrowthRate: 4,
  propertyAppreciation: 4,
  investmentReturn: 10,
  ownerCostRate: 1.5,
  horizonYears: 10
};

function approx(actual, expected, tolerance) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `esperado ${expected} ± ${tolerance}, recebido ${actual}`);
}

test('ponto de equilíbrio da valorização zera a vantagem entre comprar e alugar', () => {
  const point = sensitivity.findBreakEven(BASE, 'propertyAppreciation', {
    min: -20,
    max: 30,
    samples: 150,
    valueTolerance: 1e-6
  });
  assert.equal(point.found, true);
  approx(point.value, 6.379, 0.02);
  const result = math.buyVsRentProjection({ ...BASE, propertyAppreciation: point.value });
  assert.ok(Math.abs(result.difference) <= 2);
  assert.equal(point.belowOutcome, 'rent');
  assert.equal(point.aboveOutcome, 'buy');
});

test('ponto de equilíbrio do aluguel inicial é encontrado para o cenário padrão', () => {
  const point = sensitivity.findBreakEven(BASE, 'rentMonthly', {
    min: 0,
    max: 12500,
    samples: 160,
    valueTolerance: 0.01
  });
  assert.equal(point.found, true);
  approx(point.value, 3224.61, 1);
  const result = math.buyVsRentProjection({ ...BASE, rentMonthly: point.value });
  assert.ok(Math.abs(result.difference) <= 5);
  assert.equal(point.belowOutcome, 'rent');
  assert.equal(point.aboveOutcome, 'buy');
});

test('matriz de sensibilidade tem 5x5 e centro reproduz o cenário atual', () => {
  const data = sensitivity.buyVsRentSensitivity(BASE);
  assert.deepEqual(data.propertyRates, [0, 2, 4, 6, 8]);
  assert.deepEqual(data.investmentRates, [6, 8, 10, 12, 14]);
  assert.equal(data.matrix.length, 5);
  data.matrix.forEach((row) => assert.equal(row.cells.length, 5));

  const center = data.matrix[2].cells[2];
  const current = math.buyVsRentProjection(BASE);
  assert.equal(center.recommendation, current.recommendation);
  approx(center.difference, current.difference, 1e-6);
});

test('custos de aquisição e venda deslocam os pontos de equilíbrio contra a compra', () => {
  const costly = {
    ...BASE,
    purchaseCostRate: 5,
    saleCostRate: 5
  };
  const data = sensitivity.buyVsRentSensitivity(costly);
  assert.equal(data.propertyBreakEven.found, true);
  assert.equal(data.noDetailed.propertyBreakEven.found, true);
  assert.equal(data.rentBreakEven.found, true);
  assert.equal(data.noDetailed.rentBreakEven.found, true);
  assert.ok(data.propertyBreakEven.value > data.noDetailed.propertyBreakEven.value);
  assert.ok(data.rentBreakEven.value > data.noDetailed.rentBreakEven.value);
});

test('remoção dos custos detalhados preserva o custo consolidado e zera extras', () => {
  const values = sensitivity.withoutDetailedCosts({
    ...BASE,
    purchaseCostRate: 4.5,
    saleCostRate: 5,
    propertyTaxRate: 0.6,
    maintenanceRate: 0.8,
    ownerInsuranceMonthly: 100,
    hoaExtraMonthly: 150,
    investmentTaxRate: 15
  });
  assert.equal(values.ownerCostRate, 1.5);
  assert.equal(values.purchaseCostRate, 0);
  assert.equal(values.saleCostRate, 0);
  assert.equal(values.propertyTaxRate, 0);
  assert.equal(values.maintenanceRate, 0);
  assert.equal(values.ownerInsuranceMonthly, 0);
  assert.equal(values.hoaExtraMonthly, 0);
  assert.equal(values.investmentTaxRate, 0);
});

test('solver informa ausência de cruzamento quando a faixa inteira favorece alugar', () => {
  const point = sensitivity.findBreakEven(BASE, 'propertyAppreciation', {
    min: -20,
    max: 0,
    samples: 80
  });
  assert.equal(point.found, false);
  assert.equal(point.minOutcome, 'rent');
  assert.equal(point.maxOutcome, 'rent');
});

test('outcome respeita tolerância monetária de empate', () => {
  assert.equal(sensitivity.outcome(0.5), 'equivalent');
  assert.equal(sensitivity.outcome(2), 'buy');
  assert.equal(sensitivity.outcome(-2), 'rent');
});
