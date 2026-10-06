'use strict';

const express = require('express');
const router = express.Router();

const Account = require('./service/account');
const authorization = require('../security/service/authorization');
const iamAdminClient = require('../security/service/iam-admin-client');
const {
  isAllowedAdminEmail
} = require('../../../helpers/admin-emails');

const canViewAccounts = authorization.requirePermission(
  '/accounts/directory',
  'view'
);
const canViewAdminAccess = authorization.requirePermission(
  '/security/permissions/matrix',
  'view'
);

const canEditAccounts = authorization.requirePermission(
  '/accounts/directory',
  'edit',
  {
    targetAccountId: request =>
      request.params && request.params.id
        ? String(request.params.id)
        : ''
  }
);

const canActionAccounts = authorization.requirePermission(
  '/accounts/directory',
  'action',
  {
    targetAccountId: request =>
      request.params && request.params.id
        ? String(request.params.id)
        : ''
  }
);

const canViewLifecycle = authorization.requirePermission(
  '/accounts/lifecycle',
  'view',
  {
    targetAccountId: request =>
      request.params && request.params.id
        ? String(request.params.id)
        : ''
  }
);

const canEditLifecycle = authorization.requirePermission(
  '/accounts/lifecycle',
  'edit',
  {
    targetAccountId: request =>
      request.params && request.params.id
        ? String(request.params.id)
        : ''
  }
);

const canActionLifecycle = authorization.requirePermission(
  '/accounts/lifecycle',
  'action',
  {
    targetAccountId: request =>
      request.params && request.params.id
        ? String(request.params.id)
        : ''
  }
);

function isLocalStudentSession(request) {
  return !!(
    request &&
    request.authSession &&
    request.authSession.source === 'local-student'
  );
}

function isLocalSession(request) {
  const source = request && request.authSession
    ? request.authSession.source
    : '';

  return source === 'local-student' || source === 'local-admin';
}

function hasIamSigninCredentials() {
  const clientId =
    process.env.IAM_SDK_CLIENT_ID ||
    process.env.IAM_ADMIN_CLIENT_ID ||
    process.env.IAM_SDK_ADMIN_CLIENT_ID;

  const clientSecret =
    process.env.IAM_SDK_CLIENT_SECRET ||
    process.env.IAM_ADMIN_CLIENT_SECRET ||
    process.env.IAM_SDK_ADMIN_CLIENT_SECRET;

  return !!(
    String(clientId || '').trim() &&
    String(clientSecret || '').trim()
  );
}

// เรียกหลังตรวจ Google token สำเร็จแล้วเท่านั้น
function requireAllowedAdminAccount(request, response, next) {
  const email = String(
    request.body && request.body.email || ''
  ).trim().toLowerCase();

  if (!isAllowedAdminEmail(email)) {
    return response.status(403).json({
      status: false,
      code: 'AUTH_ADMIN_EMAIL_NOT_ALLOWED',
      message: 'อีเมลนี้ไม่ได้รับอนุญาตให้เข้าสู่ระบบผู้ดูแล'
    });
  }

  request.localVerifiedLamduanSignin = true;
  return next();
}

router.post('/signin', function (request, response, next) {
  const isGoogleSignin = !!(
    request.body && request.body.token
  );

  // ใช้เส้นทางเดิมสำหรับการเข้าสู่ระบบด้วยรหัสนักศึกษา
  if (!isGoogleSignin) {
    return iamAdminClient.forwardScopedSignin(request, response);
  }

  // ตรวจ token ก่อน แล้วตรวจอีเมลที่ได้จาก Google
  return Account.verifyIdTokenGoogle(
    request,
    response,
    function () {
      return requireAllowedAdminAccount(
        request,
        response,
        function () {
          if (!hasIamSigninCredentials()) {
            return Account.SingIn(request, response, next);
          }

          return iamAdminClient.forwardScopedSignin(
            request,
            response
          );
        }
      );
    }
  );
});

router.get('/auth/me', Account.onCheckAuthorization, function (request, response) {
  if (isLocalSession(request)) {
    return Account.onMe(request, response);
  }

  return iamAdminClient.forwardUserRequest(request, response, {
    method: 'get',
    path: '/auth/me'
  });
});

