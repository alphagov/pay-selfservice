const { response } = require('@utils/response')
const apiKeysService = require('@services/api-keys.service')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')

async function get (req, res) {
  const activeKeys = await apiKeysService.getActiveKeys(req.account.id)
  return response(req, res, 'simplified-account/settings/api-keys/index', {
    accountType: req.account.type,
    activeKeys,
    createApiKeyLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.create, req.service.externalId, req.account.type),
    showRevokedKeysLink: '#'
  })
}

module.exports = { get }
module.exports.createApiKey = require('./create/create-api-key.controller')
