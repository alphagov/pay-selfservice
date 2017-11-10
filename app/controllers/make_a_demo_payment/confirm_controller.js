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
  let protoData = lodash.get(req, 'session.pageData.protoData')
  let gatewayAccountId = auth.getCurrentGatewayAccountId(req)

  if (protoData) {
    let params = {
      indexPage: paths.user.loggedIn,
      name: protoData.protoPaymentDescription,
      price: protoData.protoPaymentAmount,
      gateway_account_id: gatewayAccountId
    }

    publicAuthClient.createTokenForAccount({
      accountId: gatewayAccountId,
      correlationId: req.correlationId,
      payload: {
        account_id: gatewayAccountId,
        created_by: req.user.email,
        description: `Token for Prototype: ${req.body['payment-description']}`
      }
    })
      .then(publicAuthData => productsClient.product.create({
        payApiToken: publicAuthData.token,
        gatewayAccountId,
        name: protoData.protoPaymentDescription,
        price: protoData.protoPaymentAmount
      }))
      .then(product => {
        params.prototypeLink = lodash.get(product, 'links.pay.href')
        return response(req, res, 'dashboard/demo-payment/confirm', params)
      })
      .catch(error => {
        req.flash('genericError', `<h2>There were errors</h2> ${error}`)
        return res.redirect(paths.prototyping.demoPayment.index)
      })
  } else {
    res.redirect(paths.prototyping.demoPayment.index)
  }
}
