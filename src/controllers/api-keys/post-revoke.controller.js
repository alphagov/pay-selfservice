'use strict'

const paths = require('../../paths')
const publicAuthClient = require('../../services/clients/public-auth.client')
const logger = require('../../utils/logger')(__filename)
const formatAccountPathsFor = require('../../utils/format-account-paths-for')

module.exports = async function revokeApiKey (req, res) {
  const apiKeysPath = formatAccountPathsFor(paths.account.apiKeys.index, req.account.external_id)

  const accountId = req.account.gateway_account_id
  const payload = {
    token_link: req.body.token_link
  }

  try {
    await publicAuthClient.deleteTokenForAccount({
      accountId, payload
    })

    req.flash('generic', 'The API key was successfully revoked')
    return res.redirect(apiKeysPath)
  } catch (error) {
    logger.error('Error revoking API key', { error: error.message })
    req.flash('genericError', 'Something went wrong. Please try again or contact support.')
    return res.redirect(apiKeysPath)
  }
}
