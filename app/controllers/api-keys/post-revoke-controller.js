'use strict'

const paths = require('../../paths')
const auth = require('../../services/auth_service.js')
const publicAuthClient = require('../../services/clients/public_auth_client')

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
      req.flash('generic', '<h2>The API key was successfully revoked</h2>')
      res.redirect(paths.apiKeys.index)
    })
    .catch(err => {
      req.flash('genericError', `<h2>Something went wrong</h2><p>${err}</p>`)
      res.redirect(paths.apiKeys.index)
    })
}
