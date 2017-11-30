'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const {response} = require('../../utils/response.js')
const paths = require('../../paths')

const PAGE_DATA = {
  nextPage: paths.prototyping.demoPayment.goToPaymentScreens,
  lastPage: paths.prototyping.demoPayment.index
}

module.exports = (req, res) => {
  const {paymentAmount, paymentDescription} = lodash.get(req, 'session.pageData.makeADemoPayment', {})

  if (!paymentAmount || !paymentDescription) {
    return res.redirect(paths.prototyping.demoPayment.index)
  }

  response(req, res, 'dashboard/demo-payment/mock-card-details', PAGE_DATA)
}
