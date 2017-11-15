'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const {response} = require('../../utils/response.js')
const paths = require('../../paths')
const {isCurrency} = require('../../browsered/field-validation-checks')

const DEFAULTS = {
  paymentDescription: 'An example payment description',
  paymentAmount: '20.00'
}
const AMOUNT_FORMAT = /^([0-9]+)(?:\.([0-9]{2}))?$/

module.exports = (req, res) => {
  const pageData = lodash.get(req, 'session.pageData.makeADemoPayment', {})
  const paymentDescription = req.body['payment-description'] || pageData.paymentDescription || DEFAULTS.paymentDescription
  let paymentAmount = req.body['payment-amount'] || pageData.paymentAmount || DEFAULTS.paymentAmount

  if (!paymentAmount || isCurrency(paymentAmount)) {
    lodash.set(req, 'session.pageData.makeADemoPayment.paymentAmount', paymentAmount)
    req.flash('genericError', `<h2>Use valid characters only</h2> ${isCurrency(paymentAmount)}`)
    return res.redirect(paths.prototyping.demoPayment.editAmount)
  }

  paymentAmount = paymentAmount.replace(/[^0-9.-]+/g, '')
  const currencyMatch = AMOUNT_FORMAT.exec(paymentAmount)
  if (!currencyMatch[2]) {
    paymentAmount = paymentAmount + '.00'
  }

  lodash.set(req, 'session.pageData.makeADemoPayment', {paymentDescription, paymentAmount})

  response(req, res, 'dashboard/demo-payment/index', {
    paymentAmount,
    paymentDescription,
    nextPage: paths.prototyping.demoPayment.mockCardDetails,
    editDescription: paths.prototyping.demoPayment.editDescription,
    editAmount: paths.prototyping.demoPayment.editAmount
  })
}
