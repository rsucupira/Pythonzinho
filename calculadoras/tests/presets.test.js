const test = require('node:test');
const assert = require('node:assert/strict');
const presets = require('../presets-core.js');
const scenario = require('../scenario.js');

test('presets conservador base e otimista possuem valores esperados', () => {
  assert.deepEqual(presets.valuesFor('conservador', 'juros-compostos'), { annualRate: 6 });
  assert.deepEqual(presets.valuesFor('base', 'juros-compostos'), { annualRate: 10 });
  assert.deepEqual(presets.valuesFor('otimista', 'juros-compostos'), { annualRate: 12 });

  assert.deepEqual(presets.valuesFor('conservador', 'comprar-ou-alugar'), {
    propertyAppreciation: 2,
    investmentReturn: 6,
    rentGrowthRate: 4
  });
  assert.deepEqual(presets.valuesFor('otimista', 'comprar-ou-alugar'), {
    propertyAppreciation: 6,
    investmentReturn: 12,
    rentGrowthRate: 4
  });
});

test('presets não alteram taxas contratuais de dívida ou financiamento', () => {
  for (const profileKey of Object.keys(presets.PROFILES)) {
    const amortize = presets.valuesFor(profileKey, 'amortizar-ou-investir');
    const housing = presets.valuesFor(profileKey, 'comprar-ou-alugar');
    assert.equal(Object.hasOwn(amortize, 'debtRate'), false);
    assert.equal(Object.hasOwn(housing, 'mortgageRate'), false);
  }
});

test('somente ferramentas explicitamente compatíveis recebem presets', () => {
  assert.equal(presets.supports('juros-compostos'), true);
  assert.equal(presets.supports('avista-ou-parcelado'), true);
  assert.equal(presets.supports('amortizar-ou-investir'), true);
  assert.equal(presets.supports('meta-de-patrimonio'), true);
  assert.equal(presets.supports('comprar-ou-alugar'), true);
  assert.equal(presets.supports('financiamento'), false);
});

test('valor aplicado por preset é serializado normalmente na URL compartilhável', () => {
  const fields = [
    { id: 'initial' }, { id: 'monthly' }, { id: 'annualRate' }, { id: 'years' }
  ];
  const preset = presets.valuesFor('conservador', 'juros-compostos');
  const path = scenario.encode('juros-compostos', fields, {
    initial: 10000,
    monthly: 500,
    years: 10,
    ...preset
  });
  assert.equal(path, '/juros-compostos?initial=10000&monthly=500&annualRate=6&years=10');
});
