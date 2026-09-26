<template>
  <div class="face-registration-page">
    <div v-if="isAdminScanner" class="admin-scanner-controls">
      <div class="checkin-mode-strip">
        <button
          v-for="mode in checkInModes"
          :key="mode.value"
          type="button"
          :class="['checkin-mode-button', activeCheckInMode === mode.value ? 'is-active' : '']"
          @click="selectCheckInMode(mode.value)"
        >
          <strong>{{ mode.label }}</strong>
        </button>
      </div>
    </div>
    <div class="page-header">
      <div>
        <span class="page-header__step">{{ isAdminScanner ? 'ระบบเช็กชื่อบัณฑิต' : 'ขั้นตอนที่ 4 จาก 4' }}</span>
        <h1>{{ isAdminScanner ? 'สแกนใบหน้าเพื่อเช็กชื่อ' : 'ลงทะเบียนใบหน้า' }}</h1>
      </div>

      <CButton
        v-if="!isAdminScanner"
        color="secondary"
        variant="outline"
        @click="backToRegistration"
      >
        <CIcon
          name="cil-arrow-left"
          class="mr-2"
        />
        กลับไปหน้าข้อมูล
      </CButton>
    </div>

    <div
      v-if="!isAdminScanner"
      class="progress-steps"
      aria-label="ขั้นตอนการลงทะเบียน"
    >
      <div class="progress-step progress-step--done">
        <span>
          <CIcon name="cil-check" />
        </span>

        <div>
          <small>ขั้นตอนที่ 1</small>
          <strong>แบบสอบถาม</strong>
        </div>
      </div>

      <div class="progress-line"></div>

      <div class="progress-step progress-step--done">
        <span>
          <CIcon name="cil-check" />
        </span>

        <div>
          <small>ขั้นตอนที่ 2</small>
          <strong>แจ้งความประสงค์</strong>
        </div>
      </div>

      <div class="progress-line"></div>

      <div class="progress-step progress-step--done">
        <span>
          <CIcon name="cil-check" />
        </span>

        <div>
          <small>ขั้นตอนที่ 3</small>
          <strong>ข้อมูลการเข้ารับ</strong>
        </div>
      </div>

      <div class="progress-line"></div>

      <div class="progress-step progress-step--active">
        <span>4</span>

        <div>
          <small>ขั้นตอนที่ 4</small>
          <strong>ลงทะเบียนใบหน้า</strong>
        </div>
      </div>
    </div>

    <CRow>
      <!-- ===================================================
           LEFT
      ==================================================== -->
      <CCol
        lg="4"
        class="mb-3"
      >
        <CCard class="content-card graduate-card">
          <CCardBody>
            <div class="graduate-avatar">
              <CIcon name="cil-user" />
            </div>

            <h2>
              {{ fullName || '-' }}
            </h2>

            <p class="student-code">
              {{ studentCode || 'ไม่พบรหัสนักศึกษา' }}
            </p>

            <div class="graduate-details">
              <div>
                <span>สำนักวิชา</span>
                <strong>
                  {{ displaySchool || '-' }}
                </strong>
              </div>

              <div>
                <span>สาขาวิชา</span>
                <strong>
                  {{ displayProgram || '-' }}
                </strong>
              </div>

              <div>
                <span>สถานะ</span>

                <strong class="attendance-status">
                  เข้ารับพระราชทานปริญญาบัตร
                </strong>
              </div>
            </div>
          </CCardBody>
        </CCard>

        <CCard class="content-card mt-3 tips-card">
          <CCardBody>
            <h3>
              <CIcon
                name="cil-lightbulb"
                class="mr-2"
              />
              คำแนะนำในการถ่ายภาพ
            </h3>

            <ul>
              <li>
                อยู่ในบริเวณที่มีแสงสว่างเพียงพอ
              </li>

              <li>
                มองตรงและจัดใบหน้าให้อยู่กลางกรอบ
              </li>

              <li>
                ไม่สวมหมวก หน้ากาก หรือแว่นกันแดด
              </li>

              <li>
                ให้เห็นใบหน้าชัดเจนตั้งแต่ศีรษะถึงหัวไหล่
              </li>
            </ul>
          </CCardBody>
        </CCard>
      </CCol>

      <!-- ===================================================
           CAMERA
      ==================================================== -->
      <CCol
        lg="8"
        class="mb-3"
      >
        <CCard class="content-card camera-card">
          <CCardBody>
            <div class="camera-heading">
              <div>
                <h2>ถ่ายภาพใบหน้า</h2>
              </div>

              <span
                class="status-pill"
                :class="statusPillClass"
              >
                <i></i>
                {{ statusLabel }}
              </span>
            </div>

            <div
              class="camera-stage"
              :class="stageClass"
            >
              <video
                v-show="cameraActive && !photoPreview"
                ref="cameraVideo"
                autoplay
                playsinline
                muted
              ></video>

              <canvas
                v-show="cameraActive && !photoPreview"
                ref="overlayCanvas"
                class="camera-overlay"
              ></canvas>

              <img
                v-if="photoPreview"
                :src="photoPreview"
                alt="ภาพใบหน้าสำหรับลงทะเบียน"
              >

              <div
                v-if="!cameraActive && !photoPreview"
                class="camera-empty"
              >
                <div class="camera-icon">
                  <CIcon name="cil-camera" />
                </div>

                <h3>
                  พร้อมลงทะเบียนใบหน้า
                </h3>
              </div>

              <div
                v-if="cameraActive && !photoPreview"
                class="face-guide"
                :class="{
                  'face-guide--ready': faceReady
                }"
                aria-hidden="true"
              ></div>

              <div
                v-if="cameraActive && !photoPreview"
                class="scan-hint"
                :class="{
                  'scan-hint--ready': faceReady
                }"
                aria-live="polite"
              >
                <CIcon
                  :name="faceReady
                    ? 'cil-check-circle'
                    : 'cil-warning'"
                  class="mr-2"
                />

                <span>
                  {{ scanMessage }}
                </span>
              </div>

              <div
                v-if="photoPreview"
                class="capture-confirmation"
                :class="{
                  'capture-confirmation--pending': !saveSuccess
                }"
              >
                <CIcon
                  :name="saveSuccess
                    ? 'cil-check-circle'
                    : 'cil-cloud-upload'"
                />

                {{
                  saveSuccess
                    ? 'บันทึกภาพลงฐานข้อมูลแล้ว'
                    : (saveError ? 'บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง' : 'กำลังบันทึกภาพลงฐานข้อมูล...')
                }}
              </div>
            </div>

            <canvas
              ref="cameraCanvas"
              class="d-none"
            ></canvas>

            <!-- =================================================
                 ALERT
            ================================================== -->

            <div
              v-if="detectorLoading"
              class="alert alert-info mt-3 mb-0"
            >
              กำลังโหลดโมเดลตรวจจับใบหน้า MediaPipe
              กรุณารอสักครู่...
            </div>

            <div
              v-if="detectorError"
              class="alert alert-warning mt-3 mb-0"
            >
              {{ detectorError }}
            </div>

            <div
              v-if="cameraError"
              class="alert alert-warning mt-3 mb-0"
            >
              {{ cameraError }}
            </div>

            <div
              v-if="saveError"
              class="alert alert-danger mt-3 mb-0"
            >
              {{ saveError }}
            </div>

            <div
              v-if="saveSuccess"
              class="alert alert-success mt-3 mb-0"
            >
              ลงทะเบียนใบหน้าสำเร็จ
              ระบบบันทึกภาพของคุณไว้ในฐานข้อมูลแล้ว

              <span v-if="savedAtLabel">
                ({{ savedAtLabel }})
              </span>
            </div>

            <!-- =================================================
                 BUTTONS
            ================================================== -->

            <div class="camera-actions">
              <CButton
                v-if="!cameraActive && !photoPreview"
                color="primary"
                size="lg"
                :disabled="
                  cameraLoading ||
                  registrationLoading
                "
                @click="startCamera"
              >
                <CIcon
                  name="cil-camera"
                  class="mr-2"
                />

                {{ startButtonLabel }}
              </CButton>

              <!--
                นักศึกษาต้องกดเอง
                ไม่มี Auto Capture
              -->
              <CButton
                v-if="cameraActive"
                color="success"
                size="lg"
                :disabled="
                  !faceReady ||
                  saving
                "
                @click="captureFacePhoto"
              >
                <CIcon
                  name="cil-camera"
                  class="mr-2"
                />

                {{
                  faceReady
                    ? 'ถ่ายและบันทึกภาพ'
                    : 'รอตรวจสอบใบหน้า...'
                }}
              </CButton>

              <CButton
                v-if="cameraActive"
                color="secondary"
                variant="outline"
                size="lg"
                @click="stopCamera"
              >
                ยกเลิก
              </CButton>

              <CButton
                v-if="photoPreview && saveError"
                color="primary"
                size="lg"
                :disabled="saving"
                @click="retrySave"
              >
                <CIcon
                  name="cil-cloud-upload"
                  class="mr-2"
                />

                {{
                  saving
                    ? 'กำลังบันทึก...'
                    : 'บันทึกอีกครั้ง'
                }}
              </CButton>

              <CButton
                v-if="photoPreview"
                color="secondary"
                variant="outline"
                size="lg"
                :disabled="saving"
                @click="retakeFacePhoto"
              >
                <CIcon
                  name="cil-reload"
                  class="mr-2"
                />

                สแกนใหม่
              </CButton>

              <CButton
                v-if="photoPreview && saveSuccess"
                color="primary"
                size="lg"
                @click="backToRegistration"
              >
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

