'use strict'

// NPM Dependencies
const lodash = require('lodash')

/**
 @class Product
 * @property {string} externalId - The external ID of the product
 * @property {string} gatewayAccountId
 * @property {string} name
 * @property {number} price
 * @property {string} description
 * @property {string} type - The type of the product
 * @property {string} returnUrl
 * @property {string} govukStatus - the current status of the gov.uk pay charge
 * @property {string} serviceName - the name of the service with which the product is associated
 * @property {object} links
 * @property {object} links.pay
 * @property {string} links.pay.href - url to use to create a payment for the product
 * @property {string} links.pay.method - the http method to use to create a payment for the product
 * @property {object} links.self
 * @property {string} links.self.href - url to use to re-fetch the product
 * @property {string} links.self.method - the http method to use to re-fetch the product
 */
class Product {
  /**
   * Create an instance of Product
   * @param {Object} opts - raw 'product' object from server
   * @param {string} opts.external_id - The external ID of the product
   * @param {string} opts.gateway_account_id - The id of the product's associated gateway account
   * @param {string} opts.name - The name of the product
   * @param {number} opts.price - price of the product in pence
   * @param {string} opts.govuk_status - the current status of the gov.uk pay charge
   * @param {string} opts.service_name - the name of the service with which the product is associated
   * @param {Object[]} opts._links - links for the product ('self' to re-GET this product from the server, and 'pay' to create a payment for this product)
   * @param {string} opts._links[].href - url of the link
   * @param {string} opts._links[].method - the http method of the link
   * @param {string} opts._links[].rel - the name of the link
   * @param {string=} opts.description - The name of the product
   * @param {string=} opts.type - The type of the product
   * @param {string=} opts.return_url - return url of where to redirect for any charge of this product
   **/
  constructor (opts) {
    this.externalId = opts.external_id
    this.gatewayAccountId = opts.gateway_account_id
    this.name = opts.name
    this.price = opts.price
    this.govukStatus = opts.govuk_status
    this.serviceName = opts.service_name
    this.description = opts.description
    this.type = opts.type
    this.returnUrl = opts.return_url
    opts._links.forEach(link => lodash.set(this, `links.${link.rel}`, {method: link.method, href: link.href}))
  }
}

module.exports = Product
