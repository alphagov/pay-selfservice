'use strict'

const qs = require('qs')
const check = require('check-types')
const Paginator = require('../utils/paginator.js')
const states = require('../utils/states')
const _ = require('lodash')

function validateFilters (filters) {
  const pageSizeIsNull = !check.assigned(filters.pageSize)
  const pageSizeInRange = check.inRange(Number(filters.pageSize), 1, Paginator.MAX_PAGE_SIZE)
  const pageIsNull = !check.assigned(filters.page)
  const pageIsPositive = check.positive(Number(filters.page))
  return (pageSizeIsNull || pageSizeInRange) &&
    (pageIsNull || pageIsPositive)
}

function trimFilterValues (filters) {
  for (const [key, value] of Object.entries(filters)) {
    if (typeof value === 'string') {
      filters[key] = value.trim()
    }
  }
  return filters
}

function getFilters (req) {
  let filters = trimFilterValues(qs.parse(req.query))
  filters.selectedStates = []
  if (filters.state) {
    filters.selectedStates = typeof filters.state === 'string' ? [filters.state] : filters.state
    const result = states.displayStatesToConnectorStates(filters.selectedStates)
    filters.payment_states = result.payment_states
    filters.refund_states = result.refund_states
  }

  if (filters.brand) {
    filters.selectedBrands = typeof filters.brand === 'string' ? [filters.brand] : filters.brand
  }

  filters = _.omitBy(filters, _.isEmpty)
  return {
    valid: validateFilters(filters),
    result: filters
  }
}

function describeFilters (filters) {
  let description = ''
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

  if (filters.selectedBrands && filters.selectedBrands.length > 0) {
    const brandStates = filters.selectedBrands.map(brand => {
      if (brand === 'jcb') {
        brand = 'JCB'
      }
      return brand.replace('-', ' ')
    })
    description += ` with <strong class="capitalize">‘${brandStates.join('</strong>, <strong class="capitalize">').replace(/,([^,]*)$/, ' or$1')}’</strong> card brands`
  }

  return description
}

module.exports = {
  getFilters: getFilters,
  describeFilters: describeFilters
}
