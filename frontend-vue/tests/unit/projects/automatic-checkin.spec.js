import { matchFace, createConfirmationTracker } from '@/projects/utils/face-recognition'
import { shallowMount, createLocalVue } from '@vue/test-utils'
import VueI18n from 'vue-i18n'
import { en, th } from '@/store/lang/automatic-checkin'
jest.doMock('@/service/api', () => ({ graduateRegistrations: jest.fn() }))
const Scanner = require('@/projects/views/graduation/GraduateAutoCheckIn').default
const Dashboard = require('@/projects/views/graduation/GraduateCheckInDashboard').default
const api = require('@/service/api')

const descriptor = value => new Float32Array(128).fill(value)
const alice = { row: { _id: 'alice', firstName: 'Alice' }, descriptor: descriptor(0) }
const bob = { row: { _id: 'bob' }, descriptor: descriptor(1) }

describe('continuous face check-in', () => {
  beforeEach(() => jest.clearAllMocks())

  it('switches scanner labels and the current status immediately without restarting the camera', async () => {
    const localVue = createLocalVue()
    localVue.use(VueI18n)
    const i18n = new VueI18n({ locale: 'en', messages: { en: { automaticCheckin: en }, th: { automaticCheckin: th } } })
    const start = jest.fn()
    const wrapper = shallowMount(Scanner, {
      localVue, i18n, mocks: { $route: { query: {} } },
      stubs: ['router-link'], methods: { start }
    })
    wrapper.setData({ running: true, message: 'checked' })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain(en.title)
    expect(wrapper.text()).toContain(en.checked)
    i18n.locale = 'th'
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain(th.title)
    expect(wrapper.text()).toContain(th.checked)
    expect(wrapper.vm.running).toBe(true)
    expect(start).toHaveBeenCalledTimes(1)
    wrapper.destroy()
  })

  it('matches enrolled faces and rejects unknown, ambiguous and invalid inputs', () => {
    expect(matchFace(descriptor(0.01), [alice, bob]).row._id).toBe('alice')
    expect(matchFace(descriptor(0.5), [alice, bob])).toBeNull()
    expect(matchFace(descriptor(0), [alice, { row: bob.row, descriptor: descriptor(0.001) }])).toBeNull()
    expect(matchFace(descriptor(NaN), [alice])).toBeNull()
    expect(matchFace([], [alice])).toBeNull()
    expect(matchFace(descriptor(0), [])).toBeNull()
  })

  it('requires consecutive recognition and resets when a face leaves or observations expire', () => {
    const tracker = createConfirmationTracker()
    expect(tracker.observe([alice], 1000)).toHaveLength(0)
    expect(tracker.observe([alice], 1500)).toHaveLength(1)
    tracker.observe([], 1600)
    expect(tracker.observe([alice], 1700)).toHaveLength(0)
    expect(tracker.observe([alice], 5000)).toHaveLength(0)
    tracker.clear()
    expect(tracker.observe([bob], 5500)).toHaveLength(0)
  })

  function context () {
    return { activeMode: 'rehearsal', runId: 1, checked: new Set(), retryAfter: new Map(), recent: [], running: true }
  }

  it('records different passers without stopping the camera and suppresses repeated writes', async () => {
    api.graduateRegistrations.mockResolvedValue({ data: { data: { latestCheckIns: { rehearsal: { capturedAt: '2026-09-13T10:00:00Z' } } } } })
    const ctx = context()
    await Scanner.methods.recordMatch.call(ctx, { row: alice.row, distance: 0.2 }, 1)
    await Scanner.methods.recordMatch.call(ctx, { row: alice.row, distance: 0.2 }, 1)
    await Scanner.methods.recordMatch.call(ctx, { row: bob.row, distance: 0.2 }, 1)
    expect(api.graduateRegistrations).toHaveBeenCalledTimes(2)
    expect(ctx.checkedCount).toBe(2)
    expect(ctx.running).toBe(true)
    expect(ctx.recent).toHaveLength(2)
  })

  it('does not report success on a failed write and permits retry', async () => {
    api.graduateRegistrations.mockRejectedValueOnce(new Error('offline'))
    const ctx = context()
    await Scanner.methods.recordMatch.call(ctx, { row: alice.row, distance: 0.2 }, 1)
    expect(ctx.checked.size).toBe(0)
    expect(ctx.recent).toHaveLength(0)
    expect(ctx.error).toBeTruthy()
    expect(ctx.retryAfter.get('rehearsal:alice')).toBeGreaterThan(Date.now())
    ctx.retryAfter.clear()
    api.graduateRegistrations.mockResolvedValueOnce({ data: { data: { latestCheckIns: { rehearsal: { capturedAt: new Date().toISOString() } } } } })
    await Scanner.methods.recordMatch.call(ctx, { row: alice.row, distance: 0.2 }, 1)
    expect(ctx.checked.size).toBe(1)
  })

  it('keeps rehearsal and ceremony check-ins separate', async () => {
    const ctx = context()
    ctx.checked.add('rehearsal:alice')
    ctx.activeMode = 'ceremony'
    api.graduateRegistrations.mockResolvedValue({ data: { data: { latestCheckIns: { ceremony: { capturedAt: new Date().toISOString() } } } } })
    await Scanner.methods.recordMatch.call(ctx, { row: alice.row, distance: 0.2 }, 1)
    expect(api.graduateRegistrations).toHaveBeenCalledWith('check-in', { _id: 'alice', checkInMode: 'ceremony', distance: 0.2 })
  })

  it('stops media tracks and invalidates pending recognition when leaving', () => {
    const track = { stop: jest.fn() }
    const ctx = { runId: 1, stream: { getTracks: () => [track] }, $refs: { video: { srcObject: {} } }, tracker: { clear: jest.fn() } }
    Scanner.methods.stop.call(ctx)
    expect(track.stop).toHaveBeenCalled()
    expect(ctx.runId).toBe(2)
    expect(ctx.$refs.video.srcObject).toBeNull()
    expect(ctx.running).toBe(false)
  })

  it('loads all attendance pages without downloading photos and retains results on refresh failure', async () => {
    const ctx = { loading: false, fetching: false, registrations: [], $t: key => key }
    api.graduateRegistrations.mockResolvedValueOnce({ data: { data: { rows: [alice.row], hasMore: true } } })
      .mockResolvedValueOnce({ data: { data: { rows: [bob.row], hasMore: false } } })
    await Dashboard.methods.fetchRegistrations.call(ctx)
    expect(ctx.registrations).toEqual([alice.row, bob.row])
    expect(api.graduateRegistrations).toHaveBeenLastCalledWith('list', { page: 2, limit: 4000, includePhotos: false, sortBy: 'attendance' })
    api.graduateRegistrations.mockRejectedValueOnce(new Error('offline'))
    await Dashboard.methods.fetchRegistrations.call(ctx, true)
    expect(ctx.registrations).toHaveLength(2)
    expect(ctx.fetching).toBe(false)
    expect(ctx.errorMessage).toBeTruthy()
  })
})


