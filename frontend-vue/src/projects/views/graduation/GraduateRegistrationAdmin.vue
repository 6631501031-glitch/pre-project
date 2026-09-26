<template>
  <div class="graduate-admin-page">
    <div class="graduate-admin-header">
      <div>
        <h1>{{ $t('graduation.admin.title') }}</h1>
      </div>
      <div class="graduate-admin-header__actions">
        <CButton color="primary" variant="outline" :disabled="loading" @click="fetchRegistrations(1)">
          <CIcon name="cil-reload" class="mr-2" />
          {{ $t('graduation.admin.actions.refresh') }}
        </CButton>
      </div>
    </div>

    <CRow class="graduate-admin-stats-row">
      <CCol v-for="item in statCards" :key="item.key" class="graduate-admin-stats-col">
        <CCard class="graduate-admin-card graduate-admin-stat"
          :class="{ 'allergy-card-button': item.key === 'food-allergy' }"
          :role="item.key === 'food-allergy' ? 'button' : null"
          :tabindex="item.key === 'food-allergy' ? 0 : null"
          @click="item.key === 'food-allergy' && openAllergyList()"
          @keydown.enter="item.key === 'food-allergy' && openAllergyList()"
          @keydown.space="onAllergyCardSpace($event, item)"
        >
          <CCardBody class="graduate-admin-stat__body">
            <div :class="['graduate-admin-stat__icon', `graduate-admin-stat__icon--${item.tone}`]">
              <CIcon :name="item.icon" />
            </div>
            <div class="graduate-admin-stat__content">
              <div class="graduate-admin-stat__label">{{ item.label }}</div>
              <div class="graduate-admin-stat__metric">
                <strong>{{ item.displayValue }}</strong>
                <span v-if="item.unit">{{ item.unit }}</span>
              </div>
              <div v-if="item.hint" :class="['graduate-admin-stat__hint', `graduate-admin-stat__hint--${item.tone}`]">
                {{ item.hint }}
              </div>
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
            @keyup.enter="fetchRegistrations(1)"
            @input="scheduleSearch"
          />
          <CSelect
            :value.sync="filters.school"
            class="graduate-admin-school"
            :options="schoolFilterOptions"
            @update:value="onSchoolFilterChange"
          />
          <CSelect
            :value.sync="filters.program"
            class="graduate-admin-program"
            :options="programFilterOptions"
          />
          <CSelect
            :value.sync="filters.ceremonyStatus"
            class="graduate-admin-status"
            :options="localizedCeremonyStatusFilterOptions"
          />
          <CButton color="primary" :disabled="loading" @click="fetchRegistrations(1)">
            <CIcon name="cil-magnifying-glass" class="mr-2" />
            {{ $t('graduation.admin.actions.search') }}
          </CButton>
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
        <div v-if="totalRegistrations" class="roster-pagination">
          <div class="roster-pagination__summary">
            <span>{{ $t('graduation.checkin.pagination.showing') }}</span>
            <strong>{{ pageStart }}-{{ pageEnd }}</strong>
            <span>{{ $t('graduation.checkin.pagination.ofNames', { total: totalRegistrations.toLocaleString('en-US') }) }}</span>
          </div>
          <div class="roster-pagination__controls">
            <button type="button" class="pager-button" :disabled="loading || currentPage <= 1" @click="changePage(currentPage - 1)">
              <CIcon name="cil-chevron-left" />
              {{ $t('graduation.checkin.pagination.previous') }}
            </button>
            <div class="pager-current">
              <span>{{ $t('graduation.checkin.pagination.page') }}</span>
              <strong>{{ currentPage }}</strong>
              <span>/ {{ totalPages }}</span>
            </div>
            <button type="button" class="pager-button" :disabled="loading || currentPage >= totalPages" @click="changePage(currentPage + 1)">
              {{ $t('graduation.checkin.pagination.next') }}
              <CIcon name="cil-chevron-right" />
            </button>
          </div>
        </div>
      </CCardBody>
    </CCard>

    <CModal :show.sync="allergyVisible" size="lg" :title="$t('graduation.admin.stats.foodAllergy')" color="danger">
      <div v-if="allergyLoading" role="status">{{ $t('graduation.admin.allergyList.loading') }}</div>
      <div v-else-if="allergyError" role="alert">
        {{ allergyError }}
        <CButton color="primary" @click="fetchAllergyList(allergyPage)">{{ $t('graduation.admin.actions.refresh') }}</CButton>
      </div>
      <template v-else>
        <p v-if="!allergyRows.length">{{ $t('graduation.admin.allergyList.empty') }}</p>
        <div v-else class="table-responsive">
          <table class="table">
            <thead><tr>
              <th>{{ $t('graduation.admin.allergyList.studentCode') }}</th>
              <th>{{ $t('graduation.admin.details.fullName') }}</th>
              <th>{{ $t('graduation.fields.foodAllergyNote') }}</th>
            </tr></thead>
            <tbody><tr v-for="person in allergyRows" :key="person._id">
              <td>{{ person.studentCode || person.barcodeValue || '-' }}</td>
              <td>{{ fullName(person) }}</td>
              <td class="allergy-note">{{ person.foodAllergyNote || '-' }}</td>
            </tr></tbody>
          </table>
        </div>
      </template>
      <template #footer>
        <CButton :disabled="allergyLoading || allergyPage <= 1" @click="fetchAllergyList(allergyPage - 1)">{{ $t('graduation.checkin.pagination.previous') }}</CButton>
        <span>{{ allergyPage }} / {{ Math.max(1, Math.ceil(allergyTotal / allergyPageSize)) }}</span>
        <CButton :disabled="allergyLoading || allergyPage * allergyPageSize >= allergyTotal" @click="fetchAllergyList(allergyPage + 1)">{{ $t('graduation.checkin.pagination.next') }}</CButton>
      </template>
    </CModal>

    <CModal
      :show.sync="detailsVisible"
      size="lg"
      :title="$t('graduation.admin.detailsTitle')"
      color="danger"
    >
      <GraduateCeremonyPreferences v-if="selectedRegistration && detailsEditMode" :key="selectedRegistration._id" admin-mode :registration-data="selectedRegistration" @saved="onCeremonySaved" />
      <div v-if="selectedRegistration && !detailsEditMode" class="graduate-admin-details">
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
        <div v-if="['50', '60'].includes(cleanStatusCode(selectedRegistration.ceremonyStatus))">
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

          <CButton color="secondary" class="graduate-admin-close-button" @click="closeDetails">{{ $t('graduation.admin.actions.close') }}</CButton>
        </div>
      </template>
    </CModal>
  </div>
