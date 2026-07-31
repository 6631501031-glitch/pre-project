<template>
  <div class="ceremony-page">
    <div class="ceremony-header">
      <h1>{{ pageTitle }}</h1>
    </div>

    <CCard class="ceremony-card">
      <CCardBody>
        <div v-if="loading" class="loading-state">
          <CSpinner color="primary" size="sm" class="mr-2" />
          {{ isEnglish ? 'Loading information...' : 'กำลังโหลดข้อมูล...' }}
        </div>
        <template v-else>
          <div class="section-heading">
            <h2>{{ $t('graduation.fields.ceremonyStatus') }}<span class="required-mark">*</span></h2>
          </div>
          <CSelect
            v-model="form.ceremonyStatus"
            :label="isEnglish ? 'Select status' : 'เลือกสถานะ'"
            :options="ceremonyStatusOptions"
            :class="{ 'is-invalid': errorFor('ceremonyStatus') }"
            @input="onCeremonyStatusChange"
            @change="onCeremonyStatusChange"
          />
          <div v-if="errorFor('ceremonyStatus')" class="invalid-feedback d-block">{{ requiredLabel }}</div>

          <CSelect
            v-if="requiresAssistanceType"
            v-model="form.ceremonyAssistanceType"
            :label="$t('graduation.fields.assistanceType')"
            :options="assistanceOptions"
            :class="{ 'is-invalid': errorFor('ceremonyAssistanceType') }"
          />
          <div v-if="errorFor('ceremonyAssistanceType')" class="invalid-feedback d-block">{{ requiredLabel }}</div>

          <CTextarea
            v-if="showsExtraDetail"
            v-model.trim="form.ceremonyStatusNote"
            :label="$t('graduation.fields.extraDetail')"
            rows="2"
          />

          <div v-if="requiresCertificateDelivery" class="certificate-block">
            <h3>{{ $t('graduation.certificate.title') }}</h3>
            <CSelect
              v-model="form.certificateDeliveryMethod"
              :label="$t('graduation.certificate.method')"
              :options="certificateMethodOptions"
              :class="{ 'is-invalid': errorFor('certificateDeliveryMethod') }"
              @input="onCertificateMethodChange"
              @change="onCertificateMethodChange"
            />
            <div v-if="errorFor('certificateDeliveryMethod')" class="invalid-feedback d-block">{{ requiredLabel }}</div>

            <template v-if="requiresShipping">
              <fieldset
                class="shipping-service-field"
                :class="{ 'is-invalid': errorFor('certificateShippingService') }"
              >
                <legend>
                  {{ $t('graduation.certificate.shippingService') }}<span class="required-mark">*</span>
                </legend>
                <div class="shipping-service-options">
                  <button
                    v-for="option in selectableShippingOptions"
                    :key="option.value"
                    type="button"
                    class="shipping-service-option"
                    :class="{ 'is-selected': form.certificateShippingService === option.value }"
                    :aria-pressed="form.certificateShippingService === option.value ? 'true' : 'false'"
                    @click="form.certificateShippingService = option.value"
                  >
                    <span class="shipping-service-option__check" aria-hidden="true">&#10003;</span>
                    <strong>{{ option.label }}</strong>
                    <span class="shipping-service-option__description">{{ option.description }}</span>
                    <span class="shipping-service-option__fee">{{ option.fee }}</span>
                  </button>
                </div>
              </fieldset>
              <div v-if="errorFor('certificateShippingService')" class="invalid-feedback d-block">{{ requiredLabel }}</div>

              <div class="delivery-address" :class="{ 'is-invalid': errorFor('certificateDeliveryAddress') }">
                <h3>{{ $t('graduation.certificate.deliveryAddress') }}<span class="required-mark">*</span></h3>
                <fieldset class="address-source-field" :class="{ 'is-invalid': errorFor('certificateAddressSource') }">
                  <legend>เลือกที่อยู่ที่ต้องการใช้<span class="required-mark">*</span></legend>
                  <div class="address-source-options">
                    <button
                      v-for="option in addressSourceOptions"
                      :key="option.value"
                      type="button"
                      class="address-source-option"
                      :class="{ 'is-selected': certificateAddressSource === option.value }"
                      :aria-pressed="certificateAddressSource === option.value ? 'true' : 'false'"
                      @click="selectCertificateAddress(option.value)"
                    >
                      <span class="address-source-option__check" aria-hidden="true">&#10003;</span>
                      <CIcon :name="option.icon" />
                      <strong>{{ option.label }}</strong>
                    </button>
                  </div>
                </fieldset>
                <div v-if="errorFor('certificateAddressSource')" class="invalid-feedback d-block">{{ requiredLabel }}</div>

                <CRow v-if="certificateAddressSource === 'workAddress'">
                  <CCol md="12" class="address-input-col">
                    <label for="certificate-address-companyName">
                      {{ $t('graduation.address.fields.companyName') }}<span class="required-mark">*</span>
                    </label>
                    <CInput
                      id="certificate-address-companyName"
                      v-model.trim="form.certificateDeliveryAddress.companyName"
                      :class="{ 'is-invalid': companyNameError() }"
                    />
                    <div v-if="companyNameError()" class="invalid-feedback d-block">{{ requiredLabel }}</div>
                  </CCol>
                </CRow>

                <CRow>
                  <CCol v-for="field in addressFields" :key="field.key" md="3" class="address-input-col">
                    <label :for="`certificate-address-${field.key}`">
                      {{ $t(field.label) }}<span v-if="field.required" class="required-mark">*</span>
                    </label>
                    <CInput
                      :id="`certificate-address-${field.key}`"
                      v-model.trim="form.certificateDeliveryAddress[field.key]"
                      :class="{ 'is-invalid': addressFieldError(field) }"
                    />
                    <div v-if="addressFieldError(field)" class="invalid-feedback d-block">{{ requiredLabel }}</div>
                  </CCol>
                </CRow>
              </div>
              <div v-if="errorFor('certificateDeliveryAddress')" class="invalid-feedback d-block">{{ requiredLabel }}</div>
            </template>
          </div>

          <div class="allergy-block">
            <CSelect
              v-model="form.hasFoodAllergy"
              :label="$t('graduation.fields.foodAllergy')"
              :options="yesNoOptions"
              @input="onFoodAllergyChange"
              @change="onFoodAllergyChange"
            />
            <CTextarea
              v-model.trim="form.foodAllergyNote"
              :label="$t('graduation.fields.foodAllergyNote')"
              rows="3"
              :readonly="form.hasFoodAllergy !== 'yes'"
              :class="[{ 'is-invalid': errorFor('foodAllergyNote') }, { 'food-allergy-note--readonly': form.hasFoodAllergy !== 'yes' }]"
            />
            <div v-if="errorFor('foodAllergyNote')" class="invalid-feedback d-block">
              {{ $t('graduation.messages.foodAllergyRequired') }}
            </div>
          </div>

          <div class="form-actions">
            <CButton color="primary" :disabled="saving || !isFormComplete" @click="save">
              <CIcon name="cil-save" class="mr-2" />
              {{ saving ? savingLabel : saveLabel }}
            </CButton>
          </div>
        </template>
      </CCardBody>
    </CCard>
  </div>
