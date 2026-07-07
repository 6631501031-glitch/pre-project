<template>
  <div class="face-checkin-page">
    <div class="checkin-header">
      <div>
        <div class="checkin-header__eyebrow">Face Check-in</div>
        <h1>สแกนใบหน้า</h1>
        <p>ถ่ายรูปใบหน้าหลังจากกรอกแบบสอบถามข้อมูลบัณฑิตครบถ้วนแล้ว</p>
      </div>
      <CButton color="secondary" variant="outline" @click="$router.push('/graduation/register')">
        กลับไปแก้แบบสอบถาม
      </CButton>
    </div>

    <CRow>
      <CCol lg="5" class="mb-3">
        <CCard class="checkin-card">
          <CCardBody>
            <div class="section-heading">
              <h2>ข้อมูลบัณฑิต</h2>
            </div>
            <div class="profile-summary">
              <div>
                <span>ชื่อ</span>
                <strong>{{ fullName || '-' }}</strong>
              </div>
              <div>
                <span>สำนักวิชา</span>
                <strong>{{ displaySchool || '-' }}</strong>
              </div>
              <div>
                <span>สาขา</span>
                <strong>{{ displayProgram || '-' }}</strong>
              </div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol lg="7" class="mb-3">
        <CCard class="checkin-card">
          <CCardBody>
            <div class="section-heading">
              <h2>สแกนใบหน้า</h2>
              <CBadge :color="photoPreview ? 'success' : 'warning'">
                {{ photoPreview ? 'มีรูปแล้ว' : 'รอถ่ายรูป' }}
              </CBadge>
            </div>
            <div class="camera-preview">
              <video
                v-show="cameraActive && !photoPreview"
                ref="cameraVideo"
                autoplay
                playsinline
                muted
              ></video>
              <img v-if="photoPreview" :src="photoPreview" alt="Graduate face capture">
              <div v-if="!cameraActive && !photoPreview" class="camera-placeholder">
                <CIcon name="cil-camera" />
                <span>เปิดกล้องเพื่อถ่ายรูปใบหน้า</span>
              </div>
            </div>
            <canvas ref="cameraCanvas" class="d-none"></canvas>
            <div v-if="cameraError" class="alert alert-warning mt-3 mb-0">{{ cameraError }}</div>
            <div class="camera-actions">
              <CButton color="primary" variant="outline" :disabled="cameraLoading || cameraActive" @click="startCamera">
                <CIcon name="cil-camera" class="mr-2" />
                เปิดกล้อง
              </CButton>
              <CButton color="success" :disabled="!cameraActive" @click="captureFacePhoto">
                <CIcon name="cil-check-circle" class="mr-2" />
                บันทึกใบหน้า
              </CButton>
              <CButton color="secondary" variant="outline" :disabled="!photoPreview && !cameraActive" @click="retakeFacePhoto">
                <CIcon name="cil-reload" class="mr-2" />
                ถ่ายใหม่
              </CButton>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  </div>
</template>

<script>
import api from '@/service/api'

const STORAGE_KEY = 'graduate-self-registration-draft'

function emptyForm () {
  return {
    firstName: '',
    lastName: '',
    phone: '',
    school: '',
    schoolEnglish: '',
    program: '',
    programEnglish: ''
  }
}