router.get('/auth/sessions', Account.onCheckAuthorization, function (request, response) {
  if (isLocalSession(request)) {
    return Account.onSessions(request, response);
  }

  return iamAdminClient.forwardUserRequest(request, response, {
    method: 'get',
    path: '/auth/sessions'
  });
});

router.delete('/auth/sessions/:id', Account.onCheckAuthorization, function (request, response) {
  if (isLocalSession(request)) {
    return Account.onRevokeSession(request, response);
  }

  return iamAdminClient.forwardUserRequest(request, response, {
    method: 'delete',
    path: `/auth/sessions/${String(request.params && request.params.id ? request.params.id : '')}`
  });
});

router.post('/auth/logout', Account.onCheckAuthorization, function (request, response) {
  if (isLocalSession(request)) {
    return Account.onLogout(request, response);
  }

  return iamAdminClient.forwardUserRequest(request, response, {
    method: 'post',
    path: '/auth/logout'
  });
});

router.post('/auth/logout-all', Account.onCheckAuthorization, function (request, response) {
  if (isLocalSession(request)) {
    return Account.onLogoutAll(request, response);
  }

  return iamAdminClient.forwardUserRequest(request, response, {
    method: 'post',
    path: '/auth/logout-all'
  });
});

router.post('/auth/2fa/request', Account.onCheckAuthorization, function (request, response) {
  return iamAdminClient.forwardUserRequest(request, response, {
    method: 'post',
    path: '/auth/2fa/request'
  });
});

router.post('/auth/2fa/verify', Account.onCheckAuthorization, function (request, response) {
  return iamAdminClient.forwardUserRequest(request, response, {
    method: 'post',
    path: '/auth/2fa/verify'
  });
});

router.put('/auth/profile-photo', Account.onCheckAuthorization, function (request, response) {
  return iamAdminClient.forwardUserRequest(request, response, {
    method: 'put',
    path: '/auth/profile-photo'
  });
});

router.get('/auth/trusted-devices', Account.onCheckAuthorization, function (request, response) {
  if (isLocalStudentSession(request)) {
    return Account.onTrustedDevices(request, response);
  }

  return iamAdminClient.forwardUserRequest(request, response, {
    method: 'get',
    path: '/auth/trusted-devices'
  });
});

router.post('/auth/trust-device', Account.onCheckAuthorization, function (request, response) {
  if (isLocalStudentSession(request)) {
    return Account.onTrustDevice(request, response);
  }

  return iamAdminClient.forwardUserRequest(request, response, {
    method: 'post',
    path: '/auth/trust-device'
  });
});

router.delete('/auth/trusted-devices/:id', Account.onCheckAuthorization, function (request, response) {
  if (isLocalStudentSession(request)) {
    return Account.onRevokeTrustedDevice(request, response);
  }

  return iamAdminClient.forwardUserRequest(request, response, {
    method: 'delete',
    path: `/auth/trusted-devices/${String(request.params && request.params.id ? request.params.id : '')}`
  });
});

router.get('/accounts', Account.onCheckAuthorization, canViewAccounts, function (request, response) {
  return iamAdminClient.forwardAccountsList(request, response);
});

router.get('/accounts/admin-active-sessions', Account.onCheckAuthorization, canViewAdminAccess, function (request, response) {
  if (request.authSession && request.authSession.source === 'local-admin') {
    return Account.onAdminActiveSessions(request, response);
  }
  return iamAdminClient.forwardActiveAdminSessions(request, response);
});

router.post('/accounts/invite', Account.onCheckAuthorization, canActionAccounts, function (request, response) {
  return iamAdminClient.forwardInviteAccountToScope(request, response);
});

router.put('/accounts/:id', Account.onCheckAuthorization, canEditAccounts, iamAdminClient.requireScopedAccount, function (request, response) {
  return iamAdminClient.forwardUpdateAccountToScope(request, response);
});

