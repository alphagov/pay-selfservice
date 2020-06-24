'use strict'

const qs = require('qs')
const check = require('check-types')
const Paginator = require('../utils/paginator.js')
const states = require('../utils/states')
const _ = require('lodash')
const moment = require('moment-timezone')

function validateFilters (filters) {
  let pageSizeIsNull = !check.assigned(filters.pageSize)
  let pageSizeInRange = check.inRange(Number(filters.pageSize), 1, Paginator.MAX_PAGE_SIZE)
  let pageIsNull = !check.assigned(filters.page)
  let pageIsPositive = check.positive(Number(filters.page))
  return (pageSizeIsNull || pageSizeInRange) &&
    (pageIsNull || pageIsPositive)
}

function getFilters (req) {
  let filters = qs.parse(req.query)

  // If a search is being performed without any filters specified, default the from date filter to
  // 1 month ago. We do this because the count query that is currently required by the search is
  // very inefficient. If the search has been filtered, still allow the from date to be blank.
  if (_.isEmpty(filters)) {
    filters.fromDate = moment().tz('Europe/London').subtract(1, 'months').format('DD/MM/YYYY')
  }

  filters.selectedStates = []
  if (filters.state) {
    filters.selectedStates = typeof filters.state === 'string' ? [filters.state] : filters.state
    const result = states.displayStatesToConnectorStates(filters.selectedStates)
    filters.payment_states = result.payment_states
    filters.refund_states = result.refund_states
  }
  filters = _.omitBy(filters, _.isEmpty)
  return {
    valid: validateFilters(filters),
    result: filters
  }
}

function describeFilters (filters) {
  let description = ``
  if (filters.fromDate) description += ` from <strong>${filters.fromDate}</strong>`
  if (filters.toDate) description += ` to <strong>${filters.toDate}</strong>`

  const selectedStates = filters.selectedStates || []
  if (filters.state && filters.selectedStates.length === 0) {
    description += ` with <strong>${filters.state}</strong> state`
  } else if (selectedStates.length === 1) {
    description += ` with <strong>${selectedStates[0]}</strong> state`
  } else if (selectedStates.length > 1) {
    description += ` with <strong>${selectedStates.join('</strong>, <strong>').replace(/,([^,]*)$/, ' or$1')}</strong> states`
  }

  const brandStates = Array.isArray(filters.brand) ? filters.brand.map(brand => brand.replace('-', ' ')) : []
  if (brandStates.length === 0 && filters.brand) {
    if (filters.brand === 'jcb') {
      filters.brand = 'JCB'
    }
    description += ` with <strong class="capitalize">‘${filters.brand.replace('-', ' ')}’</strong> card brand`
  } else if (brandStates.length > 1) {
    description += ` with <strong class="capitalize">‘${brandStates.join('</strong>, <strong class="capitalize">').replace(/,([^,]*)$/, ' or$1')}’</strong> card brands`
  }

  return description
}

module.exports = {
  getFilters: getFilters,
  describeFilters: describeFilters
}
