<template>
  <div class="graduation-admin-workspace">
    <div class="workspace-header">
      <div>
        <div class="workspace-header__eyebrow">Graduation Control Center</div>
        <h1>ศูนย์ควบคุมงานรับปริญญา</h1>
        <p>ภาพรวมงานแอดมินและเจ้าหน้าที่สำหรับตรวจข้อมูลบัณฑิต เช็คชื่อ ยืนยันตัวตน เอกสาร และสิทธิ์การใช้งาน</p>
      </div>
      <div class="workspace-header__actions">
        <CButton color="primary" variant="outline" :disabled="loading" @click="fetchRegistrations">
          <CIcon name="cil-reload" class="mr-2" />
          รีเฟรช
        </CButton>
      </div>
    </div>

    <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

    <div class="overview-grid">
      <div v-for="item in statCards" :key="item.key" class="overview-card">
        <div class="overview-card__icon">
          <CIcon :name="item.icon" />
        </div>
        <div>
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
          <small>{{ item.hint }}</small>
        </div>
      </div>
    </div>

    <div class="workspace-layout">
      <section class="workspace-panel workflow-panel">
        <div class="panel-heading">
          <div>
            <h2>งานหลักของระบบ</h2>
            <p>จัดเรียงตามหัวข้อบนไวท์บอร์ดและเชื่อมไปยังหน้าที่ใช้งานจริง</p>
          </div>
        </div>

        <div class="workflow-grid">
          <div v-for="item in workflowCards" :key="item.no" class="workflow-card">
            <div class="workflow-card__number">{{ item.no }}</div>
            <div class="workflow-card__body">
              <div class="workflow-card__icon">
                <CIcon :name="item.icon" />
              </div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
              <ul>
                <li v-for="task in item.tasks" :key="task">{{ task }}</li>
              </ul>
              <router-link v-if="item.to" :to="item.to" class="workflow-card__action">
                เปิดหน้า
                <CIcon name="cil-arrow-right" class="ml-2" />
              </router-link>
              <button v-else type="button" class="workflow-card__action workflow-card__action--disabled" disabled>
                เตรียมเชื่อมต่อ
              </button>
            </div>
          </div>
        </div>
      </section>

      <aside class="workspace-side">
        <section class="workspace-panel search-panel">
          <div class="panel-heading compact">
            <div>
              <h2>ค้นหาข้อมูลบัณฑิต</h2>
              <p>ค้นจากชื่อ เบอร์ อีเมล หรือ barcode</p>
            </div>
          </div>
          <div class="search-box">
            <CIcon name="cil-magnifying-glass" />
            <input v-model.trim="searchText" type="search" placeholder="ค้นหาบัณฑิต">
          </div>
          <div class="search-results">
            <div v-if="loading" class="empty-state">กำลังโหลดข้อมูล</div>
            <div v-else-if="!filteredRegistrations.length" class="empty-state">ไม่พบข้อมูลที่ตรงกับคำค้น</div>
            <button
              v-for="item in filteredRegistrations.slice(0, 5)"
              :key="item._id || item.barcodeValue"
              type="button"
              class="result-row"
              @click="$router.push('/graduation/registrations')"
            >
              <strong>{{ fullName(item) || '-' }}</strong>
              <span>{{ item.school || '-' }} / {{ item.program || '-' }}</span>
              <small>{{ item.barcodeValue || item.email || '-' }}</small>
            </button>
          </div>
        </section>

        <section class="workspace-panel checklist-panel">
          <div class="panel-heading compact">
            <div>
              <h2>รายการตรวจระบบ</h2>
              <p>ตอบคำถามจากไวท์บอร์ดว่าแต่ละงานทำอะไรได้บ้าง</p>
            </div>
          </div>
          <div class="checklist">
            <div v-for="item in capabilityChecklist" :key="item.label">
              <span :class="['status-dot', item.ready ? 'status-dot--ready' : 'status-dot--planned']"></span>
              <strong>{{ item.label }}</strong>
              <small>{{ item.note }}</small>
            </div>
          </div>
        </section>

        <section class="workspace-panel role-panel">
          <div class="panel-heading compact">
            <div>
              <h2>สิทธิ์การใช้งาน</h2>
              <p>สรุปตาม role ที่กำหนดในแผน</p>
            </div>
          </div>
          <div class="role-list">
            <div v-for="role in roleAccess" :key="role.role">
              <span>{{ role.role }}</span>
              <strong>{{ role.scope }}</strong>
              <em>{{ role.note }}</em>
            </div>
          </div>
        </section>
      </aside>
    </div>

    <div class="analytics-grid">
      <section class="workspace-panel">
        <div class="panel-heading compact">
          <div>
            <h2>สถิติตามสำนักวิชา</h2>
            <p>เรียงตามจำนวนรายการลงทะเบียนสูงสุด</p>
          </div>
        </div>
        <div class="bar-list">
          <div v-for="item in schoolStats" :key="item.label" class="bar-row">
            <span>{{ item.label }}</span>
            <div>
              <i :style="{ width: item.percent + '%' }"></i>
            </div>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
      </section>

      <section class="workspace-panel">
        <div class="panel-heading compact">
          <div>
            <h2>สถานะการเข้ารับ</h2>
            <p>ใช้ติดตามภาพรวมก่อนวันงาน</p>
          </div>
        </div>
        <div class="status-summary">
          <div v-for="item in ceremonyStats" :key="item.code">
            <span>{{ item.code || '-' }}</span>
            <strong>{{ item.value }}</strong>
            <small>{{ item.label }}</small>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import api from '@/service/api'

