const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const paths = require('@root/paths')
const { response } = require('@utils/response')
const { constants } = require('@govuk-pay/pay-js-commons')

async function get (req, res) {
  response(req, res, 'simplified-account/settings/webhooks/edit', {
    eventTypes: constants.webhooks.humanReadableSubscriptions,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.index, req.service.externalId, req.account.type)
  })
}

async function post (req, res) {
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.index, req.service.externalId, req.account.type))
}

module.exports = {
  get,
  post
}
