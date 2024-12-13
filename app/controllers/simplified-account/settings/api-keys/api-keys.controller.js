const { response } = require('@utils/response')
const apiKeysService = require('@services/api-keys.service')

async function get (req, res) {
  const activeKeys = await apiKeysService.getActiveKeys(req.account.id)
  return response(req, res, 'simplified-account/settings/api-keys/index', {
    accountType: req.account.type,
    activeKeys: activeKeys,
    createApiKeyLink: '#',
    showRevokedKeysLink: '#'
  })
}

module.exports = { get }
