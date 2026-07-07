'use strict';

const mongoose = require('mongoose');
const GraduateRegistration = require('../models/graduate_registration.model');

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 4000;

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function cleanText(value) {
  if (Array.isArray(value)) {
    const preferred = value.find(function (item) {
      return item && item.key === 'th' && item.value;
    }) || value.find(function (item) {
      return item && item.value;
    });
    return preferred ? cleanText(preferred.value) : null;
  }
  if (value && typeof value === 'object') {
    if (value.target && value.target.value !== undefined) return cleanText(value.target.value);
    if (value.value !== undefined) return cleanText(value.value);
    if (value.label !== undefined) return cleanText(value.label);
    if (value.name !== undefined) return cleanText(value.name);
    if (value.title !== undefined) return cleanText(value.title);
    return null;
  }
  const normalized = String(value || '').trim();
  return normalized && normalized !== '[object Object]' ? normalized : null;
}

function cleanFacePhoto(value) {
  const normalized = cleanText(value);
  if (!normalized) return null;
  return /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(normalized) ? normalized : null;
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanCode(value) {
  if (value && typeof value === 'object') {
    if (value.target && value.target.value !== undefined) return cleanCode(value.target.value);
    if (value.value !== undefined) return cleanCode(value.value);
    if (value.label !== undefined) return cleanCode(value.label);
    if (value.text !== undefined) return cleanCode(value.text);
  }
  const raw = String(value || '').trim();
  const code = raw.match(/\d+/);
  return code ? code[0] : raw;
}

function isMeaningfulFoodAllergyNote(value) {
  const normalized = String(value || '').trim();
  return !!normalized && normalized !== '-';
}

function hasAnyAddressValue(address) {
  return Object.keys(address || {}).some(function (key) {
    return !!cleanText(address[key]);
  });
}

function cleanYesNo(value, note) {
  const normalized = cleanCode(value).trim().toLowerCase();
  if (['yes', 'true', '1', 'มี'].includes(normalized)) return 'yes';
  if (isMeaningfulFoodAllergyNote(note)) return 'yes';
  return 'no';
}

function cleanAddress(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    houseNo: cleanText(source.houseNo),
    moo: cleanText(source.moo),
    soi: cleanText(source.soi),
    road: cleanText(source.road),
    subdistrict: cleanText(source.subdistrict),
    district: cleanText(source.district),
    province: cleanText(source.province),
    postalCode: cleanText(source.postalCode)
  };
}

function serializeRegistration(row) {
  const item = Object.assign({}, row || {});
  ['firstName', 'lastName', 'namePronunciation', 'firstNamePronunciation', 'lastNamePronunciation', 'phone', 'email', 'school', 'schoolEnglish', 'program', 'programEnglish', 'ceremonyStatus', 'ceremonyAssistanceType', 'ceremonyStatusNote', 'certificateDeliveryMethod', 'certificateShippingService', 'hasFoodAllergy', 'foodAllergyNote', 'barcodeValue'].forEach(function (field) {
    item[field] = cleanText(item[field]);
  });
  item.homeAddress = cleanAddress(item.homeAddress);
  item.currentAddress = cleanAddress(item.currentAddress);
  item.workAddress = cleanAddress(item.workAddress);
  item.certificateDeliveryAddress = cleanAddress(item.certificateDeliveryAddress);
  return item;
}

function pushSearchTerm(terms, value) {
  const normalized = cleanText(value);
  if (normalized && !terms.includes(normalized)) terms.push(normalized);
}

function accountSearchTerms(request, query) {
  const account = request && request.authAccount ? request.authAccount : {};
  const userinfo = account && account.userinfo && typeof account.userinfo === 'object' ? account.userinfo : {};
  const terms = [];
  pushSearchTerm(terms, account.email);
  pushSearchTerm(terms, account.username);
  pushSearchTerm(terms, account.code);
  pushSearchTerm(terms, userinfo.email);
  pushSearchTerm(terms, userinfo.phone);
  pushSearchTerm(terms, userinfo.mobile);
  pushSearchTerm(terms, userinfo.msisdn);
  pushSearchTerm(terms, userinfo.firstName);
  pushSearchTerm(terms, userinfo.lastName);
  pushSearchTerm(terms, query && query.email);
  pushSearchTerm(terms, query && query.phone);
  pushSearchTerm(terms, query && query.firstName);
  pushSearchTerm(terms, query && query.lastName);
  return terms;
}

