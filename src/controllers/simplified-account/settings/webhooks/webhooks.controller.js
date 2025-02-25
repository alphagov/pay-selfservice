const { response } = require('@utils/response')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const paths = require('@root/paths')
const webhooksService = require('@services/webhooks.service')
const { constants } = require('@govuk-pay/pay-js-commons')
const { WebhookStatus } = require('@models/webhooks/Webhook.class')

async function get (req, res) {
  const accountIsLive = req.account.type === 'live'
  const messages = res.locals?.flash?.messages ?? []
  const webhooks = await webhooksService.listWebhooks(req.service.externalId, req.account.id, accountIsLive)
    .then(webhooks => webhooks.map(webhook => Object.assign(webhook, {
      detailUrl: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.detail, req.service.externalId, req.account.type, webhook.externalId),
      updateUrl: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.update, req.service.externalId, req.account.type, webhook.externalId)
    })))
  const activeWebhooks = webhooks.filter(webhook => webhook.status === WebhookStatus.ACTIVE)
  const deactivatedWebhooks = webhooks.filter(webhook => webhook.status === WebhookStatus.INACTIVE)
  response(req, res, 'simplified-account/settings/webhooks/index', {
    messages,
    activeWebhooks,
    deactivatedWebhooks,
    eventTypes: constants.webhooks.humanReadableSubscriptions,
    createWebhookLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.create, req.service.externalId, req.account.type)
  })
}

module.exports = {
  get,
  create: require('./create/create.controller'),
  detail: require('./detail/detail.controller'),
  update: require('./update/update-webhook.controller')
}
