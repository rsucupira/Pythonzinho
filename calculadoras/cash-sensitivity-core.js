(function (root, factory) {
  const math = typeof module === 'object' && module.exports
    ? require('./formulas.js')
    : root.CalculadoraMath;
  const api = factory(math);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CashSensitivityMath = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (math) {
  if (!math) throw new Error('CalculadoraMath is required');

  function outcome(result) {
    return result.recommendation;
  }

  function evaluateReturn(values, annualReturn) {
    return math.cashVsInstallments({ ...values, annualReturn }).difference;
  }

  function findReturnBreakEven(values, options = {}) {
    const min = options.min ?? -90;
    const max = options.max ?? 200;
    const samples = Math.max(40, options.samples || 240);
    const tolerance = options.tolerance || 1e-7;
    const moneyTolerance = options.moneyTolerance || 0.01;

    let previousX = min;
    let previousY = evaluateReturn(values, previousX);
    if (Math.abs(previousY) <= moneyTolerance) return { found: true, value: previousX, difference: previousY };

    for (let i = 1; i <= samples; i += 1) {
      const x = min + ((max - min) * i) / samples;
      const y = evaluateReturn(values, x);
      if (Math.abs(y) <= moneyTolerance) return { found: true, value: x, difference: y };

      if (Math.sign(previousY) !== Math.sign(y)) {
        let low = previousX;
        let high = x;
        let lowY = previousY;
        for (let j = 0; j < 80 && high - low > tolerance; j += 1) {
          const mid = (low + high) / 2;
          const midY = evaluateReturn(values, mid);
          if (Math.abs(midY) <= moneyTolerance) {
            low = mid;
            high = mid;
            break;
          }
          if (Math.sign(lowY) === Math.sign(midY)) {
            low = mid;
            lowY = midY;
          } else {
            high = mid;
          }
        }
        const value = (low + high) / 2;
        return { found: true, value, difference: evaluateReturn(values, value) };
      }
      previousX = x;
      previousY = y;
    }

    return {
      found: false,
      min,
      max,
      minOutcome: outcome(math.cashVsInstallments({ ...values, annualReturn: min })),
      maxOutcome: outcome(math.cashVsInstallments({ ...values, annualReturn: max }))
    };
  }

  function centeredRates(center, step = 2) {
    return [-2, -1, 0, 1, 2].map((offset) => Math.max(-90, Number(center) + offset * step));
  }

  function cashVsInstallmentsSensitivity(values) {
    const current = math.cashVsInstallments(values);
    const nominalTotal = current.nominalTotal;
    const breakEvenCashPrice = current.presentValue;
    const breakEvenDiscount = nominalTotal > 0 ? (1 - breakEvenCashPrice / nominalTotal) * 100 : 0;

    const unit = math.cashVsInstallments({
      cashPrice: values.cashPrice,
      installmentValue: 1,
      installments: values.installments,
      annualReturn: values.annualReturn
    });
    const annuityFactor = unit.presentValue;
    const breakEvenInstallmentValue = annuityFactor > 0 ? values.cashPrice / annuityFactor : Infinity;
    const returnBreakEven = findReturnBreakEven(values);

    const cashPrices = [0.9, 0.95, 1, 1.05, 1.1].map((factor) => values.cashPrice * factor);
    const returnRates = centeredRates(values.annualReturn, 2);
    const matrix = cashPrices.map((cashPrice) => ({
      cashPrice,
      cells: returnRates.map((annualReturn) => {
        const result = math.cashVsInstallments({ ...values, cashPrice, annualReturn });
        return {
          annualReturn,
          difference: result.difference,
          recommendation: result.recommendation
        };
      })
    }));

    return {
      current,
      breakEvenCashPrice,
      breakEvenDiscount,
      breakEvenInstallmentValue,
      returnBreakEven,
      cashPrices,
      returnRates,
      matrix
    };
  }

  return {
    outcome,
    findReturnBreakEven,
    centeredRates,
    cashVsInstallmentsSensitivity
  };
});
