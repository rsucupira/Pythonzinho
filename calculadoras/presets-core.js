(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ScenarioPresets = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const PROFILES = Object.freeze({
    conservador: Object.freeze({
      label: 'Conservador',
      values: Object.freeze({
        'juros-compostos': Object.freeze({ annualRate: 6 }),
        'avista-ou-parcelado': Object.freeze({ annualReturn: 6 }),
        'amortizar-ou-investir': Object.freeze({ investmentRate: 6 }),
        'meta-de-patrimonio': Object.freeze({ annualRate: 6 }),
        'comprar-ou-alugar': Object.freeze({ propertyAppreciation: 2, investmentReturn: 6, rentGrowthRate: 4 })
      })
    }),
    base: Object.freeze({
      label: 'Base',
      values: Object.freeze({
        'juros-compostos': Object.freeze({ annualRate: 10 }),
        'avista-ou-parcelado': Object.freeze({ annualReturn: 10 }),
        'amortizar-ou-investir': Object.freeze({ investmentRate: 10 }),
        'meta-de-patrimonio': Object.freeze({ annualRate: 10 }),
        'comprar-ou-alugar': Object.freeze({ propertyAppreciation: 4, investmentReturn: 10, rentGrowthRate: 4 })
      })
    }),
    otimista: Object.freeze({
      label: 'Otimista',
      values: Object.freeze({
        'juros-compostos': Object.freeze({ annualRate: 12 }),
        'avista-ou-parcelado': Object.freeze({ annualReturn: 12 }),
        'amortizar-ou-investir': Object.freeze({ investmentRate: 12 }),
        'meta-de-patrimonio': Object.freeze({ annualRate: 12 }),
        'comprar-ou-alugar': Object.freeze({ propertyAppreciation: 6, investmentReturn: 12, rentGrowthRate: 4 })
      })
    })
  });

  function valuesFor(profileKey, calculatorId) {
    const values = PROFILES[profileKey]?.values?.[calculatorId];
    return values ? { ...values } : null;
  }

  function supports(calculatorId) {
    return Boolean(PROFILES.base.values[calculatorId]);
  }

  return { PROFILES, valuesFor, supports };
});
