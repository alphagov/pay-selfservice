const { response } = require('@utils/response')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const _ = require('lodash')
const { FORM_STATE_KEY } = require('@controllers/simplified-account/settings/api-keys/create/constants')

function get (req, res) {
  const { key } = _.get(req, FORM_STATE_KEY, {})
  _.unset(req, FORM_STATE_KEY)
  if (_.isEmpty(key)) {
    return res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, req.service.externalId, req.account.type))
  }
  return response(req, res, 'simplified-account/settings/api-keys/create/new-api-key-details', {
    description: key.description,
    apiKey: key.newApiKey,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, req.service.externalId, req.account.type)
  })
}

module.exports = {
  get
}
