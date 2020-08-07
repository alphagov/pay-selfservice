'use strict'

// Local dependencies
const { response, renderErrorView } = require('../../utils/response.js')
const auth = require('../../services/auth.service.js')
const publicAuthClient = require('../../services/clients/public-auth.client')
const { isADirectDebitAccount } = require('../../services/clients/direct-debit-connector.client.js')

module.exports = (req, res) => {
  // current account id is either external (DIRECT_DEBIT) or internal (CARD) for now
  const currentAccountId = auth.getCurrentGatewayAccountId(req)
  const correlationId = req.correlationId
  const description = req.body.description
  const payload = {
    'account_id': currentAccountId,
    'description': description,
    'created_by': req.user.email,
    'token_type': isADirectDebitAccount(currentAccountId) ? 'DIRECT_DEBIT' : 'CARD'
  }
  publicAuthClient.createTokenForAccount({
    payload: payload,
    accountId: currentAccountId,
    correlationId: correlationId
  })
    .then(publicAuthData => response(req, res, 'api-keys/create', {
      token: publicAuthData.token,
      description: description
    }))
    .catch((reason) => renderErrorView(req, res))
}
