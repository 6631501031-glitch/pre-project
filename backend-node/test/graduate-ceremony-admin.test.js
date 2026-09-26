const { test } = require('node:test');
const assert = require('node:assert/strict');
const Model = require('../server/Project/graduationsystemusingfacerecognition/models/graduate_registration.model');
const service = require('../server/Project/graduationsystemusingfacerecognition/service/graduate_registration');
const id = '507f1f77bcf86cd799439011';
test('admin persists ceremony fields without changing identity or face enrollment', async () => {
  const original = Model.findByIdAndUpdate;
  let mutation;
  Model.findByIdAndUpdate = (recordId, payload) => {
    assert.equal(recordId, id);
    mutation = payload;
    return { lean: async () => ({ _id: id, ...payload }) };
  };
  try {
    const saved = await service.updateAdminStatus(id, { ceremonyStatus: '20', ceremonyAssistanceType: '22', ceremonyStatusNote: 'Needs assistance', hasFoodAllergy: 'yes', foodAllergyNote: 'Peanuts', firstName: 'Must not replace', facePhoto: 'Must not replace' }, {});
    assert.equal(saved.ceremonyAssistanceType, '22');
    assert.equal(saved.ceremonyStatusNote, 'Needs assistance');
    assert.equal(saved.foodAllergyNote, 'Peanuts');
    assert.equal(mutation.firstName, undefined);
    assert.equal(mutation.facePhoto, undefined);
    await assert.rejects(service.updateAdminStatus(id, { ceremonyStatus: '20', ceremonyStatusNote: '', hasFoodAllergy: 'no' }, {}), { status: 400 });
    await assert.rejects(service.updateAdminStatus(id, { ceremonyStatus: '10', ceremonyStatusNote: '', hasFoodAllergy: 'yes', foodAllergyNote: '' }, {}), { status: 400 });
  } finally { Model.findByIdAndUpdate = original; }
});


test('list summary counts every graduate independently of page and table filters', async () => {
  const originals = { find: Model.find, countDocuments: Model.countDocuments, aggregate: Model.aggregate };
  Model.find = () => { const chain = { sort: () => chain, skip: () => chain, limit: () => chain, lean: async () => [] }; return chain; };
  Model.countDocuments = async () => 12;
  Model.aggregate = async pipeline => {
    assert.equal(pipeline[0].$group._id, '$ceremonyStatus');
    assert.ok(pipeline[0].$group.foodAllergy);
    return [{ _id: '10', count: 2400, foodAllergy: 123 }, { _id: '1', count: 100 }, { _id: '80', count: 300 }, { _id: null, count: 200 }];
  };
  try {
    const result = await service.list({ page: 2, limit: 10, school: 'Filtered school', includeSummary: 'true' });
    assert.deepEqual(result.summary, { total: 3000, responded: 2500, foodAllergy: 123 });
    assert.equal(result.total, 12);
    const normal = await service.list({ limit: 10 });
    assert.equal(normal.summary, undefined);
    Model.aggregate = async () => [];
    assert.deepEqual((await service.list({ includeSummary: true })).summary, { total: 0, responded: 0, foodAllergy: 0 });
  } finally { Object.assign(Model, originals); }
});

test('admin edits contact and academic details while preserving unrelated registration fields', async () => {
  const original = Model.findByIdAndUpdate;
  let mutation;
  Model.findByIdAndUpdate = (_, payload) => { mutation = payload; return { lean: async () => ({ _id: id, ...payload }) }; };
  try {
    await service.updateAdminStatus(id, {
      ceremonyStatus: '30', ceremonyStatusNote: '', hasFoodAllergy: 'no',
      firstName: 'Updated', lastName: 'Graduate', studentCode: '123', email: 'NEW@EXAMPLE.COM',
      firstNamePronunciation: 'First', lastNamePronunciation: 'Last', school: 'School', program: 'Program',
      homeAddress: { houseNo: '2' }, questionnaireEmploymentStatus: 'employed',
      facePhoto: 'forbidden', latestCheckIns: {}, accountId: id, create: {}
    }, {}, true);
    assert.equal(mutation.firstName, 'Updated');
    assert.equal(mutation.lastName, 'Graduate');
    assert.equal(mutation.email, 'new@example.com');
    assert.equal(mutation.school, 'School');
    assert.equal(mutation.program, 'Program');
    assert.equal(mutation.homeAddress, undefined);
    assert.equal(mutation.questionnaireEmploymentStatus, undefined);
    assert.equal(mutation.namePronunciation, undefined);
    for (const field of ['facePhoto', 'latestCheckIns', 'accountId', 'create', 'phone', 'studentCode', 'firstNamePronunciation', 'lastNamePronunciation']) assert.equal(mutation[field], undefined);
  } finally { Model.findByIdAndUpdate = original; }
});

test('user defaults return the admin-edited record even when the account has older contact details', async () => {
  const original = Model.find;
  const row = { _id: id, accountId: id, firstName: 'Updated', phone: '0812345678', email: 'updated@example.com', school: 'Updated school', schoolEnglish: 'Updated English school', program: 'Updated program', programEnglish: 'Updated English program' };
  Model.find = () => { const cursor = { sort: () => cursor, limit: () => cursor, lean: async () => [row] }; return cursor; };
  try {
    const result = await service.defaultsForAccount({ authAccount: { _id: id, email: 'old@example.com', firstName: 'Old' } });
    for (const field of ['firstName', 'phone', 'email', 'school', 'schoolEnglish', 'program', 'programEnglish']) assert.equal(result[field], row[field]);
  } finally { Model.find = original; }
});

test('user saves keep edited contact and academic values instead of restoring account defaults', async () => {
  const original = Model.findOneAndUpdate;
  let mutation;
  Model.findOneAndUpdate = (_, payload) => { mutation = payload; return { lean: async () => ({ _id: id, ...payload }) }; };
  try {
    await service.update(id, { firstName: 'Updated', email: 'edited@example.com', phone: '0812345678', school: 'Edited school', schoolEnglish: 'Edited English school', program: 'Edited program', programEnglish: 'Edited English program', ceremonyStatus: '30' }, { authAccount: { _id: id, email: 'old@example.com', school: 'Old school', program: 'Old program' } });
    assert.equal(mutation.email, 'edited@example.com');
    assert.equal(mutation.school, 'Edited school');
    assert.equal(mutation.program, 'Edited program');
  } finally { Model.findOneAndUpdate = original; }
});
