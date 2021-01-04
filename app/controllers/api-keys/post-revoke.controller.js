'use strict'

const paths = require('../../paths')
const auth = require('../../services/auth.service.js')
const publicAuthClient = require('../../services/clients/public-auth.client')
const logger = require('../../utils/logger')(__filename)

module.exports = async (req, res) => {
  const accountId = auth.getCurrentGatewayAccountId(req)
  const payload = {
    token_link: req.body.token_link
  }

  try {
    await publicAuthClient.deleteTokenForAccount({
      accountId: accountId, correlationId: req.correlationId, payload: payload
    })

    req.flash('generic', 'The API key was successfully revoked')
    return res.redirect(paths.apiKeys.index)
  } catch (error) {
    logger.error('Error revoking API key', { error: error.message })
    req.flash('genericError', 'Something went wrong. Please try again or contact support.')
    return res.redirect(paths.apiKeys.index)
  }
}
