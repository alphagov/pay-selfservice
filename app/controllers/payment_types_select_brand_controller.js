'use strict'

// NPM dependencies
const _ = require('lodash')

// Local dependencies
const response = require('../utils/response.js').response
const auth = require('../services/auth_service.js')
const router = require('../routes.js')
const {CORRELATION_HEADER} = require('../utils/correlation_header.js')
const {
  TYPES,
  connectorClient,
  renderConnectorError,
  redirectTo,
  reconcileCardsByBrand,
  filter3dsRequiredCardTypesIfNotSupported} = require('./payment_types_controller.js')

module.exports.showBrands = (req, res) => {
  const acceptedType = req.query.acceptedType
  const error = req.query.error
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
      const model = {
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

      response(req, res, 'card-payment-types/select_brand', model)
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

module.exports.updateBrands = (req, res) => {
  const acceptedType = req.body['acceptedType']
  const acceptedBrands = req.body['acceptedBrands']
  const correlationId = req.headers[CORRELATION_HEADER] || ''

  const init = () => {
    if (typeof (acceptedBrands) === 'undefined') {
      redirectTo(res, router.paths.paymentTypes.selectBrand, {
        'acceptedType': acceptedType,
        'error': 'You must choose to accept at least one card brand to continue'
      })
      return
    }

    const params = {
      correlationId: correlationId
    }

    connectorClient()
      .getAllCardTypes(params, onSuccessGetAllCards)
      .on('connectorError', renderConnectorError(req, res, 'Unable to retrieve card types.'))
  }

  const onSuccessGetAllCards = allCards => {
    /**
     * Filter card types by accepted brand and type.
     */
    const filterByAcceptedBrandAndType = card => {
      if ((acceptedType === TYPES.DEBIT) && (card['type'] !== TYPES.DEBIT)) {
        return false
      }
      return _.includes(acceptedBrands, card['brand'])
    }

    const acceptedCardTypeIds = _
      .chain(allCards['card_types'])
      .filter(filterByAcceptedBrandAndType)
      .map('id')
      .value()

    const payload = {
      card_types: acceptedCardTypeIds
    }

    const accountId = auth.getCurrentGatewayAccountId(req)

    const params = {
      gatewayAccountId: accountId,
      payload: payload,
      correlationId: correlationId
    }
    connectorClient()
      .postAcceptedCardsForAccount(params, onSuccessPostAccountAcceptedCards)
      .on('connectorError', renderConnectorError(req, res, 'Unable to save accepted card types.'))
  }

  const onSuccessPostAccountAcceptedCards = () => {
    redirectTo(res, router.paths.paymentTypes.summary, {
      'acceptedType': acceptedType
    })
  }

  init()
}
