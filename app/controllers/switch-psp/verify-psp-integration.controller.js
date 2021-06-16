'use strict'
const { response } = require('../../utils/response')
const { getSwitchingCredential } = require('../../utils/credentials')

function verifyPSPIntegrationPaymentPage (req, res, next) {
  try {
    const targetCredential = getSwitchingCredential(req.account)

    response(req, res, 'switch-psp/verify-psp-integration-payment', { targetCredential })
  } catch (error) {
    next(error)
  }
}

module.exports = { verifyPSPIntegrationPaymentPage }
