'use strict'

// Local dependencies
const paths = require('../../paths')
const auth = require('../../services/auth.service.js')
const publicAuthClient = require('../../services/clients/public-auth.client')

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
    .catch(err => {
      req.flash('genericError', `<h2>Something went wrong</h2><p>${err}</p>`)
      res.redirect(paths.apiKeys.index)
    })
}
