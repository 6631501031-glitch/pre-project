<template>
  <div class="graduationsystemusingfacerecognition-registry-page">
    <div class="graduationsystemusingfacerecognition-header">
      <div>
        <div class="graduationsystemusingfacerecognition-header__eyebrow">GRADUATION SYSTEM USING FACE RECOGNITION GRADUATION SYSTEM USING FACE RECOGNITION Management</div>
        <h1>GRADUATION SYSTEM USING FACE RECOGNITION GRADUATION SYSTEM USING FACE RECOGNITION Registry</h1>
        <p>Track agreements, ownership, review state, and renewal timing in one IAM-protected workspace.</p>
      </div>
      <div class="graduationsystemusingfacerecognition-header__actions">
        <CButton color="primary" variant="outline" :disabled="loading" @click="fetchAll">
          <CIcon name="cil-reload" class="mr-2" />
          Refresh
        </CButton>
        <CButton color="success" variant="outline" :disabled="saving" @click="seedDemo">
          <CIcon name="cil-plus" class="mr-2" />
          Seed Demo
        </CButton>
      </div>
    </div>

    <CRow>
      <CCol v-for="item in statCards" :key="item.key" xl="3" md="6" class="mb-3">
        <CCard class="graduationsystemusingfacerecognition-card graduationsystemusingfacerecognition-stat">
          <CCardBody>
            <div class="graduationsystemusingfacerecognition-stat__label">{{ item.label }}</div>
            <div class="graduationsystemusingfacerecognition-stat__value">{{ item.value }}</div>
            <div class="graduationsystemusingfacerecognition-stat__hint">{{ item.hint }}</div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>

    <CRow>
      <CCol lg="4" class="mb-3">
        <CCard class="graduationsystemusingfacerecognition-card h-100">
          <CCardBody>
            <h2>{{ form._id ? 'Update GRADUATIONSYSTEMUSINGFACERECOGNITIONGRADUATIONSYSTEMUSINGFACERECOGNITION' : 'Create GRADUATIONSYSTEMUSINGFACERECOGNITIONGRADUATIONSYSTEMUSINGFACERECOGNITION' }}</h2>
            <CInput v-model.trim="form.graduationsystemusingfacerecognitionNo" label="GRADUATIONSYSTEMUSINGFACERECOGNITIONGRADUATIONSYSTEMUSINGFACERECOGNITION No." placeholder="GRADUATIONSYSTEMUSINGFACERECOGNITIONGRADUATIONSYSTEMUSINGFACERECOGNITION-INT-2026-001" />
            <CInput v-model.trim="form.title" label="Title" placeholder="Academic Collaboration" />
            <CInput v-model.trim="form.partnerName" label="Partner" placeholder="Partner organization" />
            <CInput v-model.trim="form.partnerType" label="Partner Type" placeholder="University, Institute, Company" />
            <CInput v-model.trim="form.country" label="Country" placeholder="Thailand" />
            <CInput v-model.trim="form.ownerUnit" label="Owner Unit" placeholder="International Affairs Division" />
            <CInput v-model.trim="form.coordinatorName" label="Coordinator" placeholder="Coordinator name" />
            <CInput v-model.trim="form.coordinatorEmail" type="email" label="Coordinator Email" placeholder="graduationsystemusingfacerecognition@mfu.ac.th" />
            <CSelect v-model="form.status" label="Status" :options="statusOptions" />
            <CInput v-model="form.effectiveDate" type="date" label="Effective Date" />
            <CInput v-model="form.expiryDate" type="date" label="Expiry Date" />
            <CInput v-model.trim="form.tags" label="Tags" placeholder="academic, exchange" />
            <CTextarea v-model.trim="form.notes" label="Notes" rows="3" />
            <div class="graduationsystemusingfacerecognition-form-actions">
              <CButton color="primary" :disabled="saving" @click="saveDocument">
                <CIcon name="cil-save" class="mr-2" />
                {{ form._id ? 'Update' : 'Create' }}
              </CButton>
              <CButton color="secondary" variant="outline" @click="resetForm">Clear</CButton>
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol lg="8" class="mb-3">
        <CCard class="graduationsystemusingfacerecognition-card h-100">
          <CCardBody>
            <div class="graduationsystemusingfacerecognition-toolbar">
              <CInput v-model.trim="filters.q" placeholder="Search GRADUATIONSYSTEMUSINGFACERECOGNITIONGRADUATIONSYSTEMUSINGFACERECOGNITION no., title, partner, owner" class="graduationsystemusingfacerecognition-search" @keyup.enter="fetchDocuments" />
              <CSelect v-model="filters.status" :options="filterStatusOptions" class="graduationsystemusingfacerecognition-status" />
              <CButton color="primary" @click="fetchDocuments">Search</CButton>
            </div>

            <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
            <div class="graduationsystemusingfacerecognition-table-wrap">
              <table class="graduationsystemusingfacerecognition-table">
                <thead>
                  <tr>
                    <th>GRADUATIONSYSTEMUSINGFACERECOGNITIONGRADUATIONSYSTEMUSINGFACERECOGNITION</th>
                    <th>Partner</th>
                    <th>Owner</th>
                    <th>Period</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loading">
                    <td colspan="6" class="graduationsystemusingfacerecognition-empty">Loading</td>
                  </tr>
                  <tr v-else-if="!documents.length">
                    <td colspan="6" class="graduationsystemusingfacerecognition-empty">No GRADUATIONSYSTEMUSINGFACERECOGNITIONGRADUATIONSYSTEMUSINGFACERECOGNITION records found</td>
                  </tr>
                  <tr v-for="item in documents" :key="item._id">
                    <td>
                      <strong>{{ item.graduationsystemusingfacerecognitionNo }}</strong>
                      <span>{{ item.title }}</span>
                    </td>
                    <td>
                      <strong>{{ item.partnerName }}</strong>
                      <span>{{ item.partnerType || '-' }} · {{ item.country || '-' }}</span>
                    </td>
                    <td>{{ item.ownerUnit || '-' }}</td>
                    <td>
                      <strong>{{ formatDate(item.effectiveDate) }}</strong>
                      <span>to {{ formatDate(item.expiryDate) }}</span>
                    </td>
                    <td>
                      <CBadge :color="statusColor(item.status)">{{ statusLabel(item.status) }}</CBadge>
                    </td>
                    <td class="graduationsystemusingfacerecognition-row-actions">
                      <CButton size="sm" color="primary" variant="outline" @click="editDocument(item)">
                        <CIcon name="cil-pencil" />
                      </CButton>
                      <CButton size="sm" color="danger" variant="outline" @click="removeDocument(item)">
                        <CIcon name="cil-trash" />
                      </CButton>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  </div>
