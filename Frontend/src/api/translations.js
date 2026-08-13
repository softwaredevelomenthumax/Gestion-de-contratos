import api from './axiosInstance';

const translationMemory = new Map();

const keyOf = (text, target) => `${target}::${text}`;

export const translateTexts = async (texts, target = 'en') => {
  const normalizedTarget = target === 'es' ? 'es' : 'en';
  const input = Array.isArray(texts) ? texts : [];

  const result = new Array(input.length);
  const missing = [];
  const missingIndexes = [];

  input.forEach((raw, idx) => {
    const text = typeof raw === 'string' ? raw : String(raw ?? '');
    const cacheKey = keyOf(text, normalizedTarget);

    if (translationMemory.has(cacheKey)) {
      result[idx] = translationMemory.get(cacheKey);
      return;
    }

    missing.push(text);
    missingIndexes.push(idx);
  });

  if (missing.length > 0) {
    try {
      const response = await api.post('/translations/batch', {
        texts: missing,
        target: normalizedTarget
      }, { skipCache: true });

      const translated = response?.data?.translated || missing;
      translated.forEach((value, idx) => {
        const source = missing[idx];
        const translatedValue = typeof value === 'string' ? value : source;
        translationMemory.set(keyOf(source, normalizedTarget), translatedValue);
        const originalIndex = missingIndexes[idx];
        result[originalIndex] = translatedValue;
      });
    } catch {
      missing.forEach((source, idx) => {
        const originalIndex = missingIndexes[idx];
        result[originalIndex] = source;
      });
    }
  }

  return result.map((value, idx) => (typeof value === 'string' ? value : String(input[idx] ?? '')));
};

export const clearTranslationMemory = () => {
  translationMemory.clear();
};
