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

const { CAR_TYPES, DEFAULT_ANNUAL_KM, DEFAULT_YEARS, compareCars, formatEur } = _calc;

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
    displacement:     1400,
    co2:              130,
    weight:           1400,
    loanAmount:       0,
    loanRate:         0.039,
    loanTermMonths:   60,
    ...overrides,
  };
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
      ${car.isCurrent ? '<span class="badge-current">Aktuell</span>' : ''}
      <button class="btn btn-ghost btn-sm btn-set-current" title="Als aktuelles Fahrzeug markieren"
        ${car.isCurrent ? 'disabled' : ''}>
        ${car.isCurrent ? '✓ Aktuell' : 'Als aktuell markieren'}
      </button>
      <button class="btn btn-danger btn-sm btn-icon btn-remove" title="Fahrzeug entfernen" aria-label="Fahrzeug entfernen">✕</button>
    </div>
    <div class="car-card-body">
      <div class="section-label">Fahrzeugtyp</div>
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
          <input type="number" class="f-weight" value="${car.weight}" min="500" step="50">
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
  });

  // ── event: remove
  card.querySelector('.btn-remove').addEventListener('click', () => {
    const wasCurrent = car.isCurrent;
    cars = cars.filter(c => c.id !== car.id);
    if (wasCurrent && cars.length > 0) cars[0].isCurrent = true;
    renderCars();
  });

  // ── event: car type change (update defaults for unit labels)
  card.querySelector('.f-cartype').addEventListener('change', e => {
    const newType = e.target.value;
    const info    = CAR_TYPES[newType];
    const isE     = newType === 'electric';
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
  });

  // ── event: live sync all inputs
  card.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', () => updateCarFromCard(car.id, card));
  });

  return card;
}

function updateCarFromCard(id, card) {
  const car = cars.find(c => c.id === id);
  if (!car) return;
  car.name             = card.querySelector('.f-name').value.trim() || `Fahrzeug ${id}`;
  car.carType          = card.querySelector('.f-cartype').value;
  car.purchasePrice    = parseFloat(card.querySelector('.f-price').value)       || 0;
  car.residualValue    = parseFloat(card.querySelector('.f-residual').value)    || 0;
  car.annualKm         = parseFloat(card.querySelector('.f-km').value)          || DEFAULT_ANNUAL_KM;
  car.consumption      = parseFloat(card.querySelector('.f-consumption').value) || 0;
  car.fuelPrice        = parseFloat(card.querySelector('.f-fuelprice').value)   || 0;
  car.annualInsurance  = parseFloat(card.querySelector('.f-insurance').value)   || 0;
  car.annualMaintenance= parseFloat(card.querySelector('.f-maintenance').value) || 0;
  car.displacement     = parseFloat(card.querySelector('.f-displacement').value)|| 0;
  car.co2              = parseFloat(card.querySelector('.f-co2').value)         || 0;
  car.weight           = parseFloat(card.querySelector('.f-weight').value)      || 1400;
  car.loanAmount       = parseFloat(card.querySelector('.f-loan-amount').value) || 0;
  car.loanRate         = (parseFloat(card.querySelector('.f-loan-rate').value)  || 0) / 100;
  car.loanTermMonths   = parseInt(card.querySelector('.f-loan-term').value, 10) || 0;
}

// ─── Results rendering ────────────────────────────────────────────────────────

const CHART_COLORS = [
  '#2563eb','#16a34a','#dc2626','#d97706','#7c3aed','#0891b2','#db2777','#65a30d',
];

const COST_KEYS = ['depreciation','fuelCost','maintenanceCost','insuranceCost','vehicleTax','financingCost'];
const COST_LABELS = {
  depreciation:    'Wertverlust',
  fuelCost:        'Kraftstoff / Strom',
  maintenanceCost: 'Wartung',
  insuranceCost:   'Versicherung',
  vehicleTax:      'Kfz-Steuer',
  financingCost:   'Finanzierungskosten',
};

function renderResults() {
  const years = parseInt(yearsInput.value, 10) || DEFAULT_YEARS;
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
