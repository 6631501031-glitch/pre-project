<template>
  <div class="graduate-admin-page">
    <div class="graduate-admin-header">
      <div>
        <div class="graduate-admin-header__eyebrow">{{ $t('graduation.admin.eyebrow') }}</div>
        <h1>{{ $t('graduation.admin.title') }}</h1>
        <p>{{ $t('graduation.admin.subtitle') }}</p>
      </div>
      <div class="graduate-admin-header__actions">
        <CButton color="primary" variant="outline" :disabled="loading" @click="fetchRegistrations">
          <CIcon name="cil-reload" class="mr-2" />
          {{ $t('graduation.admin.actions.refresh') }}
        </CButton>
      </div>
    </div>

    <CRow class="graduate-admin-stats-row">
      <CCol v-for="item in statCards" :key="item.key" class="graduate-admin-stats-col">
        <CCard class="graduate-admin-card graduate-admin-stat">
          <CCardBody class="graduate-admin-stat__body">
            <div class="graduate-admin-stat__value">{{ item.value.toLocaleString() }}</div>
            <div class="graduate-admin-stat__content">
              <span v-if="item.code" class="graduate-admin-stat__code">{{ item.code }}</span>
              <div class="graduate-admin-stat__label">{{ item.label }}</div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>

    <CCard class="graduate-admin-card">
      <CCardBody>
        <div class="graduate-admin-toolbar">
          <CInput
            v-model.trim="filters.q"
            class="graduate-admin-search"
            :placeholder="$t('graduation.admin.searchPlaceholder')"
            @keyup.enter="fetchRegistrations"
            @input="scheduleSearch"
          />
          <CSelect
            v-model="filters.school"
            class="graduate-admin-school"
            :options="schoolFilterOptions"
            @input="onSchoolFilterChange"
            @change="onSchoolFilterChange"
          />
          <CSelect
            v-model="filters.program"
            class="graduate-admin-program"
            :options="programFilterOptions"
          />
          <CSelect
            v-model="filters.ceremonyStatus"
            class="graduate-admin-status"
            :options="localizedCeremonyStatusFilterOptions"
          />
          <CButton color="secondary" variant="outline" :disabled="loading" @click="clearFilters">{{ $t('graduation.admin.actions.clear') }}</CButton>
        </div>

        <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

        <div class="graduate-admin-table-wrap">
          <table class="graduate-admin-table">
            <thead>
              <tr>
                <th>{{ $t('graduation.admin.table.graduate') }}</th>
                <th>{{ $t('graduation.admin.table.schoolProgram') }}</th>
                <th>{{ $t('graduation.admin.table.ceremonyStatus') }}</th>
                <th>{{ $t('graduation.admin.table.assistanceType') }}</th>
                <th>{{ $t('graduation.admin.table.contact') }}</th>
                <th>{{ $t('graduation.admin.table.updatedAt') }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="7" class="graduate-admin-empty">{{ $t('graduation.admin.loading') }}</td>
              </tr>
              <tr v-else-if="!registrations.length">
                <td colspan="7" class="graduate-admin-empty">{{ $t('graduation.admin.empty') }}</td>
              </tr>
              <tr v-for="item in registrations" :key="item._id">
                <td>
                  <strong>{{ fullName(item) || '-' }}</strong>
                  <span>{{ pronunciationLabel(item) }}</span>
                  <small>{{ item.studentCode || item.barcodeValue || '-' }}</small>
                </td>
                <td>
                  <strong>{{ localizedSchool(item) || '-' }}</strong>
                  <span>{{ localizedProgram(item) || '-' }}</span>
                </td>
                <td>
                  {{ ceremonyStatusLabel(item.ceremonyStatus) }}
                </td>
                <td>{{ assistanceTypeLabel(item.ceremonyAssistanceType) }}</td>
                <td>
                  <strong>{{ item.phone || '-' }}</strong>
                  <span>{{ item.email || '-' }}</span>
                </td>
                <td>{{ formatDateTime(item.updatedAt || item.createdAt) }}</td>
                <td class="graduate-admin-row-actions">
                  <CButton size="sm" color="primary" variant="outline" @click="openDetails(item)">
                    รายละเอียด
                  </CButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CCardBody>
    </CCard>

    <CModal
      :show.sync="detailsVisible"
      size="lg"
      :title="$t('graduation.admin.detailsTitle')"
      color="primary"
    >
      <div v-if="selectedRegistration" class="graduate-admin-details">
        <div>
          <span>{{ $t('graduation.admin.details.fullName') }}</span>
          <strong>{{ fullName(selectedRegistration) || '-' }}</strong>
        </div>
        <div>
          <span>{{ $t('graduation.admin.details.schoolProgram') }}</span>
          <strong>{{ localizedSchool(selectedRegistration) || '-' }} / {{ localizedProgram(selectedRegistration) || '-' }}</strong>
        </div>
        <div>
          <span>{{ $t('graduation.admin.details.ceremonyStatus') }}</span>
          <CSelect
            v-if="detailsEditMode"
            v-model="detailsForm.ceremonyStatus"
            class="graduate-admin-details__select"
            :options="editableCeremonyStatusOptions"
          />
          <strong v-else>{{ ceremonyStatusLabel(selectedRegistration.ceremonyStatus) }}</strong>
        </div>
        <div>
          <span>{{ $t('graduation.admin.details.assistanceType') }}</span>
          <strong>{{ assistanceTypeLabel(selectedRegistration.ceremonyAssistanceType) }}</strong>
        </div>
        <div>
          <span>{{ $t('graduation.admin.details.extraDetail') }}</span>
          <strong>{{ selectedRegistration.ceremonyStatusNote || '-' }}</strong>
        </div>
        <div v-if="cleanStatusCode(selectedRegistration.ceremonyStatus) === '60'">
          <span>{{ $t('graduation.admin.details.certificateMethod') }}</span>
          <strong>{{ certificateDeliveryMethodLabel(selectedRegistration.certificateDeliveryMethod) }}</strong>
        </div>
        <div v-if="selectedRegistration.certificateDeliveryMethod === 'postal'">
          <span>{{ $t('graduation.admin.details.shippingService') }}</span>
          <strong>{{ certificateShippingServiceLabel(selectedRegistration.certificateShippingService) }}</strong>
        </div>
        <div v-if="selectedRegistration.certificateDeliveryMethod === 'postal'">
          <span>{{ $t('graduation.admin.details.certificateAddress') }}</span>
          <strong>{{ addressLabel(selectedRegistration.certificateDeliveryAddress) }}</strong>
        </div>
        <div>
          <span>{{ $t('graduation.admin.details.foodAllergy') }}</span>
          <strong>{{ hasFoodAllergy(selectedRegistration) ? $t('graduation.options.yes') : $t('graduation.options.no') }}</strong>
        </div>
        <div>
          <span>{{ $t('graduation.admin.details.foodAllergyNote') }}</span>
          <strong>{{ selectedRegistration.foodAllergyNote || '-' }}</strong>
        </div>
      </div>
      <template #footer>
        <div class="graduate-admin-modal-footer">
          <CButton
            v-if="!detailsEditMode"
            color="primary"
            variant="outline"
            class="graduate-admin-edit-button"
            @click="startDetailsEdit"
          >
            <CIcon name="cil-pencil" />
          </CButton>
          <CButton
            v-else
            color="success"
            variant="outline"
            :disabled="savingDetails"
            @click="saveDetailsEdit"
          >
            บันทึก
          </CButton>
          <CButton color="secondary" class="graduate-admin-close-button" @click="closeDetails">{{ $t('graduation.admin.actions.close') }}</CButton>
        </div>
      </template>
    </CModal>
  </div>
</template>

<script>
import api from '@/service/api'
import { notifyError, notifySuccess } from '@/projects/utils/notify'

const CEREMONY_STATUS_OPTIONS = [
  { value: '10', key: '10' },
  { value: '20', key: '20' },
  { value: '30', key: '30' },
  { value: '40', key: '40' },
  { value: '50', key: '50' },
  { value: '60', key: '60' },
  { value: '70', key: '70' }
]

const LEGACY_CEREMONY_STATUS_MAP = {
  1: '10',
  2: '50',
  3: '60'
}

const ASSISTANCE_TYPE_LABELS = {
  21: '21',
  22: '22',
  23: '23',
  24: '24'
}

function unwrap(response) {
  return response && response.data && response.data.data ? response.data.data : {}
}

function cleanCode(value) {
  if (Array.isArray(value)) {
    const preferred = value.find(item => item && item.value !== undefined) || value[0]
    return cleanCode(preferred && preferred.value !== undefined ? preferred.value : preferred)
  }
  if (value && typeof value === 'object') {
    if (value.target && value.target.value !== undefined) return cleanCode(value.target.value)
    if (value.value !== undefined) return cleanCode(value.value)
    if (value.label !== undefined) return cleanCode(value.label)
    if (value.name !== undefined) return cleanCode(value.name)
    if (value.title !== undefined) return cleanCode(value.title)
    return ''
  }
  const raw = String(value || '').trim()
  const code = raw.match(/\d+/)
  return code ? code[0] : raw
}

function normalizeCeremonyStatus(value) {
  const code = cleanCode(value)
  if (CEREMONY_STATUS_OPTIONS.some(item => item.value === code)) return code
  return LEGACY_CEREMONY_STATUS_MAP[code] || code
}

function cleanTextOption(value) {
  const normalized = String(value || '').trim()
  return normalized && normalized !== '-' ? normalized : ''
}

function uniqueLocalizedOptions(rows, valueKey, labelKey, isEnglish) {
  const map = new Map()
  ;(rows || []).forEach(item => {
    const value = cleanTextOption(item && item[valueKey])
    if (!value || map.has(value)) return
    const label = isEnglish ? cleanTextOption(item && item[labelKey]) || value : value
    map.set(value, label)
  })
  return Array.from(map.entries())
    .sort((left, right) => left[1].localeCompare(right[1], isEnglish ? 'en' : 'th'))
    .map(([value, label]) => ({ value, label }))
}

export default {
  name: 'GraduateRegistrationAdmin',
  data () {
    return {
      loading: false,
      searchDebounceTimer: null,
      errorMessage: '',
      registrations: [],
      filterSourceRegistrations: [],
      detailsVisible: false,
      selectedRegistration: null,
      detailsEditMode: false,
      savingDetails: false,
      detailsForm: {
        ceremonyStatus: ''
      },
      filters: {
        q: '',
        school: 'all',
        program: 'all',
        ceremonyStatus: 'all'
      }
    }
  },
  computed: {
    isEnglishLocale () {
      return String((this.$i18n && this.$i18n.locale) || '').toLowerCase().startsWith('en')
    },
    localizedCeremonyStatusFilterOptions () {
      return [
        { label: this.$t('graduation.admin.filters.allStatuses'), value: 'all' },
        ...CEREMONY_STATUS_OPTIONS.map(item => ({
          label: `${item.value} - ${this.$t(`graduation.ceremonyStatus.${item.key}`)}`,
          value: item.value
        }))
      ]
    },
    editableCeremonyStatusOptions () {
      return CEREMONY_STATUS_OPTIONS.map(item => ({
        label: `${item.value} - ${this.$t(`graduation.ceremonyStatus.${item.key}`)}`,
        value: item.value
      }))
    },
    schoolFilterOptions () {
      return [
        { label: this.$t('graduation.admin.filters.allSchools'), value: 'all' },
        ...uniqueLocalizedOptions(this.filterSourceRegistrations, 'school', 'schoolEnglish', this.isEnglishLocale)
      ]
    },
    programFilterOptions () {
      const selectedSchool = this.filters.school
      const rows = selectedSchool && selectedSchool !== 'all'
        ? this.filterSourceRegistrations.filter(item => item.school === selectedSchool)
        : this.filterSourceRegistrations
      return [
        { label: this.$t('graduation.admin.filters.allPrograms'), value: 'all' },
        ...uniqueLocalizedOptions(rows, 'program', 'programEnglish', this.isEnglishLocale)
      ]
    },
    statCards () {
      const statusCards = CEREMONY_STATUS_OPTIONS.map(status => ({
        key: status.value,
        code: status.value,
        label: this.$t(`graduation.ceremonyStatus.${status.key}`),
        value: this.registrations.filter(item => normalizeCeremonyStatus(item.ceremonyStatus) === status.value).length
      }))
      return [{
        key: 'total',
        label: this.$t('graduation.admin.stats.total'),
        value: this.registrations.length
      }].concat(statusCards, {
        key: 'food-allergy',
        label: this.$t('graduation.admin.stats.foodAllergy'),
        value: this.registrations.filter(item => this.hasFoodAllergy(item)).length
      })
    }
  },
  mounted () {
    this.fetchFilterSourceRegistrations()
    this.fetchRegistrations()
  },
  beforeDestroy () {
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer)
  },
  methods: {
    scheduleSearch () {
      if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer)
      this.searchDebounceTimer = setTimeout(() => {
        this.searchDebounceTimer = null
        this.fetchRegistrations()
      }, 400)
    },
    async fetchFilterSourceRegistrations () {
      try {
        const response = await api.graduateRegistrations('list', { limit: 4000 })
        const data = unwrap(response)
        this.filterSourceRegistrations = Array.isArray(data.rows) ? data.rows : []
      } catch (error) {
        this.filterSourceRegistrations = []
      }
    },
    async fetchRegistrations () {
      if (this.searchDebounceTimer) {
        clearTimeout(this.searchDebounceTimer)
        this.searchDebounceTimer = null
      }
      this.loading = true
      this.errorMessage = ''
      try {
        const response = await api.graduateRegistrations('list', {
          q: this.filters.q,
          school: this.filters.school,
          program: this.filters.program,
          ceremonyStatus: this.filters.ceremonyStatus,
          limit: 4000
        })
        const data = unwrap(response)
        this.registrations = Array.isArray(data.rows) ? data.rows : []
      } catch (error) {
        this.errorMessage = this.$t('graduation.admin.messages.loadError')
        notifyError(this.$store, this.errorMessage)
      } finally {
        this.loading = false
      }
    },
    clearFilters () {
      this.filters.q = ''
      this.filters.school = 'all'
      this.filters.program = 'all'
      this.filters.ceremonyStatus = 'all'
      this.fetchRegistrations()
    },
    onSchoolFilterChange (value) {
      const nextSchool = value && value.target ? value.target.value : value
      if (this.filters.school !== nextSchool) {
        this.filters.school = nextSchool || 'all'
      }
      this.filters.program = 'all'
    },
    openDetails (item) {
      this.selectedRegistration = item
      this.detailsEditMode = false
      this.detailsForm.ceremonyStatus = normalizeCeremonyStatus(item && item.ceremonyStatus)
      this.detailsVisible = true
    },
    closeDetails () {
      this.detailsEditMode = false
      this.detailsVisible = false
    },
    startDetailsEdit () {
      if (!this.selectedRegistration) return
      this.detailsForm.ceremonyStatus = normalizeCeremonyStatus(this.selectedRegistration.ceremonyStatus)
      this.detailsEditMode = true
    },
    async saveDetailsEdit () {
      if (!this.selectedRegistration || !this.selectedRegistration._id) return
      this.savingDetails = true
      try {
        const ceremonyStatus = normalizeCeremonyStatus(this.detailsForm.ceremonyStatus)
        const payload = {
          _id: this.selectedRegistration._id,
          adminStatusUpdate: true,
          ceremonyAssistanceType: this.selectedRegistration.ceremonyAssistanceType,
          ceremonyStatus: ceremonyStatus
        }
        const response = await api.graduateRegistrations('update-status', payload)
        const updatedRegistration = response && response.data && response.data.data
          ? response.data.data
          : payload
        this.selectedRegistration = Object.assign({}, this.selectedRegistration, updatedRegistration)
        const index = this.registrations.findIndex(item => item && item._id === payload._id)
        if (index !== -1) {
          this.$set(this.registrations, index, Object.assign({}, this.registrations[index], updatedRegistration))
        }
        const sourceIndex = this.filterSourceRegistrations.findIndex(item => item && item._id === payload._id)
        if (sourceIndex !== -1) {
          this.$set(this.filterSourceRegistrations, sourceIndex, Object.assign({}, this.filterSourceRegistrations[sourceIndex], updatedRegistration))
        }
        this.detailsEditMode = false
        notifySuccess(this.$store, 'บันทึกสถานะเข้ารับแล้ว')
      } catch (error) {
        notifyError(this.$store, 'บันทึกสถานะเข้ารับไม่สำเร็จ')
      } finally {
        this.savingDetails = false
      }
    },
    fullName (item) {
      return [item && item.firstName, item && item.lastName].filter(Boolean).join(' ')
    },
    localizedSchool (item) {
      return this.isEnglishLocale && cleanTextOption(item && item.schoolEnglish)
        ? cleanTextOption(item.schoolEnglish)
        : cleanTextOption(item && item.school)
    },
    localizedProgram (item) {
      return this.isEnglishLocale && cleanTextOption(item && item.programEnglish)
        ? cleanTextOption(item.programEnglish)
        : cleanTextOption(item && item.program)
    },
    pronunciationLabel (item) {
      const combined = [item && item.firstNamePronunciation, item && item.lastNamePronunciation].filter(Boolean).join(' ')
      return combined || (item && item.namePronunciation) || '-'
    },
    hasFoodAllergy (item) {
      const note = String((item && item.foodAllergyNote) || '').trim()
      return (item && item.hasFoodAllergy === 'yes') || (!!note && note !== '-')
    },
    cleanStatusCode (value) {
      return normalizeCeremonyStatus(value)
    },
    ceremonyStatusLabel (value) {
      const code = normalizeCeremonyStatus(value)
      const selected = CEREMONY_STATUS_OPTIONS.find(item => item.value === code)
      return selected ? `${selected.value} - ${this.$t(`graduation.ceremonyStatus.${selected.key}`)}` : '-'
    },
    assistanceTypeLabel (value) {
      const code = cleanCode(value)
      return code && ASSISTANCE_TYPE_LABELS[code] ? `${code} - ${this.$t(`graduation.assistanceType.${ASSISTANCE_TYPE_LABELS[code]}`)}` : '-'
    },
    certificateDeliveryMethodLabel (value) {
      return value ? this.$t(`graduation.certificate.${value}`) : '-'
    },
    certificateShippingServiceLabel (value) {
      return value ? this.$t(`graduation.certificate.shipping.${value}.label`) : '-'
    },
    addressLabel (address) {
      const source = address || {}
      return [
        source.houseNo && `${this.$t('graduation.address.fields.houseNo')} ${source.houseNo}`,
        source.moo && `${this.$t('graduation.address.fields.moo')} ${source.moo}`,
        source.soi && `${this.$t('graduation.address.fields.soi')} ${source.soi}`,
        source.road && `${this.$t('graduation.address.fields.road')} ${source.road}`,
        source.subdistrict && `${this.$t('graduation.address.fields.subdistrict')} ${source.subdistrict}`,
        source.district && `${this.$t('graduation.address.fields.district')} ${source.district}`,
        source.province && `${this.$t('graduation.address.fields.province')} ${source.province}`,
        source.postalCode && `${this.$t('graduation.address.fields.postalCode')} ${source.postalCode}`
      ].filter(Boolean).join(' ') || '-'
    },
    formatDateTime (value) {
      if (!value) return '-'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return '-'
      return date.toLocaleString(this.$i18n.locale === 'th' ? 'th-TH' : 'en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.graduate-admin-page {
  padding: 0.25rem;
}
.graduate-admin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}
.graduate-admin-header h1 {
  margin: 0;
  color: #111827;
  font-size: 30px;
  font-weight: 700;
}
.graduate-admin-header p {
  margin: 6px 0 0;
  color: #6b7280;
}
.graduate-admin-header__eyebrow {
  margin-bottom: 4px;
  color: #8c1515;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}
.graduate-admin-header__actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.graduate-admin-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: none;
}
.graduate-admin-stats-row {
  flex-wrap: wrap;
  margin-right: -6px;
  margin-bottom: 4px;
  margin-left: -6px;
}
.graduate-admin-stats-col {
  flex: 0 0 20%;
  max-width: 20%;
  padding-right: 6px;
  padding-bottom: 12px;
  padding-left: 6px;
}
.graduate-admin-stats-col:nth-child(n + 6) {
  flex-basis: 25%;
  max-width: 25%;
}
.graduate-admin-stat {
  height: 100%;
  margin-bottom: 0;
}
.graduate-admin-stat__body {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 82px;
  padding: 14px 16px;
}
.graduate-admin-stat__content {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}
.graduate-admin-stat__code {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 24px;
  padding: 0 7px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #475569;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
}
.graduate-admin-stat__label {
  color: #374151;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.45;
  overflow-wrap: anywhere;
  white-space: normal;
}
.graduate-admin-stat__value {
  flex: 0 0 auto;
  min-width: 64px;
  color: #111827;
  font-size: 25px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  text-align: center;
}
.graduate-admin-toolbar {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.graduate-admin-search {
  flex: 1 1 320px;
}
.graduate-admin-school {
  flex: 1 1 260px;
}
.graduate-admin-program {
  flex: 1 1 260px;
}
.graduate-admin-status {
  flex: 0 1 280px;
}
.graduate-admin-table-wrap {
  overflow-x: auto;
}
.graduate-admin-table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
}
.graduate-admin-table th,
.graduate-admin-table td {
  padding: 14px 12px;
  border-bottom: 1px solid #eef2f7;
  text-align: left;
  vertical-align: top;
}
.graduate-admin-table th {
  color: #6b7280;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}
.graduate-admin-table td strong,
.graduate-admin-table td span,
.graduate-admin-table td small {
  display: block;
}
.graduate-admin-table td span {
  margin-top: 3px;
  color: #6b7280;
  font-size: 12px;
}
.graduate-admin-table td small {
  margin-top: 3px;
  color: #9ca3af;
  font-size: 11px;
}
.graduate-admin-empty {
  color: #6b7280;
  text-align: center !important;
}
.graduate-admin-row-actions {
  display: flex;
  gap: 6px;
  white-space: nowrap;
}
.graduate-admin-details {
  display: grid;
  gap: 12px;
}
.graduate-admin-details div {
  display: grid;
  gap: 4px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eef2f7;
}
.graduate-admin-details__select {
  max-width: 420px;
}
.graduate-admin-modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 12px;
}
.graduate-admin-edit-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 48px;
  padding: 0;
}
.graduate-admin-close-button {
  min-width: 72px;
  border-color: #4b5563;
  background: #4b5563;
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 8px 18px rgba(75, 85, 99, 0.18);
}
.graduate-admin-close-button:hover,
.graduate-admin-close-button:focus {
  border-color: #374151;
  background: #374151;
  color: #ffffff;
}
.graduate-admin-details span {
  color: #6b7280;
  font-size: 12px;
}
.graduate-admin-details strong {
  color: #111827;
}
@media (max-width: 768px) {
  .graduate-admin-header,
  .graduate-admin-header__actions {
    flex-direction: column;
  }
  .graduate-admin-stats-col,
  .graduate-admin-stats-col:nth-child(n + 6) {
    flex: 0 0 100%;
    max-width: 100%;
  }
  .graduate-admin-stat__body {
    min-height: 76px;
    padding: 12px 14px;
  }
}
@media (min-width: 769px) and (max-width: 1199px) {
  .graduate-admin-stats-col,
  .graduate-admin-stats-col:nth-child(n + 6) {
    flex: 0 0 50%;
    max-width: 50%;
  }
}
</style>
