'use strict'

const lodash = require('lodash')
const changeCase = require('change-case')
const dates = require('../utils/dates.js')
const router = require('../routes.js')
const qs = require('qs')
const { penceToPoundsWithCurrency } = require('./currency-formatter')
const Paginator = require('./paginator')
const states = require('./states')
const check = require('check-types')
const url = require('url')
const TransactionEvent = require('../models/TransactionEvent.class')
const DisputeTransaction = require('../models/DisputeTransaction.class')
const formatAccountPathsFor = require('../utils/format-account-paths-for')

const DATA_UNAVAILABLE = 'Data unavailable'
const REDACTED_PII_FIELD_VALUE = '<DELETED>'
const LEDGER_TRANSACTION_COUNT_LIMIT = 5000

module.exports = {
  /** prepares the transaction list view */
  buildPaymentList: function (connectorData, allCards, gatewayAccountExternalId, filtersResult, filtersDateRangeState, route, backPath) {
    connectorData.filters = filtersResult
    connectorData.hasFilters = Object.keys(filtersResult).length !== 0
    connectorData.hasResults = connectorData.results.length !== 0
    connectorData.total = connectorData.total || (connectorData.results && connectorData.results.length)
    connectorData.totalOverLimit = connectorData.total > LEDGER_TRANSACTION_COUNT_LIMIT
    connectorData.showCsvDownload = showCsvDownload(connectorData, filtersResult)
    connectorData.totalFormatted = connectorData.total.toLocaleString()
    connectorData.maxLimitFormatted = parseInt(LEDGER_TRANSACTION_COUNT_LIMIT).toLocaleString()
    connectorData.paginationLinks = getPaginationLinks(connectorData)
    connectorData.hasPaginationLinks = !!getPaginationLinks(connectorData)
    connectorData.hasPageSizeLinks = hasPageSizeLinks(connectorData)
    connectorData.pageSizeLinks = getPageSizeLinks(connectorData)

    if(filtersDateRangeState){
      connectorData.isInvalidDateRange = filtersDateRangeState.isInvalidDateRange === true
      connectorData.fromDateParam = filtersDateRangeState.fromDateParam
      connectorData.toDateParam = filtersDateRangeState.toDateParam
    }

    connectorData.cardBrands = lodash.uniqBy(allCards.card_types, 'brand')
      .map(card => {
        return {
          value: card.brand,
          text: card.label === 'Jcb' ? card.label.toUpperCase() : card.label,
          selected: card.brand === filtersResult.brand
        }
      })

    connectorData.cardBrands.unshift({ value: '', text: 'All brands', selected: false })

    connectorData.results.forEach(element => {
      element.state_friendly = states.getDisplayNameForConnectorState(element.state, element.transaction_type)

      if (['fee', 'net_amount'].every(key => key in element)) {
        element.fee = asGBP(element.fee)
        element.net_amount = asGBP(element.net_amount)
      }
      element.amount = asGBP(element.amount)
      if (element.total_amount) {
        element.total_amount = asGBP(element.total_amount)
      }
      element.email = (element.email && element.email.length > 20) ? element.email.substring(0, 20) + '…' : element.email
      element.updated = dates.utcToDisplay(element.updated)
      element.created = dates.utcToDisplay(element.created_date)
      if (!gatewayAccountExternalId) {
        element.link = router.generateRoute(router.paths.allServiceTransactions.redirectDetail, {
          chargeId: element.charge_id
        })
      } else {
        element.link = formatAccountPathsFor(router.paths.account.transactions.detail, gatewayAccountExternalId, element.charge_id)
      }

      const transactionType = element.transaction_type && element.transaction_type.toLowerCase()
      if (transactionType === 'refund' || transactionType === 'dispute') {
        element.amount = `–${element.amount}`
      }
      delete element.created_date
    })

    if (route) {
      connectorData.downloadTransactionLink = router.generateRoute(
        route, {
          reference: filtersResult.reference,
          email: filtersResult.email,
          payment_states: filtersResult.payment_states,
          refund_states: filtersResult.refund_states,
          dispute_states: filtersResult.dispute_states,
          brand: filtersResult.brand,
          fromDate: filtersResult.fromDate,
          toDate: filtersResult.toDate,
          fromTime: filtersResult.fromTime,
          toTime: filtersResult.toTime,
          cardholderName: filtersResult.cardholderName,
          lastDigitsCardNumber: filtersResult.lastDigitsCardNumber,
          metadataValue: filtersResult.metadataValue,
          agreementId: filtersResult.agreementId
        })
    }

    return connectorData
  },

  buildPaymentView: function (chargeData, eventsData, disputeTransactionData, users = []) {
    chargeData.state_friendly = states.getDisplayNameForConnectorState(chargeData.state, chargeData.transaction_type)
    chargeData.refund_summary = chargeData.refund_summary || {}

    if (['fee', 'net_amount'].every(key => key in chargeData)) {
      chargeData.fee = asGBP(chargeData.fee)
      chargeData.net_amount = asGBP(chargeData.net_amount)
    }

    chargeData.amount = asGBP(chargeData.amount)
    if (chargeData.total_amount) {
      chargeData.total_amount = asGBP(chargeData.total_amount)
    }
    if (chargeData.corporate_card_surcharge) {
      chargeData.corporate_card_surcharge = asGBP(chargeData.corporate_card_surcharge)
    }

    if (chargeData.reference === REDACTED_PII_FIELD_VALUE) {
      chargeData.reference = DATA_UNAVAILABLE
    }

    if (chargeData.description === REDACTED_PII_FIELD_VALUE) {
      chargeData.description = DATA_UNAVAILABLE
    }

    if (chargeData.email === REDACTED_PII_FIELD_VALUE) {
      chargeData.email = DATA_UNAVAILABLE
    }

    if (chargeData.card_details) {
      if (chargeData.card_details.card_brand == null) chargeData.card_details.card_brand = DATA_UNAVAILABLE
      if (chargeData.card_details.cardholder_name == null || chargeData.card_details.cardholder_name === REDACTED_PII_FIELD_VALUE) chargeData.card_details.cardholder_name = DATA_UNAVAILABLE
      if (chargeData.card_details.expiry_date == null) chargeData.card_details.expiry_date = DATA_UNAVAILABLE
      if (chargeData.card_details.last_digits_card_number == null) chargeData.card_details.last_digits_card_number = '****'
      if (chargeData.card_details.first_digits_card_number == null) chargeData.card_details.first_digits_card_number = '**** **'
    } else {
      chargeData.card_details = {
        card_brand: DATA_UNAVAILABLE,
        cardholder_name: DATA_UNAVAILABLE,
        expiry_date: DATA_UNAVAILABLE,
        last_digits_card_number: '****',
        first_digits_card_number: '**** **'
      }
    }

    chargeData.card_details.first_digits_card_number = formatFirstSixDigitsCardNumber(chargeData.card_details.first_digits_card_number)
    chargeData.refundable = chargeData.refund_summary.status === 'available' || chargeData.refund_summary.status === 'error'
    chargeData.refund_unavailable_due_to_dispute = chargeData.refund_summary.status === 'unavailable' && chargeData.disputed === true
    chargeData.refundable_amount = (chargeData.refund_summary.amount_available / 100).toFixed(2)
    chargeData.refunded_amount = asGBP(chargeData.refund_summary.amount_submitted || 0)
    chargeData.refunded = chargeData.refund_summary.amount_submitted !== 0
    chargeData.refundable_amount_display = asGBP(chargeData.refund_summary.amount_available)

    chargeData.payment_provider = changeCase.upperCaseFirst(chargeData.payment_provider)
    chargeData.wallet_type = changeCase.titleCase(chargeData.wallet_type)
    chargeData.updated = dates.utcToDisplay(eventsData.events[0] && eventsData.events[0].updated)
    chargeData.events = eventsData.events.map(eventData => new TransactionEvent(eventData)).reverse()
    chargeData.events.forEach(event => {
      if (event.submitted_by && event.state_friendly === 'Refund submitted') {
        event.submitted_by_friendly = lodash.get(users.find(user => user.externalId === event.submitted_by) || {}, 'email')
      }
    })

    if (disputeTransactionData) {
      chargeData.dispute = new DisputeTransaction(disputeTransactionData)
    }

    delete chargeData['links']
    delete chargeData['return_url']
    return chargeData
  }
}