</template>

<script>
import api from '@/service/api'

const EMPTY_FORM = {
  _id: '',
  graduationsystemusingfacerecognitionNo: '',
  title: '',
  partnerName: '',
  partnerType: 'University',
  country: 'Thailand',
  ownerUnit: '',
  coordinatorName: '',
  coordinatorEmail: '',
  status: 'draft',
  effectiveDate: '',
  expiryDate: '',
  tags: '',
  notes: ''
}

function unwrap(response) {
  return response && response.data && response.data.data ? response.data.data : {}
}

function toInputDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export default {
  name: 'GRADUATIONSYSTEMUSINGFACERECOGNITIONGRADUATIONSYSTEMUSINGFACERECOGNITIONRegistry',
  data () {
    return {
      loading: false,
      saving: false,
      errorMessage: '',
      documents: [],
      stats: {
        total: 0,
        active: 0,
        review: 0,
        expiring: 0,
        expired: 0
      },
      filters: {
        q: '',
        status: 'all'
      },
      form: Object.assign({}, EMPTY_FORM),
      statusOptions: [
        { label: 'Draft', value: 'draft' },
        { label: 'In Review', value: 'review' },
        { label: 'Active', value: 'active' },
        { label: 'Expiring', value: 'expiring' },
        { label: 'Expired', value: 'expired' },
        { label: 'Archived', value: 'archived' }
      ],
      filterStatusOptions: [
        { label: 'All Statuses', value: 'all' },
        { label: 'Draft', value: 'draft' },
        { label: 'In Review', value: 'review' },
        { label: 'Active', value: 'active' },
        { label: 'Expiring', value: 'expiring' },
        { label: 'Expired', value: 'expired' },
        { label: 'Archived', value: 'archived' }
      ]
    }
  },
  computed: {
    statCards () {
      return [
        { key: 'total', label: 'Total GRADUATIONSYSTEMUSINGFACERECOGNITIONGRADUATIONSYSTEMUSINGFACERECOGNITIONs', value: this.stats.total, hint: 'All registry records' },
        { key: 'active', label: 'Active', value: this.stats.active, hint: 'Valid agreements' },
        { key: 'review', label: 'In Review', value: this.stats.review, hint: 'Waiting for approval' },
        { key: 'expiring', label: 'Expiring', value: this.stats.expiring, hint: 'Renewal within 90 days' }
      ]
    }
  },
  mounted () {
    this.fetchAll()
  },
  methods: {
    async fetchAll () {
      await Promise.all([this.fetchStats(), this.fetchDocuments()])
    },
    async fetchStats () {
      try {
        const response = await api.graduationsystemusingfacerecognitionDocuments('stats')
        this.stats = Object.assign({}, this.stats, unwrap(response))
      } catch (error) {
        this.handleError(error)
      }
    },
    async fetchDocuments () {
      this.loading = true
      this.errorMessage = ''
      try {
        const response = await api.graduationsystemusingfacerecognitionDocuments('list', {
          q: this.filters.q,
          status: this.filters.status,
          limit: 100
        })
        const data = unwrap(response)
        this.documents = Array.isArray(data.rows) ? data.rows : []
      } catch (error) {
        this.handleError(error)
      } finally {
        this.loading = false
      }
    },
    async saveDocument () {
      this.saving = true
      this.errorMessage = ''
      try {
        const payload = Object.assign({}, this.form, {
          tags: String(this.form.tags || '').split(',').map(item => item.trim()).filter(Boolean)
        })
        if (payload._id) {
          payload.id = payload._id
          await api.graduationsystemusingfacerecognitionDocuments('update', payload)
        } else {
          await api.graduationsystemusingfacerecognitionDocuments('create', payload)
        }
        this.resetForm()
        await this.fetchAll()
      } catch (error) {
        this.handleError(error)
      } finally {
        this.saving = false
      }
    },
    editDocument (item) {
      this.form = Object.assign({}, EMPTY_FORM, item, {
        effectiveDate: toInputDate(item.effectiveDate),
        expiryDate: toInputDate(item.expiryDate),
        tags: Array.isArray(item.tags) ? item.tags.join(', ') : ''
      })
    },
    async removeDocument (item) {
      if (!item || !item._id) return
      this.saving = true
      this.errorMessage = ''
      try {
        await api.graduationsystemusingfacerecognitionDocuments('delete', item)
        await this.fetchAll()
      } catch (error) {
        this.handleError(error)
      } finally {
        this.saving = false
      }
    },
    async seedDemo () {
      this.saving = true
      this.errorMessage = ''
      try {
        await api.graduationsystemusingfacerecognitionDocuments('seed-demo')
        await this.fetchAll()
      } catch (error) {
        this.handleError(error)
      } finally {
        this.saving = false
      }
    },
    resetForm () {
      this.form = Object.assign({}, EMPTY_FORM)
    },
    formatDate (value) {
      if (!value) return '-'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return '-'
      return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
    },
    statusLabel (status) {
      const match = this.statusOptions.find(item => item.value === status)
      return match ? match.label : status || '-'
    },
    statusColor (status) {
      return {
        draft: 'secondary',
        review: 'warning',
        active: 'success',
        expiring: 'danger',
        expired: 'dark',
        archived: 'secondary'
      }[status] || 'secondary'
    },
    handleError (error) {
      this.errorMessage = error && error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : 'Unable to complete the GRADUATIONSYSTEMUSINGFACERECOGNITIONGRADUATIONSYSTEMUSINGFACERECOGNITION request.'
    }
  }
}
</script>

