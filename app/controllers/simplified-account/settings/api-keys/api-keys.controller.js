const { response } = require('@utils/response')
const publicAuthClient = require('@services/clients/public-auth.client')

async function get (req, res) {
  const publicAuthData = await publicAuthClient.getActiveTokensForAccount({
    accountId: req.account.id
  })
  return response(req, res, 'simplified-account/settings/api-keys/index', {
    accountType: req.account.type,
    activeKeys: publicAuthData.tokens || [],
    createApiKeyLink: '#',
    showRevokedKeysLink: '#'
  })
}

module.exports = { get }
