const test = require('node:test');
const assert = require('node:assert/strict');
const math = require('../formulas.js');
const scenario = require('../scenario.js');

const BASE = {
  propertyPrice: 100000,
  downPayment: 100000,
  mortgageRate: 0,
  mortgageYears: 30,
  rentMonthly: 0,
  rentGrowthRate: 0,
  propertyAppreciation: 0,
  investmentReturn: 0,
  ownerCostRate: 0,
  horizonYears: 1
};

function approx(actual, expected, tolerance = 1e-6) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `esperado ${expected}, recebido ${actual}`);
}

test('cenário antigo sem novos campos permanece compatível com custos detalhados zerados', () => {
  const legacy = math.buyVsRentProjection(BASE);
  const explicit = math.buyVsRentProjection({
    ...BASE,
    purchaseCostRate: 0,
    saleCostRate: 0,
    propertyTaxRate: 0,
    maintenanceRate: 0,
    ownerInsuranceMonthly: 0,
    hoaExtraMonthly: 0,
    investmentTaxRate: 0
  });
  approx(legacy.buyerNetWorth, explicit.buyerNetWorth);
  approx(legacy.renterNetWorth, explicit.renterNetWorth);
  approx(legacy.difference, explicit.difference);
});

test('custo inicial de compra vira capital alternativo do locatário', () => {
  const result = math.buyVsRentProjection({ ...BASE, purchaseCostRate: 4 });
  approx(result.purchaseCosts, 4000);
  approx(result.buyerNetWorth, 100000);
  approx(result.renterNetWorth, 104000);
  approx(result.difference, -4000);
  assert.equal(result.recommendation, 'rent');
});

test('custo de venda reduz o patrimônio líquido do imóvel', () => {
  const result = math.buyVsRentProjection({ ...BASE, saleCostRate: 5 });
  approx(result.saleCosts, 5000);
  approx(result.liquidHomeEquity, 95000);
  approx(result.buyerNetWorth, 95000);
  approx(result.renterNetWorth, 100000);
  approx(result.difference, -5000);
});

test('IPTU anual entra no orçamento equivalente mês a mês', () => {
  const result = math.buyVsRentProjection({ ...BASE, propertyTaxRate: 1.2 });
  approx(result.totalBuyerHousingCost, 1200);
  approx(result.buyerNetWorth, 100000);
  approx(result.renterNetWorth, 101200);
  approx(result.difference, -1200);
});

test('tributação simplificada incide apenas sobre ganho positivo da carteira', () => {
  const result = math.buyVsRentProjection({
    ...BASE,
    investmentReturn: 10,
    investmentTaxRate: 20
  });
  approx(result.renterPortfolio, 110000, 1e-4);
  approx(result.renterInvestmentTax, 2000, 1e-4);
  approx(result.renterNetWorth, 108000, 1e-4);
  approx(result.buyerNetWorth, 100000, 1e-4);
  approx(result.difference, -8000, 1e-4);
});

test('URL preserva custos detalhados do cenário imobiliário', () => {
  const fields = [
    { id: 'propertyPrice' },
    { id: 'purchaseCostRate' },
    { id: 'saleCostRate' },
    { id: 'propertyTaxRate' },
    { id: 'maintenanceRate' },
    { id: 'investmentTaxRate' }
  ];
  const values = {
    propertyPrice: 500000,
    purchaseCostRate: 4.5,
    saleCostRate: 5,
    propertyTaxRate: 0.6,
    maintenanceRate: 0.8,
    investmentTaxRate: 15
  };
  const path = scenario.encode('comprar-ou-alugar', fields, values);
  const decoded = scenario.decode(path.slice(path.indexOf('?')), fields);
  assert.deepEqual(decoded, values);
});

test('custos detalhados rejeitam taxas negativas', () => {
  assert.throws(() => math.buyVsRentProjection({ ...BASE, purchaseCostRate: -1 }), RangeError);
  assert.throws(() => math.buyVsRentProjection({ ...BASE, investmentTaxRate: 101 }), RangeError);
});
