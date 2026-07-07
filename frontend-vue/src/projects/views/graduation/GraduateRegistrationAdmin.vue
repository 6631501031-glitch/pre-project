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

    <CRow>
      <CCol v-for="item in statCards" :key="item.key" xl="3" md="6" class="mb-3">
        <CCard class="graduate-admin-card graduate-admin-stat">
          <CCardBody>
            <div class="graduate-admin-stat__label">{{ item.label }}</div>
            <div class="graduate-admin-stat__value">{{ item.value }}</div>
            <div class="graduate-admin-stat__hint">{{ item.hint }}</div>
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
          <CButton color="primary" :disabled="loading" @click="fetchRegistrations">{{ $t('graduation.admin.actions.search') }}</CButton>
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
                  <small>{{ item.barcodeValue || '-' }}</small>
                </td>
                <td>
                  <strong>{{ localizedSchool(item) || '-' }}</strong>
                  <span>{{ localizedProgram(item) || '-' }}</span>
                </td>
                <td>
                  <CBadge :color="ceremonyStatusColor(item.ceremonyStatus)">
                    {{ ceremonyStatusLabel(item.ceremonyStatus) }}
                  </CBadge>
                </td>
                <td>{{ assistanceTypeLabel(item.ceremonyAssistanceType) }}</td>
                <td>
                  <strong>{{ item.phone || '-' }}</strong>
                  <span>{{ item.email || '-' }}</span>
                </td>
                <td>{{ formatDateTime(item.updatedAt || item.createdAt) }}</td>
                <td class="graduate-admin-row-actions">
                  <CButton size="sm" color="primary" variant="outline" @click="openDetails(item)">
                    {{ $t('graduation.admin.actions.view') }}
                  </CButton>
                  <CButton size="sm" color="danger" variant="outline" :disabled="removingId === item._id" @click="removeRegistration(item)">
                    {{ $t('graduation.admin.actions.delete') }}
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
          <strong>{{ ceremonyStatusLabel(selectedRegistration.ceremonyStatus) }}</strong>
        </div>
        <div>
          <span>{{ $t('graduation.admin.details.assistanceType') }}</span>
          <strong>{{ assistanceTypeLabel(selectedRegistration.ceremonyAssistanceType) }}</strong>
        </div>
        <div>
          <span>{{ $t('graduation.admin.details.extraDetail') }}</span>
          <strong>{{ selectedRegistration.ceremonyStatusNote || '-' }}</strong>
        </div>
        <div v-if="cleanStatusCode(selectedRegistration.ceremonyStatus) === '3'">
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
        <div>
          <span>Barcode</span>
          <strong>{{ selectedRegistration.barcodeValue || '-' }}</strong>
        </div>
      </div>
      <template #footer>
        <CButton color="secondary" variant="outline" @click="detailsVisible = false">{{ $t('graduation.admin.actions.close') }}</CButton>
      </template>
    </CModal>
  </div>
</template>

<script>
import api from '@/service/api'
import { notifyError, notifySuccess } from '@/projects/utils/notify'

const CEREMONY_STATUS_LABELS = {
  0: '0',
  1: '1',
  2: '2',
  3: '3',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  60: '60',
  70: '70',
  80: '80'
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
  const raw = String(value || '').trim()
  const code = raw.match(/\d+/)
  return code ? code[0] : raw
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
      removingId: '',
      errorMessage: '',
      registrations: [],
      filterSourceRegistrations: [],
      detailsVisible: false,
      selectedRegistration: null,
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
        ...Object.keys(CEREMONY_STATUS_LABELS).map(value => ({
          label: `${value} - ${this.$t(`graduation.ceremonyStatus.${CEREMONY_STATUS_LABELS[value]}`)}`,
          value
        }))
      ]
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
      const total = this.registrations.length
      const special = this.registrations.filter(item => cleanCode(item.ceremonyStatus) === '20').length
      const assisted = this.registrations.filter(item => cleanCode(item.ceremonyAssistanceType)).length
      const foodAllergy = this.registrations.filter(item => this.hasFoodAllergy(item)).length
      return [
        { key: 'total', label: this.$t('graduation.admin.stats.total'), value: total, hint: this.$t('graduation.admin.stats.totalHint') },
        { key: 'special', label: this.$t('graduation.admin.stats.special'), value: special, hint: this.$t('graduation.admin.stats.specialHint') },
        { key: 'assisted', label: this.$t('graduation.admin.stats.assisted'), value: assisted, hint: this.$t('graduation.admin.stats.assistedHint') },
        { key: 'foodAllergy', label: this.$t('graduation.admin.stats.foodAllergy'), value: foodAllergy, hint: this.$t('graduation.admin.stats.foodAllergyHint') }
      ]
    }
  },
  mounted () {
    this.fetchFilterSourceRegistrations()
    this.fetchRegistrations()
  },
  methods: {
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
      this.detailsVisible = true
    },
    async removeRegistration (item) {
      if (!item || !item._id) return
      if (!window.confirm(this.$t('graduation.admin.messages.deleteConfirm', { name: this.fullName(item) || this.$t('graduation.admin.messages.thisRecord') }))) return
      this.removingId = item._id
      try {
        await api.graduateRegistrations('delete', item)
        notifySuccess(this.$store, this.$t('graduation.admin.messages.deleteSuccess'))
        await this.fetchFilterSourceRegistrations()
        await this.fetchRegistrations()
      } catch (error) {
        notifyError(this.$store, this.$t('graduation.admin.messages.deleteError'))
      } finally {
        this.removingId = ''
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
      return cleanCode(value)
    },
    ceremonyStatusLabel (value) {
      const code = cleanCode(value)
      return code && CEREMONY_STATUS_LABELS[code] ? `${code} - ${this.$t(`graduation.ceremonyStatus.${CEREMONY_STATUS_LABELS[code]}`)}` : '-'
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
    ceremonyStatusColor (value) {
      const code = cleanCode(value)
      if (code === '20') return 'warning'
      if (['1', '10'].includes(code)) return 'success'
      if (['3', '60', '80'].includes(code)) return 'danger'
      return 'info'
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
.graduate-admin-stat__label {
  color: #6b7280;
  font-size: 13px;
}
.graduate-admin-stat__value {
  margin-top: 8px;
  color: #111827;
  font-size: 28px;
  font-weight: 700;
}
.graduate-admin-stat__hint {
  margin-top: 4px;
  color: #6b7280;
  font-size: 12px;
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
}
</style>