function registrationScore(row, terms) {
  const normalizedTerms = terms.map(function (term) {
    return String(term || '').toLowerCase();
  });
  let score = 0;
  if (row.email && normalizedTerms.includes(String(row.email).toLowerCase())) score += 100;
  if (row.phone && normalizedTerms.includes(String(row.phone).toLowerCase())) score += 80;
  if (row.barcodeValue && normalizedTerms.includes(String(row.barcodeValue).toLowerCase())) score += 60;
  if (row.firstName && normalizedTerms.includes(String(row.firstName).toLowerCase())) score += 30;
  if (row.lastName && normalizedTerms.includes(String(row.lastName).toLowerCase())) score += 30;
  return score;
}

function actorFromRequest(request) {
  const account = request.currentAccount || request.account || request.user || {};
  return {
    by: account._id || account.id || null,
    name: account.name || account.fullName || account.displayName || null,
    email: account.email || null,
    datetime: new Date()
  };
}

function payloadFromBody(body) {
  const ceremonyStatus = cleanCode(body.ceremonyStatus);
  const ceremonyAssistanceType = cleanCode(body.ceremonyAssistanceType);
  const foodAllergyNote = cleanText(body.foodAllergyNote);
  const certificateDeliveryMethod = ceremonyStatus === '3' ? cleanText(body.certificateDeliveryMethod) : null;
  const certificateShippingService = certificateDeliveryMethod === 'postal' ? cleanText(body.certificateShippingService) : null;
  const firstNamePronunciation = cleanText(body.firstNamePronunciation);
  const lastNamePronunciation = cleanText(body.lastNamePronunciation);
  const namePronunciation = cleanText(body.namePronunciation) ||
    [firstNamePronunciation, lastNamePronunciation].filter(Boolean).join(' ') ||
    null;
  return {
    firstName: cleanText(body.firstName),
    lastName: cleanText(body.lastName),
    namePronunciation: namePronunciation,
    firstNamePronunciation: firstNamePronunciation,
    lastNamePronunciation: lastNamePronunciation,
    phone: cleanText(body.phone),
    email: cleanText(body.email),
    school: cleanText(body.school),
    schoolEnglish: cleanText(body.schoolEnglish),
    program: cleanText(body.program),
    programEnglish: cleanText(body.programEnglish),
    homeAddress: cleanAddress(body.homeAddress),
    currentAddress: cleanAddress(body.currentAddress),
    workAddress: cleanAddress(body.workAddress),
    ceremonyStatus: ceremonyStatus,
    ceremonyAssistanceType: ceremonyStatus === '20' ? ceremonyAssistanceType : null,
    ceremonyStatusNote: cleanText(body.ceremonyStatusNote),
    certificateDeliveryMethod: certificateDeliveryMethod,
    certificateShippingService: certificateShippingService,
    certificateDeliveryAddress: certificateDeliveryMethod === 'postal' ? cleanAddress(body.certificateDeliveryAddress) : cleanAddress({}),
    hasFoodAllergy: cleanYesNo(body.hasFoodAllergy, foodAllergyNote),
    foodAllergyNote: foodAllergyNote,
    barcodeValue: cleanText(body.barcodeValue),
    facePhoto: cleanFacePhoto(body.facePhoto),
    facePhotoCapturedAt: cleanFacePhoto(body.facePhoto) ? new Date() : null
  };
}

function validatePayload(payload) {
  const missing = [];
  if (payload.hasFoodAllergy === 'yes' && !isMeaningfulFoodAllergyNote(payload.foodAllergyNote)) {
    missing.push('foodAllergyNote');
  }
  if (payload.ceremonyStatus === '3' && !payload.certificateDeliveryMethod) {
    missing.push('certificateDeliveryMethod');
  }
  if (payload.ceremonyStatus === '3' && payload.certificateDeliveryMethod === 'postal') {
    if (!payload.certificateShippingService) missing.push('certificateShippingService');
    if (!hasAnyAddressValue(payload.certificateDeliveryAddress)) missing.push('certificateDeliveryAddress');
  }
  if (missing.length) {
    const error = new Error('Missing required fields: ' + missing.join(', '));
    error.status = 400;
    throw error;
  }
}

