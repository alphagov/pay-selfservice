'use strict'

const logger = require('../../../utils/logger')(__filename)
const paths = require('../../../paths')
const { response } = require('../../../utils/response')
const stripeClient = require('../../../services/clients/stripe/stripe.client')

const { validateMandatoryField, validateEmail, validatePhoneNumber } = require('../../../utils/validation/server-side-form-validations')

const ORGANISATION_EMAIL_FIELD = 'organisation-email'
const ORGANISATION_URL_FIELD = 'organisation-url'
const RESPONSIBLE_PERSON_EMAIL_FIELD = 'person-email'
const RESPONSIBLE_PERSON_NUMBER_FIELD = 'person-number'
const RESPONSIBLE_PERSON_JOB_TITLE_FIELD = 'person-job-title'
const RESPONSIBLE_PERSON_DOCUMENT_FIELD = 'person-document'

const validationRules = [
  { field: ORGANISATION_EMAIL_FIELD, validator: validateEmail },
  { field: ORGANISATION_URL_FIELD, validator: validateMandatoryField },
  { field: RESPONSIBLE_PERSON_EMAIL_FIELD, validator: validateEmail },
  { field: RESPONSIBLE_PERSON_NUMBER_FIELD, validator: validatePhoneNumber },
  { field: RESPONSIBLE_PERSON_JOB_TITLE_FIELD, validator: validateMandatoryField }
]

async function compliancePage (req, res, next) {
  const { stripeAccountId } = res.locals.stripeAccount

  try {
    const responsiblePerson = await stripeClient.retrieveResponsiblePerson(stripeAccountId)
    response(req, res, 'stripe-setup/compliance/index', { responsiblePerson })
  } catch (error) {
    next(error)
  }
}

async function updateStripeAccountForCompliance (req, res, next) {
  const { stripeAccountId } = res.locals.stripeAccount
  const fields = validationRules.map((validationRule) => validationRule.field)
  const form = fields.reduce((aggregatedForm, field) => {
    const value = req.body[field] || ''
    aggregatedForm[field] = value.trim()
    return aggregatedForm
  }, {})
  const errors = validationRules.reduce((errors, validationRule) => {
    const error = validationRule.validator(form[validationRule.field])
    if (error) {
      errors[validationRule.field] = error.message
    }
    return errors
  }, {})

  if (!req.file) {
    errors[RESPONSIBLE_PERSON_DOCUMENT_FIELD] = 'Select a verification document'
  } else {
    if (req.file.size > 10000000) {
      errors[RESPONSIBLE_PERSON_DOCUMENT_FIELD] = 'The selected file must be smaller than 10MB'
    }
    if (!['image/png', 'image/jpeg', 'application/pdf'].includes(req.file.mimetype)) {
      errors[RESPONSIBLE_PERSON_DOCUMENT_FIELD] = 'The selected file must be a PNG, JPG or PDF'
    }
  }

  try {
    if (Object.keys(errors).length) {
      const responsiblePerson = await stripeClient.retrieveResponsiblePerson(stripeAccountId)
      return response(req, res, 'stripe-setup/compliance/index', { form, errors, responsiblePerson })
    }

    res.redirect(303, paths.stripe.addPspAccountDetails)
    logger.info('Updated Stripe account compliance information', { stripeAccountId, requestId: req.correlationId })
  } catch (error) {
    logger.error('Could not update Stripe account compliance information', { stripeAccountId, requestId: req.correlationId })
    next(error)
  }
}

module.exports = {
  compliancePage: compliancePage,
  updateStripeAccountForCompliance: updateStripeAccountForCompliance
}
