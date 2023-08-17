'use strict'

const { response } = require('../../utils/response')

module.exports = function showGooglePaySettings (req, res) {
  return response(req, res, 'digital-wallet/google-pay', {
    enabled: req.account && req.account.allow_google_pay
  })
}
