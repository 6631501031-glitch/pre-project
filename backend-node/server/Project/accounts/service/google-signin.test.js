'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { OAuth2Client } = require('google-auth-library');
const account = require('./account');

test('email sign-in verifies the configured audience and passes the verified identity', async (t) => {
  const previous = process.env.GOOGLE_CLIENT_ID;
  process.env.GOOGLE_CLIENT_ID = 'test-client.apps.googleusercontent.com';
  t.after(() => {
    if (previous === undefined) delete process.env.GOOGLE_CLIENT_ID;
    else process.env.GOOGLE_CLIENT_ID = previous;
  });
  t.mock.method(OAuth2Client.prototype, 'verifyIdToken', async (options) => {
    assert.equal(options.audience, process.env.GOOGLE_CLIENT_ID);
    assert.equal(options.idToken, 'test-token');
    return { getPayload: () => ({ email: 'admin@lamduan.mfu.ac.th', sub: 'verified-sub', picture: 'https://example.com/account-photo.jpg' }) };
  });
  const request = { body: { token: 'test-token', email: 'untrusted@example.com' } };
  let continued = false;
  await account.verifyIdTokenGoogle(request, {}, () => { continued = true; });
  assert.equal(continued, true);
  assert.equal(request.body.email, 'admin@lamduan.mfu.ac.th');
  assert.equal(request.body.googleSub, 'verified-sub');
  assert.equal(request.body.googlePicture, 'https://example.com/account-photo.jpg');
});

test('invalid Google tokens return an explicit error and never continue sign-in', async (t) => {
  t.mock.method(OAuth2Client.prototype, 'verifyIdToken', async () => { throw new Error('Invalid audience'); });
  t.mock.method(console, 'error', () => {});
  let status;
  let body;
  const response = {
    status(value) { status = value; return this; },
    json(value) { body = value; return this; }
  };
  await account.verifyIdTokenGoogle({ body: { token: 'invalid-token' } }, response, () => {
    assert.fail('Invalid identity must not reach sign-in');
  });
  assert.equal(status, 401);
  assert.equal(body.code, 'AUTH_GOOGLE_TOKEN_INVALID');
  assert.ok(body.message);
});
