'use strict'

const { response } = require('../../utils/response.js')
const auth = require('../../services/auth_service.js')

module.exports = (req, res) => {
  const accountId = auth.getCurrentGatewayAccountId(req)
  response(req, res, 'api-keys/create', { 'account_id': accountId })
}
