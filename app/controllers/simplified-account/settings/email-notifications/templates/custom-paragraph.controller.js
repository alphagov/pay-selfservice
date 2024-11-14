const { response } = require('@utils/response')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { updateConfirmationTemplateByServiceIdAndAccountType } = require('@services/email.service')
const { validateOptionalField } = require('@utils/validation/server-side-form-validations')
const logger = require('@utils/logger')(__filename)
const CUSTOM_PARAGRAPH_MAX_LENGTH = 5000

function get (req, res) {
  const account = req.account
  response(req, res, 'simplified-account/settings/email-notifications/custom-paragraph', {
    customEmailText: account.email_notifications.PAYMENT_CONFIRMED.template_body,
    serviceName: account.service_name,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.templates,
      req.service.externalId, account.type)
  })
}

async function post (req, res) {
  const serviceExternalId = req.service.externalId
  const serviceName = req.account.service_name
  const accountType = req.account.type
  const customEmailText = req.body['custom-email-text']

  const validationResult = validateOptionalField(customEmailText, CUSTOM_PARAGRAPH_MAX_LENGTH, 'custom paragraph')
  if (!validationResult.valid) {
    return response(req, res, 'simplified-account/settings/email-notifications/custom-paragraph', {
      errors: {
        customEmailText: validationResult.message
      },
      customEmailText,
      serviceName,
      backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.templates,
        req.service.externalId, accountType)
    })
  }

  await updateConfirmationTemplateByServiceIdAndAccountType(serviceExternalId, accountType, customEmailText)
  logger.info('Updated email notifications custom paragraph')
  req.flash('messages', { state: 'success', icon: '&check;', heading: 'Custom paragraph updated' })
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.templates,
    serviceExternalId, accountType))
}

module.exports = {
  get,
  post
}
