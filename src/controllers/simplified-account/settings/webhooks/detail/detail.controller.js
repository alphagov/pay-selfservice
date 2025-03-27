const paths = require('@root/paths')
const { response } = require('@utils/response')
const getPagination = require('@utils/simplified-account/pagination')
const webhooksService = require('@services/webhooks.service')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const { constants } = require('@govuk-pay/pay-js-commons')
const { query } = require('express-validator')
const { ALL, SUCCESSFUL, FAILED, PENDING, WILL_NOT_SEND } = require('@models/constants/webhook-delivery-status')

const PAGE_SIZE = 10

/**
 * @param {import('@utils/types/settings/settings-request').SettingsRequest} req
 * @param {import('express').Response} res
 */
async function get (req, res) {
  const webhooksDetailUrl = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.detail, req.service.externalId, req.account.type, req.params.webhookExternalId)
  const validations = [
    query('page')
      .customSanitizer((value) => {
        const pageNumber = Number(value)
        if (isNaN(pageNumber)) {
          return 1
        }
        return pageNumber
      }),
    query('deliveryStatus')
      .customSanitizer((value) => {
        const validValues = [ALL, SUCCESSFUL, FAILED, PENDING, WILL_NOT_SEND]
        if (!validValues.includes(value)) {
          return ALL
        }
        return value
      })
  ]

  await Promise.all(validations.map(async validation => validation.run(req)))
  let currentPage = Number(req.query.page)
  const deliveryStatus = req.query.deliveryStatus

  const webhook = await webhooksService.getWebhook(req.params.webhookExternalId, req.service.externalId, req.account.id)
  const signingSecret = await webhooksService.getSigningSecret(req.params.webhookExternalId, req.service.externalId, req.account.id)
  const webhookMessages = await webhooksService.getWebhookMessages(req.params.webhookExternalId, { page: currentPage, ...deliveryStatus && { status: deliveryStatus } })
  const totalPages = Math.ceil(webhookMessages.total / PAGE_SIZE)
  if (totalPages > 0 && currentPage > totalPages) {
    currentPage = totalPages
  }

  const webhookEvents = webhookMessages.results.map(result => ({
    resourceId: result.resource_id,
    eventType: result.event_type,
    lastDeliveryStatus: result.last_delivery_status,
    eventDate: result.event_date,
    eventDetailUrl: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.event, req.service.externalId, req.account.type, webhook.externalId, result.external_id)
  }))

  const pagination = getPagination(currentPage, PAGE_SIZE, webhookMessages.total, (pageNumber) => `${webhooksDetailUrl}?deliveryStatus=${deliveryStatus}&page=${pageNumber}#events`)

  const messages = res.locals?.flash?.messages ?? []
  response(req, res, 'simplified-account/settings/webhooks/detail', {
    messages,
    webhook,
    signingSecret,
    deliveryStatus,
    webhookEvents,
    pagination,
    eventTypes: constants.webhooks.humanReadableSubscriptions,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.index, req.service.externalId, req.account.type),
    updateWebhookLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.update, req.service.externalId, req.account.type, req.params.webhookExternalId),
    toggleWebhookStatusLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.toggle, req.service.externalId, req.account.type, req.params.webhookExternalId)
  })
}

module.exports = {
  get
}
