'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const {response} = require('../../utils/response.js')
const paths = require('../../paths')

module.exports = (req, res) => {
  let params = {
    protoPaymentDescription: lodash.get(req, 'session.pageData.protoData.protoPaymentDescription'),
    protoPaymentAmount: lodash.get(req, 'session.pageData.protoData.protoPaymentAmount'),
    nextPage: paths.prototyping.demoPayment.index
  }

  if (req.path === paths.prototyping.demoPayment.editDescription) {
    response(req, res, 'dashboard/demo-payment/edit-description', params)
  } else {
    response(req, res, 'dashboard/demo-payment/edit-amount', params)
  }
}
