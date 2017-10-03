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
  if (filters.fromDate) description += ` from <b>'${filters.fromDate}'</b>`
  if (filters.toDate) description += ` to <b>'${filters.toDate}'</b>`

  const paymentStates = filters.payment_states || []
  const refundStates = filters.refund_states ? filters.refund_states.map(state => `refund ${state}`) : []
  const selectedStates = [...paymentStates, ...refundStates].map(state => `'${state}'`)
  if (filters.state && selectedStates.length === 0) {
    description += ` with <b>'${filters.state}'</b> state`
  } else if (selectedStates.length === 1) {
    description += ` with <b>'${selectedStates[0]}'</b> state`
  } else if (selectedStates.length > 1) {
    description += ` with <b>${selectedStates.join('</b>, <b>').replace(/,([^,]*)$/, ' or$1')}</b> states`
  }

  if (filters.brand) description += ` with <b>'${filters.brand}'</b> card brand`

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
