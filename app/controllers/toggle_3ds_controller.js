var response = require('../utils/response.js').response
var auth = require('../services/auth_service.js')
var router = require('../routes.js')
var renderErrorView = require('../utils/response.js').renderErrorView
var ConnectorClient = require('../services/clients/connector_client.js').ConnectorClient
var CORRELATION_HEADER = require('../utils/correlation_header.js').CORRELATION_HEADER
var _ = require('lodash')

var renderConnectorError = function (request, response, errorMessage) {
  return function (connectorError) {
    if (connectorError) {
      renderErrorView(request, response, 'Internal server error')
      return
    }

    renderErrorView(request, response, errorMessage)
  }
}

module.exports.index = function (req, res) {
  var onSuccessGetAccountAcceptedCards = function (acceptedCards) {
    var model = {
      supports3ds: req.account.supports3ds,
      requires3ds: req.account.requires3ds,
      hasAnyCardTypeRequiring3dsSelected: _.some(acceptedCards['card_types'], {'requires3ds': true}),
      justToggled: typeof req.query.toggled !== 'undefined'
    }

    show(req, res, 'index', model)
  }

  if (!req.account) {
    return renderErrorView(req, res, 'Unable to retrieve the 3D Secure setting.')
  }

  var accountId = auth.getCurrentGatewayAccountId(req)
  var correlationId = req.headers[CORRELATION_HEADER] || ''

  var params = {
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

var connectorClient = function () {
  return new ConnectorClient(process.env.CONNECTOR_URL)
}

var show = function (req, res, resource, data) {
  var template = '3d_secure/' + resource
  response(req, res, template, data)
}

var toggle = function (req, res, trueOrFalse) {
  var correlationId = req.headers[CORRELATION_HEADER] || ''

  var init = function () {
    var accountId = auth.getCurrentGatewayAccountId(req)

    var payload = {
      toggle_3ds: trueOrFalse
    }

    var params = {
      gatewayAccountId: accountId,
      payload: payload,
      correlationId: correlationId
    }

    connectorClient()
      .update3dsEnabled(params, onSuccess)
      .on('connectorError', onError)
  }

  var onSuccess = function () {
    res.redirect(303, router.paths.toggle3ds.index + '?toggled')
  }

  var onError = function () {
    renderErrorView(req, res, 'Unable to toggle 3D Secure.')
  }

  init()
}
