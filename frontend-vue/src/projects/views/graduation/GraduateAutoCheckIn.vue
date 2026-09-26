<template>
  <div class="auto-checkin">
    <h1>{{ $t('automaticCheckin.title') }}</h1>
    <div class="mode-strip">
      <button v-for="mode in modes" :key="mode.value" class="mode-button" :class="{ active: activeMode === mode.value }" :disabled="running || preparing" @click="activeMode = mode.value">
        {{ mode.label }}
      </button>
    </div>
    <div v-if="error" class="alert alert-danger" role="alert">{{ $t('automaticCheckin.' + error) }}</div>
    <div v-if="skipped" class="alert alert-warning">{{ $t('automaticCheckin.skipped', { count: skipped }) }}</div>
    <div class="scanner-layout">
      <section class="scanner-card">
        <div class="camera-heading"><span>{{ $t('automaticCheckin.' + (running ? 'scanning' : 'stopped')) }}</span></div>
        <div class="camera-stage">
          <video ref="video" autoplay muted playsinline></video>
          <canvas ref="overlay" class="overlay"></canvas>
        </div>
        <div class="scan-message" role="status">{{ $t('automaticCheckin.' + message, { count: referenceCount, name: lastMatchedName }) }}</div>
        <div class="camera-actions">
          <button v-if="!running && !preparing" type="button" class="camera-action camera-action--start" @click="start">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="6" width="12" height="12" rx="3" /><path d="m15 10 6-3v10l-6-3" stroke-linejoin="round" /></svg>
            {{ $t('automaticCheckin.start') }}
          </button>
          <button v-if="running || preparing" type="button" class="camera-action camera-action--stop" @click="stop">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" stroke="none" /></svg>
            {{ $t('automaticCheckin.stop') }}
          </button>
          <router-link class="camera-action camera-action--dashboard" to="/graduation/checkin-dashboard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
            {{ $t('automaticCheckin.dashboard') }}
            <svg class="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </router-link>
        </div>
        <p class="reference-count">{{ $t('automaticCheckin.counts', { references: referenceCount, checked: checkedCount }) }}</p>
      </section>
      <section class="scanner-card recent-card">
        <h2>{{ $t('automaticCheckin.recent') }}</h2>
        <div class="recent-list">
          <p v-if="!recent.length">{{ $t('automaticCheckin.waiting') }}</p>
          <div v-for="item in pagedRecent" :key="item.key" class="recent-person">
            <strong>{{ item.name }}</strong>
            <span>{{ item.code }}</span>
            <span>{{ isEnglishLocale && item.schoolEnglish ? item.schoolEnglish : item.school }} {{ isEnglishLocale && item.programEnglish ? item.programEnglish : item.program }}</span>
            <small>{{ $t('automaticCheckin.' + item.mode) }} · {{ formatTime(item.capturedAt) }}{{ item.duplicate ? ' · ' + $t('automaticCheckin.duplicate') : '' }}</small>
          </div>
        </div>
        <nav v-if="recent.length" class="recent-pagination" :aria-label="$t('automaticCheckin.recent')">
          <small>{{ $t('automaticCheckin.recentTotal', { count: recent.length }) }}</small>
          <div class="recent-page-controls">
            <button type="button" :disabled="recentPage === 1" @click="changeRecentPage(1)">{{ $t('automaticCheckin.newest') }}</button>
            <button type="button" :disabled="recentPage === 1" @click="changeRecentPage(recentPage - 1)" :aria-label="$t('automaticCheckin.previousPage')">&lsaquo;</button>
            <span aria-live="polite">{{ $t('automaticCheckin.pageOf', { page: recentPage, total: recentPageCount }) }}</span>
            <button type="button" :disabled="recentPage === recentPageCount" @click="changeRecentPage(recentPage + 1)" :aria-label="$t('automaticCheckin.nextPage')">&rsaquo;</button>
          </div>
        </nav>
      </section>
    </div>
  </div>
</template>

<script>
import api from '@/service/api'
import { loadRecognition, describeFaces, referenceDescriptor, matchFace, createConfirmationTracker } from '@/projects/utils/face-recognition'

