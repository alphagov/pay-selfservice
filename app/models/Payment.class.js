'use strict'

// NPM Dependencies
const lodash = require('lodash')

/**
 @class Payment
 */
class Payment {
  /**
   * @param {Object} opts - The raw payment object from pay-products
   * @param {string} opts.external_id - The external ID of the payment
   * @param {string} opts.product_external_id - The external ID of the product associated with the payment
   * @param {status} opts.status - The current status of the payment
   * @param {Object[]} opts._links - Links relevent to the payment
   * @param {string} opts._links[].href - url of the link
   * @param {string} opts._links[].method - the http method of the link
   * @param {string} opts._links[].rel - the name of the link
   * @returns Payment
   */
  constructor (opts) {
    this.externalId = opts.external_id
    this.productExternalId = opts.product_external_id
    this.status = opts.status
    this.nextUrl = opts.next_url
    opts._links.forEach(link => lodash.set(this, `links.${link.rel}`, {method: link.method, href: link.href}))
  }
}

module.exports = Payment
