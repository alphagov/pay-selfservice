'use strict'

const querystring = require('querystring')
const _ = require('lodash')
const dates = require('./dates.js')

function getQueryStringForParams (params = {}, removeEmptyParams = false, flattenCardBrandsParam = false, ignorePagination = false, timeZone) {
  let queryStrings = {
    reference: params.reference,
    email: params.email,
    cardholder_name: params.cardholderName,
    last_digits_card_number: params.lastDigitsCardNumber,
    card_brand: params.brand,
    gateway_payout_id: params.gatewayPayoutId,
    from_date: dates.fromDateInTimeZoneToUTCAndIsoFormat(params.fromDate, params.fromTime, timeZone),
    to_date: dates.toDateInTimeZoneToUTCAndIsoFormat(params.toDate, params.toTime, timeZone),
    ...params.feeHeaders && { fee_headers: params.feeHeaders },
    ...params.motoHeader && { moto_header: params.motoHeader },
    metadata_value: params.metadataValue,
    agreement_id: params.agreementId
  }

  if (!ignorePagination) {
    queryStrings.page = params.page || 1
    queryStrings.display_size = params.pageSize || 100
  }

  if (params.payment_states) {
    queryStrings.payment_states = params.payment_states instanceof Array ? params.payment_states.join(',') : params.payment_states
  }
  if (params.refund_states) {
    queryStrings.refund_states = params.refund_states instanceof Array ? params.refund_states.join(',') : params.refund_states
  }
  if (params.dispute_states) {
    queryStrings.dispute_states = params.dispute_states instanceof Array ? params.dispute_states.join(',') : params.dispute_states
  }

  if (flattenCardBrandsParam) {
    queryStrings.card_brands = params.brand instanceof Array ? params.brand.join(',') : params.brand
    delete queryStrings.card_brand
  }

  if (removeEmptyParams) {
    queryStrings = _.pickBy(queryStrings, _.identity)
  }

  return querystring.stringify(queryStrings)
}

module.exports = getQueryStringForParams