export default {
  name: 'GraduateAutoCheckIn',
  data () {
    return {
      activeMode: this.$route.query.mode === 'ceremony' ? 'ceremony' : 'rehearsal',
      preparing: false, running: false, error: '', message: 'preparing', lastMatchedName: '',
      referenceCount: 0, skipped: 0, checkedCount: 0, recent: [], recentPage: 1, recentPageSize: 5, recentPending: 0
    }
  },
  computed: {
    recentPageCount () { return Math.max(1, Math.ceil((this.recent.length - this.recentPending) / this.recentPageSize)) },
    pagedRecent () {
      const start = (this.recentPage - 1) * this.recentPageSize + this.recentPending
      return this.recent.slice(start, start + this.recentPageSize)
    },
    isEnglishLocale () { return String(this.$i18n.locale).toLowerCase().startsWith('en') },
    modes () { return ['rehearsal', 'ceremony'].map(value => ({ value, label: this.$t('automaticCheckin.' + value) })) }
  },
  created () {
    this.runId = 0
    this.gallery = []
    this.checked = new Set()
    this.retryAfter = new Map()
    this.tracker = createConfirmationTracker()
  },
  mounted () { this.start() },
  beforeDestroy () { this.stop(); this.gallery = [] },
  methods: {
    changeRecentPage (page) {
      this.recentPage = Math.max(1, Math.min(page, this.recentPageCount))
      if (this.recentPage === 1) this.recentPending = 0
      const list = this.$el.querySelector('.recent-list')
      if (list) list.scrollTop = 0
    },
    formatTime (value) {
      return new Date(value).toLocaleTimeString(this.isEnglishLocale ? 'en-GB' : 'th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    },
    stop () {
      this.runId += 1
      clearTimeout(this.scanTimer)
      if (this.stream) this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
      if (this.$refs.video) this.$refs.video.srcObject = null
      this.running = false
      this.preparing = false
      this.tracker.clear()
      this.message = 'paused'
    },
    async start () {
      if (this.running || this.preparing) return
      const run = ++this.runId
      this.preparing = true
      this.error = ''
      this.skipped = 0
      this.gallery = []
      this.referenceCount = 0
      this.message = 'loading'
      try {
        await loadRecognition()
        if (run !== this.runId) return
        let after = null
        do {
          const response = await api.graduateRegistrations('face-gallery', { after })
          if (run !== this.runId) return
          const data = response && response.data && response.data.data
          if (!data || !Array.isArray(data.rows)) throw new Error('invalidGallery')
          for (const row of data.rows) {
            let descriptor
            try { descriptor = await referenceDescriptor(row.facePhoto) } catch (error) { descriptor = null }
            if (run !== this.runId) return
            if (descriptor) {
              const identity = Object.assign({}, row)
              delete identity.facePhoto
              this.gallery.push({ row: identity, descriptor })
              this.referenceCount = this.gallery.length
            } else this.skipped += 1
            this.message = 'references'
          }
          after = data.nextCursor
        } while (after)
        if (!this.gallery.length) throw new Error('noReferences')
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('unsupported')
        this.message = 'opening'
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
        if (run !== this.runId) { stream.getTracks().forEach(track => track.stop()); return }
        this.stream = stream
        this.$refs.video.srcObject = stream
        await this.$refs.video.play()
        if (run !== this.runId) return
        this.running = true
        this.message = 'ready'
        this.scan(run)
      } catch (error) {
        if (run !== this.runId) return
        this.stop()
        this.error = error.name === 'NotAllowedError' ? 'permission' :
          (error.response ? 'loadError' : (['invalidGallery', 'noReferences', 'unsupported'].includes(error.message) ? error.message : 'startupError'))
      } finally {
        if (run === this.runId) this.preparing = false
      }
    },
    async scan (run) {
      if (run !== this.runId || !this.running) return
      try {
        const video = this.$refs.video
        const frame = document.createElement('canvas')
        frame.width = video.videoWidth
        frame.height = video.videoHeight
        frame.getContext('2d').drawImage(video, 0, 0)
        const faces = await describeFaces(frame)
        if (run !== this.runId) return
        const canvas = this.$refs.overlay
        canvas.width = frame.width
        canvas.height = frame.height
        const context = canvas.getContext('2d')
        const matches = []
        const seen = new Set()
        const ambiguous = new Set()
        for (const face of faces) {
          const match = matchFace(face.descriptor, this.gallery)
          const box = face.detection.box
          context.strokeStyle = match ? '#22c55e' : '#f59e0b'
          context.lineWidth = 3
          context.strokeRect(box.x, box.y, box.width, box.height)
          if (match) {
            const id = String(match.row._id)
            if (seen.has(id)) ambiguous.add(id)
            else { matches.push(match); seen.add(id) }
          }
        }
        const confirmed = this.tracker.observe(matches.filter(match => !ambiguous.has(String(match.row._id))), Date.now())
        this.message = !faces.length ? 'next' : !matches.length ? 'unknown' : 'verifying'
        for (const match of confirmed) {
          if (run !== this.runId) return
          await this.recordMatch(match, run)
        }
      } catch (error) {
        if (run === this.runId) this.error = 'scanError'
      } finally {
        if (run === this.runId && this.running) this.scanTimer = setTimeout(() => this.scan(run), 250)
      }
    },
    async recordMatch (match, run) {
      const mode = this.activeMode
      const key = mode + ':' + match.row._id
      if (this.checked.has(key)) { this.message = 'checked'; return }
      if ((this.retryAfter.get(key) || 0) > Date.now()) return
      try {
        const response = await api.graduateRegistrations('check-in', { _id: match.row._id, checkInMode: mode, distance: match.distance })
        const saved = response && response.data && response.data.data
        if (!saved || !saved.latestCheckIns || !saved.latestCheckIns[mode]) throw new Error('Missing check-in receipt')
        this.checked.add(key)
        if (run !== this.runId) return
        this.error = ''
        const row = match.row
        const name = [row.firstName, row.lastName].filter(Boolean).join(' ')
        const receipt = { key: row._id, name, mode, code: row.studentCode || row.barcodeValue, school: row.school, program: row.program,
          schoolEnglish: row.schoolEnglish, programEnglish: row.programEnglish, capturedAt: saved.latestCheckIns[mode].capturedAt, duplicate: saved.duplicate }
        const existingIndex = this.recent.findIndex(item => item.key === row._id)
        if (existingIndex >= 0) {
          if (new Date(this.recent[existingIndex].capturedAt) > new Date(receipt.capturedAt)) return
          if (this.recentPage > 1) {
            this.recent.splice(existingIndex, 1, receipt)
          } else {
            this.recent.splice(existingIndex, 1)
            this.recent.unshift(receipt)
          }
        } else {
          this.recent.unshift(receipt)
          if (this.recentPage > 1) this.recentPending += 1
        }
        this.checkedCount = this.recent.length
        this.lastMatchedName = name
        this.message = 'success'
      } catch (error) {
        if (run !== this.runId) return
        this.retryAfter.set(key, Date.now() + 5000)
        this.error = 'saveError'
      }
    }
  }
}
</script>

<style scoped>
.auto-checkin h1 { font-size: 30px; font-weight: 800; color: #111827; }
.auto-checkin p { color: #64748b; }
.mode-strip { display: flex; gap: 12px; margin: 20px 0; }
.mode-button { flex: 1; min-height: 52px; padding: 12px 16px; border: 1px solid #d8dee9; border-radius: 10px; background: white; font-size: 14px; font-weight: 600; }
.mode-button.active { border-color: #8c1515; background: #fff8f8; color: #8c1515; }
.mode-button:disabled { cursor: default; }
.scanner-layout { display: grid; grid-template-columns: minmax(0, 2fr) minmax(260px, 1fr); gap: 20px; }
.scanner-card { padding: 20px; background: white; border-radius: 14px; border: 1px solid #e5e7eb; }
.scanner-card h2 { font-size: 20px; }
.camera-heading { display: flex; justify-content: flex-end; gap: 12px; }
.camera-heading span { color: #15803d; }
.camera-stage { position: relative; background: #111827; aspect-ratio: 16 / 9; overflow: hidden; border-radius: 12px; }
.camera-stage video { width: 100%; height: 100%; object-fit: contain; }
.overlay { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
.scan-message { margin-top: 12px; padding: 12px 16px; color: #166534; text-align: center; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; }
.camera-actions { display: flex; align-items: center; gap: 12px; margin: 20px 0; flex-wrap: wrap; }
.camera-action { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 46px; padding: 11px 20px; border: 1px solid transparent; border-radius: 12px; font: inherit; font-size: 14px; font-weight: 700; line-height: 1.5; cursor: pointer; text-decoration: none; transition: background-color .18s ease, border-color .18s ease, box-shadow .18s ease, transform .18s ease; }
.camera-action svg { width: 20px; height: 20px; flex-shrink: 0; }
.camera-action .action-arrow { width: 17px; height: 17px; margin-left: 6px; }
.camera-action--stop { color: #991b1b; background: #fff5f5; border-color: #f1cccc; }
.camera-action--stop:hover { color: #7f1d1d; background: #fee2e2; border-color: #e8a6a6; }
.camera-action--start, .camera-action--dashboard { color: #fff; background: #8c1515; border-color: #8c1515; box-shadow: 0 4px 10px rgba(140, 21, 21, .16); }
.camera-action--start:hover, .camera-action--dashboard:hover { color: #fff; background: #701111; border-color: #701111; box-shadow: 0 6px 14px rgba(140, 21, 21, .22); text-decoration: none; }
.camera-action:active { transform: translateY(1px); }
.camera-action:focus-visible { outline: 3px solid #d6a34a; outline-offset: 3px; }
@media (max-width: 480px) { .camera-action { width: 100%; } }
@media (prefers-reduced-motion: reduce) { .camera-action { transition: none; } }
.reference-count { margin: 0; }
.recent-card { display: flex; flex-direction: column; min-width: 0; height: 640px; max-height: 75vh; }
.recent-card h2 { flex-shrink: 0; }
.recent-list { flex: 1; min-height: 0; overflow-y: auto; overflow-wrap: anywhere; }
.recent-pagination { flex-shrink: 0; padding-top: 12px; border-top: 1px solid #e5e7eb; color: #64748b; }
.recent-page-controls { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px; margin-top: 8px; font-size: 13px; }
.recent-page-controls button { min-width: 32px; min-height: 32px; padding: 4px 8px; background: #fff; border: 1px solid #d8dee9; border-radius: 6px; color: #8c1515; }
.recent-page-controls button:disabled { opacity: .4; cursor: default; }
.recent-page-controls button:focus-visible { outline: 2px solid #8c1515; outline-offset: 2px; }
.recent-person { padding: 14px 0; border-bottom: 1px solid #e5e7eb; }
.recent-person strong, .recent-person span, .recent-person small { display: block; }
.recent-person strong { color: #15803d; }
.recent-person span, .recent-person small { color: #64748b; }
@media (max-width: 900px) { .scanner-layout { grid-template-columns: 1fr; } }
</style>
