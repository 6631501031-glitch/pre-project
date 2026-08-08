<template>
  <div class="graduate-registration-page">
    <div class="registration-header">
      <div>
        <div class="registration-header__eyebrow">{{ registrationStepLabel }}</div>
        <h1>{{ $t('graduation.self.title') }}</h1>
      </div>
    </div>

    <CRow>
      <CCol lg="9" class="mb-3">
        <CCard class="registration-card">
          <CCardBody>
            <div class="section-heading">
              <h2>{{ $t('graduation.self.sections.name') }}</h2>
            </div>
            <CRow>
              <CCol md="6" class="required-field">
                <CInput
                  ref="firstNameField"
                  v-model.trim="form.firstName"
                  :label="$t('graduation.fields.firstName')"
                  :readonly="isLockedField('firstName')"
                  :tabindex="isLockedField('firstName') ? -1 : 0"
                  :class="[{ 'is-invalid': hasFieldError('firstName') }, { 'readonly-white': isLockedField('firstName') }]"
                />
                <div v-if="hasFieldError('firstName')" class="invalid-feedback d-block">{{ validationErrors.firstName }}</div>
              </CCol>
              <CCol md="6" class="required-field">
                <CInput
                  ref="lastNameField"
                  v-model.trim="form.lastName"
                  :label="$t('graduation.fields.lastName')"
                  :readonly="isLockedField('lastName')"
                  :tabindex="isLockedField('lastName') ? -1 : 0"
                  :class="[{ 'is-invalid': hasFieldError('lastName') }, { 'readonly-white': isLockedField('lastName') }]"
                />
                <div v-if="hasFieldError('lastName')" class="invalid-feedback d-block">{{ validationErrors.lastName }}</div>
              </CCol>
              <CCol md="6" class="required-field">
                <CInput
                  ref="firstNamePronunciationField"
                  v-model.trim="form.firstNamePronunciation"
                  :label="$t('graduation.fields.firstNamePronunciation')"
                  :class="{ 'is-invalid': hasFieldError('firstNamePronunciation') }"
                  @keydown.native="onPronunciationKeydown('firstNamePronunciation', $event)"
                />
                <div v-if="hasFieldError('firstNamePronunciation')" class="invalid-feedback d-block">{{ validationErrors.firstNamePronunciation }}</div>
              </CCol>
              <CCol md="6" class="required-field">
                <CInput
                  ref="lastNamePronunciationField"
                  v-model.trim="form.lastNamePronunciation"
                  :label="$t('graduation.fields.lastNamePronunciation')"
                  :class="{ 'is-invalid': hasFieldError('lastNamePronunciation') }"
                  @keydown.native="onPronunciationKeydown('lastNamePronunciation', $event)"
                />
                <div v-if="hasFieldError('lastNamePronunciation')" class="invalid-feedback d-block">{{ validationErrors.lastNamePronunciation }}</div>
              </CCol>
              <CCol md="6">
                <div ref="phoneField" class="phone-field" :class="{ 'is-invalid': hasFieldError('phone') }">
                  <label class="phone-field__label">{{ $t('graduation.fields.phone') }}<span class="required-mark">*</span></label>
                  <div class="phone-field__control">
                    <CSelect
                      v-model="phoneCountry"
                      :options="phoneCountryOptions"
                      class="phone-country-select"
                      @input="onPhoneCountryInput"
                      @change="onPhoneCountryInput"
                    />
                    <CInput
                      v-model="phoneLocalNumber"
                      type="tel"
                      inputmode="numeric"
                      pattern="[0-9]*"
                      placeholder="812345678"
                      class="phone-local-input"
                      @keydown.native="onPhoneNumberKeydown"
                      @paste.native="onPhoneNumberPaste"
                    />
                  </div>
                </div>
                <div v-if="hasFieldError('phone')" class="invalid-feedback d-block">{{ validationErrors.phone }}</div>
              </CCol>
              <CCol md="6">
                <CInput v-model.trim="form.email" type="email" :label="$t('graduation.fields.email')" :readonly="isLockedField('email')" :class="{ 'readonly-white': isLockedField('email') }" />
              </CCol>
            </CRow>
            <div class="section-heading section-heading--separated">
              <h2>{{ $t('graduation.self.sections.school') }}</h2>
            </div>
            <CRow>
              <CCol md="6" class="required-field">
                <CInput
                  ref="schoolField"
                  :value="summarySchool"
                  :label="$t('graduation.fields.school')"
                  readonly
                  :tabindex="-1"
                  :class="[{ 'is-invalid': hasFieldError('school') }, 'readonly-white']"
                />
                <div v-if="hasFieldError('school')" class="invalid-feedback d-block">{{ validationErrors.school }}</div>
              </CCol>
              <CCol md="6" class="required-field">
                <CInput
                  ref="programField"
                  :value="summaryProgram"
                  :label="$t('graduation.fields.program')"
                  readonly
                  :tabindex="-1"
                  :class="[{ 'is-invalid': hasFieldError('program') }, 'readonly-white']"
                />
                <div v-if="hasFieldError('program')" class="invalid-feedback d-block">{{ validationErrors.program }}</div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <CCard class="registration-card address-group-card mt-3">
          <CCardBody>
            <div class="address-group-heading">
              <h2>{{ addressGroupTitle }}</h2>
            </div>
            <div class="address-panel address-panel--home">
              <AddressFields
                :title="$t('graduation.address.home')"
                :address="form.homeAddress"
                :required="true"
                :show-required-mark="false"
                :readonly="false"
                :hide-save="true"
                :source-options="[]"
              />
            </div>
            <div class="address-panel">
              <AddressFields
                :title="$t('graduation.address.current')"
                :address="form.currentAddress"
                :required="true"
                :show-required-mark="false"
                :readonly="currentAddressSameAsHome"
                :allow-edit="false"
                :show-same-address-control="true"
                :same-address-checked="currentAddressSameAsHome"
                :same-address-label="currentAddressSameAsHomeLabel"
                :hide-save="true"
                :source-options="[]"
                @toggle-same-address="toggleCurrentAddressSameAsHome"
              />
            </div>
            <div class="address-panel">
              <AddressFields
                :title="$t('graduation.address.work')"
                :address="form.workAddress"
                :readonly="false"
                :hide-save="true"
                :show-company-name="true"
                :source-options="[]"
                @select-source="onAddressSourceSelect('workAddress', $event)"
              />
            </div>
          </CCardBody>
        </CCard>

        <div class="form-actions">
          <CButton color="primary" :disabled="saveButtonDisabled" class="summary-save-button" @click="goToFacePage">
            <CIcon name="cil-save" class="mr-2" />
            {{ saving ? $t('graduation.self.actions.saving') : $t('graduation.self.actions.save') }}
          </CButton>
        </div>
      </CCol>

      <CCol lg="3" class="mb-3">
        <aside class="face-preview-panel">
          <div class="face-preview-panel__heading">
            <span class="face-preview-panel__icon"><CIcon name="cil-camera" /></span>
            <div>
              <h2>{{ facePanelTitle }}</h2>
              <p>{{ facePanelSubtitle }}</p>
            </div>
          </div>

          <div v-if="savedFacePhoto" class="face-preview-panel__photo">
            <img :src="savedFacePhoto" :alt="facePhotoAlt">
            <span class="face-preview-panel__status face-preview-panel__status--success">
              <CIcon name="cil-check-circle" /> {{ faceSavedLabel }}
            </span>
          </div>
          <div v-else class="face-preview-panel__empty">
            <span><CIcon name="cil-user" /></span>
            <strong>{{ faceNotSavedLabel }}</strong>
            <small>{{ faceNotSavedHint }}</small>
          </div>

          <div class="face-preview-panel__identity">
            <span>{{ fullName || '-' }}</span>
            <small>{{ authStudentCode || currentRegistrationBarcodeValue || '-' }}</small>
          </div>
        </aside>
      </CCol>

    </CRow>
  </div>
</template>

<script>
import api from '@/service/api'
import { notifyError, notifySuccess } from '@/projects/utils/notify'
import { getGraduationProgress, graduationStepTotal, markGraduationStep } from '@/projects/utils/graduation-workflow-progress'
import SCHOOL_PROGRAM_CATALOG from './school-program-catalog'
import GRADUATE_INITIAL_CATALOG from './graduate-initial-catalog'

const STORAGE_KEY = 'graduate-self-registration-draft'

const VALIDATION_FIELD_ORDER = [
  'firstName',
  'lastName',
  'firstNamePronunciation',
  'lastNamePronunciation',
  'phone',
  'school',
  'program',
]

const THAI_SCHOOL_PROGRAMS = {
  'สำนักวิชาวิทยาศาสตร์': [
    'สาขาวิชาวิทยาศาสตร์ชีวภาพ',
    'สาขาวิชาเคมีประยุกต์',
    'สาขาวิชาวิศวกรรมวัสดุ'
  ],
  'สำนักวิชาอุตสาหกรรมเกษตร': [
    'สาขาวิชานวัตกรรมวิทยาศาสตร์และเทคโนโลยีอาหาร',
    'สาขาวิชาโลจิสติกส์เกษตรและอาหาร (หลักสูตร 2 ปริญญา)',
    'สาขาวิชาโลจิสติกส์เกษตรและอาหาร'
  ],
  'สำนักวิชาเทคโนโลยีดิจิทัลประยุกต์': [
    'สาขาวิชาวิศวกรรมคอมพิวเตอร์',
    'สาขาวิชาวิศวกรรมดิจิทัลและการสื่อสาร',
    'สาขาวิชาวิศวกรรมซอฟต์แวร์',
    'สาขาวิชาเทคโนโลยีดิจิทัลเพื่อนวัตกรรมทางธุรกิจ',
    'สาขาวิชาเทคโนโลยีมัลติมีเดียและการสร้างภาพเคลื่อนไหว'
  ],
  'สำนักวิชาวิทยาศาสตร์เครื่องสำอาง': [
    'สาขาวิชาเทคโนโลยีความงาม',
    'สาขาวิชาวิทยาศาสตร์เครื่องสำอาง'
  ],
  'สำนักวิชาวิทยาศาสตร์สุขภาพ': [
    'หลักสูตรสาธารณสุขศาสตรบัณฑิต',
    'สาขาวิชาวิทยาศาสตร์การกีฬาและสุขภาพ',
    'สาขาวิชาอนามัยสิ่งแวดล้อม',
    'สาขาวิชาอาชีวอนามัยและความปลอดภัย'
  ],
  'สำนักวิชาการแพทย์บูรณาการ': [
    'หลักสูตรการแพทย์แผนไทยประยุกต์บัณฑิต',
    'หลักสูตรกายภาพบำบัดบัณฑิต',
    'หลักสูตรการแพทย์แผนจีนบัณฑิต'
  ],
  'สำนักวิชาพยาบาลศาสตร์': [
    'หลักสูตรพยาบาลศาสตรบัณฑิต'
  ],
  'สำนักวิชาแพทยศาสตร์': [
    'หลักสูตรแพทยศาสตรบัณฑิต'
  ],
  'สำนักวิชาทันตแพทยศาสตร์': [
    'หลักสูตรทันตแพทยศาสตรบัณฑิต'
  ],
  'สำนักวิชาจีนวิทยา': [
    'สาขาวิชาจีนศึกษา',
    'สาขาวิชาภาษาจีนธุรกิจ',
    'สาขาวิชาภาษาและวัฒนธรรมจีน',
    'สาขาวิชาการสอนภาษาจีน'
  ],
  'สำนักวิชาการจัดการ': [
    'หลักสูตรบริหารธุรกิจบัณฑิต',
    'หลักสูตรเศรษฐศาสตรบัณฑิต',
    'หลักสูตรบัญชีบัณฑิต'
  ],
  'สำนักวิชานิติศาสตร์': [
    'หลักสูตรนิติศาสตรบัณฑิต',
    'สาขาวิชากฎหมายธุรกิจและการสื่อสารด้วยภาษาจีน'
  ],
  'สำนักวิชาศิลปศาสตร์': [
    'สาขาวิชาภาษาอังกฤษ',
    'สาขาวิชาภาษาและวัฒนธรรมไทยสำหรับชาวต่างประเทศ'
  ],
  'สำนักวิชานวัตกรรมสังคม': [
    'สาขาวิชาการพัฒนาระหว่างประเทศ'
  ]
}
function normalizeOptionValue (value) {
  if (value && typeof value === 'object') {
    if (value.target && value.target.value !== undefined) return normalizeOptionValue(value.target.value)
    if (value.value !== undefined) return normalizeOptionValue(value.value)
    if (value.label !== undefined) return normalizeOptionValue(value.label)
    if (value.text !== undefined) return normalizeOptionValue(value.text)
  }
  return String(value == null ? '' : value).replace(/\s+/g, '').trim()
}

function optionValue (value) {
  if (value && typeof value === 'object') {
    if (value.target && value.target.value !== undefined) return optionValue(value.target.value)
    if (value.value !== undefined) return optionValue(value.value)
    if (value.label !== undefined) return optionValue(value.label)
    if (value.text !== undefined) return optionValue(value.text)
  }
  return String(value == null ? '' : value)
}

