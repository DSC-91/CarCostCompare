'use strict';

const fs = require('fs');
const path = require('path');

function setupApp() {
  document.documentElement.innerHTML = fs.readFileSync(
    path.join(__dirname, '..', 'index.html'),
    'utf8',
  );

  global.Chart = jest.fn(() => ({ destroy() {} }));
  window.Chart = global.Chart;
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({}));
  Object.assign(window, require('../calc.js'));
  require('../app.js');
}

function getCurrentCarFuelCostCell() {
  return document.querySelector('.badge-current').closest('tr').children[2];
}

function getFirstCarCard() {
  return document.querySelector('.car-card');
}

describe('app decimal input handling', () => {
  beforeEach(() => {
    jest.resetModules();
    setupApp();
  });

  test('partial decimal input is not overwritten during typing', () => {
    const consumptionInput = document.querySelector('.f-consumption');

    consumptionInput.value = '1.';
    consumptionInput.dispatchEvent(new window.Event('input', { bubbles: true }));

    expect(consumptionInput.value).not.toBe('0');
  });

  test('completed decimal input is used in the calculation', () => {
    const consumptionInput = document.querySelector('.f-consumption');

    consumptionInput.value = '1.5';
    consumptionInput.dispatchEvent(new window.Event('input', { bubbles: true }));
    consumptionInput.dispatchEvent(new window.Event('change', { bubbles: true }));
    document.getElementById('calc-btn').click();

    expect(getCurrentCarFuelCostCell().textContent).toMatch(/2\.048/);
  });

  test('switching a car to electric enables THG-Quote and applies the default value', () => {
    const firstCard = getFirstCarCard();
    const typeSelect = firstCard.querySelector('.f-cartype');
    const thgInput = firstCard.querySelector('.f-thg');

    expect(thgInput.disabled).toBe(true);

    typeSelect.value = 'electric';
    typeSelect.dispatchEvent(new window.Event('change', { bubbles: true }));

    expect(thgInput.disabled).toBe(false);
    expect(thgInput.value).toBe('300');
  });

  test('preset dropdown includes researched diesel and EV options', () => {
    const presetOptions = Array.from(getFirstCarCard().querySelectorAll('.f-preset option'))
      .map(option => option.textContent);

    expect(presetOptions).toEqual(expect.arrayContaining([
      'Audi A3 Sportback 35 TDI (150 PS)',
      'Audi A4 35 TDI',
      'Tesla Model 3 RWD',
      'Škoda Enyaq 85',
      'VW ID.7 Pro',
      'Hyundai Kona Elektro 65',
    ]));
  });

  test('selecting the Audi A3 diesel preset fills the expected values', () => {
    const presetSelect = getFirstCarCard().querySelector('.f-preset');

    presetSelect.value = 'audi_a3_35_tdi';
    presetSelect.dispatchEvent(new window.Event('change', { bubbles: true }));

    const updatedCard = getFirstCarCard();
    expect(updatedCard.querySelector('.f-name').value).toBe('Audi A3 Sportback 35 TDI (150 PS)');
    expect(updatedCard.querySelector('.f-cartype').value).toBe('diesel');
    expect(updatedCard.querySelector('.f-consumption').value).toBe('4.8');
    expect(updatedCard.querySelector('.f-price').value).toBe('39200');
    expect(updatedCard.querySelector('.f-displacement').value).toBe('1968');
    expect(updatedCard.querySelector('.f-co2').value).toBe('125');
    expect(updatedCard.querySelector('.f-weight').value).toBe('1415');
  });

  test('selecting an EV preset enables THG-Quote and resets drivetrain-specific fields', () => {
    const presetSelect = getFirstCarCard().querySelector('.f-preset');

    presetSelect.value = 'tesla_model_3_rwd';
    presetSelect.dispatchEvent(new window.Event('change', { bubbles: true }));

    const updatedCard = getFirstCarCard();
    expect(updatedCard.querySelector('.f-name').value).toBe('Tesla Model 3 RWD');
    expect(updatedCard.querySelector('.f-cartype').value).toBe('electric');
    expect(updatedCard.querySelector('.f-thg').disabled).toBe(false);
    expect(updatedCard.querySelector('.f-thg').value).toBe('300');
    expect(updatedCard.querySelector('.f-fuel-unit').textContent).toBe('EUR/kWh');
    expect(updatedCard.querySelector('.f-displacement').value).toBe('0');
    expect(updatedCard.querySelector('.f-displacement').disabled).toBe(true);
    expect(updatedCard.querySelector('.f-co2').value).toBe('0');
    expect(updatedCard.querySelector('.f-co2').disabled).toBe(true);
  });
});