import {
  getGraduationProgress,
  isFaceRegistrationEnabled,
  markGraduationStep
} from '@/projects/utils/graduation-workflow-progress'

import {
  loadFaceDetector,
  scanFaceFrame,
  captureFaceImage,
  FACE_SCAN_MESSAGES,
  FACE_SCAN_SOURCE,
  FACE_DETECTOR_MODEL_NAME
} from '@/projects/utils/mediapipe-face-scan'

// ============================================================
// SETTINGS
// ============================================================

const STORAGE_KEY =
  'graduate-self-registration-draft'

const FACE_CHECKIN_STATUSES = [
  '10',
  '20',
  '30',
  '40'
]

const LEGACY_STATUS_MAP = {
  1: '10',
  2: '50',
  3: '60'
}

const REGISTRATION_FIELDS = [
  'firstName',
  'lastName',
  'phone',
  'email',
  'school',
  'schoolEnglish',
  'program',
  'programEnglish'
]

// ตรวจประมาณ 15 ครั้ง / วินาที
const DETECT_INTERVAL_MS = 66

// ต้องผ่านติดต่อกัน 12 frame
// ก่อนเปิดปุ่มให้ผู้ใช้กดถ่าย
const REQUIRED_GOOD_FRAMES = 12

// ============================================================
// HELPERS
// ============================================================

function emptyForm () {
  return {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    school: '',
    schoolEnglish: '',
    program: '',
    programEnglish: '',
    ceremonyStatus: ''
  }
}

function textValue (value) {
  if (
    value &&
    typeof value === 'object'
  ) {
    if (value.value !== undefined) {
      return textValue(value.value)
    }

    if (value.label !== undefined) {
      return textValue(value.label)
    }

    if (value.name !== undefined) {
      return textValue(value.name)
    }
  }

  const text =
    String(
      value == null
        ? ''
        : value
    ).trim()

  return (
    text &&
    text !== '-' &&
    text !== '[object Object]'
  )
    ? text
    : ''
}

function normalizeEmailText (value) {
  const email =
    textValue(value)
      .toLowerCase()

  return (
    email &&
    email.indexOf('@') !== -1
  )
    ? email
    : ''
}

function normalizeCeremonyStatus (value) {
  const code =
    textValue(value)

  return (
    LEGACY_STATUS_MAP[code] ||
    code
  )
}

