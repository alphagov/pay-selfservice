'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response.js')
const paths = require('../../paths')

module.exports = (req, res) => {
  const { paymentAmount, paymentDescription } = lodash.get(req, 'session.pageData.makeADemoPayment', {})

  if (!paymentAmount || !paymentDescription) {
    return res.redirect(paths.prototyping.demoPayment.index)
  }

  response(req, res, 'dashboard/demo-payment/mock-card-details', {})
}
