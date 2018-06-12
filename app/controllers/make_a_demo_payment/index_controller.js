'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const {response} = require('../../utils/response.js')
const paths = require('../../paths')
const {utils} = require('@govuk-pay/pay-js-commons')
const currencyFormatter = require('../../utils/currency_formatter')

const DEFAULTS = {
  paymentDescription: 'An example payment description',
  paymentAmount: '20.00'
}

module.exports = (req, res) => {
  const pageData = lodash.get(req, 'session.pageData.makeADemoPayment', {})
  const paymentDescription = req.body['payment-description'] || pageData.paymentDescription || DEFAULTS.paymentDescription
  let paymentAmount = req.body['payment-amount'] || pageData.paymentAmount || DEFAULTS.paymentAmount

  if (!paymentAmount || utils.fieldValidationChecks.isCurrency(paymentAmount)) {
    lodash.set(req, 'session.pageData.makeADemoPayment.paymentAmount', paymentAmount)
    req.flash('genericError', `<h2>Use valid characters only</h2> ${utils.fieldValidationChecks.isCurrency(paymentAmount)}`)
    return res.redirect(paths.prototyping.demoPayment.editAmount)
  } else if (utils.fieldValidationChecks.isAboveMaxAmount(paymentAmount)) {
    lodash.set(req, 'session.pageData.makeADemoPayment.paymentAmount', paymentAmount)
    req.flash('genericError', `<h2>Enter a valid amount</h2> ${utils.fieldValidationChecks.isAboveMaxAmount(paymentAmount)}`)
    return res.redirect(paths.prototyping.demoPayment.editAmount)
  }

  paymentAmount = currencyFormatter(paymentAmount)

  lodash.set(req, 'session.pageData.makeADemoPayment', {paymentDescription, paymentAmount})

  response(req, res, 'dashboard/demo-payment/index', {
    paymentAmount,
    paymentDescription,
    nextPage: paths.prototyping.demoPayment.mockCardDetails,
    editDescription: paths.prototyping.demoPayment.editDescription,
    editAmount: paths.prototyping.demoPayment.editAmount
  })
}
