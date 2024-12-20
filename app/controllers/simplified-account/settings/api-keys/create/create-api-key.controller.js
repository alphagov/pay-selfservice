const { response } = require('@utils/response')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { TOKEN_SOURCE, createApiKey } = require('@services/api-keys.service')

async function get (req, res) {
  return response(req, res, 'simplified-account/settings/api-keys/api-key-name', {
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, req.service.externalId, req.account.type)
  })
}

async function post (req, res) {
  const description = req.body.description // TODO validate length - deal with this in another PR
  const newApiKey = await createApiKey(req.account, description, req.user.email, TOKEN_SOURCE.API)
  response(req, res, 'simplified-account/settings/api-keys/new-api-key-details', {
    description,
    apiKey: newApiKey,
    backToApiKeysLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.apiKeys.index, req.service.externalId, req.account.type)
  })
}

module.exports = { get, post }
