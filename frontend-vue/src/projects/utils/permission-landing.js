export const LANDING_PATH_CANDIDATES = [
  '/graduation/questionnaire/form',
  '/graduation/register',
  '/dashboard',
  '/graduation-system-using-face-recognition/registry',
  '/operations/business',
  '/accounts/directory',
  '/security/permissions/menu',
  '/security/permissions/group',
  '/security/permissions/matrix',
  '/config/email-notifications'
]

export function resolveFirstAccessiblePath(canAccess, fallback = '/dashboard') {
  if (typeof canAccess !== 'function') return fallback
  const found = LANDING_PATH_CANDIDATES.find(path => canAccess(path, 'view'))
  return found || fallback
}
