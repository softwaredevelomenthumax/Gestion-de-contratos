const express = require('express');
const auth = require('../middleware/auth');
const { translateBatch } = require('../services/translationService');

const router = express.Router();

router.post('/batch', auth, async (req, res) => {
  try {
    const { texts, target } = req.body || {};

    if (!Array.isArray(texts)) {
      return res.status(400).json({ success: false, error: 'texts must be an array' });
    }

    if (texts.length > 1000) {
      return res.status(400).json({ success: false, error: 'Too many texts in one request' });
    }

    const translated = await translateBatch({ texts, target: target || 'en' });

    return res.json({
      success: true,
      translated,
      target: target || 'en'
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Translation error' });
  }
});

module.exports = router;