describe('recent check-in pagination', () => {
  it('retains 3000 receipts and renders only one page, keeping history stable during arrivals', async () => {
    const wrapper = shallowMount(Scanner, {
      mocks: { $route: { query: {} }, $i18n: { locale: 'en' }, $t: key => key },
      stubs: ['router-link'], methods: { start: jest.fn() }
    })
    api.graduateRegistrations.mockResolvedValue({ data: { data: { latestCheckIns: { rehearsal: { capturedAt: '2026-09-21T10:00:00Z' } } } } })
    for (let i = 0; i < 3000; i++) {
      await wrapper.vm.recordMatch({ row: { _id: String(i), firstName: 'Graduate ' + i }, distance: 0.2 }, 0)
    }
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.recent).toHaveLength(3000)
    expect(wrapper.findAll('.recent-person').length).toBe(5)
    expect(wrapper.vm.recentPageCount).toBe(600)
    expect(wrapper.vm.pagedRecent[0].name).toBe('Graduate 2999')
    wrapper.vm.changeRecentPage(600)
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.pagedRecent[4].name).toBe('Graduate 0')
    const keys = wrapper.vm.pagedRecent.map(item => item.key)
    await wrapper.vm.recordMatch({ row: { _id: 'new', firstName: 'New arrival' }, distance: 0.2 }, 0)
    expect(wrapper.vm.pagedRecent.map(item => item.key)).toEqual(keys)
    wrapper.vm.changeRecentPage(1)
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.pagedRecent[0].name).toBe('New arrival')
    expect(wrapper.vm.recentPageCount).toBe(601)
    wrapper.destroy()
  })
})

