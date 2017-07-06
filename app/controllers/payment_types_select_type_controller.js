var response = require('../utils/response.js').response
var auth = require('../services/auth_service.js')
var router = require('../routes.js')
var CORRELATION_HEADER = require('../utils/correlation_header.js').CORRELATION_HEADER

var {
  TYPES,
  connectorClient,
  renderConnectorError,
  redirectTo,
  inferAcceptedCardType} = require('./payment_types_controller.js')

module.exports.selectType = function (req, res) {
  var correlationId = req.headers[CORRELATION_HEADER] || ''

  var init = function () {
    var accountId = auth.getCurrentGatewayAccountId(req)

    var params = {
      gatewayAccountId: accountId,
      correlationId: correlationId
    }

    connectorClient()
      .getAcceptedCardsForAccount(params, onSuccessGetAccountAcceptedCards)
      .on('connectorError', renderConnectorError(req, res, 'Unable to retrieve accepted card types for the account.'))
  }

  var onSuccessGetAccountAcceptedCards = function (acceptedCards) {
    var acceptedType = inferAcceptedCardType(acceptedCards['card_types'])

    var model = {
      allCardOption: {
        type: TYPES.ALL,
        selected: acceptedType === TYPES.ALL ? 'checked' : ''
      },
      debitCardOption: {
        type: TYPES.DEBIT,
        selected: acceptedType === TYPES.DEBIT ? 'checked' : ''
      }
    }

    response(req, res, 'payment_types_select_type', model)
  }

  init()
}

module.exports.updateType = function (req, res) {
  var init = function () {
    redirectTo(res, router.paths.paymentTypes.selectBrand, {
      'acceptedType': req.body['payment-types-card-type']
    })
  }

  init()
}
