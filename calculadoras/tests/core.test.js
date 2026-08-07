const test = require('node:test');
const assert = require('node:assert/strict');
const math = require('../formulas.js');
const scenario = require('../scenario.js');

function approx(actual, expected, tolerance = 1e-8) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `esperado ${expected}, recebido ${actual}`);
}

test('taxa mensal equivalente recompõe a taxa anual', () => {
  const monthly = math.annualToMonthlyRate(10);
  approx(Math.pow(1 + monthly, 12), 1.10, 1e-12);
});

test('juros compostos sem taxa somam apenas os aportes', () => {
  const r = math.compoundProjection({ initial: 10000, monthly: 500, annualRate: 0, years: 1 });
  approx(r.balance, 16000);
  approx(r.invested, 16000);
  approx(r.earnings, 0);
});

test('juros compostos de 10% a.a. por um ano sem aportes', () => {
  const r = math.compoundProjection({ initial: 10000, monthly: 0, annualRate: 10, years: 1 });
  approx(r.balance, 11000, 1e-6);
});

test('série de juros termina no mesmo valor da projeção', () => {
  const input = { initial: 10000, monthly: 500, annualRate: 10, years: 10 };
  const projection = math.compoundProjection(input);
  const series = math.compoundSeries(input);
  assert.equal(series.points.length, 121);
  approx(series.balance, projection.balance, 1e-6);
  approx(series.contributed, projection.invested, 1e-6);
});

test('Price sem juros divide o principal igualmente', () => {
  const r = math.priceFinancing({ principal: 12000, annualRate: 0, months: 12 });
  approx(r.payment, 1000);
  approx(r.total, 12000);
  approx(r.interest, 0);
});

test('cronograma Price termina com saldo zero e amortiza todo principal', () => {
  const schedule = math.priceSchedule({ principal: 100000, annualRate: 12, months: 48 });
  const last = schedule.points.at(-1);
  approx(last.balance, 0, 1e-8);
  approx(last.cumulativePrincipal, 100000, 1e-6);
  approx(last.cumulativeInterest, schedule.interest, 1e-5);
  assert.equal(schedule.points.length, 49);
});

test('porcentagem e desconto retornam valores conhecidos', () => {
  assert.deepEqual(math.percentage({ base: 1000, percent: 15 }), { part: 150, increased: 1150, reduced: 850 });
  assert.deepEqual(math.discount({ price: 500, discount: 20 }), { saved: 100, finalPrice: 400 });
});

test('regra de três resolve proporção simples', () => {
  assert.equal(math.ruleOfThree({ a: 2, b: 10, c: 5 }).x, 25);
  assert.throws(() => math.ruleOfThree({ a: 0, b: 10, c: 5 }), RangeError);
});

test('ROI calcula ganho percentual', () => {
  const r = math.roi({ investment: 10000, returned: 13500 });
  assert.equal(r.profit, 3500);
  assert.equal(r.roi, 35);
});

test('margem e markup distinguem base de venda e custo', () => {
  const r = math.marginMarkup({ cost: 80, sale: 120 });
  assert.equal(r.profit, 40);
  approx(r.margin, 33.33333333333333);
  assert.equal(r.markup, 50);
  assert.equal(r.factor, 1.5);
});

test('custo de combustível calcula litros e custo por km', () => {
  const r = math.fuelCost({ distance: 300, consumption: 12, price: 6.2 });
  assert.equal(r.liters, 25);
  assert.equal(r.cost, 155);
  approx(r.perKm, 155 / 300);
});

test('à vista vence quando parcelas nominais são maiores e retorno alternativo é zero', () => {
  const r = math.cashVsInstallments({ cashPrice: 4500, installmentValue: 450, installments: 12, annualReturn: 0 });
  assert.equal(r.nominalTotal, 5400);
  assert.equal(r.presentValue, 5400);
  assert.equal(r.recommendation, 'cash');
});

test('amortizar vence quando custo da dívida supera retorno esperado', () => {
  const r = math.amortizeVsInvest({ capital: 20000, debtRate: 14, investmentRate: 10, years: 5 });
  assert.equal(r.recommendation, 'amortize');
  assert.ok(r.amortizeEquivalent > r.investmentFuture);
});

test('meta sem juros é alcançada pelo número exato de aportes', () => {
  const r = math.targetProjection({ target: 12000, current: 0, monthly: 1000, annualRate: 0 });
  assert.equal(r.reached, true);
  assert.equal(r.months, 12);
  assert.equal(r.balance, 12000);
});

