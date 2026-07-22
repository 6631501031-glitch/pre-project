<template>
  <div class="checkin-dashboard-page">
    <div class="checkin-dashboard-header">
      <div>
        <div class="checkin-dashboard-header__eyebrow">{{ $t('graduation.checkin.eyebrow') }}</div>
        <h1>{{ $t('graduation.checkin.title') }}</h1>
        <p>{{ $t('graduation.checkin.subtitle') }}</p>
      </div>
      <div class="checkin-dashboard-header__actions">
        <CButton color="primary" variant="outline" :disabled="loading" @click="fetchRegistrations">
          <CIcon name="cil-reload" class="mr-2" />
          {{ $t('graduation.checkin.actions.refresh') }}
        </CButton>
        <CButton color="success" @click="$router.push('/graduation/face-checkin')">
          <CIcon name="cil-camera" class="mr-2" />
          {{ $t('graduation.checkin.actions.openCheckin') }}
        </CButton>
      </div>
    </div>

    <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

    <div class="mode-strip">
      <button
        v-for="mode in checkInModes"
        :key="mode.value"
        type="button"
        :class="['mode-button', activeMode === mode.value ? 'is-active' : '']"
        @click="activeMode = mode.value"
      >
        <span>{{ mode.label }}</span>
        <small>{{ mode.note }}</small>
      </button>
    </div>

    <div class="metric-grid">
      <div v-for="item in metricCards" :key="item.key" class="metric-card">
        <div class="metric-card__icon">
          <CIcon :name="item.icon" />
        </div>
        <div>
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
          <small>{{ item.hint }}</small>
        </div>
      </div>
    </div>

    <div class="simulation-grid">
      <div v-for="item in simulatedModeStats" :key="item.key" class="simulation-card" :class="{ 'is-active': activeMode === item.key }">
        <div>
          <span>{{ item.label }}</span>
          <strong>{{ item.checkedIn.toLocaleString('en-US') }}</strong>
          <small>{{ $t('graduation.checkin.progress.checkedFrom', { total: item.total.toLocaleString('en-US') }) }}</small>
        </div>
        <div class="simulation-card__meta">
          <b>{{ item.rate }}%</b>
          <span>{{ $t('graduation.checkin.progress.pendingReview', { pending: item.pending.toLocaleString('en-US'), review: item.review.toLocaleString('en-US') }) }}</span>
        </div>
        <i><em :style="{ width: item.rate + '%' }"></em></i>
      </div>
    </div>

    <div class="dashboard-layout">
      <section class="dashboard-panel roster-panel">
        <div class="panel-heading">
          <div>
            <h2>{{ $t('graduation.checkin.roster.title') }}</h2>
            <p>{{ $t('graduation.checkin.roster.subtitle') }}</p>
          </div>
          <CInput
            v-model.trim="searchText"
            class="roster-search"
            :placeholder="$t('graduation.checkin.roster.searchPlaceholder')"
          />
        </div>

        <div class="roster-table-wrap">
          <table class="roster-table">
            <thead>
              <tr>
                <th>{{ $t('graduation.checkin.roster.graduate') }}</th>
                <th>{{ $t('graduation.checkin.roster.schoolProgram') }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="3" class="empty-cell">{{ $t('graduation.checkin.roster.loading') }}</td>
              </tr>
              <tr v-else-if="!filteredRegistrations.length">
                <td colspan="3" class="empty-cell">{{ $t('graduation.checkin.roster.empty') }}</td>
              </tr>
              <tr v-for="item in pagedRegistrations" :key="item._id || item.email || fullName(item)">
                <td>
                  <strong>{{ fullName(item) || '-' }}</strong>
                  <span>{{ item.studentCode || item.barcodeValue || item.phone || '-' }}</span>
                </td>
                <td>
                  <strong>{{ localizedSchool(item) || '-' }}</strong>
                  <span>{{ localizedProgram(item) || '-' }}</span>
                </td>
                <td class="row-actions">
                  <CButton size="sm" color="primary" variant="outline" @click="$router.push('/graduation/face-checkin')">
                    {{ $t('graduation.checkin.actions.checkin') }}
                  </CButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="filteredRegistrations.length" class="roster-pagination">
          <div class="roster-pagination__summary">
            <span>{{ $t('graduation.checkin.pagination.showing') }}</span>
            <strong>{{ pageStartDisplay }}-{{ pageEndDisplay }}</strong>
            <span>{{ $t('graduation.checkin.pagination.ofNames', { total: filteredRegistrations.length.toLocaleString('en-US') }) }}</span>
          </div>
          <div class="roster-pagination__controls">
            <button
              type="button"
              class="pager-button"
              :disabled="currentPage <= 1"
              @click="currentPage -= 1"
            >
              <CIcon name="cil-chevron-left" />
              {{ $t('graduation.checkin.pagination.previous') }}
            </button>
            <div class="pager-current">
              <span>{{ $t('graduation.checkin.pagination.page') }}</span>
              <strong>{{ currentPage }}</strong>
              <span>/ {{ totalPages }}</span>
            </div>
            <button
              type="button"
              class="pager-button"
              :disabled="currentPage >= totalPages"
              @click="currentPage += 1"
            >
              {{ $t('graduation.checkin.pagination.next') }}
              <CIcon name="cil-chevron-right" />
            </button>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<script>
import api from '@/service/api'

function unwrapRows (response) {
  const data = response && response.data && response.data.data ? response.data.data : {}
  return Array.isArray(data.rows) ? data.rows : []
}

function textValue (value) {
  const text = String(value == null ? '' : value).trim()
  return text && text !== '-' ? text : ''
}

export default {
  name: 'GraduateCheckInDashboard',
  data () {
    return {
      loading: false,
      errorMessage: '',
      searchText: '',
      activeMode: 'rehearsal',
      currentPage: 1,
      pageSize: 100,
      registrations: []
    }
  },
  computed: {
    checkInModes () {
      return [
        { value: 'rehearsal', label: this.$t('graduation.checkin.modes.rehearsal.label'), note: this.$t('graduation.checkin.modes.rehearsal.note') },
        { value: 'ceremony', label: this.$t('graduation.checkin.modes.ceremony.label'), note: this.$t('graduation.checkin.modes.ceremony.note') }
      ]
    },
    isEnglishLocale () {
      return String((this.$i18n && this.$i18n.locale) || '').toLowerCase().startsWith('en')
    },
    metricCards () {
      const total = this.registrations.length
      const stats = this.mockCheckInStats
      return [
        { key: 'total', icon: 'cil-people', label: this.$t('graduation.checkin.metrics.total'), value: total.toLocaleString('en-US'), hint: this.$t('graduation.checkin.metrics.totalHint') },
        { key: 'checked', icon: 'cil-check-circle', label: this.$t('graduation.checkin.metrics.checked'), value: stats.checkedIn.toLocaleString('en-US'), hint: this.$t('graduation.checkin.metrics.checkedHint', { rate: stats.rate, mode: stats.label }) },
        { key: 'pending', icon: 'cil-clock', label: this.$t('graduation.checkin.metrics.pending'), value: stats.pending.toLocaleString('en-US'), hint: this.$t('graduation.checkin.metrics.pendingHint') },
        { key: 'review', icon: 'cil-warning', label: this.$t('graduation.checkin.metrics.review'), value: stats.review.toLocaleString('en-US'), hint: this.$t('graduation.checkin.metrics.reviewHint') }
      ]
    },
    mockCheckInStats () {
      return this.simulatedModeStats.find(item => item.key === this.activeMode) || this.simulatedModeStats[0]
    },
    simulatedModeStats () {
      const total = this.registrations.length
      const configs = [
        { key: 'rehearsal', label: this.$t('graduation.checkin.modes.rehearsal.label'), checkedRatio: 0.78, reviewRatio: 0.035 },
        { key: 'ceremony', label: this.$t('graduation.checkin.modes.ceremony.label'), checkedRatio: 0.64, reviewRatio: 0.018 }
      ]
      return configs.map(config => {
        const checkedIn = Math.min(Math.round(total * config.checkedRatio), total)
        const review = Math.min(Math.round(total * config.reviewRatio), Math.max(total - checkedIn, 0))
        const pending = Math.max(total - checkedIn, 0)
        const rate = total ? Math.round((checkedIn / total) * 100) : 0
        return Object.assign({}, config, { total, checkedIn, pending, review, rate })
      })
    },
    filteredRegistrations () {
      const query = textValue(this.searchText).toLowerCase()
      if (!query) return this.registrations
      return this.registrations.filter(item => [
        item && item.firstName,
        item && item.lastName,
        item && item.phone,
        item && item.email,
        item && item.school,
        item && item.schoolEnglish,
        item && item.program,
        item && item.programEnglish
      ].some(value => textValue(value).toLowerCase().includes(query)))
    },
    totalPages () {
      return Math.max(Math.ceil(this.filteredRegistrations.length / this.pageSize), 1)
    },
    pagedRegistrations () {
      const start = (this.currentPage - 1) * this.pageSize
      return this.filteredRegistrations.slice(start, start + this.pageSize)
    },
    pageStartDisplay () {
      return this.filteredRegistrations.length ? ((this.currentPage - 1) * this.pageSize) + 1 : 0
    },
    pageEndDisplay () {
      return Math.min(this.currentPage * this.pageSize, this.filteredRegistrations.length)
    }
  },
  watch: {
    searchText () {
      this.currentPage = 1
    },
    filteredRegistrations () {
      if (this.currentPage > this.totalPages) this.currentPage = this.totalPages
    }
  },
  mounted () {
    this.fetchRegistrations()
  },
  methods: {
    async fetchRegistrations () {
      this.loading = true
      this.errorMessage = ''
      try {
        const response = await api.graduateRegistrations('list', { limit: 4000 })
        this.registrations = unwrapRows(response)
      } catch (error) {
        this.errorMessage = this.$t('graduation.checkin.loadError')
        this.registrations = []
      } finally {
        this.loading = false
      }
    },
    fullName (item) {
      return [item && item.firstName, item && item.lastName].filter(Boolean).join(' ')
    },
    localizedSchool (item) {
      return this.isEnglishLocale && textValue(item && item.schoolEnglish)
        ? textValue(item.schoolEnglish)
        : textValue(item && item.school)
    },
    localizedProgram (item) {
      return this.isEnglishLocale && textValue(item && item.programEnglish)
        ? textValue(item.programEnglish)
        : textValue(item && item.program)
    }
  }
}
</script>

<style scoped>
.checkin-dashboard-page {
  padding: 0.25rem;
}
.checkin-dashboard-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 18px;
}
.checkin-dashboard-header__eyebrow {
  margin-bottom: 4px;
  color: #8c1515;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}
.checkin-dashboard-header h1 {
  margin: 0;
  color: #111827;
  font-size: 30px;
  font-weight: 800;
}
.checkin-dashboard-header p {
  max-width: 820px;
  margin: 6px 0 0;
  color: #6b7280;
}
.checkin-dashboard-header__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.mode-strip {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}
.mode-button {
  display: grid;
  gap: 3px;
  padding: 14px 16px;
  border: 1px solid #d8dee9;
  border-radius: 8px;
  background: #fff;
  text-align: left;
}
.mode-button span {
  color: #111827;
  font-weight: 800;
}
.mode-button small {
  color: #6b7280;
}
.mode-button.is-active {
  border-color: #8c1515;
  background: #fff8f8;
}
.metric-grid,
.simulation-grid,
.dashboard-layout {
  display: grid;
  gap: 16px;
}
.metric-grid {
  width: 100%;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  margin-bottom: 16px;
}
.simulation-grid {
  width: 100%;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  margin-bottom: 16px;
}
.metric-card,
.simulation-card,
.dashboard-panel {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}
.metric-card {
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
  padding: 16px;
}
.metric-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  color: #8c1515;
  background: #fff1f1;
}
.metric-card span,
.metric-card small,
.panel-heading p,
.roster-table span {
  color: #6b7280;
}
.metric-card strong {
  display: block;
  color: #111827;
  font-size: 24px;
  font-weight: 800;
}
.simulation-card {
  display: grid;
  gap: 12px;
  min-width: 0;
  padding: 16px;
}
.simulation-card.is-active {
  border-color: #8c1515;
  box-shadow: 0 12px 26px rgba(140, 21, 21, 0.12);
}
.simulation-card > div:first-child {
  display: grid;
  gap: 2px;
}
.simulation-card span,
.simulation-card small {
  color: #6b7280;
}
.simulation-card strong {
  color: #111827;
  font-size: 26px;
  font-weight: 900;
}
.simulation-card__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.simulation-card__meta b {
  color: #8c1515;
  font-size: 18px;
}
.simulation-card i {
  display: block;
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: #e5e7eb;
}
.simulation-card em {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #8c1515, #c9a227);
}
.dashboard-layout {
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
}
.dashboard-panel {
  padding: 18px;
}
.panel-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.panel-heading.compact {
  display: block;
}
.panel-heading h2 {
  margin: 0;
  color: #111827;
  font-size: 18px;
  font-weight: 800;
}
.panel-heading p {
  margin: 4px 0 0;
}
.roster-search {
  width: 260px;
  flex: 0 0 auto;
}
.roster-table-wrap {
  overflow-x: auto;
}
.roster-table {
  width: 100%;
  min-width: 820px;
  border-collapse: collapse;
}
.roster-table th,
.roster-table td {
  padding: 13px 12px;
  border-bottom: 1px solid #eef2f7;
  vertical-align: top;
  text-align: left;
}
.roster-table th {
  color: #6b7280;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}
.roster-table td strong,
.roster-table td span {
  display: block;
}
.row-actions {
  white-space: nowrap;
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
.empty-cell {
  color: #6b7280;
  text-align: center !important;
}
@media (max-width: 768px) {
  .checkin-dashboard-header,
  .panel-heading {
    display: grid;
  }
  .mode-strip {
    grid-template-columns: 1fr;
  }
  .roster-search {
    width: 100%;
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
</style>
