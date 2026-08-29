'use strict';

const fs = require('fs');
const path = require('path');
const XLSX = require('../../frontend-vue/node_modules/xlsx');

const inputPath = process.argv[2];
if (!inputPath) throw new Error('Usage: node scripts/generate-faculty-department-catalog.js <fac_dep.xlsx>');

const workbook = XLSX.readFile(path.resolve(inputPath));
const faculties = XLSX.utils.sheet_to_json(workbook.Sheets.faculty, { defval: '' });
const departments = XLSX.utils.sheet_to_json(workbook.Sheets.department, { defval: '' });

const catalog = faculties.map(function (faculty) {
  const facultyId = String(faculty.FACULTYID).trim();
  const schoolName = String(faculty.FACULTYNAME).trim();
  const school = schoolName.indexOf('สำนักวิชา') === 0 ? schoolName : 'สำนักวิชา' + schoolName;
  const schoolEnglish = String(faculty.FACULTYNAMEENG).trim();
  return {
    facultyId: facultyId,
    school: school,
    schoolEnglish: schoolEnglish,
    labelTh: school,
    labelEn: schoolEnglish,
    programs: departments
      .filter(function (department) { return String(department.FACULTYID).trim() === facultyId; })
      .map(function (department) {
        const program = String(department.DEPARTMENTNAME).trim();
        const programEnglish = String(department.DEPARTMENTNAMEENG).trim();
        return {
          departmentId: String(department.DEPARTMENTID).trim(),
          program: program,
          programEnglish: programEnglish,
          labelTh: program,
          labelEn: programEnglish
        };
      })
  };
});

const serialized = JSON.stringify(catalog, null, 2);
const backendPath = path.resolve(__dirname, '../server/Project/graduationsystemusingfacerecognition/service/faculty_department_catalog.js');
const frontendPath = path.resolve(__dirname, '../../frontend-vue/src/projects/views/graduation/school-program-catalog.js');
fs.writeFileSync(backendPath, "'use strict';\n\nmodule.exports = " + serialized + ';\n', 'utf8');
fs.writeFileSync(frontendPath, 'const SCHOOL_PROGRAM_CATALOG = ' + serialized + '\n\nexport default SCHOOL_PROGRAM_CATALOG\n', 'utf8');
console.log('Generated ' + catalog.length + ' faculties and ' + departments.length + ' departments.');
