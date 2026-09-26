'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const auditSchema = new Schema({
  by: { type: Schema.ObjectId, default: null },
  name: { type: String, default: null },
  email: { type: String, default: null },
  datetime: { type: Date, default: Date.now }
}, { _id: false });

const addressSchema = new Schema({
  companyName: { type: String, trim: true, default: null },
  houseNo: { type: String, trim: true, default: null },
  moo: { type: String, trim: true, default: null },
  soi: { type: String, trim: true, default: null },
  road: { type: String, trim: true, default: null },
  subdistrict: { type: String, trim: true, default: null },
  district: { type: String, trim: true, default: null },
  province: { type: String, trim: true, default: null },
  postalCode: { type: String, trim: true, default: null }
}, { _id: false });

// Quality metrics reported by the browser side MediaPipe face detector for the
// frame that was accepted as the registered face photo.
const faceDetectionSchema = new Schema({
  model: { type: String, trim: true, default: null },
  score: { type: Number, default: null },
  faceCount: { type: Number, default: null },
  coverage: { type: Number, default: null },
  offsetX: { type: Number, default: null },
  offsetY: { type: Number, default: null },
  roll: { type: Number, default: null },
  yaw: { type: Number, default: null },
  brightness: { type: Number, default: null },
  width: { type: Number, default: null },
  height: { type: Number, default: null }
}, { _id: false });

const checkInSchema = new Schema({
  capturedAt: { type: Date, default: null },
  source: { type: String, trim: true, default: null },
  detection: { type: faceDetectionSchema, default: null }
}, { _id: false });

const graduateRegistrationSchema = new Schema({
  accountId: { type: Schema.ObjectId, default: null, index: true },
  firstName: { type: String, trim: true, default: null, index: true },
  lastName: { type: String, trim: true, default: null, index: true },
  namePronunciation: { type: String, trim: true, default: null },
  firstNamePronunciation: { type: String, trim: true, default: null },
  lastNamePronunciation: { type: String, trim: true, default: null },
  phone: { type: String, trim: true, default: null, index: true },
  email: { type: String, trim: true, lowercase: true, default: null },
  school: { type: String, trim: true, default: null, index: true },
  schoolEnglish: { type: String, trim: true, default: null, index: true },
  program: { type: String, trim: true, default: null, index: true },
  programEnglish: { type: String, trim: true, default: null, index: true },
  homeAddress: { type: addressSchema, default: () => ({}) },
  currentAddress: { type: addressSchema, default: () => ({}) },
  currentAddressSameAsHome: { type: Boolean, default: false },
  currentAddressBeforeHomeCopy: { type: addressSchema, default: () => ({}) },
  workAddress: { type: addressSchema, default: () => ({}) },
  ceremonyStatus: { type: String, trim: true, default: null, index: true },
  ceremonyStatusLabel: { type: String, trim: true, default: null, index: true },
  ceremonyAssistanceType: { type: String, trim: true, default: null, index: true },
  ceremonyStatusNote: { type: String, trim: true, default: null },
  certificateDeliveryMethod: { type: String, trim: true, default: null },
  certificateShippingService: { type: String, trim: true, default: null },
  certificateDeliveryAddress: { type: addressSchema, default: () => ({}) },
  hasFoodAllergy: { type: String, enum: ['yes', 'no'], default: 'no' },
  foodAllergyNote: { type: String, trim: true, default: null },
  questionnaireEmploymentStatus: { type: String, trim: true, default: null },
  questionnaireNote: { type: String, trim: true, default: null },
  studentCode: { type: String, trim: true, default: null, index: true },
  barcodeValue: { type: String, trim: true, default: null, index: true },
  facePhoto: { type: String, default: null },
  facePhotoCapturedAt: { type: Date, default: null },
  facePhotoBytes: { type: Number, default: null },
  facePhotoSource: { type: String, trim: true, default: null },
  facePhotoDetection: { type: faceDetectionSchema, default: null },
  latestCheckIns: {
    rehearsal: { type: checkInSchema, default: null },
    ceremony: { type: checkInSchema, default: null }
  },
  create: { type: auditSchema, default: () => ({}) },
  update: { type: auditSchema, default: null }
}, {
  timestamps: true
});

graduateRegistrationSchema.index({
  firstName: 'text',
  lastName: 'text',
  phone: 'text',
  email: 'text',
  school: 'text',
  schoolEnglish: 'text',
  program: 'text',
  programEnglish: 'text',
  ceremonyStatusLabel: 'text',
  studentCode: 'text',
  barcodeValue: 'text'
});

module.exports = mongoose.model('Graduate_Registration', graduateRegistrationSchema, 'Graduate_Registration');