function profileEmail (profile) {
  const source =
    profile &&
    typeof profile === 'object'
      ? profile
      : {}

  const userinfo =
    source.userinfo &&
    typeof source.userinfo === 'object'
      ? source.userinfo
      : {}

  const authen =
    Array.isArray(source.authen)
      ? source.authen
      : []

  const candidates = [
    source.email,
    userinfo.email,
    source.username
  ]

  authen.forEach(item => {
    candidates.push(
      item && item.email,
      item && item.username
    )
  })

  for (
    let index = 0;
    index < candidates.length;
    index += 1
  ) {
    const email =
      normalizeEmailText(
        candidates[index]
      )

    if (email) {
      return email
    }
  }

  return ''
}

// ============================================================
// COMPONENT
// ============================================================

export default {
  name: 'GraduateFaceCheckIn',

  data () {
    return {
      form: emptyForm(),

      registrationId: '',
      storedBarcodeValue: '',

      photoPreview: '',

      cameraActive: false,
      cameraLoading: false,
      cameraError: '',
      cameraStream: null,

      loadedDraftStorageKey: '',

      saveSuccess: false,

      detector: null,
      detectorLoading: false,
      detectorError: '',

      scanState: null,

      // จำนวน frame ที่ผ่านต่อเนื่อง
      goodFrames: 0,

      // ป้องกัน MediaPipe ทำงานซ้อน
      detectionBusy: false,

      saving: false,
      saveError: '',
      savedAt: '',

      detectionMetrics: null,

      registrationLoading: false,
      adminRegistrations: [],

      animationFrameId: null,
      lastDetectAt: 0
    }
  },

  // ==========================================================
  // COMPUTED
  // ==========================================================

  computed: {
    activeCheckInMode () {
      return this.$route && this.$route.query.mode === 'ceremony' ? 'ceremony' : 'rehearsal'
    },
    checkInModes () {
      return [
        { value: 'rehearsal', label: 'วันซ้อม', note: 'ตรวจรายชื่อ ทดลองเช็กชื่อ และดูความพร้อมข้อมูล' },
        { value: 'ceremony', label: 'วันจริง', note: 'ใช้ยืนยันตัวตนและติดตามบัณฑิตหน้างาน' }
      ]
    },
    isAdminScanner () {
      return !!(this.$route && this.$route.path === '/graduation/admin-face-scanner')
    },
    currentProfile () {
      return (
        this.$store &&
        this.$store.getters
      )
        ? this.$store.getters['auth/profile']
        : null
    },

    authEmail () {
      return profileEmail(
        this.currentProfile
      )
    },

    draftStorageKey () {
      const profile =
        this.currentProfile || {}

      const identity =
        this.studentCode ||
        this.authEmail ||
        textValue(
          profile._id ||
          profile.id ||
          profile.code ||
          profile.username
        ).toLowerCase() ||
        'anonymous'

      return (
        `${STORAGE_KEY}:${encodeURIComponent(identity)}`
      )
    },

    fullName () {
      return [
        this.form.firstName,
        this.form.lastName
      ]
        .filter(Boolean)
        .join(' ')
    },

    isEnglishLocale () {
      return String(
        (
          this.$i18n &&
          this.$i18n.locale
        ) || ''
      )
        .toLowerCase()
        .startsWith('en')
    },

    displaySchool () {
      return (
        this.isEnglishLocale &&
        this.form.schoolEnglish
      )
        ? this.form.schoolEnglish
        : this.form.school
    },

    displayProgram () {
      return (
        this.isEnglishLocale &&
        this.form.programEnglish
      )
        ? this.form.programEnglish
        : this.form.program
    },

    studentCode () {
      const profile =
        this.currentProfile || {}

      return textValue(
        profile.studentCode ||
        profile.barcodeValue ||
        this.storedBarcodeValue
      )
    },

    barcodeValue () {
      if (this.storedBarcodeValue) {
        return this.storedBarcodeValue
      }

      const base = [
        this.form.firstName,
        this.form.lastName,
        this.form.phone
      ]
        .join('-')
        .replace(/\s+/g, '')
        .toUpperCase()

      return `GRAD-${base || 'PENDING'}`
    },

    cameraInstruction () {
      if (this.photoPreview) {
        return (
          'ตรวจสอบภาพ หากไม่ชัดเจนสามารถสแกนใหม่ได้'
        )
      }

      if (this.cameraActive) {
        return (
          'จัดใบหน้าให้อยู่กลางกรอบ ' +
          'เมื่อระบบตรวจสอบผ่านให้กดปุ่มถ่ายภาพ'
        )
      }

      return (
        'ระบบจะขออนุญาตใช้งานกล้องของอุปกรณ์ ' +
        'แล้วตรวจจับใบหน้าด้วยโมเดล MediaPipe'
      )
    },

    statusLabel () {
      if (this.saving) {
        return 'กำลังบันทึก'
      }

      if (
        this.photoPreview &&
        this.saveSuccess
      ) {
        return 'บันทึกแล้ว'
      }

      if (
        this.photoPreview &&
        this.saveError
      ) {
        return 'บันทึกไม่สำเร็จ'
      }

      if (this.detectorLoading) {
        return 'กำลังโหลดโมเดล'
      }

      if (this.detectorError) {
        return 'โมเดลไม่พร้อม'
      }

      if (this.cameraActive) {
        return this.faceReady
          ? 'พร้อมถ่ายภาพ'
          : 'กำลังตรวจสอบ'
      }

      return 'รอสแกนใบหน้า'
    },

    statusPillClass () {
      if (
        this.photoPreview &&
        this.saveError
      ) {
        return 'status-pill--danger'
      }

      if (this.detectorError) {
        return 'status-pill--danger'
      }

      if (
        this.photoPreview &&
        this.saveSuccess
      ) {
        return 'status-pill--success'
      }

      if (
        this.cameraActive &&
        this.faceReady
      ) {
        return 'status-pill--success'
      }

      if (
        this.cameraActive ||
        this.detectorLoading
      ) {
        return 'status-pill--active'
      }

      return ''
    },

    startButtonLabel () {
      if (this.registrationLoading) {
        return 'กำลังโหลดข้อมูล...'
      }

      if (this.cameraLoading) {
        return 'กำลังเปิดกล้อง...'
      }

      return 'เริ่มสแกนใบหน้า'
    },

    // ========================================================
    // พร้อมถ่ายเมื่อ:
    // 1. กล้องเปิด
    // 2. MediaPipe ไม่ Error
    // 3. Frame ปัจจุบันผ่าน
    // 4. ผ่านติดต่อกัน 12 Frame
    // ========================================================

    faceReady () {
      if (
        !this.cameraActive ||
        this.photoPreview ||
        this.detectorError
      ) {
        return false
      }

      return !!(
        this.scanState &&
        this.scanState.ok &&
        this.goodFrames >=
          REQUIRED_GOOD_FRAMES
      )
    },

    scanMessage () {
      if (this.detectorLoading) {
        return (
          'กำลังโหลดโมเดลตรวจจับใบหน้า...'
        )
      }

      if (this.detectorError) {
        return (
          'ไม่สามารถโหลดระบบตรวจจับใบหน้าได้ ' +
          'กรุณาลองใหม่อีกครั้ง'
        )
      }

      if (!this.scanState) {
        return FACE_SCAN_MESSAGES.NO_FACE
      }

      if (
        this.scanState.ok &&
        this.goodFrames <
          REQUIRED_GOOD_FRAMES
      ) {
        return (
          'ตรวจพบใบหน้าแล้ว ' +
          'กรุณามองตรงและอยู่นิ่งสักครู่'
        )
      }

      if (this.faceReady) {
        return (
          'ใบหน้าผ่านการตรวจสอบ ' +
          'กดปุ่ม “ถ่ายและบันทึกภาพ” ได้เลย'
        )
      }

      return (
        this.scanState.message ||
        FACE_SCAN_MESSAGES.NO_FACE
      )
    },

    stageClass () {
      return {
        'camera-stage--active':
          this.cameraActive &&
          !this.photoPreview,

        'camera-stage--ready':
          this.cameraActive &&
          this.faceReady,

        'camera-stage--captured':
          !!this.photoPreview
      }
    },

    savedAtLabel () {
      if (!this.savedAt) {
        return ''
      }

      const captured =
        new Date(this.savedAt)

      if (
        isNaN(
          captured.getTime()
        )
      ) {
        return ''
      }

      try {
        return captured.toLocaleString(
          this.isEnglishLocale
            ? 'en-GB'
            : 'th-TH'
        )
      } catch (error) {
        return captured.toISOString()
      }
    }
  },

  // ==========================================================
  // LIFECYCLE
  // ==========================================================

  mounted () {
    if (!this.isAdminScanner) this.restoreDraft()
    this.fetchRegistration()
  },

  beforeDestroy () {
    this.stopCamera()
  },

  watch: {
    currentProfile () {
      this.loadedDraftStorageKey = ''

      if (!this.isAdminScanner) this.restoreDraft()
      this.fetchRegistration()
    },
    '$route.query.id' () {
      if (this.isAdminScanner) this.fetchRegistration()
    }
  },

  // ==========================================================
  // METHODS
  // ==========================================================

  methods: {
    backToRegistration () {
      this.$router.push(
        this.isAdminScanner ? '/graduation/checkin-dashboard' : '/graduation/register'
      )
    },

    selectAdminRegistration (event) {
      const id = event && event.target ? event.target.value : ''
      if (!id) {
        this.$router.replace({ path: '/graduation/admin-face-scanner', query: { mode: this.activeCheckInMode } })
        return
      }
      this.$router.replace({ path: '/graduation/admin-face-scanner', query: { id, mode: this.activeCheckInMode } })
    },

    resetAdminSelection () {
      if (!this.isAdminScanner) return
      this.stopCamera()
      this.form = emptyForm()
      this.registrationId = ''
      this.storedBarcodeValue = ''
      this.photoPreview = ''
      this.savedAt = ''
      this.saveSuccess = false
      this.saveError = ''
      this.cameraError = ''
      this.detectionMetrics = null
      this.scanState = null
      this.goodFrames = 0
    },

    selectCheckInMode (mode) {
      this.$router.replace({
        path: '/graduation/admin-face-scanner',
        query: Object.assign({}, this.$route.query, { mode })
      })
    },

    // --------------------------------------------------------
    // RESTORE
    // --------------------------------------------------------

    restoreDraft () {
      if (
        !this.currentProfile ||
        !Object.keys(
          this.currentProfile
        ).length
      ) {
        return
      }

      const progress =
        getGraduationProgress(
          this.currentProfile
        )

      if (
        !isFaceRegistrationEnabled(
          progress
        )
      ) {
        this.backToRegistration()
        return
      }

      const storageKey =
        this.draftStorageKey

      if (
        this.loadedDraftStorageKey ===
        storageKey
      ) {
        return
      }

      this.loadedDraftStorageKey =
        storageKey

      try {
        const payload =
          JSON.parse(
            window.localStorage.getItem(
              storageKey
            ) || '{}'
          )

        this.form =
          Object.assign(
            emptyForm(),
            payload.form || {}
          )

        this.form.email =
          this.authEmail ||
          normalizeEmailText(
            this.form.email
          )

        this.registrationId =
          textValue(
            payload.currentRegistrationId
          )

        this.storedBarcodeValue =
          textValue(
            payload.barcodeValue
          )

        const ceremonyStatus =
          normalizeCeremonyStatus(
            progress.ceremonyStatus
          )

        if (
          !FACE_CHECKIN_STATUSES.includes(
            ceremonyStatus
          )
        ) {
          this.backToRegistration()
        }
      } catch (error) {
        this.form = emptyForm()

        this.backToRegistration()
      }
    },

    persistDraft () {
      if (this.isAdminScanner) return
      let payload = {}

      try {
        payload =
          JSON.parse(
            window.localStorage.getItem(
              this.draftStorageKey
            ) || '{}'
          )
      } catch (error) {
        payload = {}
      }

      payload.form =
        Object.assign(
          {},
          payload.form || {},
          this.form,
          {
            email:
              this.authEmail ||
              normalizeEmailText(
                this.form.email
              )
          }
        )

      payload.currentRegistrationId =
        this.registrationId ||
        payload.currentRegistrationId ||
        ''

      payload.barcodeValue =
        this.barcodeValue

      payload.savedAt =
        new Date().toISOString()

      // ไม่เก็บ Base64 ใน localStorage
      delete payload.photoPreview

      try {
        window.localStorage.setItem(
          this.draftStorageKey,
          JSON.stringify(payload)
        )
      } catch (error) {
        // ไม่ให้ quota error ทำระบบพัง
      }

      return payload
    },

    // --------------------------------------------------------
    // DATABASE
    // --------------------------------------------------------

    async fetchRegistration () {
      if (
        !this.isAdminScanner && (
        !this.currentProfile ||
        !Object.keys(
          this.currentProfile
        ).length
        )
      ) {
        return
      }

      this.registrationLoading =
        true

      try {
        if (this.isAdminScanner) {
          const listResponse = await api.graduateRegistrations('list', { limit: 4000 })
          const data = listResponse && listResponse.data && listResponse.data.data
          this.adminRegistrations = data && Array.isArray(data.rows) ? data.rows : []
          const requestedId = textValue(this.$route && this.$route.query && this.$route.query.id)
          const row = requestedId
            ? this.adminRegistrations.find(item => textValue(item._id || item.id) === requestedId)
            : null
          this.resetAdminSelection()
          if (row) this.applyRegistration(row)
          return
        }
        const response =
          await api.graduateRegistrations(
            'defaults'
          )

        const row =
          response &&
          response.data
            ? response.data.data
            : null

        if (row) {
          this.applyRegistration(row)
        }
      } catch (error) {
        if (this.isAdminScanner) {
          this.saveError = 'โหลดรายชื่อบัณฑิตไม่สำเร็จ กรุณาโหลดหน้าใหม่อีกครั้ง'
        }
      } finally {
        this.registrationLoading =
          false
      }
    },

    applyRegistration (row) {
      this.registrationId =
        textValue(
          row._id ||
          row.id
        ) ||
        this.registrationId

      this.storedBarcodeValue =
        textValue(
          row.barcodeValue ||
          row.studentCode
        ) ||
        this.storedBarcodeValue

      REGISTRATION_FIELDS.forEach(
        field => {
          const value =
            textValue(
              row[field]
            )

          if (value) {
            this.form[field] =
              value
          }
        }
      )

      this.form.email =
        (this.isAdminScanner ? '' : this.authEmail) ||
        normalizeEmailText(
          row.email
        ) ||
        this.form.email

      const ceremonyStatus =
        normalizeCeremonyStatus(
          row.ceremonyStatus
        )

      if (ceremonyStatus) {
        this.form.ceremonyStatus =
          ceremonyStatus
      }

      const facePhoto =
        textValue(
          row.facePhoto
        )

      if (
        facePhoto &&
        !this.photoPreview &&
        !this.isAdminScanner
      ) {
        this.photoPreview =
          facePhoto

        this.saveSuccess =
          true

        this.savedAt =
          textValue(
            row.facePhotoCapturedAt
          )

        this.detectionMetrics =
          row.facePhotoDetection ||
          null
      }

      this.persistDraft()
    },

    // --------------------------------------------------------
    // MEDIAPIPE
    // --------------------------------------------------------

    async ensureDetector () {
      if (this.detector) {
        return this.detector
      }

      this.detectorLoading =
        true

      this.detectorError =
        ''

      try {
        this.detector =
          await loadFaceDetector()

        if (!this.detector) {
          throw new Error(
            'DETECTOR_UNAVAILABLE'
          )
        }

        return this.detector
      } catch (error) {
        this.detector =
          null

        this.detectorError =
          'โหลดโมเดลตรวจจับใบหน้า MediaPipe ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'

        // eslint-disable-next-line no-console
        console.error(
          '[GraduateFaceCheckIn] MediaPipe error:',
          error
        )

        return null
      } finally {
        this.detectorLoading =
          false
      }
    },

    // --------------------------------------------------------
    // CAMERA
    // --------------------------------------------------------

    async startCamera () {
      this.cameraError = ''
      this.saveError = ''
      if (this.isAdminScanner && !this.registrationId) {
        this.cameraError = 'กรุณาเลือกบัณฑิตสำหรับเช็กชื่อก่อนเปิดกล้อง'
        return
      }

      this.cameraLoading =
        true

      this.photoPreview = ''

      this.saveSuccess =
        false

      this.savedAt = ''

      this.scanState =
        null

      this.goodFrames =
        0

      this.detectionMetrics =
        null

      this.detectionBusy =
        false

      this.lastDetectAt =
        0

      try {
        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices.getUserMedia
        ) {
          throw new Error(
            'BROWSER_CAMERA_UNSUPPORTED'
          )
        }

        this.stopCamera()

        const stream =
          await navigator.mediaDevices
            .getUserMedia({
              video: {
                facingMode:
                  'user',

                width: {
                  ideal:
                    960
                },

                height: {
                  ideal:
                    1200
                }
              },

              audio:
                false
            })

        this.cameraStream =
          stream

        this.cameraActive =
          true

        await this.$nextTick()

        const video =
          this.$refs.cameraVideo

        if (!video) {
          throw new Error(
            'VIDEO_ELEMENT_NOT_FOUND'
          )
        }

        video.srcObject =
          stream

        await video.play()
      } catch (error) {
        this.cameraActive =
          false

        this.cameraStream =
          null

        this.cameraError =
          'ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตให้เว็บไซต์ใช้งานกล้อง แล้วลองอีกครั้ง'

        // eslint-disable-next-line no-console
        console.error(
          '[GraduateFaceCheckIn] Camera error:',
          error
        )

        return
      } finally {
        this.cameraLoading =
          false
      }

      const detector =
        await this.ensureDetector()

      if (!detector) {
        return
      }

      if (this.cameraActive) {
        this.scheduleDetection()
      }
    },

    stopCamera () {
      if (
        this.animationFrameId !==
        null
      ) {
        window.cancelAnimationFrame(
          this.animationFrameId
        )

        this.animationFrameId =
          null
      }

      if (
        this.cameraStream &&
        this.cameraStream.getTracks
      ) {
        this.cameraStream
          .getTracks()
          .forEach(
            track =>
              track.stop()
          )
      }

      this.cameraStream =
        null

      this.cameraActive =
        false

      this.scanState =
        null

      this.goodFrames =
        0

      this.detectionBusy =
        false

      if (
        this.$refs.cameraVideo
      ) {
        this.$refs.cameraVideo.srcObject =
          null
      }

      this.clearOverlay()
    },

    // --------------------------------------------------------
    // DETECTION LOOP
    // --------------------------------------------------------

    scheduleDetection () {
      if (
        this.animationFrameId !==
        null
      ) {
        return
      }

      this.animationFrameId =
        window.requestAnimationFrame(
          this.onAnimationFrame
        )
    },

    onAnimationFrame (timestamp) {
      this.animationFrameId =
        null

      if (
        !this.cameraActive ||
        this.photoPreview
      ) {
        return
      }

      const video =
        this.$refs.cameraVideo

      if (
        !this.detectionBusy &&
        this.detector &&
        video &&
        video.videoWidth &&
        video.videoHeight &&
        (
          timestamp -
          this.lastDetectAt >=
          DETECT_INTERVAL_MS
        )
      ) {
        this.lastDetectAt =
          timestamp

        this.detectFrame(video)
      }

      this.scheduleDetection()
    },

    async detectFrame (video) {
      if (this.detectionBusy) {
        return
      }

      this.detectionBusy =
        true

      try {
        const evaluation =
          await scanFaceFrame(
            video
          )

        // กล้องอาจถูกปิด
        // ระหว่างรอ model
        if (
          !this.cameraActive ||
          this.photoPreview
        ) {
          return
        }

        this.scanState =
          evaluation

        if (
          evaluation &&
          evaluation.ok
        ) {
          this.goodFrames += 1
        } else {
          // Frame ใดไม่ผ่าน
          // เริ่มนับใหม่
          this.goodFrames =
            0
        }

        this.drawOverlay(
          evaluation
        )

        // ไม่มี Auto Capture ตรงนี้
      } catch (error) {
        this.goodFrames =
          0

        this.scanState = {
          ok:
            false,

          code:
            'SCAN_ERROR',

          message:
            'ไม่สามารถตรวจจับใบหน้าได้',

          metrics:
            null,

          box:
            null
        }

        // eslint-disable-next-line no-console
        console.error(
          '[GraduateFaceCheckIn] Scan error:',
          error
        )
      } finally {
        this.detectionBusy =
          false
      }
    },

    // --------------------------------------------------------
    // FACE BOX
    // --------------------------------------------------------

    overlayContext () {
      const canvas =
        this.$refs.overlayCanvas

      const video =
        this.$refs.cameraVideo

      if (
        !canvas ||
        !video
      ) {
        return null
      }

      const width =
        video.clientWidth ||
        canvas.width

      const height =
        video.clientHeight ||
        canvas.height

      if (
        !width ||
        !height
      ) {
        return null
      }

      if (
        canvas.width !== width
      ) {
        canvas.width =
          width
      }

      if (
        canvas.height !== height
      ) {
        canvas.height =
          height
      }

      const context =
        canvas.getContext(
          '2d'
        )

      return context
        ? {
            context,
            width,
            height,
            video
          }
        : null
    },

    clearOverlay () {
      const overlay =
        this.overlayContext()

      if (!overlay) {
        return
      }

      overlay.context.clearRect(
        0,
        0,
        overlay.width,
        overlay.height
      )
    },

    drawOverlay (evaluation) {
      const overlay =
        this.overlayContext()

      if (!overlay) {
        return
      }

      const {
        context,
        width,
        height,
        video
      } = overlay

      context.clearRect(
        0,
        0,
        width,
        height
      )

      const box =
        evaluation &&
        evaluation.box

      if (!box) {
        return
      }

      const scale =
        Math.max(
          width /
            video.videoWidth,

          height /
            video.videoHeight
        )

      const renderedWidth =
        video.videoWidth *
        scale

      const renderedHeight =
        video.videoHeight *
        scale

      const offsetX =
        (
          width -
          renderedWidth
        ) / 2

      const offsetY =
        (
          height -
          renderedHeight
        ) / 2

      const rect = {
        x:
          offsetX +
          (
            box.x *
            renderedWidth
          ),

        y:
          offsetY +
          (
            box.y *
            renderedHeight
          ),

        width:
          box.width *
          renderedWidth,

        height:
          box.height *
          renderedHeight
      }

      const color =
        evaluation.ok
          ? '#22c55e'
          : '#f59e0b'

      context.strokeStyle =
        color

      context.lineWidth =
        3

      context.strokeRect(
        rect.x,
        rect.y,
        rect.width,
        rect.height
      )

      const corner =
        Math.min(
          rect.width,
          rect.height
        ) * 0.22

      context.lineWidth =
        6

      context.beginPath()

      // TOP LEFT
      context.moveTo(
        rect.x,
        rect.y + corner
      )

      context.lineTo(
        rect.x,
        rect.y
      )

      context.lineTo(
        rect.x + corner,
        rect.y
      )

      // TOP RIGHT
      context.moveTo(
        rect.x +
          rect.width -
          corner,
        rect.y
      )

      context.lineTo(
        rect.x +
          rect.width,
        rect.y
      )

      context.lineTo(
        rect.x +
          rect.width,
        rect.y +
          corner
      )

      // BOTTOM LEFT
      context.moveTo(
        rect.x,
        rect.y +
          rect.height -
          corner
      )

      context.lineTo(
        rect.x,
        rect.y +
          rect.height
      )

      context.lineTo(
        rect.x +
          corner,
        rect.y +
          rect.height
      )

      // BOTTOM RIGHT
      context.moveTo(
        rect.x +
          rect.width -
          corner,
        rect.y +
          rect.height
      )

      context.lineTo(
        rect.x +
          rect.width,
        rect.y +
          rect.height
      )

      context.lineTo(
        rect.x +
          rect.width,
        rect.y +
          rect.height -
          corner
      )

      context.stroke()
    },

    // --------------------------------------------------------
    // MANUAL CAPTURE
    // --------------------------------------------------------

    async captureFacePhoto () {
      if (
        this.saving ||
        this.photoPreview
      ) {
        return
      }

      // ต้องผ่าน MediaPipe
      if (
        !this.scanState ||
        !this.scanState.ok ||
        this.goodFrames <
          REQUIRED_GOOD_FRAMES
      ) {
        this.cameraError =
          'ใบหน้ายังไม่ผ่านการตรวจสอบ กรุณามองตรง อยู่นิ่ง และจัดใบหน้าให้อยู่กลางกรอบ'

        return
      }

      const capture =
        captureFaceImage(
          this.$refs.cameraVideo,
          this.$refs.cameraCanvas,
          {
            maxWidth:
              720,

            quality:
              0.9
          }
        )

      if (!capture) {
        this.cameraError =
          'ยังไม่พบภาพจากกล้อง กรุณารอสักครู่แล้วลองใหม่'

        return
      }

      this.photoPreview =
        capture.dataUrl

      this.detectionMetrics =
        Object.assign(
          {},
          this.scanState.metrics ||
            {},
          {
            width:
              capture.width,

            height:
              capture.height,

            goodFrames:
              this.goodFrames
          }
        )

      this.cameraError =
        ''

      this.stopCamera()

      if (!this.isAdminScanner) this.persistDraft()

      await this.saveFacePhoto()
    },

    // --------------------------------------------------------
    // SAVE
    // --------------------------------------------------------

    async saveFacePhoto () {
      if (!this.photoPreview) {
        return
      }

      if (!this.registrationId) {
        this.saveSuccess =
          false

        this.saveError =
          'ไม่พบข้อมูลการลงทะเบียน กรุณากลับไปบันทึกข้อมูลการลงทะเบียนอีกครั้ง'

        return
      }

      this.saving =
        true

      this.saveError =
        ''

      try {
        const response =
          await api.graduateRegistrations(
            'save-face-photo',
            {
              _id:
                this.registrationId,

              facePhoto:
                this.photoPreview,

              facePhotoSource:
                FACE_SCAN_SOURCE,

              checkInMode:
                this.isAdminScanner
                  ? this.activeCheckInMode
                  : null,

              facePhotoDetection:
                Object.assign(
                  {
                    model:
                      FACE_DETECTOR_MODEL_NAME
                  },

                  this.detectionMetrics ||
                    {}
                )
            }
          )

        const saved =
          response &&
          response.data
            ? response.data.data
            : null

        this.savedAt =
          textValue(
            saved &&
            saved.facePhotoCapturedAt
          ) ||
          new Date().toISOString()

        this.saveSuccess =
          true

        if (!this.isAdminScanner) {
          markGraduationStep(this.currentProfile, 'faceSaved')
        }
      } catch (error) {
        this.saveSuccess =
          false

        this.saveError =
          this.saveErrorMessage(
            error
          )

        // eslint-disable-next-line no-console
        console.error(
          '[GraduateFaceCheckIn] Save error:',
          error
        )
      } finally {
        this.saving =
          false
      }
    },

    saveErrorMessage (error) {
      const status =
        error &&
        error.response
          ? error.response.status
          : 0

      if (status === 413) {
        return (
          'ไฟล์ภาพมีขนาดใหญ่เกินกำหนด ' +
          'กรุณาสแกนใหม่อีกครั้ง'
        )
      }

      if (status === 403) {
        return (
          'ไม่มีสิทธิ์บันทึกภาพใบหน้าของรายการลงทะเบียนนี้'
        )
      }

      if (status === 404) {
        return (
          'ไม่พบรายการลงทะเบียนของคุณในระบบ ' +
          'กรุณากลับไปบันทึกข้อมูลอีกครั้ง'
        )
      }

      if (!status) {
        return (
          'เชื่อมต่อระบบไม่ได้ ' +
          'กรุณาตรวจสอบอินเทอร์เน็ตแล้วกดบันทึกอีกครั้ง'
        )
      }

      return (
        'บันทึกภาพใบหน้าลงฐานข้อมูลไม่สำเร็จ ' +
        'กรุณากดบันทึกอีกครั้ง'
      )
    },

    retrySave () {
      return this.saveFacePhoto()
    },

    retakeFacePhoto () {
      this.photoPreview = ''

      this.cameraError = ''
      this.saveError = ''

      this.saveSuccess =
        false

      this.savedAt = ''

      this.detectionMetrics =
        null

      this.scanState =
        null

      this.goodFrames =
        0

      this.detectionBusy =
        false

      return this.startCamera()
    }
  }
}
</script>

