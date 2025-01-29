const { response } = require('@utils/response')
const { constants } = require('@govuk-pay/pay-js-commons')
const formatSimplifiedAccountPathsFor = require('../../../../../utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')

async function get (req, res) {
  response(req, res, 'simplified-account/settings/webhooks/create', {
    eventTypes: constants.webhooks.humanReadableSubscriptions,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.index, req.service.externalId, req.account.type)
  })
}

async function post (req, res) {
  // TODO: implement post controller
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.index, req.service.externalId, req.account.type)
  )
}

module.exports = {
  get,
  post
}