function meaningfulOptionValue (value) {
  const normalized = optionValue(value).trim()
  const normalizedLower = normalized.toLowerCase()
  return ['กรุณาระบุ', 'please specify'].includes(normalizedLower) ? '' : normalized
}

function normalizeYesNo (value) {
  const normalized = optionValue(value).trim().toLowerCase()
  if (['yes', 'true', '1', 'มี'].includes(normalized)) return 'yes'
  if (['no', 'false', '0', 'ไม่มี'].includes(normalized)) return 'no'
  return normalized
}

function normalizeCode (value) {
  if (value && typeof value === 'object') {
    if (value.target && value.target.value !== undefined) return normalizeCode(value.target.value)
    if (value.value !== undefined) return normalizeCode(value.value)
    if (value.label !== undefined) return normalizeCode(value.label)
    if (value.text !== undefined) return normalizeCode(value.text)
  }
  const raw = String(value == null ? '' : value).trim()
  const code = raw.match(/\d+/)
  return code ? code[0] : raw
}

function isAssistanceCeremonyStatus (value) {
  return normalizeCode(value) === '20'
}

function normalizeCeremonyStatus (value) {
  const code = normalizeCode(value)
  if (CEREMONY_STATUS_OPTIONS.some(item => item.value === code)) return code
  return LEGACY_CEREMONY_STATUS_MAP[code] || ''
}

function schoolKeyFor (school) {
  const normalized = normalizeOptionValue(school)
  const catalogMatch = SCHOOL_PROGRAM_CATALOG.find(item => normalizeOptionValue(item && item.school) === normalized)
  if (catalogMatch) return textValue(catalogMatch.school)
  return Object.keys(THAI_SCHOOL_PROGRAMS).find(item => normalizeOptionValue(item) === normalized)
}

function schoolComparableValue (school) {
  return normalizeOptionValue(textValue(school).replace(/^สำนักวิชา/, ''))
}

function localizedCatalogLabel (item, fallback, isEnglish) {
  const source = item && typeof item === 'object' ? item : {}
  if (isEnglish) {
    return textValue(source.labelEn) ||
      textValue(source.schoolEnglish) ||
      textValue(source.programEnglish) ||
      textValue(fallback)
  }
  return textValue(source.labelTh) ||
    textValue(source.school) ||
    textValue(source.program) ||
    textValue(fallback)
}

const CEREMONY_STATUS_OPTIONS = [
  { value: '10', key: '10' },
  { value: '20', key: '20' },
  { value: '30', key: '30' },
  { value: '40', key: '40' },
  { value: '50', key: '50' },
  { value: '60', key: '60' },
  { value: '70', key: '70' }
]
const FACE_CHECKIN_CEREMONY_STATUS_CODES = ['10', '20', '30', '40']

const LEGACY_CEREMONY_STATUS_MAP = {
  1: '10',
  2: '50',
  3: '60'
}

const CEREMONY_ASSISTANCE_TYPE_OPTIONS = [
  { value: '21', key: '21' },
  { value: '22', key: '22' },
  { value: '23', key: '23' },
  { value: '24', key: '24' }
]

const CEREMONY_STATUS_REQUIRES_NOTE = ['70']
const CEREMONY_ASSISTANCE_REQUIRES_NOTE = ['21', '22', '23', '24']

const CERTIFICATE_SHIPPING_SERVICE_OPTIONS = [
  { value: 'registered-domestic', fee: 80 },
  { value: 'registered-international', fee: 650 },
  { value: 'ems-domestic', fee: 120 },
  { value: 'ems-international', fee: 1200 }
]

const PHONE_COUNTRY_OPTIONS = [
  { value: 'TH', labelTh: 'ประเทศไทย', labelEn: 'Thailand', dialCode: '+66' },
  { value: 'BN', labelTh: 'บรูไน', labelEn: 'Brunei', dialCode: '+673' },
  { value: 'KH', labelTh: 'กัมพูชา', labelEn: 'Cambodia', dialCode: '+855' },
  { value: 'CN', labelTh: 'จีน', labelEn: 'China', dialCode: '+86' },
  { value: 'HK', labelTh: 'ฮ่องกง', labelEn: 'Hong Kong', dialCode: '+852' },
  { value: 'IN', labelTh: 'อินเดีย', labelEn: 'India', dialCode: '+91' },
  { value: 'ID', labelTh: 'อินโดนีเซีย', labelEn: 'Indonesia', dialCode: '+62' },
  { value: 'JP', labelTh: 'ญี่ปุ่น', labelEn: 'Japan', dialCode: '+81' },
  { value: 'LA', labelTh: 'ลาว', labelEn: 'Laos', dialCode: '+856' },
  { value: 'MY', labelTh: 'มาเลเซีย', labelEn: 'Malaysia', dialCode: '+60' },
  { value: 'MM', labelTh: 'เมียนมา', labelEn: 'Myanmar', dialCode: '+95' },
  { value: 'PH', labelTh: 'ฟิลิปปินส์', labelEn: 'Philippines', dialCode: '+63' },
  { value: 'SG', labelTh: 'สิงคโปร์', labelEn: 'Singapore', dialCode: '+65' },
  { value: 'KR', labelTh: 'เกาหลีใต้', labelEn: 'South Korea', dialCode: '+82' },
  { value: 'TW', labelTh: 'ไต้หวัน', labelEn: 'Taiwan', dialCode: '+886' },
  { value: 'VN', labelTh: 'เวียดนาม', labelEn: 'Vietnam', dialCode: '+84' },
  { value: 'AU', labelTh: 'ออสเตรเลีย', labelEn: 'Australia', dialCode: '+61' },
  { value: 'NZ', labelTh: 'นิวซีแลนด์', labelEn: 'New Zealand', dialCode: '+64' },
  { value: 'GB', labelTh: 'สหราชอาณาจักร', labelEn: 'United Kingdom', dialCode: '+44' },
  { value: 'FR', labelTh: 'ฝรั่งเศส', labelEn: 'France', dialCode: '+33' },
  { value: 'DE', labelTh: 'เยอรมนี', labelEn: 'Germany', dialCode: '+49' },
  { value: 'IT', labelTh: 'อิตาลี', labelEn: 'Italy', dialCode: '+39' },
  { value: 'RU', labelTh: 'รัสเซีย', labelEn: 'Russia', dialCode: '+7' },
  { value: 'US', labelTh: 'สหรัฐอเมริกา/แคนาดา', labelEn: 'United States / Canada', dialCode: '+1' }
]

function normalizePhoneDigits (value) {
  return String(value == null ? '' : value).replace(/\D/g, '')
}

function normalizeStudentCode (value) {
  const raw = textValue(value)
  if (!raw || raw.indexOf('@') !== -1) return ''
  const digits = raw.replace(/\D/g, '')
  return digits.length >= 4 ? digits : ''
}

function phoneDialDigits (country) {
  return normalizePhoneDigits(country && country.dialCode)
}

const ADDRESS_SOURCE_KEYS = ['homeAddress', 'currentAddress', 'workAddress']
const ADDRESS_COPY_SOURCE_KEYS = ['currentAddress', 'homeAddress']
const CERTIFICATE_ADDRESS_COPY_SOURCE_KEYS = ['currentAddress', 'homeAddress', 'workAddress']
const ADDRESS_FIELD_KEYS = ['houseNo', 'moo', 'soi', 'road', 'subdistrict', 'district', 'province', 'postalCode']
const REQUIRED_ADDRESS_FIELD_KEYS = ['houseNo', 'moo', 'subdistrict', 'district', 'province', 'postalCode']

function emptyAddress () {
  return {
    companyName: '',
    houseNo: '',
    moo: '',
    soi: '',
    road: '',
    subdistrict: '',
    district: '',
    province: '',
    postalCode: ''
  }
}

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  namePronunciation: '',
  firstNamePronunciation: '',
  lastNamePronunciation: '',
  phone: '',
  email: '',
  school: '',
  schoolEnglish: '',
  program: '',
  programEnglish: '',
  homeAddress: emptyAddress(),
  currentAddress: emptyAddress(),
  workAddress: emptyAddress(),
  certificateDeliveryMethod: '',
  certificateShippingService: '',
  certificateDeliveryAddress: emptyAddress(),
  ceremonyStatus: '',
  ceremonyAssistanceType: '',
  ceremonyStatusNote: '',
  questionnaireEmploymentStatus: '',
  questionnaireNote: '',
  hasFoodAllergy: 'no',
  foodAllergyNote: ''
}

function cloneForm () {
  return JSON.parse(JSON.stringify(EMPTY_FORM))
}

function textValue (value) {
  if (Array.isArray(value)) {
    const preferred = value.find(item => item && item.key === 'th' && item.value) ||
      value.find(item => item && item.key === 'en' && item.value) ||
      value.find(item => item && item.value)
    return preferred ? textValue(preferred.value) : ''
  }
  if (value && typeof value === 'object') {
    if (value.target && value.target.value !== undefined) return textValue(value.target.value)
    if (value.value !== undefined) return textValue(value.value)
    if (value.label !== undefined) return textValue(value.label)
    if (value.name !== undefined) return textValue(value.name)
    if (value.title !== undefined) return textValue(value.title)
  }
  const text = String(value == null ? '' : value).trim()
  return text && text !== '-' && text !== '[object Object]' ? text : ''
}

function firstText () {
  for (let index = 0; index < arguments.length; index += 1) {
    const value = textValue(arguments[index])
    if (value) return value
  }
  return ''
}

function containsThaiText (value) {
  return /[\u0E00-\u0E7F]/.test(String(value || ''))
}