describe('persisted dashboard attendance', () => {
  it('reloads saved attendance after reopening and replaces the same graduate with the latest scan', async () => {
    window.localStorage.clear()
    let capturedAt = '2026-09-01T10:00:00Z'
    api.graduateRegistrations.mockImplementation(async () => ({ data: { data: { rows: [{
      _id: 'alice', firstName: 'Alice', latestCheckIns: {
        rehearsal: { capturedAt: '2026-08-01T10:00:00Z' }, ceremony: { capturedAt }
      }
    }], hasMore: false } } }))
    const mount = () => shallowMount(Dashboard, {
      mocks: { $i18n: { locale: 'en' }, $t: key => key }, stubs: ['CInput', 'CIcon']
    })
    let wrapper = mount()
    await wrapper.vm.$nextTick()
    await wrapper.setData({ activeMode: 'ceremony' })
    expect(wrapper.vm.scannedRegistrations).toHaveLength(1)
    wrapper.destroy()
    wrapper = mount()
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.activeMode).toBe('ceremony')
    expect(wrapper.vm.latestCheckIn(wrapper.vm.scannedRegistrations[0]).capturedAt).toBe(capturedAt)
    capturedAt = '2026-09-23T10:00:00Z'
    await wrapper.vm.fetchRegistrations(true)
    expect(wrapper.vm.scannedRegistrations).toHaveLength(1)
    expect(wrapper.vm.latestCheckIn(wrapper.vm.scannedRegistrations[0]).capturedAt).toBe(capturedAt)
    await wrapper.setData({ activeMode: 'rehearsal' })
    expect(wrapper.vm.latestCheckIn(wrapper.vm.scannedRegistrations[0]).capturedAt).toBe('2026-08-01T10:00:00Z')
    wrapper.destroy()
    window.localStorage.clear()
  })
})

describe('recent graduates without duplicate people', () => {
  it('shows only the latest receipt across modes and counts each graduate once', async () => {
    const ctx = { activeMode: 'rehearsal', runId: 1, checked: new Set(), retryAfter: new Map(), recent: [], recentPage: 1 }
    const save = async (mode, capturedAt) => {
      ctx.activeMode = mode
      api.graduateRegistrations.mockResolvedValueOnce({ data: { data: { latestCheckIns: { [mode]: { capturedAt } } } } })
      await Scanner.methods.recordMatch.call(ctx, { row: alice.row, distance: 0.2 }, 1)
    }
    await save('rehearsal', '2026-09-23T10:00:00Z')
    await save('ceremony', '2026-09-23T11:00:00Z')
    expect(ctx.recent).toHaveLength(1)
    expect(ctx.checkedCount).toBe(1)
    expect(ctx.recent[0]).toMatchObject({ key: 'alice', mode: 'ceremony', capturedAt: '2026-09-23T11:00:00Z' })
    ctx.checked.clear()
    ctx.recentPage = 2
    await save('rehearsal', '2026-09-23T12:00:00Z')
    expect(ctx.recent).toHaveLength(1)
    expect(ctx.recent[0].capturedAt).toBe('2026-09-23T12:00:00Z')
    expect(ctx.recentPage).toBe(2)
    ctx.checked.clear()
    await save('ceremony', '2026-09-23T11:00:00Z')
    expect(ctx.recent[0].capturedAt).toBe('2026-09-23T12:00:00Z')
  })
})