function formatFirstSixDigitsCardNumber (number) {
  if (number.charAt(4) !== ' ') {
    return number.substr(0, 4) + ' ' + number.substr(4)
  }
  return number
}

function asGBP (amountInPence) {
  return penceToPoundsWithCurrency(amountInPence)
}

function getPaginationLinks (connectorData) {
  if (connectorData.total) {
    const paginator = new Paginator(connectorData.total, getCurrentPageSize(connectorData), getCurrentPageNumber(connectorData))
    return paginator.buildNavigationLinks(connectorData._links, connectorData.results.length)
  }
}

function getPageSizeLinks (connectorData) {
  if (getCurrentPageSize(connectorData)) {
    const paginator = new Paginator(connectorData.total, getCurrentPageSize(connectorData), getCurrentPageNumber(connectorData))
    return paginator.getDisplaySizeOptions()
  }
}

function getCurrentPageNumber (connectorData) {
  return connectorData.page
}

function getCurrentPageSize (connectorData) {
  const selfLink = connectorData._links && connectorData._links.self
  let queryString
  let limit

  if (selfLink) {
    queryString = url.parse(selfLink.href).query
    limit = Number(qs.parse(queryString).display_size)
    if (check.number(limit) && limit > 0) {
      return limit
    }
  }
}

function hasPageSizeLinks (connectorData) {
  const paginator = new Paginator(connectorData.total, getCurrentPageSize(connectorData), getCurrentPageNumber(connectorData))
  return paginator.showDisplaySizeLinks()
}

function showCsvDownload (connectorData, filters) {
  if (connectorData.total <= LEDGER_TRANSACTION_COUNT_LIMIT) {
    return true
  }

  const hasUserFilteredResults = Object.keys(filters)
    .filter((key) => !['page', 'pageSize'].includes(key))
    .length !== 0

  return hasUserFilteredResults
}
