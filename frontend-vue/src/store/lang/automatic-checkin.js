export const en = {
  recentTotal: '{count} check-ins this session', newest: 'Latest', previousPage: 'Previous page', nextPage: 'Next page', pageOf: 'Page {page} / {total}',
  title: 'Face check-in', description: 'Keep the camera on and walk past it. Registered faces are checked in automatically.',
  rehearsal: 'Rehearsal day', ceremony: 'Ceremony day', camera: 'Automatic check-in camera',
  scanning: 'Scanning continuously', stopped: 'Camera stopped', start: 'Start camera', stop: 'Stop camera', dashboard: 'View check-in dashboard',
  skipped: '{count} reference photos could not be read clearly or contain multiple faces. Please register new photos for those graduates.',
  counts: 'Ready to recognize {references} graduates · {checked} checked in this session',
  recent: 'Latest successful check-ins', waiting: 'Waiting for graduates to walk past the camera', duplicate: 'Already checked in',
  preparing: 'Preparing check-in system', paused: 'Camera stopped. Start the camera to continue.', loading: 'Loading face recognition...',
  references: 'Preparing reference photos: {count} graduates...', opening: 'Opening camera...', ready: 'Ready. Walk past the camera with your face clearly visible.',
  next: 'Ready for the next person', unknown: 'No matching registered face found', verifying: 'Verifying face',
  checked: 'Already checked in. Ready for the next person.', success: 'Checked in: {name}. Ready for the next person.',
  invalidGallery: 'Invalid reference photo data', noReferences: 'No usable reference faces found. Please register graduate face photos first.',
  unsupported: 'Camera access is unavailable. Please use HTTPS or localhost.', permission: 'Please allow camera access, then start the camera again.',
  loadError: 'Unable to load face data. Check your connection and start the camera again.', startupError: 'Unable to start face recognition or the camera. Please try again.',
  scanError: 'Unable to verify faces. Retrying automatically.', saveError: 'Unable to save check-in. Stay in front of the camera while the system retries.',
  detectedTotal: 'Total detected', verified: 'Face verified', review: 'Needs review', latest: 'Last detected', detectedAt: 'Detected at',
  detectedHint: 'Graduates detected by the camera', reviewHint: 'Scan results requiring review', latestHint: 'Updated automatically from the scanner'
}

export const th = {
  recentTotal: "เช็กชื่อในรอบนี้ {count} คน", newest: "ล่าสุด", previousPage: "หน้าก่อนหน้า", nextPage: "หน้าถัดไป", pageOf: "หน้า {page} / {total}",
  title: 'สแกนใบหน้าเพื่อเช็กชื่อ', description: 'เปิดกล้องไว้ แล้วเดินผ่านกล้อง ระบบจะเช็กชื่ออัตโนมัติเมื่อพบใบหน้าที่ลงทะเบียน',
  rehearsal: 'วันซ้อม', ceremony: 'วันจริง', camera: 'กล้องเช็กชื่ออัตโนมัติ',
  scanning: 'กำลังสแกนต่อเนื่อง', stopped: 'กล้องหยุดอยู่', start: 'เปิดกล้องเช็กชื่อ', stop: 'หยุดกล้อง', dashboard: 'ดูแดชบอร์ดเช็กชื่อ',
  skipped: 'มีภาพอ้างอิง {count} รายการที่อ่านใบหน้าไม่ชัดเจนหรือมีหลายใบหน้า กรุณาลงทะเบียนภาพใหม่สำหรับรายการเหล่านั้น',
  counts: 'พร้อมเทียบใบหน้า {references} คน · เช็กชื่อสำเร็จในรอบนี้ {checked} คน',
  recent: 'เช็กชื่อสำเร็จล่าสุด', waiting: 'รอบันทึกคนที่เดินผ่านกล้อง', duplicate: 'เช็กชื่อไว้แล้ว',
  preparing: 'กำลังเตรียมระบบเช็กชื่อ', paused: 'กล้องหยุดอยู่ กดเปิดกล้องเพื่อเช็กชื่อต่อ', loading: 'กำลังโหลดระบบเทียบใบหน้า...',
  references: 'กำลังเตรียมภาพอ้างอิง {count} คน...', opening: 'กำลังเปิดกล้อง...', ready: 'พร้อมเช็กชื่อ กรุณาเดินผ่านกล้องโดยให้เห็นใบหน้าชัดเจน',
  next: 'พร้อมรับคนถัดไป', unknown: 'ยังไม่พบใบหน้าที่ตรงกับข้อมูลลงทะเบียน', verifying: 'กำลังตรวจสอบใบหน้า',
  checked: 'เช็กชื่อแล้ว พร้อมรับคนถัดไป', success: 'เช็กชื่อสำเร็จ {name} พร้อมรับคนถัดไป',
  invalidGallery: 'รูปแบบข้อมูลภาพอ้างอิงไม่ถูกต้อง', noReferences: 'ไม่พบภาพใบหน้าที่ใช้เทียบได้ กรุณาลงทะเบียนภาพใบหน้าของบัณฑิตก่อน',
  unsupported: 'เบราว์เซอร์ไม่รองรับกล้อง กรุณาเปิดผ่าน HTTPS หรือ localhost', permission: 'กรุณาอนุญาตให้ใช้กล้อง แล้วกดเปิดกล้องอีกครั้ง',
  loadError: 'โหลดข้อมูลใบหน้าไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วเปิดกล้องอีกครั้ง', startupError: 'เปิดระบบเทียบใบหน้าหรือกล้องไม่สำเร็จ กรุณาลองอีกครั้ง',
  scanError: 'ตรวจสอบใบหน้าไม่สำเร็จ ระบบจะลองใหม่อัตโนมัติ', saveError: 'บันทึกเช็กชื่อไม่สำเร็จ กรุณาอยู่หน้ากล้อง ระบบจะลองใหม่อัตโนมัติ',
  detectedTotal: 'ตรวจพบทั้งหมด', verified: 'ยืนยันใบหน้าแล้ว', review: 'ต้องตรวจสอบ', latest: 'ตรวจพบล่าสุด', detectedAt: 'เวลาที่ตรวจพบ',
  detectedHint: 'เฉพาะผู้ที่เดินผ่านกล้อง', reviewHint: 'ผลสแกนที่ต้องตรวจสอบเพิ่มเติม', latestHint: 'อัปเดตอัตโนมัติจากหน้าสแกน'
}
