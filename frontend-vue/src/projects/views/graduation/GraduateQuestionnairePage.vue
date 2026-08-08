<template>
  <main class="questionnaire-standalone">
    <header class="standalone-header">
      <div class="standalone-header__inner">
        <div class="standalone-brand">
          <span class="standalone-brand__logo">
            <img src="@/assets/logo.svg" alt="MFU">
          </span>
          <span class="standalone-brand__text">
            <strong>MFU</strong>
            <small>{{ systemLabel }}</small>
          </span>
        </div>
        <div class="standalone-header__actions">
          <button type="button" class="standalone-logout" :disabled="signingOut" @click="logout">
            <CIcon name="cil-account-logout" />
            <span>{{ signingOut ? signingOutLabel : logoutLabel }}</span>
          </button>
        </div>
      </div>
    </header>

    <section class="questionnaire-hero">
      <div class="questionnaire-hero__eyebrow">
        <span>{{ stepLabel }}</span>
        <i aria-hidden="true"></i>
      </div>
      <h1>{{ titleLabel }}</h1>
      <p>{{ subtitleLabel }}</p>
    </section>

    <div class="questionnaire-standalone__content">
      <div class="questionnaire-shell">
        <div class="questionnaire-shell__accent"></div>
        <GraduateQuestionnaire />
        <div class="questionnaire-shell__footer">
          <CIcon name="cil-info" />
          <span>{{ footerLabel }}</span>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
import GraduateQuestionnaire from './GraduateQuestionnaire'
import { getGraduationProgress, graduationStepTotal } from '@/projects/utils/graduation-workflow-progress'

export default {
  name: 'GraduateQuestionnairePage',
  components: {
    GraduateQuestionnaire
  },
  data () {
    return {
      signingOut: false
    }
  },
  computed: {
    isEnglish () {
      return String((this.$i18n && this.$i18n.locale) || '').toLowerCase().startsWith('en')
    },
    systemLabel () {
      return this.isEnglish ? 'Student Intention System' : 'ระบบแจ้งความประสงค์นักศึกษา'
    },
    logoutLabel () {
      return this.isEnglish ? 'Sign out' : 'ออกจากระบบ'
    },
    signingOutLabel () {
      return this.isEnglish ? 'Signing out...' : 'กำลังออกจากระบบ...'
    },
    stepLabel () {
      const total = graduationStepTotal(getGraduationProgress(this.currentProfile))
      return this.isEnglish ? `Step 1 of ${total}` : `ขั้นตอนที่ 1 จาก ${total}`
    },
    currentProfile () {
      return this.$store && this.$store.getters ? this.$store.getters['auth/profile'] : null
    },
    titleLabel () {
      return this.isEnglish ? 'Graduate questionnaire' : 'แบบสอบถามบัณฑิต'
    },
    subtitleLabel () {
      return this.isEnglish
        ? 'Please complete the questionnaire before continuing to the intention form.'
        : 'กรุณาตอบแบบสอบถามให้เรียบร้อย ก่อนดำเนินการแจ้งความประสงค์ในขั้นตอนถัดไป'
    },
    footerLabel () {
      return this.isEnglish
        ? 'After saving, you will be redirected to the intention form.'
        : 'เมื่อบันทึกสำเร็จ ระบบจะพาคุณไปยังหน้าแจ้งความประสงค์โดยอัตโนมัติ'
    }
  },
  methods: {
    async logout () {
      if (this.signingOut) return
      this.signingOut = true
      try {
        await this.$store.dispatch('auth/signOut')
      } finally {
        this.signingOut = false
      }
    }
  }
}
</script>

