'use strict';

const mongoose = require('mongoose');
require('dotenv').config();

const config = require('../config/config');
const GraduateRegistration = require('../server/Project/graduationsystemusingfacerecognition/models/graduate_registration.model');
const registrationService = require('../server/Project/graduationsystemusingfacerecognition/service/graduate_registration');

async function main() {
  await mongoose.connect(config.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
  const dryRun = process.argv.includes('--dry-run');
  const rows = await GraduateRegistration.find({}).lean();
  const operations = rows.map(function (row) {
    const assigned = registrationService.withFacultyDepartmentDefaults(row);
    return {
      updateOne: {
        filter: { _id: row._id },
        update: {
          $set: {
            school: assigned.school,
            schoolEnglish: assigned.schoolEnglish,
            program: assigned.program,
            programEnglish: assigned.programEnglish
          }
        }
      }
    };
  });
  let updated = operations.length;
  if (!dryRun && operations.length) {
    const result = await GraduateRegistration.bulkWrite(operations, { ordered: false });
    updated = result.modifiedCount !== undefined ? result.modifiedCount : result.nModified;
  }
  console.log(JSON.stringify({ dryRun: dryRun, matched: rows.length, updated: updated }, null, 2));
  await mongoose.disconnect();
}

main().catch(async function (error) {
  console.error(error && error.stack ? error.stack : error);
  try { await mongoose.disconnect(); } catch (disconnectError) {}
  process.exit(1);
});
