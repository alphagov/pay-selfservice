'use strict'

// NPM Dependencies
const lodash = require('lodash')

// Local Dependencies
const {response} = require('../utils/response.js')
const paths = require('../paths')
const productsClient = require('../services/clients/products_client.js')
const auth = require('../services/auth_service.js')

module.exports.index = function (req, res) {
  let paymentAmount = req.body['payment-amount']

  if (paymentAmount) {
    paymentAmount = paymentAmount.replace(/[^0-9.-]+/g, '')
  }

  const currencyMatch = /^([0-9]+)(?:\.([0-9]{2}))?$/.exec(paymentAmount)

  if (currencyMatch && !currencyMatch[2]) {
    paymentAmount = paymentAmount + '.00'
  }

  let protoPaymentDescription = req.body['payment-description'] || lodash.get(req, 'session.pageData.protoData.protoPaymentDescription', 'An example payment description')
  let protoPaymentAmount = paymentAmount || lodash.get(req, 'session.pageData.protoData.protoPaymentAmount', '20.00')

  let params = {
    protoPaymentDescription,
    protoPaymentAmount,
    nextPage: paths.prototyping.demoPayment.mockCardDetails,
    editDescription: paths.prototyping.demoPayment.editDescription,
    editAmount: paths.prototyping.demoPayment.editAmount
  }

  lodash.set(req, 'session.pageData.protoData', {
    protoPaymentDescription,
    protoPaymentAmount
  })

  console.log('index function')

  response(req, res, 'dashboard/demo-payment/index', params)
}

module.exports.edit = function (req, res) {
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

module.exports.confirm = function (req, res) {
  let protoData = lodash.get(req, 'session.pageData.protoData')
  let gatewayAccountId = auth.getCurrentGatewayAccountId(req)

  console.log('confirm function')

  if (protoData) {
    let data = {
      name: protoData.protoPaymentDescription,
      price: protoData.protoPaymentAmount,
      gateway_account_id: gatewayAccountId
    }

    productsClient.product.create(data)
    .then(product => {
      console.log('CREATING LINK', product)
      let params = {
        prototypeLink: product.payLink.href
      }
      response(req, res, 'dashboard/demo-payment/confirm', params)
    })
    .catch(error => {
      console.log('>>>>>>', error)
      let params = {
        error: error.message
      }
      response(req, res, 'dashboard/demo-payment/index', params)
    })
  } else {
    res.redirect(paths.prototyping.demoPayment.index)
  }
}
