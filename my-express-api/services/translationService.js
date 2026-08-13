const DEFAULT_TIMEOUT_MS = 10000;
const MAX_TEXT_LENGTH = 5000;

const translationCache = new Map();

const normalizeCacheKey = (text, target) => `${target}::${(text || '').trim()}`;

const shouldSkipText = (text) => {
  if (!text || typeof text !== 'string') return true;
  const trimmed = text.trim();
  if (!trimmed) return true;

  // Skip pure numbers, IDs, and short symbols.
  if (/^[\d\s.,:/-]+$/.test(trimmed)) return true;
  if (trimmed.length <= 1) return true;

  return false;
};

const batchTranslateWithLibreTranslate = async (texts, targetLang) => {
  const endpoint = process.env.TRANSLATION_API_URL || 'https://libretranslate.com/translate';

  const tasks = texts.map(async (text) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: text,
        source: 'es',
        target: targetLang,
        format: 'text'
      }),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS)
    });

    if (!response.ok) {
      throw new Error(`Translation API error (${response.status})`);
    }

    const data = await response.json();
    return data?.translatedText || text;
  });

  return Promise.all(tasks);
};

const translateBatch = async ({ texts = [], target = 'en' }) => {
  const normalizedTarget = target === 'es' ? 'es' : 'en';

  const prepared = texts.map((text, index) => ({
    index,
    original: typeof text === 'string' ? text : String(text ?? ''),
  }));

  const cachedOrPending = prepared.map((entry) => {
    if (shouldSkipText(entry.original)) {
      return { ...entry, translated: entry.original, skip: true };
    }

    const safeText = entry.original.slice(0, MAX_TEXT_LENGTH);
    const cacheKey = normalizeCacheKey(safeText, normalizedTarget);
    const cached = translationCache.get(cacheKey);

    if (cached) {
      return { ...entry, translated: cached, skip: true };
    }

    return { ...entry, safeText, cacheKey, skip: false };
  });

  const toTranslate = cachedOrPending.filter((item) => !item.skip);

  if (toTranslate.length > 0) {
    try {
      const translatedValues = await batchTranslateWithLibreTranslate(
        toTranslate.map((item) => item.safeText),
        normalizedTarget
      );

      translatedValues.forEach((translatedText, idx) => {
        const item = toTranslate[idx];
        translationCache.set(item.cacheKey, translatedText);
        item.translated = translatedText;
      });
    } catch {
      // Fallback gracefully to original text when API fails.
      toTranslate.forEach((item) => {
        item.translated = item.original;
      });
    }
  }

  const output = new Array(prepared.length);
  cachedOrPending.forEach((item) => {
    output[item.index] = item.translated ?? item.original;
  });

  return output;
};

module.exports = {
  translateBatch,
};
