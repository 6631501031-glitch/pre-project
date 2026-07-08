<template>
  <div class="c-app flex-row align-items-center">
    <CContainer>
      <CRow class="justify-content-center">
        <CCol md="6" lg="5">
          <CCard class="login-card">
            <CCardBody>
              <div class="login-brand">
                <img src="@/assets/logo.svg" height="118px" alt="MFU" />
                <h3>เข้าสู่ระบบนักศึกษา</h3>
                <p>กรอกรหัสนักศึกษาเพื่อเข้าสู่ระบบ ไม่ต้องใช้รหัสผ่าน</p>
              </div>
              <CForm class="student-login-form" @submit.prevent="onAuthenStudent">
                <CInput
                  ref="studentCodeField"
                  v-model.trim="studentCode"
                  label="รหัสนักศึกษา"
                  placeholder="กรอกรหัสนักศึกษา"
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
                  เข้าสู่ระบบ
                </CButton>
              </CForm>
              <div class="login-divider"><span>หรือ</span></div>
              <CButton color="light" variant="outline" class="google-login-button" :disabled="submitting" @click="onAuthenGoogle">
                <img src="@/assets/icons/logo-google.png" width="22" height="22" alt="" />
                เข้าสู่ระบบด้วย MFU Google
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
  methods: {
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
          message: 'กรุณากรอกรหัสนักศึกษา',
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
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 16px 38px rgba(15, 23, 42, 0.14);
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
