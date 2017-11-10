'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const {response} = require('../../utils/response.js')
const paths = require('../../paths')

module.exports = (req, res) => {
  let paymentAmount = req.body['payment-amount']

  if (paymentAmount) {
    paymentAmount = paymentAmount.replace(/[^0-9.-]+/g, '')
  }

  const currencyMatch = /^([0-9]+)(?:\.([0-9]{2}))?$/.exec(paymentAmount)

  if (currencyMatch && !currencyMatch[2]) {
    paymentAmount = paymentAmount + '.00'
  }

  let protoPaymentDescription = req.body['payment-description'] || lodash.get(req, 'session.pageData.protoData.protoPaymentDescription', 'An example payment description')
  let protoPaymentAmount = paymentAmount || lodash.get(req, 'session.pageData.protoData.protoPaymentAmount', '20.00')

  let params = {
    protoPaymentDescription,
    protoPaymentAmount,
    nextPage: paths.prototyping.demoPayment.mockCardDetails,
    editDescription: paths.prototyping.demoPayment.editDescription,
    editAmount: paths.prototyping.demoPayment.editAmount
  }

  lodash.set(req, 'session.pageData.protoData', {
    protoPaymentDescription,
    protoPaymentAmount
  })

  response(req, res, 'dashboard/demo-payment/index', params)
}
