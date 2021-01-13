'use strict'

const { response } = require('../../utils/response.js')

module.exports = (req, res) => {
  const accountId = req.account.gateway_account_id
  response(req, res, 'api-keys/create', { 'account_id': accountId })
}