function unwrapRows (response) {
  const data = response && response.data && response.data.data ? response.data.data : {}
  return Array.isArray(data.rows) ? data.rows : []
}

function textValue (value) {
  const text = String(value == null ? '' : value).trim()
  return text && text !== '-' ? text : ''
}

function hasMissingRequiredData (item) {
  return !textValue(item && item.firstName) ||
    !textValue(item && item.lastName) ||
    !textValue(item && item.school) ||
    !textValue(item && item.program) ||
    !textValue(item && item.ceremonyStatus)
}

function groupCount (rows, getter) {
  return rows.reduce((map, item) => {
    const key = textValue(getter(item)) || '-'
    map[key] = (map[key] || 0) + 1
    return map
  }, {})
}

function topGroups (rows, getter, limit) {
  const counts = groupCount(rows, getter)
  const max = Math.max(...Object.keys(counts).map(key => counts[key]), 1)
  return Object.keys(counts)
    .sort((left, right) => counts[right] - counts[left])
    .slice(0, limit)
    .map(key => ({
      label: key,
      value: counts[key],
      percent: Math.max(Math.round((counts[key] / max) * 100), 8)
    }))
}

export default {
  name: 'GraduationAdminWorkspace',
  data () {
    return {
      loading: false,
      errorMessage: '',
      searchText: '',
      registrations: [],
      workflowCards: [
        {
          no: 1,
          icon: 'cil-speedometer',
          title: 'Dashboard เจ้าภาพ',
          description: 'มองภาพรวมจำนวนบัณฑิต สถานะตรวจสอบ และงานที่ต้องตามต่อ',
          tasks: ['สรุปจำนวนทั้งหมด', 'ดูสถานะตรวจสอบ', 'ดูสถิติคณะ/สาขา'],
          to: '/dashboard'
        },
        {
          no: 2,
          icon: 'cil-list-rich',
          title: 'แก้ไขข้อมูลบัณฑิต',
          description: 'ค้นหาและจัดการข้อมูลหลักของบัณฑิต',
          tasks: ['Search', 'Edit', 'Remove'],
          to: '/graduation/registrations'
        },
        {
          no: 3,
          icon: 'cil-barcode',
          title: 'เช็คชื่อและยืนยันตัวตน',
          description: 'รองรับการเช็คชื่อหน้างานจากหลายช่องทาง',
          tasks: ['Scan ใบหน้า', 'Scan Barcode', 'กรอกรหัส นศ.'],
          to: '/graduation/face-checkin'
        },
        {
          no: 4,
          icon: 'cil-calendar-check',
          title: 'ตารางรายชื่อและการเข้ารับ',
          description: 'ตรวจการเข้ารับและกลุ่มที่ต้องจัดการก่อนวันพิธี',
          tasks: ['ดูตามสถานะ', 'กรองตามสำนักวิชา', 'ติดตามกลุ่มพิเศษ'],
          to: '/graduation/registrations'
        },
        {
          no: 5,
          icon: 'cil-print',
          title: 'บัตรรับส่งตัวบัณฑิต',
          description: 'เตรียมเอกสาร View และ Print PDF สำหรับหน้างาน',
          tasks: ['View', 'Print PDF', 'รายงานต่าง ๆ'],
          to: ''
        },
        {
          no: 6,
          icon: 'cil-clipboard',
          title: 'บันทึกเอกสารนักศึกษา',
          description: 'บันทึกข้อมูลและหลักฐานที่เกี่ยวกับนักศึกษา',
          tasks: ['บันทึกใบงาน', 'แนบข้อมูลเพิ่มเติม', 'ติดตามรายการค้าง'],
          to: '/graduation/register'
        },
        {
          no: 7,
          icon: 'cil-settings',
          title: 'ตั้งค่าระบบและ Role',
          description: 'กำหนดสิทธิ์แอดมินและเจ้าหน้าที่ให้ตรงกับงาน',
          tasks: ['Set role', 'Admin', 'Staff'],
          to: '/security/permissions/group'
        }
      ],
      capabilityChecklist: [
        { label: 'แสดงข้อมูลได้', note: 'พร้อมใช้จากข้อมูลลงทะเบียน', ready: true },
        { label: 'ค้นหาข้อมูลได้', note: 'ค้นจากชื่อ เบอร์ อีเมล และ barcode', ready: true },
        { label: 'แก้ไขข้อมูลได้', note: 'เชื่อมไปหน้าข้อมูลลงทะเบียนบัณฑิต', ready: true },
        { label: 'Scan ใบหน้าได้', note: 'ใช้หน้าถ่ายรูปและบันทึกใบหน้า', ready: true },
        { label: 'Scan barcode ได้', note: 'เตรียมเป็น workflow หน้างาน', ready: false },
        { label: 'กรอกรหัส นศ. ได้', note: 'เตรียมเพิ่มใน flow เช็คชื่อ', ready: false },
        { label: 'Print PDF ได้', note: 'เตรียมเชื่อมต่อเอกสาร', ready: false }
      ],
      roleAccess: [
        { role: 'Admin', scope: '1-7', note: 'จัดการได้ครบทุกโมดูล' },
        { role: 'Staff', scope: '1-6', note: 'ใช้งานหน้างานและข้อมูลบัณฑิต' },
        { role: 'Viewer', scope: '1, 4', note: 'ดูรายงานและสถานะเท่านั้น' }
      ]
    }
  },
  computed: {
    statCards () {
      const total = this.registrations.length
      const complete = this.registrations.filter(item => !hasMissingRequiredData(item)).length
      const faceReady = this.registrations.filter(item => !!textValue(item && item.facePhoto)).length
      const needsReview = this.registrations.filter(hasMissingRequiredData).length
      return [
        { key: 'total', icon: 'cil-people', label: 'บัณฑิตทั้งหมด', value: total.toLocaleString('en-US'), hint: 'รายการในระบบ' },
        { key: 'complete', icon: 'cil-check-circle', label: 'ข้อมูลสมบูรณ์', value: complete.toLocaleString('en-US'), hint: 'พร้อมเข้ากระบวนการ' },
        { key: 'face', icon: 'cil-face', label: 'มีข้อมูลใบหน้า', value: faceReady.toLocaleString('en-US'), hint: 'ใช้ยืนยันตัวตน' },
        { key: 'review', icon: 'cil-warning', label: 'ต้องตรวจสอบ', value: needsReview.toLocaleString('en-US'), hint: 'ยังขาดข้อมูลสำคัญ' }
      ]
    },
    filteredRegistrations () {
      const query = textValue(this.searchText).toLowerCase()
      if (!query) return this.registrations.slice(0, 5)
      return this.registrations.filter(item => [
        item && item.firstName,
        item && item.lastName,
        item && item.phone,
        item && item.email,
        item && item.barcodeValue,
        item && item.school,
        item && item.program
      ].some(value => textValue(value).toLowerCase().includes(query)))
    },
    schoolStats () {
      return topGroups(this.registrations, item => item && item.school, 6)
    },
    ceremonyStats () {
      const counts = groupCount(this.registrations, item => item && item.ceremonyStatus)
      return Object.keys(counts)
        .sort((left, right) => counts[right] - counts[left])
        .slice(0, 6)
        .map(code => ({
          code,
          value: counts[code],
          label: this.ceremonyStatusLabel(code)
        }))
    }
  },
  mounted () {
    this.fetchRegistrations()
  },
  methods: {
    async fetchRegistrations () {
      this.loading = true
      this.errorMessage = ''
      try {
        const response = await api.graduateRegistrations('list', { limit: 4000 })
        this.registrations = unwrapRows(response)
      } catch (error) {
        this.errorMessage = 'ไม่สามารถโหลดข้อมูลลงทะเบียนบัณฑิตได้'
        this.registrations = []
      } finally {
        this.loading = false
      }
    },
    fullName (item) {
      return [item && item.firstName, item && item.lastName].filter(Boolean).join(' ')
    },
    ceremonyStatusLabel (code) {
      const labels = {
        1: 'เข้ารับพระราชทานปริญญาบัตร',
        3: 'ไม่เข้ารับพระราชทานปริญญาบัตร',
        10: 'เข้ารับ',
        20: 'ขอความช่วยเหลือกรณีพิเศษ',
        30: 'พระภิกษุ',
        40: 'ว่าที่ ร.ต.',
        50: 'ไม่เข้ารับแต่ร่วมถ่ายรูป',
        60: 'ไม่เข้ารับและไม่ร่วมถ่ายรูป',
        70: 'ขอเลื่อน',
        80: 'ยังไม่ได้ดำเนินการ'
      }
      return labels[String(code)] || 'สถานะอื่น'
    }
  }
}
</script>

