<template>
  <div class="face-registration-page">
    <div class="page-header">
      <div>
        <span class="page-header__step">ขั้นตอนสุดท้าย</span>
        <h1>ลงทะเบียนใบหน้า</h1>
        <p>ถ่ายภาพใบหน้าให้ชัดเจน เพื่อใช้ยืนยันตัวตนในวันเข้ารับพระราชทานปริญญาบัตร</p>
      </div>
      <CButton color="secondary" variant="outline" @click="backToRegistration">
        <CIcon name="cil-arrow-left" class="mr-2" />
        กลับไปหน้าข้อมูล
      </CButton>
    </div>

    <div class="progress-steps" aria-label="ขั้นตอนการลงทะเบียน">
      <div class="progress-step progress-step--done">
        <span><CIcon name="cil-check" /></span>
        <div><small>ขั้นตอนที่ 1</small><strong>แจ้งความประสงค์</strong></div>
      </div>
      <div class="progress-line"></div>
      <div class="progress-step progress-step--active">
        <span>2</span>
        <div><small>ขั้นตอนที่ 2</small><strong>ลงทะเบียนใบหน้า</strong></div>
      </div>
    </div>

    <CRow>
      <CCol lg="4" class="mb-3">
        <CCard class="content-card graduate-card">
          <CCardBody>
            <div class="graduate-avatar">
              <CIcon name="cil-user" />
            </div>
            <h2>{{ fullName || '-' }}</h2>
            <p class="student-code">{{ studentCode || 'ไม่พบรหัสนักศึกษา' }}</p>
            <div class="graduate-details">
              <div><span>สำนักวิชา</span><strong>{{ displaySchool || '-' }}</strong></div>
              <div><span>สาขาวิชา</span><strong>{{ displayProgram || '-' }}</strong></div>
              <div><span>สถานะ</span><strong class="attendance-status">เข้ารับพระราชทานปริญญาบัตร</strong></div>
            </div>
          </CCardBody>
        </CCard>

        <CCard class="content-card mt-3 tips-card">
          <CCardBody>
            <h3><CIcon name="cil-lightbulb" class="mr-2" />คำแนะนำในการถ่ายภาพ</h3>
            <ul>
              <li>อยู่ในบริเวณที่มีแสงสว่างเพียงพอ</li>
              <li>มองตรงและจัดใบหน้าให้อยู่กลางกรอบ</li>
              <li>ไม่สวมหมวก หน้ากาก หรือแว่นกันแดด</li>
              <li>ให้เห็นใบหน้าชัดเจนตั้งแต่ศีรษะถึงหัวไหล่</li>
            </ul>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol lg="8" class="mb-3">
        <CCard class="content-card camera-card">
          <CCardBody>
            <div class="camera-heading">
              <div>
                <h2>ถ่ายภาพใบหน้า</h2>
                <p>{{ cameraInstruction }}</p>
              </div>
              <span class="status-pill" :class="statusPillClass">
                <i></i>{{ statusLabel }}
              </span>
            </div>

            <div class="camera-stage" :class="{ 'camera-stage--active': cameraActive, 'camera-stage--captured': photoPreview }">
              <video v-show="cameraActive && !photoPreview" ref="cameraVideo" autoplay playsinline muted></video>
              <img v-if="photoPreview" :src="photoPreview" alt="ภาพใบหน้าสำหรับลงทะเบียน">
              <div v-if="!cameraActive && !photoPreview" class="camera-empty">
                <div class="camera-icon"><CIcon name="cil-camera" /></div>
                <h3>พร้อมลงทะเบียนใบหน้า</h3>
                <p>กด “เปิดกล้อง” และอนุญาตให้เว็บไซต์ใช้งานกล้อง</p>
              </div>
              <div v-if="cameraActive && !photoPreview" class="face-guide" aria-hidden="true"></div>
              <div v-if="photoPreview" class="capture-confirmation">
                <CIcon name="cil-check-circle" /> บันทึกภาพเรียบร้อยแล้ว
              </div>
            </div>
            <canvas ref="cameraCanvas" class="d-none"></canvas>

            <div v-if="cameraError" class="alert alert-warning mt-3 mb-0">{{ cameraError }}</div>
            <div v-if="saveSuccess" class="alert alert-success mt-3 mb-0">
              ลงทะเบียนใบหน้าสำเร็จ ข้อมูลของคุณถูกบันทึกเรียบร้อยแล้ว
            </div>

            <div class="camera-actions">
              <CButton v-if="!cameraActive && !photoPreview" color="primary" size="lg" :disabled="cameraLoading" @click="startCamera">
                <CIcon name="cil-camera" class="mr-2" />
                {{ cameraLoading ? 'กำลังเปิดกล้อง...' : 'เปิดกล้อง' }}
              </CButton>
              <CButton v-if="cameraActive" color="success" size="lg" @click="captureFacePhoto">
                <CIcon name="cil-camera" class="mr-2" />ถ่ายและบันทึกภาพ
              </CButton>
              <CButton v-if="photoPreview" color="secondary" variant="outline" size="lg" @click="retakeFacePhoto">
                <CIcon name="cil-reload" class="mr-2" />ถ่ายใหม่
              </CButton>
              <CButton v-if="photoPreview && saveSuccess" color="primary" size="lg" @click="backToRegistration">
                เสร็จสิ้น
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
import { getGraduationProgress, isFaceRegistrationEnabled } from '@/projects/utils/graduation-workflow-progress'

