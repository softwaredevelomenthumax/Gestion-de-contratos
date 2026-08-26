import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateContractDurationDays } from './dateUtils.js';

test('calcula duración en días según las fechas locales', () => {
  assert.equal(calculateContractDurationDays('2025-01-01', '2025-01-08'), 7);
  assert.equal(calculateContractDurationDays('2025-01-10', '2025-01-11'), 1);
  assert.equal(calculateContractDurationDays('2025-01-15', '2025-01-14'), 0);
});
