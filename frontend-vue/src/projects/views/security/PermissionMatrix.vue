<template>
  <div class="access-management-page">
    <AppSectionHero
      :title="$t('security.permissionMatrix.management.title')"
      :subtitle="$t('security.permissionMatrix.management.subtitle')"
      :stats="stats"
      :refresh-label="$t('security.permissionMatrix.management.refresh')"
      @refresh="loadData"
    />

    <div v-if="loadError" class="alert alert-warning">{{ $t('security.permissionMatrix.management.loadError') }}</div>
    <div v-if="saveError" class="alert alert-danger">{{ $t('security.permissionMatrix.management.saveError') }}</div>
    <div v-if="loading" class="loading-state">{{ $t('security.permissionMatrix.management.loading') }}</div>

    <div v-else class="management-grid">
      <div class="left-column">
        <CCard class="management-card user-card">
          <CCardBody>
            <div class="card-heading">
              <h4>{{ $t('security.permissionMatrix.management.userList') }}</h4>
              <span class="user-count">{{ filteredUsers.length }} / {{ users.length }}</span>
            </div>

            <div class="filter-tabs" role="tablist">
              <button
                v-for="tab in tabs"
                :key="tab.key"
                type="button"
                class="filter-tab"
                :class="{ active: activeTab === tab.key }"
                @click="activeTab = tab.key"
              >{{ $t(`security.permissionMatrix.management.${tab.label}`) }} ({{ tab.count }})</button>
            </div>

            <div class="user-filters">
              <input v-model.trim="search" class="form-control" type="search" :placeholder="$t('security.permissionMatrix.management.search')">
              <select v-model="groupFilter" class="form-control" :aria-label="$t('security.permissionMatrix.management.allGroups')">
                <option value="">{{ $t('security.permissionMatrix.management.allGroups') }}</option>
                <option v-for="group in groups" :key="group._id" :value="group._id">{{ groupLabel(group) }}</option>
              </select>
            </div>

            <div v-if="filteredUsers.length" class="user-list">
              <button
                v-for="user in filteredUsers"
                :key="user._id"
                type="button"
                class="user-row"
                :class="{ selected: user._id === selectedAccountId }"
                @click="selectUser(user)"
              >
                <span class="avatar" :class="{ inactive: !user.accessEnabled }">{{ user.initial }}</span>
                <span class="user-main">
                  <span class="user-email">{{ user.email || user.label }}</span>
                  <span class="user-name">{{ user.email ? user.label : user.code || '' }}</span>
                </span>
                <span class="user-group">{{ user.groupLabel || $t('security.permissionMatrix.management.unassigned') }}</span>
                <span class="status-pill" :class="user.accessEnabled ? 'is-enabled' : 'is-disabled'">
                  {{ $t(`security.permissionMatrix.management.${user.accessEnabled ? 'on' : 'off'}`) }}
                </span>
              </button>
            </div>
            <div v-else class="empty-state">{{ $t('security.permissionMatrix.management.noUsers') }}</div>
          </CCardBody>
        </CCard>
      </div>

      <CCard class="management-card detail-card">
        <CCardBody v-if="selectedUser">
          <div class="detail-heading">
            <h4>{{ $t('security.permissionMatrix.management.details') }}</h4>
            <span class="status-pill" :class="draftAccess ? 'is-enabled' : 'is-disabled'">
              {{ $t(`security.permissionMatrix.management.${draftAccess ? 'on' : 'off'}`) }}
            </span>
          </div>

          <div class="identity-block">
            <span class="avatar detail-avatar">{{ selectedUser.initial }}</span>
            <div>
              <div class="detail-email">{{ selectedUser.email || selectedUser.label }}</div>
              <div class="detail-name">{{ selectedUser.label }}</div>
            </div>
          </div>

          <div class="access-toggle-row">
            <strong>{{ $t('security.permissionMatrix.management.enableAccess') }}</strong>
            <label class="switch-control">
              <input v-model="draftAccess" type="checkbox" :disabled="!canEditAccess">
              <span class="switch-slider"></span>
            </label>
            <span :class="draftAccess ? 'text-success' : 'text-muted'">{{ $t(`security.permissionMatrix.management.${draftAccess ? 'on' : 'off'}`) }}</span>
          </div>

          <div class="form-grid">
            <label>
              <span>{{ $t('security.permissionMatrix.management.group') }}</span>
              <select v-model="selectedGroupId" class="form-control" :disabled="!canEditAccess" @change="onGroupChange">
                <option value="">{{ $t('security.permissionMatrix.management.selectGroup') }}</option>
                <option v-for="group in groups" :key="group._id" :value="group._id">{{ groupLabel(group) }}</option>
              </select>
            </label>
            <label>
              <span>{{ $t('security.permissionMatrix.management.role') }}</span>
              <input class="form-control" :value="selectedRoleLabel" disabled>
            </label>
            <label class="full-width">
              <span>{{ $t('security.permissionMatrix.management.scope') }}</span>
              <select v-model="draftScope" class="form-control" :disabled="!canEditAccess || !selectedGroupId">
                <option value="self">{{ $t('security.permissionMatrix.management.self') }}</option>
                <option value="unit">{{ $t('security.permissionMatrix.management.unit') }}</option>
                <option value="org">{{ $t('security.permissionMatrix.management.org') }}</option>
              </select>
            </label>
          </div>

          <div class="permissions-heading">
            <h5>{{ $t('security.permissionMatrix.management.menuPermissions') }}</h5>
            <span v-if="selectedGroup">{{ groupLabel(selectedGroup) }}</span>
          </div>
          <div v-if="selectedGroupId && menuRows.length" class="permission-table-wrap">
            <table class="permission-table">
              <thead>
                <tr>
                  <th>{{ $t('security.permissionMatrix.fields.menu') }}</th>
                  <th>{{ $t('security.permissionMatrix.management.view') }}</th>
                  <th>{{ $t('security.permissionMatrix.management.create') }}</th>
                  <th>{{ $t('security.permissionMatrix.management.edit') }}</th>
                  <th>{{ $t('security.permissionMatrix.management.delete') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="menu in menuRows" :key="menu._id">
                  <td>
                    <strong>{{ menuLabel(menu) }}</strong>
                    <small>{{ menu.path }}</small>
                  </td>
                  <td v-for="permission in permissionFields" :key="permission.key" class="checkbox-cell">
                    <input
                      type="checkbox"
                      :checked="!!(permissionDraft[menu._id] && permissionDraft[menu._id][permission.key])"
                      :disabled="!canEditAccess"
                      :aria-label="`${menuLabel(menu)} — ${$t(`security.permissionMatrix.management.${permission.label}`)}`"
                      @change="setPermission(menu._id, permission.key, $event.target.checked)"
                    >
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state compact">
            {{ selectedGroupId ? $t('security.permissionMatrix.management.noMenus') : $t('security.permissionMatrix.management.selectGroup') }}
          </div>

          <div v-if="permissionDirty" class="group-warning">
            <p>{{ $t('security.permissionMatrix.management.groupWarning') }}</p>
            <label><input v-model="acknowledgeGroupChanges" type="checkbox"> {{ $t('security.permissionMatrix.management.acknowledge') }}</label>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-primary save-button" :disabled="!canSave || saving" @click="saveChanges">
              {{ saving ? $t('security.permissionMatrix.management.loading') : $t('security.permissionMatrix.management.save') }}
            </button>
            <button type="button" class="btn btn-outline-secondary" :disabled="saving || !selectedUser" @click="resetEditor">
              {{ $t('security.permissionMatrix.management.cancel') }}
            </button>
          </div>
          <p v-if="!canEditAccess" class="permission-denied">{{ $t('security.permissionMatrix.messages.saveError') }}</p>
        </CCardBody>
        <CCardBody v-else class="empty-state detail-empty">
          {{ $t('security.permissionMatrix.management.noUsers') }}
        </CCardBody>
      </CCard>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import AppSectionHero from '@/projects/components/layout/AppSectionHero'
import SecurityAccess from '@/projects/mixins/securityAccess'
import Service from '@/service/api'
import { notifyError, notifySuccess } from '@/projects/utils/notify'
import { buildGroupPermissionChanges, getPermissionValues, hasActiveAssignment } from './permission-management.shared'

export default {
  name: 'PermissionMatrix',
  mixins: [SecurityAccess],
  components: { AppSectionHero },
  data () {
    return {
      loading: true,
      saving: false,
      loadError: false,
      saveError: false,
      search: '',
      activeTab: 'all',
      groupFilter: '',
      selectedAccountId: '',
      selectedGroupId: '',
      draftAccess: false,
      initialAccess: false,
      draftScope: 'self',
      permissionDraft: {},
      acknowledgeGroupChanges: false,
      permissionFields: [
        { key: 'view', label: 'view' },
        { key: 'action', label: 'create' },
        { key: 'edit', label: 'edit' },
        { key: 'delete', label: 'delete' }
      ]
    }
  },
  computed: {
    ...mapGetters({
      assignments: 'security/assignment/assignments',
      groups: 'security/assignment/groups',
      storedAccounts: 'security/assignment/accounts',
      menus: 'security/permissionMatrix/menus',
      permissions: 'security/permissionMatrix/permissions'
    }),
    users () {
      const source = this.storedAccounts
      return (source || []).map(account => {
        const accountAssignments = (this.assignments || []).filter(item => item.accountId === account._id)
        const activeAssignment = accountAssignments.find(item => item.active)
        const currentAssignment = activeAssignment || accountAssignments[0]
        const group = currentAssignment && (this.groups || []).find(item => item._id === currentAssignment.groupId)
        return Object.assign({}, account, {
          accessEnabled: hasActiveAssignment(account._id, this.assignments),
          groupLabel: group ? this.groupLabel(group) : '',
          assignmentCount: accountAssignments.length
        })
      })
    },
    filteredUsers () {
      const query = this.search.toLowerCase()
      return this.users.filter(user => {
        const statusMatch = this.activeTab === 'all' || (this.activeTab === 'enabled' ? user.accessEnabled : !user.accessEnabled)
        const groupMatch = !this.groupFilter || (this.assignments || []).some(item => item.accountId === user._id && item.groupId === this.groupFilter)
        const textMatch = !query || [user.email, user.label, user.code].some(value => String(value || '').toLowerCase().includes(query))
        return statusMatch && groupMatch && textMatch
      })
    },
    tabs () {
      return [
        { key: 'all', label: 'all', count: this.users.length },
        { key: 'enabled', label: 'enabled', count: this.users.filter(user => user.accessEnabled).length },
        { key: 'disabled', label: 'disabled', count: this.users.filter(user => !user.accessEnabled).length }
      ]
    },
    selectedUser () {
      return this.users.find(user => user._id === this.selectedAccountId) || null
    },
    selectedGroup () {
      return (this.groups || []).find(group => group._id === this.selectedGroupId) || null
    },
    selectedRoleLabel () {
      if (!this.selectedGroup) return ''
      return this.selectedGroup.visibleTypeName || this.selectedGroup.name || this.groupLabel(this.selectedGroup)
    },
    menuRows () {
      return (this.menus || []).filter(menu => menu && menu._id && menu.state !== false)
    },
    permissionDirty () {
      if (!this.selectedGroupId) return false
      return buildGroupPermissionChanges(this.menuRows, this.permissions, this.selectedGroupId, this.permissionDraft).creates.length > 0 ||
        buildGroupPermissionChanges(this.menuRows, this.permissions, this.selectedGroupId, this.permissionDraft).updates.length > 0
    },
    assignmentDirty () {
      if (!this.selectedUser || !this.selectedGroupId) return false
      const current = this.assignments.find(item => item.accountId === this.selectedAccountId && item.groupId === this.selectedGroupId)
      return this.initialAccess !== this.draftAccess || !!(current && (current.dataScope || 'self') !== this.draftScope)
    },
    canEditAccess () {
      return this.canEditPath('/security/permission')
    },
    canSave () {
      return this.canEditAccess && !!this.selectedUser && !!this.selectedGroupId &&
        (this.assignmentDirty || this.permissionDirty) && (!this.permissionDirty || this.acknowledgeGroupChanges)
    },
    stats () {
      return [
        { label: this.$t('security.permissionMatrix.management.totalUsers'), value: this.users.length, icon: 'cil-people', iconClass: 'app-section-stat__icon--primary' },
        { label: this.$t('security.permissionMatrix.management.enabledUsers'), value: this.users.filter(user => user.accessEnabled).length, icon: 'cil-check-circle', iconClass: 'app-section-stat__icon--active' },
        { label: this.$t('security.permissionMatrix.management.disabledUsers'), value: this.users.filter(user => !user.accessEnabled).length, icon: 'cil-ban', iconClass: 'app-section-stat__icon--attention' },
        { label: this.$t('security.permissionMatrix.management.groupsCount'), value: (this.groups || []).length, icon: 'cil-sitemap', iconClass: 'app-section-stat__icon--primary' }
      ]
    }
  },
  created () {
    this.loadData()
  },
  methods: {
    async loadData () {
      this.loading = true
      this.loadError = false
      this.saveError = false
      try {
        await Promise.all([
          this.$store.dispatch('security/assignment/explorer'),
          this.$store.dispatch('security/permissionMatrix/explorer')
        ])
        if (!this.users.some(item => item._id === this.selectedAccountId)) {
          this.selectedAccountId = this.users.length ? this.users[0]._id : ''
        }
        this.resetEditor()
      } catch (error) {
        this.loadError = true
      } finally {
        this.loading = false
      }
    },
    localizedValue (value) {
      if (!Array.isArray(value)) return String(value || '')
      const locale = this.$i18n && this.$i18n.locale === 'en' ? 'en' : 'th'
      const selected = value.find(item => item && item.key === locale && item.value) || value.find(item => item && item.value)
      return selected ? String(selected.value) : ''
    },
    groupLabel (group) {
      return this.localizedValue(group && group.title) || group.name || group._id
    },
    menuLabel (menu) {
      return this.localizedValue(menu && menu.title) || menu.name || menu.path || '-'
    },
    selectUser (user) {
      this.selectedAccountId = user._id
      this.resetEditor()
    },
    resetEditor () {
      const assignments = (this.assignments || []).filter(item => item.accountId === this.selectedAccountId)
      const initial = assignments.find(item => item.active) || assignments[0] || null
      if (!this.selectedGroupId || !assignments.some(item => item.groupId === this.selectedGroupId)) {
        this.selectedGroupId = initial ? initial.groupId : ''
      }
      const selectedAssignment = assignments.find(item => item.groupId === this.selectedGroupId) || null
      this.initialAccess = hasActiveAssignment(this.selectedAccountId, this.assignments)
      this.draftAccess = this.initialAccess
      this.draftScope = selectedAssignment ? selectedAssignment.dataScope || 'self' : 'self'
      this.acknowledgeGroupChanges = false
      this.populatePermissionDraft()
      this.saveError = false
    },
    onGroupChange () {
      const assignment = (this.assignments || []).find(item => item.accountId === this.selectedAccountId && item.groupId === this.selectedGroupId)
      this.draftScope = assignment ? assignment.dataScope || 'self' : 'self'
      this.acknowledgeGroupChanges = false
      this.populatePermissionDraft()
    },
    populatePermissionDraft () {
      const draft = {}
      if (this.selectedGroupId) {
        this.menuRows.forEach(menu => {
          const permission = (this.permissions || []).find(item => item.groupId === this.selectedGroupId && item.menuId === menu._id)
          draft[menu._id] = getPermissionValues(permission)
        })
      }
      this.permissionDraft = draft
    },
    setPermission (menuId, key, value) {
      const current = Object.assign({ view: false, edit: false, delete: false, action: false }, this.permissionDraft[menuId] || {})
      current[key] = value
      this.$set(this.permissionDraft, menuId, current)
      this.acknowledgeGroupChanges = false
    },
    async saveChanges () {
      if (!this.canSave || this.saving) return
      this.saving = true
      this.saveError = false
      try {
        if (this.permissionDirty) {
          const changes = buildGroupPermissionChanges(this.menuRows, this.permissions, this.selectedGroupId, this.permissionDraft)
          if (changes.updates.length) await Service.security('update-permission-batch', { items: changes.updates })
          if (changes.creates.length) await Service.security('create-permission-batch', { items: changes.creates })
        }

        if (this.assignmentDirty) {
          const accountAssignments = this.assignments.filter(item => item.accountId === this.selectedAccountId)
          const selectedAssignment = accountAssignments.find(item => item.groupId === this.selectedGroupId)
          const currentlyEnabled = hasActiveAssignment(this.selectedAccountId, accountAssignments)

          if (!this.draftAccess && currentlyEnabled) {
            for (const assignment of accountAssignments.filter(item => item.active)) {
              await this.$store.dispatch('security/assignment/update', {
                _id: assignment._id,
                accountId: assignment.accountId,
                groupId: assignment.groupId,
                dataScope: assignment.dataScope || 'self',
                scopeUnits: assignment.scopeUnits || [],
                active: false
              })
            }
          } else if (this.draftAccess && !currentlyEnabled) {
            const payload = {
              accountId: this.selectedAccountId,
              groupId: this.selectedGroupId,
              dataScope: this.draftScope,
              scopeUnits: selectedAssignment ? selectedAssignment.scopeUnits : [],
              active: true
            }
            await this.$store.dispatch(selectedAssignment ? 'security/assignment/update' : 'security/assignment/create', Object.assign({}, payload, selectedAssignment ? { _id: selectedAssignment._id } : {}))
          } else if (selectedAssignment && (selectedAssignment.dataScope || 'self') !== this.draftScope) {
            await this.$store.dispatch('security/assignment/update', {
              _id: selectedAssignment._id,
              accountId: selectedAssignment.accountId,
              groupId: selectedAssignment.groupId,
              dataScope: this.draftScope,
              scopeUnits: selectedAssignment.scopeUnits || [],
              active: selectedAssignment.active !== false
            })
          }
        }

        await this.loadData()
        notifySuccess(this.$store, this.$t('security.permissionMatrix.management.saveSuccess'))
      } catch (error) {
        this.saveError = true
        notifyError(this.$store, this.$t('security.permissionMatrix.management.saveError'))
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style scoped lang="scss">
.access-management-page { max-width: 1440px; margin: 0 auto; }
.management-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(420px, .9fr); gap: 16px; align-items: start; }
.left-column { min-width: 0; }
.management-card { border: 1px solid #e1e8f0; border-radius: 16px; box-shadow: 0 8px 24px rgba(28, 48, 78, .06); }
.card-heading, .detail-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.card-heading h4, .detail-heading h4 { margin: 0; color: #152d5b; font-weight: 700; }
.user-count { color: #596b87; font-size: 13px; }
.filter-tabs { display: flex; gap: 16px; margin: 18px 0 14px; border-bottom: 1px solid #e3e9f1; }
.filter-tab { border: 0; border-bottom: 2px solid transparent; background: transparent; padding: 8px 10px; color: #526582; font-weight: 600; }
.filter-tab.active { color: #a51219; border-color: #a51219; }
.user-filters { display: grid; grid-template-columns: minmax(180px, 1fr) minmax(140px, .8fr); gap: 10px; margin-bottom: 14px; }
.user-list { display: grid; gap: 7px; max-height: 570px; overflow: auto; }
.user-row { width: 100%; display: flex; align-items: center; gap: 12px; text-align: left; padding: 10px; border: 1px solid #e5ebf2; border-radius: 9px; background: #fff; color: #233858; }
.user-row:hover, .user-row.selected { border-color: #468bff; background: #edf5ff; }
.avatar { width: 40px; height: 40px; flex: 0 0 40px; display: grid; place-items: center; border-radius: 50%; background: #9b171b; color: white; font-weight: 700; }
.avatar.inactive { background: #77849a; }
.user-main { display: grid; min-width: 0; flex: 1; }
.user-email { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #18386d; font-weight: 700; }
.user-name { margin-top: 2px; color: #6d7d95; font-size: 12px; }
.user-group { max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #435575; font-size: 13px; }
.status-pill { display: inline-flex; align-items: center; justify-content: center; border-radius: 20px; padding: 4px 9px; font-size: 12px; font-weight: 700; white-space: nowrap; }
.status-pill.is-enabled { color: #16894b; background: #d9f4e5; }
.status-pill.is-disabled { color: #647084; background: #e9edf3; }
.identity-block { display: flex; align-items: center; gap: 14px; padding: 18px 0; }
.detail-avatar { width: 54px; height: 54px; flex-basis: 54px; font-size: 19px; }
.detail-email { color: #17386d; font-size: 17px; font-weight: 700; overflow-wrap: anywhere; }
.detail-name { margin-top: 3px; color: #60718e; }
.access-toggle-row { display: flex; align-items: center; gap: 12px; padding: 13px 0; border-top: 1px solid #e7ecf3; border-bottom: 1px solid #e7ecf3; color: #243b61; }
.access-toggle-row strong { flex: 1; }
.switch-control { position: relative; display: inline-block; width: 52px; height: 28px; margin: 0; }
.switch-control input { width: 0; height: 0; opacity: 0; }
.switch-slider { position: absolute; inset: 0; border-radius: 28px; background: #b9c1cd; transition: .2s; cursor: pointer; }
.switch-slider:before { content: ''; position: absolute; width: 22px; height: 22px; left: 3px; top: 3px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.22); transition: .2s; }
.switch-control input:checked + .switch-slider { background: #25b46a; }
.switch-control input:checked + .switch-slider:before { transform: translateX(24px); }
.switch-control input:disabled + .switch-slider { opacity: .55; cursor: not-allowed; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 16px 0; }
.form-grid label { display: grid; gap: 6px; color: #475b7d; font-size: 13px; font-weight: 600; }
.form-grid .full-width { grid-column: 1 / -1; }
.permissions-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 5px 0 10px; }
.permissions-heading h5 { margin: 0; color: #16396d; font-weight: 700; }
.permissions-heading span { color: #596b87; font-size: 13px; }
.permission-table-wrap { overflow: auto; max-height: 390px; border: 1px solid #dfe7f0; border-radius: 9px; }
.permission-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.permission-table th, .permission-table td { padding: 8px 7px; border-bottom: 1px solid #e5ebf2; text-align: center; }
.permission-table th { position: sticky; top: 0; z-index: 1; background: #eff4f9; color: #314768; }
.permission-table th:first-child, .permission-table td:first-child { min-width: 155px; text-align: left; }
.permission-table td:first-child small { display: block; margin-top: 2px; color: #6c7d96; font-weight: 400; }
.checkbox-cell input { width: 17px; height: 17px; accent-color: #19a963; }
.group-warning { margin-top: 14px; padding: 12px; border: 1px solid #f1d28b; border-radius: 9px; background: #fff8e8; color: #674d11; font-size: 13px; }
.group-warning p { margin: 0 0 8px; font-weight: 700; }
.group-warning label { display: flex; align-items: flex-start; gap: 7px; margin: 0; }
.form-actions { display: flex; gap: 10px; margin-top: 16px; }
.save-button { background: #94151b; border-color: #94151b; }
.save-button:disabled { opacity: .55; }
.empty-state, .loading-state { padding: 40px 16px; text-align: center; color: #53647f; }
.empty-state.compact { padding: 18px; }
.detail-empty { min-height: 300px; display: grid; place-items: center; }
.permission-denied { margin: 12px 0 0; color: #a51219; }
@media (max-width: 1050px) { .management-grid { grid-template-columns: 1fr; } }
@media (max-width: 620px) { .user-filters, .form-grid { grid-template-columns: 1fr; } .form-grid .full-width { grid-column: auto; } .user-row { flex-wrap: wrap; } .user-main { min-width: calc(100% - 58px); } .user-group { margin-left: 50px; } .permission-table th, .permission-table td { padding: 7px 5px; } }
</style>