const STORAGE_KEY = 'graduate-self-registration-draft'
const FACE_CHECKIN_STATUSES = ['10', '20', '30', '40']
const LEGACY_STATUS_MAP = { 1: '10', 2: '50', 3: '60' }

function emptyForm () {
  return { firstName: '', lastName: '', phone: '', email: '', school: '', schoolEnglish: '', program: '', programEnglish: '', ceremonyStatus: '' }
}

function textValue (value) {
  if (value && typeof value === 'object') {
    if (value.value !== undefined) return textValue(value.value)
    if (value.label !== undefined) return textValue(value.label)
    if (value.name !== undefined) return textValue(value.name)
  }
  const text = String(value == null ? '' : value).trim()
  return text && text !== '-' && text !== '[object Object]' ? text : ''
}

function normalizeEmailText (value) {
  const email = textValue(value).toLowerCase()
  return email && email.indexOf('@') !== -1 ? email : ''
}

function normalizeCeremonyStatus (value) {
  const code = textValue(value)
  return LEGACY_STATUS_MAP[code] || code
}

function profileEmail (profile) {
  const source = profile && typeof profile === 'object' ? profile : {}
  const userinfo = source.userinfo && typeof source.userinfo === 'object' ? source.userinfo : {}
  const authen = Array.isArray(source.authen) ? source.authen : []
  const candidates = [source.email, userinfo.email, source.username]
  authen.forEach(item => candidates.push(item && item.email, item && item.username))
  for (let index = 0; index < candidates.length; index += 1) {
    const email = normalizeEmailText(candidates[index])
    if (email) return email
  }
  return ''
}

