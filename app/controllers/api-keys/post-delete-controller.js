'use strict'

// Local dependencies
const auth = require('../../services/auth_service.js')
const publicAuthClient = require('../../services/clients/public_auth_client')

module.exports = (req, res) => {
  const accountId = auth.getCurrentGatewayAccountId(req)
  const payload = {
    token_link: req.query.token_link
  }

  publicAuthClient.deleteTokenForAccount({
    accountId: accountId,
    correlationId: req.correlationId,
    payload: payload
  })
    .then(publicAuthData => {
      res.setHeader('Content-Type', 'application/json')
      res.json({
        'revoked': publicAuthData.revoked
      })
    })
    .catch(rejection => {
      let responseCode = 500
      if (rejection && rejection.errorCode) {
        responseCode = rejection.errorCode
      }
      res.sendStatus(responseCode)
    })
}
