'use strict'

const { response } = require('../../utils/response.js')
const publicAuthClient = require('../../services/clients/public-auth.client')

module.exports = async function createApiKey (req, res, next) {
  const accountId = req.account.gateway_account_id
  const correlationId = req.correlationId
  const description = req.body.description
  const payload = {
    description: description,
    account_id: accountId,
    created_by: req.user.email,
    type: 'API',
    token_type: 'CARD',
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
