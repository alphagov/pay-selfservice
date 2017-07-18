var _ = require('lodash')
const SMALL_PAGE_SIZE = 100
const LARGE_PAGE_SIZE = 500

/**
 * Utility to return pages from collection to manage pagination
 *
 * @constructor
 *
 * @param {number} total Total number of records
 * @param {number} limit Page size
 * @param {number} page  Page number
 *
 */
function Paginator (total, limit, page) {
  this.total = total
  this.limit = limit || SMALL_PAGE_SIZE
  this.page = page || 1
}

// Export this so logic is all in one place
Paginator.MAX_PAGE_SIZE = LARGE_PAGE_SIZE

/**
 * @param  {number} pageNumber
 * @param  {number} pageName
 * @return {Object. <string>}
 */
function createPageObject (pageNumber, pageName) {
  return {
    pageNumber: pageNumber,
    pageName: pageName || pageNumber,
    hasSymbolicName: (pageName !== undefined),
    activePage: pageNumber === this.page
  }
}

function createDisplaySizeOption (type, pageName, value) {
  return {
    type: type,
    name: pageName,
    value: value,
    active: (value === this.limit)
  }
}

Paginator.prototype = {
  /**
   * Get next page
   * @return {number}
   */
  getNext: function () {
    var next = this.getPageByOffset(1)
    return next !== this.page ? next : null
  },

  /**
   * Get previous page
   * @return {number}
   */
  getPrevious: function () {
    var previous = this.getPageByOffset(-1)
    return previous !== this.page ? previous : null
  },

  /**
   * Get first page
   * @return {number}
   */
  getFirst: function () {
    return 1
  },

  /**
   * Get last page
   * @return {number}
   */
  getLast: function () {
    return Math.ceil(this.total / this.limit)
  },

  /**
   * Gets page relative to this.page, or referencePageNumber if supplied
   * Constrains results by limits of collection
   *
   * @param  {number} offset distance from this.page, or referencePage
   * @param  {number} referencePageNumber optional: offset from here rather than this.page
   * @return {number}
   */
  getPageByOffset: function (offset, referencePageNumber) {
    referencePageNumber = referencePageNumber || this.page
    var pageNumber = referencePageNumber + offset

    pageNumber = Math.max(pageNumber, this.getFirst())
    pageNumber = Math.min(pageNumber, this.getLast())

    return pageNumber
  },

  /**
   * @param  {number} spread
   * @param  {number} centre
   * @return {Array. <number>}
   */
  getCentredRange: function (spread, centre) {
    var start = this.getPageByOffset(-spread, centre)
    var end = this.getPageByOffset(spread, centre)

    return _.range(start, end + 1)
  },

  /**
   * @param  {number} range
   * @return {Array. <object>}
   */
  getNamedPagesInRange: function (range) {
    var namedPages = []

    for (var ctr = 0; ctr < range.length; ctr++) {
      namedPages.push(createPageObject.call(this, range[ctr]))
    }

    return namedPages
  },

  /**
   * Creates an array of page objects, ranging from centre - spread
   * to centre + spread, constrained by size of collection. Optionally
   * includes first and last (extremities), and next and previous (adjacent)
   *
   * [
   *        {pageName: 'first', pageNumber: 1},
   *        {pageName: '2', pageNumber: 2}...
   * ]
   *
   * @param  {number} spread
   * @param  {boolean} includeExtremities
   * @param  {boolean} includeAdjacent
   * @param  {number} centre
   *
   * @return {Array. <object>}
   */
  getNamedCentredRange: function (spread, includeExtremities, includeAdjacent, centre) {
    centre = centre || this.page
    var pageRange = this.getCentredRange(spread, centre)
    var namedRange = this.getNamedPagesInRange(pageRange)
    var first
    var last
    var previous
    var next

    // If adjacents are required and exist add them
    if (includeAdjacent) {
      previous = this.getPrevious()
      next = this.getNext()
      if (previous) namedRange.unshift(createPageObject(previous, 'previous'))
      if (next) namedRange.push(createPageObject(next, 'next'))
    }

    // If extremities are required and not included in current range, add them
    if (includeExtremities) {
      first = this.getFirst()
      last = this.getLast()
      if (pageRange.indexOf(first) === -1) namedRange.unshift(createPageObject(first, 'first'))
      if (pageRange.indexOf(last) === -1) namedRange.push(createPageObject(last, 'last'))
    }

    return namedRange
  },

  /**
   * @return {array}
   */
  getDisplaySizeOptions: function () {
    if (this.total < SMALL_PAGE_SIZE) {
      return [createDisplaySizeOption.call(this, null, 'Show all', SMALL_PAGE_SIZE)]
    } else if (this.total < LARGE_PAGE_SIZE) {
      return [
        createDisplaySizeOption.call(this, 'small', SMALL_PAGE_SIZE, SMALL_PAGE_SIZE),
        createDisplaySizeOption.call(this, 'large', 'Show all', LARGE_PAGE_SIZE)
      ]
    } else {
      return [
        createDisplaySizeOption.call(this, 'small', SMALL_PAGE_SIZE, SMALL_PAGE_SIZE),
        createDisplaySizeOption.call(this, 'large', LARGE_PAGE_SIZE, LARGE_PAGE_SIZE)
      ]
    }
  },

  /**
   * @return {boolean}
   */
  showDisplaySizeLinks: function () {
    return this.total > SMALL_PAGE_SIZE ||
           this.total > this.limit
  }
}

module.exports = Paginator
