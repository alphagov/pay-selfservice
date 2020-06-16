'use strict'

const { response } = require('../../utils/response')

module.exports = (req, res) => {
  const isAccountCredentialsConfigured = req.account.credentials && req.account.credentials.merchant_id !== undefined
  const isFlexConfigured = req.account.worldpay_3ds_flex &&
    req.account.worldpay_3ds_flex.organisational_unit_id !== undefined &&
    req.account.worldpay_3ds_flex.organisational_unit_id.length > 0
  return response(req, res, 'your-psp/index', { isAccountCredentialsConfigured, isFlexConfigured })
}