<style scoped>
.questionnaire-standalone {
  min-height: 100vh;
  padding-bottom: 64px;
  color: #172033;
  background:
    radial-gradient(circle at 88% 5%, rgba(254, 194, 96, 0.24), transparent 28%),
    linear-gradient(180deg, #fffaf2 0, #f5f6f8 310px, #eef1f5 100%);
}
.standalone-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(105deg, #7d1017 0%, #94151c 72%, #741017 100%);
  box-shadow: 0 5px 20px rgba(90, 12, 18, 0.22);
}
.standalone-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: min(1120px, calc(100% - 48px));
  min-height: 82px;
  margin: 0 auto;
}
.standalone-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.standalone-brand__logo {
  display: grid;
  width: 42px;
  height: 54px;
  place-items: center;
}
.standalone-brand__logo img {
  width: 40px;
  height: 52px;
  object-fit: contain;
}
.standalone-brand__text {
  display: grid;
  line-height: 1.2;
}
.standalone-brand__text strong {
  color: #fff;
  font-size: 21px;
  letter-spacing: 0.02em;
}
.standalone-brand__text small {
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.94);
  font-size: 14px;
  font-weight: 700;
}
.standalone-header__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.standalone-logout {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 42px;
  padding: 5px 14px 5px 6px;
  border: 1px solid rgba(255, 255, 255, 0.26);
  border-radius: 999px;
  color: #fff;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.08));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 5px 14px rgba(55, 5, 10, 0.18);
  backdrop-filter: blur(8px);
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.01em;
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}
.standalone-logout .c-icon {
  width: 30px;
  height: 30px;
  padding: 7px;
  border-radius: 50%;
  color: #8c1515;
  background: #fff;
  box-shadow: 0 3px 9px rgba(58, 5, 9, 0.18);
}
.standalone-logout:hover,
.standalone-logout:focus {
  border-color: rgba(255, 255, 255, 0.48);
  color: #fff;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.13));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 8px 18px rgba(55, 5, 10, 0.24);
  transform: translateY(-1px);
  outline: none;
}
.standalone-logout:active {
  box-shadow: inset 0 1px 4px rgba(45, 4, 8, 0.18), 0 3px 9px rgba(55, 5, 10, 0.16);
  transform: translateY(0);
}
.standalone-logout:disabled {
  cursor: wait;
  opacity: 0.62;
  transform: none;
}
.questionnaire-hero {
  width: min(980px, calc(100% - 48px));
  margin: 0 auto;
  padding: 48px 0 28px;
  text-align: center;
}
.questionnaire-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 13px;
  padding: 6px 12px;
  border-radius: 999px;
  color: #8c1515;
  background: #fff0f0;
  font-size: 12px;
  font-weight: 700;
}
.questionnaire-hero__eyebrow i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #c9a227;
  box-shadow: 0 0 0 4px rgba(201, 162, 39, 0.15);
}
.questionnaire-hero h1 {
  margin: 0;
  color: #172033;
  font-size: clamp(30px, 4vw, 42px);
  font-weight: 800;
  letter-spacing: -0.02em;
}
.questionnaire-hero p {
  max-width: 680px;
  margin: 12px auto 0;
  color: #64748b;
  font-size: 15px;
  line-height: 1.7;
}
.questionnaire-standalone__content {
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
}
.questionnaire-shell {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 22px 55px rgba(15, 23, 42, 0.1);
}
.questionnaire-shell__accent {
  height: 5px;
  background: linear-gradient(90deg, #8c1515 0%, #b91c1c 58%, #c9a227 100%);
}
.questionnaire-shell__footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 15px 28px;
  border-top: 1px solid #edf0f3;
  color: #64748b;
  background: #fafbfc;
  font-size: 12px;
}
::v-deep .graduate-questionnaire-page {
  padding: 0;
}
::v-deep .questionnaire-header {
  display: none;
}
::v-deep .questionnaire-card {
  margin: 0;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}
::v-deep .questionnaire-card .card-body {
  padding: 32px 28px 28px;
}
::v-deep .questionnaire-heading h2 {
  font-size: 22px;
}
::v-deep .form-control {
  min-height: 46px;
  border-color: #dce1e7;
  border-radius: 9px;
  background-color: #fff;
}
::v-deep textarea.form-control {
  min-height: 112px;
}
::v-deep .form-control:focus {
  border-color: #a94949;
  box-shadow: 0 0 0 3px rgba(140, 21, 21, 0.1);
}
@media (max-width: 767px) {
  .questionnaire-standalone {
    padding-bottom: 32px;
  }
  .standalone-header__inner,
  .questionnaire-hero {
    width: calc(100% - 28px);
  }
  .standalone-header__inner {
    min-height: 70px;
  }
  .questionnaire-hero {
    padding: 32px 0 22px;
  }
  .questionnaire-hero p {
    font-size: 14px;
  }
  .questionnaire-standalone__content {
    width: calc(100% - 24px);
  }
  .questionnaire-shell {
    border-radius: 15px;
  }
  ::v-deep .questionnaire-card .card-body {
    padding: 24px 18px 20px;
  }
  .questionnaire-shell__footer {
    align-items: flex-start;
    padding: 14px 18px;
  }
}
</style>
