(function (root, factory) {
  const math = typeof module === 'object' && module.exports
    ? require('./formulas.js')
    : root.CalculadoraMath;
  const api = factory(math);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.FinancingSensitivityMath = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (math) {
  if (!math) throw new Error('CalculadoraMath is required');

  function payment(values, overrides = {}) {
    const merged = { ...values, ...overrides };
    return math.priceFinancing({
      principal: merged.principal,
      annualRate: merged.annualRate,
      months: merged.months
    });
  }

  function maxRateForTarget(values, options = {}) {
    const target = Number(values.targetPayment);
    const min = options.min ?? 0;
    const max = options.max ?? 100;
    const tolerance = options.tolerance ?? 1e-7;
    if (!(target > 0)) throw new RangeError('targetPayment must be positive');

    const atMin = payment(values, { annualRate: min }).payment;
    const atMax = payment(values, { annualRate: max }).payment;
    if (atMin > target) return { found: false, reason: 'below-minimum', min, max, paymentAtMin: atMin, paymentAtMax: atMax };
    if (atMax <= target) return { found: false, reason: 'above-maximum', min, max, paymentAtMin: atMin, paymentAtMax: atMax };

    let low = min;
    let high = max;
    for (let i = 0; i < 90 && high - low > tolerance; i += 1) {
      const mid = (low + high) / 2;
      if (payment(values, { annualRate: mid }).payment <= target) low = mid;
      else high = mid;
    }
    const value = (low + high) / 2;
    return { found: true, value, payment: payment(values, { annualRate: value }).payment };
  }

  function maxPrincipalForTarget(values) {
    const target = Number(values.targetPayment);
    if (!(target > 0)) throw new RangeError('targetPayment must be positive');
    const unitPayment = math.priceFinancing({ principal: 1, annualRate: values.annualRate, months: values.months }).payment;
    const maxPrincipal = target / unitPayment;
    return {
      maxPrincipal,
      reductionNeeded: Math.max(0, values.principal - maxPrincipal),
      headroom: Math.max(0, maxPrincipal - values.principal)
    };
  }

  function minimumMonthsForTarget(values, maxMonths = 1200) {
    const target = Number(values.targetPayment);
    if (!(target > 0)) throw new RangeError('targetPayment must be positive');
    for (let months = 1; months <= maxMonths; months += 1) {
      const summary = payment(values, { months });
      if (summary.payment <= target) return { found: true, months, payment: summary.payment };
    }
    return { found: false, maxMonths, paymentAtMax: payment(values, { months: maxMonths }).payment };
  }

  function centeredRates(center, step = 2) {
    return [-2, -1, 0, 1, 2].map((offset) => Math.max(0, center + offset * step));
  }

  function centeredTerms(center) {
    const step = center >= 36 ? 12 : Math.max(1, Math.round(center / 4));
    const raw = [-2, -1, 0, 1, 2].map((offset) => Math.max(1, Math.round(center + offset * step)));
    for (let i = 1; i < raw.length; i += 1) {
      if (raw[i] <= raw[i - 1]) raw[i] = raw[i - 1] + step;
    }
    return raw;
  }

  function financingSensitivity(values) {
    if (!(values.principal > 0)) throw new RangeError('principal must be positive');
    if (!(values.months >= 1)) throw new RangeError('months must be at least one');
    if (!(values.targetPayment > 0)) throw new RangeError('targetPayment must be positive');

    const current = payment(values);
    const rateBreakEven = maxRateForTarget(values);
    const principalLimit = maxPrincipalForTarget(values);
    const monthsNeeded = minimumMonthsForTarget(values);
    const plusOne = payment(values, { annualRate: Number(values.annualRate) + 1 });
    const rates = centeredRates(Number(values.annualRate));
    const terms = centeredTerms(Number(values.months));
    const matrix = rates.map((annualRate) => ({
      annualRate,
      cells: terms.map((months) => {
        const result = payment(values, { annualRate, months });
        return {
          months,
          payment: result.payment,
          interest: result.interest,
          meetsTarget: result.payment <= values.targetPayment
        };
      })
    }));

    return {
      current,
      targetPayment: Number(values.targetPayment),
      paymentGap: current.payment - Number(values.targetPayment),
      rateBreakEven,
      principalLimit,
      monthsNeeded,
      plusOnePoint: {
        payment: plusOne.payment,
        interest: plusOne.interest,
        paymentIncrease: plusOne.payment - current.payment,
        interestIncrease: plusOne.interest - current.interest
      },
      rates,
      terms,
      matrix
    };
  }

  return {
    payment,
    maxRateForTarget,
    maxPrincipalForTarget,
    minimumMonthsForTarget,
    centeredRates,
    centeredTerms,
    financingSensitivity
  };
});