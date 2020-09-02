'use strict'

const paths = require('../../paths')
const auth = require('../../services/auth.service.js')
const publicAuthClient = require('../../services/clients/public-auth.client')
const logger = require('../../utils/logger')(__filename)

module.exports = (req, res) => {
  const accountId = auth.getCurrentGatewayAccountId(req)
  const payload = {
    token_link: req.body.token_link
  }

  publicAuthClient.deleteTokenForAccount({
    accountId: accountId,
    correlationId: req.correlationId,
    payload: payload
  })
    .then(() => {
      req.flash('generic', 'The API key was successfully revoked')
      res.redirect(paths.apiKeys.index)
    })
    .catch(error => {
      logger.error('Error revoking API key', { error: error.message })
      req.flash('genericError', 'Something went wrong. Please try again or contact support.')
      res.redirect(paths.apiKeys.index)
    })
}
