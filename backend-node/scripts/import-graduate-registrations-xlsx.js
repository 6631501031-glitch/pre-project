'use strict';

const path = require('path');
const mongoose = require('mongoose');

function getDotenvPath() {
  const inlineArg = process.argv.find(function (item) {
    return String(item || '').indexOf('dotenv_config_path=') === 0;
  });
  return process.env.DOTENV_CONFIG_PATH ||
    process.env.dotenv_config_path ||
    (inlineArg ? inlineArg.slice('dotenv_config_path='.length) : undefined);
}

require('dotenv').config({ path: getDotenvPath() });

const config = require('../config/config');
const configureMongoose = require('../helpers/configure-mongoose');
const GraduateRegistration = require('../server/Project/graduationsystemusingfacerecognition/models/graduate_registration.model');

const DEFAULT_SHEET_NAME = '\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e15\u0e31\u0e49\u0e07\u0e15\u0e49\u0e19';

const COLUMNS = {
  sequence: 0,
  studentId: 1,
  school: 7,
  schoolEnglish: 8,
  major: 10,
  majorEnglish: 11,
  program: 13,
  programEnglish: 14,
  title: 16,
  titleEnglish: 17,
  firstName: 18,
  firstNameEnglish: 19,
  lastName: 20,
  lastNameEnglish: 21,
  email: 23,
  phone: 24,
  currentHouseNo: 26,
  currentVillage: 27,
  currentMoo: 28,
  currentSoi: 29,
  currentRoad: 30,
  currentSubdistrict: 31,
  currentDistrict: 32,
  currentPostalCode: 33,
  currentProvince: 34,
  currentPhone: 36,
  homeHouseNo: 37,
  homeVillage: 38,
  homeMoo: 39,
  homeSoi: 40,
  homeRoad: 41,
  homeSubdistrict: 42,
  homeDistrict: 43,
  homePostalCode: 44,
  homeProvince: 45,
  homePhone: 47
};

function usage() {
  console.log([
    'Usage:',
    '  npm run import:graduate-xlsx:local -- --file "D:\\path\\graduates.xlsx" [--dry-run]',
    '',
    'Options:',
    '  --file <path>          XLSX file path. Required.',
    '  --sheet <name>         Sheet name. Default: data baseline sheet.',
    '  --dry-run              Parse and validate without writing to MongoDB.',
    '  --mode <upsert|insert> Default: upsert.',
    '  --limit <number>       Import only the first N data rows.'
  ].join('\n'));
}

function parseArgs(argv) {
  const args = { mode: 'upsert', dryRun: false, limit: 0, sheet: DEFAULT_SHEET_NAME };
  for (let index = 2; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === '--dry-run') {
      args.dryRun = true;
    } else if (item === '--file') {
      args.file = argv[index + 1];
      index += 1;
    } else if (String(item || '').indexOf('--file=') === 0) {
      args.file = item.slice('--file='.length);
    } else if (item === '--sheet') {
      args.sheet = argv[index + 1] || args.sheet;
      index += 1;
    } else if (String(item || '').indexOf('--sheet=') === 0) {
      args.sheet = item.slice('--sheet='.length);
    } else if (item === '--mode') {
      args.mode = argv[index + 1] || args.mode;
      index += 1;
    } else if (String(item || '').indexOf('--mode=') === 0) {
      args.mode = item.slice('--mode='.length);
    } else if (item === '--limit') {
      args.limit = Number(argv[index + 1] || 0);
      index += 1;
    } else if (String(item || '').indexOf('--limit=') === 0) {
      args.limit = Number(item.slice('--limit='.length) || 0);
    }
  }
  return args;
}

function loadXlsx() {
  try {
    return require('xlsx');
  } catch (error) {
    return require(path.resolve(__dirname, '../../frontend-vue/node_modules/xlsx'));
  }
}

function cleanText(value) {
  if (value instanceof Date) return value.toISOString();
  const normalized = String(value === undefined || value === null ? '' : value).trim();
  if (!normalized || normalized === '-') return null;
  return normalized;
}

function cleanEmail(value) {
  const normalized = cleanText(value);
  return normalized ? normalized.toLowerCase() : null;
}

function cleanPhone(value) {
  const normalized = cleanText(value);
  return normalized ? normalized.replace(/\s+/g, '') : null;
}

function readCell(row, key) {
  return cleanText(row[COLUMNS[key]]);
}

function buildAddress(row, prefix) {
  const village = readCell(row, prefix + 'Village');
  const soi = readCell(row, prefix + 'Soi');
  return {
    houseNo: readCell(row, prefix + 'HouseNo'),
    moo: readCell(row, prefix + 'Moo'),
    soi: [village, soi].filter(Boolean).join(' ') || null,
    road: readCell(row, prefix + 'Road'),
    subdistrict: readCell(row, prefix + 'Subdistrict'),
    district: readCell(row, prefix + 'District'),
    province: readCell(row, prefix + 'Province'),
    postalCode: readCell(row, prefix + 'PostalCode')
  };
}

function hasAnyAddressValue(address) {
  return Object.keys(address || {}).some(function (key) {
    return !!address[key];
  });
}

