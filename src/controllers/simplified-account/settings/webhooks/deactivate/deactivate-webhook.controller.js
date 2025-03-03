const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const paths = require('@root/paths')
const { response } = require('@utils/response')
const webhooksService = require('@services/webhooks.service')
const { WebhookStatus } = require('@models/webhooks/Webhook.class')

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

  await webhooksService.toggleStatus(req.params.webhookExternalId, req.service.externalId, req.account.id, webhook.status)

  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.detail, req.service.externalId, req.account.type, req.params.webhookExternalId))
}

module.exports = {
  get,
  post
}
