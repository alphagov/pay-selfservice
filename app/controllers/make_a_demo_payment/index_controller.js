'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response.js')
const paths = require('../../paths')
const { isCurrency, isAboveMaxAmount } = require('../../browsered/field-validation-checks')
const { sanitisePoundsAndPenceInput } = require('../../utils/currency_formatter')

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
    req.flash('genericError', `<h2>Use valid characters only</h2> ${isCurrency(paymentAmount)}`)
    return res.redirect(paths.prototyping.demoPayment.editAmount)
  } else if (isAboveMaxAmount(paymentAmount)) {
    lodash.set(req, 'session.pageData.makeADemoPayment.paymentAmount', paymentAmount)
    req.flash('genericError', `<h2>Enter a valid amount</h2> ${isAboveMaxAmount(paymentAmount)}`)
    return res.redirect(paths.prototyping.demoPayment.editAmount)
  }

  if (req.body['payment-amount']) {
    paymentAmount = sanitisePoundsAndPenceInput(paymentAmount)
  }

  lodash.set(req, 'session.pageData.makeADemoPayment', { paymentDescription, paymentAmount })

  response(req, res, 'dashboard/demo-payment/index', {
    paymentAmount,
    paymentDescription
  })
}
