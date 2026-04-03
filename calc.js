/**
 * CarCostCompare – Cost Calculation Engine
 *
 * Supports car types: petrol, diesel, electric, hybrid_phev, lpg
 * All monetary values are in EUR, distances in km.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const CAR_TYPES = {
  petrol:      { label: 'Benzin',           unit: 'L/100 km',   defaultConsumption: 7.5,  defaultFuelPrice: 1.82 },
  diesel:      { label: 'Diesel',           unit: 'L/100 km',   defaultConsumption: 6.0,  defaultFuelPrice: 1.76 },
  electric:    { label: 'Elektro (BEV)',    unit: 'kWh/100 km', defaultConsumption: 18.0, defaultFuelPrice: 0.46 },
  hybrid_phev: { label: 'Plug-in Hybrid',   unit: 'L/100 km',   defaultConsumption: 4.5,  defaultFuelPrice: 1.82 },
  lpg:         { label: 'LPG / Autogas',    unit: 'L/100 km',   defaultConsumption: 9.5,  defaultFuelPrice: 0.88 },
};

const DEFAULT_ANNUAL_KM = 15000;
const DEFAULT_YEARS     = 5;
// Post-2030 BEV tax rate in this app's simplified German tax model: EUR/year per 100 kg of vehicle weight.
const ELECTRIC_TAX_RATE_PER_100KG = 0.5;

function toFiniteNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampNumber(value, { min = 0, max = Infinity, fallback = 0, integer = false } = {}) {
  let parsed = toFiniteNumber(value, fallback);
  if (integer) parsed = Math.trunc(parsed);
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
}

function normalizeYears(years) {
  const parsed = toFiniteNumber(years, DEFAULT_YEARS);
  if (parsed < 1) return DEFAULT_YEARS;
  return Math.trunc(parsed);
}

function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}

/**
 * Calculate total vehicle tax over a multi-year comparison period.
 *
 * For BEVs this applies the yearly exemption through 2030 and the post-2030
 * weight-based tax afterwards. Other drivetrains use the same annual tax for
 * each year in the comparison period.
 *
 * @param {object} params
 * @param {string} params.carType
 * @param {number} params.displacement
 * @param {number} params.co2
 * @param {number} params.weight
 * @param {number} params.years
 * @param {number} [params.startYear]
 * @returns {number}
 */
function calcMultiYearVehicleTax({ carType, displacement, co2, weight, years, startYear = new Date().getFullYear() }) {
  const safeYears = normalizeYears(years);
  const safeStartYear = clampNumber(startYear, { min: 0, fallback: new Date().getFullYear(), integer: true });

  if (carType !== 'electric') {
    return calcKfzSteuer({ carType, displacement, co2, weight, taxYear: safeStartYear }) * safeYears;
  }

  let totalTax = 0;
  for (let offset = 0; offset < safeYears; offset += 1) {
    totalTax += calcKfzSteuer({
      carType,
      displacement,
      co2,
      weight,
      taxYear: safeStartYear + offset,
    });
  }
  return totalTax;
}

// ─── Kfz-Steuer (German vehicle tax) ─────────────────────────────────────────

/**
 * Calculate annual German Kfz-Steuer.
 *
 * Simplified model based on 2024 rules:
 *  - Petrol:  €2.00 per 100 ccm engine displacement  +  CO2 component
 *  - Diesel:  €9.50 per 100 ccm                       +  CO2 component
 *  - BEV:     Free until 31 Dec 2030; afterwards €0.50 per 100 kg weight
 *  - PHEV:    Taxed like petrol (combustion part)
 *  - LPG:     Same base as petrol
 *
 * CO2 component (petrol/diesel/hybrid): for each g/km ABOVE 95 g/km →
 *   up to 115 g: €2.00/g, up to 135 g: €2.20/g, up to 155 g: €2.50/g,
 *   up to 175 g: €2.90/g, over 175 g: €3.40/g  (linear simplified here)
 *
 * @param {object} params
 * @param {string} params.carType      – 'petrol'|'diesel'|'electric'|'hybrid_phev'|'lpg'
 * @param {number} params.displacement – Engine displacement in ccm (ignored for BEV)
 * @param {number} params.co2          – CO2 emissions in g/km (0 for BEV)
 * @param {number} [params.weight]     – Kerb weight in kg (used for BEV after 2030)
 * @param {number} [params.taxYear]    – Calendar year for applying BEV tax rules
 * @returns {number} Annual tax in EUR
 */
