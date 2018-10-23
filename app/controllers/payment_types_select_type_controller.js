'use strict'

// Local dependencies
const response = require('../utils/response.js').response
const auth = require('../services/auth_service.js')
const router = require('../routes.js')
const { CORRELATION_HEADER } = require('../utils/correlation_header.js')
const {
  TYPES,
  connectorClient,
  renderConnectorError,
  redirectTo,
  inferAcceptedCardType} = require('./payment_types_controller.js')

module.exports.selectType = (req, res) => {
  const correlationId = req.headers[CORRELATION_HEADER] || ''

  const init = () => {
    const accountId = auth.getCurrentGatewayAccountId(req)

    const params = {
      gatewayAccountId: accountId,
      correlationId: correlationId
    }

    connectorClient()
      .getAcceptedCardsForAccount(params, onSuccessGetAccountAcceptedCards)
      .on('connectorError', renderConnectorError(req, res, 'Unable to retrieve accepted card types for the account.'))
  }

  const onSuccessGetAccountAcceptedCards = acceptedCards => {
    const acceptedType = inferAcceptedCardType(acceptedCards['card_types'])

    const model = {
      allCardOption: {
        type: TYPES.ALL,
        selected: acceptedType === TYPES.ALL ? 'checked' : ''
      },
      debitCardOption: {
        type: TYPES.DEBIT,
        selected: acceptedType === TYPES.DEBIT ? 'checked' : ''
      }
    }

    response(req, res, 'card-payment-types/select_type', model)
  }

  init()
}

module.exports.updateType = (req, res) => {
  const init = () => {
    redirectTo(res, router.paths.paymentTypes.selectBrand, {
      'acceptedType': req.body['payment-types-card-type']
    })
  }

  init()
}
