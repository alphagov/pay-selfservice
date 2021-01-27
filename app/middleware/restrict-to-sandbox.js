'use strict'

const lodash = require('lodash')
const { NotFoundError } = require('../errors')

module.exports = (req, res, next) => {
  const provider = lodash.get(req, 'account.payment_provider', '')
  if (provider.toLowerCase() !== 'sandbox') {
    next(new NotFoundError('This page is only available on Sandbox accounts'))
  } else {
    next()
  }
}
