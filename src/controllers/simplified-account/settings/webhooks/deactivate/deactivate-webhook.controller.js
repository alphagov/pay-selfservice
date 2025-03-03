const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const paths = require('@root/paths')
const { response } = require('@utils/response')
const webhooksService = require('@services/webhooks.service')
const { WebhookStatus } = require('@models/webhooks/Webhook.class')
const { webhookSchema } = require('@utils/simplified-account/validation/webhook.schema')
const { validationResult } = require('express-validator')
const formatValidationErrors = require('@utils/simplified-account/format/format-validation-errors')

/**
 *
 * @param req {SimplifiedAccountRequest}
 * @param res
 * @returns {Promise<void>}
 */
async function get (req, res) {
  const webhook = await webhooksService.getWebhook(req.params.webhookExternalId, req.service.externalId, req.account.id)
  if (webhook.status !== WebhookStatus.ACTIVE) {
    return res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.detail, req.service.externalId, req.account.type, req.params.webhookExternalId))
  }

  return response(req, res, 'simplified-account/settings/webhooks/toggle', {
    webhook
  })
}

/**
 *
 * @param req {SimplifiedAccountRequest}
 * @param res
 * @returns {Promise<void>}
 */
async function post (req, res) {
  const webhook = await webhooksService.getWebhook(req.params.webhookExternalId, req.service.externalId, req.account.id)
  if (webhook.status !== WebhookStatus.ACTIVE) {
    return res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.detail, req.service.externalId, req.account.type, req.params.webhookExternalId))
  }

  await Promise.all([webhookSchema.toggleActive.validate(webhook)].map(validation => validation.run(req)))
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    const formattedErrors = formatValidationErrors(validationErrors)
    return response(req, res, 'simplified-account/settings/webhooks/toggle', {
      errors: {
        formErrors: formattedErrors.formErrors,
        summary: formattedErrors.errorSummary
      },
      webhook
    })
  }

  if (req.body.toggleActive.toLowerCase() !== 'yes') {
    return res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.detail, req.service.externalId, req.account.type, req.params.webhookExternalId))
  }

  await webhooksService.toggleStatus(req.params.webhookExternalId, req.service.externalId, req.account.id, webhook.status)

  return res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.detail, req.service.externalId, req.account.type, req.params.webhookExternalId))
}

module.exports = {
  get,
  post
}
