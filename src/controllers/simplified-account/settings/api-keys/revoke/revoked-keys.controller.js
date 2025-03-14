const { response } = require('@utils/response')
const { getRevokedKeys } = require('@services/api-keys.service')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { NotFoundError } = require('@root/errors')

async function get (req, res, next) {
  const account = req.account
  const revokedKeys = await getRevokedKeys(account.id)
  if (revokedKeys.length === 0) {
    return next(new NotFoundError(`No revoked keys found for gateway account [gateway_account_id: ${account.id}]`))
  }
  return response(req, res, 'simplified-account/settings/api-keys/revoke/revoked-keys', {
    tokens: revokedKeys,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, req.service.externalId, account.type)
  })
}

module.exports = { get }
