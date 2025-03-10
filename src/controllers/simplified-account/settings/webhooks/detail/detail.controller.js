const paths = require('@root/paths')
const { response } = require('@utils/response')
const webhooksService = require('@services/webhooks.service')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const { constants } = require('@govuk-pay/pay-js-commons')

/**
 *
 * @param req {SimplifiedAccountRequest}
 * @param res
 * @returns {Promise<void>}
 */
async function get (req, res) {
  const baseUrl = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.detail, req.service.externalId, req.account.type, req.params.webhookExternalId)
  const page = parseInt(req.query.page || 1)
  if (Number.isNaN(page) || page < 1) {
    return res.redirect(baseUrl)
  }

  const deliveryStatus = (req.query.deliveryStatus === 'successful' || req.query.deliveryStatus === 'failed') ? req.query.deliveryStatus : 'all'
  const webhook = await webhooksService.getWebhook(req.params.webhookExternalId, req.service.externalId, req.account.id)
  const signingSecret = await webhooksService.getSigningSecret(req.params.webhookExternalId, req.service.externalId, req.account.id)
  const webhookMessages = await webhooksService.getWebhookMessages(req.params.webhookExternalId, { page, ...deliveryStatus && { status: deliveryStatus } })
  const totalPages = Math.ceil(webhookMessages.total / 10)
  if (totalPages > 0 && page > totalPages) {
    return res.redirect(baseUrl)
  }

  const webhookEvents = webhookMessages.results.map(result => ({
    resourceId: result.resource_id,
    eventType: result.event_type,
    lastDeliveryStatus: result.last_delivery_status,
    eventDate: result.event_date,
    eventDetailUrl: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.event, req.service.externalId, req.account.type, webhook.externalId, result.external_id)
  }))
  const paginationDetails = getPaginationDetails(page, webhookMessages.total, baseUrl, deliveryStatus)

  const messages = res.locals?.flash?.messages ?? []
  response(req, res, 'simplified-account/settings/webhooks/detail', {
    messages,
    webhook,
    signingSecret,
    deliveryStatus,
    webhookEvents,
    paginationDetails,
    eventTypes: constants.webhooks.humanReadableSubscriptions,
    backToWebhooksLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.index, req.service.externalId, req.account.type),
    updateWebhookLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.update, req.service.externalId, req.account.type, req.params.webhookExternalId),
    toggleWebhookStatusLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.toggle, req.service.externalId, req.account.type, req.params.webhookExternalId)
  })
}

function getPaginationDetails (currentPage, totalWebhookEvents, baseUrl, deliveryStatus) {
  if (totalWebhookEvents <= 10) {
    return {}
  }
  const totalPages = Math.ceil(totalWebhookEvents / 10)
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
