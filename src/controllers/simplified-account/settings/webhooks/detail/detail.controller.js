const paths = require('@root/paths')
const { response } = require('@utils/response')
const webhooksService = require('@services/webhooks.service')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const { constants } = require('@govuk-pay/pay-js-commons')

async function get (req, res) {
  const status = (req.query.deliveryStatus === 'successful' || req.query.deliveryStatus === 'failed')
    ? req.query.deliveryStatus
    : undefined
  const page = parseInt(req.query.page || 1)
  const baseUrl = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.detail, req.service.externalId, req.account.type, req.params.webhookId)
  if (Number.isNaN(page) || page < 1) {
    res.redirect(baseUrl)
  }

  const webhook = await webhooksService.getWebhook(req.params.webhookId, req.service.externalId, req.account.id)
  const messages = await webhooksService.getWebhookMessages(req.params.webhookId, { page, ...status && { status } })
  const totalPages = Math.ceil(messages.total / 10)
  if (totalPages > 0 && page > totalPages) {
    res.redirect(baseUrl)
  }

  const webhookEvents = messages.results.map(result => ({
    resourceId: result.resource_id,
    eventType: result.event_type,
    lastDeliveryStatus: result.last_delivery_status,
    eventDate: result.event_date,
    eventDetailUrl: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.event, req.service.externalId, req.account.type, webhook.external_id, result.external_id)
  }))

  const signingSecret = await webhooksService.getSigningSecret(req.params.webhookId, req.service.externalId, req.account.id)
  const deliveryStatus = status || 'all'
  const paginationDetails = getPaginationDetails(page, messages.total, baseUrl, deliveryStatus)

  response(req, res, 'simplified-account/settings/webhooks/detail', {
    webhook,
    signingSecret,
    deliveryStatus,
    eventTypes: constants.webhooks.humanReadableSubscriptions,
    backToWebhooksLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.index, req.service.externalId, req.account.type),
    webhookEvents,
    paginationDetails
  })
}

function getPaginationDetails (currentPage, total, baseUrl, deliveryStatus) {
  if (total <= 10) {
    return {}
  }
  const totalPages = Math.ceil(total / 10)
  const result = { items: [] }
  if (currentPage !== 1) {
    result.previous = { href: `${baseUrl}?deliveryStatus=${deliveryStatus}&page=${currentPage - 1}` }
  }
  if (currentPage !== totalPages) {
    result.next = { href: `${baseUrl}?deliveryStatus=${deliveryStatus}&page=${currentPage + 1}` }
  }
  for (let i = 0; i < totalPages; i++) {
    result.items[i] = { number: i + 1, href: `${baseUrl}?deliveryStatus=${deliveryStatus}&page=${i + 1}` }
    if (currentPage === i + 1) {
      result.items[i].current = true
    }
  }
  return result
}

module.exports = {
  get
}
