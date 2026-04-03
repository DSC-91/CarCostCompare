'use strict';

const {
  calcKfzSteuer,
  calcFinancing,
  calcTCO,
  compareCars,
  formatEur,
  CAR_TYPES,
  DEFAULT_ANNUAL_KM,
  DEFAULT_YEARS,
} = require('../calc.js');

// ─── calcKfzSteuer ────────────────────────────────────────────────────────────

describe('calcKfzSteuer', () => {
  test('electric car has zero tax', () => {
    expect(calcKfzSteuer({ carType: 'electric', displacement: 0, co2: 0, weight: 1800 })).toBe(0);
  });

  test('petrol car with no CO2 surplus uses only displacement component', () => {
    // 1400 ccm petrol, 90 g/km CO2 (below 95 threshold)
    // = ceil(1400/100) * 2.00 = 14 * 2.00 = 28.00
    expect(calcKfzSteuer({ carType: 'petrol', displacement: 1400, co2: 90 })).toBe(28.00);
  });

  test('petrol car with CO2 above 95 g/km adds surcharge', () => {
    // 1400 ccm petrol, 115 g/km CO2 → surplus = 20 g, rate €2.00/g → co2Tax = 40
    // baseTax = 14 * 2 = 28  →  total = 68
    expect(calcKfzSteuer({ carType: 'petrol', displacement: 1400, co2: 115 })).toBe(68.00);
  });

  test('petrol car with CO2 spanning multiple bands', () => {
    // 1600 ccm, 175 g/km → surplus = 80 g
    // band1: 20g × 2.00 = 40
    // band2: 20g × 2.20 = 44
    // band3: 20g × 2.50 = 50
    // band4: 20g × 2.90 = 58
    // co2Tax = 192, baseTax = 16*2 = 32 → total = 224
    expect(calcKfzSteuer({ carType: 'petrol', displacement: 1600, co2: 175 })).toBe(224.00);
  });

  test('diesel car has higher base rate per 100 ccm', () => {
    // 2000 ccm diesel, 100 g/km CO2 → surplus = 5 g → co2Tax = 5*2 = 10
    // baseTax = 20 * 9.50 = 190  → total = 200
    expect(calcKfzSteuer({ carType: 'diesel', displacement: 2000, co2: 100 })).toBe(200.00);
  });

  test('lpg car uses petrol base rate', () => {
    // 1600 ccm lpg, 90 g/km CO2
    // baseTax = 16 * 2.00 = 32, no CO2 surplus → 32
    expect(calcKfzSteuer({ carType: 'lpg', displacement: 1600, co2: 90 })).toBe(32.00);
  });

  test('hybrid_phev uses petrol base rate', () => {
    // 2000 ccm PHEV, 50 g/km CO2
    // baseTax = 20 * 2.00 = 40, no surplus → 40
    expect(calcKfzSteuer({ carType: 'hybrid_phev', displacement: 2000, co2: 50 })).toBe(40.00);
  });

  test('CO2 in last band (>175 g/km) uses 3.40 rate', () => {
    // 1200 ccm petrol, 200 g/km → surplus = 105 g
    // band1: 20×2.00=40, band2: 20×2.20=44, band3: 20×2.50=50, band4: 20×2.90=58, band5: 25×3.40=85
    // co2Tax = 277, baseTax = 12*2 = 24 → total = 301
    expect(calcKfzSteuer({ carType: 'petrol', displacement: 1200, co2: 200 })).toBe(301.00);
  });
});

// ─── calcFinancing ────────────────────────────────────────────────────────────

describe('calcFinancing', () => {
  test('no loan returns zero payments', () => {
    const result = calcFinancing(0, 0.04, 36);
    expect(result.monthlyPayment).toBe(0);
    expect(result.totalInterest).toBe(0);
  });

  test('zero term returns zero payments', () => {
    const result = calcFinancing(10000, 0.04, 0);
    expect(result.monthlyPayment).toBe(0);
    expect(result.totalInterest).toBe(0);
  });

  test('zero interest rate spreads principal evenly', () => {
    const result = calcFinancing(12000, 0, 12);
    expect(result.monthlyPayment).toBe(1000);
    expect(result.totalInterest).toBe(0);
  });

  test('standard annuity loan produces correct monthly payment', () => {
    // 10000 EUR at 3.9% for 36 months
    // monthlyRate = 0.039/12 = 0.00325
    // payment = 10000 * (0.00325*(1.00325^36)) / ((1.00325^36)-1)
    const result = calcFinancing(10000, 0.039, 36);
    expect(result.monthlyPayment).toBeCloseTo(294.80, 1);
    expect(result.totalInterest).toBeGreaterThan(0);
  });

  test('total interest is positive for non-zero rate', () => {
    const result = calcFinancing(20000, 0.05, 60);
    expect(result.totalInterest).toBeGreaterThan(0);
    expect(result.totalInterest).toBeLessThan(20000);
  });
});

// ─── calcTCO ─────────────────────────────────────────────────────────────────

const basePetrolCar = {
  name:               'VW Golf Benzin',
  carType:            'petrol',
  isCurrent:          true,
  purchasePrice:      28000,
  residualValue:      14000,
  annualKm:           15000,
  consumption:        7.0,
  fuelPrice:          1.82,
  annualInsurance:    800,
  annualMaintenance:  600,
  displacement:       1400,
  co2:                130,
  weight:             1350,
  loanAmount:         0,
  loanRate:           0,
  loanTermMonths:     0,
};

