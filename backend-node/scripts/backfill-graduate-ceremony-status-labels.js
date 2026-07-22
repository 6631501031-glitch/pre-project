'use strict';

const mongoose = require('mongoose');
require('dotenv').config();

const config = require('../config/config');
const GraduateRegistration = require('../server/Project/graduationsystemusingfacerecognition/models/graduate_registration.model');

const CEREMONY_STATUS_LABELS_TH = {
  1: 'เข้ารับพระราชทานปริญญาบัตร',
  2: 'ไม่เข้ารับพระราชทานปริญญาบัตร แต่เข้าร่วมการถ่ายรูปหมู่สำนักวิชา',
  3: 'ไม่เข้ารับพระราชทานปริญญาบัตร',
  10: 'เข้ารับพระราชทานปริญญาบัตร',
  20: 'เข้ารับ ขอความช่วยเหลือกรณีพิเศษ',
  30: 'เข้ารับ เป็นพระภิกษุ',
  40: 'เข้ารับ ได้รับยศเป็นว่าที่ ร.ต / ว่าที่ ร.ต. หญิง',
  50: 'ไม่เข้ารับพระราชทานปริญญาบัตร แต่เข้าร่วมการถ่ายรูปหมู่กับสำนักวิชา',
  60: 'ไม่เข้ารับพระราชทานปริญญาบัตร และไม่เข้าร่วมการถ่ายรูปหมู่กับสำนักวิชา',
  70: 'ขอเลื่อนการเข้ารับพระราชทานปริญญาบัตรเป็นปีการศึกษา 2564',
  80: 'ไม่ได้ดำเนินการลงทะเบียนแจ้งการเข้ารับปริญญา'
};

function isDryRun() {
  return process.argv.includes('--dry-run');
}

function damagedOrMissingLabelFilter() {
  return {
    $or: [
      { ceremonyStatusLabel: null },
      { ceremonyStatusLabel: '' },
      { ceremonyStatusLabel: { $exists: false } },
      { ceremonyStatusLabel: /\?/ }
    ]
  };
}

async function main() {
  await mongoose.connect(config.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const dryRun = isDryRun();
  const summary = {
    dryRun: dryRun,
    matched: 0,
    updated: 0,
    skippedUnknownStatus: 0,
    byStatus: {}
  };

  const rows = await GraduateRegistration.find(
    damagedOrMissingLabelFilter(),
    { ceremonyStatus: 1, ceremonyStatusLabel: 1 }
  ).lean();

  summary.matched = rows.length;
  const operations = [];

  rows.forEach(function (row) {
    const status = String(row && row.ceremonyStatus || '').trim();
    const label = CEREMONY_STATUS_LABELS_TH[status];
    if (!label) {
      summary.skippedUnknownStatus += 1;
      return;
    }

    summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;
    operations.push({
      updateOne: {
        filter: { _id: row._id },
        update: { $set: { ceremonyStatusLabel: label } }
      }
    });
  });

  if (!dryRun && operations.length) {
    const result = await GraduateRegistration.bulkWrite(operations, { ordered: false });
    summary.updated = result.modifiedCount !== undefined ? result.modifiedCount : result.nModified;
  } else if (dryRun) {
    summary.updated = operations.length;
  }

  console.log(JSON.stringify(summary, null, 2));
  await mongoose.disconnect();
}

main().catch(async function (error) {
  console.error(error && error.stack ? error.stack : error);
  try {
    await mongoose.disconnect();
  } catch (disconnectError) {}
  process.exit(1);
});