<style scoped>
.graduation-admin-workspace {
  padding: 0.25rem;
}
.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}
.workspace-header h1 {
  margin: 0;
  color: #111827;
  font-size: 30px;
  font-weight: 800;
}
.workspace-header p {
  max-width: 860px;
  margin: 6px 0 0;
  color: #6b7280;
}
.workspace-header__eyebrow {
  margin-bottom: 4px;
  color: #8c1515;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}
.workspace-header__actions {
  flex: 0 0 auto;
}
.overview-grid,
.analytics-grid,
.workspace-layout,
.workflow-grid {
  display: grid;
  gap: 16px;
}
.overview-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 16px;
}
.overview-card,
.workspace-panel,
.workflow-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}
.overview-card {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 16px;
}
.overview-card__icon,
.workflow-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  border-radius: 8px;
  color: #8c1515;
  background: #fff1f1;
}
.overview-card span,
.role-list span,
.bar-row span {
  color: #6b7280;
  font-size: 12px;
}
.overview-card strong {
  display: block;
  color: #111827;
  font-size: 24px;
  font-weight: 800;
}
.overview-card small,
.workflow-card p,
.panel-heading p,
.result-row span,
.result-row small,
.checklist small,
.role-list em,
.status-summary small {
  color: #6b7280;
}
.workspace-layout {
  grid-template-columns: minmax(0, 1fr) 360px;
  align-items: start;
}
.workspace-panel {
  padding: 18px;
}
.workflow-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.workflow-card {
  position: relative;
  display: flex;
  overflow: hidden;
  box-shadow: none;
}
.workflow-card__number {
  display: grid;
  place-items: center;
  width: 56px;
  color: #8c1515;
  background: #fff7e0;
  font-size: 22px;
  font-weight: 900;
}
.workflow-card__body {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 16px;
}
.workflow-card h3,
.panel-heading h2 {
  margin: 0;
  color: #111827;
  font-weight: 800;
}
.workflow-card h3 {
  font-size: 18px;
}
.workflow-card p,
.panel-heading p {
  margin: 0;
}
.workflow-card ul {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 2px 0 4px;
  padding: 0;
  list-style: none;
}
.workflow-card li {
  padding: 4px 8px;
  border-radius: 999px;
  color: #6b3b00;
  background: #fff7e0;
  font-size: 12px;
  font-weight: 700;
}
.workflow-card__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: max-content;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid #8c1515;
  border-radius: 8px;
  color: #8c1515;
  background: #fff;
  font-weight: 800;
}
.workflow-card__action:hover {
  color: #fff;
  background: #8c1515;
  text-decoration: none;
}
.workflow-card__action--disabled {
  border-color: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}
