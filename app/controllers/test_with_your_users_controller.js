'use strict'

// Local Dependencies
const {response} = require('../utils/response.js')
const paths = require('../paths')
const productsClient = require('../services/clients/products_client.js')
const publicAuthClient = require('../services/clients/public_auth_client')
const auth = require('../services/auth_service.js')

const amountFormat = /^([0-9]+)(?:\.([0-9]{2}))?$/

module.exports.index = function (req, res) {
  let params = {
    showLinks: false,
    createPage: paths.prototyping.demoService.create,
    indexPage: paths.prototyping.demoService.index,
    linksPage: paths.prototyping.demoService.links
  }

  response(req, res, 'dashboard/demo-service/index', params)
}

module.exports.links = function (req, res) {
  let params = {
    showLinks: true,
    createPage: paths.prototyping.demoService.create,
    indexPage: paths.prototyping.demoService.index,
    linksPage: paths.prototyping.demoService.links
  }

  response(req, res, 'dashboard/demo-service/index', params)
}

module.exports.create = function (req, res) {
  let params = {
    indexPage: paths.prototyping.demoService.index,
    confirmPage: paths.prototyping.demoService.confirm
  }

  response(req, res, 'dashboard/demo-service/create', params)
}

module.exports.submit = function (req, res) {
  const params = {
    indexPage: paths.prototyping.demoService.index,
    confirmPage: paths.prototyping.demoService.confirm,
    linksPage: paths.prototyping.demoService.links
  }
  const amountFormatCheck = amountFormat.exec(req.body['payment-amount'])
  const gatewayAccountId = auth.getCurrentGatewayAccountId(req)
  let price = req.body['payment-amount']

  if (!amountFormatCheck) {
    req.flash('genericError', '<h2>Use valid characters only</h2> Choose an amount in pounds and pence using digits and a decimal point. For example “10.50”')
    response(req, res, 'dashboard/demo-service/create', params)
  } else {
    price = parseInt(amountFormatCheck[1]) * 100
    if (amountFormatCheck[2]) price += parseInt(amountFormatCheck[2])
  }

  publicAuthClient.createTokenForAccount({
    accountId: gatewayAccountId,
    correlationId: req.correlationId,
    payload: {
      account_id: gatewayAccountId,
      created_by: req.user.email,
      description: `Token for Prototype: ${req.body['payment-description']}`
    }})
    .then(publicAuthData => productsClient.product.create({
      payApiToken: publicAuthData.token,
      gatewayAccountId,
      name: req.body['payment-description'],
      return_url: req.body['confirmation-page'],
      price
    }))
    .then(product => {
      console.log('CREATING LINK', product)
      params.prototypeLink = product.links.pay.href
      response(req, res, 'dashboard/demo-service/confirm', params)
    })
    .catch(error => {
      console.log('>>>>>>', error)
      params.error = error.message
      response(req, res, 'dashboard/demo-service/create', params)
    })
}
