const pptxgen = require('pptxgenjs')
const p = new pptxgen()
p.layout = 'LAYOUT_WIDE'
p.author = 'Graduation System Project Team'
p.theme = { headFontFace: 'Aptos Display', bodyFontFace: 'Aptos', lang: 'en-US' }
const navy = '102A43'
const teal = '00A7A7'
const gold = 'F2B134'
const white = 'F4F7FA'
function slide(title, subtitle, body, accent = teal, size = 20) {
  const s = p.addSlide()
  s.background = { color: navy }
  s.addShape(p.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.12, fill: { color: teal }, line: { color: teal } })
  s.addText(title, { x: 0.75, y: 0.65, w: 11.8, h: 0.5, fontFace: 'Aptos Display', fontSize: 28, bold: true, color: white, margin: 0 })
  s.addText(subtitle, { x: 0.77, y: 1.35, w: 11.4, h: 0.3, fontSize: 13, bold: true, color: accent, margin: 0 })
  s.addText(body, { x: 0.95, y: 2, w: 11.2, h: 4.2, fontSize: size, color: white, margin: 0.05, fit: 'shrink', valign: 'mid', breakLine: false, paraSpaceAfterPt: 10 })
  s.addText('MFU Graduation System', { x: 0.55, y: 7.05, w: 4, h: 0.2, fontSize: 8, color: '9FB3C8', margin: 0 })
}
let s = p.addSlide()
s.background = { color: navy }
s.addShape(p.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.12, fill: { color: teal }, line: { color: teal } })
s.addText('Graduation Registration\nand Attendance', { x: 0.8, y: 1.45, w: 9, h: 1.2, fontFace: 'Aptos Display', fontSize: 36, bold: true, color: white, margin: 0 })
s.addText('Using Browser-Based Face Recognition', { x: 0.85, y: 3, w: 8, h: 0.35, fontSize: 18, bold: true, color: gold, margin: 0 })
s.addText('Mae Fah Luang University\nGraduation System Project', { x: 0.85, y: 3.65, w: 6, h: 0.7, fontSize: 17, color: 'B7C7D8', margin: 0 })
s.addText('Thitirat Chuaypetch  •  Nattanicha Bunchuen  •  Kwankamolsri Jandee\nTeerasak Jeefu  •  Nataporn Dibdee', { x: 0.85, y: 5.7, w: 11.5, h: 0.55, fontSize: 13, color: white, margin: 0 })
slide('Project Overview', 'One workflow for preparation and attendance', 'The system connects graduate registration, ceremony preferences, food allergy reporting, face enrollment, and attendance operations.\n\nIt separates student-facing forms from administrator tools while keeping records in one MongoDB-backed application.')
slide('What the System Supports', 'Core user workflows', 'STUDENT WORKFLOW\nEmployment questionnaire\nPersonal, academic, and address information\nCeremony participation and certificate delivery\nAssistance and food allergy details\nReference photo enrollment\n\nADMINISTRATOR WORKFLOW\nSearch, filters, editing, summaries, allergy roster, and attendance operations', gold, 18)
slide('System Architecture', 'Browser, API, database, and identity services', 'Vue frontend  →  Node.js / Express API  →  MongoDB\n\nStudent browser: forms, preferences, and face enrollment\nAdministrator browser: roster, summaries, and camera operations\n\nIAM and local session services support authentication and permission boundaries.', teal, 19)
slide('Face Enrollment and Matching', 'How an attendance decision is produced', '1  Capture guidance checks face count, position, brightness, and image quality.\n2  The reference photograph is stored separately from attendance receipts.\n3  The scanner prepares descriptors from enrolled images.\n4  A camera descriptor is compared with the gallery using Euclidean distance.\n5  The backend validates and stores the selected activity receipt.', gold, 18)
slide('Data and Attendance Design', 'Separate data for separate purposes', 'Graduate_Registration stores identity, contact, academic, ceremony, allergy, questionnaire, and face metadata.\n\nlatestCheckIns.rehearsal and latestCheckIns.ceremony keep the latest receipt for each activity.\n\nThis keeps rehearsal attendance separate from ceremony attendance and protects the enrollment photograph.', teal, 18)
slide('Verification Results', 'What was verified in the reviewed project snapshot', '32 PASSING TESTS\n23 frontend tests passed\n9 backend tests passed\n\nVerified behavior included administrative editing, permission navigation, check-in validation, duplicate receipt handling, attendance pagination, and preservation of unrelated registration data.\n\nOpen issue: the automatic scanner suite was blocked because face-api.js was unavailable.', gold, 18)
slide('Limitations and Next Steps', 'Important boundaries before live deployment', 'Restore a consistent scanner and recognition-helper interface.\nAlign client and server acceptance thresholds.\nRe-run browser recognition tests with the required dependency.\nEvaluate false acceptance, false rejection, latency, and throughput using a consented labeled dataset.\nReview authorization shortcuts, photo retention, health-related notes, and staff review procedures.', teal, 18)
slide('Conclusion', 'A functional graduation operations foundation', 'The project brings registration preparation and attendance administration into one application.\n\nIt provides a clear student workflow, practical administrator tools, and separated attendance data.\n\nThe current evidence supports selected workflow and persistence behaviors. Live biometric performance still requires integration repair and formal evaluation.', gold, 20)
p.writeFile({ fileName: 'D:/preproject/pre-project/deliverables/graduation-paper/Graduation_Project_Presentation_FINAL.pptx' })
