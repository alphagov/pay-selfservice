'use strict'

// NPM Dependencies
const lodash = require('lodash')

/**
 @class Payment
 * @property {string} externalId - The external ID of the payment
 * @property {string} productExternalId - The external ID of the product associated with the payment
 * @property {string} status - The current status of the payment
 * @property {string} govukStatus - the current status of the gov.uk pay charge
 * @property {object} links
 * @property {object} links.next - link to use to pay via pay-frontend
 * @property {string} links.next.href - url to use to pay via pay-frontend
 * @property {string} links.next.method - the http method to use to pay via pay-frontend
 * @property {object} links.self - link to use to get for the payment
 * @property {string} links.self.href - url to use to re-fetch the payment
 * @property {string} links.self.method - the http method to use to re-fetch the payment
 */
class Payment {
  /**
   * @param {Object} opts - The raw payment object from pay-products
   * @param {string} opts.external_id - The external ID of the payment
   * @param {string} opts.product_external_id - The external ID of the product associated with the payment
   * @param {status} opts.status - The current status of the payment
   * @param {string} opts.govuk_status - the current status of the gov.uk pay charge
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
    this.govukStatus = opts.govuk_status
    this.nextUrl = opts.next_url
    opts._links.forEach(link => lodash.set(this, `links.${link.rel}`, {method: link.method, href: link.href}))
  }
}

module.exports = Payment
