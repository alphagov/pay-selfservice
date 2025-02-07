const paths = require('@root/paths')
const { response } = require('@utils/response')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')

async function get (req, res) {
  response(req, res, 'simplified-account/settings/webhooks/detail', {
    description: 'Description from the webhook',
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.index, req.service.externalId, req.account.type)
  })
}

module.exports = {
  get
}
