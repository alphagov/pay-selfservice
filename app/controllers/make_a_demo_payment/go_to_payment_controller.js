'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const paths = require('../../paths')
const productsClient = require('../../services/clients/products_client.js')
const publicAuthClient = require('../../services/clients/public_auth_client')
const auth = require('../../services/auth_service.js')

module.exports = (req, res) => {
  const gatewayAccountId = auth.getCurrentGatewayAccountId(req)
  const {paymentAmount, paymentDescription} = lodash.get(req, 'session.pageData.makeADemoPayment', {})

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
      serviceName: req.service.name,
      price: Math.trunc(paymentAmount * 100)
    }))
    .then(product => {
      lodash.unset(req, 'session.pageData.makeADemoPayment')
      res.redirect(product.links.pay.href)
    })
    .catch(() => {
      req.flash('genericError', `<h2>There were errors</h2> Error while creating demo payment`)
      return res.redirect(paths.prototyping.demoPayment.index)
    })
}
