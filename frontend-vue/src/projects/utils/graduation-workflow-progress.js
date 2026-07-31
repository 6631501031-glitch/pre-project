const STORAGE_PREFIX = 'graduation-workflow-progress'
export const WORKFLOW_PROGRESS_EVENT = 'graduation-workflow-progress-updated'

function textValue (value) {
  return String(value == null ? '' : value).trim()
}

function profileIdentity (profile) {
  const source = profile && typeof profile === 'object' ? profile : {}
  const userinfo = source.userinfo && typeof source.userinfo === 'object' ? source.userinfo : {}
  const authen = Array.isArray(source.authen) ? source.authen : []
  const candidates = [
    source.studentCode, source.barcodeValue, userinfo.studentCode, userinfo.barcodeValue,
    source.email, userinfo.email, source.username,
    ...authen.reduce((values, item) => values.concat(item && item.email, item && item.username), [])
  ]
  return candidates.map(textValue).find(Boolean) || 'anonymous'
}

function storageKey (profile) {
  return `${STORAGE_PREFIX}:${encodeURIComponent(profileIdentity(profile).toLowerCase())}`
}

export function getGraduationProgress (profile) {
  if (typeof window === 'undefined' || !window.localStorage) return {}
  try {
    return JSON.parse(window.localStorage.getItem(storageKey(profile)) || '{}')
  } catch (error) {
    return {}
  }
}

export function markGraduationStep (profile, step, details = {}) {
  if (typeof window === 'undefined' || !window.localStorage) return
  const progress = Object.assign({}, getGraduationProgress(profile), details, {
    [step]: true,
    updatedAt: new Date().toISOString()
  })
  window.localStorage.setItem(storageKey(profile), JSON.stringify(progress))
  window.dispatchEvent(new CustomEvent(WORKFLOW_PROGRESS_EVENT, { detail: progress }))
}

export function isFaceRegistrationEnabled (progress) {
  const ceremonyStatus = textValue(progress && progress.ceremonyStatus)
  return !!(progress && progress.registrationSaved && progress.questionnaireSaved && progress.ceremonySaved &&
    ['10', '20', '30', '40'].includes(ceremonyStatus))
}
