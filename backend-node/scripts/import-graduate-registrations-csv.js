'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const config = require('../config/config');
const configureMongoose = require('../helpers/configure-mongoose');
const GraduateRegistration = require('../server/Project/graduationsystemusingfacerecognition/models/graduate_registration.model');

const ADDRESS_FIELDS = ['houseNo', 'moo', 'soi', 'road', 'subdistrict', 'district', 'province', 'postalCode'];
const ADDRESS_ALIASES = {
  houseNo: ['houseNo', 'house_no', 'homeAddress.houseNo', 'บ้านเลขที่', 'เลขที่'],
  moo: ['moo', 'homeAddress.moo', 'หมู่'],
  soi: ['soi', 'homeAddress.soi', 'ซอย'],
  road: ['road', 'homeAddress.road', 'ถนน'],
  subdistrict: ['subdistrict', 'homeAddress.subdistrict', 'ตำบล/แขวง', 'ตำบล', 'แขวง'],
  district: ['district', 'homeAddress.district', 'อำเภอ/เขต', 'อำเภอ', 'เขต'],
  province: ['province', 'homeAddress.province', 'จังหวัด'],
  postalCode: ['postalCode', 'postal_code', 'homeAddress.postalCode', 'รหัสไปรษณีย์']
};

const FIELD_ALIASES = {
  firstName: ['firstName', 'first_name', 'ชื่อจริง', 'ชื่อ'],
  lastName: ['lastName', 'last_name', 'นามสกุล'],
  firstNamePronunciation: ['firstNamePronunciation', 'first_name_pronunciation', 'สะกดชื่อจริงสำหรับผู้อ่านประกาศ', 'สะกดชื่อจริง', 'สะกดชื่อ'],
  lastNamePronunciation: ['lastNamePronunciation', 'last_name_pronunciation', 'สะกดนามสกุลสำหรับผู้อ่านประกาศ', 'สะกดนามสกุล'],
  namePronunciation: ['namePronunciation', 'name_pronunciation', 'ชื่อสำหรับประกาศ', 'ชื่ออ่านประกาศ'],
  phone: ['phone', 'mobile', 'tel', 'เบอร์ติดต่อ', 'โทรศัพท์', 'เบอร์โทรศัพท์'],
  email: ['email', 'อีเมล', 'อีเมล์'],
  school: ['school', 'faculty', 'สำนักวิชา', 'คณะ'],
  program: ['program', 'major', 'หลักสูตร', 'สาขา', 'สาขา/หลักสูตร'],
  ceremonyStatus: ['ceremonyStatus', 'ceremony_status', 'สถานะการเข้ารับพระราชทานปริญญาบัตร', 'สถานะเข้ารับ', 'เข้าร่วมพิธี'],
  ceremonyAssistanceType: ['ceremonyAssistanceType', 'ceremony_assistance_type', 'ประเภทความช่วยเหลือกรณีพิเศษ', 'ประเภทช่วยเหลือ'],
  ceremonyStatusNote: ['ceremonyStatusNote', 'ceremony_status_note', 'รายละเอียดเพิ่มเติม', 'หมายเหตุ'],
  certificateDeliveryMethod: ['certificateDeliveryMethod', 'certificate_delivery_method', 'ช่องทางรับประกาศนียบัตร'],
  certificateShippingService: ['certificateShippingService', 'certificate_shipping_service', 'บริการจัดส่ง'],
  hasFoodAllergy: ['hasFoodAllergy', 'has_food_allergy', 'แพ้อาหารหรือไม่', 'แพ้อาหาร'],
  foodAllergyNote: ['foodAllergyNote', 'food_allergy_note', 'รายละเอียดอาหารที่แพ้', 'อาหารที่แพ้'],
  barcodeValue: ['barcodeValue', 'barcode', 'studentId', 'student_id', 'รหัสนักศึกษา', 'บาร์โค้ด']
};

function usage() {
  console.log([
    'Usage:',
    '  npm run import:graduate-csv:local -- --file "D:\\path\\graduates.csv" [--dry-run]',
    '',
    'Options:',
    '  --file <path>        CSV file path. Required.',
    '  --dry-run            Parse and validate without writing to MongoDB.',
    '  --mode <upsert|insert>  Default: upsert.',
    '  --limit <number>     Import only the first N data rows.'
  ].join('\n'));
}