<style scoped>
.face-registration-page {
  padding: 4px;
  max-width: 1240px;
  margin: 0 auto;
}

.admin-registration-picker {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px 20px;
  border: 1px solid #d8dee8;
  border-radius: 10px;
  background: #fff;
}

.admin-scanner-controls {
  margin-bottom: 20px;
}

.checkin-mode-strip {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.checkin-mode-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  padding: 12px 16px;
  color: #17233c;
  text-align: center;
  border: 1px solid #d8dee8;
  border-radius: 10px;
  background: #fff;
}

.checkin-mode-button strong {
  width: 100%;
  font-size: 14px;
  font-weight: 600;
}

.checkin-mode-button small {
  color: #667085;
}

.checkin-mode-button.is-active {
  border-color: #a51d1d;
  background: #fff8f8;
  box-shadow: inset 0 0 0 1px #a51d1d;
}

.admin-registration-picker label {
  margin: 0;
  font-weight: 700;
  white-space: nowrap;
}

.admin-registration-picker select {
  width: 100%;
  min-height: 40px;
  padding: 7px 12px;
  border: 1px solid #c8d0dc;
  border-radius: 6px;
  background: #fff;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 20px;
}

.page-header__step {
  display: inline-block;
  margin-bottom: 4px;
  color: #8c1515;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.page-header h1 {
  margin: 0;
  color: #1f2937;
  font-size: 30px;
  font-weight: 700;
}

