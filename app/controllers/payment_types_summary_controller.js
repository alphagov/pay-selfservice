'use strict'

// Local dependencies
const response = require('../utils/response.js').response
const auth = require('../services/auth_service.js')
const {CORRELATION_HEADER} = require('../utils/correlation_header.js')
const {
  TYPES,
  connectorClient,
  renderConnectorError,
  reconcileCardsByBrand,
  inferAcceptedCardType,
  filter3dsRequiredCardTypesIfNotSupported} = require('./payment_types_controller.js')

module.exports.showSummary = (req, res) => {
  const correlationId = req.headers[CORRELATION_HEADER] || ''

  const init = () => {
    const params = {
      correlationId: correlationId
    }

    connectorClient()
      .getAllCardTypes(params, onSuccessGetAllCards)
      .on('connectorError', renderConnectorError(req, res, 'Unable to retrieve card types.'))
  }

  const onSuccessGetAllCards = allCards => {
    const onSuccessGetAccountAcceptedCards = acceptedCards => {
      const acceptedType = inferAcceptedCardType(acceptedCards['card_types'])

      const model = {
        isAcceptedTypeAll: acceptedType === TYPES.ALL,
        isAcceptedTypeDebit: acceptedType === TYPES.DEBIT,
        brands: reconcileCardsByBrand(
          acceptedType,
          acceptedCards['card_types'],
          filter3dsRequiredCardTypesIfNotSupported(req.account.supports3ds, allCards['card_types']),
          req.account.requires3ds
        )
      }

      response(req, res, 'card-payment-types/summary', model)
    }

    const accountId = auth.getCurrentGatewayAccountId(req)

    const params = {
      gatewayAccountId: accountId,
      correlationId: correlationId
    }

    connectorClient()
      .getAcceptedCardsForAccount(params, onSuccessGetAccountAcceptedCards)
      .on('connectorError', renderConnectorError(req, res, 'Unable to retrieve accepted card types for the account.'))
  }

  init()
}
