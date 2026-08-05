const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value) {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed || !EMAIL_REGEX.test(trimmed)) return null;

  return trimmed.toLowerCase();
}

function getContractNotificationRecipients(users = [], fallbackEmails = []) {
  const recipients = new Set();

  (users || []).forEach((user) => {
    const email = normalizeEmail(user?.email);
    const role = user?.role;
    const status = user?.status;

    const isEligibleRecipient =
      (role === 'lawyer' && status === 'approved') ||
      (role === 'admin' && status === 'approved');

    if (email && isEligibleRecipient) {
      recipients.add(email);
    }
  });

  (fallbackEmails || []).forEach((email) => {
    const normalizedEmail = normalizeEmail(email);
    if (normalizedEmail) {
      recipients.add(normalizedEmail);
    }
  });

  return Array.from(recipients);
}

module.exports = {
  getContractNotificationRecipients,
  normalizeEmail,
};
