(function (root, factory) {
  const math = typeof module === 'object' && module.exports
    ? require('./formulas.js')
    : root.CalculadoraMath;
  const api = factory(math);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SensitivityMath = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (math) {
  if (!math) throw new Error('CalculadoraMath is required');

  const MONEY_TOLERANCE = 1;

  function outcome(difference, tolerance = MONEY_TOLERANCE) {
    if (difference > tolerance) return 'buy';
    if (difference < -tolerance) return 'rent';
    return 'equivalent';
  }

  function evaluate(values, key, value) {
    return math.buyVsRentProjection({ ...values, [key]: value }).difference;
  }

  function findBreakEven(values, key, options = {}) {
    const min = options.min;
    const max = options.max;
    const samples = Math.max(20, options.samples || 120);
    const valueTolerance = options.valueTolerance || 1e-5;
    const moneyTolerance = options.moneyTolerance || MONEY_TOLERANCE;

    if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
      throw new RangeError('break-even interval must have finite min < max');
    }

    const intervals = [];
    let previousX = min;
    let previousY = evaluate(values, key, previousX);

    if (Math.abs(previousY) <= moneyTolerance) {
      return {
        found: true,
        value: previousX,
        difference: previousY,
        belowOutcome: outcome(evaluate(values, key, Math.max(min, previousX - valueTolerance * 10))),
        aboveOutcome: outcome(evaluate(values, key, Math.min(max, previousX + valueTolerance * 10)))
      };
    }

    for (let i = 1; i <= samples; i += 1) {
      const x = min + ((max - min) * i) / samples;
      const y = evaluate(values, key, x);

      if (Math.abs(y) <= moneyTolerance) {
        intervals.push([x, x]);
      } else if (Math.sign(previousY) !== Math.sign(y)) {
        intervals.push([previousX, x]);
      }

      previousX = x;
      previousY = y;
    }

    if (!intervals.length) {
      const atMin = evaluate(values, key, min);
      const atMax = evaluate(values, key, max);
      return {
        found: false,
        min,
        max,
        minOutcome: outcome(atMin),
        maxOutcome: outcome(atMax),
        minDifference: atMin,
        maxDifference: atMax
      };
    }

    const current = Number(values[key]);
    intervals.sort((a, b) => {
      const ma = (a[0] + a[1]) / 2;
      const mb = (b[0] + b[1]) / 2;
      return Math.abs(ma - current) - Math.abs(mb - current);
    });

    let [low, high] = intervals[0];
    let lowY = evaluate(values, key, low);
    let highY = evaluate(values, key, high);

    if (low !== high) {
      for (let i = 0; i < 70 && high - low > valueTolerance; i += 1) {
        const mid = (low + high) / 2;
        const midY = evaluate(values, key, mid);
        if (Math.abs(midY) <= moneyTolerance) {
          low = mid;
          high = mid;
          lowY = midY;
          highY = midY;
          break;
        }
        if (Math.sign(lowY) === Math.sign(midY)) {
          low = mid;
          lowY = midY;
        } else {
          high = mid;
          highY = midY;
        }
      }
    }

    const value = (low + high) / 2;
    const difference = evaluate(values, key, value);
    const delta = Math.max((max - min) / 10000, valueTolerance * 20);
    const below = Math.max(min, value - delta);
    const above = Math.min(max, value + delta);

    return {
      found: true,
      value,
      difference,
      belowOutcome: outcome(evaluate(values, key, below)),
      aboveOutcome: outcome(evaluate(values, key, above))
    };
  }

  function centeredValues(center, step = 2, count = 5, floor = -90) {
    const half = Math.floor(count / 2);
    return Array.from({ length: count }, (_, index) => Math.max(floor, center + (index - half) * step));
  }

  function buyVsRentSensitivity(values) {
    const propertyRates = centeredValues(Number(values.propertyAppreciation), 2, 5, -90);
    const investmentRates = centeredValues(Number(values.investmentReturn), 2, 5, -90);

    const matrix = propertyRates.map((propertyAppreciation) => ({
      propertyAppreciation,
      cells: investmentRates.map((investmentReturn) => {
        const result = math.buyVsRentProjection({
          ...values,
          propertyAppreciation,
          investmentReturn
        });
        return {
          investmentReturn,
          difference: result.difference,
          recommendation: result.recommendation
        };
      })
    }));

    const propertyBreakEven = findBreakEven(values, 'propertyAppreciation', {
      min: -20,
      max: 30,
      samples: 150,
      valueTolerance: 1e-6
    });

    const rentUpper = Math.max(
      10000,
      Number(values.rentMonthly) * 5,
      Number(values.propertyPrice) * 0.025
    );
    const rentBreakEven = findBreakEven(values, 'rentMonthly', {
      min: 0,
      max: rentUpper,
      samples: 160,
      valueTolerance: 0.01
    });

    const current = math.buyVsRentProjection(values);

    return {
      current,
      propertyBreakEven,
      rentBreakEven,
      propertyRates,
      investmentRates,
      matrix
    };
  }

  return {
    outcome,
    evaluate,
    findBreakEven,
    centeredValues,
    buyVsRentSensitivity
  };
});