test('série de meta termina no mesmo mês da projeção', () => {
  const input = { target: 1000000, current: 100000, monthly: 3000, annualRate: 10 };
  const projection = math.targetProjection(input);
  const series = math.targetSeries(input);
  assert.equal(series.reached, projection.reached);
  assert.equal(series.months, projection.months);
  approx(series.balance, projection.balance, 1e-6);
  assert.equal(series.points.at(-1).target, 1000000);
});

test('comprar à vista sem custos acumula a economia do aluguel no patrimônio', () => {
  const r = math.buyVsRentProjection({
    propertyPrice: 120000,
    downPayment: 120000,
    mortgageRate: 0,
    mortgageYears: 30,
    rentMonthly: 1000,
    rentGrowthRate: 0,
    propertyAppreciation: 0,
    investmentReturn: 0,
    ownerCostRate: 0,
    horizonYears: 1
  });
  assert.equal(r.recommendation, 'buy');
  approx(r.buyerNetWorth, 132000);
  approx(r.renterNetWorth, 120000);
  approx(r.difference, 12000);
  approx(r.remainingDebt, 0);
});

test('série comprar vs alugar começa com o mesmo capital e respeita o horizonte', () => {
  const input = {
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
  const r = math.buyVsRentSeries(input);
  assert.equal(r.points.length, 121);
  approx(r.points[0].buyerNetWorth, 100000);
  approx(r.points[0].renterNetWorth, 100000);
  assert.ok(r.remainingDebt >= 0 && r.remainingDebt < 400000);
  assert.ok(r.propertyValue > 500000);
  approx(r.points.at(-1).buyerNetWorth, r.buyerNetWorth, 1e-6);
  approx(r.points.at(-1).renterNetWorth, r.renterNetWorth, 1e-6);
});

test('comprar vs alugar rejeita entrada acima do preço do imóvel', () => {
  assert.throws(() => math.buyVsRentProjection({
    propertyPrice: 100000,
    downPayment: 110000,
    mortgageRate: 10,
    mortgageYears: 20,
    rentMonthly: 1000,
    rentGrowthRate: 4,
    propertyAppreciation: 4,
    investmentReturn: 10,
    ownerCostRate: 1,
    horizonYears: 10
  }), RangeError);
});

test('URL compartilhável faz round-trip dos valores', () => {
  const fields = [
    { id: 'initial' }, { id: 'monthly' }, { id: 'annualRate' }, { id: 'years' }
  ];
  const path = scenario.encode('juros-compostos', fields, { initial: 10000, monthly: 500, annualRate: 10, years: 15 });
  assert.equal(path, '/juros-compostos?initial=10000&monthly=500&annualRate=10&years=15');
  assert.deepEqual(scenario.decode(path.slice(path.indexOf('?')), fields), { initial: 10000, monthly: 500, annualRate: 10, years: 15 });
});

test('Cenário A ignora parâmetros reservados do cenário B', () => {
  const fields = [{ id: 'initial' }, { id: 'monthly' }, { id: 'annualRate' }, { id: 'years' }];
  const search = '?initial=10000&monthly=500&annualRate=10&years=15&compare=1&b_initial=20000&b_monthly=800&b_annualRate=12&b_years=20';
  assert.deepEqual(scenario.decode(search, fields), { initial: 10000, monthly: 500, annualRate: 10, years: 15 });
});

test('URL de comprar vs alugar preserva premissas principais', () => {
  const fields = [
    { id: 'propertyPrice' }, { id: 'downPayment' }, { id: 'rentMonthly' }, { id: 'horizonYears' }
  ];
  const values = { propertyPrice: 500000, downPayment: 100000, rentMonthly: 2500, horizonYears: 10 };
  const path = scenario.encode('comprar-ou-alugar', fields, values);
  assert.equal(path, '/comprar-ou-alugar?propertyPrice=500000&downPayment=100000&rentMonthly=2500&horizonYears=10');
  assert.deepEqual(scenario.decode(path.slice(path.indexOf('?')), fields), values);
});

test('codec ignora parâmetros desconhecidos ou não numéricos', () => {
  const fields = [{ id: 'base' }, { id: 'percent' }];
  assert.deepEqual(scenario.decode('?base=1000&percent=abc&hack=1', fields), { base: 1000 });
  assert.equal(scenario.pathFor('porcentagem'), '/porcentagem');
  assert.equal(scenario.pathFor('comprar-ou-alugar'), '/comprar-ou-alugar');
});