<style scoped>
.graduationsystemusingfacerecognition-registry-page {
  padding: 0.25rem;
}

.graduationsystemusingfacerecognition-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.graduationsystemusingfacerecognition-header__eyebrow {
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.graduationsystemusingfacerecognition-header h1 {
  margin: 0.25rem 0;
  color: #0f172a;
  font-size: 1.75rem;
  font-weight: 700;
}

.graduationsystemusingfacerecognition-header p {
  max-width: 720px;
  margin: 0;
  color: #475569;
}

.graduationsystemusingfacerecognition-header__actions,
.graduationsystemusingfacerecognition-form-actions,
.graduationsystemusingfacerecognition-row-actions {
  display: flex;
  gap: 0.5rem;
}

.graduationsystemusingfacerecognition-card {
  border: 0;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.graduationsystemusingfacerecognition-card h2 {
  margin-bottom: 1rem;
  color: #0f172a;
  font-size: 1.1rem;
  font-weight: 700;
}

.graduationsystemusingfacerecognition-stat__label {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.graduationsystemusingfacerecognition-stat__value {
  margin: 0.35rem 0;
  color: #0f172a;
  font-size: 1.65rem;
  font-weight: 700;
}

.graduationsystemusingfacerecognition-stat__hint {
  color: #475569;
}

.graduationsystemusingfacerecognition-toolbar {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 180px auto;
  gap: 0.75rem;
  align-items: start;
  margin-bottom: 1rem;
}

.graduationsystemusingfacerecognition-table-wrap {
  overflow-x: auto;
}

.graduationsystemusingfacerecognition-table {
  width: 100%;
  border-collapse: collapse;
}

.graduationsystemusingfacerecognition-table th {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 700;
  text-align: left;
  text-transform: uppercase;
}

.graduationsystemusingfacerecognition-table th,
.graduationsystemusingfacerecognition-table td {
  padding: 0.85rem;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: top;
}

.graduationsystemusingfacerecognition-table strong,
.graduationsystemusingfacerecognition-table span {
  display: block;
}

.graduationsystemusingfacerecognition-table span {
  color: #64748b;
  font-size: 0.86rem;
}

.graduationsystemusingfacerecognition-empty {
  color: #64748b;
  text-align: center;
}

@media (max-width: 768px) {
  .graduationsystemusingfacerecognition-header {
    flex-direction: column;
  }

  .graduationsystemusingfacerecognition-header__actions,
  .graduationsystemusingfacerecognition-form-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .graduationsystemusingfacerecognition-toolbar {
    grid-template-columns: 1fr;
  }
}
</style>
