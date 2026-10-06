<template>
  <div class="admin-email-page">
    <AppSectionHero
      :title="$t('accounts.directory.adminPresence.title')"
      :refresh-label="$t('accounts.directory.adminPresence.refresh')"
      @refresh="loadData"
    />

    <CCard class="admin-email-card">
      <CCardBody>
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4 class="mb-0">{{ $t('accounts.directory.adminPresence.listTitle') }}</h4>
          <CBadge color="success" shape="pill">
            {{ $t('accounts.directory.adminPresence.onlineCount', { count: adminEmails.length }) }}
          </CBadge>
        </div>

        <div v-if="loadError" class="alert alert-warning">
          {{ $t('accounts.directory.adminPresence.loadError') }}
        </div>

        <div v-if="adminEmails.length">
          <div v-for="admin in adminEmails" :key="admin.id || admin.email" class="admin-email-row">
            <div class="admin-email-avatar">{{ admin.initial }}</div>
            <div class="flex-grow-1 font-weight-bold">{{ admin.email }}</div>
            <CBadge color="success">{{ $t('accounts.directory.adminPresence.active') }}</CBadge>
          </div>
        </div>
        <div v-else class="empty-state">
          {{ $t('accounts.directory.adminPresence.empty') }}
        </div>
      </CCardBody>
    </CCard>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import AppSectionHero from '@/projects/components/layout/AppSectionHero'
import Service from '@/service/api'

export default {
  name: 'AccountManagement',
  components: { AppSectionHero },
  data () {
    return { adminSessions: [], loadError: false, refreshTimer: null }
  },
  computed: {
    ...mapGetters({ profile: 'auth/profile' }),
    adminEmails () {
      const admins = (this.adminSessions || []).filter(item => item && item.email).map(item => ({
        id: item.id || item.email,
        email: item.email,
        initial: item.email.charAt(0).toUpperCase()
      }))
      const profile = this.profile || {}
      const currentEmail = String(profile.email || (profile.userinfo && profile.userinfo.email) || '').trim()
      if (currentEmail && !admins.some(item => item.email.toLowerCase() === currentEmail.toLowerCase())) {
        admins.unshift({ id: 'current-session', email: currentEmail, initial: currentEmail.charAt(0).toUpperCase() })
      }
      return admins
    }
  },
  created () {
    this.loadData()
    this.refreshTimer = setInterval(this.loadData, 15000)
  },
  beforeDestroy () {
    if (this.refreshTimer) clearInterval(this.refreshTimer)
  },
  methods: {
    async loadData () {
      try {
        const response = await Service.accounts('admin-active-sessions')
        const data = response && response.data && response.data.data ? response.data.data : {}
        this.adminSessions = Array.isArray(data.admins) ? data.admins : []
        this.loadError = false
      } catch (error) {
        this.loadError = true
      }
    }
  }
}
</script>

<style scoped>
.admin-email-page { max-width: 1180px; margin: 0 auto; }
.admin-email-card { border-radius: 18px; }
.admin-email-row { display: flex; align-items: center; gap: 14px; padding: 16px 4px; border-bottom: 1px solid #edf0f5; }
.admin-email-row:last-child { border-bottom: 0; }
.admin-email-avatar { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; color: #fff; background: #8c1515; font-weight: 700; }
.empty-state { padding: 48px 16px; text-align: center; color: #344054; }
</style>