export default {
  name: 'GraduateFaceCheckIn',
  data () {
    return {
      form: emptyForm(), registrationId: '', storedBarcodeValue: '', photoPreview: '', cameraActive: false,
      cameraLoading: false, cameraError: '', cameraStream: null, loadedDraftStorageKey: '', saveSuccess: false
    }
  },
  computed: {
    currentProfile () { return this.$store && this.$store.getters ? this.$store.getters['auth/profile'] : null },
    authEmail () { return profileEmail(this.currentProfile) },
    draftStorageKey () {
      const profile = this.currentProfile || {}
      const identity = this.studentCode || this.authEmail || textValue(profile._id || profile.id || profile.code || profile.username).toLowerCase() || 'anonymous'
      return `${STORAGE_KEY}:${encodeURIComponent(identity)}`
    },
    fullName () { return [this.form.firstName, this.form.lastName].filter(Boolean).join(' ') },
    isEnglishLocale () { return String((this.$i18n && this.$i18n.locale) || '').toLowerCase().startsWith('en') },
    displaySchool () { return this.isEnglishLocale && this.form.schoolEnglish ? this.form.schoolEnglish : this.form.school },
    displayProgram () { return this.isEnglishLocale && this.form.programEnglish ? this.form.programEnglish : this.form.program },
    studentCode () {
      const profile = this.currentProfile || {}
      return textValue(profile.studentCode || profile.barcodeValue || this.storedBarcodeValue)
    },
    barcodeValue () {
      if (this.storedBarcodeValue) return this.storedBarcodeValue
      const base = [this.form.firstName, this.form.lastName, this.form.phone].join('-').replace(/\s+/g, '').toUpperCase()
      return `GRAD-${base || 'PENDING'}`
    },
    cameraInstruction () {
      if (this.photoPreview) return 'ตรวจสอบภาพ หากไม่ชัดเจนสามารถกดถ่ายใหม่ได้'
      if (this.cameraActive) return 'จัดใบหน้าให้อยู่ภายในกรอบ แล้วกดถ่ายภาพ'
      return 'ระบบจะขออนุญาตใช้งานกล้องของอุปกรณ์'
    },
    statusLabel () {
      if (this.photoPreview && this.saveSuccess) return 'บันทึกแล้ว'
      if (this.cameraActive) return 'กล้องทำงาน'
      return 'รอถ่ายภาพ'
    },
    statusPillClass () {
      if (this.photoPreview && this.saveSuccess) return 'status-pill--success'
      if (this.cameraActive) return 'status-pill--active'
      return ''
    }
  },
  mounted () { this.restoreDraft() },
  beforeDestroy () { this.stopCamera() },
  watch: { currentProfile () { this.loadedDraftStorageKey = ''; this.restoreDraft() } },
  methods: {
    backToRegistration () { this.$router.push('/graduation/register') },
    restoreDraft () {
      if (!this.currentProfile || !Object.keys(this.currentProfile).length) return
      if (!isFaceRegistrationEnabled(getGraduationProgress(this.currentProfile))) {
        this.backToRegistration()
        return
      }
      const storageKey = this.draftStorageKey
      if (this.loadedDraftStorageKey === storageKey) return
      this.loadedDraftStorageKey = storageKey
      try {
        const payload = JSON.parse(window.localStorage.getItem(storageKey) || '{}')
        this.form = Object.assign(emptyForm(), payload.form || {})
        this.form.email = this.authEmail || normalizeEmailText(this.form.email)
        this.registrationId = textValue(payload.currentRegistrationId)
        this.storedBarcodeValue = textValue(payload.barcodeValue)
        this.photoPreview = textValue(payload.photoPreview)
        this.saveSuccess = !!this.photoPreview
        if (!FACE_CHECKIN_STATUSES.includes(normalizeCeremonyStatus(getGraduationProgress(this.currentProfile).ceremonyStatus))) this.backToRegistration()
      } catch (error) {
        this.form = emptyForm()
        this.backToRegistration()
      }
    },
    persistPhoto () {
      let payload = {}
      try { payload = JSON.parse(window.localStorage.getItem(this.draftStorageKey) || '{}') } catch (error) { payload = {} }
      payload.form = Object.assign({}, payload.form || {}, this.form, { email: this.authEmail || normalizeEmailText(this.form.email) })
      payload.currentRegistrationId = this.registrationId || payload.currentRegistrationId || ''
      payload.photoPreview = this.photoPreview
      payload.barcodeValue = this.barcodeValue
      payload.savedAt = new Date().toISOString()
      window.localStorage.setItem(this.draftStorageKey, JSON.stringify(payload))
      return payload
    },
    async startCamera () {
      this.cameraError = ''; this.cameraLoading = true; this.photoPreview = ''; this.saveSuccess = false
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('BROWSER_CAMERA_UNSUPPORTED')
        this.stopCamera()
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 1200 } }, audio: false })
        this.cameraStream = stream; this.cameraActive = true
        await this.$nextTick()
        if (this.$refs.cameraVideo) { this.$refs.cameraVideo.srcObject = stream; await this.$refs.cameraVideo.play() }
      } catch (error) {
        this.cameraActive = false; this.cameraStream = null
        this.cameraError = 'ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตให้เว็บไซต์ใช้งานกล้อง แล้วลองอีกครั้ง'
      } finally { this.cameraLoading = false }
    },
    stopCamera () {
      if (this.cameraStream && this.cameraStream.getTracks) this.cameraStream.getTracks().forEach(track => track.stop())
      this.cameraStream = null; this.cameraActive = false
      if (this.$refs.cameraVideo) this.$refs.cameraVideo.srcObject = null
    },
    async captureFacePhoto () {
      const video = this.$refs.cameraVideo; const canvas = this.$refs.cameraCanvas
      if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
        this.cameraError = 'ยังไม่พบภาพจากกล้อง กรุณารอสักครู่แล้วลองใหม่'; return
      }
      canvas.width = video.videoWidth; canvas.height = video.videoHeight
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
      this.photoPreview = canvas.toDataURL('image/jpeg', 0.92); this.cameraError = ''; this.stopCamera()
      await this.saveFacePhoto(this.persistPhoto())
    },
    async saveFacePhoto (draftPayload) {
      if (!this.registrationId || !this.photoPreview) { this.cameraError = 'ไม่พบข้อมูลการลงทะเบียน กรุณากลับไปบันทึกข้อมูลอีกครั้ง'; return }
      const payload = Object.assign({}, draftPayload && draftPayload.form ? draftPayload.form : this.form, {
        _id: this.registrationId, email: this.authEmail || normalizeEmailText(this.form.email), barcodeValue: this.barcodeValue, facePhoto: this.photoPreview
      })
      try { await api.graduateRegistrations('update', payload); this.saveSuccess = true } catch (error) {
        this.saveSuccess = false; this.cameraError = 'บันทึกรูปใบหน้าลงระบบไม่สำเร็จ กรุณาลองถ่ายและบันทึกใหม่อีกครั้ง'
      }
    },
    retakeFacePhoto () { this.photoPreview = ''; this.cameraError = ''; this.saveSuccess = false; this.startCamera() }
  }
}
</script>

