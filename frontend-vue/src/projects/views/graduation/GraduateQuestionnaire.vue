<template>
  <div class="graduate-questionnaire-page">
    <div class="questionnaire-header">
      <h1>{{ pageTitle }}</h1>
    </div>

    <CCard class="questionnaire-card">
      <CCardBody>
        <div v-if="loading" class="questionnaire-loading">
          <CSpinner color="primary" size="sm" class="mr-2" />
          {{ loadingLabel }}
        </div>
        <template v-else>
          <div class="questionnaire-heading">
            <h2>{{ pageTitle }}<span class="required-mark">*</span></h2>
          </div>
          <CRow>
            <CCol md="6">
              <div class="form-group">
                <label for="questionnaire-employment-status">{{ employmentStatusLabel }}</label>
                <select
                  id="questionnaire-employment-status"
                  v-model="employmentStatus"
                  class="form-control"
                  :class="{ 'is-invalid': validationAttempted && !employmentStatus }"
                >
                  <option
                    v-for="option in employmentOptions"
                    :key="option.value || 'empty'"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </div>
              <div v-if="validationAttempted && !employmentStatus" class="invalid-feedback d-block">
                {{ requiredLabel }}
              </div>
            </CCol>
            <CCol md="6">
              <CTextarea
                v-model.trim="note"
                :label="noteLabel"
                rows="3"
              />
            </CCol>
          </CRow>
          <div class="questionnaire-actions">
            <CButton color="primary" :disabled="saving || !employmentStatus" @click="saveQuestionnaire">
              <CIcon name="cil-save" class="mr-2" />
              {{ saving ? savingLabel : saveLabel }}
            </CButton>
          </div>
        </template>
      </CCardBody>
    </CCard>
  </div>
</template>

<script>
import api from '@/service/api'
import { notifyError, notifySuccess } from '@/projects/utils/notify'
import { getGraduationProgress, markGraduationStep } from '@/projects/utils/graduation-workflow-progress'

const QUESTIONNAIRE_CACHE_PREFIX = 'graduate-questionnaire-saved'

function questionnaireIdentity (profile) {
  const source = profile && typeof profile === 'object' ? profile : {}
  const userinfo = source.userinfo && typeof source.userinfo === 'object' ? source.userinfo : {}
  return String(
    source.studentCode || source.barcodeValue || userinfo.studentCode || userinfo.barcodeValue ||
    source.email || userinfo.email || source._id || source.id || source.username || 'anonymous'
  ).trim().toLowerCase()
}

function normalizeEmploymentStatus (value) {
  const normalized = String(value == null ? '' : value).trim().toLowerCase()
  const aliases = {
    employed: 'employed',
    'ทำงานแล้ว': 'employed',
    'not-employed': 'not-employed',
    'not employed': 'not-employed',
    'not employed yet': 'not-employed',
    'ยังไม่ได้ทำงาน': 'not-employed',
    study: 'study',
    'continuing study': 'study',
    'ศึกษาต่อ': 'study'
  }
  return aliases[normalized] || ''
}

