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

  function compoundSeries({ initial, monthly, annualRate, years }) {
    const months = Math.max(0, Math.round(years * 12));
    const monthlyRate = annualToMonthlyRate(annualRate);
    let balance = initial;
    let contributed = initial;
    const points = [{ month: 0, balance, contributed }];
    for (let month = 1; month <= months; month += 1) {
      balance = balance * (1 + monthlyRate) + monthly;
      contributed += monthly;
      points.push({ month, balance, contributed });
    }
    return { months, monthlyRate, points, balance, contributed, earnings: balance - contributed };
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

  function targetSeries({ target, current, monthly, annualRate, maxMonths = 1200 }) {
    const monthlyRate = annualToMonthlyRate(annualRate);
    let balance = current;
    let contributed = current;
    let month = 0;
    const points = [{ month, balance, contributed, target }];
    while (balance < target && month < maxMonths) {
      balance = balance * (1 + monthlyRate) + monthly;
      contributed += monthly;
      month += 1;
      points.push({ month, balance, contributed, target });
    }
    if (points.length === 1) points.push({ month: 1, balance, contributed, target });
    return { reached: balance >= target, months: month, monthlyRate, balance, contributed, points };
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

  function liquidPortfolioValue(grossValue, contributionBasis, taxRate) {
    const taxableGain = Math.max(0, grossValue - contributionBasis);
    const tax = taxableGain * taxRate / 100;
    return { value: grossValue - tax, tax, taxableGain };
  }

  function buyVsRentSeries({
    propertyPrice,
    downPayment,
    mortgageRate,
    mortgageYears,
    rentMonthly,
    rentGrowthRate,
    propertyAppreciation,
    investmentReturn,
    ownerCostRate = 0,
    purchaseCostRate = 0,
    saleCostRate = 0,
    propertyTaxRate = 0,
    maintenanceRate = 0,
    ownerInsuranceMonthly = 0,
    hoaExtraMonthly = 0,
    investmentTaxRate = 0,
    horizonYears
  }) {
    if (propertyPrice <= 0) throw new RangeError('propertyPrice must be positive');
    if (downPayment < 0 || downPayment > propertyPrice) throw new RangeError('downPayment must be between zero and propertyPrice');
    if (rentMonthly < 0) throw new RangeError('rentMonthly must be non-negative');

    const nonNegativeCosts = {
      ownerCostRate,
      purchaseCostRate,
      saleCostRate,
      propertyTaxRate,
      maintenanceRate,
      ownerInsuranceMonthly,
      hoaExtraMonthly,
      investmentTaxRate
    };
    for (const [key, value] of Object.entries(nonNegativeCosts)) {
      if (!Number.isFinite(value) || value < 0) throw new RangeError(`${key} must be non-negative`);
    }
    if (investmentTaxRate > 100) throw new RangeError('investmentTaxRate must be at most 100');

    const horizonMonths = Math.max(1, Math.round(horizonYears * 12));
    const mortgageMonths = Math.max(1, Math.round(mortgageYears * 12));
    const principal = propertyPrice - downPayment;
    const mortgage = priceFinancing({ principal, annualRate: mortgageRate, months: mortgageMonths });
    const propertyMonthlyRate = annualToMonthlyRate(propertyAppreciation);
    const rentMonthlyRate = annualToMonthlyRate(rentGrowthRate);
    const investmentMonthlyRate = annualToMonthlyRate(investmentReturn);
    const variableOwnerMonthlyRate = (ownerCostRate + propertyTaxRate + maintenanceRate) / 100 / 12;
    const fixedOwnerMonthlyCost = ownerInsuranceMonthly + hoaExtraMonthly;
    const purchaseCosts = propertyPrice * purchaseCostRate / 100;

    let propertyValue = propertyPrice;
    let debtBalance = principal;
    let currentRent = rentMonthly;
    let buyerPortfolioGross = 0;
    let renterPortfolioGross = downPayment + purchaseCosts;
    let buyerContributionBasis = 0;
    let renterContributionBasis = renterPortfolioGross;
    let totalBuyerHousingCost = purchaseCosts;
    let totalRentPaid = 0;

    function snapshot(month) {
      const saleCosts = propertyValue * saleCostRate / 100;
      const liquidHomeEquity = propertyValue - debtBalance - saleCosts;
      const buyerPortfolio = liquidPortfolioValue(buyerPortfolioGross, buyerContributionBasis, investmentTaxRate);
      const renterPortfolio = liquidPortfolioValue(renterPortfolioGross, renterContributionBasis, investmentTaxRate);
      return {
        month,
        buyerNetWorth: liquidHomeEquity + buyerPortfolio.value,
        renterNetWorth: renterPortfolio.value,
        homeEquity: propertyValue - debtBalance,
        liquidHomeEquity,
        propertyValue,
        debtBalance,
        rent: currentRent,
        saleCosts,
        buyerPortfolioTax: buyerPortfolio.tax,
        renterPortfolioTax: renterPortfolio.tax
      };
    }

    const points = [snapshot(0)];

    for (let month = 1; month <= horizonMonths; month += 1) {
      let mortgagePayment = 0;
      if (debtBalance > EPS) {
        const interest = mortgage.monthlyRate * debtBalance;
        mortgagePayment = month >= mortgage.months
          ? debtBalance + interest
          : Math.min(mortgage.payment, debtBalance + interest);
        const principalPaid = Math.max(0, mortgagePayment - interest);
        debtBalance = Math.max(0, debtBalance - principalPaid);
      }

      const ownerVariableCost = propertyValue * variableOwnerMonthlyRate;
      const ownerCost = ownerVariableCost + fixedOwnerMonthlyCost;
      const buyerHousingCost = mortgagePayment + ownerCost;
      const renterHousingCost = currentRent;
      const commonBudget = Math.max(buyerHousingCost, renterHousingCost);
      const buyerContribution = commonBudget - buyerHousingCost;
      const renterContribution = commonBudget - renterHousingCost;

      buyerPortfolioGross = buyerPortfolioGross * (1 + investmentMonthlyRate) + buyerContribution;
      renterPortfolioGross = renterPortfolioGross * (1 + investmentMonthlyRate) + renterContribution;
      buyerContributionBasis += buyerContribution;
      renterContributionBasis += renterContribution;
      totalBuyerHousingCost += buyerHousingCost;
      totalRentPaid += renterHousingCost;

      propertyValue *= (1 + propertyMonthlyRate);
      currentRent *= (1 + rentMonthlyRate);
      points.push(snapshot(month));
    }

    const last = points[points.length - 1];
    const difference = last.buyerNetWorth - last.renterNetWorth;
    const recommendation = difference > 1 ? 'buy' : difference < -1 ? 'rent' : 'equivalent';

    return {
      months: horizonMonths,
      mortgagePayment: principal > EPS ? mortgage.payment : 0,
      propertyValue: last.propertyValue,
      remainingDebt: last.debtBalance,
      homeEquity: last.homeEquity,
      liquidHomeEquity: last.liquidHomeEquity,
      buyerPortfolio: buyerPortfolioGross,
      renterPortfolio: renterPortfolioGross,
      buyerNetWorth: last.buyerNetWorth,
      renterNetWorth: last.renterNetWorth,
      difference,
      recommendation,
      finalRent: last.rent,
      purchaseCosts,
      saleCosts: last.saleCosts,
      buyerInvestmentTax: last.buyerPortfolioTax,
      renterInvestmentTax: last.renterPortfolioTax,
      totalBuyerHousingCost,
      totalRentPaid,
      points
    };
  }

  function buyVsRentProjection(values) {
    const result = buyVsRentSeries(values);
    const { points, ...summary } = result;
    return summary;
  }

  return {
    annualToMonthlyRate,
    compoundProjection,
    compoundSeries,
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
    targetProjection,
    targetSeries,
    buyVsRentProjection,
    buyVsRentSeries
  };
});