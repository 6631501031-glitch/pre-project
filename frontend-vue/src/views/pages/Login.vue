<template>
  <div class="c-app flex-row align-items-center">
    <button
      type="button"
      class="login-language"
      :aria-label="lang === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'"
      @click="toggleLanguage"
    >
      {{ lang.toUpperCase() }}
    </button>

    <CContainer>
      <CRow class="justify-content-center">
        <CCol md="6" lg="5">
          <CCard class="login-card">
            <CCardBody>
              <div class="login-brand">
                <img src="@/assets/logo.svg" height="118px" alt="MFU" />
                <h3>{{ copy.title }}</h3>
              </div>

              <CForm
                v-if="false" class="student-login-form"
                @submit.prevent="onAuthenStudent"
              >
                <CInput
                  ref="studentCodeField"
                  v-model.trim="studentCode"
                  :label="copy.studentCode"
                  :placeholder="copy.studentCodePlaceholder"
                  autocomplete="username"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  :disabled="submitting"
                  @keydown.native="onStudentCodeKeydown"
                  @paste.native="onStudentCodePaste"
                >
                  <template #prepend-content>
                    <CIcon name="cil-user" />
                  </template>
                </CInput>

                <CButton
                  color="danger"
                  class="student-login-button"
                  type="submit"
                  :disabled="submitting || !studentCode"
                >
                  {{ copy.signIn }}
                </CButton>
              </CForm>
              <div class="login-divider"><span>{{ copy.or }}</span></div>
              <CButton color="light" variant="outline" class="google-login-button" :disabled="submitting" @click="onAuthenGoogle">
                <img src="@/assets/icons/logo-google.png" width="22" height="22" alt="" />
                {{ copy.googleSignIn }}
              </CButton>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>

    <TwoFA />
    <CenterLoading />
    <DialogMessage />
  </div>
</template>

<script>
import TwoFA from '@/projects/components/dialog/TwoFA.vue'
import CenterLoading from '@/projects/components/dialog/CenterLoading.vue'
import DialogMessage from '@/projects/components/dialog/DialogMessage.vue'

let googleLibraryPromise = null

function loadGoogleLibrary () {
  if (
    window.google &&
    window.google.accounts &&
    window.google.accounts.id
  ) {
    return Promise.resolve()
  }

  if (googleLibraryPromise) return googleLibraryPromise

  googleLibraryPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      script.remove()
      googleLibraryPromise = null
      reject(new Error('Google Sign-In library could not be loaded'))
    }
    document.head.appendChild(script)
  })

  return googleLibraryPromise
}