.page-header p {
  margin: 6px 0 0;
  color: #6b7280;
}

.progress-steps {
  display: flex;
  align-items: center;
  max-width: 980px;
  margin: 0 auto 24px;
}

.progress-step {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #6b7280;
  white-space: nowrap;
}

.progress-step > span {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  font-weight: 700;
}

.progress-step div {
  display: grid;
}

.progress-step small {
  font-size: 11px;
}

.progress-step strong {
  color: #374151;
  font-size: 13px;
}

.progress-step--done > span {
  border-color: #16a34a;
  color: #fff;
  background: #16a34a;
}

.progress-step--active > span {
  border-color: #8c1515;
  color: #fff;
  background: #8c1515;
}

.progress-line {
  flex: 1;
  height: 2px;
  margin: 0 14px;
  background: #d1d5db;
}

.content-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 4px 18px rgba(15, 23, 42, .05);
}

.graduate-card {
  text-align: center;
}

.graduate-avatar {
  display: grid;
  width: 72px;
  height: 72px;
  margin: 4px auto 12px;
  place-items: center;
  border-radius: 50%;
  color: #8c1515;
  background: #fbecec;
}

.graduate-avatar .c-icon {
  width: 34px;
  height: 34px;
}

.graduate-card h2 {
  margin: 0;
  font-size: 20px;
}

