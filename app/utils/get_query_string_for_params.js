'use strict'

const querystring = require('querystring')
const dates = require('./dates.js')

function getQueryStringForParams (params = {}) {
  const queryStrings = {
    reference: params.reference,
    email: params.email,
    card_brand: params.brand,
    from_date: dates.fromDateToApiFormat(params.fromDate, params.fromTime),
    to_date: dates.toDateToApiFormat(params.toDate, params.toTime),
    page: params.page || 1,
    display_size: params.pageSize || 100
  }

  if (params.payment_states) {
    queryStrings.payment_states = params.payment_states
  }
  if (params.refund_states) {
    queryStrings.refund_states = params.refund_states
  }

  return querystring.stringify(queryStrings)
}

module.exports = getQueryStringForParams
