const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const paths = require('@root/paths')
const { response } = require('@utils/response')
const { constants } = require('@govuk-pay/pay-js-commons')
const webhooksService = require('@services/webhooks.service')
const { webhookErrorIdentifiers, CREATE_AND_UPDATE_WEBHOOK_VALIDATIONS } = require('@utils/simplified-account/validation/webhook.schema')
const { validationResult } = require('express-validator')
const { responseWithErrors } = require('@controllers/simplified-account/settings/webhooks/create/create.controller')
const WebhookUpdateRequest = require('@models/webhooks/WebhookUpdateRequest.class')
const { ValidationError } = require('@root/errors')

/**
 *
 * @param req {SimplifiedAccountRequest} // TODO rename this when simplified accounts are live
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
 * @param req {SimplifiedAccountRequest} // TODO rename this when simplified accounts are live
 * @param res
 * @param next {function}
 * @returns {Promise<void>}
 */
async function post (req, res, next) {
  await Promise.all(CREATE_AND_UPDATE_WEBHOOK_VALIDATIONS.map(validation => validation.run(req)))
  const validationErrors = validationResult(req)
  const subscriptions = typeof req.body.subscriptions === 'string' ? [req.body.subscriptions] : req.body.subscriptions

  if (!validationErrors.isEmpty()) {
    // const subscriptions = typeof req.body.subscriptions === 'string' ? [req.body.subscriptions] : req.body.subscriptions
    throw new ValidationError('simplified-account/settings/webhooks/edit', validationErrors, {
      form: { callbackUrl: req.body.callbackUrl, description: req.body.description, subscriptions },
      eventTypes: constants.webhooks.humanReadableSubscriptions,
      backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.index, req.service.externalId, req.account.type)
    })
  }

  const webhookUpdateRequest = new WebhookUpdateRequest()
    .replace().description(req.body.description)
    .replace().callbackUrl(req.body.callbackUrl)
    .replace().subscriptions(typeof (req.body.subscriptions) === 'string' ? [req.body.subscriptions] : req.body.subscriptions)

  try {
    await webhooksService.updateWebhook(req.params.webhookExternalId, req.service.externalId, req.account.id, webhookUpdateRequest)
  } catch (updateWebhookError) {
    if (updateWebhookError.errorIdentifier in webhookErrorIdentifiers) {
      throw new ValidationError('simplified-account/settings/webhooks/edit', [{ msg: webhookErrorIdentifiers[updateWebhookError.errorIdentifier], path: 'callbackUrl' }], {
        form: { callbackUrl: req.body.callbackUrl, description: req.body.description, subscriptions },
        eventTypes: constants.webhooks.humanReadableSubscriptions,
        backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.index, req.service.externalId, req.account.type)
      })
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
