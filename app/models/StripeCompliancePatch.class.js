'use strict'

const { PhoneNumberUtil, PhoneNumberFormat } = require('google-libphonenumber')
const phoneUtil = PhoneNumberUtil.getInstance()

// const ORGANISATION_EMAIL_FIELD = 'organisation-email'
const ORGANISATION_URL_FIELD = 'organisation-url'
const ORGANISATION_PHONE_FIELD = 'organisation-phone'
const RESPONSIBLE_PERSON_EMAIL_FIELD = 'person-email'
const RESPONSIBLE_PERSON_NUMBER_FIELD = 'person-number'
const RESPONSIBLE_PERSON_JOB_TITLE_FIELD = 'person-job-title'
const RESPONSIBLE_PERSON_DOCUMENT_FIELD = 'person-document'

const stripeCompliancePatchFields = {
  // ORGANISATION_EMAIL_FIELD,
  ORGANISATION_URL_FIELD,
  ORGANISATION_PHONE_FIELD,
  RESPONSIBLE_PERSON_EMAIL_FIELD,
  RESPONSIBLE_PERSON_NUMBER_FIELD,
  RESPONSIBLE_PERSON_JOB_TITLE_FIELD,
  RESPONSIBLE_PERSON_DOCUMENT_FIELD
}
const GOVERNMENT_SERVICES_MERCHANT_CATEGORY = 9399

class AccountPatch {
  constructor (form) {
    this.person = {
      email: form[RESPONSIBLE_PERSON_EMAIL_FIELD]
    }
    this.organisation = {
      // email: form[ORGANISATION_EMAIL_FIELD],
      url: form[ORGANISATION_URL_FIELD],
      phone: form[ORGANISATION_PHONE_FIELD]
    }
  }

  payload () {
    return {
      email: this.person.email,
      company: {
        directors_provided: true,
        owners_provided: true,
        executives_provided: true,
        phone: this.organisation.phone
      },
      business_profile: {
        mcc: GOVERNMENT_SERVICES_MERCHANT_CATEGORY,
        url: this.organisation.url
      }
    }
  }
}

class PersonPatch {
  constructor (form) {
    this.person = {
      documentId: form[RESPONSIBLE_PERSON_DOCUMENT_FIELD],
      title: form[RESPONSIBLE_PERSON_JOB_TITLE_FIELD],
      email: form[RESPONSIBLE_PERSON_EMAIL_FIELD],
      phone: form[RESPONSIBLE_PERSON_NUMBER_FIELD]
    }
  }

  payload () {
    const number = phoneUtil.parse(this.person.phone, 'GB')

    return {
      relationship: {
        representative: true,
        executive: true,
        title: this.person.title
      },
      email: this.person.email,
      phone: phoneUtil.format(number, PhoneNumberFormat.INTERNATIONAL),

      // we only want to include the uploaded document if it has been passed through
      ...this.person.documentId && {
        verification: {
          additional_document: {
            front: this.person.documentId
          }
        }
      }
    }
  }
}

module.exports = {
  stripeCompliancePatchFields,
  AccountPatch,
  PersonPatch
}
