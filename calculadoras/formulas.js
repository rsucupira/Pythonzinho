(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CalculadoraMath = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const EPS = 1e-12;

  function annualToMonthlyRate(annualRate) {
    return Math.pow(1 + annualRate / 100, 1 / 12) - 1;
  }

  function compoundProjection({ initial, monthly, annualRate, years }) {
    const months = Math.max(0, Math.round(years * 12));
    const monthlyRate = annualToMonthlyRate(annualRate);
    let balance = initial;
    for (let i = 0; i < months; i += 1) balance = balance * (1 + monthlyRate) + monthly;
    const invested = initial + monthly * months;
    return { months, monthlyRate, balance, invested, earnings: balance - invested };
  }

  function priceFinancing({ principal, annualRate, months }) {
    const n = Math.max(1, Math.round(months));
    const monthlyRate = annualToMonthlyRate(annualRate);
    const payment = Math.abs(monthlyRate) < EPS
      ? principal / n
      : principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -n));
    const total = payment * n;
    return { months: n, monthlyRate, payment, total, interest: total - principal };
  }

  function percentage({ base, percent }) {
    const part = base * percent / 100;
    return { part, increased: base + part, reduced: base - part };
  }

  function discount({ price, discount: discountPercent }) {
    const saved = price * discountPercent / 100;
    return { saved, finalPrice: price - saved };
  }

  function ruleOfThree({ a, b, c }) {
    if (a === 0) throw new RangeError('a must be non-zero');
    return { x: b * c / a };
  }

  function roi({ investment, returned }) {
    if (investment === 0) throw new RangeError('investment must be non-zero');
    const profit = returned - investment;
    return { profit, roi: profit / investment * 100 };
  }

  function marginMarkup({ cost, sale }) {
    if (cost === 0 || sale === 0) throw new RangeError('cost and sale must be non-zero');
    const profit = sale - cost;
    return {
      profit,
      margin: profit / sale * 100,
      markup: profit / cost * 100,
      factor: sale / cost
    };
  }

  function fuelCost({ distance, consumption, price }) {
    if (consumption <= 0) throw new RangeError('consumption must be positive');
    const liters = distance / consumption;
    const cost = liters * price;
    return { liters, cost, perKm: distance === 0 ? 0 : cost / distance };
  }

  function cashVsInstallments({ cashPrice, installmentValue, installments, annualReturn }) {
    const n = Math.max(1, Math.round(installments));
    const monthlyRate = annualToMonthlyRate(annualReturn);
    const nominalTotal = installmentValue * n;
    const presentValue = Math.abs(monthlyRate) < EPS
      ? nominalTotal
      : installmentValue * (1 - Math.pow(1 + monthlyRate, -n)) / monthlyRate;
    const difference = presentValue - cashPrice;
    const nominalPremium = (nominalTotal / cashPrice - 1) * 100;
    const recommendation = difference > 0.005
      ? 'cash'
      : difference < -0.005
        ? 'installments'
        : 'equivalent';
    return { months: n, monthlyRate, nominalTotal, presentValue, difference, nominalPremium, recommendation };
  }

  function amortizeVsInvest({ capital, debtRate, investmentRate, years }) {
    const amortizeEquivalent = capital * Math.pow(1 + debtRate / 100, years);
    const investmentFuture = capital * Math.pow(1 + investmentRate / 100, years);
    const difference = amortizeEquivalent - investmentFuture;
    const recommendation = difference > 0.005
      ? 'amortize'
      : difference < -0.005
        ? 'invest'
        : 'equivalent';
    return { amortizeEquivalent, investmentFuture, difference, recommendation };
  }

  function targetProjection({ target, current, monthly, annualRate, maxMonths = 1200 }) {
    const monthlyRate = annualToMonthlyRate(annualRate);
    if (current >= target) {
      return {
        reached: true,
        alreadyReached: true,
        months: 0,
        monthlyRate,
        balance: current,
        contributed: current,
        earnings: 0
      };
    }

    let balance = current;
    let months = 0;
    while (balance < target && months < maxMonths) {
      balance = balance * (1 + monthlyRate) + monthly;
      months += 1;
    }
    const contributed = current + monthly * months;
    return {
      reached: balance >= target,
      alreadyReached: false,
      months,
      monthlyRate,
      balance,
      contributed,
      earnings: balance - contributed
    };
  }

  function priceSchedule({ principal, annualRate, months }) {
    const summary = priceFinancing({ principal, annualRate, months });
    let balance = principal;
    let cumulativeInterest = 0;
    let cumulativePrincipal = 0;
    const points = [{ month: 0, balance, cumulativeInterest, cumulativePrincipal }];

    for (let month = 1; month <= summary.months; month += 1) {
      const interest = Math.abs(summary.monthlyRate) < EPS ? 0 : balance * summary.monthlyRate;
      const principalPaid = month === summary.months
        ? balance
        : Math.min(balance, Math.max(0, summary.payment - interest));
      balance = Math.max(0, balance - principalPaid);
      cumulativeInterest += interest;
      cumulativePrincipal += principalPaid;
      points.push({ month, balance, cumulativeInterest, cumulativePrincipal });
    }
    return { ...summary, points };
  }

  return {
    annualToMonthlyRate,
    compoundProjection,
    priceFinancing,
    priceSchedule,
    percentage,
    discount,
    ruleOfThree,
    roi,
    marginMarkup,
    fuelCost,
    cashVsInstallments,
    amortizeVsInvest,
    targetProjection
  };
});