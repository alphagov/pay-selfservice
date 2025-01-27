const { response } = require('@utils/response')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')

function get (req, res) {
  return response(req, res, 'simplified-account/settings/worldpay-details/flex-credentials', {
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.index,
      req.service.externalId, req.account.type)
  })
}

module.exports = {
  get
}
