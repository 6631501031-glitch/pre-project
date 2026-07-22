'use strict';

const express = require('express');
const router = express.Router();

const account = require('../accounts/service/account');
const authorization = require('../security/service/authorization');
const graduationsystemusingfacerecognitionDocument = require('./service/graduationsystemusingfacerecognition_document');
const graduateRegistration = require('./service/graduate_registration');

const canViewRegistry = authorization.requirePermission('/graduation-system-using-face-recognition/registry', 'view');
const canEditRegistry = authorization.requirePermission('/graduation-system-using-face-recognition/registry', 'edit');
const canDeleteRegistry = authorization.requirePermission('/graduation-system-using-face-recognition/registry', 'delete');
const canViewReports = authorization.requirePermission(['/graduation-system-using-face-recognition/registry', '/graduation-system-using-face-recognition/reports'], 'view');

function ok(response, data, status) {
  return response.status(status || 200).json({
    code: 20000,
    message: 'Success',
    data: data
  });
}

function fail(response, error) {
  const status = error && error.status ? error.status : 500;
  return response.status(status).json({
    code: status === 400 ? 40000 : 50000,
    message: error && error.message ? error.message : 'GRADUATIONSYSTEMUSINGFACERECOGNITIONGRADUATIONSYSTEMUSINGFACERECOGNITION request failed'
  });
}

function isLocalStudent(request) {
  return !!(request && request.authSession && request.authSession.source === 'local-student');
}

function localStudentCode(request) {
  const account = request && request.authAccount ? request.authAccount : {};
  const userinfo = account && account.userinfo ? account.userinfo : {};
  return String(account.studentCode || account.code || account.username || userinfo.studentCode || '').replace(/\D/g, '');
}

function allowLocalStudent(permissionMiddleware, options) {
  const settings = options || {};
  return async function (request, response, next) {
    if (!isLocalStudent(request)) return permissionMiddleware(request, response, next);

    const studentCode = localStudentCode(request);
    if (!studentCode) return response.status(403).json({ status: false, code: 40300, message: 'Student identity unavailable' });

    if (settings.bindBody) {
      request.body = Object.assign({}, request.body || {}, { barcodeValue: studentCode });
    }
    if (settings.requireOwnedRegistration) {
      try {
        const owned = await graduateRegistration.isOwnedByStudent(request.params.id, studentCode);
        if (!owned) return response.status(403).json({ status: false, code: 40300, message: 'Registration access denied' });
      } catch (error) {
        return fail(response, error);
      }
    }
    return next();
  };
}

router.use(account.onCheckAuthorization);

router.get('/registrations/me/defaults', async function (request, response) {
  try {
    return ok(response, await graduateRegistration.defaultsForAccount(request, request.query || {}));
  } catch (error) {
    return fail(response, error);
  }
});

router.get('/registrations/options', allowLocalStudent(canViewRegistry), async function (request, response) {
  try {
    return ok(response, await graduateRegistration.options());
  } catch (error) {
    return fail(response, error);
  }
});

router.get('/documents', canViewRegistry, async function (request, response) {
  try {
    return ok(response, await graduationsystemusingfacerecognitionDocument.list(request.query || {}));
  } catch (error) {
    return fail(response, error);
  }
});

router.get('/registrations', canViewRegistry, async function (request, response) {
  try {
    return ok(response, await graduateRegistration.list(request.query || {}));
  } catch (error) {
    return fail(response, error);
  }
});

router.post('/registrations', allowLocalStudent(canViewRegistry, { bindBody: true }), async function (request, response) {
  try {
    return ok(response, await graduateRegistration.create(request.body || {}, request), 201);
  } catch (error) {
    return fail(response, error);
  }
});

router.put('/registrations/:id', allowLocalStudent(canViewRegistry, { bindBody: true, requireOwnedRegistration: true }), async function (request, response) {
  try {
    return ok(response, await graduateRegistration.update(request.params.id, request.body || {}, request));
  } catch (error) {
    return fail(response, error);
  }
});

router.delete('/registrations/:id', canDeleteRegistry, async function (request, response) {
  try {
    return ok(response, await graduateRegistration.remove(request.params.id));
  } catch (error) {
    return fail(response, error);
  }
});

router.get('/documents/stats', canViewReports, async function (request, response) {
  try {
    return ok(response, await graduationsystemusingfacerecognitionDocument.stats());
  } catch (error) {
    return fail(response, error);
  }
});

router.post('/documents', canEditRegistry, async function (request, response) {
  try {
    return ok(response, await graduationsystemusingfacerecognitionDocument.create(request.body || {}, request), 201);
  } catch (error) {
    return fail(response, error);
  }
});

router.put('/documents/:id', canEditRegistry, async function (request, response) {
  try {
    return ok(response, await graduationsystemusingfacerecognitionDocument.update(request.params.id, request.body || {}, request));
  } catch (error) {
    return fail(response, error);
  }
});

router.delete('/documents/:id', canDeleteRegistry, async function (request, response) {
  try {
    return ok(response, await graduationsystemusingfacerecognitionDocument.remove(request.params.id));
  } catch (error) {
    return fail(response, error);
  }
});

router.post('/documents/seed-demo', canEditRegistry, async function (request, response) {
  try {
    return ok(response, await graduationsystemusingfacerecognitionDocument.seedDemo(request), 201);
  } catch (error) {
    return fail(response, error);
  }
});

module.exports = router;
