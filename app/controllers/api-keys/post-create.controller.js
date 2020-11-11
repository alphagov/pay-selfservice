'use strict'

const { response } = require('../../utils/response.js')
const auth = require('../../services/auth.service.js')
const publicAuthClient = require('../../services/clients/public-auth.client')
const { isADirectDebitAccount } = require('../../services/clients/direct-debit-connector.client.js')

module.exports = async function createAPIKey (req, res, next) {
  const accountId = auth.getCurrentGatewayAccountId(req)
  const correlationId = req.correlationId
  const description = req.body.description
  const payload = {
    description: description,
    account_id: accountId,
    created_by: req.user.email,
    token_type: isADirectDebitAccount(accountId) ? 'DIRECT_DEBIT' : 'CARD',
    token_account_type: req.account.type
  }

  try {
    const createTokenResponse = await publicAuthClient.createTokenForAccount({ payload, accountId, correlationId })
    response(req, res, 'api-keys/create', {
      description,
      token: createTokenResponse.token
    })
  } catch (error) {
    next(error)
  }
}
