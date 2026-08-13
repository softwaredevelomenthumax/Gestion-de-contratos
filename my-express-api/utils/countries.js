const COUNTRY_ALIASES = {
  CO: ['CO', 'COL'],
  US: ['US', 'USA'],
  MX: ['MX', 'MEX'],
  AR: ['AR', 'ARG'],
  PE: ['PE', 'PER'],
  CL: ['CL', 'CHL'],
  EC: ['EC', 'ECU']
};

const normalizeLanguageCode = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return 'es';
  if (normalized === 'en' || normalized.startsWith('en-') || normalized === 'en_us') return 'en';
  if (normalized === 'es' || normalized.startsWith('es-') || normalized === 'es_co') return 'es';
  return 'es';
};

const normalizeCountryCode = (value) => {
  const code = String(value || '').trim().toUpperCase();
  return Object.keys(COUNTRY_ALIASES).find((canonical) => COUNTRY_ALIASES[canonical].includes(code)) || null;
};

const compatibleCountryCodes = (value) => {
  const canonical = normalizeCountryCode(value);
  return canonical ? COUNTRY_ALIASES[canonical] : [];
};

module.exports = { COUNTRY_ALIASES, normalizeCountryCode, normalizeLanguageCode, compatibleCountryCodes };