</template>

<script>
import api from '@/service/api'
import { notifyError, notifySuccess } from '@/projects/utils/notify'
import {
  getGraduationProgress,
  isFaceRegistrationEnabled,
  markGraduationStep
} from '@/projects/utils/graduation-workflow-progress'

const emptyAddress = () => ({
  companyName: '', houseNo: '', moo: '', soi: '', road: '', subdistrict: '', district: '', province: '', postalCode: ''
})

const emptyForm = () => ({
  ceremonyStatus: '',
  ceremonyAssistanceType: '',
  ceremonyStatusNote: '',
  certificateDeliveryMethod: '',
  certificateShippingService: '',
  certificateDeliveryAddress: emptyAddress(),
  hasFoodAllergy: 'no',
  foodAllergyNote: ''
})

export default {
  name: 'GraduateCeremonyPreferences',
  data () {
    return {
      registration: null,
      form: emptyForm(),
      loading: false,
      saving: false,
      validationAttempted: false,
      certificateAddressSource: '',
      addressFields: [
        { key: 'houseNo', label: 'graduation.address.fields.houseNo', required: true },
        { key: 'moo', label: 'graduation.address.fields.moo', required: true },
        { key: 'road', label: 'graduation.address.fields.road' },
        { key: 'soi', label: 'graduation.address.fields.soi' },
        { key: 'subdistrict', label: 'graduation.address.fields.subdistrict', required: true },
        { key: 'district', label: 'graduation.address.fields.district', required: true },
        { key: 'province', label: 'graduation.address.fields.province', required: true },
        { key: 'postalCode', label: 'graduation.address.fields.postalCode', required: true }
      ]
    }
  },
  computed: {
    currentProfile () {
      return this.$store && this.$store.getters ? this.$store.getters['auth/profile'] : null
    },
    isEnglish () {
      return String((this.$i18n && this.$i18n.locale) || '').toLowerCase().startsWith('en')
    },
    pageTitle () { return this.isEnglish ? 'Degree Ceremony Attendance' : 'การเข้ารับพระราชทานปริญญาบัตร' },
    requiredLabel () { return this.isEnglish ? 'Please complete this field.' : 'กรุณาระบุข้อมูล' },
    saveLabel () { return this.isEnglish ? 'Save information' : 'บันทึกข้อมูล' },
    savingLabel () { return this.isEnglish ? 'Saving...' : 'กำลังบันทึก...' },
    ceremonyStatusOptions () {
      return [
        { label: this.isEnglish ? 'Please specify' : 'กรุณาระบุ', value: '' },
        ...['10', '20', '30', '40', '50', '60', '70'].map(value => ({
          label: `${value} - ${this.$t(`graduation.ceremonyStatus.${value}`)}`,
          value
        }))
      ]
    },
    assistanceOptions () {
      return [
        { label: this.isEnglish ? 'Please specify' : 'กรุณาระบุ', value: '' },
        ...['21', '22', '23', '24'].map(value => ({ label: `${value} - ${this.$t(`graduation.assistanceType.${value}`)}`, value }))
      ]
    },
    certificateMethodOptions () {
      return [
        { label: this.isEnglish ? 'Please specify' : 'กรุณาระบุ', value: '' },
        { label: this.$t('graduation.certificate.pickup'), value: 'pickup' },
        { label: this.$t('graduation.certificate.postal'), value: 'postal' }
      ]
    },
    shippingOptions () {
      return [
        { label: this.isEnglish ? 'Please specify' : 'กรุณาระบุ', value: '' },
        ...['registered-domestic', 'registered-international', 'ems-domestic', 'ems-international'].map(value => ({
          label: this.$t(`graduation.certificate.shipping.${value}.label`), value
        }))
      ]
    },
    selectableShippingOptions () {
      const fees = {
        'registered-domestic': 80,
        'registered-international': 650,
        'ems-domestic': 120,
        'ems-international': 1200
      }
      return this.shippingOptions.filter(option => option.value).map(option => ({
        ...option,
        description: this.$t(`graduation.certificate.shipping.${option.value}.description`),
        fee: this.$t('graduation.certificate.fee', { amount: fees[option.value].toLocaleString('en-US') })
      }))
    },
    addressSourceOptions () {
      return [
        { value: 'homeAddress', label: 'ที่อยู่ตามทะเบียนบ้าน', icon: 'cil-home' },
        { value: 'currentAddress', label: 'ที่อยู่ปัจจุบัน', icon: 'cil-location-pin' },
        { value: 'workAddress', label: 'ที่อยู่ที่ทำงาน', icon: 'cil-building' }
      ]
    },
    yesNoOptions () {
      return [
        { label: this.$t('graduation.options.no'), value: 'no' },
        { label: this.$t('graduation.options.yes'), value: 'yes' }
      ]
    },
    requiresAssistanceType () { return this.form.ceremonyStatus === '20' },
    showsExtraDetail () { return this.form.ceremonyStatus === '70' || ['21', '22', '23', '24'].includes(this.form.ceremonyAssistanceType) },
    requiresCertificateDelivery () { return ['50', '60'].includes(this.form.ceremonyStatus) },
    requiresShipping () { return this.requiresCertificateDelivery && this.form.certificateDeliveryMethod === 'postal' },
    isFormComplete () {
      if (!this.form.ceremonyStatus) return false
      if (this.requiresAssistanceType && !this.form.ceremonyAssistanceType) return false
      if (this.requiresCertificateDelivery && !this.form.certificateDeliveryMethod) return false
      if (this.requiresShipping && !this.form.certificateShippingService) return false
      if (this.requiresShipping && !this.certificateAddressSource) return false
      if (this.requiresShipping && this.certificateAddressSource === 'workAddress' &&
        !this.meaningfulText(this.form.certificateDeliveryAddress.companyName)) return false
      if (this.requiresShipping && this.addressFields.some(field => (
        field.required && !this.meaningfulText(this.form.certificateDeliveryAddress[field.key])
      ))) return false
      if (this.form.hasFoodAllergy === 'yes' && !this.meaningfulText(this.form.foodAllergyNote)) return false
      return true
    },
    errors () {
      if (!this.validationAttempted) return {}
      const errors = {}
      if (!this.form.ceremonyStatus) errors.ceremonyStatus = true
      if (this.requiresAssistanceType && !this.form.ceremonyAssistanceType) errors.ceremonyAssistanceType = true
      if (this.requiresCertificateDelivery && !this.form.certificateDeliveryMethod) errors.certificateDeliveryMethod = true
      if (this.requiresShipping && !this.form.certificateShippingService) errors.certificateShippingService = true
      if (this.requiresShipping && !this.certificateAddressSource) errors.certificateAddressSource = true
      const missingCompanyName = this.certificateAddressSource === 'workAddress' &&
        !this.meaningfulText(this.form.certificateDeliveryAddress.companyName)
      if (this.requiresShipping && (missingCompanyName || this.addressFields.some(field => field.required && !this.meaningfulText(this.form.certificateDeliveryAddress[field.key])))) {
        errors.certificateDeliveryAddress = true
      }
      if (this.form.hasFoodAllergy === 'yes' && !this.meaningfulText(this.form.foodAllergyNote)) errors.foodAllergyNote = true
      return errors
    }
  },
  mounted () {
    this.load()
  },
  methods: {
    meaningfulText (value) {
      const text = String(value == null ? '' : value).trim()
      return text && text !== '-' ? text : ''
    },
    hasAddressValue (address) {
      return Object.keys(address || {}).some(key => !!this.meaningfulText(address[key]))
    },
    errorFor (field) { return !!this.errors[field] },
    addressFieldError (field) {
      return this.validationAttempted && this.requiresShipping && field.required &&
        !this.meaningfulText(this.form.certificateDeliveryAddress[field.key])
    },
    companyNameError () {
      return this.validationAttempted && this.requiresShipping &&
        this.certificateAddressSource === 'workAddress' &&
        !this.meaningfulText(this.form.certificateDeliveryAddress.companyName)
    },
    selectCertificateAddress (sourceKey) {
      const source = this.registration && this.registration[sourceKey]
      this.certificateAddressSource = sourceKey
      this.form.certificateDeliveryAddress = Object.assign(emptyAddress(), source || {})
    },
    normalizeCode (value) {
      if (value && value.target) return this.normalizeCode(value.target.value)
      if (value && typeof value === 'object' && value.value !== undefined) return this.normalizeCode(value.value)
      const match = String(value == null ? '' : value).match(/\d+/)
      return match ? match[0] : ''
    },
    normalizeValue (value) {
      if (value && value.target) return this.normalizeValue(value.target.value)
      if (value && typeof value === 'object' && value.value !== undefined) return this.normalizeValue(value.value)
      return String(value == null ? '' : value)
    },
    onCeremonyStatusChange (value) {
      this.form.ceremonyStatus = this.normalizeCode(value)
      if (!this.requiresAssistanceType) this.form.ceremonyAssistanceType = ''
      if (!this.requiresCertificateDelivery) {
        this.form.certificateDeliveryMethod = ''
        this.form.certificateShippingService = ''
      }
    },
    onCertificateMethodChange (value) {
      this.form.certificateDeliveryMethod = this.normalizeValue(value)
      if (!this.requiresShipping) {
        this.form.certificateShippingService = ''
        this.certificateAddressSource = ''
      }
    },
    onFoodAllergyChange (value) {
      this.form.hasFoodAllergy = this.normalizeValue(value) === 'yes' ? 'yes' : 'no'
      if (this.form.hasFoodAllergy !== 'yes') this.form.foodAllergyNote = ''
    },
    async load () {
      this.loading = true
      try {
        const response = await api.graduateRegistrations('defaults')
        const row = response && response.data ? response.data.data : null
        this.registration = row || null
        this.certificateAddressSource = ''
        this.form = Object.assign(emptyForm(), {
          ceremonyStatus: this.normalizeCode(row && row.ceremonyStatus),
          ceremonyAssistanceType: this.normalizeCode(row && row.ceremonyAssistanceType),
          ceremonyStatusNote: this.meaningfulText(row && row.ceremonyStatusNote),
          certificateDeliveryMethod: this.meaningfulText(row && row.certificateDeliveryMethod),
          certificateShippingService: this.meaningfulText(row && row.certificateShippingService),
          certificateDeliveryAddress: Object.assign(emptyAddress(), row && row.certificateDeliveryAddress),
          hasFoodAllergy: row && row.hasFoodAllergy === 'yes' ? 'yes' : 'no',
          foodAllergyNote: this.meaningfulText(row && row.foodAllergyNote)
        })
      } catch (error) {
        notifyError(this.$store, this.isEnglish ? 'Unable to load information.' : 'ไม่สามารถโหลดข้อมูลได้')
      } finally {
        this.loading = false
      }
    },
    async save () {
      this.validationAttempted = true
      if (Object.keys(this.errors).length) return
      this.saving = true
      try {
        const payload = Object.assign({}, this.registration || {}, this.form)
        const id = this.registration && (this.registration._id || this.registration.id)
        const response = id
          ? await api.graduateRegistrations('update', Object.assign({ _id: id }, payload))
          : await api.graduateRegistrations('create', payload)
        this.registration = response && response.data ? response.data.data : payload
        this.validationAttempted = false
        markGraduationStep(this.currentProfile, 'ceremonySaved', { ceremonyStatus: this.form.ceremonyStatus })
        notifySuccess(this.$store, this.isEnglish ? 'Information saved.' : 'บันทึกข้อมูลเรียบร้อยแล้ว')
        const progress = getGraduationProgress(this.currentProfile)
        if (isFaceRegistrationEnabled(progress)) {
          this.$router.push('/graduation/face-checkin')
        } else if (['50', '60', '70'].includes(this.form.ceremonyStatus)) {
          this.$router.push('/graduation/register')
        }
      } catch (error) {
        notifyError(this.$store, this.isEnglish ? 'Unable to save information.' : 'ไม่สามารถบันทึกข้อมูลได้')
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style scoped>
.ceremony-page { padding: 0.25rem; }
.ceremony-header { margin-bottom: 20px; }
.ceremony-header h1 {
  margin: 0;
  color: #1f2937;
  font-size: 30px;
  font-weight: 700;
  user-select: none;
}
.ceremony-card { border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06); }
.section-heading { margin-bottom: 16px; }
.section-heading h2 { margin: 0; color: #1f2937; font-size: 20px; font-weight: 800; }
.required-mark { margin-left: 4px; color: #e55353; }
.loading-state { display: flex; align-items: center; justify-content: center; min-height: 140px; color: #6b7280; }
.certificate-block, .allergy-block { margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid #e5e7eb; }
.certificate-block h3, .delivery-address h3 { margin-bottom: 14px; font-size: 17px; font-weight: 800; }
.shipping-service-field { min-width: 0; margin: 0; padding: 0; border: 0; }
.shipping-service-field legend {
  width: auto;
  margin-bottom: 0.5rem;
  color: #3c4b64;
  font-size: 0.875rem;
}
.shipping-service-options {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
}
.shipping-service-option {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-height: 142px;
  padding: 1.25rem 4rem 1.15rem 1.25rem;
  color: #3c4b64;
  text-align: left;
  border: 1px solid #e2e5e9;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease, transform 0.18s ease;
}
.shipping-service-option:hover {
  border-color: #a31313;
  box-shadow: 0 8px 20px rgba(163, 19, 19, 0.1);
  transform: translateY(-1px);
}
.shipping-service-option:focus {
  outline: 0;
  border-color: #a31313;
  box-shadow: 0 0 0 3px rgba(163, 19, 19, 0.15);
}
.shipping-service-option.is-selected {
  border-color: #a31313;
  background: linear-gradient(135deg, #fffafa 0%, #fff5f5 100%);
  box-shadow: 0 0 0 1px #a31313, 0 8px 22px rgba(163, 19, 19, 0.1);
}
.shipping-service-option strong {
  margin-bottom: 0.6rem;
  color: #111827;
  font-size: 1rem;
  line-height: 1.4;
}
.shipping-service-option__description {
  margin-bottom: 0.85rem;
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
}
.shipping-service-option__fee {
  margin-top: auto;
  color: #a31313;
  font-size: 1rem;
  font-weight: 800;
}
.shipping-service-option__check {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: transparent;
  border: 1px solid #cfd3d8;
  border-radius: 50%;
  background: #fff;
  font-size: 16px;
  font-weight: 800;
}
.shipping-service-option.is-selected .shipping-service-option__check {
  color: #fff;
  border-color: #a31313;
  background: #a31313;
  box-shadow: 0 3px 8px rgba(163, 19, 19, 0.28);
}
.shipping-service-field.is-invalid .shipping-service-options {
  padding: 3px;
  border: 1px solid #e55353;
  border-radius: 10px;
}
.address-source-field {
  min-width: 0;
  margin: 0 0 1.25rem;
  padding: 0;
  border: 0;
}
.address-source-field legend {
  width: auto;
  margin-bottom: 0.6rem;
  color: #3c4b64;
  font-size: 0.875rem;
  font-weight: 600;
}
.address-source-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
}
.address-source-option {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 92px;
  padding: 1rem 3.5rem 1rem 1rem;
  color: #3c4b64;
  text-align: left;
  border: 1px solid #e2e5e9;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease, transform 0.18s ease;
}
.address-source-option:hover {
  border-color: #a31313;
  box-shadow: 0 8px 20px rgba(163, 19, 19, 0.1);
  transform: translateY(-1px);
}
.address-source-option:focus {
  outline: 0;
  border-color: #a31313;
  box-shadow: 0 0 0 3px rgba(163, 19, 19, 0.15);
}
.address-source-option.is-selected {
  border-color: #a31313;
  background: linear-gradient(135deg, #fffafa 0%, #fff5f5 100%);
  box-shadow: 0 0 0 1px #a31313, 0 8px 22px rgba(163, 19, 19, 0.1);
}
.address-source-option > .c-icon {
  flex: 0 0 auto;
  width: 25px;
  height: 25px;
  margin-right: 0.75rem;
  color: #a31313;
}
.address-source-option strong {
  color: #111827;
  font-size: 0.95rem;
}
.address-source-option__check {
  position: absolute;
  top: 50%;
  right: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  transform: translateY(-50%);
  color: transparent;
  border: 1px solid #cfd3d8;
  border-radius: 50%;
  background: #fff;
  font-size: 16px;
  font-weight: 800;
}
.address-source-option.is-selected .address-source-option__check {
  color: #fff;
  border-color: #a31313;
  background: #a31313;
  box-shadow: 0 3px 8px rgba(163, 19, 19, 0.28);
}
.address-source-field.is-invalid .address-source-options {
  padding: 3px;
  border: 1px solid #e55353;
  border-radius: 10px;
}
.address-input-col > label {
  display: block;
  margin-bottom: 0.5rem;
  color: #3c4b64;
  font-size: 0.875rem;
}
@media (max-width: 1199.98px) {
  .shipping-service-options { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 575.98px) {
  .shipping-service-options {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.6rem;
  }
  .shipping-service-option {
    min-height: 160px;
    padding: 0.85rem 0.75rem;
  }
  .shipping-service-option strong {
    padding-right: 1.75rem;
    font-size: 0.82rem;
  }
  .shipping-service-option__description {
    font-size: 0.72rem;
    line-height: 1.4;
  }
  .shipping-service-option__fee { font-size: 0.9rem; }
  .shipping-service-option__check {
    top: 0.7rem;
    right: 0.65rem;
    width: 22px;
    height: 22px;
    font-size: 13px;
  }
  .address-source-options { grid-template-columns: 1fr; }
}
.delivery-address { margin-top: 1rem; }
.food-allergy-note--readonly ::v-deep textarea {
  color: #374151;
  background: #e5e7eb;
  pointer-events: none;
}
.form-actions { display: flex; justify-content: flex-end; margin-top: 1.25rem; }
.form-actions .btn {
  min-width: 220px;
  min-height: 46px;
  border-color: #a31313;
  border-radius: 9px;
  background: #a31313;
  box-shadow: 0 4px 10px rgba(163, 19, 19, 0.2);
  font-weight: 700;
}
.form-actions .btn:hover,
.form-actions .btn:focus {
  border-color: #861010;
  background: #861010;
}
.form-actions .btn:disabled,
.form-actions .btn.disabled {
  border-color: #b76a6a;
  background: #b76a6a;
  box-shadow: 0 4px 10px rgba(140, 21, 21, 0.12);
  cursor: not-allowed;
  opacity: 0.78;
}
</style>
