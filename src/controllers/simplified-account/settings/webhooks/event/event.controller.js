const paths = require('@root/paths')
const { response } = require('@utils/response')
const webhooksService = require('@services/webhooks.service')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const formatAccountPathsFor = require('@utils/format-account-paths-for')
const { constants } = require('@govuk-pay/pay-js-commons')

/**
 * @param {import('@utils/types/settings/settings-request').SettingsRequest} req
 * @param {import('express').Response} res
 */
async function get(req, res) {
  const event = await webhooksService.getWebhookMessage(req.params.eventId, req.params.webhookExternalId)
  const attempts = await webhooksService.getWebhookMessageAttempts(req.params.eventId, req.params.webhookExternalId)
  const webhook = await webhooksService.getWebhook(req.params.webhookExternalId, req.service.externalId, req.account.id)

  response(req, res, 'simplified-account/settings/webhooks/event', {
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.detail, req.service.externalId, req.account.type, req.params.webhookExternalId),
    resourceLink: formatAccountPathsFor(paths.account.transactions.detail, req.account.externalId, event.resource_id),
    eventTypes: constants.webhooks.humanReadableSubscriptions,
    event,
    attempts,
    webhookDescription: webhook.description
  })
}

module.exports = {
  get
}
