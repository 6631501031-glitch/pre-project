'use strict';

const mongoose = require('mongoose');
const GraduateRegistration = require('../models/graduate_registration.model');
const GRADUATE_INITIAL_CATALOG = require('./graduate_initial_catalog');

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

function cleanEmail(value) {
  const normalized = cleanText(value);
  return normalized ? normalized.toLowerCase() : null;
}

function cleanFacePhoto(value) {
  const normalized = cleanText(value);
  if (!normalized) return null;
  return /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(normalized) ? normalized : null;
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

function cleanStudentCode(value) {
  const normalized = cleanText(value);
  if (!normalized || normalized.indexOf('@') !== -1) return null;
  const digits = normalized.replace(/\D/g, '');
  return digits && digits.length >= 4 ? digits : null;
}

function isMeaningfulFoodAllergyNote(value) {
  const normalized = String(value || '').trim();
  return !!normalized && normalized !== '-';
}

function requiresCertificateDeliveryStatus(value) {
  return ['3', '50', '60'].includes(cleanCode(value));
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

function pushStudentCodeTerm(terms, value) {
  const normalized = cleanStudentCode(value);
  if (normalized && !terms.includes(normalized)) terms.push(normalized);
}

function pushEmailTerm(terms, value) {
  const normalized = cleanEmail(value);
  if (normalized && normalized.includes('@') && !terms.includes(normalized)) terms.push(normalized);
}

function queryStudentCodeTerms(query) {
  const terms = [];
  pushStudentCodeTerm(terms, query && query.studentCode);
  pushStudentCodeTerm(terms, query && query.barcodeValue);
  pushStudentCodeTerm(terms, query && query.username);
  pushStudentCodeTerm(terms, query && query.code);
  return terms;
}

function accountStudentCodeTerms(request, query) {
  const account = request && request.authAccount ? request.authAccount : {};
  const userinfo = account && account.userinfo && typeof account.userinfo === 'object' ? account.userinfo : {};
  const lifecycle = account && account.lifecycle && typeof account.lifecycle === 'object' ? account.lifecycle : {};
  const hrContext = account && account.hrContext && typeof account.hrContext === 'object' ? account.hrContext : {};
  const authen = account && Array.isArray(account.authen) ? account.authen : [];
  const terms = queryStudentCodeTerms(query);
  pushStudentCodeTerm(terms, account.studentCode);
  pushStudentCodeTerm(terms, account.barcodeValue);
  pushStudentCodeTerm(terms, account.code);
  pushStudentCodeTerm(terms, account.username);
  pushStudentCodeTerm(terms, userinfo.studentCode);
  pushStudentCodeTerm(terms, userinfo.code);
  pushStudentCodeTerm(terms, lifecycle.hrSnapshot && lifecycle.hrSnapshot.personnelCode);
  pushStudentCodeTerm(terms, hrContext.snapshot && hrContext.snapshot.personnelCode);
  authen.forEach(function (item) {
    pushStudentCodeTerm(terms, item && item.username);
  });
  return terms;
}

function accountEmailTerms(request, query) {
  const account = request && request.authAccount ? request.authAccount : {};
  const userinfo = account && account.userinfo && typeof account.userinfo === 'object' ? account.userinfo : {};
  const authen = account && Array.isArray(account.authen) ? account.authen : [];
  const terms = [];
  pushEmailTerm(terms, account.email);
  pushEmailTerm(terms, userinfo.email);
  pushEmailTerm(terms, account.username);
  authen.forEach(function (item) {
    pushEmailTerm(terms, item && item.email);
    pushEmailTerm(terms, item && item.username);
  });
  if (!terms.length) {
    pushEmailTerm(terms, query && query.email);
  }
  return terms;
}

function initialRecordForAccount(request) {
  const studentCodes = accountStudentCodeTerms(request || {}, {});
  const emails = accountEmailTerms(request || {}, {});
  return GRADUATE_INITIAL_CATALOG.find(function (item) {
    const studentCode = cleanStudentCode(item && item.studentCode);
    return studentCode && studentCodes.includes(studentCode);
  }) || GRADUATE_INITIAL_CATALOG.find(function (item) {
    const email = cleanEmail(item && item.email);
    return email && emails.includes(email);
  }) || null;
}

function initialSchoolName(value) {
  const school = cleanText(value);
  if (!school) return null;
  return school.indexOf('สำนักวิชา') === 0 ? school : 'สำนักวิชา' + school;
}

function registrationFromInitialRecord(record) {
  if (!record) return null;
  return {
    accountId: null,
    firstName: cleanText(record.firstName) || cleanText(record.firstNameEnglish),
    lastName: cleanText(record.lastName) || cleanText(record.lastNameEnglish),
    phone: cleanText(record.phone),
    email: cleanEmail(record.email),
    school: initialSchoolName(record.school),
    schoolEnglish: cleanText(record.schoolEnglish),
    program: cleanText(record.program),
    programEnglish: cleanText(record.programEnglish),
    barcodeValue: cleanStudentCode(record.studentCode)
  };
}

function firstAccountText() {
  for (let index = 0; index < arguments.length; index += 1) {
    const value = cleanText(arguments[index]);
    if (value) return value;
  }
  return null;
}

function accountIdentityDefaults(request) {
  const account = request && request.authAccount ? request.authAccount : {};
  const userinfo = account && account.userinfo && typeof account.userinfo === 'object' ? account.userinfo : {};
  const lifecycle = account && account.lifecycle && typeof account.lifecycle === 'object' ? account.lifecycle : {};
  const hrContext = account && account.hrContext && typeof account.hrContext === 'object' ? account.hrContext : {};
  const snapshot = lifecycle.hrSnapshot || (hrContext && hrContext.snapshot) || {};
  const studentCodes = accountStudentCodeTerms(request || {}, {});
  const emails = accountEmailTerms(request || {}, {});
  const initial = registrationFromInitialRecord(initialRecordForAccount(request || {})) || {};
  return {
    accountId: account._id || account.id || null,
    firstName: initial.firstName || firstAccountText(account.firstName, userinfo.firstName, snapshot.firstName, account.givenName, userinfo.givenName),
    lastName: initial.lastName || firstAccountText(account.lastName, userinfo.lastName, snapshot.lastName, account.familyName, userinfo.familyName),
    email: initial.email || emails[0] || null,
    studentCode: initial.barcodeValue || studentCodes[0] || null,
    school: initial.school || null,
    schoolEnglish: initial.schoolEnglish || null,
    program: initial.program || null,
    programEnglish: initial.programEnglish || null,
    phone: initial.phone || null
  };
}

function applyAccountIdentity(payload, request) {
  const identity = accountIdentityDefaults(request || {});
  if (identity.accountId) payload.accountId = identity.accountId;
  if (identity.firstName) payload.firstName = identity.firstName;
  if (identity.lastName) payload.lastName = identity.lastName;
  if (identity.email) payload.email = identity.email;
  if (identity.studentCode) payload.barcodeValue = identity.studentCode;
  if (identity.school) payload.school = identity.school;
  if (identity.schoolEnglish) payload.schoolEnglish = identity.schoolEnglish;
  if (identity.program) payload.program = identity.program;
  if (identity.programEnglish) payload.programEnglish = identity.programEnglish;
  return payload;
}

function accountOwnershipFilter(id, request) {
  const filter = { _id: new mongoose.Types.ObjectId(id) };
  const identity = accountIdentityDefaults(request || {});
  const ownership = [];
  if (identity.accountId) ownership.push({ accountId: identity.accountId });
  if (identity.studentCode) ownership.push({ barcodeValue: identity.studentCode });
  if (identity.email) ownership.push({ email: identity.email });
  if (ownership.length) filter.$or = ownership;
  if (!ownership.length) filter._id = null;
  return filter;
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
  const firstNamePronunciation = cleanText(body.firstNamePronunciation);
  const lastNamePronunciation = cleanText(body.lastNamePronunciation);
  const namePronunciation = cleanText(body.namePronunciation) ||
    [firstNamePronunciation, lastNamePronunciation].filter(Boolean).join(' ') ||
    null;
  const requiresCertificateDelivery = requiresCertificateDeliveryStatus(ceremonyStatus);
  const certificateDeliveryMethod = requiresCertificateDelivery ? cleanText(body.certificateDeliveryMethod) : null;
  const certificateShippingService = certificateDeliveryMethod === 'postal' ? cleanText(body.certificateShippingService) : null;
  return {
    firstName: cleanText(body.firstName),
    lastName: cleanText(body.lastName),
    namePronunciation: namePronunciation,
    firstNamePronunciation: firstNamePronunciation,
    lastNamePronunciation: lastNamePronunciation,
    phone: cleanText(body.phone),
    email: cleanEmail(body.email),
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
  if (requiresCertificateDeliveryStatus(payload.ceremonyStatus) && !payload.certificateDeliveryMethod) {
    missing.push('certificateDeliveryMethod');
  }
  if (requiresCertificateDeliveryStatus(payload.ceremonyStatus) && payload.certificateDeliveryMethod === 'postal') {
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
  const identity = accountIdentityDefaults(request || {});
  if (identity.accountId) {
    const accountRow = await GraduateRegistration.findOne({ accountId: identity.accountId })
      .sort({ updatedAt: -1 })
      .lean();
    if (accountRow) return serializeRegistration(accountRow);
  }

  const studentCodeTerms = accountStudentCodeTerms(request || {}, query || {});
  if (studentCodeTerms.length) {
    const exactStudentRow = await GraduateRegistration.findOne({ barcodeValue: { $in: studentCodeTerms } })
      .sort({ updatedAt: -1 })
      .lean();
    if (exactStudentRow) return serializeRegistration(exactStudentRow);
  }

  const emailTerms = accountEmailTerms(request || {}, query || {});
  if (emailTerms.length) {
    const exactEmailRow = await GraduateRegistration.findOne({ email: { $in: emailTerms } })
      .sort({ updatedAt: -1 })
      .lean();
    if (exactEmailRow) return serializeRegistration(exactEmailRow);
  }

  const initial = registrationFromInitialRecord(initialRecordForAccount(request || {}));
  if (initial) {
    const identity = accountIdentityDefaults(request || {});
    initial.accountId = identity.accountId;
    return serializeRegistration(initial);
  }

  return null;
};

exports.create = async function create(body, request) {
  const payload = applyAccountIdentity(payloadFromBody(body || {}), request);
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

  const payload = applyAccountIdentity(payloadFromBody(body || {}), request);
  validatePayload(payload);
  payload.update = actorFromRequest(request || {});

  const updated = await GraduateRegistration.findOneAndUpdate(
    accountOwnershipFilter(id, request),
    payload,
    { new: true, runValidators: true }
  ).lean();

  if (!updated) {
    const error = new Error('Graduate registration not found for current account');
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
