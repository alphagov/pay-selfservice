'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response.js')
const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')

module.exports = (req, res) => {
  const { paymentAmount, paymentDescription } = lodash.get(req, 'session.pageData.makeADemoPayment', {})

  if (!paymentAmount || !paymentDescription) {
    return res.redirect(formatAccountPathsFor(paths.account.prototyping.demoPayment.index, req.account.external_id))
  }

  response(req, res, 'dashboard/demo-payment/mock-card-details', {})
}
