'use strict'

const lodash = require('lodash')

const { response } = require('@utils/response')
const { getCurrentCredential } = require('@utils/credentials')

module.exports = (req, res) => {
  lodash.set(req, 'session.pageData.createPaymentLink', {})

  const credential = getCurrentCredential(req.account)

  const accountUsesWorldpayMotoMerchantCode = lodash.get(credential, 'payment_provider', '') === 'worldpay' &&
      lodash.get(credential, 'credentials.one_off_customer_initiated.merchant_code', '').endsWith('MOTO')

  return response(req, res, 'payment-links/index', {
    accountUsesWorldpayMotoMerchantCode
  })
}
