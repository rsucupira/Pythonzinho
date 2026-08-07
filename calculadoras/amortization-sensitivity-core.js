(function (root, factory) {
  const math = typeof module === 'object' && module.exports
    ? require('./formulas.js')
    : root.CalculadoraMath;
  const api = factory(math);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AmortizationSensitivityMath = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (math) {
  if (!math) throw new Error('CalculadoraMath is required');

  function centeredValues(center, step = 2, count = 5, floor = -90) {
    const half = Math.floor(count / 2);
    return Array.from({ length: count }, (_, index) => Math.max(floor, center + (index - half) * step));
  }

  function analyze(values) {
    const debtRates = centeredValues(Number(values.debtRate), 2, 5, -90);
    const investmentRates = centeredValues(Number(values.investmentRate), 2, 5, -90);
    const current = math.amortizeVsInvest(values);

    const matrix = debtRates.map((debtRate) => ({
      debtRate,
      cells: investmentRates.map((investmentRate) => {
        const result = math.amortizeVsInvest({ ...values, debtRate, investmentRate });
        return {
          investmentRate,
          difference: result.difference,
          recommendation: result.recommendation
        };
      })
    }));

    return {
      current,
      investmentBreakEven: Number(values.debtRate),
      debtBreakEven: Number(values.investmentRate),
      spread: Number(values.debtRate) - Number(values.investmentRate),
      debtRates,
      investmentRates,
      matrix
    };
  }

  return { centeredValues, analyze };
});