.workspace-side {
  display: grid;
  gap: 16px;
}
.panel-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}
.panel-heading.compact {
  margin-bottom: 12px;
}
.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid #d8dee9;
  border-radius: 8px;
  background: #f8fafc;
}
.search-box input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
}
.search-results,
.checklist,
.role-list,
.bar-list,
.status-summary {
  display: grid;
  gap: 10px;
}
.search-results {
  margin-top: 12px;
}
.result-row {
  display: grid;
  gap: 3px;
  width: 100%;
  padding: 11px 0;
  border: 0;
  border-bottom: 1px solid #eef2f7;
  background: transparent;
  text-align: left;
}
.result-row strong {
  color: #111827;
}
.empty-state {
  padding: 14px;
  border-radius: 8px;
  color: #6b7280;
  background: #f8fafc;
  text-align: center;
}
.checklist div,
.role-list div {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eef2f7;
}
.checklist small,
.role-list em {
  grid-column: 2;
  font-style: normal;
  font-size: 12px;
}
.status-dot {
  width: 10px;
  height: 10px;
  margin-top: 5px;
  border-radius: 999px;
  background: #c9a227;
}
.status-dot--ready {
  background: #1f7a4d;
}
.status-dot--planned {
  background: #c9a227;
}
.role-list strong {
  color: #8c1515;
}
.analytics-grid {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  margin-top: 16px;
}
.bar-row {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(120px, 2fr) 42px;
  gap: 10px;
  align-items: center;
}
.bar-row div {
  height: 9px;
  overflow: hidden;
  border-radius: 999px;
  background: #e5e7eb;
}
.bar-row i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #8c1515, #c9a227);
}
.bar-row strong {
  color: #111827;
  text-align: right;
}
.status-summary {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.status-summary div {
  min-height: 96px;
  padding: 12px;
  border: 1px solid #eef2f7;
  border-radius: 8px;
  background: #fbfcff;
}
.status-summary span {
  color: #8c1515;
  font-size: 13px;
  font-weight: 800;
}
.status-summary strong {
  display: block;
  margin: 4px 0;
  color: #111827;
  font-size: 24px;
  font-weight: 900;
}
@media (max-width: 1200px) {
  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .workspace-layout,
  .analytics-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .workspace-header,
  .workflow-grid,
  .overview-grid,
  .status-summary {
    grid-template-columns: 1fr;
  }
  .workspace-header {
    display: grid;
  }
  .workflow-card {
    display: grid;
  }
  .workflow-card__number {
    width: 100%;
    min-height: 44px;
  }
  .bar-row {
    grid-template-columns: 1fr;
  }
  .bar-row strong {
    text-align: left;
  }
}
</style>
