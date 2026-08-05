const test = require('node:test');
const assert = require('node:assert/strict');
const { getContractNotificationRecipients } = require('../services/notificationRecipients');

test('getContractNotificationRecipients includes approved lawyers and admins with valid emails', () => {
  const users = [
    { email: 'lawyer1@example.com', role: 'lawyer', status: 'approved' },
    { email: 'lawyer2@example.com', role: 'lawyer', status: 'pending' },
    { email: 'admin@example.com', role: 'admin', status: 'approved' },
    { email: 'rejected@example.com', role: 'lawyer', status: 'rejected' },
    { email: 'invalid', role: 'lawyer', status: 'approved' },
    { email: '', role: 'admin', status: 'approved' },
    { email: 'regular@example.com', role: 'regular', status: 'approved' },
  ];

  const recipients = getContractNotificationRecipients(users, ['Fallback@Example.com', 'invalid']);

  assert.deepEqual(recipients, [
    'lawyer1@example.com',
    'admin@example.com',
    'fallback@example.com',
  ]);
});
