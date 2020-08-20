'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const { response } = require('../../utils/response.js')
const paths = require('../../paths')
const { isCurrency, isAboveMaxAmount } = require('../../browsered/field-validation-checks')
const { safeConvertPoundsStringToPence } = require('../../utils/currency-formatter')

const DEFAULTS = {
  paymentDescription: 'An example payment description',
  paymentAmount: '2000'
}

module.exports = (req, res) => {
  const pageData = lodash.get(req, 'session.pageData.makeADemoPayment', {})
  const paymentDescription = req.body['payment-description'] || pageData.paymentDescription || DEFAULTS.paymentDescription
  let paymentAmount = req.body['payment-amount'] || pageData.paymentAmount || DEFAULTS.paymentAmount

  if (!paymentAmount || isCurrency(paymentAmount)) {
    lodash.set(req, 'session.pageData.makeADemoPayment.paymentAmount', paymentAmount)
    req.flash('genericError', isCurrency(paymentAmount))
    return res.redirect(paths.prototyping.demoPayment.editAmount)
  }
  const isAboveMaxAmountError = isAboveMaxAmount(paymentAmount)
  if (isAboveMaxAmountError) {
    lodash.set(req, 'session.pageData.makeADemoPayment.paymentAmount', paymentAmount)
    req.flash('genericError', isAboveMaxAmountError)
    return res.redirect(paths.prototyping.demoPayment.editAmount)
  }

  if (req.body['payment-amount']) {
    paymentAmount = safeConvertPoundsStringToPence(paymentAmount)
  }

  lodash.set(req, 'session.pageData.makeADemoPayment', { paymentDescription, paymentAmount })

  response(req, res, 'dashboard/demo-payment/index', {
    paymentAmount,
    paymentDescription
  })
}
