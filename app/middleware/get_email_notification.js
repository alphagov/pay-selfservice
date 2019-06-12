'use strict'
const { renderErrorView } = require('../utils/response')
const Email = require('../models/email')
const _ = require('lodash')
const { CORRELATION_HEADER } = require('../utils/correlation_header')

module.exports = function (req, res, next) {
  if (req.account.paymentMethod !== 'direct debit') {
    return Email(req.headers[CORRELATION_HEADER]).get(req.account.gateway_account_id)
      .then(emailData => {
        req.account = _.merge(req.account, emailData)
        next()
      })
      .catch(() => renderErrorView(req, res))
  } else {
    next()
  }
}