function calcKfzSteuer({ carType, displacement, co2, weight = 1500, taxYear = new Date().getFullYear() }) {
  const safeDisplacement = clampNumber(displacement);
  const safeCo2 = clampNumber(co2);
  const safeWeight = clampNumber(weight);
  const safeTaxYear = clampNumber(taxYear, { min: 0, fallback: new Date().getFullYear(), integer: true });

  if (carType === 'electric') {
    if (safeTaxYear <= 2030) return 0;
    // From 2031 onward, BEVs use a weight-based annual tax in this simplified model.
    const taxableWeightUnits = Math.ceil(safeWeight / 100);
    return roundCurrency(taxableWeightUnits * ELECTRIC_TAX_RATE_PER_100KG);
  }

  const ccmUnits   = Math.ceil(safeDisplacement / 100);
  let   basePerCcm = 0;

  if (carType === 'diesel') {
    basePerCcm = 9.50;
  } else {
    // petrol, hybrid_phev, lpg
    basePerCcm = 2.00;
  }

  const baseTax = ccmUnits * basePerCcm;

  // CO2 surcharge (above 95 g/km threshold)
  const co2Surplus = Math.max(0, safeCo2 - 95);
  let co2Tax = 0;
  if (co2Surplus > 0) {
    const bands = [
      { limit: 20, rate: 2.00 },  // 96–115 g/km
      { limit: 20, rate: 2.20 },  // 116–135 g/km
      { limit: 20, rate: 2.50 },  // 136–155 g/km
      { limit: 20, rate: 2.90 },  // 156–175 g/km
      { limit: Infinity, rate: 3.40 }, // > 175 g/km
    ];
    let remaining = co2Surplus;
    for (const band of bands) {
      if (remaining <= 0) break;
      const taxed = Math.min(remaining, band.limit);
      co2Tax    += taxed * band.rate;
      remaining -= taxed;
    }
  }

  return roundCurrency(baseTax + co2Tax);
}

// ─── Financing ────────────────────────────────────────────────────────────────

/**
 * Calculate the total financing cost over a loan term.
 *
 * @param {number} loanAmount   – Amount borrowed in EUR
 * @param {number} annualRate   – Annual interest rate (e.g. 0.039 for 3.9 %)
 * @param {number} termMonths   – Loan term in months
 * @returns {{ monthlyPayment: number, totalInterest: number }}
 */
function calcFinancing(loanAmount, annualRate, termMonths) {
  const safeLoanAmount = clampNumber(loanAmount);
  const safeAnnualRate = clampNumber(annualRate);
  const safeTermMonths = clampNumber(termMonths, { integer: true });

  if (safeLoanAmount <= 0 || safeTermMonths <= 0) {
    return { monthlyPayment: 0, totalInterest: 0 };
  }

  if (safeAnnualRate === 0) {
    const monthly = safeLoanAmount / safeTermMonths;
    return { monthlyPayment: Math.round(monthly * 100) / 100, totalInterest: 0 };
  }

  const r        = safeAnnualRate / 12;
  const monthly  = safeLoanAmount * (r * Math.pow(1 + r, safeTermMonths)) / (Math.pow(1 + r, safeTermMonths) - 1);
  const total    = monthly * safeTermMonths;
  return {
    monthlyPayment: roundCurrency(monthly),
    totalInterest:  roundCurrency(total - safeLoanAmount),
  };
}

// ─── Total Cost of Ownership ──────────────────────────────────────────────────

