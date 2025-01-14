'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response.js')

const DEFAULTS = {
  paymentDescription: 'An example payment description',
  paymentAmount: '2000'
}

module.exports = function showDemoPaymentDetails (req, res) {
  let pageData = lodash.get(req, 'session.pageData.makeADemoPayment', {})
  if (lodash.isEmpty(pageData)) {
    pageData = {
      paymentDescription: DEFAULTS.paymentDescription,
      paymentAmount: DEFAULTS.paymentAmount
    }
    lodash.set(req, 'session.pageData.makeADemoPayment', pageData)
  }

  response(req, res, 'dashboard/demo-payment/index', pageData)
}
