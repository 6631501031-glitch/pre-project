'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const Model = require('../server/Project/graduationsystemusingfacerecognition/models/graduate_registration.model');
const service = require('../server/Project/graduationsystemusingfacerecognition/service/graduate_registration');
const id = '507f1f77bcf86cd799439011';

test('rejects invalid identity, mode and uncertain recognition', async () => {
  for (const body of [{ checkInMode: 'wrong', distance: 0.2 }, { checkInMode: 'rehearsal', distance: 0.8 }, { checkInMode: 'rehearsal', distance: NaN }]) {
    await assert.rejects(service.checkIn(id, body, {}), { status: 400 });
  }
  await assert.rejects(service.checkIn('invalid', { checkInMode: 'rehearsal', distance: 0.2 }, {}), { status: 400 });
});

test('writes attendance atomically without overwriting the enrollment image', async () => {
  const original = Model.findOneAndUpdate;
  let update;
  let filter;
  Model.findOneAndUpdate = (query, mutation) => {
    filter = query;
    update = mutation;
    return { lean: async () => ({ _id: id, latestCheckIns: { rehearsal: mutation.$set['latestCheckIns.rehearsal'] } }) };
  };
  try {
    const result = await service.checkIn(id, { checkInMode: 'rehearsal', distance: 0.2 }, {});
    assert.equal(result.duplicate, false);
    assert.ok(update.$set['latestCheckIns.rehearsal'].capturedAt);
    assert.equal(update.$set.facePhoto, undefined);
    assert.equal(update.$set['latestCheckIns.ceremony'], undefined);
    assert.ok(filter.$or[1]['latestCheckIns.rehearsal.capturedAt'].$lt instanceof Date);
  } finally { Model.findOneAndUpdate = original; }
});

test('returns the prior receipt for repeated recognition', async () => {
  const originalUpdate = Model.findOneAndUpdate;
  const originalFind = Model.findById;
  const capturedAt = new Date();
  Model.findOneAndUpdate = () => ({ lean: async () => null });
  Model.findById = () => ({ select: () => ({ lean: async () => ({ _id: id, latestCheckIns: { ceremony: { capturedAt } } }) }) });
  try {
    const result = await service.checkIn(id, { checkInMode: 'ceremony', distance: 0.2 }, {});
    assert.equal(result.duplicate, true);
    assert.equal(result.latestCheckIns.ceremony.capturedAt, capturedAt);
    await assert.rejects(service.checkIn(id, { checkInMode: 'rehearsal', distance: 0.2 }, {}), { status: 404 });
  } finally { Model.findOneAndUpdate = originalUpdate; Model.findById = originalFind; }
});

test('lists persisted attendance using stable pagination order', async () => {
  const originalFind = Model.find;
  const originalCount = Model.countDocuments;
  const latestCheckIns = { rehearsal: { capturedAt: new Date('2026-08-01') }, ceremony: { capturedAt: new Date('2026-09-01') } };
  let order;
  const cursor = { sort(value) { order = value; return this; }, skip() { return this; }, limit() { return this; }, async lean() { return [{ _id: id, latestCheckIns }]; } };
  Model.find = () => cursor;
  Model.countDocuments = async () => 1;
  try {
    const result = await service.list({ sortBy: 'attendance', includePhotos: false });
    assert.deepEqual(order, { _id: 1 });
    assert.deepEqual(result.rows[0].latestCheckIns, latestCheckIns);
    await service.list({});
    assert.deepEqual(order, { updatedAt: -1 });
  } finally { Model.find = originalFind; Model.countDocuments = originalCount; }
});
