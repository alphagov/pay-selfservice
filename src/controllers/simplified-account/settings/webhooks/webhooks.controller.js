const { response } = require('@utils/response')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const paths = require('@root/paths')
const webhooksService = require('@controllers/webhooks/webhooks.service')

async function get (req, res, next) {
  const accountIsLive = req.account.type === 'live'
  const webhooks = await webhooksService.listWebhooks(req.service.externalId, req.account.id, accountIsLive)
  response(req, res, 'simplified-account/settings/webhooks/index', {
    webhooks,
    createWebhookLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.create, req.service.externalId, req.account.type)
  })
}

module.exports = {
  get,
  create: require('./create/create.controller')
}
