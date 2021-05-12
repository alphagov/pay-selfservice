'use strict'

const { response } = require('../../utils/response')

module.exports = (req, res) => {
  const { provider } = req.params
  if (provider !== req.account.payment_provider) {
    // const credentials = req.session.prototype ? req.session.prototype.credentials : {}
    const credentials = req.currentAccountPrototype && req.currentAccountPrototype.credentials || {}
    req.account.credentials = credentials
  }
  const isAccountCredentialsConfigured = req.account.credentials && req.account.credentials.merchant_id !== undefined

  const isWorldpay3dsFlexCredentialsConfigured = req.account.worldpay_3ds_flex &&
    req.account.worldpay_3ds_flex.organisational_unit_id !== undefined &&
    req.account.worldpay_3ds_flex.organisational_unit_id.length > 0

  const is3dsEnabled = req.account.requires3ds === true

  const isWorldpay3dsFlexEnabled = is3dsEnabled && req.account.integration_version_3ds === 2



  return response(req, res, 'your-psp/index', { isAccountCredentialsConfigured,
    targetProvider: provider,
    is3dsEnabled,
    isWorldpay3dsFlexEnabled,
    isWorldpay3dsFlexCredentialsConfigured })
}
