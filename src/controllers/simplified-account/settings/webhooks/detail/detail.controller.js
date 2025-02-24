const paths = require('@root/paths')
const { response } = require('@utils/response')
const webhooksService = require('@services/webhooks.service')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const { constants } = require('@govuk-pay/pay-js-commons')

async function get (req, res) {
  const status = (req.query.deliveryStatus === 'successful' || req.query.deliveryStatus === 'failed')
    ? req.query.deliveryStatus
    : undefined
  const page = req.query.page || 1
  const webhook = await webhooksService.getWebhook(req.params.webhookId, req.service.externalId, req.account.id)
  const messages = await webhooksService.getWebhookMessages(req.params.webhookId, { page, ...status && { status } })
  const webhookEvents = messages.results.map(result => ({
    resourceId: result.resource_id,
    eventType: result.event_type,
    lastDeliveryStatus: result.last_delivery_status,
    eventDate: result.event_date,
    eventDetailUrl: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.event, req.service.externalId, req.account.type, webhook.external_id, result.external_id)
  }))

  const signingSecret = await webhooksService.getSigningSecret(req.params.webhookId, req.service.externalId, req.account.id)
  response(req, res, 'simplified-account/settings/webhooks/detail', {
    webhook,
    signingSecret,
    deliveryStatus: status || 'all',
    eventTypes: constants.webhooks.humanReadableSubscriptions,
    backToWebhooksLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.index, req.service.externalId, req.account.type),
    webhookEvents
  })
}

module.exports = {
  get
}
