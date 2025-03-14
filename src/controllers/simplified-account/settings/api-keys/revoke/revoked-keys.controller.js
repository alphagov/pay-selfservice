const { response } = require('@utils/response')
const { getRevokedKeys } = require('@services/api-keys.service')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { NotFoundError } = require('@root/errors')

async function get (req, res, next) {
  const revokedKeys = await getRevokedKeys(req.account.id)
  if (revokedKeys.length === 0) {
    return next(new NotFoundError('Refusing to render page as there are no revoked keys on the gateway account'))
  }
  return response(req, res, 'simplified-account/settings/api-keys/revoked-keys', {
    tokens: revokedKeys,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, req.service.externalId, req.account.type)
  })
}

module.exports = { get }
