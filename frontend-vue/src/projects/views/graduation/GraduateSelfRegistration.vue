<template>
  <div class="graduate-registration-page">
    <div class="registration-header">
      <div>
        <div class="registration-header__eyebrow">{{ $t('graduation.self.eyebrow') }}</div>
        <h1>{{ $t('graduation.self.title') }}</h1>
        <p>{{ $t('graduation.self.subtitle') }}</p>
      </div>
      <div class="registration-header__actions">
        <CButton color="danger" variant="outline" :disabled="saving" @click="clearAllData">
          <CIcon name="cil-trash" class="mr-2" />
          {{ $t('graduation.self.actions.clear') }}
        </CButton>
      </div>
    </div>

    <CRow>
      <CCol lg="8" class="mb-3">
        <CCard class="registration-card">
          <CCardBody>
            <div class="section-heading">
              <h2>{{ $t('graduation.self.sections.name') }}</h2>
            </div>
            <CRow>
              <CCol md="6">
                <CInput ref="firstNameField" v-model.trim="form.firstName" :label="$t('graduation.fields.firstName')" :readonly="isLockedField('firstName')" :class="[{ 'is-invalid': hasFieldError('firstName') }, { 'readonly-white': isLockedField('firstName') }]" />
                <div v-if="hasFieldError('firstName')" class="invalid-feedback d-block">{{ validationErrors.firstName }}</div>
              </CCol>
              <CCol md="6">
                <CInput ref="lastNameField" v-model.trim="form.lastName" :label="$t('graduation.fields.lastName')" :readonly="isLockedField('lastName')" :class="[{ 'is-invalid': hasFieldError('lastName') }, { 'readonly-white': isLockedField('lastName') }]" />
                <div v-if="hasFieldError('lastName')" class="invalid-feedback d-block">{{ validationErrors.lastName }}</div>
              </CCol>
              <CCol md="6">
                <CInput ref="firstNamePronunciationField" v-model.trim="form.firstNamePronunciation" :label="$t('graduation.fields.firstNamePronunciation')" :class="{ 'is-invalid': hasFieldError('firstNamePronunciation') }" />
                <div v-if="hasFieldError('firstNamePronunciation')" class="invalid-feedback d-block">{{ validationErrors.firstNamePronunciation }}</div>
              </CCol>
              <CCol md="6">
                <CInput ref="lastNamePronunciationField" v-model.trim="form.lastNamePronunciation" :label="$t('graduation.fields.lastNamePronunciation')" :class="{ 'is-invalid': hasFieldError('lastNamePronunciation') }" />
                <div v-if="hasFieldError('lastNamePronunciation')" class="invalid-feedback d-block">{{ validationErrors.lastNamePronunciation }}</div>
              </CCol>
              <CCol md="6">
                <CInput ref="phoneField" v-model.trim="form.phone" :label="$t('graduation.fields.phone')" :readonly="isLockedField('phone')" :class="[{ 'is-invalid': hasFieldError('phone') }, { 'readonly-white': isLockedField('phone') }]" />
                <div v-if="hasFieldError('phone')" class="invalid-feedback d-block">{{ validationErrors.phone }}</div>
              </CCol>
              <CCol md="6">
                <CInput v-model.trim="form.email" type="email" :label="$t('graduation.fields.email')" :readonly="isLockedField('email')" :class="{ 'readonly-white': isLockedField('email') }" />
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <CCard class="registration-card mt-3">
          <CCardBody>
            <div class="section-heading">
              <h2>{{ $t('graduation.self.sections.school') }}</h2>
            </div>
            <CRow>
              <CCol md="6">
                <CInput
                  ref="schoolField"
                  v-model="form.school"
                  :label="$t('graduation.fields.school')"
                  readonly
                  :class="[{ 'is-invalid': hasFieldError('school') }, 'readonly-white']"
                />
                <div v-if="hasFieldError('school')" class="invalid-feedback d-block">{{ validationErrors.school }}</div>
              </CCol>
              <CCol md="6">
                <CInput
                  ref="programField"
                  v-model="form.program"
                  :label="$t('graduation.fields.program')"
                  readonly
                  :class="[{ 'is-invalid': hasFieldError('program') }, 'readonly-white']"
                />
                <div v-if="hasFieldError('program')" class="invalid-feedback d-block">{{ validationErrors.program }}</div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <CCard class="registration-card address-section-card mt-3">
          <CCardBody>
            <AddressFields
              :title="$t('graduation.address.home')"
              :address="form.homeAddress"
              :readonly="isAddressReadonly('homeAddress')"
              @edit="enableAddressEdit('homeAddress')"
              @save="saveAddressEdit('homeAddress')"
            />
          </CCardBody>
        </CCard>

        <CCard class="registration-card address-section-card mt-3">
          <CCardBody>
            <AddressFields
              :title="$t('graduation.address.current')"
              :address="form.currentAddress"
              :readonly="isAddressReadonly('currentAddress')"
              @edit="enableAddressEdit('currentAddress')"
              @save="saveAddressEdit('currentAddress')"
            />
          </CCardBody>
        </CCard>

        <CCard class="registration-card address-section-card mt-3">
          <CCardBody>
            <AddressFields
              :title="$t('graduation.address.work')"
              :address="form.workAddress"
              :readonly="isAddressReadonly('workAddress')"
              @edit="enableAddressEdit('workAddress')"
              @save="saveAddressEdit('workAddress')"
            />
          </CCardBody>
        </CCard>

        <CCard class="registration-card mt-3">
          <CCardBody>
            <div class="section-heading">
              <h2>{{ $t('graduation.self.sections.health') }}</h2>
            </div>
            <CRow>
              <CCol md="12">
                <CSelect
                  ref="ceremonyStatusField"
                  v-model="form.ceremonyStatus"
                  :label="$t('graduation.fields.ceremonyStatus')"
                  :options="ceremonyStatusOptions"
                  :class="{ 'is-invalid': hasFieldError('ceremonyStatus') }"
                  @input="onCeremonyStatusInput"
                  @change="onCeremonyStatusInput"
                />
                <div v-if="hasFieldError('ceremonyStatus')" class="invalid-feedback d-block">{{ validationErrors.ceremonyStatus }}</div>
              </CCol>
              <CCol v-if="requiresAssistanceType" md="12">
                <CSelect
                  ref="ceremonyAssistanceTypeField"
                  :key="ceremonyAssistanceSelectKey"
                  v-model="form.ceremonyAssistanceType"
                  :label="$t('graduation.fields.assistanceType')"
                  :options="ceremonyAssistanceTypeOptions"
                  :class="{ 'is-invalid': hasFieldError('ceremonyAssistanceType') }"
                  @input="onCeremonyAssistanceTypeInput"
                  @change="onCeremonyAssistanceTypeInput"
                />
                <div v-if="hasFieldError('ceremonyAssistanceType')" class="invalid-feedback d-block">{{ validationErrors.ceremonyAssistanceType }}</div>
              </CCol>
              <CCol v-if="ceremonyStatusRequiresNote" md="12">
                <CTextarea
                  v-model.trim="form.ceremonyStatusNote"
                  :label="$t('graduation.fields.extraDetail')"
                  rows="2"
                />
              </CCol>
              <CCol v-if="requiresCertificateDelivery" md="12">
                <div class="certificate-delivery-block">
                  <div class="certificate-delivery-title">{{ $t('graduation.certificate.title') }}</div>
                  <CSelect
                    ref="certificateDeliveryMethodField"
                    v-model="form.certificateDeliveryMethod"
                    :label="$t('graduation.certificate.method')"
                    :options="certificateDeliveryMethodOptions"
                    :class="{ 'is-invalid': hasFieldError('certificateDeliveryMethod') }"
                    @input="onCertificateDeliveryMethodInput"
                    @change="onCertificateDeliveryMethodInput"
                  />
                  <div v-if="hasFieldError('certificateDeliveryMethod')" class="invalid-feedback d-block">{{ validationErrors.certificateDeliveryMethod }}</div>
                  <template v-if="requiresCertificateShipping">
                    <CSelect
                      ref="certificateShippingServiceField"
                      v-model="form.certificateShippingService"
                      :label="$t('graduation.certificate.shippingService')"
                      :options="certificateShippingServiceOptions"
                      :class="{ 'is-invalid': hasFieldError('certificateShippingService') }"
                    />
                    <div v-if="hasFieldError('certificateShippingService')" class="invalid-feedback d-block">{{ validationErrors.certificateShippingService }}</div>
                    <div class="shipping-rate-grid">
                      <div v-for="item in certificateShippingRates" :key="item.value" class="shipping-rate-card">
                        <strong>{{ item.label }}</strong>
                        <span>{{ item.description }}</span>
                        <em>{{ item.fee }}</em>
                      </div>
                    </div>
                    <div ref="certificateDeliveryAddressField" :class="{ 'is-invalid': hasFieldError('certificateDeliveryAddress') }">
                      <AddressFields :title="$t('graduation.certificate.deliveryAddress')" :address="form.certificateDeliveryAddress" />
                    </div>
                    <div v-if="hasFieldError('certificateDeliveryAddress')" class="invalid-feedback d-block">{{ validationErrors.certificateDeliveryAddress }}</div>
                  </template>
                </div>
              </CCol>
              <CCol md="12">
                <CSelect
                  v-model="form.hasFoodAllergy"
                  :label="$t('graduation.fields.foodAllergy')"
                  :options="localizedYesNoOptions"
                  @input="onFoodAllergyInput"
                  @change="onFoodAllergyInput"
                />
              </CCol>
            </CRow>
            <CTextarea
              ref="foodAllergyNoteField"
              v-model.trim="form.foodAllergyNote"
              :label="$t('graduation.fields.foodAllergyNote')"
              rows="2"
              :readonly="foodAllergyNoteDisabled"
              :tabindex="foodAllergyNoteDisabled ? -1 : 0"
              :class="[{ 'is-invalid': hasFieldError('foodAllergyNote') }, { 'readonly-white': foodAllergyNoteDisabled }]"
            />
            <div v-if="requiresFoodAllergyNote" class="field-help-text">
              กรุณาระบุอาหารที่แพ้หรือข้อควรระวังสำหรับการจัดอาหาร
            </div>
            <CAlert v-if="hasFieldError('foodAllergyNote')" color="danger" class="mt-2 mb-0">
              {{ $t('graduation.messages.foodAllergyRequired') }}
            </CAlert>
            <div v-if="hasFieldError('foodAllergyNote')" class="invalid-feedback d-block">
              {{ $t('graduation.messages.foodAllergyRequired') }}
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol lg="4" class="mb-3">
        <CCard class="registration-card sticky-summary">
          <CCardBody>
            <div class="section-heading">
              <h2>{{ $t('graduation.self.summary.title') }}</h2>
            </div>
            <div class="summary-list">
              <div>
                <span>{{ $t('graduation.self.summary.name') }}</span>
                <strong>{{ fullName || '-' }}</strong>
              </div>
              <div>
                <span>{{ $t('graduation.self.summary.pronunciation') }}</span>
                <strong>{{ namePronunciation || '-' }}</strong>
              </div>
              <div>
                <span>{{ $t('graduation.fields.school') }}</span>
                <strong>{{ form.school || '-' }}</strong>
              </div>
              <div>
                <span>{{ $t('graduation.fields.programShort') }}</span>
                <strong>{{ form.program || '-' }}</strong>
              </div>
              <div>
                <span>{{ $t('graduation.self.summary.ceremonyStatus') }}</span>
                <strong>{{ ceremonyStatusLabel }}</strong>
              </div>
            </div>
            <div class="completion-meter">
              <span :style="{ width: completionPercent + '%' }"></span>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>

    <div class="registration-bottom-actions">
      <CButton color="primary" variant="outline" :disabled="saving" @click="goToFacePage">
        <CIcon name="cil-save" class="mr-2" />
        {{ saving ? $t('graduation.self.actions.saving') : $t('graduation.self.actions.save') }}
      </CButton>
    </div>
  </div>
