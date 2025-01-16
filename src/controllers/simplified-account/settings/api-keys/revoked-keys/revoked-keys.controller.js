const { response } = require('@utils/response')
const { getRevokedKeys } = require('@services/api-keys.service')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')

async function get (req, res) {
  const revokedKeys = await getRevokedKeys(req.account.id)
  return response(req, res, 'simplified-account/settings/api-keys/revoked-keys', {
    tokens: revokedKeys,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, req.service.externalId, req.account.type)
  })
}

module.exports = { get }
