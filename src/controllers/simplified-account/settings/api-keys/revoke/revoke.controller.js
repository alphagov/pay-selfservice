const paths = require('@root/paths')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const { response } = require('@utils/response')
const { getKeyByTokenLink, revokeKey } = require('@services/api-keys.service')

async function get (req, res) {
  const tokenLink = req.params.tokenLink
  const apiKey = await getKeyByTokenLink(req.account.id, tokenLink)
  return response(req, res, 'simplified-account/settings/api-keys/revoke', {
    description: apiKey.description,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, req.service.externalId, req.account.type)
  })
}

async function post (req, res) {
  if (req.body.revokeApiKey === 'Yes') { // pragma: allowlist secret
    await revokeKey(req.account.id, req.params.tokenLink)
  }
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, req.service.externalId, req.account.type))
}

module.exports = { get, post }
