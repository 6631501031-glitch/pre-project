import { shallowMount } from '@vue/test-utils'
import { CSelect } from '@coreui/vue-pro'
jest.doMock('@/service/api', () => ({ graduateRegistrations: jest.fn() }))
jest.doMock('@/projects/utils/notify', () => ({ notifySuccess: jest.fn(), notifyError: jest.fn() }))
const Editor = require('@/projects/views/graduation/GraduateCeremonyPreferences.vue').default
const api = require('@/service/api')
it('uses the shared editor to load, change and save the selected graduate', async () => {
  const row = { _id: 'graduate-id', ceremonyStatus: '20', ceremonyAssistanceType: '21', ceremonyStatusNote: 'Existing note', hasFoodAllergy: 'no' }
  const wrapper = shallowMount(Editor, { propsData: { adminMode: true, registrationData: row }, mocks: { $t: key => key }, stubs: { CSelect, CRow: true, CCol: true, CInput: true, CSpinner: true, CCard: { template: '<div><slot /></div>' }, CCardBody: { template: '<div><slot /></div>' }, CTextarea: true, CButton: true, CIcon: true } })
  await wrapper.vm.$nextTick()
  expect(api.graduateRegistrations).not.toHaveBeenCalled()
  const assistance = wrapper.findAll(CSelect).wrappers.find(select => select.props('value') === '21')
  assistance.vm.$emit('update:value', '22')
  await wrapper.vm.$nextTick()
  expect(wrapper.vm.form.ceremonyAssistanceType).toBe('22')
  expect(wrapper.vm.showsExtraDetail).toBe(true)
  api.graduateRegistrations.mockResolvedValue({ data: { data: { ...row, ceremonyAssistanceType: '22' } } })
  await wrapper.vm.save()
  expect(api.graduateRegistrations).toHaveBeenCalledWith('update-admin-details', expect.objectContaining({ _id: 'graduate-id', ceremonyAssistanceType: '22', ceremonyStatusNote: 'Existing note' }))
  expect(wrapper.emitted().saved[0][0].ceremonyAssistanceType).toBe('22')
  wrapper.destroy()
})


it('uses backend totals for cards instead of the ten visible rows', () => {
  const Admin = require('@/projects/views/graduation/GraduateRegistrationAdmin.vue').default
  const context = { registrations: Array.from({ length: 10 }, () => ({ ceremonyStatus: '10' })), registrationSummary: { total: 3000, responded: 2500, foodAllergy: 123 }, $t: key => key }
  const cards = Admin.computed.statCards.call(context)
  expect(cards.find(card => card.key === 'food-allergy').displayValue).toBe('123')
  expect(cards.find(card => card.key === 'total').displayValue).toBe((3000).toLocaleString())
  expect(cards.find(card => card.key === 'responded').displayValue).toBe((2500).toLocaleString())
  expect(cards.find(card => card.key === 'responded').hint).toBe('83.33%')
})

it('edits names and contact details while leaving hidden address and questionnaire data untouched', async () => {
  api.graduateRegistrations.mockClear()
  const row = { _id: 'graduate-id', firstName: 'Original', ceremonyStatus: '30', hasFoodAllergy: 'no', homeAddress: { houseNo: '1' }, facePhoto: 'private-photo', latestCheckIns: { ceremony: { capturedAt: '2026-09-23' } } }
  const wrapper = shallowMount(Editor, { propsData: { adminMode: true, registrationData: row }, mocks: { $t: key => key }, stubs: ['CSpinner', 'CRow', 'CCol', 'CInput', 'CSelect', 'CCard', 'CCardBody', 'CTextarea', 'CButton', 'CIcon'] })
  await wrapper.vm.$nextTick()
  expect(wrapper.vm.adminFields.map(field => field.key)).toEqual(expect.arrayContaining(['firstName', 'lastName', 'email', 'school', 'program']))
  wrapper.vm.form.firstName = 'Updated'
  expect(wrapper.vm.form.homeAddress).toBeUndefined()
  wrapper.vm.form.email = 'ignored@example.com'
  wrapper.vm.form.questionnaireEmploymentStatus = 'employed'
  expect(row.firstName).toBe('Original')
  expect(row.homeAddress.houseNo).toBe('1')
  api.graduateRegistrations.mockResolvedValue({ data: { data: { ...row, firstName: 'Updated' } } })
  await wrapper.vm.save()
  const payload = api.graduateRegistrations.mock.calls[0][1]
  expect(payload.firstName).toBe('Updated')
  expect(payload.homeAddress).toBeUndefined()
  expect(payload.currentAddress).toBeUndefined()
  expect(payload.questionnaireEmploymentStatus).toBeUndefined()
  expect(payload.email).toBe('ignored@example.com')
  expect(payload.facePhoto).toBeUndefined()
  expect(payload.latestCheckIns).toBeUndefined()
  expect(wrapper.emitted().saved[0][0].firstName).toBe('Updated')
  wrapper.destroy()
})

