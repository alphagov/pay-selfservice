'use strict'

const { response } = require('../../utils/response')

module.exports = (req, res) => {
  const isAccountCredentialsConfigured = req.account.credentials && req.account.credentials.merchant_id !== undefined
  const is3dsEnabled = req.account.requires3ds === true

  return response(req, res, 'your-psp/test-payment', { isAccountCredentialsConfigured })
}
