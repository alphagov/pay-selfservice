var _ = require('lodash')
var changeCase = require('change-case')
var dates = require('../utils/dates.js')
var router = require('../routes.js')
var qs = require('qs')
var Paginator = require('./paginator')
var check = require('check-types')
var url = require('url')

const DATA_UNAVAILABLE = 'Data unavailable'
const PAGINATION_SPREAD = 2
const CURRENCY = '£'
const eventStates = {
  'created': 'Service created payment of AMOUNT',
  'started': 'User started payment of AMOUNT',
  'submitted': 'User submitted payment details for payment of AMOUNT',
  'success': 'Payment of AMOUNT succeeded',
  'error': 'Error processing payment of AMOUNT',
  'failed': 'User failed to complete payment of AMOUNT',
  'cancelled': 'Service cancelled payment of AMOUNT'
}

function getPaginationLinks (connectorData) {
  if (connectorData.total) {
    var paginator = new Paginator(connectorData.total, getCurrentPageSize(connectorData), getCurrentPageNumber(connectorData))
    return paginator.getLast() > 1 ? paginator.getNamedCentredRange(PAGINATION_SPREAD, true, true) : null
  }
}

function getPageSizeLinks (connectorData) {
  if (getCurrentPageSize(connectorData)) {
    var paginator = new Paginator(connectorData.total, getCurrentPageSize(connectorData), getCurrentPageNumber(connectorData))
    return paginator.getDisplaySizeOptions()
  }
}

function getCurrentPageNumber (connectorData) {
  return connectorData.page
}

function getCurrentPageSize (connectorData) {
  var selfLink = connectorData._links && connectorData._links.self
  var queryString
  var limit

  if (selfLink) {
    queryString = url.parse(selfLink.href).query
    limit = Number(qs.parse(queryString).display_size)
    if (check.number(limit) && limit > 0) {
      return limit
    }
  }
}

function hasPageSizeLinks (connectorData) {
  var paginator = new Paginator(connectorData.total, getCurrentPageSize(connectorData), getCurrentPageNumber(connectorData))
  return paginator.showDisplaySizeLinks()
}

module.exports = {
  /** prepares the transaction list view */
  buildPaymentList: function (connectorData, allCards, gatewayAccountId, filters) {
    connectorData.filters = filters
    connectorData.hasFilters = Object.keys(filters).length !== 0
    connectorData.hasResults = connectorData.results.length !== 0

    connectorData.total = connectorData.total || (connectorData.results && connectorData.results.length)
    connectorData.paginationLinks = getPaginationLinks(connectorData)
    connectorData.hasPaginationLinks = !!getPaginationLinks(connectorData)

    connectorData.hasPageSizeLinks = hasPageSizeLinks(connectorData)
    connectorData.pageSizeLinks = getPageSizeLinks(connectorData)

    connectorData.eventStates = Object.keys(eventStates).map(function (str) {
      var value = {}
      value.text = changeCase.upperCaseFirst(str.toLowerCase())
      if (str === filters.state) {
        value.selected = true
      }
      return {'key': str, 'value': value}
    })

    connectorData.cardBrands = _.uniqBy(allCards.card_types, 'brand')
      .map((card) => {
        var value = {}
        value.text = card.label
        if (card.brand === filters.brand) {
          value.selected = true
        }
        return {'key': card.brand, 'value': value}
      })

    connectorData.results.forEach(function (element) {
      element.state_friendly = changeCase.upperCaseFirst(element.state.status.toLowerCase())
      element.amount = (element.amount / 100).toFixed(2)
      element.email = (element.email && element.email.length > 20) ? element.email.substring(0, 20) + '...' : element.email
      element.updated = dates.utcToDisplay(element.updated)
      element.created = dates.utcToDisplay(element.created_date)
      element.gateway_account_id = gatewayAccountId
      element.link = router.generateRoute(router.paths.transactions.detail, {
        chargeId: element.charge_id
      })
      delete element.created_date
    })

    // TODO normalise fromDate and ToDate so you can just pass them through no problem
    connectorData.downloadTransactionLink = router.generateRoute(
      router.paths.transactions.download, {
        reference: filters.reference,
        email: filters.email,
        state: filters.state,
        brand: filters.brand,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        fromTime: filters.fromTime,
        toTime: filters.toTime
      })

    return connectorData
  },

  buildPaymentView: function (chargeData, eventsData) {
    eventsData.events = eventsData.events.filter(event => event.type !== 'REFUND')

    eventsData.events.forEach(function (event) {
      event.state_friendly = eventStates[event.state.status]
      if (event.state_friendly) {
        event.state_friendly = event.state_friendly.replace('AMOUNT', CURRENCY + (chargeData.amount / 100).toFixed(2))
      }
      event.updated_friendly = dates.utcToDisplay(event.updated)
    })

    chargeData.state_friendly = changeCase.upperCaseFirst(chargeData.state.status.toLowerCase())

    var amount = (chargeData.amount / 100).toFixed(2)
    chargeData.amount = CURRENCY + amount

    if (chargeData.card_details) {
      if (chargeData.card_details.card_brand == null) chargeData.card_details.card_brand = DATA_UNAVAILABLE
      if (chargeData.card_details.cardholder_name == null) chargeData.card_details.cardholder_name = DATA_UNAVAILABLE
      if (chargeData.card_details.expiry_date == null) chargeData.card_details.expiry_date = DATA_UNAVAILABLE
      if (chargeData.card_details.last_digits_card_number == null) chargeData.card_details.last_digits_card_number = '****'
    } else {
      chargeData.card_details = {
        card_brand: DATA_UNAVAILABLE,
        cardholder_name: DATA_UNAVAILABLE,
        expiry_date: DATA_UNAVAILABLE,
        last_digits_card_number: '****'
      }
    }

    chargeData.refundable = chargeData.refund_summary.status === 'available'
    chargeData.net_amount = (chargeData.refund_summary.amount_available / 100).toFixed(2)
    chargeData.refunded_amount = CURRENCY + (chargeData.refund_summary.amount_submitted / 100).toFixed(2)
    chargeData.refunded = chargeData.refund_summary.amount_submitted !== 0
    chargeData.net_amount_display = CURRENCY + chargeData.net_amount

    chargeData.payment_provider = changeCase.upperCaseFirst(chargeData.payment_provider)
    chargeData.updated = dates.utcToDisplay(eventsData.events[0] && eventsData.events[0].updated)
    chargeData['events'] = eventsData.events.reverse()
    delete chargeData['links']
    delete chargeData['return_url']
    return chargeData
  }
}
