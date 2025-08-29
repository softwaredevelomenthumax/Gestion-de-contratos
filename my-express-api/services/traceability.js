const ContractHistory = require('../models/ContractHistory');

async function recordHistory(entry) {
  try {
    // entry: { contractId, userId, role, action, oldStatus, newStatus, comment, fileId }
    if (!entry || !entry.contractId || !entry.userId || !entry.role || !entry.action) {
      return; // Fail-safe: do not throw to avoid breaking primary flows
    }
    const payload = {
      contractId: entry.contractId,
      userId: entry.userId,
      role: entry.role,
      action: entry.action,
      oldStatus: entry.oldStatus ?? null,
      newStatus: entry.newStatus ?? null,
      comment: entry.comment ?? null,
      fileId: entry.fileId ?? null,
      timestamp: new Date(),
    };
    await ContractHistory.create(payload);
  } catch (err) {
    // Silent catch to avoid affecting the request lifecycle
    console.error('traceability.recordHistory error:', err.message);
  }
}

module.exports = { recordHistory };


