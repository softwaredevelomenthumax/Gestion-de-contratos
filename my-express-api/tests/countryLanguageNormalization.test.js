const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeCountryCode, normalizeLanguageCode } = require('../utils/countries');

test('normalizeCountryCode accepts US/USA aliases', () => {
  assert.equal(normalizeCountryCode('US'), 'US');
  assert.equal(normalizeCountryCode('USA'), 'US');
  assert.equal(normalizeCountryCode('us'), 'US');
});

test('normalizeLanguageCode accepts English locale variants', () => {
  assert.equal(normalizeLanguageCode('en'), 'en');
  assert.equal(normalizeLanguageCode('en-US'), 'en');
  assert.equal(normalizeLanguageCode('en_US'), 'en');
  assert.equal(normalizeLanguageCode('es-CO'), 'es');
});
