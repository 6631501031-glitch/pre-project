'use strict';

const { createProjectIamService } = require('../iam/project-iam-service');
const { normalizeAudience, normalizeScope } = require('../iam/iam-sdk-adapter');

const DEFAULT_GRADUATION_SYSTEM_USING_FACE_RECOGNITION_SCOPES = [
  'graduation.system.using.face.recognition.registry.read',
  'graduation.system.using.face.recognition.registry.write',
  'graduation.system.using.face.recognition.report.read',
  'iam.security.read',
  'iam.security.write',
  'iam.audit.read',
  'iam.accounts.read'
];

function applyGRADUATIONSYSTEMUSINGFACERECOGNITIONGRADUATIONSYSTEMUSINGFACERECOGNITIONDefaults(payload) {
  const source = payload || {};
  const metadata = Object.assign({}, source.metadata || {});

  const targetSystem = String(source.targetSystem || metadata.targetSystem || 'graduationsystemusingfacerecognition').trim();
  const ownerEmail = String(source.ownerEmail || metadata.ownerEmail || 'graduation-system-using-face-recognition.integration@example.com').trim();
  const partnerId = String(source.partnerId || metadata.partnerId || 'graduation-system-using-face-recognition-team').trim();
  const tenant = String(source.tenant || metadata.tenant || 'iam-shared').trim();
  const systemCode = source.systemCode || metadata.systemCode || null;

  return Object.assign({}, source, {
    targetSystem: targetSystem,
    ownerEmail: ownerEmail,
    partnerId: partnerId,
    tenant: tenant,
    allowedScopes: normalizeScope(source.allowedScopes || metadata.allowedScopes || DEFAULT_GRADUATION_SYSTEM_USING_FACE_RECOGNITION_SCOPES),
    allowedAudiences: normalizeAudience(source.allowedAudiences || metadata.allowedAudiences || 'graduationsystemusingfacerecognition-api'),
    metadata: Object.assign({}, metadata, systemCode ? {
      systemCode: String(systemCode).trim()
    } : {}, {
      targetSystem: targetSystem,
      ownerEmail: ownerEmail,
      partnerId: partnerId,
      tenant: tenant
    })
  });
}

function createGRADUATIONSYSTEMUSINGFACERECOGNITIONGRADUATIONSYSTEMUSINGFACERECOGNITIONIamService(config) {
  const projectIamService = createProjectIamService(config);

  return Object.assign({}, projectIamService, {
    async registerManagedClient(payload, options) {
      return projectIamService.registerManagedClient(applyGRADUATIONSYSTEMUSINGFACERECOGNITIONGRADUATIONSYSTEMUSINGFACERECOGNITIONDefaults(payload), options || {});
    },
    async updateManagedClient(payload, options) {
      return projectIamService.updateManagedClient(applyGRADUATIONSYSTEMUSINGFACERECOGNITIONGRADUATIONSYSTEMUSINGFACERECOGNITIONDefaults(payload), options || {});
    }
  });
}

module.exports = {
  createGRADUATIONSYSTEMUSINGFACERECOGNITIONGRADUATIONSYSTEMUSINGFACERECOGNITIONIamService: createGRADUATIONSYSTEMUSINGFACERECOGNITIONGRADUATIONSYSTEMUSINGFACERECOGNITIONIamService
};
