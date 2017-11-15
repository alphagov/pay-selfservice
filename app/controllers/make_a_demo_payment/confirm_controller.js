'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const {response} = require('../../utils/response.js')
const paths = require('../../paths')
const productsClient = require('../../services/clients/products_client.js')
const publicAuthClient = require('../../services/clients/public_auth_client')
const auth = require('../../services/auth_service.js')

module.exports = (req, res) => {
  const gatewayAccountId = auth.getCurrentGatewayAccountId(req)
  const {paymentAmount, paymentDescription} = lodash.get(req, 'session.pageData.makeADemoPayment')

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
      price: Math.trunc(paymentAmount * 100)
    }))
    .then(product => {
      response(req, res, 'dashboard/demo-payment/confirm', {
        prototypeLink: lodash.get(product, 'links.pay.href'),
        indexPage: paths.user.loggedIn
      })
      lodash.unset(req, 'session.pageData.makeADemoPayment')
    })
    .catch(() => {
      req.flash('genericError', `<h2>There were errors</h2> Error while creating demo payment`)
      return res.redirect(paths.prototyping.demoPayment.index)
    })
}