function localizedNameText () {
  const thaiCandidates = []
  const englishCandidates = []
  const fallbackCandidates = []
  for (let index = 0; index < arguments.length; index += 1) {
    const value = arguments[index]
    if (Array.isArray(value)) {
      value.forEach(item => {
        const text = textValue(item && item.value !== undefined ? item.value : item)
        if (!text) return
        const key = String(item && item.key ? item.key : '').toLowerCase()
        if (key === 'th' || containsThaiText(text)) thaiCandidates.push(text)
        else if (key === 'en' || /^[A-Za-z\s.'-]+$/.test(text)) englishCandidates.push(text)
        else fallbackCandidates.push(text)
      })
      continue
    }
    const text = textValue(value)
    if (!text) return
    if (containsThaiText(text)) thaiCandidates.push(text)
    else if (/^[A-Za-z\s.'-]+$/.test(text)) englishCandidates.push(text)
    else fallbackCandidates.push(text)
  }
  return thaiCandidates[0] || englishCandidates[0] || fallbackCandidates[0] || ''
}

function normalizeProfileAddress (value) {
  const source = value && typeof value === 'object' ? value : {}
  const normalized = {
    houseNo: firstText(source.houseNo, source.houseNumber, source.no, source.address, source.addressLine1, source.line1),
    moo: firstText(source.moo, source.villageNo, source.mooNo),
    soi: firstText(source.soi, source.alley),
    road: firstText(source.road, source.street),
    subdistrict: firstText(source.subdistrict, source.subDistrict, source.subDistrictName, source.subdistrictName),
    district: firstText(source.district, source.districtName, source.amphoe),
    province: firstText(source.province, source.provinceName),
    postalCode: firstText(source.postalCode, source.zipcode, source.zipCode, source.postcode)
  }
  return Object.keys(normalized).some(key => !!normalized[key]) ? normalized : emptyAddress()
}

function firstProfileAddress () {
  for (let index = 0; index < arguments.length; index += 1) {
    const address = normalizeProfileAddress(arguments[index])
    if (Object.keys(address).some(key => !!address[key])) return address
  }
  return emptyAddress()
}

function profileAddressDefaults (profile) {
  const source = profile && typeof profile === 'object' ? profile : {}
  const userinfo = source.userinfo && typeof source.userinfo === 'object' ? source.userinfo : {}
  const snapshot = source.snapshot || userinfo.snapshot || {}
  const addresses = Array.isArray(source.address) ? source.address : []
  const userinfoAddresses = Array.isArray(userinfo.address) ? userinfo.address : []
  return {
    homeAddress: firstProfileAddress(source.homeAddress, source.registeredAddress, userinfo.homeAddress, userinfo.registeredAddress, snapshot.homeAddress, addresses[0], userinfoAddresses[0]),
    currentAddress: firstProfileAddress(source.currentAddress, source.presentAddress, userinfo.currentAddress, userinfo.presentAddress, snapshot.currentAddress, addresses[1], userinfoAddresses[1]),
    workAddress: firstProfileAddress(source.workAddress, userinfo.workAddress, snapshot.workAddress, addresses[2], userinfoAddresses[2])
  }
}

function normalizeEmailText (value) {
  const email = textValue(value).toLowerCase()
  return email && email.indexOf('@') !== -1 ? email : ''
}

function profileEmail (profile) {
  const source = profile && typeof profile === 'object' ? profile : {}
  const userinfo = source.userinfo && typeof source.userinfo === 'object' ? source.userinfo : {}
  const authen = Array.isArray(source.authen) ? source.authen : []
  const candidates = [source.email, userinfo.email, source.username]
  authen.forEach(item => {
    candidates.push(item && item.email)
    candidates.push(item && item.username)
  })
  for (let index = 0; index < candidates.length; index += 1) {
    const email = normalizeEmailText(candidates[index])
    if (email) return email
  }
  return ''
}

function profileStudentCode (profile) {
  const source = profile && typeof profile === 'object' ? profile : {}
  const userinfo = source.userinfo && typeof source.userinfo === 'object' ? source.userinfo : {}
  const lifecycle = source.lifecycle && typeof source.lifecycle === 'object' ? source.lifecycle : {}
  const hrContext = source.hrContext && typeof source.hrContext === 'object' ? source.hrContext : {}
  const candidates = [
    source.studentCode,
    source.barcodeValue,
    source.code,
    source.username,
    userinfo.studentCode,
    userinfo.code,
    lifecycle.hrSnapshot && lifecycle.hrSnapshot.personnelCode,
    hrContext.snapshot && hrContext.snapshot.personnelCode
  ]
  const authen = Array.isArray(source.authen) ? source.authen : []
  authen.forEach(item => {
    candidates.push(item && item.username)
  })
  for (let index = 0; index < candidates.length; index += 1) {
    const code = normalizeStudentCode(candidates[index])
    if (code) return code
  }
  return ''
}

function normalizeSchoolName (value) {
  const normalized = textValue(value)
  if (!normalized) return ''
  const exact = schoolKeyFor(normalized)
  if (exact) return exact
  const withoutPrefix = normalized.replace(/^สำนักวิชา/, '').trim()
  return Object.keys(THAI_SCHOOL_PROGRAMS).find(item => {
    const itemWithoutPrefix = item.replace(/^สำนักวิชา/, '').trim()
    return normalizeOptionValue(itemWithoutPrefix) === normalizeOptionValue(withoutPrefix)
  }) || normalized
}

function normalizeProgramName (school, value) {
  const normalized = textValue(value)
  if (!normalized) return ''
  const catalogSchool = SCHOOL_PROGRAM_CATALOG.find(item => schoolComparableValue(item && item.school) === schoolComparableValue(school))
  const catalogPrograms = catalogSchool && Array.isArray(catalogSchool.programs) ? catalogSchool.programs : []
  const catalogMatch = catalogPrograms.find(item => normalizeOptionValue(item && item.program) === normalizeOptionValue(normalized)) ||
    catalogPrograms.find(item => normalizeOptionValue(textValue(item && item.program).replace(/^สาขาวิชา/, '')) === normalizeOptionValue(normalized.replace(/^สาขาวิชา/, '')))
  if (catalogMatch) return textValue(catalogMatch.program)
  const schoolKey = schoolKeyFor(school)
  const programs = schoolKey ? THAI_SCHOOL_PROGRAMS[schoolKey] : []
  return programs.find(item => normalizeOptionValue(item) === normalizeOptionValue(normalized)) ||
    programs.find(item => normalizeOptionValue(item.replace(/^สาขาวิชา/, '')) === normalizeOptionValue(normalized.replace(/^สาขาวิชา/, ''))) ||
    normalized
}

function profileRegistrationDefaults (profile) {
  const source = profile && typeof profile === 'object' ? profile : {}
  const userinfo = source.userinfo && typeof source.userinfo === 'object' ? source.userinfo : {}
  const lifecycle = source.lifecycle && typeof source.lifecycle === 'object' ? source.lifecycle : {}
  const hrSnapshot = lifecycle.hrSnapshot || source.hrSnapshot || source.hrContext && source.hrContext.snapshot || {}
  const snapshot = source.snapshot || userinfo.snapshot || hrSnapshot || {}
  const school = normalizeSchoolName(firstText(
    source.school,
    source.faculty,
    source.schoolName,
    source.facultyName,
    userinfo.school,
    userinfo.faculty,
    snapshot.school,
    snapshot.faculty,
    snapshot.orgGroupName,
    snapshot.orgUnitName
  ))
  return {
    firstName: localizedNameText(source.firstName, userinfo.firstName, snapshot.firstName, source.givenName, userinfo.givenName),
    lastName: localizedNameText(source.lastName, userinfo.lastName, snapshot.lastName, source.familyName, userinfo.familyName),
    phone: firstText(source.phone, source.mobile, source.msisdn, userinfo.phone, userinfo.mobile, userinfo.msisdn),
    email: profileEmail(source),
    school,
    program: normalizeProgramName(school, firstText(
      source.program,
      source.major,
      source.programName,
      source.majorName,
      userinfo.program,
      userinfo.major,
      snapshot.program,
      snapshot.major,
      snapshot.subUnitName,
      snapshot.orgUnitName
    ))
  }
}

function isRequiredAddressValueFilled (address, field) {
  const value = textValue(address && address[field])
  if (!value) return false
  return field === 'postalCode' ? !!normalizePhoneDigits(value) : true
}

function hasMissingRequiredAddressFields (address) {
  return REQUIRED_ADDRESS_FIELD_KEYS.some(field => !isRequiredAddressValueFilled(address, field))
}

function findGraduateInitialRecord (studentCode, email) {
  const normalizedStudentCode = normalizeStudentCode(studentCode)
  const normalizedEmail = normalizeEmailText(email)
  return GRADUATE_INITIAL_CATALOG.find(item => (
    normalizedStudentCode && normalizeStudentCode(item && item.studentCode) === normalizedStudentCode
  )) || GRADUATE_INITIAL_CATALOG.find(item => (
    normalizedEmail && normalizeEmailText(item && item.email) === normalizedEmail
  )) || null
}

function graduateInitialDefaults (record) {
  if (!record) return {}
  const school = normalizeSchoolName(record.school)
  return {
    firstName: textValue(record.firstName) || textValue(record.firstNameEnglish),
    lastName: textValue(record.lastName) || textValue(record.lastNameEnglish),
    phone: textValue(record.phone),
    email: normalizeEmailText(record.email),
    school,
    schoolEnglish: textValue(record.schoolEnglish),
    program: normalizeProgramName(school, record.program),
    programEnglish: textValue(record.programEnglish),
    studentCode: normalizeStudentCode(record.studentCode)
  }
}

export default {
  name: 'GraduateSelfRegistration',
  components: {
    AddressFields: {
      props: {
        title: { type: String, required: true },
        address: { type: Object, required: true },
        readonly: { type: Boolean, default: false },
        allowEdit: { type: Boolean, default: true },
        showSameAddressControl: { type: Boolean, default: false },
        sameAddressChecked: { type: Boolean, default: false },
        sameAddressLabel: { type: String, default: '' },
        required: { type: Boolean, default: false },
        showRequiredMark: { type: Boolean, default: true },
        hideSave: { type: Boolean, default: false },
        showCompanyName: { type: Boolean, default: false },
        editLabel: { type: String, default: 'แก้ไข' },
        saveLabel: { type: String, default: 'บันทึก' },
        sourceOptions: {
          type: Array,
          default: () => []
        }
      },
      template: `
        <div class="address-block" :class="{ 'readonly-white': readonly }">
          <div class="address-subsection">
            <span>{{ title }}<span v-if="required && showRequiredMark" class="required-mark">*</span></span>
            <label
              v-if="showSameAddressControl"
              class="same-address-checkbox"
              :class="{ 'same-address-checkbox--checked': sameAddressChecked }"
            >
              <input
                type="checkbox"
                :checked="sameAddressChecked"
                @change="$emit('toggle-same-address', $event.target.checked)"
              >
              <span>{{ sameAddressLabel }}</span>
            </label>
            <CButton
              v-if="readonly && allowEdit"
              color="primary"
              variant="outline"
              size="sm"
              class="address-icon-button"
              :title="editLabel"
              :aria-label="editLabel"
              @click="$emit('edit')"
            >
              <CIcon name="cil-pencil" />
            </CButton>
          </div>
          <div v-if="sourceOptions.length" class="address-choice-buttons">
            <CButton
              v-for="option in sourceOptions"
              :key="option.value"
              type="button"
              color="primary"
              variant="outline"
              size="sm"
              class="address-choice-button"
              :disabled="readonly"
              @click="$emit('select-source', option.value)"
            >
              <CIcon name="cil-copy" class="mr-1" />
              {{ option.label }}
            </CButton>
          </div>
          <CRow class="address-grid">
            <CCol v-if="showCompanyName" md="12">
              <CInput v-model.trim="address.companyName" :label="$t('graduation.address.fields.companyName')" :readonly="readonly" :tabindex="readonly ? -1 : 0" />
            </CCol>
            <CCol md="3" :class="{ 'address-required-field': required }">
              <CInput v-model.trim="address.houseNo" :label="$t('graduation.address.fields.houseNo')" :readonly="readonly" :tabindex="readonly ? -1 : 0" />
            </CCol>
            <CCol md="3" :class="{ 'address-required-field': required }">
              <CInput v-model.trim="address.moo" :label="$t('graduation.address.fields.moo')" :readonly="readonly" :tabindex="readonly ? -1 : 0" />
            </CCol>
            <CCol md="3">
              <CInput v-model.trim="address.road" :label="$t('graduation.address.fields.road')" :readonly="readonly" :tabindex="readonly ? -1 : 0" />
            </CCol>
            <CCol md="3">
              <CInput v-model.trim="address.soi" :label="$t('graduation.address.fields.soi')" :readonly="readonly" :tabindex="readonly ? -1 : 0" />
            </CCol>
            <CCol md="3" :class="{ 'address-required-field': required }">
              <CInput v-model.trim="address.subdistrict" :label="$t('graduation.address.fields.subdistrict')" :readonly="readonly" :tabindex="readonly ? -1 : 0" />
            </CCol>
            <CCol md="3" :class="{ 'address-required-field': required }">
              <CInput v-model.trim="address.district" :label="$t('graduation.address.fields.district')" :readonly="readonly" :tabindex="readonly ? -1 : 0" />
            </CCol>
            <CCol md="3" :class="{ 'address-required-field': required }">
              <CInput v-model.trim="address.province" :label="$t('graduation.address.fields.province')" :readonly="readonly" :tabindex="readonly ? -1 : 0" />
            </CCol>
            <CCol md="3" :class="{ 'address-required-field': required }">
              <CInput
                v-model.trim="address.postalCode"
                type="tel"
                inputmode="numeric"
                pattern="[0-9]*"
                :label="$t('graduation.address.fields.postalCode')"
                :readonly="readonly"
                :tabindex="readonly ? -1 : 0"
                @keydown.native="onPostalCodeKeydown"
                @paste.native="onPostalCodePaste"
                @input="normalizePostalCode"
              />
            </CCol>
          </CRow>
          <div v-if="!readonly && !hideSave" class="address-save-row">
            <CButton
              color="success"
              variant="outline"
              size="sm"
              class="address-save-button"
              :disabled="addressSaveDisabled"
              @click="$emit('save')"
            >
              {{ saveLabel }}
            </CButton>
          </div>
        </div>
      `,
      computed: {
        addressSaveDisabled () {
          return hasMissingRequiredAddressFields(this.address)
        }
      },
      methods: {
        normalizePostalCode (value) {
          const digits = normalizePhoneDigits(optionValue(value))
          if (this.address.postalCode !== digits) {
            this.$set(this.address, 'postalCode', digits)
          }
        },
        onPostalCodeKeydown (event) {
          const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
          if (!event || allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) return
          if (!/^\d$/.test(event.key)) {
            event.preventDefault()
          }
        },
        onPostalCodePaste (event) {
          if (!event || !event.clipboardData) return
          const pastedDigits = normalizePhoneDigits(event.clipboardData.getData('text'))
          event.preventDefault()
          if (!pastedDigits) return
          const input = event.target
          const current = normalizePhoneDigits(this.address.postalCode)
          const start = input && typeof input.selectionStart === 'number' ? input.selectionStart : current.length
          const end = input && typeof input.selectionEnd === 'number' ? input.selectionEnd : start
          this.$set(this.address, 'postalCode', `${current.slice(0, start)}${pastedDigits}${current.slice(end)}`)
        }
      }
    }
  },
  data () {
    return {
      form: cloneForm(),
      phoneCountry: 'TH',
      phoneLocalNumber: '',
      lockedFields: {},
      currentAddressSameAsHome: false,
      currentAddressBeforeHomeCopy: null,
      mongoCurrentAddress: null,
      addressEditing: {
        homeAddress: false,
        currentAddress: false,
        workAddress: false,
        certificateDeliveryAddress: true
      },
      schoolProgramCatalog: SCHOOL_PROGRAM_CATALOG.slice(),
      lastRegistrationLookupEmail: '',
      loadedDraftStorageKey: '',
      currentRegistrationId: '',
      currentRegistrationBarcodeValue: '',
      savedFacePhoto: '',
      saving: false,
      foodAllergyAlertShown: false,
      validationAttempted: false
    }
  },
  computed: {
    currentProfile () {
      return this.$store && this.$store.getters ? this.$store.getters['auth/profile'] : null
    },
    authEmail () {
      return profileEmail(this.currentProfile)
    },
    authStudentCode () {
      return profileStudentCode(this.currentProfile)
    },
    graduateInitialRecord () {
      return findGraduateInitialRecord(this.authStudentCode, this.authEmail)
    },
    draftStorageKey () {
      const profile = this.currentProfile || {}
      const identity = this.authStudentCode || this.authEmail || textValue(profile._id || profile.id || profile.code || profile.username).toLowerCase() || 'anonymous'
      return `${STORAGE_KEY}:${encodeURIComponent(identity)}`
    },
    localizedYesNoOptions () {
      return [
        { label: this.$t('graduation.options.no'), value: 'no' },
        { label: this.$t('graduation.options.yes'), value: 'yes' }
      ]
    },
    phoneCountryOptions () {
      return PHONE_COUNTRY_OPTIONS.map(item => ({
        label: `${this.isEnglishLocale ? item.labelEn : item.labelTh} (${item.dialCode})`,
        value: item.value
      }))
    },
    selectedPhoneCountry () {
      return PHONE_COUNTRY_OPTIONS.find(item => item.value === this.phoneCountry) || PHONE_COUNTRY_OPTIONS[0]
    },
    phoneDialCode () {
      return this.selectedPhoneCountry.dialCode
    },
    composedPhone () {
      const localNumber = normalizePhoneDigits(this.phoneLocalNumber)
      return localNumber ? `${this.phoneDialCode} ${localNumber}` : ''
    },
    fullName () {
      return [this.form.firstName, this.form.lastName].filter(Boolean).join(' ')
    },
    namePronunciation () {
      return [this.form.firstNamePronunciation, this.form.lastNamePronunciation].filter(Boolean).join(' ')
    },
    isEnglishLocale () {
      return String((this.$i18n && this.$i18n.locale) || '').toLowerCase().startsWith('en')
    },
    facePanelTitle () {
      return this.isEnglishLocale ? 'Facial registration' : 'รูปใบหน้าสำหรับลงทะเบียน'
    },
    facePanelSubtitle () {
      return this.isEnglishLocale ? 'Your latest saved photo' : 'แสดงภาพล่าสุดที่บันทึกในระบบ'
    },
    facePhotoAlt () {
      return this.isEnglishLocale ? 'Registered face' : 'รูปใบหน้าที่ลงทะเบียน'
    },
    faceSavedLabel () {
      return this.isEnglishLocale ? 'Photo saved' : 'บันทึกภาพแล้ว'
    },
    faceNotSavedLabel () {
      return this.isEnglishLocale ? 'No face photo yet' : 'ยังไม่มีรูปใบหน้า'
    },
    faceNotSavedHint () {
      return this.isEnglishLocale ? 'The photo will appear here after facial registration.' : 'รูปจะแสดงที่นี่หลังลงทะเบียนใบหน้าสำเร็จ'
    },
    registrationStepLabel () {
      const total = graduationStepTotal(getGraduationProgress(this.currentProfile))
      return this.isEnglishLocale ? `Step 2 of ${total}` : `ขั้นตอนที่ 2 จาก ${total}`
    },
    addressGroupTitle () {
      return this.isEnglishLocale ? 'Address information' : 'ข้อมูลที่อยู่'
    },
    currentAddressSameAsHomeLabel () {
      return this.isEnglishLocale
        ? 'Use the registered address as the current address'
        : 'ใช้ที่อยู่ตามทะเบียนบ้านเป็นที่อยู่ปัจจุบัน'
    },
    addressEditLabel () {
      return this.isEnglishLocale ? 'Edit' : 'แก้ไข'
    },
    addressSaveLabel () {
      return this.isEnglishLocale ? 'Save' : 'บันทึก'
    },
    questionnaireSampleTitle () {
      return this.isEnglishLocale ? 'Questionnaire' : 'แบบสอบถาม'
    },
    questionnaireSampleQuestion () {
      return this.isEnglishLocale ? 'Current employment status' : 'สถานะการทำงานปัจจุบัน'
    },
    questionnaireSampleNoteLabel () {
      return this.isEnglishLocale ? 'Additional note' : 'หมายเหตุเพิ่มเติม'
    },
    questionnaireSampleOptions () {
      return [
        { label: this.isEnglishLocale ? 'Please specify' : 'กรุณาระบุ', value: '' },
        { label: this.isEnglishLocale ? 'Employed' : 'ทำงานแล้ว', value: 'employed' },
        { label: this.isEnglishLocale ? 'Not employed yet' : 'ยังไม่ได้ทำงาน', value: 'not-employed' },
        { label: this.isEnglishLocale ? 'Continuing study' : 'ศึกษาต่อ', value: 'study' }
      ]
    },
    ceremonyStatusSelectLabel () {
      return this.isEnglishLocale ? 'Select status' : 'เลือกสถานะ'
    },
    foodAllergyHelpText () {
      return this.isEnglishLocale
        ? 'Please specify food allergies or precautions for meal preparation.'
        : 'กรุณาระบุอาหารที่แพ้หรือข้อควรระวังสำหรับการจัดอาหาร'
    },
    summarySchool () {
      if (this.isEnglishLocale && textValue(this.form.schoolEnglish)) {
        return textValue(this.form.schoolEnglish)
      }
      return this.localizedSchoolName(this.form.school)
    },
    summaryProgram () {
      if (this.isEnglishLocale) {
        const catalogProgram = this.findCatalogProgram(this.form.school, this.form.program)
        const catalogEnglish = textValue(catalogProgram && (catalogProgram.programEnglish || catalogProgram.labelEn))
        if (catalogEnglish) return catalogEnglish
        if (textValue(this.form.programEnglish)) return textValue(this.form.programEnglish)
      }
      return this.localizedProgramName(this.form.program)
    },
    foodAllergySummaryLabel () {
      const normalized = normalizeYesNo(this.form.hasFoodAllergy)
      if (normalized === 'yes') return this.$t('graduation.options.yes')
      if (normalized === 'no') return this.$t('graduation.options.no')
      return '-'
    },
    barcodeValue () {
      const base = [this.form.firstName, this.form.lastName, this.form.phone]
        .join('-')
        .replace(/\s+/g, '')
        .toUpperCase()
      return `GRAD-${base || 'PENDING'}`
    },
    schoolOptions () {
      const catalogSchools = this.schoolProgramCatalog.slice()
      const fallbackSchools = catalogSchools.length ? [] : Object.keys(THAI_SCHOOL_PROGRAMS)
        .map(item => ({ school: item, labelTh: item, labelEn: item }))
      const schools = [...catalogSchools, ...fallbackSchools]
      return [
        { label: this.isEnglishLocale ? 'Please specify' : 'กรุณาระบุ', value: '' },
        ...schools
          .sort((left, right) => localizedCatalogLabel(left, left && left.school, this.isEnglishLocale).localeCompare(localizedCatalogLabel(right, right && right.school, this.isEnglishLocale), this.isEnglishLocale ? 'en' : 'th'))
          .map(item => ({
            label: localizedCatalogLabel(item, item && item.school, this.isEnglishLocale),
            value: textValue(item && item.school)
          }))
      ]
    },
    programOptions () {
      const selectedSchoolKey = schoolComparableValue(this.form.school)
      const catalogItem = this.schoolProgramCatalog.find(item => (
        schoolComparableValue(item && item.school) === selectedSchoolKey
      ))
      const schoolKey = schoolKeyFor(this.form.school)
      const catalogPrograms = catalogItem && Array.isArray(catalogItem.programs) ? catalogItem.programs : []
      const fallbackPrograms = (catalogPrograms.length || this.schoolProgramCatalog.length) ? [] : (schoolKey ? THAI_SCHOOL_PROGRAMS[schoolKey].map(item => ({ program: item, labelTh: item, labelEn: item })) : [])
      const programs = [...catalogPrograms, ...fallbackPrograms]
      return [
        { label: this.isEnglishLocale ? 'Please specify' : 'กรุณาระบุ', value: '' },
        ...programs
          .sort((left, right) => localizedCatalogLabel(left, left && left.program, this.isEnglishLocale).localeCompare(localizedCatalogLabel(right, right && right.program, this.isEnglishLocale), this.isEnglishLocale ? 'en' : 'th'))
          .map(item => ({
            label: localizedCatalogLabel(item, item && item.program, this.isEnglishLocale),
            value: textValue(item && item.program)
          }))
      ]
    },
    programSelectKey () {
      return `program-${normalizeOptionValue(this.form.school)}`
    },
    ceremonyStatusOptions () {
      return [
        { label: this.isEnglishLocale ? 'Please specify' : 'กรุณาระบุ', value: '' },
        ...CEREMONY_STATUS_OPTIONS.map(item => ({
          label: `${item.value} - ${this.$t(`graduation.ceremonyStatus.${item.key}`)}`,
          value: item.value
        }))
      ]
    },
    ceremonyStatusLabel () {
      const ceremonyStatus = normalizeCeremonyStatus(this.form.ceremonyStatus)
      const selected = CEREMONY_STATUS_OPTIONS.find(item => item.value === ceremonyStatus)
      if (!selected) return '-'
      const selectedLabel = `${selected.value} - ${this.$t(`graduation.ceremonyStatus.${selected.key}`)}`
      if (!isAssistanceCeremonyStatus(ceremonyStatus)) return selectedLabel
      return this.ceremonyAssistanceTypeLabel === '-'
        ? selectedLabel
        : `${selectedLabel} / ${this.ceremonyAssistanceTypeLabel}`
    },
    ceremonyAssistanceTypeOptions () {
      return [
        { label: this.isEnglishLocale ? 'Please specify' : 'กรุณาระบุ', value: '' },
        ...CEREMONY_ASSISTANCE_TYPE_OPTIONS.map(item => ({
          label: `${item.value} - ${this.$t(`graduation.assistanceType.${item.key}`)}`,
          value: item.value
        }))
      ]
    },
    ceremonyAssistanceTypeLabel () {
      const ceremonyAssistanceType = normalizeCode(this.form.ceremonyAssistanceType)
      const selected = CEREMONY_ASSISTANCE_TYPE_OPTIONS.find(item => item.value === ceremonyAssistanceType)
      return selected ? `${selected.value} - ${this.$t(`graduation.assistanceType.${selected.key}`)}` : '-'
    },
    requiresAssistanceType () {
      return isAssistanceCeremonyStatus(this.form.ceremonyStatus)
    },
    ceremonyAssistanceSelectKey () {
      return `ceremony-assistance-${normalizeCeremonyStatus(this.form.ceremonyStatus)}`
    },
    ceremonyStatusRequiresNote () {
      return CEREMONY_STATUS_REQUIRES_NOTE.includes(normalizeCeremonyStatus(this.form.ceremonyStatus)) ||
        CEREMONY_ASSISTANCE_REQUIRES_NOTE.includes(normalizeCode(this.form.ceremonyAssistanceType))
    },
    requiresCertificateDelivery () {
      return ['50', '60'].includes(normalizeCeremonyStatus(this.form.ceremonyStatus))
    },
    requiresFaceCheckIn () {
      return FACE_CHECKIN_CEREMONY_STATUS_CODES.includes(normalizeCeremonyStatus(this.form.ceremonyStatus))
    },
    requiresCertificateShipping () {
      return this.requiresCertificateDelivery && this.form.certificateDeliveryMethod === 'postal'
    },
    certificateDeliveryMethodOptions () {
      return [
        { label: this.isEnglishLocale ? 'Please specify' : 'กรุณาระบุ', value: '' },
        { label: this.$t('graduation.certificate.pickup'), value: 'pickup' },
        { label: this.$t('graduation.certificate.postal'), value: 'postal' }
      ]
    },
    certificateShippingRates () {
      return CERTIFICATE_SHIPPING_SERVICE_OPTIONS.map(item => ({
        value: item.value,
        label: this.$t(`graduation.certificate.shipping.${item.value}.label`),
        description: this.$t(`graduation.certificate.shipping.${item.value}.description`),
        fee: this.shippingFeeLabel(item.fee)
      }))
    },
    requiredCompleted () {
      const requiredFields = ['firstName', 'lastName', 'firstNamePronunciation', 'lastNamePronunciation', 'phone', 'school', 'program']
      let completed = requiredFields.filter(key => !!meaningfulOptionValue(this.form[key])).length
      if (this.requiresAssistanceType && meaningfulOptionValue(this.form.ceremonyAssistanceType)) completed += 1
      if (this.requiresCertificateDelivery && meaningfulOptionValue(this.form.certificateDeliveryMethod)) completed += 1
      if (this.requiresCertificateShipping && meaningfulOptionValue(this.form.certificateShippingService)) completed += 1
      if (this.requiresCertificateShipping && this.hasAnyAddressValue(this.form.certificateDeliveryAddress)) completed += 1
      if (this.requiresFoodAllergyNote && this.isValidFoodAllergyNote(this.form.foodAllergyNote)) completed += 1
      return completed
    },
    completionPercent () {
      let requiredTotal = 7
      if (this.requiresAssistanceType) requiredTotal += 1
      if (this.requiresCertificateDelivery) requiredTotal += 1
      if (this.requiresCertificateShipping) requiredTotal += 2
      if (this.requiresFoodAllergyNote) requiredTotal += 1
      return Math.round((this.requiredCompleted / requiredTotal) * 100)
    },
    completionLabel () {
      if (this.completionPercent >= 100) return this.$t('graduation.completion.complete')
      if (this.completionPercent >= 70) return this.$t('graduation.completion.nearly')
      return this.$t('graduation.completion.incomplete')
    },
    completionColor () {
      if (this.completionPercent >= 100) return 'success'
      if (this.completionPercent >= 70) return 'warning'
      return 'secondary'
    },
    foodAllergyNoteInvalid () {
      return this.requiresFoodAllergyNote && !this.isValidFoodAllergyNote(this.form.foodAllergyNote)
    },
    requiresFoodAllergyNote () {
      return normalizeYesNo(this.form.hasFoodAllergy) === 'yes'
    },
    foodAllergyNoteDisabled () {
      return !this.requiresFoodAllergyNote
    },
    addressFieldsInvalid () {
      return ['homeAddress', 'currentAddress'].some(addressKey => this.hasMissingRequiredAddressFields(this.form[addressKey])) ||
        (this.requiresCertificateShipping && this.hasMissingRequiredAddressFields(this.form.certificateDeliveryAddress))
    },
    saveButtonDisabled () {
      return this.saving || this.addressFieldsInvalid || Object.keys(this.validationErrors).length > 0 || this.foodAllergyNoteInvalid
    },
    validationErrors () {
      const requiredMessage = this.$t('graduation.messages.requiredField')
      const errors = {}
      ;['firstName', 'lastName', 'firstNamePronunciation', 'lastNamePronunciation', 'phone', 'school', 'program']
        .forEach(field => {
          if (!meaningfulOptionValue(this.form[field])) {
            errors[field] = requiredMessage
          }
        })
      return errors
    }
  },
  mounted () {
    this.restoreDraft()
    this.applyProfileDefaults()
    this.fetchRegistrationOptions()
    this.fetchRegistrationDefaults()
  },
  watch: {
    'form.homeAddress': {
      handler () {
        if (!this.currentAddressSameAsHome) return
        this.copyHomeAddressToCurrent()
      },
      deep: true
    },
    currentProfile: {
      handler () {
        this.restoreDraft()
        this.applyProfileDefaults()
        this.lastRegistrationLookupEmail = ''
        this.fetchRegistrationDefaults()
      },
      deep: true
    },
    phoneCountry () {
      this.syncPhoneFromParts()
    },
    phoneLocalNumber (next) {
      const normalized = normalizePhoneDigits(next)
      if (next !== normalized) {
        this.phoneLocalNumber = normalized
        return
      }
      this.syncPhoneFromParts()
    },
    'form.school' (next) {
      const normalizedSchool = schoolKeyFor(next) || optionValue(next)
      if (next !== normalizedSchool) {
        this.form.school = normalizedSchool
      }
      this.syncCatalogLanguageFields()
    },
    'form.program' (next) {
      const normalizedProgram = textValue(next)
      if (next !== normalizedProgram) {
        this.form.program = normalizedProgram
      }
      this.syncCatalogLanguageFields()
    },
    'form.ceremonyStatus' (next) {
      const normalized = normalizeCeremonyStatus(next)
      if (next !== normalized) {
        this.form.ceremonyStatus = normalized
        return
      }
      if (!this.requiresAssistanceType) {
        this.form.ceremonyAssistanceType = ''
      }
      if (!this.ceremonyStatusRequiresNote) {
        this.form.ceremonyStatusNote = ''
      }
      if (!this.requiresCertificateDelivery) {
        this.clearCertificateDelivery()
      }
    },
    'form.ceremonyAssistanceType' () {
      if (!this.ceremonyStatusRequiresNote) {
        this.form.ceremonyStatusNote = ''
      }
    },
    'form.hasFoodAllergy' (next) {
      if (next !== 'yes') {
        this.form.foodAllergyNote = ''
        this.foodAllergyAlertShown = false
      }
    },
    'form.foodAllergyNote' () {
      if (!this.foodAllergyNoteInvalid) {
        this.foodAllergyAlertShown = false
      }
    },
    'form.questionnaireEmploymentStatus' () {
      this.persistLocalDraft()
    },
    'form.questionnaireNote' () {
      this.persistLocalDraft()
    },
    'form.certificateDeliveryMethod' (next) {
      if (next !== 'postal') {
        this.form.certificateShippingService = ''
        this.form.certificateDeliveryAddress = emptyAddress()
        this.$set(this.addressEditing, 'certificateDeliveryAddress', true)
        return
      }
      this.applyDefaultCertificateDeliveryAddress(true)
    }
  },
  methods: {
    copyHomeAddressToCurrent () {
      this.$set(this.form, 'currentAddress', Object.assign(emptyAddress(), this.normalizedAddress(this.form.homeAddress)))
    },
    toggleCurrentAddressSameAsHome (checked) {
      const nextChecked = !!checked
      if (nextChecked && !this.currentAddressSameAsHome) {
        this.currentAddressBeforeHomeCopy = Object.assign(emptyAddress(), this.normalizedAddress(this.form.currentAddress))
      }
      this.currentAddressSameAsHome = nextChecked
      if (nextChecked) {
        this.copyHomeAddressToCurrent()
      } else {
        const addressToRestore = this.currentAddressBeforeHomeCopy ||
          (this.hasAnyAddressValue(this.mongoCurrentAddress) ? this.mongoCurrentAddress : null)
        if (addressToRestore) {
          this.$set(this.form, 'currentAddress', Object.assign(emptyAddress(), addressToRestore))
        }
        this.currentAddressBeforeHomeCopy = null
      }
      this.persistLocalDraft()
    },
    isLockedField (field) {
      if (field === 'firstName' || field === 'lastName') return true
      return !!(this.lockedFields && this.lockedFields[field])
    },
    applyFixedGraduateName () {
      const initialDefaults = graduateInitialDefaults(this.graduateInitialRecord)
      if (initialDefaults.firstName || initialDefaults.lastName) {
        this.form.firstName = initialDefaults.firstName || ''
        this.form.lastName = initialDefaults.lastName || ''
        this.currentRegistrationBarcodeValue = initialDefaults.studentCode || this.currentRegistrationBarcodeValue
        this.$set(this.lockedFields, 'firstName', 'profile')
        this.$set(this.lockedFields, 'lastName', 'profile')
        return
      }
      this.$set(this.lockedFields, 'firstName', 'profile')
      this.$set(this.lockedFields, 'lastName', 'profile')
    },
    onPronunciationKeydown (field, event) {
      if (!event || (event.key !== ' ' && event.code !== 'Space')) return
      event.preventDefault()
      const input = event.target
      const current = input && typeof input.value === 'string'
        ? input.value
        : String(this.form[field] || '')
      const start = input && typeof input.selectionStart === 'number' ? input.selectionStart : current.length
      const end = input && typeof input.selectionEnd === 'number' ? input.selectionEnd : start
      const nextValue = `${current.slice(0, start)}-${current.slice(end)}`
      this.form[field] = nextValue
      this.$nextTick(() => {
        if (input && input.setSelectionRange) {
          input.setSelectionRange(start + 1, start + 1)
        }
      })
    },
    onPhoneCountryInput (value) {
      const selectedValue = optionValue(value)
      const selected = PHONE_COUNTRY_OPTIONS.find(item => item.value === selectedValue)
      this.phoneCountry = selected ? selected.value : 'TH'
      this.syncPhoneFromParts()
    },
    onPhoneNumberKeydown (event) {
      const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
      if (!event || allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) return
      if (!/^\d$/.test(event.key)) {
        event.preventDefault()
      }
    },
    onPhoneNumberPaste (event) {
      if (!event || !event.clipboardData) return
      const pastedDigits = normalizePhoneDigits(event.clipboardData.getData('text'))
      event.preventDefault()
      if (!pastedDigits) return
      const input = event.target
      const current = String(this.phoneLocalNumber || '')
      const start = input && typeof input.selectionStart === 'number' ? input.selectionStart : current.length
      const end = input && typeof input.selectionEnd === 'number' ? input.selectionEnd : start
      this.phoneLocalNumber = `${current.slice(0, start)}${pastedDigits}${current.slice(end)}`
      this.$nextTick(() => {
        if (input && input.setSelectionRange) {
          const cursor = start + pastedDigits.length
          input.setSelectionRange(cursor, cursor)
        }
      })
    },
    syncPhoneFromParts () {
      this.form.phone = this.composedPhone
    },
    syncPhonePartsFromPhone (value) {
      const raw = String(value == null ? '' : value).trim()
      const compactRaw = raw.replace(/\s+/g, '')
      const digits = normalizePhoneDigits(raw)
      const matchedCountry = PHONE_COUNTRY_OPTIONS.find(country => {
        const dialDigits = phoneDialDigits(country)
        return compactRaw.startsWith(country.dialCode) || (digits && digits.startsWith(dialDigits))
      }) || PHONE_COUNTRY_OPTIONS[0]
      let localNumber = digits
      const matchedDialDigits = phoneDialDigits(matchedCountry)
      if (localNumber.startsWith(matchedDialDigits)) {
        localNumber = localNumber.slice(matchedDialDigits.length)
      }
      this.phoneCountry = matchedCountry.value
      this.phoneLocalNumber = localNumber
      this.syncPhoneFromParts()
    },
    isAddressReadonly (addressKey) {
      return !this.addressEditing[addressKey]
    },
    enableAddressEdit (addressKey) {
      this.$set(this.addressEditing, addressKey, true)
    },
    saveAddressEdit (addressKey) {
      if (this.hasMissingRequiredAddressFields(this.form[addressKey])) return
      this.prepareAddressForSave(addressKey)
      this.$set(this.addressEditing, addressKey, false)
      this.persistLocalDraft()
    },
    resetAddressEditing () {
      this.addressEditing = {
        homeAddress: false,
        currentAddress: false,
        workAddress: false,
        certificateDeliveryAddress: false
      }
    },
    normalizedAddress (address) {
      const normalized = emptyAddress()
      Object.keys(normalized).forEach(field => {
        normalized[field] = textValue(address && address[field])
      })
      return normalized
    },
    addressesMatch (left, right) {
      const normalizedLeft = this.normalizedAddress(left)
      const normalizedRight = this.normalizedAddress(right)
      return ADDRESS_FIELD_KEYS.every(field => normalizedLeft[field] === normalizedRight[field])
    },
    hasMissingRequiredAddressFields (address) {
      return hasMissingRequiredAddressFields(address)
    },
    addressValueForSave (address, field) {
      const raw = String(address && address[field] != null ? address[field] : '').trim()
      if (!raw) return '-'
      if (field !== 'postalCode' || raw === '-') return raw
      return normalizePhoneDigits(raw) || '-'
    },
    addressWithSaveDefaults (address) {
      const normalized = emptyAddress()
      normalized.companyName = textValue(address && address.companyName)
      ADDRESS_FIELD_KEYS.forEach(field => {
        normalized[field] = this.addressValueForSave(address, field)
      })
      return normalized
    },
    prepareAddressForSave (addressKey) {
      if (!this.form[addressKey]) return
      if (addressKey === 'workAddress') {
        this.$set(this.form, addressKey, this.normalizedAddress(this.form[addressKey]))
        return
      }
      this.$set(this.form, addressKey, this.addressWithSaveDefaults(this.form[addressKey]))
    },
    prepareAddressFieldsForSave () {
      ADDRESS_SOURCE_KEYS.forEach(addressKey => this.prepareAddressForSave(addressKey))
      if (this.requiresCertificateShipping) {
        this.prepareAddressForSave('certificateDeliveryAddress')
      }
    },
    addressTitle (addressKey) {
      const titles = {
        homeAddress: this.$t('graduation.address.home'),
        currentAddress: this.$t('graduation.address.current'),
        workAddress: this.$t('graduation.address.work')
      }
      return titles[addressKey] || ''
    },
    addressSourceOptions (targetKey) {
      const sourceKeys = targetKey === 'certificateDeliveryAddress'
        ? CERTIFICATE_ADDRESS_COPY_SOURCE_KEYS
        : ADDRESS_COPY_SOURCE_KEYS
      const sourceOptions = sourceKeys
        .filter(addressKey => addressKey !== targetKey && this.hasAnyAddressValue(this.form[addressKey]))
        .map(addressKey => ({
          value: addressKey,
          label: this.isEnglishLocale
            ? `Use ${this.addressTitle(addressKey)}`
            : `ใช้${this.addressTitle(addressKey)}`
        }))
      return [
        ...sourceOptions
      ]
    },
    onAddressSourceSelect (targetKey, value) {
      const selected = optionValue(value)
      if (!selected) return
      if (selected === 'manual') {
        if (Object.prototype.hasOwnProperty.call(this.addressEditing, targetKey)) {
          this.enableAddressEdit(targetKey)
        }
        return
      }
      this.copyAddressTo(targetKey, selected)
    },
    copyAddressTo (targetKey, sourceKey) {
      if (!targetKey || !sourceKey || targetKey === sourceKey) return
      const address = this.normalizedAddress(this.form[sourceKey])
      if (!this.hasAnyAddressValue(address)) return
      this.$set(this.form, targetKey, Object.assign(emptyAddress(), address))
      if (Object.prototype.hasOwnProperty.call(this.addressEditing, targetKey)) {
        this.$set(this.addressEditing, targetKey, true)
      }
    },
    applyDefaultCertificateDeliveryAddress (force = false) {
      if (this.form.certificateDeliveryMethod !== 'postal') return
      const currentAddress = this.normalizedAddress(this.form.currentAddress)
      if (!this.hasAnyAddressValue(currentAddress)) return
      if (!force && this.hasAnyAddressValue(this.form.certificateDeliveryAddress)) return
      this.$set(this.form, 'certificateDeliveryAddress', Object.assign(emptyAddress(), currentAddress))
      this.$set(this.addressEditing, 'certificateDeliveryAddress', false)
    },
    applyAddressDefaults (registration) {
      const addressKeys = ['homeAddress', 'currentAddress', 'workAddress']
      addressKeys.forEach(addressKey => {
        const source = registration && (registration[addressKey] || (addressKey === 'homeAddress' ? registration.address : null))
        const address = this.normalizedAddress(source)
        if (!this.hasAnyAddressValue(address)) return
        this.form[addressKey] = address
        this.$set(this.addressEditing, addressKey, false)
      })
    },
    applyProfileAddressDefaults () {
      const defaults = profileAddressDefaults(this.currentProfile)
      ADDRESS_SOURCE_KEYS.forEach(addressKey => {
        const address = this.normalizedAddress(defaults[addressKey])
        if (!this.hasAnyAddressValue(address) || this.hasAnyAddressValue(this.form[addressKey])) return
        this.$set(this.form, addressKey, address)
        this.$set(this.addressEditing, addressKey, false)
      })
      this.applyDefaultCertificateDeliveryAddress(false)
    },
    registrationSearchTerms () {
      const studentCode = this.authStudentCode || normalizeStudentCode(this.currentRegistrationBarcodeValue)
      if (studentCode) return [studentCode]
      const email = this.authEmail || normalizeEmailText(this.form.email)
      if (email) return [email]
      return []
    },
    findCatalogSchool (school) {
      const key = schoolComparableValue(school)
      return this.schoolProgramCatalog.find(item => schoolComparableValue(item && item.school) === key) || null
    },
    findCatalogProgram (school, program) {
      const schoolItem = this.findCatalogSchool(school)
      const programs = schoolItem && Array.isArray(schoolItem.programs) ? schoolItem.programs : []
      const key = normalizeOptionValue(program)
      return programs.find(item => normalizeOptionValue(item && item.program) === key) || null
    },
    localizedSchoolName (school) {
      const item = this.findCatalogSchool(school)
      return localizedCatalogLabel(item, school, this.isEnglishLocale)
    },
    localizedProgramName (program) {
      const item = this.findCatalogProgram(this.form.school, program)
      return localizedCatalogLabel(item, program, this.isEnglishLocale)
    },
    syncCatalogLanguageFields () {
      const schoolItem = this.findCatalogSchool(this.form.school)
      const programItem = this.findCatalogProgram(this.form.school, this.form.program)
      this.form.schoolEnglish = textValue(schoolItem && (schoolItem.schoolEnglish || schoolItem.labelEn)) || textValue(this.form.schoolEnglish)
      this.form.programEnglish = textValue(programItem && (programItem.programEnglish || programItem.labelEn)) || textValue(this.form.programEnglish)
    },
    async fetchRegistrationOptions () {
      this.schoolProgramCatalog = SCHOOL_PROGRAM_CATALOG.slice()
      this.syncCatalogLanguageFields()
    },
    mergeSchoolProgramCatalog () {
      const merged = []
      Array.prototype.slice.call(arguments).forEach(source => {
        const schools = Array.isArray(source) ? source : []
        schools.forEach(item => {
          const school = textValue(item && item.school)
          if (!school) return
          let target = merged.find(existing => schoolComparableValue(existing.school) === schoolComparableValue(school))
          if (!target) {
            target = Object.assign({}, item, { programs: [] })
            merged.push(target)
          }
          const programs = Array.isArray(item && item.programs) ? item.programs : []
          programs.forEach(program => {
            const programName = textValue(program && program.program)
            if (!programName) return
            if (!target.programs.some(existing => normalizeOptionValue(existing.program) === normalizeOptionValue(programName))) {
              target.programs.push(Object.assign({}, program, { program: programName }))
            }
          })
        })
      })
      return merged
    },
    applyRegistrationDefaults (registration) {
      const school = textValue(registration && registration.school) || normalizeSchoolName(registration && registration.school)
      this.currentRegistrationId = textValue(registration && (registration._id || registration.id))
      this.currentRegistrationBarcodeValue = textValue(registration && registration.barcodeValue)
      this.savedFacePhoto = textValue(registration && registration.facePhoto)
      this.mongoCurrentAddress = this.normalizedAddress(registration && registration.currentAddress)
      this.currentAddressSameAsHome = registration && registration.currentAddressSameAsHome === true
      this.currentAddressBeforeHomeCopy = registration && this.hasAnyAddressValue(registration.currentAddressBeforeHomeCopy)
        ? this.normalizedAddress(registration.currentAddressBeforeHomeCopy)
        : null
      this.applyDefaults({
        firstName: textValue(registration && registration.firstName),
        lastName: textValue(registration && registration.lastName),
        phone: textValue(registration && registration.phone),
        email: textValue(registration && registration.email),
        school,
        schoolEnglish: textValue(registration && registration.schoolEnglish),
        program: normalizeProgramName(school, registration && registration.program),
        programEnglish: textValue(registration && registration.programEnglish),
        questionnaireEmploymentStatus: meaningfulOptionValue(registration && registration.questionnaireEmploymentStatus),
        questionnaireNote: textValue(registration && registration.questionnaireNote)
      }, { source: 'registration' })
      this.form.questionnaireEmploymentStatus = meaningfulOptionValue(registration && registration.questionnaireEmploymentStatus)
      this.form.questionnaireNote = textValue(registration && registration.questionnaireNote)
      this.applyAddressDefaults(registration)
      if (this.currentAddressSameAsHome) {
        this.copyHomeAddressToCurrent()
      }
      this.applyFixedGraduateName()
    },
    applyDefaults (defaults, options = {}) {
      const source = options.source || 'profile'
      ;['firstName', 'lastName', 'phone', 'email'].forEach(field => {
        if (['firstName', 'lastName'].includes(field) && source === 'profile' && this.lockedFields[field] && this.lockedFields[field] !== 'profile') {
          return
        }
        if (defaults[field]) {
          this.form[field] = defaults[field]
          this.$set(this.lockedFields, field, source)
        } else {
          if (source === 'profile' && field !== 'firstName' && field !== 'lastName') {
            this.$delete(this.lockedFields, field)
          }
          if (!textValue(this.form[field])) {
            this.form[field] = ''
          }
        }
      })
      this.syncPhonePartsFromPhone(this.form.phone)
      if (defaults.school) {
        this.form.school = defaults.school
        this.form.schoolEnglish = defaults.schoolEnglish || ''
        this.$set(this.lockedFields, 'school', source)
      } else if (!textValue(this.form.school)) {
        this.form.school = ''
        this.form.schoolEnglish = ''
        this.$delete(this.lockedFields, 'school')
      }
      if (defaults.program) {
        this.form.program = defaults.program
        this.form.programEnglish = defaults.programEnglish || ''
        this.$set(this.lockedFields, 'program', source)
      } else if (!textValue(this.form.program)) {
        this.form.program = ''
        this.form.programEnglish = ''
        this.$delete(this.lockedFields, 'program')
      }
    },
    applyProfileDefaults () {
      const defaults = Object.assign(
        {},
        profileRegistrationDefaults(this.currentProfile),
        graduateInitialDefaults(this.graduateInitialRecord)
      )
      this.lockedFields = {}
      this.applyDefaults(defaults, { source: 'profile' })
      this.applyProfileAddressDefaults()
      this.applyFixedGraduateName()
    },
    async fetchRegistrationDefaults () {
      const studentCode = this.authStudentCode || normalizeStudentCode(this.currentRegistrationBarcodeValue)
      const authEmail = this.authEmail || normalizeEmailText(this.form.email)
      const searchTerms = this.registrationSearchTerms()
      const lookupKey = studentCode || authEmail || searchTerms.join('|') || 'auth-account'
      if (this.lastRegistrationLookupEmail === lookupKey) return
      this.lastRegistrationLookupEmail = lookupKey
      try {
        const defaultResponse = await api.graduateRegistrations('defaults')
        const defaultRow = defaultResponse && defaultResponse.data ? defaultResponse.data.data : null
        if (defaultRow) {
          this.applyRegistrationDefaults(defaultRow)
          return
        }
        if (!searchTerms.length) return
      } catch (error) {
        // Users can still fill missing fields manually when registry lookup is unavailable.
      }
    },
    onSchoolInput (value) {
      const normalizedSchool = schoolKeyFor(value) || optionValue(value)
      if (this.form.school !== normalizedSchool) {
        this.form.school = normalizedSchool
      }
      const schoolItem = this.findCatalogSchool(normalizedSchool)
      this.form.schoolEnglish = textValue(schoolItem && (schoolItem.schoolEnglish || schoolItem.labelEn))
      this.form.program = ''
      this.form.programEnglish = ''
    },
    onProgramInput (value) {
      const normalizedProgram = textValue(value)
      if (this.form.program !== normalizedProgram) {
        this.form.program = normalizedProgram
      }
      const programItem = this.findCatalogProgram(this.form.school, normalizedProgram)
      this.form.programEnglish = textValue(programItem && (programItem.programEnglish || programItem.labelEn))
    },
    onCeremonyStatusInput (value) {
      const ceremonyStatus = normalizeCeremonyStatus(value)
      if (this.form.ceremonyStatus !== ceremonyStatus) {
        this.form.ceremonyStatus = ceremonyStatus
      }
      if (!isAssistanceCeremonyStatus(ceremonyStatus)) {
        this.form.ceremonyAssistanceType = ''
      }
      if (!this.ceremonyStatusRequiresNote) {
        this.form.ceremonyStatusNote = ''
      }
    },
    onCeremonyAssistanceTypeInput (value) {
      const assistanceType = normalizeCode(value)
      if (this.form.ceremonyAssistanceType !== assistanceType) {
        this.form.ceremonyAssistanceType = assistanceType
      }
      if (!this.ceremonyStatusRequiresNote) {
        this.form.ceremonyStatusNote = ''
      }
    },
    onCertificateDeliveryMethodInput (value) {
      const method = optionValue(value)
      if (this.form.certificateDeliveryMethod !== method) {
        this.form.certificateDeliveryMethod = method
      }
      if (method !== 'postal') {
        this.form.certificateShippingService = ''
        this.form.certificateDeliveryAddress = emptyAddress()
        this.$set(this.addressEditing, 'certificateDeliveryAddress', true)
        return
      }
      this.applyDefaultCertificateDeliveryAddress(true)
    },
    selectCertificateShippingService (value) {
      this.form.certificateShippingService = optionValue(value)
    },
    clearCertificateDelivery () {
      this.form.certificateDeliveryMethod = ''
      this.form.certificateShippingService = ''
      this.form.certificateDeliveryAddress = emptyAddress()
    },
    onFoodAllergyInput (value) {
      const normalized = normalizeYesNo(value)
      if (this.form.hasFoodAllergy !== normalized) {
        this.form.hasFoodAllergy = normalized
      }
      if (normalized !== 'yes') {
        this.form.foodAllergyNote = ''
        this.foodAllergyAlertShown = false
        return
      }
    },
    isValidFoodAllergyNote (value) {
      const normalized = String(value || '').trim()
      return !!normalized && normalized !== '-'
    },
    hasAnyAddressValue (address) {
      return Object.keys(address || {}).some(key => !!String(address[key] || '').trim())
    },
    shippingFeeLabel (fee) {
      return this.$t('graduation.certificate.fee', { amount: Number(fee || 0).toLocaleString('en-US') })
    },
    validateCertificateDelivery () {
      if (!this.requiresCertificateDelivery) return true
      return !this.validationErrors.certificateDeliveryMethod &&
        !this.validationErrors.certificateShippingService &&
        !this.validationErrors.certificateDeliveryAddress
    },
    hasFieldError (field) {
      return this.validationAttempted && !!this.validationErrors[field]
    },
    scrollToField (field) {
      this.$nextTick(() => {
        const ref = this.$refs[`${field}Field`]
        const target = Array.isArray(ref) ? ref[0] : ref
        const element = target && target.$el ? target.$el : target
        if (!element || !element.scrollIntoView) return
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        const focusable = element.querySelector && element.querySelector('input, select, textarea, button')
        if (focusable && focusable.focus) {
          window.setTimeout(() => focusable.focus(), 250)
        }
      })
    },
    validateForm () {
      this.validationAttempted = true
      const firstInvalidField = VALIDATION_FIELD_ORDER.find(field => this.validationErrors[field])
      if (firstInvalidField) {
        this.scrollToField(firstInvalidField)
        return false
      }
      return true
    },
    registrationPayload () {
      this.syncPhoneFromParts()
      const hasFoodAllergy = normalizeYesNo(this.form.hasFoodAllergy)
      const schoolItem = this.findCatalogSchool(this.form.school)
      const programItem = this.findCatalogProgram(this.form.school, this.form.program)
      const initialDefaults = graduateInitialDefaults(this.graduateInitialRecord)
      return Object.assign({}, this.form, {
        namePronunciation: this.namePronunciation,
        phone: this.composedPhone,
        email: this.authEmail || normalizeEmailText(this.form.email),
        school: textValue(this.form.school),
        schoolEnglish: textValue(schoolItem && (schoolItem.schoolEnglish || schoolItem.labelEn)) || textValue(this.form.schoolEnglish),
        program: textValue(this.form.program),
        programEnglish: textValue(programItem && (programItem.programEnglish || programItem.labelEn)) || textValue(this.form.programEnglish),
        questionnaireEmploymentStatus: meaningfulOptionValue(this.form.questionnaireEmploymentStatus),
        questionnaireNote: textValue(this.form.questionnaireNote),
        currentAddressSameAsHome: this.currentAddressSameAsHome,
        currentAddressBeforeHomeCopy: this.currentAddressBeforeHomeCopy || emptyAddress(),
        hasFoodAllergy,
        foodAllergyNote: hasFoodAllergy === 'yes' ? this.form.foodAllergyNote : '',
        barcodeValue: this.currentRegistrationBarcodeValue || initialDefaults.studentCode || this.authStudentCode || this.barcodeValue
      })
    },
    persistLocalDraft (savedRegistration) {
      const savedId = savedRegistration && (savedRegistration._id || savedRegistration.id)
        ? textValue(savedRegistration._id || savedRegistration.id)
        : this.currentRegistrationId
      const savedBarcode = savedRegistration && savedRegistration.barcodeValue
        ? textValue(savedRegistration.barcodeValue)
        : (this.currentRegistrationBarcodeValue || normalizeStudentCode(this.graduateInitialRecord && this.graduateInitialRecord.studentCode) || this.authStudentCode || this.barcodeValue)
      this.currentRegistrationId = savedId
      this.currentRegistrationBarcodeValue = savedBarcode
      const payload = {
        form: Object.assign({}, this.form, {
          phone: this.composedPhone,
          email: this.authEmail || normalizeEmailText(this.form.email),
          school: textValue(this.form.school),
          program: textValue(this.form.program),
          questionnaireEmploymentStatus: meaningfulOptionValue(this.form.questionnaireEmploymentStatus),
          questionnaireNote: textValue(this.form.questionnaireNote)
        }),
        barcodeValue: savedBarcode,
        currentRegistrationId: savedId,
        currentAddressSameAsHome: this.currentAddressSameAsHome,
        currentAddressBeforeHomeCopy: this.currentAddressBeforeHomeCopy,
        savedAt: new Date().toISOString()
      }
      window.localStorage.setItem(this.draftStorageKey, JSON.stringify(payload))
    },
    async saveDraft () {
      if (!this.validateForm()) {
        return null
      }
      if (!this.validateCertificateDelivery()) {
        return null
      }
      if (this.addressFieldsInvalid) {
        return null
      }
      this.prepareAddressFieldsForSave()
      this.saving = true
      try {
        const payload = this.registrationPayload()
        const currentId = textValue(this.currentRegistrationId)
        let response = null
        if (currentId) {
          try {
            response = await api.graduateRegistrations('update', Object.assign({ _id: currentId }, payload))
          } catch (error) {
            const status = error && error.response && error.response.status
            if (status !== 404) throw error
            this.currentRegistrationId = ''
            response = await api.graduateRegistrations('create', payload)
          }
        } else {
          response = await api.graduateRegistrations('create', payload)
        }
        const saved = response && response.data && response.data.data ? response.data.data : null
        if (saved && !this.currentAddressSameAsHome) {
          this.mongoCurrentAddress = this.normalizedAddress(saved.currentAddress)
        }
        this.persistLocalDraft(saved)
        this.resetAddressEditing()
        this.validationAttempted = false
        notifySuccess(this.$store, this.$t('graduation.messages.saveSuccess'))
        markGraduationStep(this.currentProfile, 'registrationSaved')
        return saved
      } catch (error) {
        this.persistLocalDraft()
        notifyError(this.$store, this.$t('graduation.messages.saveDraftOnly'))
        throw error
      } finally {
        this.saving = false
      }
    },
    restoreDraft () {
      const storageKey = this.draftStorageKey
      if (this.loadedDraftStorageKey === storageKey) return
      this.loadedDraftStorageKey = storageKey
      try {
        const raw = window.localStorage.getItem(storageKey)
        if (!raw) {
          this.form = cloneForm()
          this.lockedFields = {}
          this.currentAddressSameAsHome = false
          this.currentAddressBeforeHomeCopy = null
          this.mongoCurrentAddress = null
          this.syncPhonePartsFromPhone('')
          this.applyFixedGraduateName()
          this.currentRegistrationId = ''
          this.currentRegistrationBarcodeValue = ''
          this.savedFacePhoto = ''
          return
        }
        const payload = JSON.parse(raw)
        const restored = Object.assign(cloneForm(), payload.form || {})
        this.currentAddressSameAsHome = payload.currentAddressSameAsHome === true
        this.currentAddressBeforeHomeCopy = payload.currentAddressBeforeHomeCopy
          ? Object.assign(emptyAddress(), payload.currentAddressBeforeHomeCopy)
          : null
        this.currentRegistrationId = textValue(payload.currentRegistrationId)
        this.currentRegistrationBarcodeValue = textValue(payload.barcodeValue)
        if ((!restored.firstNamePronunciation || !restored.lastNamePronunciation) && restored.namePronunciation) {
          const parts = String(restored.namePronunciation).trim().split(/\s+/)
          if (!restored.firstNamePronunciation) restored.firstNamePronunciation = parts.shift() || ''
          if (!restored.lastNamePronunciation) restored.lastNamePronunciation = parts.join(' ')
        }
        restored.homeAddress = Object.assign(emptyAddress(), restored.homeAddress || restored.address || {})
        restored.currentAddress = Object.assign(emptyAddress(), restored.currentAddress || {})
        restored.workAddress = Object.assign(emptyAddress(), restored.workAddress || {})
        restored.certificateDeliveryAddress = Object.assign(emptyAddress(), restored.certificateDeliveryAddress || {})
        restored.school = textValue(restored.school)
        restored.schoolEnglish = textValue(restored.schoolEnglish)
        restored.program = textValue(restored.program)
        restored.programEnglish = textValue(restored.programEnglish)
        restored.questionnaireEmploymentStatus = meaningfulOptionValue(restored.questionnaireEmploymentStatus)
        restored.questionnaireNote = textValue(restored.questionnaireNote)
        const restoredCeremonyRaw = normalizeCode(restored.ceremonyStatus)
        if (CEREMONY_ASSISTANCE_TYPE_OPTIONS.some(item => item.value === restoredCeremonyRaw)) {
          restored.ceremonyAssistanceType = restoredCeremonyRaw
          restored.ceremonyStatus = '20'
        } else {
          restored.ceremonyStatus = normalizeCeremonyStatus(restoredCeremonyRaw)
        }
        if (!isAssistanceCeremonyStatus(restored.ceremonyStatus)) {
          restored.ceremonyAssistanceType = ''
        }
        if (!['50', '60'].includes(normalizeCeremonyStatus(restored.ceremonyStatus))) {
          restored.certificateDeliveryMethod = ''
          restored.certificateShippingService = ''
          restored.certificateDeliveryAddress = emptyAddress()
        } else if (restored.certificateDeliveryMethod !== 'postal') {
          restored.certificateShippingService = ''
          restored.certificateDeliveryAddress = emptyAddress()
        }
        if (normalizeYesNo(restored.hasFoodAllergy) !== 'yes') {
          restored.foodAllergyNote = ''
        }
        this.form = restored
        if (this.currentAddressSameAsHome) {
          this.copyHomeAddressToCurrent()
        }
        this.syncPhonePartsFromPhone(this.form.phone)
        this.applyFixedGraduateName()
      } catch (error) {
        this.form = cloneForm()
        this.currentAddressSameAsHome = false
        this.currentAddressBeforeHomeCopy = null
        this.mongoCurrentAddress = null
        this.syncPhonePartsFromPhone('')
        this.applyFixedGraduateName()
        this.currentRegistrationId = ''
        this.currentRegistrationBarcodeValue = ''
        this.savedFacePhoto = ''
      }
    },
    clearAllData () {
      if (typeof window !== 'undefined' && window.confirm && !window.confirm(this.$t('graduation.messages.clearConfirm'))) {
        return
      }
      this.form = cloneForm()
      this.lockedFields = {}
      this.currentAddressSameAsHome = false
      this.currentAddressBeforeHomeCopy = null
      this.mongoCurrentAddress = null
      this.syncPhonePartsFromPhone('')
      this.applyFixedGraduateName()
      this.currentRegistrationId = ''
      this.currentRegistrationBarcodeValue = ''
      this.savedFacePhoto = ''
      this.resetAddressEditing()
      this.foodAllergyAlertShown = false
      this.validationAttempted = false
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(this.draftStorageKey)
        window.localStorage.removeItem(STORAGE_KEY)
      }
      notifySuccess(this.$store, this.$t('graduation.messages.clearSuccess'))
    },
    async goToFacePage () {
      try {
        const saved = await this.saveDraft()
        if (!saved) return
      } catch (error) {
        return
      }
      this.$router.push('/graduation/ceremony-preferences')
    }
  }
}
</script>

<style scoped>
.graduate-registration-page {
  padding: 0.25rem;
}
.registration-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}
.registration-header h1 {
  margin: 0;
  font-size: 30px;
  font-weight: 700;
  color: #1f2937;
}
.registration-header p {
  max-width: 760px;
  margin: 6px 0 0;
  color: #6b7280;
}
.registration-header__eyebrow {
  display: inline-flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 5px 11px;
  border-radius: 999px;
  color: #8c1515;
  background: #fff0f0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.registration-header__actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.registration-header__actions {
  flex: 0 0 auto;
  justify-content: flex-end;
  margin-left: auto;
}
.registration-header__actions .btn {
  white-space: nowrap;
}
.face-preview-panel {
  position: sticky;
  top: 88px;
  overflow: hidden;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
}
.face-preview-panel__heading {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eef2f7;
}
.face-preview-panel__icon {
  display: grid;
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 10px;
  color: #8c1515;
  background: #fff0f0;
  font-size: 18px;
}
.face-preview-panel__heading h2 {
  margin: 0;
  color: #172033;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.35;
}
.face-preview-panel__heading p {
  margin: 4px 0 0;
  color: #7b8798;
  font-size: 11px;
  line-height: 1.45;
}
.face-preview-panel__photo {
  position: relative;
  overflow: hidden;
  margin-top: 18px;
  border-radius: 12px;
  background: #e9edf2;
  aspect-ratio: 3 / 4;
}
.face-preview-panel__photo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.face-preview-panel__status {
  position: absolute;
  right: 10px;
  bottom: 10px;
  left: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 9px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  backdrop-filter: blur(8px);
}
.face-preview-panel__status--success {
  background: rgba(22, 163, 74, 0.9);
}
.face-preview-panel__empty {
  display: flex;
  min-height: 250px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 18px;
  padding: 24px 18px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  color: #64748b;
  background: linear-gradient(180deg, #f8fafc, #f1f5f9);
  text-align: center;
}
.face-preview-panel__empty > span {
  display: grid;
  width: 70px;
  height: 70px;
  margin-bottom: 14px;
  place-items: center;
  border-radius: 50%;
  color: #94a3b8;
  background: #e2e8f0;
  font-size: 30px;
}
.face-preview-panel__empty strong {
  color: #475569;
  font-size: 14px;
}
.face-preview-panel__empty small {
  max-width: 190px;
  margin-top: 6px;
  font-size: 11px;
  line-height: 1.5;
}
.face-preview-panel__identity {
  display: grid;
  gap: 3px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #eef2f7;
  text-align: center;
}
.face-preview-panel__identity span {
  overflow: hidden;
  color: #334155;
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.face-preview-panel__identity small {
  color: #8c1515;
  font-size: 11px;
  font-weight: 700;
}
.registration-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: none;
}
.readonly-white textarea,
.readonly-white .form-control {
  color: #374151;
  background-color: #fff;
  cursor: default;
  pointer-events: none;
  box-shadow: none;
}
.select-disabled-white select,
.select-disabled-white .form-control,
.select-disabled-white .custom-select {
  color: #374151;
  background-color: #fff;
  opacity: 1;
  cursor: default;
  pointer-events: none;
  box-shadow: none;
}
.field-help-text {
  margin-top: -0.5rem;
  margin-bottom: 0.75rem;
  color: #4b5563;
  font-size: 13px;
}
.required-mark {
  margin-left: 4px;
  color: #e55353;
  font-weight: 900;
}
.required-field ::v-deep label::after {
  content: " *";
  color: #e55353;
  font-weight: 900;
}
::v-deep .address-required-field label::after {
  content: " *";
  color: #e55353;
  font-weight: 900;
}
.phone-field {
  margin-bottom: 1rem;
}
.phone-field__label {
  display: inline-block;
  margin-bottom: 0.5rem;
  color: #3c4b64;
  font-size: 0.875rem;
  font-weight: 600;
}
.phone-field__control {
  display: grid;
  grid-template-columns: minmax(150px, 1fr) minmax(0, 1fr);
  gap: 8px;
  align-items: start;
}
.phone-field__control .form-group {
  margin-bottom: 0;
}
.phone-country-select,
.phone-local-input {
  min-width: 0;
  margin-bottom: 0;
}
.phone-field.is-invalid .custom-select,
.phone-field.is-invalid .form-control {
  border-color: #e55353;
}
.section-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}
.section-heading h2 {
  margin: 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 800;
}
.ceremony-status-select ::v-deep label {
  color: #374151;
  font-size: 14px;
  font-weight: 700;
}
.ceremony-section-heading {
  margin-bottom: 18px;
}
.ceremony-section-heading h2 {
  font-size: 20px;
  font-weight: 800;
}
.address-group-heading {
  margin: 0 0 22px;
  padding-right: 44px;
}
.address-group-heading h2 {
  margin: 0;
  color: #111827;
  font-size: 20px;
  font-weight: 800;
}
.address-group-heading p {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 13px;
}
.address-group-card {
  border: 1px solid #e5e7eb;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
}
.address-panel {
  padding-top: 20px;
  border-top: 1px solid #eef2f7;
}
.address-group-heading + .address-panel {
  padding-top: 0;
  border-top: 0;
}
.address-panel + .address-panel {
  margin-top: 26px;
}
.address-block {
  position: relative;
}
.address-block.readonly-white .form-control {
  color: #111827;
  background-color: #e5e7eb;
  border-color: #d1d5db;
  pointer-events: none;
}
.address-block ::v-deep .form-group > label {
  color: #111827;
  font-size: 15px;
  font-weight: 500;
}
.address-subsection {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 34px;
  padding-right: 58px;
  margin-bottom: 10px;
  color: #111827;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.25;
}
.address-subsection::before {
  display: none;
}
.address-subsection > span {
  flex: 1 1 auto;
}
::v-deep .address-subsection .same-address-checkbox {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  max-width: 100%;
  margin: 0 0 0 auto;
  padding: 9px 14px;
  border: 1px solid #e4d6d6;
  border-radius: 999px;
  color: #475569;
  background: linear-gradient(180deg, #fff, #faf7f7);
  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.05);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.35;
  user-select: none;
  transition: border-color 0.18s ease, background-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}
::v-deep .address-subsection .same-address-checkbox:hover {
  border-color: #c98282;
  color: #8c1515;
  background: #fff7f7;
  box-shadow: 0 5px 14px rgba(140, 21, 21, 0.1);
  transform: translateY(-1px);
}
::v-deep .address-subsection .same-address-checkbox--checked {
  border-color: #8c1515;
  color: #7d1017;
  background: #fff1f1;
  box-shadow: 0 4px 14px rgba(140, 21, 21, 0.12);
}
::v-deep .address-subsection .same-address-checkbox input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
}
::v-deep .address-subsection .same-address-checkbox span {
  display: inline-flex;
  flex: 0 1 auto;
  align-items: center;
  gap: 9px;
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
}
::v-deep .address-subsection .same-address-checkbox span::before {
  content: '';
  display: grid;
  flex: 0 0 19px;
  width: 19px;
  height: 19px;
  place-items: center;
  border: 1.5px solid #aeb6c2;
  border-radius: 6px;
  color: #fff;
  background: #fff;
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
  transition: all 0.18s ease;
}
::v-deep .address-subsection .same-address-checkbox--checked span::before {
  content: '\2713';
  border-color: #8c1515;
  background: #8c1515;
  box-shadow: 0 0 0 3px rgba(140, 21, 21, 0.1);
}
::v-deep .address-subsection .same-address-checkbox input:focus-visible + span::before {
  outline: 2px solid rgba(140, 21, 21, 0.35);
  outline-offset: 2px;
}
.address-choice-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 0 58px 18px 0;
}
.address-choice-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding-right: 14px;
  padding-left: 14px;
  border-color: #6b5b95;
  color: #3f3675;
  background: #fff;
  font-weight: 800;
  white-space: nowrap;
}
.address-choice-button:hover,
.address-choice-button:focus {
  border-color: #8c1515;
  color: #fff;
  background: #8c1515;
}
.address-icon-button {
  position: absolute;
  top: 2px;
  right: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  padding: 0;
  border-radius: 8px;
}
.address-save-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
.address-save-button {
  white-space: nowrap;
}
.address-group-card ::v-deep .address-block {
  position: relative;
}
.address-group-card ::v-deep .address-subsection {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  min-height: 42px;
  margin-bottom: 12px;
  color: #111827;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.2;
}
.address-group-card ::v-deep .address-subsection span {
  flex: 1 1 auto;
  min-width: 0;
}
.address-group-card ::v-deep .address-icon-button {
  position: static;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  padding: 0;
  border-radius: 8px;
}
.address-group-card ::v-deep .address-choice-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 16px;
  margin: 4px 0 24px;
}
.address-group-card ::v-deep .address-choice-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 0 16px;
  border-color: #6b5b95;
  border-radius: 6px;
  color: #3f3675;
  background: #fff;
  font-weight: 800;
  white-space: nowrap;
}
.address-group-card ::v-deep .address-choice-button:hover,
.address-group-card ::v-deep .address-choice-button:focus {
  border-color: #8c1515;
  color: #fff;
  background: #8c1515;
}
.address-group-card ::v-deep .address-grid {
  row-gap: 6px;
}
.address-group-card ::v-deep .address-grid .form-group {
  margin-bottom: 22px;
}
.address-group-card ::v-deep .address-grid .form-group > label {
  margin-bottom: 8px;
  color: #111827;
  font-size: 16px;
  font-weight: 500;
}
.address-group-card ::v-deep .address-grid .form-control {
  min-height: 46px;
  border: 1px solid #d8dbe0;
  border-radius: 6px;
  color: #111827;
  font-size: 16px;
}
.address-group-card ::v-deep .address-block.readonly-white .address-grid .form-control {
  background-color: #e5e7eb;
  border-color: #d1d5db;
  pointer-events: none;
}
.questionnaire-sample-card {
  border-color: #e5e7eb;
  background: #fff;
}
.questionnaire-sample-heading {
  margin-bottom: 12px;
}
.questionnaire-sample-heading h2 {
  font-size: 18px;
}
.certificate-delivery-block {
  margin: 8px 0 18px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-left: 4px solid #8c1515;
  border-radius: 8px;
  background: #fbfdff;
}
.certificate-delivery-title {
  margin-bottom: 12px;
  color: #111827;
  font-size: 20px;
  font-weight: 800;
}
.certificate-delivery-address {
  margin-top: 16px;
}
.certificate-delivery-address ::v-deep .address-subsection {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  min-height: 40px;
  margin-bottom: 12px;
  color: #111827;
  font-size: 21px;
  font-weight: 800;
  line-height: 1.2;
}
.certificate-delivery-address ::v-deep .address-choice-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 16px;
  margin: 4px 0 24px;
}
.certificate-delivery-address ::v-deep .address-choice-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 0 16px;
  border-color: #6b5b95;
  border-radius: 6px;
  color: #3f3675;
  background: #fff;
  font-weight: 800;
  white-space: nowrap;
}
.certificate-delivery-address ::v-deep .address-choice-button:hover,
.certificate-delivery-address ::v-deep .address-choice-button:focus {
  border-color: #8c1515;
  color: #fff;
  background: #8c1515;
}
.certificate-delivery-address ::v-deep .address-grid {
  row-gap: 6px;
}
.certificate-delivery-address ::v-deep .address-grid .form-group {
  margin-bottom: 18px;
}
.certificate-delivery-address ::v-deep .address-grid .form-group > label {
  margin-bottom: 8px;
  color: #111827;
  font-size: 16px;
  font-weight: 500;
}
.certificate-delivery-address ::v-deep .address-grid .form-control {
  min-height: 46px;
  border: 1px solid #d8dbe0;
  border-radius: 6px;
  color: #111827;
  font-size: 16px;
}
.shipping-rate-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 4px 0 18px;
}
.shipping-service-label {
  margin-bottom: 8px;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
}
.shipping-service-picker.is-invalid .shipping-rate-card {
  border-color: #e55353;
}
.shipping-rate-card {
  position: relative;
  display: grid;
  gap: 4px;
  width: 100%;
  min-height: 116px;
  padding: 14px 44px 14px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease, background-color 0.15s ease;
}
.shipping-rate-card:hover,
.shipping-rate-card:focus {
  border-color: #8c1515;
  box-shadow: 0 8px 18px rgba(140, 21, 21, 0.12);
  outline: none;
}
.shipping-rate-card--selected {
  border-color: #8c1515;
  background: #fff8f8;
  box-shadow: 0 0 0 2px rgba(140, 21, 21, 0.12);
}
.shipping-rate-card__check {
  position: absolute;
  top: 12px;
  right: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 1px solid #d1d5db;
  border-radius: 999px;
  color: #fff;
  background: #fff;
}
.shipping-rate-card--selected .shipping-rate-card__check {
  border-color: #8c1515;
  background: #8c1515;
}
.shipping-rate-card strong {
  color: #111827;
}
.shipping-rate-card span {
  color: #6b7280;
  font-size: 12px;
}
.shipping-rate-card em {
  color: #8c1515;
  font-style: normal;
  font-weight: 700;
}
.sticky-summary {
  position: sticky;
  top: 84px;
}
.summary-card {
  overflow: hidden;
  border-color: #dde3ee;
  background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.12);
}
.summary-card .card-body {
  padding: 1rem;
}
.summary-card::before {
  display: block;
  height: 3px;
  margin: -1rem -1rem 8px;
  background: linear-gradient(90deg, #8c1515, #c9a227);
  content: "";
}
.summary-heading {
  align-items: flex-start;
  margin-bottom: 10px;
}
.summary-heading > div {
  display: flex;
  align-items: center;
  gap: 8px;
}
.summary-heading h2 {
  font-size: 18px;
}
.summary-heading__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  color: #8c1515;
  background: #fff1f1;
}
.summary-badge {
  flex: 0 0 auto;
  margin-top: 2px;
  padding: 4px 9px;
  border-radius: 999px;
  font-weight: 700;
}
.summary-list {
  display: grid;
  gap: 4px;
}
.summary-list div {
  display: grid;
  gap: 3px;
  padding: 6px 0;
  border-bottom: 1px solid #eef2f7;
}
.summary-list div:last-child {
  border-bottom: 0;
}
.summary-list span {
  color: #6b7280;
  font-size: 12px;
}
.summary-list strong {
  color: #111827;
  font-size: 15px;
  overflow-wrap: anywhere;
  line-height: 1.3;
}
.summary-progress-label {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
  color: #6b7280;
  font-size: 12px;
}
.summary-progress-label span {
  color: #8c1515;
  font-size: 14px;
  font-weight: 800;
}
.summary-progress-label em {
  font-style: normal;
  font-weight: 700;
}
.completion-meter {
  height: 8px;
  overflow: hidden;
  margin-top: 6px;
  border-radius: 999px;
  background: #e5e7eb;
}
.completion-meter span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #8c1515, #c9a227);
}
.summary-actions {
  display: flex;
  margin-top: 12px;
}
.section-heading--separated {
  margin-top: 0.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #e5e7eb;
}
.address-panel--home {
  padding-top: 0;
  border-top: 0;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}