it.each(['10', '20', '30', '40', '50', '60', '70', '80'])('allows editing registration fields for ceremony status %s', async ceremonyStatus => {
  api.graduateRegistrations.mockClear()
  const row = { _id: 'graduate-id', firstName: 'Original', ceremonyStatus, ceremonyAssistanceType: '21', certificateDeliveryMethod: 'self', hasFoodAllergy: 'no' }
  const wrapper = shallowMount(Editor, { propsData: { adminMode: true, registrationData: row }, mocks: { $t: key => key }, stubs: ['CSpinner', 'CRow', 'CCol', 'CInput', 'CSelect', 'CCard', 'CCardBody', 'CTextarea', 'CButton', 'CIcon'] })
  await wrapper.vm.$nextTick()
  wrapper.vm.form.firstName = 'Edited'
  api.graduateRegistrations.mockResolvedValue({ data: { data: { ...row, firstName: 'Edited' } } })
  await wrapper.vm.save()
  expect(api.graduateRegistrations).toHaveBeenCalledWith('update-admin-details', expect.objectContaining({ firstName: 'Edited', ceremonyStatus }))
  wrapper.destroy()
})

it('shows saved admin contact and academic details on the user registration page', () => {
  const User = require('@/projects/views/graduation/GraduateSelfRegistration.vue').default
  const ctx = {
    form: { phone: 'old', email: 'old@example.com', school: 'old', program: 'old' }, lockedFields: {},
    $set: (obj, key, value) => { obj[key] = value }, $delete: (obj, key) => { delete obj[key] },
    syncPhonePartsFromPhone: jest.fn()
  }
  User.methods.applyDefaults.call(ctx, { firstName: 'Updated', lastName: 'Name', phone: '0812345678', email: 'updated@example.com', school: 'Updated school', schoolEnglish: 'Custom school', program: 'Updated program', programEnglish: 'Custom program' }, { source: 'registration' })
  expect(ctx.form).toMatchObject({ phone: '0812345678', email: 'updated@example.com', school: 'Updated school', program: 'Updated program' })
  User.methods.applyFixedGraduateName.call(ctx)
  expect(ctx.form.firstName).toBe('Updated')
  ctx.findCatalogSchool = () => ({ schoolEnglish: 'Old catalog school' })
  ctx.findCatalogProgram = () => ({ programEnglish: 'Old catalog program' })
  User.methods.syncCatalogLanguageFields.call(ctx)
  expect(ctx.form.schoolEnglish).toBe('Custom school')
  expect(User.computed.summaryProgram.call({ ...ctx, isEnglishLocale: true })).toBe('Custom program')
})

it('opens the allergy list when the actual CoreUI card is clicked', async () => {
  const { CCard, CCardBody, CRow, CCol } = require('@coreui/vue-pro')
  const Admin = require('@/projects/views/graduation/GraduateRegistrationAdmin.vue').default
  api.graduateRegistrations.mockResolvedValue({ data: { data: { rows: [{ _id: 'allergy-person', firstName: 'Test', lastName: 'Graduate', foodAllergyNote: 'Shrimp' }], total: 1 } } })
  const wrapper = shallowMount(Admin, {
    mocks: { $t: key => key, $i18n: { locale: 'en' } },
    methods: { fetchRegistrations: jest.fn(), fetchFilterSourceRegistrations: jest.fn() },
    stubs: { CCard, CCardBody, CRow, CCol, CModal: true, CButton: true, CIcon: true, CInput: true, CSelect: true }
  })
  await wrapper.find('.allergy-card-button').trigger('click')
  await wrapper.vm.$nextTick()
  expect(wrapper.vm.allergyVisible).toBe(true)
  expect(api.graduateRegistrations).toHaveBeenCalledWith('list', { foodAllergy: true, page: 1, limit: 10, includePhotos: false })
  expect(wrapper.vm.allergyRows[0].foodAllergyNote).toBe('Shrimp')
  wrapper.vm.allergyVisible = false
  await wrapper.find('.allergy-card-button').trigger('keydown', { key: 'Enter', keyCode: 13 })
  expect(wrapper.vm.allergyVisible).toBe(true)
  wrapper.destroy()
})

it('searches with the selected status and a numeric first page', async () => {
  const { mount } = require('@vue/test-utils')
  const { CCard, CCardBody, CRow, CCol, CSelect, CButton } = require('@coreui/vue-pro')
  const Admin = require('@/projects/views/graduation/GraduateRegistrationAdmin.vue').default
  api.graduateRegistrations.mockResolvedValue({ data: { data: { rows: [], total: 0, summary: { total: 0, responded: 0, foodAllergy: 0 }, page: 1 } } })
  const wrapper = mount(Admin, {
    mocks: { $t: key => key, $i18n: { locale: 'en' } },
    methods: { fetchFilterSourceRegistrations: jest.fn() },
    stubs: { CCard, CCardBody, CRow, CCol, CSelect, CButton, CModal: true, CIcon: true, CInput: true }
  })
  await wrapper.vm.$nextTick()
  await wrapper.find('.graduate-admin-status select').setValue('10')
  expect(wrapper.vm.filters.ceremonyStatus).toBe('10')
  api.graduateRegistrations.mockClear()
  const search = wrapper.findAll('button').wrappers.find(button => button.text().includes('graduation.admin.actions.search'))
  await search.trigger('click')
  expect(api.graduateRegistrations).toHaveBeenCalledWith('list', expect.objectContaining({ ceremonyStatus: '10', page: 1, school: 'all', program: 'all' }))
  wrapper.destroy()
})