export default {
  name: 'Login',

  components: {
    TwoFA,
    CenterLoading,
    DialogMessage
  },

  data () {
    return {
      studentCode: '',
      submitting: false,
      googleReady: false,
      googleLoadFailed: false,
      googleDisposed: false
    }
  },

  computed: {
    lang () {
      return this.$store.getters['setting/lang'] || 'th'
    },

    copy () {
      if (this.lang === 'en') {
        return {
          title: 'Student Sign In',
          studentCode: 'Student ID',
          studentCodePlaceholder: 'Enter your student ID',
          signIn: 'Sign In',
          or: 'or',
          googleSignIn: 'Administrator sign in with MFU email',
          codeRequired: 'Please enter your student ID',
          googleLoading: 'Loading Google Sign-In...',
          googleLoadFailed: 'Unable to load Google Sign-In. Please refresh.',
          googleAuthFailed: 'Administrator sign-in failed. Please check the backend response.'
        }
      }

      return {
        title: 'เข้าสู่ระบบนักศึกษา',
        studentCode: 'รหัสนักศึกษา',
        studentCodePlaceholder: 'กรอกรหัสนักศึกษา',
        signIn: 'เข้าสู่ระบบ',
        or: 'หรือ',
        googleSignIn: 'ผู้ดูแลเข้าสู่ระบบด้วยอีเมล MFU',
        codeRequired: 'กรุณากรอกรหัสนักศึกษา',
        googleLoading: 'กำลังโหลด Google Sign-In...',
        googleLoadFailed: 'โหลด Google Sign-In ไม่สำเร็จ กรุณารีเฟรชหน้าเว็บ',
        googleAuthFailed: 'เข้าสู่ระบบผู้ดูแลไม่สำเร็จ กรุณาตรวจการตอบกลับจาก Backend'
      }
    }
  },

  watch: {
    lang () {
      if (this.googleReady) {
        this.$nextTick(() => this.renderGoogleButton())
      }
    }
  },

  async mounted () {
    try {
      const clientId = String(
        process.env.VUE_APP_CLIENTID || ''
      ).trim()

      if (!clientId) {
        throw new Error('Missing VUE_APP_CLIENTID')
      }

      await loadGoogleLibrary()

      if (this.googleDisposed) return

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: response => this.onGoogleCredential(response),
        auto_select: false,
        ux_mode: 'popup'
      })

      this.googleReady = true
      this.renderGoogleButton()
    } catch (err) {
      if (this.googleDisposed) return

      this.googleLoadFailed = true
      this.showAuthError(
        process.env.VUE_APP_CLIENTID
          ? this.copy.googleLoadFailed
          : 'กรุณาตั้งค่า VUE_APP_CLIENTID ใน frontend-vue/.env.local',
        'AUTH_GOOGLE_INIT_FAILED'
      )
    }
  },

  beforeDestroy () {
    this.googleDisposed = true
  },

  methods: {
    toggleLanguage () {
      this.$store.commit(
        'setting/lang',
        this.lang === 'th' ? 'en' : 'th'
      )
    },

    showAuthError (message, code) {
      this.$store.commit('dialog/dialog', {
        title: 'Authentication Error',
        message,
        code,
        number: '1',
        status: true
      })
    },

    renderGoogleButton () {
      const container = this.$refs.googleSignInButton
      if (!container || this.googleDisposed) return

      container.innerHTML = ''

      window.google.accounts.id.renderButton(container, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        locale: this.lang === 'th' ? 'th' : 'en'
      })
    },

    onStudentCodeKeydown (event) {
      const allowedKeys = [
        'Backspace',
        'Delete',
        'Tab',
        'Enter',
        'Escape',
        'ArrowLeft',
        'ArrowRight',
        'Home',
        'End'
      ]

      if (
        !event ||
        allowedKeys.includes(event.key) ||
        event.ctrlKey ||
        event.metaKey
      ) return

      if (!/^\d$/.test(event.key)) {
        event.preventDefault()
      }
    },

    onStudentCodePaste (event) {
      if (!event || !event.clipboardData) return

      const digits = String(
        event.clipboardData.getData('text') || ''
      ).replace(/\D/g, '')

      event.preventDefault()
      if (digits) this.studentCode = digits
    },

    async onAuthenStudent () {
      if (this.submitting) return

      const username = String(this.studentCode || '')
        .replace(/\D/g, '')
        .trim()

      if (!username) {
        this.showAuthError(
          this.copy.codeRequired,
          'AUTH_STUDENT_CODE_REQUIRED'
        )
        return
      }

      this.submitting = true

      try {
        await this.$store.dispatch('auth/signIn', {
          username,
          studentCode: username,
          barcodeValue: username,
          password: '********',
          loginMethod: 'student-code'
        })
      } finally {
        this.submitting = false
      }
    },

    async onGoogleCredential (response) {
      if (this.googleDisposed || this.submitting) return

      if (!response || !response.credential) {
        this.showAuthError(
          this.copy.googleAuthFailed,
          'AUTH_GOOGLE_TOKEN_MISSING'
        )
        return
      }

      this.submitting = true

      try {
        await this.$store.dispatch('auth/signIn', {
          token: response.credential,
          authType: '689c06d5255db4e56aea8902'
        })
      } catch (err) {
        const status = err && err.response
          ? err.response.status
          : null

        const message = status
          ? `${this.copy.googleAuthFailed} (HTTP ${status})`
          : this.copy.googleAuthFailed

        this.showAuthError(message, 'AUTH_GOOGLE_FAILED')
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.login-card {
  position: relative;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 16px 38px rgba(15, 23, 42, 0.14);
}

.login-language {
  position: fixed;
  z-index: 10;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  padding: 0;
  border: 1px solid #3399ff;
  border-radius: 50%;
  color: #3399ff;
  background: transparent;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
}

.login-language:hover {
  color: #fff;
  background: #3399ff;
}

.login-language:focus {
  outline: 2px solid rgba(51, 153, 255, 0.25);
  outline-offset: 2px;
}

.login-brand {
  text-align: center;
}

.login-brand h3 {
  margin: 18px 0 6px;
  color: #111827;
  font-size: 24px;
  font-weight: 800;
}
.login-brand p {
  margin: 0 0 22px;
  color: #6b7280;
}
.student-login-form ::v-deep label {
  color: #374151;
  font-weight: 800;
}

.student-login-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 44px;
  border-radius: 8px;
  font-weight: 800;
}

.login-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 18px 0;
  color: #9ca3af;
  font-size: 12px;
}

.login-divider::before,
.login-divider::after {
  content: "";
  flex: 1 1 auto;
  height: 1px;
  background: #e5e7eb;
}

.google-admin-login {
  text-align: center;
}

.google-admin-login p {
  margin: 0 0 12px;
  color: #374151;
  font-size: 14px;
}

.google-button-container {
  display: flex;
  justify-content: center;
  min-height: 44px;
}

.google-admin-login.is-submitting .google-button-container {
  pointer-events: none;
  opacity: 0.6;
}

.google-admin-login .google-status {
  margin-top: 8px;
  color: #6b7280;
  font-size: 12px;
}
</style>