export default {
  name: 'GraduateQuestionnaire',
  data () {
    return {
      registration: null,
      employmentStatus: '',
      note: '',
      loading: false,
      saving: false,
      validationAttempted: false
    }
  },
  computed: {
    currentProfile () {
      return this.$store && this.$store.getters ? this.$store.getters['auth/profile'] : null
    },
    questionnaireCacheKey () {
      return `${QUESTIONNAIRE_CACHE_PREFIX}:${encodeURIComponent(questionnaireIdentity(this.currentProfile))}`
    },
    isEnglish () {
      return String((this.$i18n && this.$i18n.locale) || '').toLowerCase().startsWith('en')
    },
    pageTitle () { return this.isEnglish ? 'Questionnaire' : 'แบบสอบถาม' },
    employmentStatusLabel () { return this.isEnglish ? 'Current employment status' : 'สถานะการทำงานปัจจุบัน' },
    noteLabel () { return this.isEnglish ? 'Additional note' : 'หมายเหตุเพิ่มเติม' },
    loadingLabel () { return this.isEnglish ? 'Loading questionnaire...' : 'กำลังโหลดแบบสอบถาม...' },
    requiredLabel () { return this.isEnglish ? 'Please complete this field.' : 'กรุณาระบุข้อมูล' },
    saveLabel () { return this.isEnglish ? 'Save questionnaire' : 'บันทึกแบบสอบถาม' },
    savingLabel () { return this.isEnglish ? 'Saving...' : 'กำลังบันทึก...' },
    employmentOptions () {
      return [
        { label: this.isEnglish ? 'Please specify' : 'กรุณาระบุ', value: '' },
        { label: this.isEnglish ? 'Employed' : 'ทำงานแล้ว', value: 'employed' },
        { label: this.isEnglish ? 'Not employed yet' : 'ยังไม่ได้ทำงาน', value: 'not-employed' },
        { label: this.isEnglish ? 'Continuing study' : 'ศึกษาต่อ', value: 'study' }
      ]
    }
  },
  mounted () {
    this.loadQuestionnaire()
  },
  methods: {
    readSavedQuestionnaire () {
      if (typeof window === 'undefined' || !window.localStorage) return null
      try {
        return JSON.parse(window.localStorage.getItem(this.questionnaireCacheKey) || 'null')
      } catch (error) {
        return null
      }
    },
    cacheSavedQuestionnaire () {
      if (typeof window === 'undefined' || !window.localStorage) return
      window.localStorage.setItem(this.questionnaireCacheKey, JSON.stringify({
        employmentStatus: String(this.employmentStatus || ''),
        note: String(this.note || ''),
        savedAt: new Date().toISOString()
      }))
    },
    async loadQuestionnaire () {
      this.loading = true
      try {
        const response = await api.graduateRegistrations('defaults', { _: Date.now() })
        const row = response && response.data ? response.data.data : null
        const savedProgress = getGraduationProgress(this.currentProfile)
        const savedQuestionnaire = this.readSavedQuestionnaire()
        this.registration = row || null
        this.employmentStatus = normalizeEmploymentStatus(savedQuestionnaire && savedQuestionnaire.employmentStatus) ||
          normalizeEmploymentStatus(row && row.questionnaireEmploymentStatus) ||
          normalizeEmploymentStatus(savedProgress.questionnaireEmploymentStatus)
        this.note = savedQuestionnaire
          ? String(savedQuestionnaire.note || '')
          : row && row.questionnaireNote
          ? String(row.questionnaireNote)
          : String(savedProgress.questionnaireNote || '')
        if (this.employmentStatus) {
          markGraduationStep(this.currentProfile, 'questionnaireSaved')
        }
      } catch (error) {
        notifyError(this.$store, this.isEnglish ? 'Unable to load questionnaire.' : 'ไม่สามารถโหลดแบบสอบถามได้')
      } finally {
        this.loading = false
      }
    },
    async saveQuestionnaire () {
      this.validationAttempted = true
      this.employmentStatus = normalizeEmploymentStatus(this.employmentStatus)
      if (!this.employmentStatus) return
      this.saving = true
      try {
        const payload = Object.assign({}, this.registration || {}, {
          questionnaireEmploymentStatus: this.employmentStatus,
          questionnaireNote: this.note
        })
        const id = this.registration && (this.registration._id || this.registration.id)
        const response = id
          ? await api.graduateRegistrations('update', Object.assign({ _id: id }, payload))
          : await api.graduateRegistrations('create', payload)
        const savedRow = response && response.data ? response.data.data : null
        if (!savedRow) throw new Error('Questionnaire was not saved')
        this.registration = savedRow
        this.validationAttempted = false
        this.cacheSavedQuestionnaire()
        markGraduationStep(this.currentProfile, 'questionnaireSaved', {
          questionnaireEmploymentStatus: this.employmentStatus,
          questionnaireNote: this.note
        })
        notifySuccess(this.$store, this.isEnglish ? 'Questionnaire saved.' : 'บันทึกแบบสอบถามเรียบร้อยแล้ว')
        const navigation = this.$router.push('/graduation/register')
        if (navigation && typeof navigation.catch === 'function') navigation.catch(() => {})
      } catch (error) {
        notifyError(this.$store, this.isEnglish ? 'Unable to save questionnaire.' : 'ไม่สามารถบันทึกแบบสอบถามได้')
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style scoped>
.graduate-questionnaire-page {
  padding: 0.25rem;
}
.questionnaire-header {
  margin-bottom: 20px;
}
.questionnaire-header h1 {
  margin: 0;
  color: #1f2937;
  font-size: 30px;
  font-weight: 700;
}
.questionnaire-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
}
.questionnaire-heading {
  margin-bottom: 16px;
}
.questionnaire-heading h2 {
  margin: 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 800;
}
.required-mark {
  margin-left: 4px;
  color: #e55353;
}
.questionnaire-loading {
  display: flex;
  align-items: center;
  min-height: 120px;
  justify-content: center;
  color: #6b7280;
}
.questionnaire-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}
.questionnaire-actions .btn {
  min-width: 200px;
  min-height: 46px;
  border-color: #a31313;
  border-radius: 9px;
  background: #a31313;
  box-shadow: 0 4px 10px rgba(163, 19, 19, 0.2);
  font-weight: 700;
}
.questionnaire-actions .btn:hover,
.questionnaire-actions .btn:focus {
  border-color: #861010;
  background: #861010;
}
.questionnaire-actions .btn:disabled,
.questionnaire-actions .btn.disabled {
  border-color: #b76a6a;
  background: #b76a6a;
  box-shadow: 0 4px 10px rgba(140, 21, 21, 0.12);
  cursor: not-allowed;
  opacity: 0.78;
}
</style>
