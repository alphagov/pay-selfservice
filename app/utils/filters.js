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