const baseElectricCar = {
  name:               'Tesla Model 3',
  carType:            'electric',
  isCurrent:          false,
  purchasePrice:      42000,
  residualValue:      22000,
  annualKm:           15000,
  consumption:        17.0,
  fuelPrice:          0.46,
  annualInsurance:    900,
  annualMaintenance:  400,
  displacement:       0,
  co2:                0,
  weight:             1800,
  loanAmount:         10000,
  loanRate:           0.039,
  loanTermMonths:     60,
};

describe('calcTCO – petrol car (no loan)', () => {
  const tco = calcTCO(basePetrolCar, 5);

  test('returns correct car name and type', () => {
    expect(tco.name).toBe('VW Golf Benzin');
    expect(tco.carType).toBe('petrol');
  });

  test('depreciation equals purchasePrice minus residualValue', () => {
    expect(tco.depreciation).toBe(14000);
  });

  test('fuelCost is correct', () => {
    // (15000/100)*7.0*1.82*5 = 150*7*1.82*5 = 9555
    expect(tco.fuelCost).toBeCloseTo(9555, 0);
  });

  test('maintenanceCost is correct', () => {
    expect(tco.maintenanceCost).toBe(3000);
  });

  test('insuranceCost is correct', () => {
    expect(tco.insuranceCost).toBe(4000);
  });

  test('vehicleTax is positive', () => {
    expect(tco.vehicleTax).toBeGreaterThan(0);
  });

  test('financingCost is zero for no loan', () => {
    expect(tco.financingCost).toBe(0);
  });

  test('totalCost is sum of all components', () => {
    const sum = tco.depreciation + tco.fuelCost + tco.maintenanceCost +
                tco.insuranceCost + tco.vehicleTax + tco.financingCost;
    expect(tco.totalCost).toBeCloseTo(sum, 1);
  });

  test('monthlyCost = totalCost / (years*12)', () => {
    expect(tco.monthlyCost).toBeCloseTo(tco.totalCost / 60, 1);
  });
});

describe('calcTCO – electric car (with loan)', () => {
  const tco = calcTCO(baseElectricCar, 5);

  test('vehicleTax is zero for electric', () => {
    expect(tco.vehicleTax).toBe(0);
  });

  test('financingCost is positive for non-zero loan', () => {
    expect(tco.financingCost).toBeGreaterThan(0);
  });

  test('electric car fuel cost lower than equivalent petrol', () => {
    const petrolTco = calcTCO({ ...basePetrolCar, annualKm: 15000, consumption: 7.0, fuelPrice: 1.82 }, 5);
    // electric consumption 17 kWh at €0.46 vs petrol 7L at €1.82
    expect(tco.fuelCost).toBeLessThan(petrolTco.fuelCost);
  });
});

describe('calcTCO – comparison period 1 year vs 10 years', () => {
  test('1-year TCO is less than 10-year TCO', () => {
    const tco1  = calcTCO(basePetrolCar, 1);
    const tco10 = calcTCO(basePetrolCar, 10);
    expect(tco1.totalCost).toBeLessThan(tco10.totalCost);
  });
});

// ─── compareCars ─────────────────────────────────────────────────────────────

describe('compareCars', () => {
  test('results are sorted by totalCost ascending', () => {
    const cars   = [basePetrolCar, baseElectricCar];
    const result = compareCars(cars, 5);
    expect(result[0].totalCost).toBeLessThanOrEqual(result[1].totalCost);
  });

  test('returns one result per car', () => {
    const result = compareCars([basePetrolCar, baseElectricCar], 5);
    expect(result).toHaveLength(2);
  });

  test('single car comparison works', () => {
    const result = compareCars([basePetrolCar], 5);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('VW Golf Benzin');
  });

  test('empty array returns empty array', () => {
    expect(compareCars([], 5)).toHaveLength(0);
  });
});

// ─── formatEur ────────────────────────────────────────────────────────────────

describe('formatEur', () => {
  test('formats a number as euro with German locale', () => {
    const result = formatEur(1234.56);
    expect(result).toContain('€');
    expect(result).toContain('1');
  });

  test('handles zero', () => {
    const result = formatEur(0);
    expect(result).toContain('0');
    expect(result).toContain('€');
  });
});

// ─── CAR_TYPES constant ───────────────────────────────────────────────────────

describe('CAR_TYPES', () => {
  const expectedTypes = ['petrol', 'diesel', 'electric', 'hybrid_phev', 'lpg'];

  test('contains all expected car types', () => {
    expectedTypes.forEach(type => {
      expect(CAR_TYPES).toHaveProperty(type);
    });
  });

  test('each type has label, unit, defaultConsumption, defaultFuelPrice', () => {
    Object.values(CAR_TYPES).forEach(t => {
      expect(t).toHaveProperty('label');
      expect(t).toHaveProperty('unit');
      expect(typeof t.defaultConsumption).toBe('number');
      expect(typeof t.defaultFuelPrice).toBe('number');
    });
  });
});

// ─── DEFAULT constants ────────────────────────────────────────────────────────

describe('defaults', () => {
  test('DEFAULT_ANNUAL_KM is positive number', () => {
    expect(DEFAULT_ANNUAL_KM).toBeGreaterThan(0);
  });

  test('DEFAULT_YEARS is between 1 and 20', () => {
    expect(DEFAULT_YEARS).toBeGreaterThanOrEqual(1);
    expect(DEFAULT_YEARS).toBeLessThanOrEqual(20);
  });
});