/**
 * Calculate the full TCO breakdown for a car over N years.
 *
 * @param {object} car
 * @param {string}  car.name
 * @param {string}  car.carType         – key from CAR_TYPES
 * @param {boolean} car.isCurrent
 * @param {number}  car.purchasePrice   – EUR
 * @param {number}  car.residualValue   – Expected value at end of period (EUR)
 * @param {number}  car.annualKm        – km driven per year
 * @param {number}  car.consumption     – L/100 km or kWh/100 km
 * @param {number}  car.fuelPrice       – EUR per L or per kWh
 * @param {number}  car.annualInsurance – EUR/year
 * @param {number}  car.annualMaintenance – EUR/year
 * @param {number}  car.displacement    – ccm (0 for BEV)
 * @param {number}  car.co2             – g/km
 * @param {number}  car.weight          – kg
 * @param {number}  car.loanAmount      – EUR borrowed
 * @param {number}  car.loanRate        – Annual interest rate (decimal)
 * @param {number}  car.loanTermMonths  – Months
 * @param {number}  years               – Comparison period in years
 * @returns {object} Detailed cost breakdown
 */
function calcTCO(car, years) {
  const safeYears = normalizeYears(years);
  const purchasePrice = clampNumber(car.purchasePrice);
  const residualValue = Math.min(clampNumber(car.residualValue), purchasePrice);
  const annualKm = clampNumber(car.annualKm);
  const consumption = clampNumber(car.consumption);
  const fuelPrice = clampNumber(car.fuelPrice);
  const annualMaintenance = clampNumber(car.annualMaintenance);
  const annualInsurance = clampNumber(car.annualInsurance);
  const displacement = clampNumber(car.displacement);
  const co2 = clampNumber(car.co2);
  const weight = clampNumber(car.weight);
  const loanAmount = clampNumber(car.loanAmount);
  const loanRate = clampNumber(car.loanRate);
  const loanTermMonths = clampNumber(car.loanTermMonths, { integer: true });
  const taxStartYear = clampNumber(car.taxStartYear, { min: 0, fallback: new Date().getFullYear(), integer: true });

  const fuelCost        = (annualKm / 100) * consumption * fuelPrice * safeYears;
  const maintenanceCost = annualMaintenance * safeYears;
  const insuranceCost   = annualInsurance   * safeYears;
  const vehicleTax      = calcMultiYearVehicleTax({
    carType:      car.carType,
    displacement,
    co2,
    weight,
    years:        safeYears,
    startYear:    taxStartYear,
  });

  const depreciation = purchasePrice - residualValue;

  const { totalInterest } = calcFinancing(loanAmount, loanRate, loanTermMonths);

  const totalCost = depreciation + fuelCost + maintenanceCost + insuranceCost + vehicleTax + totalInterest;
  const monthlyCost = totalCost / (safeYears * 12);

  return {
    name:             car.name,
    carType:          car.carType,
    isCurrent:        car.isCurrent,
    years:            safeYears,
    purchasePrice,
    residualValue,
    depreciation:     roundCurrency(depreciation),
    fuelCost:         roundCurrency(fuelCost),
    maintenanceCost:  roundCurrency(maintenanceCost),
    insuranceCost:    roundCurrency(insuranceCost),
    vehicleTax:       roundCurrency(vehicleTax),
    financingCost:    roundCurrency(totalInterest),
    totalCost:        roundCurrency(totalCost),
    monthlyCost:      roundCurrency(monthlyCost),
  };
}

/**
 * Compare multiple cars and return TCO results sorted by totalCost ascending.
 *
 * @param {object[]} cars
 * @param {number}   years
 * @returns {object[]}
 */
function compareCars(cars, years) {
  return cars
    .map(car => calcTCO(car, years))
    .sort((a, b) => a.totalCost - b.totalCost);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a number as Euro currency string. */
function formatEur(value) {
  return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

// ─── Exports (Node.js / Jest and browser globals) ────────────────────────────

const _calcExports = { CAR_TYPES, DEFAULT_ANNUAL_KM, DEFAULT_YEARS, calcKfzSteuer, calcFinancing, calcTCO, compareCars, formatEur, clampNumber };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = _calcExports;
} else if (typeof window !== 'undefined') {
  Object.assign(window, _calcExports);
}
