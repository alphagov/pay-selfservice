const paths = require('@root/paths')
const { response } = require('@utils/response')
const webhooksService = require('@services/webhooks.service')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const { constants } = require('@govuk-pay/pay-js-commons')

async function get (req, res) {
  const webhook = await webhooksService.getWebhook(req.params.webhookId, req.service.externalId, req.account.id)
  console.log('webhook: ------ ' + JSON.stringify(webhook))
  response(req, res, 'simplified-account/settings/webhooks/detail', {
    webhook,
    eventTypes: constants.webhooks.humanReadableSubscriptions,
    backToWebhooksLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.index, req.service.externalId, req.account.type)
  })
}

module.exports = {
  get
}
