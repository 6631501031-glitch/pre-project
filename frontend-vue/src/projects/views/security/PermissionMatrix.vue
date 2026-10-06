<template>
  <div class="admin-access-page">
    <AppSectionHero
      title="Admin access"
      subtitle="รายชื่อ Admin และตัวอย่างสิทธิ์การเข้าถึงระบบ"
      :stats="stats"
      meta-label="สถานะ"
      meta-value="UI only"
    />

    <CCard class="admin-access-card">
      <CCardBody>
        <div class="section-heading">
          <div>
            <h4 class="mb-1">สิทธิ์ Admin</h4>
            <p class="text-muted mb-0">สวิตช์ในหน้านี้เป็นตัวอย่าง UI และยังไม่บันทึกหรือส่งข้อมูลไปที่ระบบ</p>
          </div>
        </div>
        <div v-if="admins.length" class="admin-list">
          <div v-for="admin in admins" :key="admin.email" class="admin-row">
            <div class="admin-identity">
              <div class="admin-avatar">{{ admin.initial }}</div>
              <div class="admin-details">
                <div class="admin-email">{{ admin.email }}</div>
                <div class="admin-status">บัญชีปัจจุบัน</div>
              </div>
            </div>
            <div v-for="permission in permissionFields" :key="permission.key" class="permission-cell">
              <div class="permission-label">{{ permission.label }}</div>
              <label class="switch-control">
                <input v-model="admin.permissions[permission.key]" type="checkbox">
                <span class="switch-slider"></span>
              </label>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">ไม่มีข้อมูลบัญชีสำหรับแสดง</div>
      </CCardBody>
    </CCard>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import AppSectionHero from '@/projects/components/layout/AppSectionHero'

export default {
  name: 'PermissionMatrix',
  components: { AppSectionHero },
  data () {
    return {
      permissionFields: [
        { key: 'view', label: 'ดูข้อมูล' },
        { key: 'edit', label: 'แก้ไข' },
        { key: 'delete', label: 'ลบ' },
        { key: 'action', label: 'จัดการ' }
      ],
      admins: []
    }
  },
  computed: {
    ...mapGetters({ profile: 'auth/profile' }),
    stats () {
      return [{
        label: 'ดูระบบได้',
        value: this.admins.filter(admin => admin.permissions.view).length,
        hint: 'ค่าในหน้าจอนี้เท่านั้น',
        icon: 'cil-check-circle',
        iconClass: 'app-section-stat__icon--active'
      }, {
        label: 'ปิดสิทธิ์',
        value: this.admins.filter(admin => !admin.permissions.view).length,
        hint: 'ค่าในหน้าจอนี้เท่านั้น',
        icon: 'cil-lock-locked',
        iconClass: 'app-section-stat__icon--attention'
      }]
    }
  },
  created () {
    const profile = this.profile || {}
    const email = String(profile.email || (profile.userinfo && profile.userinfo.email) || '').trim()
    if (email) {
      this.admins = [{
        email,
        initial: email.charAt(0).toUpperCase(),
        permissions: { view: true, edit: true, delete: false, action: true }
      }]
    }
  }
}
</script>

<style scoped>
.admin-access-page { max-width: 1180px; margin: 0 auto; }
.admin-access-card { border-radius: 18px; }
.section-heading { padding-bottom: 18px; border-bottom: 1px solid #edf0f5; }
.admin-row { display: flex; align-items: center; gap: 18px; padding: 18px 16px; border: 1px solid #e1e7ef; border-radius: 10px; background: #f7f9fc; margin-top: 14px; }
.admin-identity { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 280px; }
.admin-avatar { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; color: #fff; background: #8c1515; font-size: 18px; font-weight: 700; }
.admin-email { color: #263858; font-size: 16px; font-weight: 700; }
.admin-status { margin-top: 3px; font-size: 13px; color: #68748a; }
.switch-control { position: relative; display: inline-block; width: 52px; height: 28px; margin: 0; cursor: pointer; }
.switch-control input { width: 0; height: 0; opacity: 0; }
.switch-slider { position: absolute; inset: 0; border-radius: 28px; background: #c9ced8; transition: .2s; }
.switch-slider:before { content: ''; position: absolute; width: 22px; height: 22px; left: 3px; top: 3px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.22); transition: .2s; }
.switch-control input:checked + .switch-slider { background: #2eb85c; }
.switch-control input:checked + .switch-slider:before { transform: translateX(24px); }
.permission-cell { width: 88px; text-align: center; }
.permission-label { margin-bottom: 7px; color: #52617a; font-size: 12px; font-weight: 700; }
.empty-state { padding: 52px 16px; text-align: center; color: #68748a; }
@media (max-width: 760px) { .admin-row { flex-wrap: wrap; } .admin-identity { flex-basis: 100%; } .permission-cell { flex: 1; } }
</style>