.student-code {
  color: #6b7280;
}

.graduate-details {
  display: grid;
  gap: 12px;
  margin-top: 20px;
  text-align: left;
}

.graduate-details div {
  display: grid;
  gap: 3px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eef2f7;
}

.graduate-details span {
  color: #6b7280;
  font-size: 12px;
}

.graduate-details strong {
  color: #1f2937;
  overflow-wrap: anywhere;
}

.attendance-status {
  color: #15803d !important;
}

.tips-card h3 {
  margin: 0 0 12px;
  color: #374151;
  font-size: 15px;
}

.tips-card ul {
  margin: 0;
  padding-left: 20px;
  color: #4b5563;
  font-size: 13px;
}

.tips-card li + li {
  margin-top: 8px;
}

.camera-heading {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.camera-heading h2 {
  margin: 0;
  font-size: 20px;
}

.camera-heading p {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.status-pill {
  display: flex;
  gap: 7px;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  color: #92400e;
  background: #fef3c7;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.status-pill i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f59e0b;
}

.status-pill--active {
  color: #1d4ed8;
  background: #dbeafe;
}

.status-pill--active i {
  background: #2563eb;
}

.status-pill--success {
  color: #166534;
  background: #dcfce7;
}

.status-pill--success i {
  background: #16a34a;
}

.status-pill--danger {
  color: #991b1b;
  background: #fee2e2;
}

.status-pill--danger i {
  background: #dc2626;
}

.camera-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.scan-hint {
  position: absolute;
  top: 14px;
  left: 50%;
  display: flex;
  max-width: 90%;
  align-items: center;
  padding: 8px 14px;
  transform: translateX(-50%);
  border-radius: 999px;
  color: #fff;
  background: rgba(180, 83, 9, .92);
  font-size: 13px;
  font-weight: 600;
  text-align: left;
}

.scan-hint--ready {
  background: rgba(21, 128, 61, .92);
}

.capture-confirmation--pending {
  background: rgba(30, 64, 175, .92);
}

.camera-stage {
  position: relative;
  display: grid;
  min-height: 480px;
  overflow: hidden;
  place-items: center;
  border: 2px dashed #cbd5e1;
  border-radius: 14px;
  background: #f8fafc;
}

.camera-stage--active {
  border-style: solid;
  border-color: #8c1515;
  background: #111827;
}

.camera-stage--ready {
  border-color: #16a34a;
}

.camera-stage--captured {
  border-style: solid;
  border-color: #16a34a;
}

.camera-stage video,
.camera-stage img {
  width: 100%;
  height: 480px;
  object-fit: cover;
}

.camera-empty {
  padding: 24px;
  text-align: center;
  color: #64748b;
}

.camera-empty h3 {
  margin: 14px 0 4px;
  color: #334155;
  font-size: 18px;
}

.camera-empty p {
  margin: 0;
}

.camera-icon {
  display: grid;
  width: 76px;
  height: 76px;
  margin: auto;
  place-items: center;
  border-radius: 50%;
  color: #8c1515;
  background: #fbecec;
}

.camera-icon .c-icon {
  width: 36px;
  height: 36px;
}

.face-guide {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 230px;
  height: 300px;
  transform: translate(-50%, -50%);
  border: 3px solid rgba(255, 255, 255, .8);
  border-radius: 48% 48% 44% 44%;
  box-shadow: 0 0 0 999px rgba(0, 0, 0, .2);
  transition: border-color .2s ease;
}

.face-guide--ready {
  border-color: rgba(34, 197, 94, .95);
}

.capture-confirmation {
  position: absolute;
  bottom: 16px;
  left: 50%;
  padding: 8px 14px;
  transform: translateX(-50%);
  border-radius: 999px;
  color: #fff;
  background: rgba(22, 101, 52, .92);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.camera-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 18px;
}

.camera-actions .btn {
  min-width: 170px;
}

@media (max-width: 767px) {
  .page-header,
  .camera-heading {
    flex-direction: column;
  }

  .progress-step div {
    display: none;
  }

  .camera-stage,
  .camera-stage video,
  .camera-stage img {
    min-height: 390px;
    height: 390px;
  }

  .camera-actions {
    flex-direction: column;
  }

  .camera-actions .btn {
    width: 100%;
  }

  .face-guide {
    width: 190px;
    height: 250px;
  }
}
</style>
