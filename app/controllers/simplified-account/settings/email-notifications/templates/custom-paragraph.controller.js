const { response } = require('@utils/response')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { updateCustomParagraphByServiceIdAndAccountType } = require('@services/email.service')
const { validateOptionalField } = require('@utils/validation/server-side-form-validations')
const logger = require('@utils/logger')(__filename)
const CUSTOM_PARAGRAPH_MAX_LENGTH = 5000

function get (req, res) {
  const account = req.account
  response(req, res, 'simplified-account/settings/email-notifications/custom-paragraph', {
    customParagraphText: account.rawResponse.email_notifications.PAYMENT_CONFIRMED.template_body,
    serviceName: req.service.name,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.templates,
      req.service.externalId, account.type)
  })
}

async function post (req, res) {
  const serviceExternalId = req.service.externalId
  const serviceName = req.service.name
  const accountType = req.account.type
  const customParagraph = req.body['custom-paragraph']

  const validationResult = validateOptionalField(customParagraph, CUSTOM_PARAGRAPH_MAX_LENGTH, 'custom paragraph')
  if (!validationResult.valid) {
    return response(req, res, 'simplified-account/settings/email-notifications/custom-paragraph', {
      errors: {
        customParagraph: validationResult.message
      },
      customParagraphText: customParagraph,
      serviceName,
      backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.templates,
        req.service.externalId, accountType)
    })
  }

  await updateCustomParagraphByServiceIdAndAccountType(serviceExternalId, accountType, customParagraph)
  logger.info('Updated email notifications custom paragraph')
  req.flash('messages', { state: 'success', icon: '&check;', heading: 'Custom paragraph updated' })
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.templates,
    serviceExternalId, accountType))
}

module.exports = {
  get,
  post
}
