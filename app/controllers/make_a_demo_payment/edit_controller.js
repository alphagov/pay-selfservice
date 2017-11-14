'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const {response} = require('../../utils/response.js')
const {editDescription, index} = require('../../paths').prototyping.demoPayment

module.exports = (req, res) => {
  const pageData = lodash.get(req, 'session.pageData.makeADemoPayment', {})
  const template = req.path === editDescription ? 'dashboard/demo-payment/edit-description' : 'dashboard/demo-payment/edit-amount'

  response(req, res, template, {
    paymentDescription: pageData.paymentDescription,
    paymentAmount: pageData.paymentAmount,
    nextPage: index
  })
}
