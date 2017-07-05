const qs = require('qs')
const check = require('check-types')
const Paginator = require('../utils/paginator.js')
const _ = require('lodash')

function validateFilters (filters) {
  const pageSizeIsNull = !check.assigned(filters.pageSize)
  const pageSizeInRange = check.inRange(Number(filters.pageSize), 1, Paginator.MAX_PAGE_SIZE)
  const pageIsNull = !check.assigned(filters.page)
  const pageIsPositive = check.positive(Number(filters.page))
  return (pageSizeIsNull || pageSizeInRange) &&
      (pageIsNull || pageIsPositive)
}

function getFilters (req) {
  var all = qs.parse(req.query)
  var filters = _.omitBy(all, _.isEmpty)
  return {
    valid: validateFilters(filters),
    result: filters
  }
}

module.exports = {
  getFilters: getFilters
}
