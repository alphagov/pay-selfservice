var response = require('../utils/response.js').response
var auth = require('../services/auth_service.js')
var router = require('../routes.js')
var _ = require('lodash')
var CORRELATION_HEADER = require('../utils/correlation_header.js').CORRELATION_HEADER

var {
  TYPES,
  connectorClient,
  renderConnectorError,
  redirectTo,
  reconcileCardsByBrand,
  filter3dsRequiredCardTypesIfNotSupported} = require('./payment_types_controller.js')

module.exports.showBrands = function (req, res) {
  var acceptedType = req.query.acceptedType
  var error = req.query.error
  var correlationId = req.headers[CORRELATION_HEADER] || ''

  var init = function () {
    var params = {
      correlationId: correlationId
    }

    connectorClient()
      .getAllCardTypes(params, onSuccessGetAllCards)
      .on('connectorError', renderConnectorError(req, res, 'Unable to retrieve card types.'))
  }

  var onSuccessGetAllCards = function (allCards) {
    var onSuccessGetAccountAcceptedCards = function (acceptedCards) {
      var model = {
        acceptedType: acceptedType,
        isAcceptedTypeAll: acceptedType === TYPES.ALL,
        isAcceptedTypeDebit: acceptedType === TYPES.DEBIT,
        error: error,
        brands: reconcileCardsByBrand(
          acceptedType,
          acceptedCards['card_types'],
          filter3dsRequiredCardTypesIfNotSupported(req.account.supports3ds, allCards['card_types']),
          req.account.requires3ds
        )
      }

      response(req, res, 'payment_types_select_brand', model)
    }

    var accountId = auth.getCurrentGatewayAccountId(req)

    var params = {
      gatewayAccountId: accountId,
      correlationId: correlationId
    }

    connectorClient()
      .getAcceptedCardsForAccount(params, onSuccessGetAccountAcceptedCards)
      .on('connectorError', renderConnectorError(req, res, 'Unable to retrieve accepted card types for the account.'))
  }

  init()
}

module.exports.updateBrands = function (req, res) {
  var acceptedType = req.body['acceptedType']
  var acceptedBrands = req.body['acceptedBrands']
  var correlationId = req.headers[CORRELATION_HEADER] || ''

  var init = function () {
    if (typeof (acceptedBrands) === 'undefined') {
      redirectTo(res, router.paths.paymentTypes.selectBrand, {
        'acceptedType': acceptedType,
        'error': 'You must choose to accept at least one card brand to continue'
      })
      return
    }

    var params = {
      correlationId: correlationId
    }

    connectorClient()
      .getAllCardTypes(params, onSuccessGetAllCards)
      .on('connectorError', renderConnectorError(req, res, 'Unable to retrieve card types.'))
  }

  var onSuccessGetAllCards = function (allCards) {
    /**
     * Filter card types by accepted brand and type.
     */
    var filterByAcceptedBrandAndType = function (card) {
      if ((acceptedType === TYPES.DEBIT) && (card['type'] !== TYPES.DEBIT)) {
        return false
      }
      return _.includes(acceptedBrands, card['brand'])
    }

    var acceptedCardTypeIds = _
      .chain(allCards['card_types'])
      .filter(filterByAcceptedBrandAndType)
      .map('id')
      .value()

    var payload = {
      card_types: acceptedCardTypeIds
    }

    var accountId = auth.getCurrentGatewayAccountId(req)

    var params = {
      gatewayAccountId: accountId,
      payload: payload,
      correlationId: correlationId
    }
    connectorClient()
      .postAcceptedCardsForAccount(params, onSuccessPostAccountAcceptedCards)
      .on('connectorError', renderConnectorError(req, res, 'Unable to save accepted card types.'))
  }

  var onSuccessPostAccountAcceptedCards = function () {
    redirectTo(res, router.paths.paymentTypes.summary, {
      'acceptedType': acceptedType
    })
  }

  init()
}