function buildListQuery(query) {
  const filter = {};
  const q = cleanText(query.q);
  const school = cleanText(query.school);
  const program = cleanText(query.program);
  const ceremonyStatus = cleanCode(query.ceremonyStatus);

  if (q) {
    filter.$or = [
      { firstName: new RegExp(q, 'i') },
      { lastName: new RegExp(q, 'i') },
      { phone: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
      { barcodeValue: new RegExp(q, 'i') }
    ];
  }
  if (school && school !== 'all') filter.school = school;
  if (program && program !== 'all') filter.program = program;
  if (ceremonyStatus && ceremonyStatus !== 'all') filter.ceremonyStatus = ceremonyStatus;

  return filter;
}

exports.list = async function list(query) {
  const page = Math.max(toNumber(query.page, 1), 1);
  const limit = Math.min(Math.max(toNumber(query.limit, DEFAULT_LIMIT), 1), MAX_LIMIT);
  const skip = (page - 1) * limit;
  const filter = buildListQuery(query || {});

  const [rows, total] = await Promise.all([
    GraduateRegistration.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    GraduateRegistration.countDocuments(filter)
  ]);

  return {
    rows: rows.map(serializeRegistration),
    total,
    page,
    limit,
    hasMore: skip + rows.length < total
  };
};

exports.options = async function options() {
  const rows = await GraduateRegistration.aggregate([
    {
      $match: {
        school: { $nin: [null, ''] }
      }
    },
    {
      $group: {
        _id: {
          school: '$school',
          schoolEnglish: '$schoolEnglish',
          programEnglish: '$programEnglish',
          program: '$program'
        }
      }
    }
  ]);

  const grouped = rows.reduce(function (acc, item) {
    const school = cleanText(item && item._id && item._id.school);
    const schoolEnglish = cleanText(item && item._id && item._id.schoolEnglish);
    const program = cleanText(item && item._id && item._id.program);
    const programEnglish = cleanText(item && item._id && item._id.programEnglish);
    if (!school) return acc;
    if (!acc[school]) {
      acc[school] = {
        school: school,
        schoolEnglish: schoolEnglish,
        programs: {}
      };
    }
    if (!acc[school].schoolEnglish && schoolEnglish) acc[school].schoolEnglish = schoolEnglish;
    if (program) {
      if (!acc[school].programs[program]) {
        acc[school].programs[program] = {
          program: program,
          programEnglish: programEnglish
        };
      }
      if (!acc[school].programs[program].programEnglish && programEnglish) {
        acc[school].programs[program].programEnglish = programEnglish;
      }
    }
    return acc;
  }, {});

  const schools = Object.keys(grouped)
    .sort(function (left, right) {
      return left.localeCompare(right, 'th');
    })
    .map(function (school) {
      const item = grouped[school];
      return {
        school: item.school,
        schoolEnglish: item.schoolEnglish || null,
        labelTh: item.school,
        labelEn: item.schoolEnglish || item.school,
        programs: Object.keys(item.programs)
          .sort(function (left, right) {
            return left.localeCompare(right, 'th');
          })
          .map(function (program) {
            const programItem = item.programs[program];
            return {
              program: programItem.program,
              programEnglish: programItem.programEnglish || null,
              labelTh: programItem.program,
              labelEn: programItem.programEnglish || programItem.program
            };
          })
      };
    });

  return { schools: schools };
};

exports.defaultsForAccount = async function defaultsForAccount(request, query) {
  const terms = accountSearchTerms(request || {}, query || {});
  if (!terms.length) return null;

  const filters = [];
  terms.forEach(function (term) {
    const expression = new RegExp(escapeRegExp(term), 'i');
    filters.push({ firstName: expression });
    filters.push({ lastName: expression });
    filters.push({ phone: expression });
    filters.push({ email: expression });
    filters.push({ barcodeValue: expression });
  });

  const rows = await GraduateRegistration.find({ $or: filters })
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();
  const best = rows
    .map(function (row) {
      return { row: row, score: registrationScore(row, terms) };
    })
    .sort(function (left, right) {
      return right.score - left.score;
    })[0];

  return best && best.score > 0 ? serializeRegistration(best.row) : null;
};

exports.create = async function create(body, request) {
  const payload = payloadFromBody(body || {});
  validatePayload(payload);
  payload.create = actorFromRequest(request || {});
  const created = await GraduateRegistration.create(payload);
  return created.toObject();
};

exports.update = async function update(id, body, request) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid graduate registration id');
    error.status = 400;
    throw error;
  }

  const payload = payloadFromBody(body || {});
  validatePayload(payload);
  payload.update = actorFromRequest(request || {});

  const updated = await GraduateRegistration.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id) },
    payload,
    { new: true, runValidators: true }
  ).lean();

  if (!updated) {
    const error = new Error('Graduate registration not found');
    error.status = 404;
    throw error;
  }
  return updated;
};

exports.remove = async function remove(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid graduate registration id');
    error.status = 400;
    throw error;
  }

  const result = await GraduateRegistration.deleteOne({ _id: new mongoose.Types.ObjectId(id) });
  return { deleted: result.deletedCount || 0 };
};