function parseArgs(argv) {
  const args = { mode: 'upsert', dryRun: false, limit: 0 };
  for (let index = 2; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === '--dry-run') {
      args.dryRun = true;
    } else if (item === '--file') {
      args.file = argv[index + 1];
      index += 1;
    } else if (item.startsWith('--file=')) {
      args.file = item.slice('--file='.length);
    } else if (item === '--mode') {
      args.mode = argv[index + 1] || args.mode;
      index += 1;
    } else if (item.startsWith('--mode=')) {
      args.mode = item.slice('--mode='.length);
    } else if (item === '--limit') {
      args.limit = Number(argv[index + 1] || 0);
      index += 1;
    } else if (item.startsWith('--limit=')) {
      args.limit = Number(item.slice('--limit='.length) || 0);
    }
  }
  return args;
}

function normalizeHeader(value) {
  return String(value || '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_\-./()]+/g, '');
}

function cleanText(value) {
  const normalized = String(value === undefined || value === null ? '' : value).trim();
  return normalized || null;
}

function cleanCode(value) {
  const raw = String(value || '').trim();
  const code = raw.match(/\d+/);
  return code ? code[0] : raw;
}

function cleanYesNo(value, note) {
  const normalized = String(value || '').trim().toLowerCase();
  if (['yes', 'y', 'true', '1', 'มี', 'แพ้'].includes(normalized)) return 'yes';
  if (cleanText(note) && cleanText(note) !== '-') return 'yes';
  return 'no';
}

function parseCsv(content) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(field);
      if (row.some(cell => String(cell || '').trim() !== '')) rows.push(row);
      row = [];
      field = '';
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some(cell => String(cell || '').trim() !== '')) rows.push(row);
  return rows;
}

function buildHeaderIndex(headers) {
  const index = new Map();
  headers.forEach(function (header, position) {
    index.set(normalizeHeader(header), position);
  });
  return index;
}

function readByAliases(row, headerIndex, aliases) {
  for (const alias of aliases) {
    const position = headerIndex.get(normalizeHeader(alias));
    if (position !== undefined) return cleanText(row[position]);
  }
  return null;
}

function readAddress(row, headerIndex, prefix) {
  const address = {};
  ADDRESS_FIELDS.forEach(function (field) {
    const baseAliases = ADDRESS_ALIASES[field] || [field];
    const aliases = prefix
      ? baseAliases.map(alias => `${prefix}.${alias}`).concat(baseAliases.map(alias => `${prefix}_${alias}`))
      : baseAliases;
    address[field] = readByAliases(row, headerIndex, aliases);
  });
  return address;
}