router.delete('/accounts/:id/graduationsystemusingfacerecognition-access', Account.onCheckAuthorization, canActionAccounts, iamAdminClient.requireScopedAccount, function (request, response) {
  return iamAdminClient.forwardRemoveAccountFromScope(request, response);
});

router.get('/accounts/:id/sessions', Account.onCheckAuthorization, canViewAccounts, iamAdminClient.requireScopedAccount, function (request, response) {
  return iamAdminClient.forwardUserRequest(request, response, {
    method: 'get',
    path: `/accounts/${String(request.params && request.params.id ? request.params.id : '')}/sessions`
  });
});

router.delete('/accounts/:id/sessions/:sessionId', Account.onCheckAuthorization, canActionAccounts, iamAdminClient.requireScopedAccount, function (request, response) {
  return iamAdminClient.forwardUserRequest(request, response, {
    method: 'delete',
    path: `/accounts/${String(request.params && request.params.id ? request.params.id : '')}/sessions/${String(request.params && request.params.sessionId ? request.params.sessionId : '')}`
  });
});

router.get('/accounts/:id/trusted-devices', Account.onCheckAuthorization, canViewAccounts, iamAdminClient.requireScopedAccount, function (request, response) {
  return iamAdminClient.forwardUserRequest(request, response, {
    method: 'get',
    path: `/accounts/${String(request.params && request.params.id ? request.params.id : '')}/trusted-devices`
  });
});

router.delete('/accounts/:id/trusted-devices/:trustedDeviceId', Account.onCheckAuthorization, canActionAccounts, iamAdminClient.requireScopedAccount, function (request, response) {
  return iamAdminClient.forwardUserRequest(request, response, {
    method: 'delete',
    path: `/accounts/${String(request.params && request.params.id ? request.params.id : '')}/trusted-devices/${String(request.params && request.params.trustedDeviceId ? request.params.trustedDeviceId : '')}`
  });
});

router.get('/accounts/:id/lifecycle', Account.onCheckAuthorization, canViewLifecycle, iamAdminClient.requireScopedAccount, function (request, response) {
  return iamAdminClient.forwardUserRequest(request, response, {
    method: 'get',
    path: `/accounts/${String(request.params && request.params.id ? request.params.id : '')}/lifecycle`
  });
});

router.put('/accounts/:id/lifecycle', Account.onCheckAuthorization, canEditLifecycle, iamAdminClient.requireScopedAccount, function (request, response) {
  return iamAdminClient.forwardUserRequest(request, response, {
    method: 'put',
    path: `/accounts/${String(request.params && request.params.id ? request.params.id : '')}/lifecycle`
  });
});

router.post('/accounts/:id/provision', Account.onCheckAuthorization, canActionLifecycle, iamAdminClient.requireScopedAccount, function (request, response) {
  return iamAdminClient.forwardUserRequest(request, response, {
    method: 'post',
    path: `/accounts/${String(request.params && request.params.id ? request.params.id : '')}/provision`
  });
});

router.post('/accounts/:id/deprovision', Account.onCheckAuthorization, canActionLifecycle, iamAdminClient.requireScopedAccount, function (request, response) {
  return iamAdminClient.forwardUserRequest(request, response, {
    method: 'post',
    path: `/accounts/${String(request.params && request.params.id ? request.params.id : '')}/deprovision`
  });
});

router.get('/accounts/group/options', Account.onCheckAuthorization, canViewAccounts, function (request, response) {
  return iamAdminClient.forwardAccountGroupOptions(request, response);
});

router.get('/accounts/:id/effective-permissions', Account.onCheckAuthorization, canViewAccounts, iamAdminClient.requireScopedAccount, function (request, response) {
  return iamAdminClient.forwardEffectivePermissions(request, response);
});

router.get('/accounts/status/options', Account.onCheckAuthorization, canViewAccounts, function (request, response) {
  return iamAdminClient.forwardAccountStatusOptions(request, response);
});

router.put('/accounts/:id/status', Account.onCheckAuthorization, canActionAccounts, iamAdminClient.requireScopedAccount, function (request, response) {
  return iamAdminClient.forwardChangeAccountStatusToScope(request, response);
});

module.exports = router;
