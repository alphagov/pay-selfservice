'use strict'

const lodash = require('lodash')
const { NotFoundError } = require('../errors')
const PaymentProviders = require('@models/constants/payment-providers')

module.exports = (req, res, next) => {
  const provider = getProvider(req.account)
  const type = lodash.get(req, 'account.type', '')
  if (provider.toLowerCase() === PaymentProviders.SANDBOX ||
    (type.toLowerCase() === 'test' && provider.toLowerCase() === PaymentProviders.STRIPE)) {
    next()
  } else {
    next(new NotFoundError('This page is only available for Sandbox or Stripe test accounts'))
  }
}

const getProvider = (account) => {
  return account.paymentProvider ?? account.payment_provider ?? ''
}
