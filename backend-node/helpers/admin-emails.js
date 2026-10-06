'use strict';

const ADMIN_EMAILS = new Set([
  '6631501031@lamduan.mfu.ac.th',
  '6631501033@lamduan.mfu.ac.th',
  '6631502042@lamduan.mfu.ac.th',
  '6631501015@lamduan.mfu.ac.th',
  '6631501034@lamduan.mfu.ac.th',
  '6631501057@lamduan.mfu.ac.th'
]);

function isAllowedAdminEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  const parts = normalized.split('@');

  if (parts.length !== 2 || !parts[0]) {
    return false;
  }

  return ADMIN_EMAILS.has(normalized) ||
    parts[1] === 'mfu.ac.th';
}

module.exports = { isAllowedAdminEmail };