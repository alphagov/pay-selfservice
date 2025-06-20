const { response } = require('@utils/response')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { updateCustomParagraphByServiceIdAndAccountType } = require('@services/email.service')
const { body, validationResult } = require('express-validator')
const { formatValidationErrors } = require('@utils/simplified-account/format/format-validation-errors')
const CUSTOM_PARAGRAPH_MAX_LENGTH = 5000

function get (req, res) {
  const account = req.account
  const service = req.service

  response(req, res, 'simplified-account/settings/email-notifications/custom-paragraph', {
    customParagraph: account.rawResponse.email_notifications.PAYMENT_CONFIRMED.template_body,
    serviceName: service.name,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.templates,
      service.externalId, account.type),
    removeCustomParagraphLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.removeCustomParagraph,
      service.externalId, account.type)
  })
}

async function postEditCustomParagraph (req, res) {
  const serviceExternalId = req.service.externalId
  const accountType = req.account.type
  const validations = [
    body('customParagraph').trim().isLength({ max: CUSTOM_PARAGRAPH_MAX_LENGTH }).withMessage(`Custom paragraph name must be ${CUSTOM_PARAGRAPH_MAX_LENGTH} characters or fewer`)
  ]

  await Promise.all(validations.map(validation => validation.run(req)))
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/settings/email-notifications/custom-paragraph', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors
      },
      customParagraph: req.body.customParagraph,
      serviceName: req.service.name,
      backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.templates,
        req.service.externalId, accountType),
      removeCustomParagraphLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.removeCustomParagraph,
        req.service.externalId, accountType)
    })
  }

  const newCustomParagraph = req.body.customParagraph.trim()
  await updateCustomParagraphByServiceIdAndAccountType(serviceExternalId, accountType, newCustomParagraph)

  if (newCustomParagraph && newCustomParagraph.length > 0) {
    req.flash('messages', { state: 'success', icon: '&check;', heading: 'Custom paragraph updated' })
  }

  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.templates,
    serviceExternalId, accountType))
}

async function postRemoveCustomParagraph (req, res) {
  const serviceExternalId = req.service.externalId
  const accountType = req.account.type

  await updateCustomParagraphByServiceIdAndAccountType(serviceExternalId, accountType, '')
  req.flash('messages', { state: 'success', icon: '&check;', heading: 'Custom paragraph removed' })
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.templates,
    serviceExternalId, accountType))
}

module.exports = {
  get,
  postEditCustomParagraph,
  postRemoveCustomParagraph
}