</template>

<script>
import api from '@/service/api'
import { notifyError, notifySuccess } from '@/projects/utils/notify'

const STORAGE_KEY = 'graduate-self-registration-draft'

const VALIDATION_FIELD_ORDER = [
  'firstName',
  'lastName',
  'firstNamePronunciation',
  'lastNamePronunciation',
  'phone',
  'school',
  'program',
  'ceremonyStatus',
  'ceremonyAssistanceType',
  'certificateDeliveryMethod',
  'certificateShippingService',
  'certificateDeliveryAddress',
  'foodAllergyNote'
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

function schoolKeyFor (school) {
  const normalized = normalizeOptionValue(school)
  return Object.keys(THAI_SCHOOL_PROGRAMS).find(item => normalizeOptionValue(item) === normalized)
}

const CEREMONY_STATUS_OPTIONS = [
  { value: '0', key: '0' },
  { value: '1', key: '1' },
  { value: '2', key: '2' },
  { value: '3', key: '3' },
  { value: '10', key: '10' },
  { value: '20', key: '20' },
  { value: '30', key: '30' },
  { value: '40', key: '40' },
  { value: '50', key: '50' },
  { value: '60', key: '60' },
  { value: '70', key: '70' },
  { value: '80', key: '80' }
]

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

function emptyAddress () {
  return {
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
  program: '',
  homeAddress: emptyAddress(),
  currentAddress: emptyAddress(),
  workAddress: emptyAddress(),
  certificateDeliveryMethod: '',
  certificateShippingService: '',
  certificateDeliveryAddress: emptyAddress(),
  ceremonyStatus: '',
  ceremonyAssistanceType: '',
  ceremonyStatusNote: '',
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
    firstName: firstText(source.firstName, source.givenName, userinfo.firstName),
    lastName: firstText(source.lastName, source.familyName, userinfo.lastName),
    phone: firstText(source.phone, source.mobile, source.msisdn, userinfo.phone, userinfo.mobile, userinfo.msisdn),
    email: firstText(source.email, userinfo.email, source.username),
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

export default {
  name: 'GraduateSelfRegistration',
  components: {
    AddressFields: {
      props: {
        title: { type: String, required: true },
        address: { type: Object, required: true },
        readonly: { type: Boolean, default: false }
      },
      template: `
        <div class="address-block" :class="{ 'readonly-white': readonly }">
          <CButton
            v-if="readonly"
            color="primary"
            variant="outline"
            size="sm"
            class="address-icon-button"
            title="แก้ไข"
            aria-label="แก้ไข"
            @click="$emit('edit')"
          >
            <CIcon name="cil-pencil" />
          </CButton>
          <div class="address-subsection">
            <span>{{ title }}</span>
          </div>
          <CRow>
            <CCol md="4">
              <CInput v-model.trim="address.houseNo" :label="$t('graduation.address.fields.houseNo')" :readonly="readonly" :tabindex="readonly ? -1 : 0" />
            </CCol>
            <CCol md="4">
              <CInput v-model.trim="address.moo" :label="$t('graduation.address.fields.moo')" :readonly="readonly" :tabindex="readonly ? -1 : 0" />
            </CCol>
            <CCol md="4">
              <CInput v-model.trim="address.soi" :label="$t('graduation.address.fields.soi')" :readonly="readonly" :tabindex="readonly ? -1 : 0" />
            </CCol>
            <CCol md="6">
              <CInput v-model.trim="address.road" :label="$t('graduation.address.fields.road')" :readonly="readonly" :tabindex="readonly ? -1 : 0" />
            </CCol>
            <CCol md="6">
              <CInput v-model.trim="address.subdistrict" :label="$t('graduation.address.fields.subdistrict')" :readonly="readonly" :tabindex="readonly ? -1 : 0" />
            </CCol>
            <CCol md="4">
              <CInput v-model.trim="address.district" :label="$t('graduation.address.fields.district')" :readonly="readonly" :tabindex="readonly ? -1 : 0" />
            </CCol>
            <CCol md="4">
              <CInput v-model.trim="address.province" :label="$t('graduation.address.fields.province')" :readonly="readonly" :tabindex="readonly ? -1 : 0" />
            </CCol>
            <CCol md="4">
              <CInput v-model.trim="address.postalCode" :label="$t('graduation.address.fields.postalCode')" :readonly="readonly" :tabindex="readonly ? -1 : 0" />
            </CCol>
          </CRow>
          <div v-if="!readonly" class="address-save-row">
            <CButton
              color="success"
              variant="outline"
              size="sm"
              class="address-save-button"
              @click="$emit('save')"
            >
              บันทึก
            </CButton>
          </div>
        </div>
      `
    }
  },
  data () {
    return {
      form: cloneForm(),
      lockedFields: {},
      addressEditing: {
        homeAddress: false,
        currentAddress: false,
        workAddress: false
      },
      lastRegistrationLookupEmail: '',
      saving: false,
      foodAllergyAlertShown: false,
      validationAttempted: false
    }
  },
  computed: {
    currentProfile () {
      return this.$store && this.$store.getters ? this.$store.getters['auth/profile'] : null
    },
    localizedYesNoOptions () {
      return [
        { label: this.$t('graduation.options.no'), value: 'no' },
        { label: this.$t('graduation.options.yes'), value: 'yes' }
      ]
    },
    fullName () {
      return [this.form.firstName, this.form.lastName].filter(Boolean).join(' ')
    },
    namePronunciation () {
      return [this.form.firstNamePronunciation, this.form.lastNamePronunciation].filter(Boolean).join(' ')
    },
    barcodeValue () {
      const base = [this.form.firstName, this.form.lastName, this.form.phone]
        .join('-')
        .replace(/\s+/g, '')
        .toUpperCase()
      return `GRAD-${base || 'PENDING'}`
    },
    schoolOptions () {
      return [
        { label: '', value: '' },
        ...Object.keys(THAI_SCHOOL_PROGRAMS).map(item => ({ label: item, value: item }))
      ]
    },
    programOptions () {
      const schoolKey = schoolKeyFor(this.form.school)
      const programs = schoolKey ? THAI_SCHOOL_PROGRAMS[schoolKey] : []
      return [
        { label: '', value: '' },
        ...programs.map(item => ({ label: item, value: item }))
      ]
    },
    programSelectKey () {
      return `program-${normalizeOptionValue(this.form.school)}`
    },
    ceremonyStatusOptions () {
      return [
        { label: '', value: '' },
        ...CEREMONY_STATUS_OPTIONS.map(item => ({
          label: `${item.value} - ${this.$t(`graduation.ceremonyStatus.${item.key}`)}`,
          value: item.value
        }))
      ]
    },
    ceremonyStatusLabel () {
      const ceremonyStatus = normalizeCode(this.form.ceremonyStatus)
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
        { label: '', value: '' },
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
      return `ceremony-assistance-${normalizeCode(this.form.ceremonyStatus)}`
    },
    ceremonyStatusRequiresNote () {
      return CEREMONY_STATUS_REQUIRES_NOTE.includes(normalizeCode(this.form.ceremonyStatus)) ||
        CEREMONY_ASSISTANCE_REQUIRES_NOTE.includes(normalizeCode(this.form.ceremonyAssistanceType))
    },
    requiresCertificateDelivery () {
      return normalizeCode(this.form.ceremonyStatus) === '3'
    },
    requiresCertificateShipping () {
      return this.requiresCertificateDelivery && this.form.certificateDeliveryMethod === 'postal'
    },
    certificateDeliveryMethodOptions () {
      return [
        { label: '', value: '' },
        { label: this.$t('graduation.certificate.pickup'), value: 'pickup' },
        { label: this.$t('graduation.certificate.postal'), value: 'postal' }
      ]
    },
    certificateShippingServiceOptions () {
      return [
        { label: '', value: '' },
        ...CERTIFICATE_SHIPPING_SERVICE_OPTIONS.map(item => ({
          label: `${this.$t(`graduation.certificate.shipping.${item.value}.label`)} (${this.shippingFeeLabel(item.fee)})`,
          value: item.value
        }))
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
      const requiredFields = ['firstName', 'lastName', 'firstNamePronunciation', 'lastNamePronunciation', 'phone', 'school', 'program', 'ceremonyStatus']
      let completed = requiredFields.filter(key => !!String(this.form[key] || '').trim()).length
      if (this.requiresAssistanceType && this.form.ceremonyAssistanceType) completed += 1
      if (this.requiresCertificateDelivery && this.form.certificateDeliveryMethod) completed += 1
      if (this.requiresCertificateShipping && this.form.certificateShippingService) completed += 1
      if (this.requiresCertificateShipping && this.hasAnyAddressValue(this.form.certificateDeliveryAddress)) completed += 1
      if (this.requiresFoodAllergyNote && this.isValidFoodAllergyNote(this.form.foodAllergyNote)) completed += 1
      return completed
    },
    completionPercent () {
      let requiredTotal = this.requiresAssistanceType ? 9 : 8
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
    validationErrors () {
      const requiredMessage = this.$t('graduation.messages.requiredField')
      const errors = {}
      ;['firstName', 'lastName', 'firstNamePronunciation', 'lastNamePronunciation', 'phone', 'school', 'program', 'ceremonyStatus']
        .forEach(field => {
          if (!textValue(this.form[field])) {
            errors[field] = requiredMessage
          }
        })
      if (this.requiresAssistanceType && !textValue(this.form.ceremonyAssistanceType)) {
        errors.ceremonyAssistanceType = requiredMessage
      }
      if (this.requiresCertificateDelivery && !this.form.certificateDeliveryMethod) {
        errors.certificateDeliveryMethod = this.$t('graduation.messages.selectCertificateMethod')
      }
      if (this.requiresCertificateShipping && !this.form.certificateShippingService) {
        errors.certificateShippingService = this.$t('graduation.messages.selectShippingService')
      }
      if (this.requiresCertificateShipping && !this.hasAnyAddressValue(this.form.certificateDeliveryAddress)) {
        errors.certificateDeliveryAddress = this.$t('graduation.messages.enterCertificateAddress')
      }
      if (this.foodAllergyNoteInvalid) {
        errors.foodAllergyNote = this.$t('graduation.messages.foodAllergyRequired')
      }
      return errors
    }
  },
  mounted () {
    this.restoreDraft()
    this.applyProfileDefaults()
    this.fetchRegistrationDefaults()
  },
  watch: {
    currentProfile: {
      handler () {
        this.applyProfileDefaults()
        this.fetchRegistrationDefaults()
      },
      deep: true
    },
    'form.school' (next) {
      const normalizedSchool = schoolKeyFor(next) || optionValue(next)
      if (next !== normalizedSchool) {
        this.form.school = normalizedSchool
      }
    },
    'form.ceremonyStatus' () {
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
    'form.certificateDeliveryMethod' (next) {
      if (next !== 'postal') {
        this.form.certificateShippingService = ''
        this.form.certificateDeliveryAddress = emptyAddress()
      }
    }
  },
  methods: {
    isLockedField (field) {
      return !!(this.lockedFields && this.lockedFields[field])
    },
    isAddressReadonly (addressKey) {
      return !this.addressEditing[addressKey]
    },
    enableAddressEdit (addressKey) {
      this.$set(this.addressEditing, addressKey, true)
    },
    saveAddressEdit (addressKey) {
      this.$set(this.addressEditing, addressKey, false)
      this.persistLocalDraft()
    },
    resetAddressEditing () {
      this.addressEditing = {
        homeAddress: false,
        currentAddress: false,
        workAddress: false
      }
    },
    normalizedAddress (address) {
      const normalized = emptyAddress()
      Object.keys(normalized).forEach(field => {
        normalized[field] = textValue(address && address[field])
      })
      return normalized
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
    registrationSearchTerms () {
      return [
        this.form.email,
        this.currentProfile && this.currentProfile.email,
        this.form.phone,
        this.form.barcodeValue,
        this.form.firstName,
        this.form.lastName
      ]
        .map(item => textValue(item).toLowerCase())
        .filter((item, index, list) => item && list.indexOf(item) === index)
    },
    registrationMatchScore (registration) {
      const email = textValue(this.form.email || (this.currentProfile && this.currentProfile.email)).toLowerCase()
      const phone = textValue(this.form.phone)
      const firstName = textValue(this.form.firstName)
      const lastName = textValue(this.form.lastName)
      let score = 0
      if (email && textValue(registration.email).toLowerCase() === email) score += 100
      if (phone && textValue(registration.phone) === phone) score += 80
      if (firstName && textValue(registration.firstName) === firstName) score += 30
      if (lastName && textValue(registration.lastName) === lastName) score += 30
      return score
    },
    bestRegistrationRow (rows) {
      return rows
        .map(row => ({ row, score: this.registrationMatchScore(row) }))
        .sort((left, right) => right.score - left.score)[0]
    },
    applyRegistrationDefaults (registration) {
      const school = normalizeSchoolName(registration && registration.school)
      this.applyDefaults({
        firstName: textValue(registration && registration.firstName),
        lastName: textValue(registration && registration.lastName),
        phone: textValue(registration && registration.phone),
        email: textValue(registration && registration.email),
        school,
        program: normalizeProgramName(school, registration && registration.program)
      }, { source: 'registration' })
      this.applyAddressDefaults(registration)
    },
    applyDefaults (defaults, options = {}) {
      const source = options.source || 'profile'
      ;['firstName', 'lastName', 'phone', 'email'].forEach(field => {
        if (defaults[field]) {
          this.form[field] = defaults[field]
          this.$set(this.lockedFields, field, source)
        } else if (!textValue(this.form[field])) {
          this.form[field] = ''
          this.$delete(this.lockedFields, field)
        }
      })
      if (defaults.school) {
        this.form.school = defaults.school
        this.$set(this.lockedFields, 'school', source)
      } else if (!textValue(this.form.school)) {
        this.form.school = ''
        this.$delete(this.lockedFields, 'school')
      }
      if (defaults.program) {
        this.form.program = defaults.program
        this.$set(this.lockedFields, 'program', source)
      } else if (!textValue(this.form.program)) {
        this.form.program = ''
        this.$delete(this.lockedFields, 'program')
      }
    },
    applyProfileDefaults () {
      const defaults = profileRegistrationDefaults(this.currentProfile)
      this.applyDefaults(defaults, { source: 'profile' })
    },
    async fetchRegistrationDefaults () {
      const searchTerms = this.registrationSearchTerms()
      const lookupKey = searchTerms.join('|') || 'auth-account'
      if (this.lastRegistrationLookupEmail === lookupKey) return
      this.lastRegistrationLookupEmail = lookupKey
      try {
        const defaultResponse = await api.graduateRegistrations('defaults', {
          email: this.form.email || (this.currentProfile && this.currentProfile.email),
          phone: this.form.phone,
          firstName: this.form.firstName,
          lastName: this.form.lastName
        })
        const defaultRow = defaultResponse && defaultResponse.data ? defaultResponse.data.data : null
        if (defaultRow) {
          this.applyRegistrationDefaults(defaultRow)
          return
        }
        if (!searchTerms.length) return
        const responses = await Promise.all(searchTerms.map(term => (
          api.graduateRegistrations('list', { q: term, limit: 20 })
        )))
        const rows = responses.reduce((items, response) => {
          const data = response && response.data && response.data.data ? response.data.data : {}
          const responseRows = Array.isArray(data.rows) ? data.rows : []
          responseRows.forEach(row => {
            if (row && row._id && !items.some(item => item._id === row._id)) items.push(row)
          })
          return items
        }, [])
        const best = this.bestRegistrationRow(rows)
        if (!best || best.score <= 0) return
        this.applyRegistrationDefaults(best.row)
      } catch (error) {
        // Users can still fill missing fields manually when registry lookup is unavailable.
      }
    },
    onSchoolInput (value) {
      const normalizedSchool = schoolKeyFor(value) || optionValue(value)
      if (this.form.school !== normalizedSchool) {
        this.form.school = normalizedSchool
      }
      this.form.program = ''
    },
    onCeremonyStatusInput (value) {
      const ceremonyStatus = normalizeCode(value)
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
      }
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
      const hasFoodAllergy = normalizeYesNo(this.form.hasFoodAllergy)
      return Object.assign({}, this.form, {
        namePronunciation: this.namePronunciation,
        hasFoodAllergy,
        foodAllergyNote: hasFoodAllergy === 'yes' ? this.form.foodAllergyNote : '',
        barcodeValue: this.barcodeValue
      })
    },
    persistLocalDraft (savedRegistration) {
      const payload = {
        form: this.form,
        barcodeValue: this.barcodeValue,
        currentRegistrationId: savedRegistration && savedRegistration._id ? savedRegistration._id : '',
        savedAt: new Date().toISOString()
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    },
    async saveDraft () {
      if (!this.validateForm()) {
        return null
      }
      if (!this.validateCertificateDelivery()) {
        return null
      }
      this.saving = true
      try {
        const payload = this.registrationPayload()
        const response = await api.graduateRegistrations('create', payload)
        const saved = response && response.data && response.data.data ? response.data.data : null
        this.persistLocalDraft(saved)
        this.validationAttempted = false
        notifySuccess(this.$store, this.$t('graduation.messages.saveSuccess'))
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
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (!raw) return
        const payload = JSON.parse(raw)
        const restored = Object.assign(cloneForm(), payload.form || {})
        if ((!restored.firstNamePronunciation || !restored.lastNamePronunciation) && restored.namePronunciation) {
          const parts = String(restored.namePronunciation).trim().split(/\s+/)
          if (!restored.firstNamePronunciation) restored.firstNamePronunciation = parts.shift() || ''
          if (!restored.lastNamePronunciation) restored.lastNamePronunciation = parts.join(' ')
        }
        restored.homeAddress = Object.assign(emptyAddress(), restored.homeAddress || restored.address || {})
        restored.currentAddress = Object.assign(emptyAddress(), restored.currentAddress || {})
        restored.workAddress = Object.assign(emptyAddress(), restored.workAddress || {})
        restored.certificateDeliveryAddress = Object.assign(emptyAddress(), restored.certificateDeliveryAddress || {})
        const restoredCeremonyStatus = normalizeCode(restored.ceremonyStatus)
        if (CEREMONY_ASSISTANCE_TYPE_OPTIONS.some(item => item.value === restoredCeremonyStatus)) {
          restored.ceremonyAssistanceType = restoredCeremonyStatus
          restored.ceremonyStatus = '20'
        }
        if (!isAssistanceCeremonyStatus(restored.ceremonyStatus)) {
          restored.ceremonyAssistanceType = ''
        }
        if (normalizeCode(restored.ceremonyStatus) !== '3') {
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
      } catch (error) {
        this.form = cloneForm()
      }
    },
    clearAllData () {
      if (typeof window !== 'undefined' && window.confirm && !window.confirm(this.$t('graduation.messages.clearConfirm'))) {
        return
      }
      this.form = cloneForm()
      this.resetAddressEditing()
      this.foodAllergyAlertShown = false
      this.validationAttempted = false
      if (typeof window !== 'undefined' && window.localStorage) {
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
      this.$router.push('/graduation/face-checkin')
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
  margin-bottom: 4px;
  color: #8c1515;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}
.registration-header__actions,
.registration-bottom-actions {
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
.registration-bottom-actions {
  justify-content: flex-end;
  margin-top: 8px;
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
  font-size: 18px;
  font-weight: 700;
}
.address-section-card {
  border-left: 4px solid #8c1515;
}
.address-block {
  position: relative;
}
.address-subsection {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 34px;
  padding-right: 44px;
  margin-bottom: 18px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eef2f7;
  color: #111827;
  font-size: 18px;
  font-weight: 700;
}
.address-subsection::before {
  content: "";
  width: 10px;
  height: 10px;
  flex: 0 0 auto;
  border-radius: 999px;
  background: #8c1515;
}
.address-subsection span {
  flex: 1 1 auto;
}
.address-icon-button {
  position: absolute;
  top: 0;
  right: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
}
.address-save-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
.address-save-button {
  white-space: nowrap;
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
  font-size: 18px;
  font-weight: 700;
}
.shipping-rate-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 4px 0 18px;
}
.shipping-rate-card {
  display: grid;
  gap: 4px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
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
.summary-list {
  display: grid;
  gap: 12px;
}
.summary-list div {
  display: grid;
  gap: 2px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eef2f7;
}
.summary-list span {
  color: #6b7280;
  font-size: 12px;
}
.summary-list strong {
  color: #111827;
  overflow-wrap: anywhere;
}
.completion-meter {
  height: 8px;
  overflow: hidden;
  margin-top: 18px;
  border-radius: 999px;
  background: #e5e7eb;
}
.completion-meter span {
  display: block;
  height: 100%;
  background: #8c1515;
}
@media (max-width: 768px) {
  .registration-header,
  .registration-header__actions,
  .registration-bottom-actions {
    flex-direction: column;
  }
  .registration-bottom-actions .btn {
    width: 100%;
  }
  .shipping-rate-grid {
    grid-template-columns: 1fr;
  }
}
</style>