function ceremonyStatusLabel(value) {
  const labels = {
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
  return labels[String(value || '').trim()] || null;
}

function payloadFromRow(row, headerIndex) {
  const payload = {};
  Object.keys(FIELD_ALIASES).forEach(function (field) {
    payload[field] = readByAliases(row, headerIndex, FIELD_ALIASES[field]);
  });

  payload.firstNamePronunciation = payload.firstNamePronunciation || null;
  payload.lastNamePronunciation = payload.lastNamePronunciation || null;
  payload.namePronunciation = payload.namePronunciation ||
    [payload.firstNamePronunciation, payload.lastNamePronunciation].filter(Boolean).join(' ') ||
    null;
  payload.email = payload.email ? payload.email.toLowerCase() : null;
  payload.ceremonyStatus = payload.ceremonyStatus ? cleanCode(payload.ceremonyStatus) : null;
  payload.ceremonyAssistanceType = payload.ceremonyAssistanceType ? cleanCode(payload.ceremonyAssistanceType) : null;
  if (payload.ceremonyAssistanceType && !payload.ceremonyStatus) payload.ceremonyStatus = '20';
  payload.ceremonyStatusLabel = ceremonyStatusLabel(payload.ceremonyStatus);
  if (payload.ceremonyStatus !== '20') payload.ceremonyAssistanceType = null;
  payload.hasFoodAllergy = cleanYesNo(payload.hasFoodAllergy, payload.foodAllergyNote);
  if (payload.hasFoodAllergy !== 'yes') payload.foodAllergyNote = null;

  payload.homeAddress = readAddress(row, headerIndex, null);
  payload.currentAddress = readAddress(row, headerIndex, 'currentAddress');
  payload.workAddress = readAddress(row, headerIndex, 'workAddress');
  payload.certificateDeliveryAddress = readAddress(row, headerIndex, 'certificateDeliveryAddress');
  payload.create = {
    by: null,
    name: 'csv-import',
    email: null,
    datetime: new Date()
  };

  return payload;
}

function validatePayload(payload, rowNumber) {
  const missing = [];
  ['barcodeValue', 'firstName', 'school', 'program'].forEach(function (field) {
    if (!payload[field]) missing.push(field);
  });
  if (payload.hasFoodAllergy === 'yes' && !payload.foodAllergyNote) missing.push('foodAllergyNote');
  if (missing.length) {
    return `row ${rowNumber}: missing ${missing.join(', ')}`;
  }
  return null;
}

function upsertFilter(payload) {
  if (payload.barcodeValue) return { barcodeValue: payload.barcodeValue };
  if (payload.email) return { email: payload.email };
  if (payload.phone && payload.firstName && payload.lastName) {
    return { phone: payload.phone, firstName: payload.firstName, lastName: payload.lastName };
  }
  return null;
}

async function run() {
  const args = parseArgs(process.argv);
  if (!args.file) {
    usage();
    process.exit(1);
  }
  if (!['upsert', 'insert'].includes(args.mode)) {
    throw new Error('--mode must be upsert or insert');
  }

  const filePath = path.resolve(process.cwd(), args.file);
  const content = fs.readFileSync(filePath, 'utf8');
  const rows = parseCsv(content);
  if (rows.length < 2) throw new Error('CSV must contain a header row and at least one data row');

  const headers = rows[0];
  const headerIndex = buildHeaderIndex(headers);
  const dataRows = args.limit > 0 ? rows.slice(1, args.limit + 1) : rows.slice(1);
  const payloads = [];
  const errors = [];

  dataRows.forEach(function (row, index) {
    const payload = payloadFromRow(row, headerIndex);
    const error = validatePayload(payload, index + 2);
    if (error) {
      errors.push(error);
    } else {
      payloads.push(payload);
    }
  });

  if (errors.length) {
    console.error(JSON.stringify({ parsed: dataRows.length, valid: payloads.length, errors }, null, 2));
    process.exit(1);
  }

  if (args.dryRun) {
    console.log(JSON.stringify({
      dryRun: true,
      file: filePath,
      rows: payloads.length,
      sample: payloads.slice(0, 3)
    }, null, 2));
    process.exit(0);
    return;
  }

  configureMongoose(mongoose);
  await mongoose.connect(config.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

  let inserted = 0;
  let updated = 0;
  for (const payload of payloads) {
    if (args.mode === 'insert') {
      await GraduateRegistration.create(payload);
      inserted += 1;
      continue;
    }

    const filter = upsertFilter(payload);
    if (!filter) {
      await GraduateRegistration.create(payload);
      inserted += 1;
      continue;
    }

    const updatePayload = Object.assign({}, payload);
    delete updatePayload.create;
    const result = await GraduateRegistration.findOneAndUpdate(
      filter,
      {
        $set: Object.assign({}, updatePayload, {
          update: {
            by: null,
            name: 'csv-import',
            email: null,
            datetime: new Date()
          }
        }),
        $setOnInsert: { create: payload.create }
      },
      { upsert: true, new: false, rawResult: true }
    );
    if (result && result.lastErrorObject && result.lastErrorObject.updatedExisting) updated += 1;
    else inserted += 1;
  }

  await mongoose.connection.close();
  console.log(JSON.stringify({ file: filePath, processed: payloads.length, inserted, updated }, null, 2));
  process.exit(0);
}

run().catch(async function (error) {
  console.error(error);
  try {
    await mongoose.connection.close();
  } catch (closeError) {}
  process.exit(1);
});
