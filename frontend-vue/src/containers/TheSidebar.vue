<template>
  <CSidebar
      class="bg-style1"
      size="lg"
      :minimize="minimize"
      unfoldable
      :show="show"
      @update:show="(value) => $store.commit('set', ['sidebarShow', value])"
  >
    <CSidebarBrand>
<!--      <CIcon-->
<!--          class="c-sidebar-brand-full"-->
<!--          name="logo"-->
<!--          size="custom-size"-->
<!--          :height="35"-->
<!--          viewBox="0 0 556 134"-->
<!--      />-->
      <div class="c-sidebar-brand-full" >
        <a href="/">
          <CRow >
            <img class="pt-2 pb-2" src="@/assets/logo.svg" height="60px">
            <CCol class="text-white">
              <p class="font-weight-bold mb-0 mt-2 h5">MFU</p>
              <p class="font-weight-bold">{{ $t('common.app.dashboardSystem') }}</p>
            </CCol>
          </CRow>
        </a>

      </div>


      <!--      <img src="@/assets/logo.svg" height="48"/>-->
      <CIcon
          class="c-sidebar-brand-minimized"
          name="logo"
          size="custom-size"
          :height="35"
          viewBox="0 0 110 134"
      />
    </CSidebarBrand>
    <CRenderFunction flat :contentToRender="navs"/>
    <CSidebarMinimizer
        class="c-d-md-down-none"
        @click.native="$store.commit('toggle', 'sidebarMinimize')"
    />
  </CSidebar>
</template>

<script>
import buildNav from './_nav'
import {
  getGraduationProgress,
  isFaceRegistrationEnabled,
  WORKFLOW_PROGRESS_EVENT
} from '@/projects/utils/graduation-workflow-progress'

