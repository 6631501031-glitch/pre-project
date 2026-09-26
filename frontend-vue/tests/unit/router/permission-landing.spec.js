const DEFAULT_PATH = '/graduation/questionnaire/form'
const LEGACY_DASHBOARD_PATH = '/dashboard'
const ALTERNATE_PATH = '/graduation-system-using-face-recognition/registry'

function loadRouter(canAccessImpl, loaded = true) {
  jest.resetModules()

  const storeMock = {
    state: { XAccessToken: 'token-1' },
    getters: {
      'auth/authenticated': { isAuthen: true },
      'auth/profile': { studentCode: '6031500000' },
      'security/loaded': loaded,
      'security/canAccess': canAccessImpl || jest.fn(() => false),
      'security/landingPath': ''
    },
    dispatch: jest.fn(() => Promise.resolve()),
    commit: jest.fn()
  }

  jest.doMock('@/store/store', () => ({
    __esModule: true,
    default: storeMock
  }))

  const router = require('@/router/index').default
  return { router, storeMock }
}

describe('router permission landing', () => {
  it('opens the login page from the website root', () => {
    const { router } = loadRouter()

    expect(router.resolve('/').route.path).toBe('/pages/login')
  })

  it('keeps the login page visible with an existing staff session', async () => {
    const { router, storeMock } = loadRouter(jest.fn(() => false))
    storeMock.getters['auth/profile'] = { email: 'admin@mfu.ac.th' }
    const next = jest.fn()

    await router.beforeHooks[0]({ path: '/pages/login', meta: {} }, { path: '/' }, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('redirects the old staff dashboard URL to the graduate registration page', async () => {
    const { router, storeMock } = loadRouter(jest.fn(() => true))
    storeMock.getters['auth/profile'] = { email: 'admin@mfu.ac.th' }
    const next = jest.fn()

    await router.beforeHooks[0]({ path: LEGACY_DASHBOARD_PATH, meta: {} }, { path: '/' }, next)

    expect(next).toHaveBeenCalledWith({ path: '/graduation/registrations' })
  })

  it('keeps the login page visible with an existing student session', async () => {
    const canAccess = jest.fn((path, action) => path === ALTERNATE_PATH && action === 'view')
    const { router } = loadRouter(canAccess)
    const next = jest.fn()

    await router.beforeHooks[0]({ path: '/pages/login', meta: {} }, { path: '/' }, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('requires login before opening the questionnaire without a session', async () => {
    const { router, storeMock } = loadRouter()
    storeMock.state.XAccessToken = ''
    storeMock.getters['auth/authenticated'] = { isAuthen: false }
    const next = jest.fn()

    await router.beforeHooks[0]({ path: DEFAULT_PATH, meta: {} }, { path: '/' }, next)

    expect(next).toHaveBeenCalledWith({ path: '/pages/login' })
  })

  it('redirects denied default landing to another accessible path', async () => {
    const canAccess = jest.fn((path, action) => path === ALTERNATE_PATH && action === 'view')
    const { router } = loadRouter(canAccess)
    const next = jest.fn()

    await router.beforeHooks[0](
      { path: DEFAULT_PATH, meta: { permission: { path: DEFAULT_PATH, action: 'view' } } },
      { path: '/pages/login' },
      next
    )

    expect(next).toHaveBeenCalledWith({ path: ALTERNATE_PATH })
  })

  it('uses 403 for denied non-default routes', async () => {
    const canAccess = jest.fn((path, action) => path === ALTERNATE_PATH && action === 'view')
    const { router } = loadRouter(canAccess)
    const next = jest.fn()

    await router.beforeHooks[0](
      { path: '/accounts/directory', meta: { permission: { path: '/accounts/directory', action: 'view' } } },
      { path: DEFAULT_PATH },
      next
    )

    expect(next).toHaveBeenCalledWith({ path: '/pages/403' })
  })
})

it('redirects a student from the legacy dashboard to their registration form', async () => {
  const { router } = loadRouter(jest.fn(() => false))
  const next = jest.fn()
  await router.beforeHooks[0](
    { path: '/dashboard', meta: { permission: { path: '/dashboard', action: 'view' } } },
    { path: '/pages/login' },
    next
  )
  expect(next).toHaveBeenCalledWith({ path: '/graduation/register' })
})

it('shows the student registration menu without a legacy menu permission', () => {
  const buildNav = require('@/containers/_nav').default
  const Sidebar = require('@/containers/TheSidebar.vue').default
  const context = { isStudentLogin: true, permissionLoaded: true, $store: { getters: { 'security/matrix': {} }, state: { XAccessToken: 'token' } } }
  Object.entries(Sidebar.methods).forEach(([name, method]) => { context[name] = method.bind(context) })
  const nav = context.filterNavTree(buildNav(key => key))
  expect(nav[0]._children.map(item => item.to)).toContain('/graduation/register')
  expect(nav[0]._children.map(item => item.to)).not.toContain('/graduation/registrations')
})