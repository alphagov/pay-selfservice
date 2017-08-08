var ConnectorClient = require('../services/clients/connector_client.js').ConnectorClient
var errorView = require('../utils/response.js').renderErrorView
var querystring = require('querystring')
var _ = require('lodash')

var TYPES = {ALL: 'ALL', DEBIT: 'DEBIT'}

module.exports.TYPES = TYPES

module.exports.connectorClient = function () {
  return new ConnectorClient(process.env.CONNECTOR_URL)
}

module.exports.reconcileCardsByBrand = function (acceptedType, acceptedCards, allCards, accountRequires3ds) {
  var isCardAvailableRegarding3dsRequirements = card => {
    return !card['requires3ds'] || accountRequires3ds
  }

  var isCardAvailableRegardingTypeRequirements = card => {
    if (acceptedType === TYPES.ALL) return true
    if (card['type'] === TYPES.DEBIT) return true
    return false
  }

  var isCardAvailable = (card) => {
    return isCardAvailableRegarding3dsRequirements(card) &&
      isCardAvailableRegardingTypeRequirements(card)
  }

  var getCardUnavailabilityReason = (card) => {
    if (!isCardAvailableRegarding3dsRequirements(card)) {
      return 'You must <a href=\'/3ds\'>enable 3D Secure</a> to accept Maestro'
    }
    if (!isCardAvailableRegardingTypeRequirements(card)) {
      return 'Not available'
    }
    return ''
  }

  var reconciledCardTypes = _.map(allCards, function (card) {
    return {
      'id': 'payment-types-' + card['brand'] + '-brand',
      'value': card['brand'],
      'label': card['label'],
      'available': isCardAvailable(card),
      'unavailabilityReason': getCardUnavailabilityReason(card),
      'selected': ((acceptedCards.length < 1) || _.some(acceptedCards, {'id': card['id']})) ? 'checked' : ''
    }
  })

  return _
    .chain(reconciledCardTypes)
    .groupBy('id')
    .map(function (cardsById) {
      var first = _.first(cardsById)
      first['available'] = _.some(cardsById, {'available': true})
      first['unavailabilityReason'] = first['available'] ? '' : first['unavailabilityReason']
      first['selected'] = _.some(cardsById, {'selected': 'checked'}) ? 'checked' : ''
      return first
    })
    .sortBy(function (card) {
      return !card['available']
    })
    .value()
}

module.exports.redirectTo = function (response, path, query) {
  response.redirect(303, path + '?' + querystring.stringify(query))
}

module.exports.renderConnectorError = function (request, response, errorMessage) {
  return function (connectorError) {
    if (connectorError) {
      errorView(request, response, 'Internal server error')
      return
    }

    errorView(request, response, errorMessage)
  }
}

module.exports.inferAcceptedCardType = function (acceptedCards) {
  var areAcceptedCardsAllDebit = false

  if (acceptedCards.length > 0) {
    areAcceptedCardsAllDebit = _.every(acceptedCards, {'type': TYPES.DEBIT})
  }

  return areAcceptedCardsAllDebit ? TYPES.DEBIT : TYPES.ALL
}

/**
 * Filter out card types that require 3DS when account doesn't support 3DS.
 */
module.exports.filter3dsRequiredCardTypesIfNotSupported = function (accountSupports3ds, cards) {
  return _.filter(cards, card => accountSupports3ds || (!accountSupports3ds && !card.requires3ds))
}