export default {
  name: 'TheSidebar',
  data() {
    return {
      graduationProgress: {}
    }
  },
  computed: {
    currentProfile() {
      return this.$store.getters['auth/profile'] || {}
    },
    permissionLoaded() {
      return this.$store.getters['security/loaded']
    },
    isStudentLogin() {
      const profile = this.$store.getters['auth/profile'] || {}
      return !!String(profile.studentCode || profile.barcodeValue || '').replace(/\D/g, '')
    },
    navs() {
      this.$i18n.locale
      const navConfig = buildNav(this.$t.bind(this))
      const filtered = this.filterNavTree(navConfig)
      const faceEnabled = isFaceRegistrationEnabled(this.graduationProgress)
      const questionnaireSaved = !!this.graduationProgress.questionnaireSaved
      const registrationSaved = !!this.graduationProgress.registrationSaved
      const completedSteps = {
        '/graduation/questionnaire/form': questionnaireSaved,
        '/graduation/register': registrationSaved,
        '/graduation/ceremony-preferences': !!this.graduationProgress.ceremonySaved,
        '/graduation/face-checkin': !!this.graduationProgress.faceSaved
      }
      filtered.forEach(group => {
        const children = Array.isArray(group && group._children) ? group._children : []
        children.forEach(item => {
          if (this.isStudentLogin && item && [
            '/graduation/register',
            '/graduation/ceremony-preferences',
            '/graduation/face-checkin'
          ].includes(item.to) && !questionnaireSaved) {
            item.disabled = true
            item.addLinkClasses = 'graduation-step-link--disabled'
          }
          if (this.isStudentLogin && item && [
            '/graduation/ceremony-preferences',
            '/graduation/face-checkin'
          ].includes(item.to) && !registrationSaved) {
            item.disabled = true
            item.addLinkClasses = 'graduation-step-link--disabled'
          }
          if (item && item.to === '/graduation/face-checkin') {
            item.disabled = !faceEnabled
            item.addLinkClasses = !faceEnabled ? 'graduation-step-link--disabled' : ''
          }
          if (this.isStudentLogin && item && completedSteps[item.to]) {
            item.badge = { color: 'success', shape: 'pill', text: '✓' }
            item.addLinkClasses = 'graduation-step-link--completed'
          }
        })
      })
      return filtered
    },
    show() {
      return this.$store.state.sidebarShow
    },
    minimize() {
      return this.$store.state.sidebarMinimize
    }
  },
  watch: {
    '$route.path'() {
      this.refreshGraduationProgress()
    },
    currentProfile: {
      handler() {
        this.refreshGraduationProgress()
      },
      deep: true
    },
    '$store.state.XAccessToken': {
      async handler(value) {
        if (!value) return
        if (this.permissionLoaded) return
        try {
          await this.$store.dispatch('security/fetchMyPermissions')
        } catch (error) {
          // Keep sidebar visible if permission bootstrap fails.
        }
      },
      immediate: true
    }
  },
  mounted() {
    this.refreshGraduationProgress()
    window.addEventListener(WORKFLOW_PROGRESS_EVENT, this.refreshGraduationProgress)
  },
  beforeDestroy() {
    window.removeEventListener(WORKFLOW_PROGRESS_EVENT, this.refreshGraduationProgress)
  },
  methods: {
    refreshGraduationProgress() {
      const profile = this.$store.getters['auth/profile'] || {}
      this.graduationProgress = getGraduationProgress(profile)
    },
    normalizePermissionPath(path) {
      if (!path) return ''
      let normalized = String(path).trim()
      const queryIndex = normalized.indexOf('?')
      if (queryIndex !== -1) normalized = normalized.slice(0, queryIndex)
      const hashIndex = normalized.indexOf('#')
      if (hashIndex !== -1) normalized = normalized.slice(0, hashIndex)
      normalized = normalized.replace(/\/{2,}/g, '/')
      if (!normalized.startsWith('/')) normalized = `/${normalized}`
      if (normalized.length > 1 && normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1)
      }
      return normalized
    },
    swapPermissionPlurality(path) {
      const normalized = this.normalizePermissionPath(path)
      if (!normalized) return ''
      if (normalized.includes('/permissions')) return normalized.replace('/permissions', '/permission')
      if (normalized.includes('/permission')) return normalized.replace('/permission', '/permissions')
      return ''
    },
    permissionPaths(item) {
      const paths = []
      if (item && item.permission && item.permission.path) paths.push(item.permission.path)
      if (item && item.permission && Array.isArray(item.permission.paths)) {
        item.permission.paths.forEach(path => paths.push(path))
      }
      if (!paths.length && item) paths.push(item.to || item.route || '')
      return paths
        .map(this.normalizePermissionPath)
        .filter(Boolean)
    },
    hasViewPermission(item) {
      if (!item) return true
      if (item.unrestricted) return true
      const explicitPaths = this.permissionPaths(item)
      if (!this.permissionLoaded) {
        return !this.$store.state.XAccessToken
      }
      const matrix = this.$store.getters['security/matrix'] || {}
      const action = item.permission && item.permission.action ? item.permission.action : 'view'
      return explicitPaths.some(path => {
        const rule = matrix[path] || matrix[this.swapPermissionPlurality(path)]
        return !!(rule && (rule.all || rule[action] || rule.view))
      })
    },
    filterNavTree(items) {
      if (!Array.isArray(items)) return []

      const filtered = items.reduce((result, item) => {
        if (!item || typeof item !== 'object') return result
        if (item.adminOnly && this.isStudentLogin) return result

        if (item._name === 'CSidebarNavTitle') {
          result.push({ ...item })
          return result
        }

        const nextItem = { ...item }
        const children = Array.isArray(item._children) ? this.filterNavTree(item._children) : null
        const dropdownItems = Array.isArray(item.items) ? this.filterNavTree(item.items) : null

        if (children) nextItem._children = children
        if (dropdownItems) nextItem.items = dropdownItems

        const hasVisibleChildren = !!((children && children.length) || (dropdownItems && dropdownItems.length))

        if (hasVisibleChildren || this.hasViewPermission(item)) {
          result.push(nextItem)
        }

        return result
      }, [])

      return filtered.filter((item, index) => {
        if (item._name !== 'CSidebarNavTitle') return true
        const nextItem = filtered[index + 1]
        return !!nextItem && nextItem._name !== 'CSidebarNavTitle'
      })
    }
  }
}
</script>

<style>
.bg-style1{
  background: linear-gradient(30deg,#FEC260 0%,#8c1515 60%);
}
.graduation-step-link--disabled {
  cursor: not-allowed !important;
  opacity: 0.45;
}
.graduation-step-link--completed {
  position: relative;
  padding-right: 58px !important;
}
.graduation-step-link--completed:hover,
.graduation-step-link--completed.c-active {
  background: rgba(255, 255, 255, 0.09) !important;
}
.graduation-step-link--completed .badge-success {
  display: inline-grid;
  width: 22px;
  min-width: 22px;
  height: 22px;
  position: absolute;
  top: 50%;
  right: 18px;
  margin: 0;
  padding: 0;
  place-items: center;
  border: 2px solid rgba(255, 255, 255, 0.92);
  border-radius: 50%;
  color: #fff;
  background: #22c55e;
  box-shadow: 0 2px 8px rgba(20, 83, 45, 0.38);
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  transform: translateY(-50%);
}
.c-sidebar-minimized .graduation-step-link--completed {
  padding-right: 0 !important;
}
.c-sidebar-minimized .graduation-step-link--completed .badge-success {
  display: none;
}
</style>
