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
              <CForm class="student-login-form" @submit.prevent="onAuthenStudent">
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
                  <template #prepend-content><CIcon name="cil-user" /></template>
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
    <TwoFA/>
    <CenterLoading/>
    <DialogMessage/>
  </div>
</template>

<script>
import TwoFA from '@/projects/components/dialog/TwoFA.vue'
import CenterLoading from '@/projects/components/dialog/CenterLoading.vue'
import DialogMessage from '@/projects/components/dialog/DialogMessage.vue'

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
      submitting: false
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
          codeRequired: 'Please enter your student ID'
        }
      }
      return {
        title: 'เข้าสู่ระบบนักศึกษา',
        studentCode: 'รหัสนักศึกษา',
        studentCodePlaceholder: 'กรอกรหัสนักศึกษา',
        signIn: 'เข้าสู่ระบบ',
        or: 'หรือ',
        googleSignIn: 'ผู้ดูแลเข้าสู่ระบบด้วยอีเมล MFU',
        codeRequired: 'กรุณากรอกรหัสนักศึกษา'
      }
    }
  },
  methods: {
    toggleLanguage () {
      this.$store.commit('setting/lang', this.lang === 'th' ? 'en' : 'th')
    },
    onStudentCodeKeydown (event) {
      const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'Home', 'End']
      if (!event || allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) return
      if (!/^\d$/.test(event.key)) {
        event.preventDefault()
      }
    },
    onStudentCodePaste (event) {
      if (!event || !event.clipboardData) return
      const digits = String(event.clipboardData.getData('text') || '').replace(/\D/g, '')
      event.preventDefault()
      if (!digits) return
      this.studentCode = digits
    },
    async onAuthenStudent () {
      const username = String(this.studentCode || '').replace(/\D/g, '').trim()
      if (!username) {
        this.$store.commit('dialog/dialog', {
          title: 'Authentication Error',
          message: this.copy.codeRequired,
          code: 'AUTH_STUDENT_CODE_REQUIRED',
          number: '1',
          status: true
        })
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
    async onAuthenGoogle() {
      this.submitting = true
      try {
        const googleUser = await this.$gAuth.signIn();
        const id_token = googleUser.getAuthResponse().id_token;
        const body = {
          token: id_token,
          authType: "689c06d5255db4e56aea8902"
        };
        await this.$store.dispatch("auth/signIn", body)
      } catch (err) {
        this.$store.commit("dialog/dialog", {
          title: "Authentication Error",
          message: "Google Sign-In failed. Please try again.",
          code: "AUTH_GOOGLE_FAILED",
          number: "1",
          status: true
        })
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
.student-login-button,
.google-login-button {
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
.google-login-button {
  gap: 10px;
  color: #374151;
  background: #fff;
}
.google-login-button:hover,
.google-login-button:focus {
  border-color: #8c1515;
  color: #8c1515;
  background: #fff8f8;
}
</style>
