const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { response } = require('@utils/response')

function get (req, res) {
  const context = {
    messages: res.locals?.flash?.messages ?? [],
    serviceNameEn: req.service.serviceName.en,
    serviceNameCy: req.service.serviceName.cy,
    manageEn: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.edit, req.service.externalId, req.account.type),
    manageCy: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.edit, req.service.externalId, req.account.type) + '?cy=true'
  }
  return response(req, res, 'simplified-account/settings/service-name/index', context)
}

module.exports = {
  get
}
