'use strict'

const response = require('../utils/response.js').response
const auth = require('../services/auth_service.js')
const router = require('../routes.js')
const renderErrorView = require('../utils/response.js').renderErrorView
const ConnectorClient = require('../services/clients/connector_client.js').ConnectorClient
const CORRELATION_HEADER = require('../utils/correlation_header.js').CORRELATION_HEADER
const _ = require('lodash')

const renderConnectorError = function (request, response, errorMessage) {
  return function (connectorError) {
    if (connectorError) {
      renderErrorView(request, response, 'Internal server error')
      return
    }

    renderErrorView(request, response, errorMessage)
  }
}

module.exports.index = function (req, res) {
  const onSuccessGetAccountAcceptedCards = function (acceptedCards) {
    let model = {
      supports3ds: req.account.supports3ds,
      requires3ds: req.account.requires3ds,
      hasAnyCardTypeRequiring3dsSelected: _.some(acceptedCards['card_types'], {'requires3ds': true}),
      justToggled: typeof req.query.toggled !== 'undefined',
      showHelper3ds: req.account.payment_provider === 'worldpay'
    }

    show(req, res, 'index', model)
  }

  if (!req.account) {
    return renderErrorView(req, res, 'Unable to retrieve the 3D Secure setting.')
  }

  const accountId = auth.getCurrentGatewayAccountId(req)
  const correlationId = req.headers[CORRELATION_HEADER] || ''

  const params = {
    gatewayAccountId: accountId,
    correlationId: correlationId
  }

  connectorClient()
    .getAcceptedCardsForAccount(params, onSuccessGetAccountAcceptedCards)
    .on('connectorError', renderConnectorError(req, res, 'Unable to retrieve accepted card types for the account.'))
}

module.exports.onConfirm = (req, res) => {
  show(req, res, 'on_confirm', {})
}

module.exports.on = function (req, res) {
  toggle(req, res, true)
}

module.exports.off = function (req, res) {
  toggle(req, res, false)
}

const connectorClient = function () {
  return new ConnectorClient(process.env.CONNECTOR_URL)
}

const show = function (req, res, resource, data) {
  let template = '3d_secure/' + resource
  response(req, res, template, data)
}

const toggle = function (req, res, trueOrFalse) {
  let correlationId = req.headers[CORRELATION_HEADER] || ''

  const init = function () {
    let accountId = auth.getCurrentGatewayAccountId(req)

    let payload = {
      toggle_3ds: trueOrFalse
    }

    let params = {
      gatewayAccountId: accountId,
      payload: payload,
      correlationId: correlationId
    }

    connectorClient()
      .update3dsEnabled(params, onSuccess)
      .on('connectorError', onError)
  }

  const onSuccess = function () {
    res.redirect(303, router.paths.toggle3ds.index + '?toggled')
  }

  const onError = function () {
    renderErrorView(req, res, 'Unable to toggle 3D Secure.')
  }

  init()
}
