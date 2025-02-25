const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const paths = require('@root/paths')
const { response } = require('@utils/response')
const { constants } = require('@govuk-pay/pay-js-commons')
const webhooksService = require('@services/webhooks.service')
const { webhookSchema, webhookErrorIdentifiers } = require('@utils/simplified-account/validation/webhook.schema')
const { validationResult } = require('express-validator')
const formatValidationErrors = require('@utils/simplified-account/format/format-validation-errors')
const { responseWithErrors } = require('@controllers/simplified-account/settings/webhooks/create/create.controller')
const WebhookUpdateRequest = require('@models/webhooks/WebhookUpdateRequest.class')

/**
 *
 * @param req {SimplifiedAccountRequest}
 * @param res
 * @returns {Promise<void>}
 */
async function get (req, res) {
  const webhook = await webhooksService.getWebhook(req.params.webhookExternalId, req.service.externalId, req.account.id)

  response(req, res, 'simplified-account/settings/webhooks/edit', {
    form: {
      callbackUrl: webhook.callbackUrl, description: webhook.description, subscriptions: webhook.subscriptions
    },
    eventTypes: constants.webhooks.humanReadableSubscriptions,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.index, req.service.externalId, req.account.type)
  })
}

/**
 *
 * @param req {SimplifiedAccountRequest}
 * @param res
 * @param next {function}
 * @returns {Promise<void>}
 */
async function post (req, res, next) {
  const validations = [
    webhookSchema.callbackUrl.validate,
    webhookSchema.description.validate,
    webhookSchema.subscriptions.validate
  ]
  await Promise.all(validations.map(validation => validation.run(req)))
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    const formattedValidationErrors = formatValidationErrors(validationErrors)
    return responseWithErrors(req, res, formattedValidationErrors)
  }

  const webhookUpdateRequest = new WebhookUpdateRequest()
    .replace().description(req.body.description)
    .replace().callbackUrl(req.body.callbackUrl)
    .replace().subscriptions(typeof (req.body.subscriptions) === 'string' ? [req.body.subscriptions] : req.body.subscriptions)

  try {
    await webhooksService.updateWebhook(req.params.webhookExternalId, req.service.externalId, req.account.id, webhookUpdateRequest)
  } catch (updateWebhookError) {
    if (updateWebhookError.errorIdentifier in webhookErrorIdentifiers) {
      const callbackErrorMessage = webhookErrorIdentifiers[updateWebhookError.errorIdentifier]
      const callbackUrlError = {
        errorSummary: [{ text: callbackErrorMessage, href: '#callback-url' }],
        formErrors: { callbackUrl: callbackErrorMessage }
      }
      return responseWithErrors(req, res, callbackUrlError)
    } else {
      return next(updateWebhookError)
    }
  }

  return res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.index, req.service.externalId, req.account.type))
}

module.exports = {
  get,
  post
}