function ceremonyStatusLabel(value) {
  const labels = {
    10: 'เข้ารับพระราชทานปริญญาบัตร',
    20: 'เข้ารับ ขอความช่วยเหลือกรณีพิเศษ',
    30: 'เข้ารับ เป็นพระภิกษุ',
    40: 'เข้ารับ ได้รับยศเป็นว่าที่ ร.ต / ว่าที่ ร.ต. หญิง',
    50: 'ไม่เข้ารับพระราชทานปริญญาบัตร แต่เข้าร่วมการถ่ายรูปหมู่กับสำนักวิชา',
    60: 'ไม่เข้ารับพระราชทานปริญญาบัตร และไม่เข้าร่วมการถ่ายรูปหมู่กับสำนักวิชา',
    70: 'ขอเลื่อนการเข้ารับพระราชทานปริญญาบัตรเป็นปีการศึกษา 2564'
  };
  return labels[String(value || '').trim()] || null;
}

function buildPayload(row) {
  const firstNameEnglish = readCell(row, 'firstNameEnglish');
  const lastNameEnglish = readCell(row, 'lastNameEnglish');
  const currentAddress = buildAddress(row, 'current');
  const homeAddress = buildAddress(row, 'home');
  const phone = cleanPhone(row[COLUMNS.phone]) ||
    cleanPhone(row[COLUMNS.currentPhone]) ||
    cleanPhone(row[COLUMNS.homePhone]);

  return {
    firstName: readCell(row, 'firstName'),
    lastName: readCell(row, 'lastName'),
    namePronunciation: [firstNameEnglish, lastNameEnglish].filter(Boolean).join(' ') || null,
    firstNamePronunciation: firstNameEnglish,
    lastNamePronunciation: lastNameEnglish,
    phone: phone,
    email: cleanEmail(row[COLUMNS.email]),
    school: readCell(row, 'school') || readCell(row, 'schoolEnglish'),
    schoolEnglish: readCell(row, 'schoolEnglish') || readCell(row, 'school'),
    program: readCell(row, 'program') || readCell(row, 'major') || readCell(row, 'programEnglish') || readCell(row, 'majorEnglish'),
    programEnglish: readCell(row, 'programEnglish') || readCell(row, 'majorEnglish') || readCell(row, 'program') || readCell(row, 'major'),
    homeAddress: homeAddress,
    currentAddress: currentAddress,
    workAddress: {},
    ceremonyStatus: '10',
    ceremonyStatusLabel: ceremonyStatusLabel('10'),
    ceremonyAssistanceType: null,
    ceremonyStatusNote: null,
    certificateDeliveryMethod: null,
    certificateShippingService: null,
    certificateDeliveryAddress: hasAnyAddressValue(currentAddress) ? currentAddress : {},
    hasFoodAllergy: 'no',
    foodAllergyNote: null,
    studentCode: readCell(row, 'studentId'),
    barcodeValue: readCell(row, 'studentId'),
    create: {
      by: null,
      name: 'xlsx-import',
      email: null,
      datetime: new Date()
    }
  };
}

function validatePayload(payload, rowNumber) {
  const missing = [];
  ['barcodeValue', 'firstName', 'school', 'program'].forEach(function (field) {
    if (!payload[field]) missing.push(field);
  });
  return missing.length ? 'row ' + rowNumber + ': missing ' + missing.join(', ') : null;
}

function upsertFilter(payload) {
  if (payload.barcodeValue) return { barcodeValue: payload.barcodeValue };
  if (payload.email) return { email: payload.email };
  if (payload.phone && payload.firstName && payload.lastName) {
    return { phone: payload.phone, firstName: payload.firstName, lastName: payload.lastName };
  }
  return null;
}

function readWorkbookRows(filePath, sheetName) {
  const XLSX = loadXlsx();
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const resolvedSheetName = workbook.SheetNames.includes(sheetName)
    ? sheetName
    : workbook.SheetNames[0];
  const sheet = workbook.Sheets[resolvedSheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: false });
  return {
    sheetName: resolvedSheetName,
    rows: rows.filter(function (row) {
      return Array.isArray(row) && row.some(function (cell) {
        return String(cell || '').trim();
      });
    })
  };
}

async function run() {
  const args = parseArgs(process.argv);
  if (!args.file) {
    usage();
    process.exit(1);
  }
  if (['upsert', 'insert'].indexOf(args.mode) === -1) {
    throw new Error('--mode must be upsert or insert');
  }

  const filePath = path.resolve(process.cwd(), args.file);
  const workbook = readWorkbookRows(filePath, args.sheet);
  if (workbook.rows.length < 2) throw new Error('XLSX sheet must contain a header row and at least one data row');

  const dataRows = args.limit > 0 ? workbook.rows.slice(1, args.limit + 1) : workbook.rows.slice(1);
  const payloads = [];
  const errors = [];

  dataRows.forEach(function (row, index) {
    const payload = buildPayload(row);
    const error = validatePayload(payload, index + 2);
    if (error) {
      errors.push(error);
    } else {
      payloads.push(payload);
    }
  });

  if (errors.length) {
    console.error(JSON.stringify({ parsed: dataRows.length, valid: payloads.length, errors: errors.slice(0, 50) }, null, 2));
    process.exit(1);
  }

  if (args.dryRun) {
    console.log(JSON.stringify({
      dryRun: true,
      file: filePath,
      sheet: workbook.sheetName,
      rows: payloads.length
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
            name: 'xlsx-import',
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
  console.log(JSON.stringify({
    file: filePath,
    sheet: workbook.sheetName,
    processed: payloads.length,
    inserted,
    updated
  }, null, 2));
  process.exit(0);
}

run().catch(async function (error) {
  console.error(error);
  try {
    await mongoose.connection.close();
  } catch (closeError) {}
  process.exit(1);
});
