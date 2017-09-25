var qs = require('qs')
var check = require('check-types')
var Paginator = require('../utils/paginator.js')
var _ = require('lodash')

function validateFilters (filters) {
  var pageSizeIsNull = !check.assigned(filters.pageSize)
  var pageSizeInRange = check.inRange(Number(filters.pageSize), 1, Paginator.MAX_PAGE_SIZE)
  var pageIsNull = !check.assigned(filters.page)
  var pageIsPositive = check.positive(Number(filters.page))
  return (pageSizeIsNull || pageSizeInRange) &&
    (pageIsNull || pageIsPositive)
}

function describeFilters (filters) {
  let description = ``
  if (filters.fromDate) description += ` from ${filters.fromDate}`
  if (filters.toDate) description += ` to ${filters.toDate}`

  const paymentStates = filters.payment_states || []
  const refundStates = filters.refund_states ? filters.refund_states.map(state => `refund ${state}`) : []
  const selectedStates = [...paymentStates, ...refundStates].map(state => `'${state}'`)
  if (filters.state && selectedStates.length === 0) {
    description += ` with '${filters.state}' state`
  } else if (selectedStates.length === 1) {
    description += ` with ${selectedStates[0]} state`
  } else if (selectedStates.length > 1) {
    description += ` with states: ${selectedStates.join(', ').replace(/,([^,]*)$/, ' and$1')}`
  }

  if (filters.brand) description += ` with '${filters.brand}' card brand`

  return description
}

function getFilters (req) {
  let filters = qs.parse(req.query)

  if (filters.state) {
    const states = typeof filters.state === 'string' ? [filters.state] : filters.state
    filters.payment_states = states.filter(state => !state.includes('refund-')).map(state => state.replace('payment-', ''))
    filters.refund_states = states.filter(state => state.includes('refund-')).map(state => state.replace('refund-', ''))
    filters.state = [...filters.payment_states, ...filters.refund_states][0]
  }

  filters = _.omitBy(filters, _.isEmpty)
  return {
    valid: validateFilters(filters),
    result: filters
  }
}

module.exports = {
  getFilters: getFilters,
  describeFilters: describeFilters
}