<style scoped>
.face-registration-page { padding: 4px; max-width: 1240px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; margin-bottom: 20px; }
.page-header__step { display: inline-block; margin-bottom: 4px; color: #8c1515; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.page-header h1 { margin: 0; color: #1f2937; font-size: 30px; font-weight: 700; }
.page-header p { margin: 6px 0 0; color: #6b7280; }
.progress-steps { display: flex; align-items: center; max-width: 600px; margin: 0 auto 24px; }
.progress-step { display: flex; align-items: center; gap: 10px; color: #6b7280; white-space: nowrap; }
.progress-step > span { display: grid; width: 34px; height: 34px; place-items: center; border: 2px solid #d1d5db; border-radius: 50%; font-weight: 700; }
.progress-step div { display: grid; }.progress-step small { font-size: 11px; }.progress-step strong { color: #374151; font-size: 13px; }
.progress-step--done > span { border-color: #16a34a; color: #fff; background: #16a34a; }
.progress-step--active > span { border-color: #8c1515; color: #fff; background: #8c1515; }
.progress-line { flex: 1; height: 2px; margin: 0 14px; background: #d1d5db; }
.content-card { border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 4px 18px rgba(15, 23, 42, .05); }
.graduate-card { text-align: center; }.graduate-avatar { display: grid; width: 72px; height: 72px; margin: 4px auto 12px; place-items: center; border-radius: 50%; color: #8c1515; background: #fbecec; }
.graduate-avatar .c-icon { width: 34px; height: 34px; }.graduate-card h2 { margin: 0; font-size: 20px; }.student-code { color: #6b7280; }
.graduate-details { display: grid; gap: 12px; margin-top: 20px; text-align: left; }.graduate-details div { display: grid; gap: 3px; padding-bottom: 10px; border-bottom: 1px solid #eef2f7; }
.graduate-details span { color: #6b7280; font-size: 12px; }.graduate-details strong { color: #1f2937; overflow-wrap: anywhere; }.attendance-status { color: #15803d !important; }
.tips-card h3 { margin: 0 0 12px; color: #374151; font-size: 15px; }.tips-card ul { margin: 0; padding-left: 20px; color: #4b5563; font-size: 13px; }.tips-card li + li { margin-top: 8px; }
.camera-heading { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 16px; }.camera-heading h2 { margin: 0; font-size: 20px; }.camera-heading p { margin: 4px 0 0; color: #6b7280; font-size: 13px; }
.status-pill { display: flex; gap: 7px; align-items: center; padding: 6px 10px; border-radius: 999px; color: #92400e; background: #fef3c7; font-size: 12px; font-weight: 600; white-space: nowrap; }.status-pill i { width: 7px; height: 7px; border-radius: 50%; background: #f59e0b; }
.status-pill--active { color: #1d4ed8; background: #dbeafe; }.status-pill--active i { background: #2563eb; }.status-pill--success { color: #166534; background: #dcfce7; }.status-pill--success i { background: #16a34a; }
.camera-stage { position: relative; display: grid; min-height: 480px; overflow: hidden; place-items: center; border: 2px dashed #cbd5e1; border-radius: 14px; background: #f8fafc; }
.camera-stage--active { border-style: solid; border-color: #8c1515; background: #111827; }.camera-stage--captured { border-style: solid; border-color: #16a34a; }
.camera-stage video, .camera-stage img { width: 100%; height: 480px; object-fit: cover; }.camera-empty { padding: 24px; text-align: center; color: #64748b; }.camera-empty h3 { margin: 14px 0 4px; color: #334155; font-size: 18px; }.camera-empty p { margin: 0; }
.camera-icon { display: grid; width: 76px; height: 76px; margin: auto; place-items: center; border-radius: 50%; color: #8c1515; background: #fbecec; }.camera-icon .c-icon { width: 36px; height: 36px; }
.face-guide { position: absolute; top: 50%; left: 50%; width: 230px; height: 300px; transform: translate(-50%, -50%); border: 3px solid rgba(255,255,255,.8); border-radius: 48% 48% 44% 44%; box-shadow: 0 0 0 999px rgba(0,0,0,.2); }
.capture-confirmation { position: absolute; bottom: 16px; left: 50%; padding: 8px 14px; transform: translateX(-50%); border-radius: 999px; color: #fff; background: rgba(22,101,52,.92); font-size: 13px; font-weight: 600; white-space: nowrap; }
.camera-actions { display: flex; justify-content: center; gap: 10px; margin-top: 18px; }.camera-actions .btn { min-width: 170px; }
@media (max-width: 767px) { .page-header, .camera-heading { flex-direction: column; }.progress-step div { display: none; }.camera-stage, .camera-stage video, .camera-stage img { min-height: 390px; height: 390px; }.camera-actions { flex-direction: column; }.camera-actions .btn { width: 100%; }.face-guide { width: 190px; height: 250px; } }
</style>
