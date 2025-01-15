'use strict'

const lodash = require('lodash')
const { NotFoundError } = require('../errors')

module.exports = (req, res, next) => {
  const provider = lodash.get(req, 'account.payment_provider', '')
  const type = lodash.get(req, 'account.type', '')
  if (provider.toLowerCase() === 'sandbox' ||
    (type.toLowerCase() === 'test' && provider.toLowerCase() === 'stripe')) {
    next()
  } else {
    next(new NotFoundError('This page is only available for Sandbox or Stripe test accounts'))
  }
}
