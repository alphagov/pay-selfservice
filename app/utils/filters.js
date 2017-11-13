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
  if (filters.fromDate) description += ` from <strong>${filters.fromDate}</strong>`
  if (filters.toDate) description += ` to <strong>${filters.toDate}</strong>`

  const paymentStates = filters.payment_states ? filters.payment_states.map(state => state.charAt(0).toUpperCase() + state.slice(1)) : []
  const refundStates = filters.refund_states ? filters.refund_states.map(state => `Refund ${state}`) : []
  const selectedStates = [...paymentStates, ...refundStates].map(state => `${state}`)
  if (filters.state && selectedStates.length === 0) {
    description += ` with <strong>${filters.state}</strong> state`
  } else if (selectedStates.length === 1) {
    description += ` with <strong>${selectedStates[0]}</strong> state`
  } else if (selectedStates.length > 1) {
    description += ` with <strong>${selectedStates.join('</strong>, <strong>').replace(/,([^,]*)$/, ' or$1')}</strong> states`
  }

  if (filters.brand) description += ` with <strong>'${filters.brand}'</strong> card brand`

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
