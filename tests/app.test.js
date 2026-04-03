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
});
