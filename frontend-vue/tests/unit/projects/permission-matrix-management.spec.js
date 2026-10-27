jest.doMock('@/service/api', () => ({ security: jest.fn() }))
jest.doMock('@/projects/utils/notify', () => ({ notifyError: jest.fn(), notifySuccess: jest.fn() }))

const { shallowMount } = require('@vue/test-utils')
const Service = require('@/service/api')
const PermissionMatrix = require('@/projects/views/security/PermissionMatrix.vue').default

const accountRows = [
  { _id: 'account-1', email: 'one@example.test', label: 'First Admin', initial: 'O', code: 'A1' },
  { _id: 'account-2', email: 'two@example.test', label: 'Second Admin', initial: 'T', code: 'A2' }
]
const groupRows = [
  { _id: 'group-1', title: [{ key: 'en', value: 'Administrators' }], visibleTypeName: 'Staff' },
  { _id: 'group-2', title: [{ key: 'en', value: 'Operations' }], visibleTypeName: 'Staff' }
]
const menuRows = [{ _id: 'menu-1', title: [{ key: 'en', value: 'Registration' }], path: '/graduation/registrations', state: true }]
const assignmentRows = [
  { _id: 'assignment-1', accountId: 'account-1', groupId: 'group-1', dataScope: 'self', active: true },
  { _id: 'assignment-3', accountId: 'account-1', groupId: 'group-2', dataScope: 'unit', active: true },
  { _id: 'assignment-2', accountId: 'account-2', groupId: 'group-1', dataScope: 'unit', active: false }
]
const permissionRows = [{ _id: 'permission-1', groupId: 'group-1', menuId: 'menu-1', view: true, edit: false, delete: false, action: false }]

function mountPage () {
  const wrapper = shallowMount(PermissionMatrix, {
    mocks: {
      $store: {
        getters: {
          'security/assignment/assignments': assignmentRows,
          'security/assignment/groups': groupRows,
          'security/assignment/accounts': accountRows,
          'security/permissionMatrix/menus': menuRows,
          'security/permissionMatrix/permissions': permissionRows
        },
        dispatch: jest.fn().mockResolvedValue(true)
      },
      $t: key => key,
      $i18n: { locale: 'en' }
    },
    methods: { canEditPath: () => true },
    stubs: ['CCard', 'CCardBody']
  })
  return wrapper
}

beforeEach(() => {
  Service.security.mockReset().mockResolvedValue({ data: { data: [] } })
})

it('shows enabled and disabled account counts and filters users by access state', async () => {
  const wrapper = mountPage()
  await wrapper.vm.loadData()

  expect(wrapper.vm.stats.map(item => item.value)).toEqual([2, 1, 1, 2])
  wrapper.vm.activeTab = 'disabled'
  expect(wrapper.vm.filteredUsers.map(item => item._id)).toEqual(['account-2'])
  wrapper.destroy()
})

it('edits the selected group matrix and persists only changed permissions after acknowledgement', async () => {
  const wrapper = mountPage()
  await wrapper.vm.loadData()

  expect(wrapper.vm.selectedAccountId).toBe('account-1')
  expect(wrapper.vm.permissionDirty).toBe(false)
  wrapper.vm.setPermission('menu-1', 'edit', true)
  expect(wrapper.vm.permissionDirty).toBe(true)
  expect(wrapper.vm.canSave).toBe(false)

  wrapper.vm.acknowledgeGroupChanges = true
  expect(wrapper.vm.canSave).toBe(true)
  await wrapper.vm.saveChanges()

  expect(Service.security).toHaveBeenCalledWith('update-permission-batch', {
    items: [expect.objectContaining({ _id: 'permission-1', group: 'group-1', menu: 'menu-1', view: true, edit: true })]
  })
  wrapper.destroy()
})

it('disables every active group assignment for the selected account when access is turned off', async () => {
  const wrapper = mountPage()
  await wrapper.vm.loadData()
  wrapper.vm.draftAccess = false

  expect(wrapper.vm.canSave).toBe(true)
  await wrapper.vm.saveChanges()

  const updates = wrapper.vm.$store.dispatch.mock.calls.filter(call => call[0] === 'security/assignment/update')
  expect(updates).toHaveLength(2)
  expect(updates.map(call => call[1])).toEqual(expect.arrayContaining([
    expect.objectContaining({ _id: 'assignment-1', active: false }),
    expect.objectContaining({ _id: 'assignment-3', active: false })
  ]))
  wrapper.destroy()
})