</template>

<script>
import api from '@/service/api'
import GraduateCeremonyPreferences from './GraduateCeremonyPreferences.vue'
import { notifyError } from '@/projects/utils/notify'

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
  components: { GraduateCeremonyPreferences },
  data () {
    return {
      loading: false,
      searchDebounceTimer: null,
      errorMessage: '',
      registrations: [],
      filterSourceRegistrations: [],
      currentPage: 1,
      pageSize: 10,
      totalRegistrations: 0,
      allergyVisible: false,
      allergyLoading: false,
      allergyError: '',
      allergyRows: [],
      allergyPage: 1,
      allergyPageSize: 10,
      allergyTotal: 0,
      registrationSummary: { total: 0, responded: 0, foodAllergy: 0 },
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
    totalPages () {
      return Math.max(Math.ceil(this.totalRegistrations / this.pageSize), 1)
    },
    pageStart () {
      return this.totalRegistrations ? ((this.currentPage - 1) * this.pageSize) + 1 : 0
    },
    pageEnd () {
      return Math.min(this.currentPage * this.pageSize, this.totalRegistrations)
    },
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
      const total = this.registrationSummary.total
      const responded = this.registrationSummary.responded
      const responseRate = total ? (responded / total) * 100 : 0
      const peopleUnit = this.$t('graduation.admin.stats.peopleUnit')

      return [
        {
          key: 'total',
          label: this.$t('graduation.admin.stats.totalGraduates'),
          displayValue: total.toLocaleString(),
          unit: peopleUnit,
          icon: 'cil-people',
          tone: 'primary'
        },
        {
          key: 'responded',
          label: this.$t('graduation.admin.stats.responded'),
          displayValue: responded.toLocaleString(),
          unit: peopleUnit,
          hint: `${responseRate.toFixed(2)}%`,
          icon: 'cil-envelope-open',
          tone: 'success'
        },
        {
          key: 'food-allergy',
          label: this.$t('graduation.admin.stats.foodAllergy'),
          displayValue: (this.registrationSummary.foodAllergy || 0).toLocaleString(),
          unit: peopleUnit,
          icon: 'cil-warning',
          tone: 'primary'
        },
        {
          key: 'response-rate',
          label: this.$t('graduation.admin.stats.responseRate'),
          displayValue: `${responseRate.toFixed(2)}%`,
          hint: this.$t('graduation.admin.stats.responseRateHint'),
          icon: 'cil-chart-line',
          tone: 'purple'
        }
      ]
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
    onAllergyCardSpace (event, item) {
      if (item.key !== 'food-allergy') return
      event.preventDefault()
      this.openAllergyList()
    },
    openAllergyList () {
      this.allergyVisible = true
      this.fetchAllergyList(1)
    },
    async fetchAllergyList (page = 1) {
      this.allergyLoading = true
      this.allergyError = ''
      this.allergyPage = page
      try {
        const response = await api.graduateRegistrations('list', { foodAllergy: true, page, limit: this.allergyPageSize, includePhotos: false })
        const data = unwrap(response)
        this.allergyRows = Array.isArray(data.rows) ? data.rows : []
        this.allergyTotal = Number(data.total) || 0
      } catch (error) {
        this.allergyRows = []
        this.allergyError = this.$t('graduation.admin.messages.loadError')
      } finally {
        this.allergyLoading = false
      }
    },
    scheduleSearch () {
      if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer)
      this.searchDebounceTimer = setTimeout(() => {
        this.searchDebounceTimer = null
        this.fetchRegistrations()
      }, 400)
    },
    async fetchFilterSourceRegistrations () {
      try {
        const response = await api.graduateRegistrations('list', { limit: 4000, includePhotos: false })
        const data = unwrap(response)
        this.filterSourceRegistrations = Array.isArray(data.rows) ? data.rows : []
      } catch (error) {
        this.filterSourceRegistrations = []
      }
    },
    async fetchRegistrations (page = 1) {
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
          page,
          limit: this.pageSize,
          includeSummary: true,
          includePhotos: false
        })
        const data = unwrap(response)
        this.registrations = Array.isArray(data.rows) ? data.rows : []
        this.totalRegistrations = Number(data.total) || 0
        if (!data.summary) throw new Error('Missing registration summary')
        this.registrationSummary = data.summary
        this.currentPage = Number(data.page) || page
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
    changePage (page) {
      const nextPage = Math.min(Math.max(Number(page) || 1, 1), this.totalPages)
      if (nextPage !== this.currentPage) this.fetchRegistrations(nextPage)
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
    onCeremonySaved (updatedRegistration) {
      this.selectedRegistration = Object.assign({}, this.selectedRegistration, updatedRegistration)
      for (const rows of [this.registrations, this.filterSourceRegistrations]) {
        const index = rows.findIndex(item => item._id === updatedRegistration._id)
        if (index !== -1) this.$set(rows, index, Object.assign({}, rows[index], updatedRegistration))
      }
      this.detailsEditMode = false
      this.fetchRegistrations(this.currentPage)
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
  flex: 0 0 25%;
  max-width: 25%;
  padding-right: 6px;
  padding-bottom: 12px;
  padding-left: 6px;
}
.graduate-admin-stat {
  height: 100%;
  margin-bottom: 0;
  background: #ffffff;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
}
.graduate-admin-stat__body {
  display: flex;
  align-items: center;
  gap: 13px;
  min-height: 108px;
  padding: 18px 16px;
}
.graduate-admin-stat__icon {
  display: inline-flex;
  flex: 0 0 52px;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  color: #ffffff;
  font-size: 25px;
}
.graduate-admin-stat__icon--primary {
  background: linear-gradient(135deg, #6d83f2, #5669dc);
}
.graduate-admin-stat__icon--success {
  background: linear-gradient(135deg, #77ca54, #54af36);
}
.graduate-admin-stat__icon--warning {
  background: linear-gradient(135deg, #ffbd3f, #f59e0b);
}
.graduate-admin-stat__icon--purple {
  background: linear-gradient(135deg, #b569ea, #8f48cf);
}
.graduate-admin-stat__content {
  min-width: 0;
  flex: 1 1 auto;
}
.graduate-admin-stat__label {
  margin-bottom: 2px;
  color: #4b5563;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
  overflow-wrap: anywhere;
  white-space: normal;
}
.graduate-admin-stat__metric {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.graduate-admin-stat__metric strong {
  color: #111827;
  font-size: 24px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1.15;
}
.graduate-admin-stat__metric span {
  color: #6b7280;
  font-size: 11px;
}
.graduate-admin-stat__hint {
  margin-top: 4px;
  color: #6b7280;
  font-size: 11px;
  line-height: 1.25;
}
.graduate-admin-stat__hint--success {
  color: #55ad3a;
  font-weight: 700;
}
.graduate-admin-stat__hint--warning {
  color: #d98a00;
  font-weight: 700;
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
.roster-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  padding: 12px;
  border: 1px solid #eef2f7;
  border-radius: 8px;
  color: #6b7280;
  background: #fbfcff;
}
.roster-pagination__summary,
.roster-pagination__controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.roster-pagination__summary strong {
  min-width: 74px;
  padding: 4px 10px;
  border-radius: 999px;
  color: #8c1515;
  background: #fff1f1;
  font-weight: 900;
  text-align: center;
}
.pager-current {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #fff;
}
.pager-current strong {
  color: #111827;
  font-size: 18px;
  font-weight: 900;
}
.pager-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid #321fdb;
  border-radius: 999px;
  color: #321fdb;
  background: #fff;
  font-weight: 800;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.pager-button:hover:not(:disabled) {
  color: #fff;
  background: #321fdb;
}
.pager-button:disabled {
  border-color: #d8dee9;
  color: #a0aec0;
  background: #f8fafc;
  cursor: not-allowed;
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
  .graduate-admin-stats-col {
    flex: 0 0 100%;
    max-width: 100%;
  }
  .graduate-admin-stat__body {
    min-height: 76px;
    padding: 12px 14px;
  }
  .roster-pagination {
    align-items: flex-start;
    flex-direction: column;
  }
  .roster-pagination__controls {
    width: 100%;
  }
  .pager-button {
    flex: 1 1 auto;
  }
}
@media (min-width: 769px) and (max-width: 1199px) {
  .graduate-admin-stats-col {
    flex: 0 0 50%;
    max-width: 50%;
  }
}
</style>

<style scoped>
.allergy-card-button { cursor: pointer; }
.allergy-card-button:hover, .allergy-card-button:focus-visible { outline: 2px solid #6366f1; outline-offset: 2px; }
.allergy-note { white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
