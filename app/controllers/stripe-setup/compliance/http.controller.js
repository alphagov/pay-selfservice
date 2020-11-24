'use strict'

const logger = require('../../../utils/logger')(__filename)
const paths = require('../../../paths')
const { response } = require('../../../utils/response')
const stripeClient = require('../../../services/clients/stripe/stripe.client')

const { validateMandatoryField, validateEmail, validatePhoneNumber } = require('../../../utils/validation/server-side-form-validations')

const { stripeCompliancePatchFields, AccountPatch, PersonPatch } = require('../../../models/StripeCompliancePatch.class')

const validationRules = [
  // { field: stripeCompliancePatchFields.ORGANISATION_EMAIL_FIELD, validator: validateEmail },
  { field: stripeCompliancePatchFields.ORGANISATION_URL_FIELD, validator: validateMandatoryField },
  { field: stripeCompliancePatchFields.RESPONSIBLE_PERSON_EMAIL_FIELD, validator: validateEmail },
  { field: stripeCompliancePatchFields.RESPONSIBLE_PERSON_NUMBER_FIELD, validator: validatePhoneNumber },
  { field: stripeCompliancePatchFields.RESPONSIBLE_PERSON_JOB_TITLE_FIELD, validator: validateMandatoryField }
]

function validateDocumentFile (file) {
  if (!file) {
    return 'Select a verification document'
  }

  if (file.size > 10000000) {
    return 'The selected file must be smaller than 10MB'
  }
  if (!['image/png', 'image/jpeg', 'application/pdf'].includes(file.mimetype)) {
    return 'The selected file must be a PNG, JPG or PDF'
  }
  return null
}

async function compliancePage (req, res, next) {
  const { stripeAccountId } = res.locals.stripeAccount

  try {
    const responsiblePerson = await stripeClient.retrieveResponsiblePerson(stripeAccountId)
    const personIsVerified = responsiblePerson.verification.status === 'verified'
    response(req, res, 'stripe-setup/compliance/index', { responsiblePerson, personIsVerified })
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
    const result = validationRule.validator(form[validationRule.field])
    if (!result.valid) {
      errors[validationRule.field] = result.message
    }
    return errors
  }, {})

  try {
    const responsiblePerson = await stripeClient.retrieveResponsiblePerson(stripeAccountId)
    const personIsVerified = responsiblePerson.verification.status === 'verified'

    // if the user is already verified we aren't expecting a document upload
    const documentError = personIsVerified === false && validateDocumentFile(req.file)
    if (documentError) errors[stripeCompliancePatchFields.RESPONSIBLE_PERSON_DOCUMENT_FIELD] = documentError

    if (Object.keys(errors).length) {
      return response(req, res, 'stripe-setup/compliance/index', { form, errors, responsiblePerson, personIsVerified })
    }

    // we only need to patch the identity document if this user isn't already verified
    if (!personIsVerified) {
      const document = await stripeClient.uploadIdentificationDocument(stripeAccountId, req.file.originalname, req.file.buffer)
      logger.info('Uploaded document for unverified person', { stripeAccountId, requestId: req.correlationId, personId: responsiblePerson.id })
      form[stripeCompliancePatchFields.RESPONSIBLE_PERSON_DOCUMENT_FIELD] = document.id
    }

    const personPatch = new PersonPatch(form)

    await stripeClient.patchPersonForCompliance2020(stripeAccountId, responsiblePerson.id, personPatch)
    logger.info('Updated Stripe account compliance for responsible person person', { stripeAccountId, requestId: req.correlationId })

    form[stripeCompliancePatchFields.ORGANISATION_PHONE_FIELD] = req.service && req.service.merchantDetails.telephone_number
    const accountPatch = new AccountPatch(form)

    await stripeClient.patchAccountForCompliance2020(stripeAccountId, accountPatch)
    logger.info('Updated Stripe account compliance for account structure', { stripeAccountId, requestId: req.correlationId })
    res.redirect(303, paths.stripe.addPspAccountDetails)
  } catch (error) {
    logger.error('Could not update Stripe account compliance information', { stripeAccountId, requestId: req.correlationId, message: error.message })
    next(error)
  }
}

module.exports = {
  compliancePage: compliancePage,
  updateStripeAccountForCompliance: updateStripeAccountForCompliance
}
