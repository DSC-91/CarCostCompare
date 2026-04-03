/* global Chart */
(function () {
'use strict';

// ─── Import calc engine (works both as module and via script tag) ─────────────
let _calc;
if (typeof require !== 'undefined' && typeof window === 'undefined') {
  _calc = require('./calc.js');
} else {
  // globals assigned by calc.js when loaded as <script>
  _calc = window;
}

const { CAR_TYPES, DEFAULT_ANNUAL_KM, DEFAULT_YEARS, DEFAULT_THG_QUOTA, compareCars, formatEur, clampNumber } = _calc;
const MIN_CAR_WEIGHT = 500;
const DEFAULT_CAR_WEIGHT = 1400;
const MAX_LOAN_RATE_PERCENT = 30;
const VEHICLE_PRESETS = {
  audi_a3_35_tdi: {
    label: 'Audi A3 Sportback 35 TDI (150 PS)',
    values: {
      name:              'Audi A3 Sportback 35 TDI (150 PS)',
      carType:           'diesel',
      purchasePrice:     39200,
      residualValue:     21500,
      annualKm:          DEFAULT_ANNUAL_KM,
      consumption:       4.8,
      fuelPrice:         CAR_TYPES.diesel.defaultFuelPrice,
      annualInsurance:   1000,
      annualMaintenance: 700,
      annualThgQuote:    0,
      displacement:      1968,
      co2:               125,
      weight:            1415,
      loanAmount:        0,
      loanRate:          0,
      loanTermMonths:    0,
    },
  },
  audi_a4_35_tdi: {
    label: 'Audi A4 35 TDI',
    values: {
      name:              'Audi A4 35 TDI',
      carType:           'diesel',
      purchasePrice:     45800,
      residualValue:     25500,
      annualKm:          DEFAULT_ANNUAL_KM,
      consumption:       5.0,
      fuelPrice:         CAR_TYPES.diesel.defaultFuelPrice,
      annualInsurance:   1150,
      annualMaintenance: 850,
      annualThgQuote:    0,
      displacement:      1968,
      co2:               130,
      weight:            1580,
      loanAmount:        0,
      loanRate:          0,
      loanTermMonths:    0,
    },
  },
  tesla_model_3_rwd: {
    label: 'Tesla Model 3 RWD',
    values: {
      name:              'Tesla Model 3 RWD',
      carType:           'electric',
      purchasePrice:     37970,
      residualValue:     23000,
      annualKm:          DEFAULT_ANNUAL_KM,
      consumption:       13.7,
      fuelPrice:         CAR_TYPES.electric.defaultFuelPrice,
      annualInsurance:   1100,
      annualMaintenance: 350,
      annualThgQuote:    DEFAULT_THG_QUOTA,
      displacement:      0,
      co2:               0,
      weight:            1847,
      loanAmount:        0,
      loanRate:          0,
      loanTermMonths:    0,
    },
  },
  skoda_enyaq_85: {
    label: 'Škoda Enyaq 85',
    values: {
      name:              'Škoda Enyaq 85',
      carType:           'electric',
      purchasePrice:     48500,
      residualValue:     28000,
      annualKm:          DEFAULT_ANNUAL_KM,
      consumption:       16.4,
      fuelPrice:         CAR_TYPES.electric.defaultFuelPrice,
      annualInsurance:   1100,
      annualMaintenance: 450,
      annualThgQuote:    DEFAULT_THG_QUOTA,
      displacement:      0,
      co2:               0,
      weight:            2117,
      loanAmount:        0,
      loanRate:          0,
      loanTermMonths:    0,
    },
  },
  vw_id7_pro: {
    label: 'VW ID.7 Pro',
    values: {
      name:              'VW ID.7 Pro',
      carType:           'electric',
      purchasePrice:     56995,
      residualValue:     33000,
      annualKm:          DEFAULT_ANNUAL_KM,
      consumption:       15.8,
      fuelPrice:         CAR_TYPES.electric.defaultFuelPrice,
      annualInsurance:   1200,
      annualMaintenance: 450,
      annualThgQuote:    DEFAULT_THG_QUOTA,
      displacement:      0,
      co2:               0,
      weight:            2172,
      loanAmount:        0,
      loanRate:          0,
      loanTermMonths:    0,
    },
  },
  hyundai_kona_elektro_65: {
    label: 'Hyundai Kona Elektro 65',
    values: {
      name:              'Hyundai Kona Elektro 65',
      carType:           'electric',
      purchasePrice:     45000,
      residualValue:     25500,
      annualKm:          DEFAULT_ANNUAL_KM,
      consumption:       16.1,
      fuelPrice:         CAR_TYPES.electric.defaultFuelPrice,
      annualInsurance:   1000,
      annualMaintenance: 400,
      annualThgQuote:    DEFAULT_THG_QUOTA,
      displacement:      0,
      co2:               0,
      weight:            1760,
      loanAmount:        0,
      loanRate:          0,
      loanTermMonths:    0,
    },
  },
};

// ─── App state ────────────────────────────────────────────────────────────────
let cars   = [];       // array of car objects (mutable state)
let nextId = 1;        // auto-increment ID

// ─── DOM references ───────────────────────────────────────────────────────────
const carsGrid       = document.getElementById('cars-grid');
const addCarBtn      = document.getElementById('add-car-btn');
const yearsInput     = document.getElementById('years-input');
const calcBtn        = document.getElementById('calc-btn');
const resultsSection = document.getElementById('results-section');
const calloutEl      = document.getElementById('callout');
const summaryTable   = document.getElementById('summary-table');
const summaryThead   = document.getElementById('summary-thead');
const summaryTbody   = document.getElementById('summary-tbody');

let tcoChart      = null;
let breakdownChart = null;

// ─── Car defaults ─────────────────────────────────────────────────────────────

function makeCar(overrides = {}) {
  const carType = overrides.carType || 'petrol';
  const type    = CAR_TYPES[carType];
  return {
    id:               nextId++,
    presetKey:        '',
    name:             `Fahrzeug ${nextId - 1}`,
    carType,
    isCurrent:        cars.length === 0, // first car is current by default
    purchasePrice:    25000,
    residualValue:    12000,
    annualKm:         DEFAULT_ANNUAL_KM,
    consumption:      type.defaultConsumption,
    fuelPrice:        type.defaultFuelPrice,
    annualInsurance:  800,
    annualMaintenance: 600,
    annualThgQuote:   carType === 'electric' ? DEFAULT_THG_QUOTA : 0,
    displacement:     1400,
    co2:              130,
    weight:           DEFAULT_CAR_WEIGHT,
    loanAmount:       0,
    loanRate:         0.039,
    loanTermMonths:   60,
    ...overrides,
  };
}

function applyPresetToCar(car, presetKey) {
  const preset = VEHICLE_PRESETS[presetKey];
  if (!preset) {
    car.presetKey = '';
    return;
  }
  Object.assign(car, preset.values, { presetKey });
}

// ─── Rendering ────────────────────────────────────────────────────────────────

function renderCars() {
  carsGrid.innerHTML = '';
  if (cars.length === 0) {
    carsGrid.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" fill="none" stroke="#94a3b8" stroke-width="1.5" viewBox="0 0 24 24">
          <path d="M3 13l1.5-4.5A2 2 0 0 1 6.38 7H17.6a2 2 0 0 1 1.9 1.38L21 13"/>
          <path d="M3 13v4h1a2 2 0 0 0 4 0h6a2 2 0 0 0 4 0h1v-4"/>
          <circle cx="7" cy="17" r="1"/><circle cx="17" cy="17" r="1"/>
        </svg>
        <h3>Noch keine Fahrzeuge</h3>
        <p>Klicke auf „Fahrzeug hinzufügen" um loszulegen.</p>
      </div>`;
    return;
  }
  cars.forEach(car => carsGrid.appendChild(buildCarCard(car)));
}

function buildCarCard(car) {
  const type    = CAR_TYPES[car.carType];
  const isElec  = car.carType === 'electric';

  const card = document.createElement('div');
  card.className = `car-card${car.isCurrent ? ' is-current' : ''}`;
  card.dataset.id = car.id;

  card.innerHTML = `
    <div class="car-card-header">
      <input type="text" class="f-name" value="${esc(car.name)}" placeholder="Fahrzeugname" aria-label="Fahrzeugname">
      <button class="btn btn-ghost btn-sm btn-set-current" title="Als aktuelles Fahrzeug markieren"
        ${car.isCurrent ? 'disabled' : ''}>
        ${car.isCurrent ? '✓ Aktuell' : 'Als Aktuell'}
      </button>
      <button class="btn btn-danger btn-sm btn-icon btn-remove" title="Fahrzeug entfernen" aria-label="Fahrzeug entfernen">✕</button>
    </div>
    <div class="car-card-body">
      <div class="section-label">Fahrzeugtyp</div>
      <div class="field-group">
        <div class="field">
          <label>Preset laden</label>
          <select class="f-preset" aria-label="Fahrzeug-Preset">
            <option value="">Eigenes Fahrzeug</option>
            ${Object.entries(VEHICLE_PRESETS).map(([key, preset]) =>
              `<option value="${key}"${key === car.presetKey ? ' selected' : ''}>${preset.label}</option>`
            ).join('')}
          </select>
        </div>
      </div>
      <div class="field-group">
        <div class="field">
          <label>Antriebsart</label>
          <select class="f-cartype">
            ${Object.entries(CAR_TYPES).map(([k, v]) =>
              `<option value="${k}"${k === car.carType ? ' selected' : ''}>${v.label}</option>`
            ).join('')}
          </select>
        </div>
        <div class="field">
          <label>${isElec ? 'Hubraum (ignoriert)' : 'Hubraum (ccm)'}</label>
          <input type="number" class="f-displacement" value="${car.displacement}" min="0" step="100"
            ${isElec ? 'disabled placeholder="–"' : ''}>
          <span class="unit">ccm</span>
        </div>
      </div>
      <div class="field-group">
        <div class="field">
          <label>CO₂-Emissionen</label>
          <input type="number" class="f-co2" value="${car.co2}" min="0" step="1"
            ${isElec ? 'disabled placeholder="0"' : ''}>
          <span class="unit">g/km</span>
        </div>
        <div class="field">
          <label>Leergewicht</label>
          <input type="number" class="f-weight" value="${car.weight}" min="${MIN_CAR_WEIGHT}" step="50">
          <span class="unit">kg</span>
        </div>
      </div>

      <div class="section-label">Kosten & Nutzung</div>
      <div class="field-group">
        <div class="field">
          <label>Kaufpreis</label>
          <input type="number" class="f-price" value="${car.purchasePrice}" min="0" step="500">
          <span class="unit">EUR</span>
        </div>
        <div class="field">
          <label>Restwert nach Laufzeit</label>
          <input type="number" class="f-residual" value="${car.residualValue}" min="0" step="500">
          <span class="unit">EUR</span>
        </div>
      </div>
      <div class="field-group">
        <div class="field">
          <label>Kilometerleistung</label>
          <input type="number" class="f-km" value="${car.annualKm}" min="1000" step="1000">
          <span class="unit">km/Jahr</span>
        </div>
        <div class="field">
          <label>Verbrauch</label>
          <input type="number" class="f-consumption" value="${car.consumption}" min="0" step="0.1">
          <span class="unit f-unit">${type.unit}</span>
        </div>
      </div>
      <div class="field-group">
        <div class="field">
          <label>Kraftstoffpreis</label>
          <input type="number" class="f-fuelprice" value="${car.fuelPrice}" min="0" step="0.01">
          <span class="unit f-fuel-unit">${isElec ? 'EUR/kWh' : 'EUR/L'}</span>
        </div>
        <div class="field">
          <label>Versicherung</label>
          <input type="number" class="f-insurance" value="${car.annualInsurance}" min="0" step="50">
          <span class="unit">EUR/Jahr</span>
        </div>
      </div>
      <div class="field-group">
        <div class="field">
          <label>Wartungskosten</label>
          <input type="number" class="f-maintenance" value="${car.annualMaintenance}" min="0" step="50">
          <span class="unit">EUR/Jahr</span>
        </div>
        <div class="field">
          <label class="f-thg-label">${isElec ? 'THG-Quote' : 'THG-Quote (nur BEV)'}</label>
          <input type="number" class="f-thg" value="${car.annualThgQuote}" min="0" step="10"
            ${isElec ? '' : 'disabled placeholder="0"'}>
          <span class="unit">EUR/Jahr</span>
        </div>
      </div>

      <div class="section-label">Finanzierung (optional)</div>
      <div class="field-group">
        <div class="field">
          <label>Darlehensbetrag</label>
          <input type="number" class="f-loan-amount" value="${car.loanAmount}" min="0" step="500">
          <span class="unit">EUR</span>
        </div>
        <div class="field">
          <label>Zinssatz (p.a.)</label>
          <input type="number" class="f-loan-rate" value="${(car.loanRate * 100).toFixed(2)}" min="0" step="0.1" max="30">
          <span class="unit">%</span>
        </div>
      </div>
      <div class="field-group">
        <div class="field">
          <label>Laufzeit</label>
          <input type="number" class="f-loan-term" value="${car.loanTermMonths}" min="0" step="6" max="120">
          <span class="unit">Monate</span>
        </div>
      </div>
    </div>`;

  // ── event: set current
  card.querySelector('.btn-set-current').addEventListener('click', () => {
    cars.forEach(c => { c.isCurrent = c.id === car.id; });
    renderCars();
    renderResults();
  });

  // ── event: remove
  card.querySelector('.btn-remove').addEventListener('click', () => {
    const wasCurrent = car.isCurrent;
    cars = cars.filter(c => c.id !== car.id);
    if (wasCurrent && cars.length > 0) cars[0].isCurrent = true;
    renderCars();
    renderResults();
  });

  // ── event: apply preset
  card.querySelector('.f-preset').addEventListener('change', e => {
    const presetKey = e.target.value;
    if (!presetKey) {
      updateCarFromCard(car.id, card);
      car.presetKey = '';
      return;
    }
    applyPresetToCar(car, presetKey);
    renderCars();
    renderResults();
  });

  // ── event: car type change (update defaults for unit labels)
  card.querySelector('.f-cartype').addEventListener('change', e => {
    const newType = e.target.value;
    const info    = CAR_TYPES[newType];
    const isE     = newType === 'electric';
    const previousType = car.carType;
    const thgInput = card.querySelector('.f-thg');
    updateCarFromCard(car.id, card);
    // update unit labels
    card.querySelector('.f-unit').textContent      = info.unit;
    card.querySelector('.f-fuel-unit').textContent = isE ? 'EUR/kWh' : 'EUR/L';
    // disable irrelevant fields for EV
    card.querySelector('.f-displacement').disabled = isE;
    card.querySelector('.f-co2').disabled          = isE;
    if (isE) {
      card.querySelector('.f-co2').value          = 0;
      card.querySelector('.f-displacement').value = 0;
    }
    card.querySelector('.f-thg-label').textContent = isE ? 'THG-Quote' : 'THG-Quote (nur BEV)';
    thgInput.disabled = !isE;
    if (isE && previousType !== 'electric' && clampNumber(thgInput.value, { fallback: 0 }) === 0) {
      thgInput.value = String(DEFAULT_THG_QUOTA);
    }
    updateCarFromCard(car.id, card);
  });

  // ── event: live sync all inputs
  card.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', () => updateCarFromCard(car.id, card));
    if (el.matches('input[type="number"]')) {
      el.addEventListener('change', () => updateCarFromCard(car.id, card, { normalizeNumbers: true }));
    }
  });

  return card;
}

function updateCarFromCard(id, card, { normalizeNumbers = false } = {}) {
  const car = cars.find(c => c.id === id);
  if (!car) return;

  const readNumber = (selector, fallback, options = {}) => {
    const input = card.querySelector(selector);
    if (!input) return fallback;
    const { min = 0, max = Infinity, integer = false } = options;

    if (!normalizeNumbers && (input.value.trim() === '' || (input.validity && input.validity.badInput))) {
      return fallback;
    }

    const normalizedInput = input.value.replace(',', '.');
    const rawValue = integer ? parseInt(normalizedInput, 10) : parseFloat(normalizedInput);
    const value = clampNumber(rawValue, { min, max, fallback, integer });
    if (normalizeNumbers) input.value = String(value);
    return value;
  };

  car.name             = card.querySelector('.f-name').value.trim() || `Fahrzeug ${id}`;
  car.presetKey        = card.querySelector('.f-preset').value;
  car.carType          = card.querySelector('.f-cartype').value;
  const purchasePrice  = readNumber('.f-price', 0);
  car.purchasePrice    = purchasePrice;
  car.residualValue    = readNumber('.f-residual', 0, { max: purchasePrice });
  car.annualKm         = readNumber('.f-km', DEFAULT_ANNUAL_KM, { min: 0 });
  car.consumption      = readNumber('.f-consumption', 0);
  car.fuelPrice        = readNumber('.f-fuelprice', 0);
  car.annualInsurance  = readNumber('.f-insurance', 0);
  car.annualMaintenance= readNumber('.f-maintenance', 0);
  car.annualThgQuote   = readNumber('.f-thg', car.carType === 'electric' ? DEFAULT_THG_QUOTA : 0);
  car.displacement     = readNumber('.f-displacement', 0);
  car.co2              = readNumber('.f-co2', 0);
  car.weight           = readNumber('.f-weight', DEFAULT_CAR_WEIGHT, { min: MIN_CAR_WEIGHT });
  car.loanAmount       = readNumber('.f-loan-amount', 0);
  // Cap displayed APR input at 30% to catch obvious entry mistakes such as typing 390 instead of 3.9.
  car.loanRate         = readNumber('.f-loan-rate', 0, { max: MAX_LOAN_RATE_PERCENT }) / 100;
  car.loanTermMonths   = readNumber('.f-loan-term', 0, { min: 0, max: 120, integer: true });
}

// ─── Results rendering ────────────────────────────────────────────────────────

const CHART_COLORS = [
  '#2563eb','#16a34a','#dc2626','#d97706','#7c3aed','#0891b2','#db2777','#65a30d',
];

const COST_KEYS = ['depreciation','fuelCost','maintenanceCost','insuranceCost','vehicleTax','thgQuotaBenefit','financingCost'];
const COST_LABELS = {
  depreciation:    'Wertverlust',
  fuelCost:        'Kraftstoff / Strom',
  maintenanceCost: 'Wartung',
  insuranceCost:   'Versicherung',
  vehicleTax:      'Kfz-Steuer',
  thgQuotaBenefit: 'THG-Quote',
  financingCost:   'Finanzierungskosten',
};

function renderResults() {
  let years = parseInt(yearsInput.value, 10);
  if (!Number.isInteger(years) || years < 1) years = DEFAULT_YEARS;
  if (years > 20) years = 20;
  yearsInput.value = String(years);
  if (cars.length === 0) {
    resultsSection.style.display = 'none';
    return;
  }
  const results = compareCars(cars, years);
  resultsSection.style.display = '';

  renderCallout(results);
  renderTCOChart(results);
  renderBreakdownChart(results);
  renderTable(results, years);
}

function renderCallout(results) {
  const current = results.find(r => r.isCurrent);
  const best    = results[0];

  if (!current || results.length < 2) {
    calloutEl.className = 'callout callout-neutral';
    calloutEl.innerHTML = results.length < 2
      ? '💡 Füge mindestens ein weiteres Fahrzeug hinzu, um einen Vergleich zu sehen.'
      : `✅ Gesamtkosten für <strong>${esc(results[0].name)}</strong>: <strong>${formatEur(results[0].totalCost)}</strong> über ${results[0].years} Jahre.`;
    return;
  }

  if (best.id === current.id) {
    calloutEl.className = 'callout callout-neutral';
    calloutEl.innerHTML = `✅ <strong>${esc(current.name)}</strong> ist bereits das günstigste Fahrzeug über ${current.years} Jahre.`;
    return;
  }

  const saving = current.totalCost - best.totalCost;
  calloutEl.className = 'callout callout-success';
  calloutEl.innerHTML = `
    💰 Durch den Wechsel von <strong>${esc(current.name)}</strong> zu <strong>${esc(best.name)}</strong>
    könntest du über ${best.years} Jahre etwa <strong>${formatEur(saving)}</strong>
    (≈ <strong>${formatEur(saving / (best.years * 12))}</strong>/Monat) sparen.`;
}

function renderTCOChart(results) {
  const ctx = document.getElementById('tco-chart').getContext('2d');
  if (tcoChart) tcoChart.destroy();

  tcoChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: results.map(r => r.name),
      datasets: [{
        label: 'Gesamtkosten',
        data:  results.map(r => r.totalCost),
        backgroundColor: results.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
        borderRadius: 5,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => formatEur(ctx.raw) },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: v => formatEur(v) },
        },
      },
    },
  });
}

function renderBreakdownChart(results) {
  const ctx = document.getElementById('breakdown-chart').getContext('2d');
  if (breakdownChart) breakdownChart.destroy();

  const stackColors = {
    depreciation:    '#3b82f6',
    fuelCost:        '#f59e0b',
    maintenanceCost: '#10b981',
    insuranceCost:   '#8b5cf6',
    vehicleTax:      '#ef4444',
    thgQuotaBenefit: '#15803d',
    financingCost:   '#06b6d4',
  };

  breakdownChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: results.map(r => r.name),
      datasets: COST_KEYS.map(key => ({
        label:           COST_LABELS[key],
        data:            results.map(r => r[key]),
        backgroundColor: stackColors[key],
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: { label: ctx => `${ctx.dataset.label}: ${formatEur(ctx.raw)}` },
        },
      },
      scales: {
        x: { stacked: true },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: { callback: v => formatEur(v) },
        },
      },
    },
  });
}

function renderTable(results, years) {
  // thead
  summaryThead.innerHTML = `
    <tr>
      <th>Fahrzeug</th>
      ${COST_KEYS.map(k => `<th>${COST_LABELS[k]}</th>`).join('')}
      <th>Gesamt (${years} J.)</th>
      <th>Ø Monat</th>
      <th>vs. Aktuell</th>
    </tr>`;

  const current = results.find(r => r.isCurrent);
  summaryTbody.innerHTML = results.map((r, i) => {
    const diff    = current && !r.isCurrent ? r.totalCost - current.totalCost : null;
    const diffStr = diff === null
      ? '—'
      : diff < 0
        ? `<span class="diff-better">-${formatEur(-diff)}</span>`
        : `<span class="diff-worse">+${formatEur(diff)}</span>`;
    const rowClass = i === 0 ? 'best-value' : r.isCurrent ? 'is-current' : '';
    return `
      <tr class="${rowClass}">
        <td>${esc(r.name)}${r.isCurrent ? ' <span class="badge-current">Aktuell</span>' : ''}${i === 0 ? ' 🏆' : ''}</td>
        ${COST_KEYS.map(k => `<td>${formatEur(r[k])}</td>`).join('')}
        <td><strong>${formatEur(r.totalCost)}</strong></td>
        <td>${formatEur(r.monthlyCost)}</td>
        <td>${diffStr}</td>
      </tr>`;
  }).join('');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Event listeners ──────────────────────────────────────────────────────────

addCarBtn.addEventListener('click', () => {
  cars.push(makeCar());
  renderCars();
});

calcBtn.addEventListener('click', renderResults);

yearsInput.addEventListener('change', () => {
  if (resultsSection.style.display !== 'none') renderResults();
});

// ─── Init ──────────────────────────────────────────────────────────────────────

// Start with two example cars
cars.push(makeCar({
  name:             'VW Golf Benzin (aktuell)',
  carType:          'petrol',
  purchasePrice:    27500,
  residualValue:    13000,
  annualKm:         15000,
  consumption:      7.2,
  fuelPrice:        1.82,
  annualInsurance:  850,
  annualMaintenance: 650,
  displacement:     1400,
  co2:              128,
  weight:           1360,
  loanAmount:       0,
  loanRate:         0,
  loanTermMonths:   0,
  isCurrent:        true,
}));

cars.push(makeCar({
  name:             'Tesla Model 3 Standard',
  carType:          'electric',
  purchasePrice:    42990,
  residualValue:    22000,
  annualKm:         15000,
  consumption:      17.0,
  fuelPrice:        0.46,
  annualInsurance:  950,
  annualMaintenance: 350,
  annualThgQuote:   DEFAULT_THG_QUOTA,
  displacement:     0,
  co2:              0,
  weight:           1752,
  loanAmount:       15000,
  loanRate:         0.039,
  loanTermMonths:   60,
  isCurrent:        false,
}));

renderCars();
renderResults();

}()); // end IIFE
