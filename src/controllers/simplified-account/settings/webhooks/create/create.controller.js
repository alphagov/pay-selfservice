const paths = require('@root/paths')
const { response } = require('@utils/response')
const { constants } = require('@govuk-pay/pay-js-commons')
const { validationResult } = require('express-validator')
const { webhookErrorIdentifiers, CREATE_AND_UPDATE_WEBHOOK_VALIDATIONS } = require('@utils/simplified-account/validation/webhook.schema')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const formatValidationErrors = require('@utils/simplified-account/format/format-validation-errors')
const webhooksService = require('@services/webhooks.service')

async function get (req, res) {
  response(req, res, 'simplified-account/settings/webhooks/edit', {
    eventTypes: constants.webhooks.humanReadableSubscriptions,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.index, req.service.externalId, req.account.type)
  })
}

async function post (req, res, next) {
  const accountIsLive = req.account.type === 'live'
  for (const validation of CREATE_AND_UPDATE_WEBHOOK_VALIDATIONS) {
    await validation.run(req)
  }
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    const formattedValidationErrors = formatValidationErrors(validationErrors)
    return responseWithErrors(req, res, formattedValidationErrors)
  }
  try {
    await webhooksService.createWebhook(req.service.externalId, req.account.id, accountIsLive, req.body)
    res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.index, req.service.externalId, req.account.type))
  } catch (createWebhookError) {
    if (createWebhookError.errorIdentifier in webhookErrorIdentifiers) {
      const callbackErrorMessage = webhookErrorIdentifiers[createWebhookError.errorIdentifier]
      const callbackUrlError = {
        errorSummary: [{ text: callbackErrorMessage, href: '#callback-url' }],
        formErrors: { callbackUrl: callbackErrorMessage }
      }
      return responseWithErrors(req, res, callbackUrlError)
    } else {
      next(createWebhookError)
    }
  }
}

const responseWithErrors = (req, res, errors) => {
  const subscriptions = typeof req.body.subscriptions === 'string' ? [req.body.subscriptions] : req.body.subscriptions
  return response(req, res, 'simplified-account/settings/webhooks/edit', {
    form: { callbackUrl: req.body.callbackUrl, description: req.body.description, subscriptions },
    errors: {
      summary: errors.errorSummary,
      formErrors: errors.formErrors
    },
    eventTypes: constants.webhooks.humanReadableSubscriptions,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.index, req.service.externalId, req.account.type)
  })
}

module.exports = {
  get,
  post,
  responseWithErrors
}
