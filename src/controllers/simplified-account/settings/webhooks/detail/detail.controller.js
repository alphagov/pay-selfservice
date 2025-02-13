const paths = require('@root/paths')
const { response } = require('@utils/response')
const webhooksService = require('@services/webhooks.service')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const { constants } = require('@govuk-pay/pay-js-commons')

async function get (req, res) {
  const webhook = await webhooksService.getWebhook(req.params.webhookId, req.service.externalId, req.account.id)
  const signingSecret = await webhooksService.getSigningSecret(req.params.webhookId, req.service.externalId, req.account.id)
  // TODO get webhook messages and pass them into the template
  response(req, res, 'simplified-account/settings/webhooks/detail', {
    webhook,
    signingSecret,
    eventTypes: constants.webhooks.humanReadableSubscriptions,
    backToWebhooksLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.index, req.service.externalId, req.account.type)
  })
}

module.exports = {
  get
}