export default {
  name: 'GraduateFaceCheckIn',
  data () {
    return {
      form: emptyForm(),
      registrationId: '',
      photoPreview: '',
      cameraActive: false,
      cameraLoading: false,
      cameraError: '',
      cameraStream: null
    }
  },
  computed: {
    fullName () {
      return [this.form.firstName, this.form.lastName].filter(Boolean).join(' ')
    },
    isEnglishLocale () {
      return String((this.$i18n && this.$i18n.locale) || '').toLowerCase().startsWith('en')
    },
    displaySchool () {
      return this.isEnglishLocale && this.form.schoolEnglish ? this.form.schoolEnglish : this.form.school
    },
    displayProgram () {
      return this.isEnglishLocale && this.form.programEnglish ? this.form.programEnglish : this.form.program
    },
    barcodeValue () {
      const base = [this.form.firstName, this.form.lastName, this.form.phone]
        .join('-')
        .replace(/\s+/g, '')
        .toUpperCase()
      return `GRAD-${base || 'PENDING'}`
    }
  },
  mounted () {
    this.restoreDraft()
  },
  beforeDestroy () {
    this.stopCamera()
  },
  methods: {
    restoreDraft () {
      try {
        const payload = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')
        this.form = Object.assign(emptyForm(), payload.form || {})
        this.registrationId = payload.currentRegistrationId || ''
        this.photoPreview = payload.photoPreview || ''
      } catch (error) {
        this.form = emptyForm()
      }
    },
    persistPhoto () {
      let payload = {}
      try {
        payload = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')
      } catch (error) {
        payload = {}
      }
      payload.form = Object.assign({}, payload.form || {}, this.form)
      payload.currentRegistrationId = this.registrationId || payload.currentRegistrationId || ''
      payload.photoPreview = this.photoPreview
      payload.barcodeValue = this.barcodeValue
      payload.savedAt = new Date().toISOString()
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      return payload
    },
    async startCamera () {
      this.cameraError = ''
      this.cameraLoading = true
      this.photoPreview = ''
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('BROWSER_CAMERA_UNSUPPORTED')
        }
        this.stopCamera()
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 960 },
            height: { ideal: 1200 }
          },
          audio: false
        })
        this.cameraStream = stream
        this.cameraActive = true
        await this.$nextTick()
        if (this.$refs.cameraVideo) {
          this.$refs.cameraVideo.srcObject = stream
          await this.$refs.cameraVideo.play()
        }
      } catch (error) {
        this.cameraActive = false
        this.cameraStream = null
        this.cameraError = 'ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการใช้งานกล้องและลองใหม่'
      } finally {
        this.cameraLoading = false
      }
    },
    stopCamera () {
      if (this.cameraStream && this.cameraStream.getTracks) {
        this.cameraStream.getTracks().forEach(track => track.stop())
      }
      this.cameraStream = null
      this.cameraActive = false
      if (this.$refs.cameraVideo) {
        this.$refs.cameraVideo.srcObject = null
      }
    },
    async captureFacePhoto () {
      const video = this.$refs.cameraVideo
      const canvas = this.$refs.cameraCanvas
      if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
        this.cameraError = 'ยังไม่พบภาพจากกล้อง กรุณารอสักครู่แล้วลองใหม่'
        return
      }
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const context = canvas.getContext('2d')
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      this.photoPreview = canvas.toDataURL('image/jpeg', 0.92)
      this.cameraError = ''
      this.stopCamera()
      const payload = this.persistPhoto()
      await this.saveFacePhoto(payload)
    },
    async saveFacePhoto (draftPayload) {
      if (!this.registrationId || !this.photoPreview) return
      const formPayload = Object.assign({}, draftPayload && draftPayload.form ? draftPayload.form : this.form, {
        _id: this.registrationId,
        barcodeValue: this.barcodeValue,
        facePhoto: this.photoPreview
      })
      try {
        await api.graduateRegistrations('update', formPayload)
      } catch (error) {
        this.cameraError = 'บันทึกรูปใบหน้าลง MongoDB ไม่สำเร็จ แต่รูปยังแสดงบนหน้านี้แล้ว'
      }
    },
    retakeFacePhoto () {
      this.photoPreview = ''
      this.cameraError = ''
      this.startCamera()
    }
  }
}
</script>

<style scoped>
.face-checkin-page {
  padding: 0.25rem;
}
.checkin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}
.checkin-header h1 {
  margin: 0;
  color: #1f2937;
  font-size: 30px;
  font-weight: 700;
}
.checkin-header p {
  max-width: 760px;
  margin: 6px 0 0;
  color: #6b7280;
}
.checkin-header__eyebrow {
  margin-bottom: 4px;
  color: #8c1515;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}
.checkin-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: none;
}
.section-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}
.section-heading h2 {
  margin: 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 700;
}
.profile-summary {
  display: grid;
  gap: 12px;
}
.profile-summary div {
  display: grid;
  gap: 2px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eef2f7;
}
.profile-summary span {
  color: #6b7280;
  font-size: 12px;
}
.profile-summary strong {
  color: #111827;
  overflow-wrap: anywhere;
}
.camera-preview {
  display: grid;
  place-items: center;
  min-height: 360px;
  overflow: hidden;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
}
.camera-preview video,
.camera-preview img {
  width: 100%;
  max-height: 460px;
  object-fit: cover;
}
.camera-placeholder {
  display: grid;
  place-items: center;
  gap: 10px;
  color: #64748b;
}
.camera-placeholder .c-icon {
  width: 48px;
  height: 48px;
}
.camera-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
}
@media (max-width: 768px) {
  .checkin-header,
  .camera-actions {
    flex-direction: column;
  }
}
</style>
