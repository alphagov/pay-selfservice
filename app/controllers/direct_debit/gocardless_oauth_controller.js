'use strict'

const client = require('../../services/clients/gocardless_client')
const publicAuthClient = require('../../services/clients/public_auth_client')
const paths = require('../../paths')

const GOCARDLESS_CLIENT_ID = process.env.GOCARDLESS_CLIENT_ID

exports.index = (req, res) => {
  const gatewayAccountId = req.gateway_account.currentGatewayAccountId
  publicAuthClient.createTokenForAccount({
    accountId: gatewayAccountId,
    correlationId: req.correlationId,
    payload: {
      account_id: gatewayAccountId,
      created_by: req.user.email,
      description: `Token for gocardless integration}`
    }})
    .then((publicAuthData) => {
      client.redirectToGocardless(
        req,
        res,
        {
          clientId: GOCARDLESS_CLIENT_ID,
          authToken: publicAuthData.token
        })
    })
    .catch(err => {
      req.flash('genericError', `<h2>Something went wrong</h2><p>${err}</p>`)
      res.redirect(paths.apiKeys)
    })
}
