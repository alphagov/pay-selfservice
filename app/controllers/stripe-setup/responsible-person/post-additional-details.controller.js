'use strict'

const lodash = require('lodash')

const logger = require('../../../utils/logger')(__filename)
const paths = require('../../../paths')
const formatAccountPathsFor = require('../../../utils/format-account-paths-for')
const { getCurrentCredential } = require('../../../utils/credentials')
const { validationErrors } = require('../../../utils/validation/field-validation-checks')
const {
  validateField,
  getFormFields,
  getStripeAccountId,
  getExistingResponsiblePersonName,
  completeKyc
} = require('../stripe-setup.util')
const { response } = require('../../../utils/response')
const {
  validatePhoneNumber,
  validateEmail
} = require('../../../utils/validation/server-side-form-validations')
const { formatPhoneNumberWithCountryCode } = require('../../../utils/telephone-number-utils')
const { listPersons, updatePersonAddAdditionalKYCDetails } = require('../../../services/clients/stripe/stripe.client')
const { isKycTaskListComplete } = require('../../../controllers/your-psp/kyc-tasks.service')

const TELEPHONE_NUMBER_FIELD = 'telephone-number'
const EMAIL_FIELD = 'email'

const validationRules = [
  {
    field: TELEPHONE_NUMBER_FIELD,
    validator: validatePhoneNumber
  },
  {
    field: EMAIL_FIELD,
    validator: validateEmail
  }
]

module.exports = async function submitResponsiblePerson (req, res, next) {
  const currentCredential = getCurrentCredential(req.account)

  const fields = [
    TELEPHONE_NUMBER_FIELD,
    EMAIL_FIELD
  ]

  const formFields = getFormFields(req.body, fields)

  const errors = validationRules.reduce((errors, validationRule) => {
    const errorMessage = validateField(formFields[validationRule.field], validationRule.validator, validationRule.maxLength)
    if (errorMessage) {
      errors[validationRule.field] = errorMessage
    }
    return errors
  }, {})

  const pageData = {
    telephone: formFields[TELEPHONE_NUMBER_FIELD],
    email: formFields[EMAIL_FIELD]
  }

  if (!lodash.isEmpty(errors)) {
    pageData['errors'] = errors
    const responsiblePersonName = await getExistingResponsiblePersonName(req.account, false, req.correlationId)
    return response(req, res, 'stripe-setup/responsible-person/kyc-additional-information', {
      ...pageData,
      responsiblePersonName,
      currentCredential
    })
  } else {
    try {
      const stripeAccountId = await getStripeAccountId(req.account, false, req.correlationId)
      const personsResponse = await listPersons(stripeAccountId)
      const responsiblePerson = personsResponse.data.filter(person => person.relationship && person.relationship.representative).pop()

      if (!responsiblePerson) {
        return next(new Error('No responsible person exists for Stripe account'))
      }

      const stripePerson = {
        phone: formatPhoneNumberWithCountryCode(formFields[TELEPHONE_NUMBER_FIELD]),
        email: formFields[EMAIL_FIELD]
      }
      await updatePersonAddAdditionalKYCDetails(stripeAccountId, responsiblePerson.id, stripePerson)
      logger.info('Added phone and email to existing responsible person', {
        stripe_account_id: stripeAccountId
      })

      const taskListComplete = await isKycTaskListComplete(currentCredential)
      if (taskListComplete) {
        await completeKyc(req.account.gateway_account_id, req.service, stripeAccountId, req.correlationId)
        req.flash('generic', 'You’ve successfully added all the Know your customer details for this service.')
      } else {
        req.flash('generic', 'Responsible person details added successfully')
      }
      return res.redirect(303, formatAccountPathsFor(paths.account.yourPsp.index, req.account && req.account.external_id, currentCredential.external_id))
    } catch (err) {
      if (err && err.type === 'StripeInvalidRequestError' && err.param === 'phone') {
        const responsiblePersonName = await getExistingResponsiblePersonName(req.account, false, req.correlationId)
        return response(req, res, 'stripe-setup/responsible-person/kyc-additional-information', {
          ...pageData,
          responsiblePersonName,
          currentCredential,
          errors: {
            [TELEPHONE_NUMBER_FIELD]: validationErrors.invalidTelephoneNumber
          }
        })
      }
      next(err)
    }
  }
}