.form-actions .summary-save-button {
  width: auto;
  min-width: 220px;
  padding-right: 2rem;
  padding-left: 2rem;
}
.summary-save-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 40px;
  border: 0;
  border-radius: 8px;
  background: #8c1515;
  box-shadow: 0 10px 22px rgba(140, 21, 21, 0.24);
  font-weight: 800;
  white-space: nowrap;
}
.summary-save-button:hover,
.summary-save-button:focus {
  background: #751111;
  box-shadow: 0 12px 26px rgba(140, 21, 21, 0.3);
}
.summary-save-button:disabled,
.summary-save-button.disabled {
  border-color: #b76a6a;
  background: #b76a6a;
  box-shadow: 0 4px 10px rgba(140, 21, 21, 0.12);
  cursor: not-allowed;
  opacity: 0.78;
}
@media (max-width: 768px) {
  .registration-header,
  .registration-header__actions {
    flex-direction: column;
  }
  .shipping-rate-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .address-group-card ::v-deep .address-subsection {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
    padding-right: 0;
  }
  .address-group-card ::v-deep .address-subsection > span {
    display: block;
    min-width: 0;
    width: 100%;
    margin-bottom: 0;
    white-space: normal;
  }
  .address-group-card ::v-deep .address-subsection .same-address-checkbox {
    display: flex;
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    justify-content: flex-start;
    grid-column: 1;
    margin-left: 0;
    border-radius: 12px;
  }
  .address-group-card ::v-deep .address-subsection .same-address-checkbox span {
    width: auto;
    margin-bottom: 0;
    white-space: normal;
  }
}
@media (max-width: 991px) {
  .face-preview-panel {
    position: static;
  }
  .face-preview-panel__empty {
    min-height: 210px;
  }
}
@media (max-width: 575px) {
  .shipping-rate-card {
    min-height: 150px;
    padding: 12px 34px 12px 10px;
  }
  .shipping-rate-card strong { font-size: 13px; }
  .shipping-rate-card span { font-size: 11px; }
  .phone-field__control {
    grid-template-columns: 1fr;
  }
}
</style>



