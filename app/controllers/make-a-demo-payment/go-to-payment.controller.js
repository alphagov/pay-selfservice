'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const logger = require('../../utils/logger')(__filename)
const paths = require('../../paths')
const productsClient = require('../../services/clients/products.client.js')
const productTypes = require('../../utils/product-types')
const publicAuthClient = require('../../services/clients/public-auth.client')
const auth = require('../../services/auth.service.js')

module.exports = (req, res) => {
  const gatewayAccountId = auth.getCurrentGatewayAccountId(req)
  const { paymentAmount, paymentDescription } = lodash.get(req, 'session.pageData.makeADemoPayment', {})

  if (!paymentAmount || !paymentDescription) {
    return res.redirect(paths.prototyping.demoPayment.index)
  }
  publicAuthClient.createTokenForAccount({
    accountId: gatewayAccountId,
    correlationId: req.correlationId,
    payload: {
      account_id: gatewayAccountId,
      created_by: req.user.email,
      description: `Token for Demo Payment`
    }
  })
    .then(publicAuthData => productsClient.product.create({
      payApiToken: publicAuthData.token,
      gatewayAccountId,
      name: paymentDescription,
      price: paymentAmount,
      type: productTypes.DEMO
    }))
    .then(product => {
      lodash.unset(req, 'session.pageData.makeADemoPayment')
      res.redirect(product.links.pay.href)
    })
    .catch((err) => {
      logger.error(`[requestId=${req.correlationId}] Making a demo payment failed - ${err.message}`)
      req.flash('genericError', 'Something went wrong. Please try again.')
      return res.redirect(paths.prototyping.demoPayment.index)
    })
}
