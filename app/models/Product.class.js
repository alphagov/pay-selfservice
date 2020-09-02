'use strict'

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
 * @property {string} language - the language product and payment pages is displayed in
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
   * @param {string} opts.pay_api_token - The token used to make payments on behalf of the service
   * @param {string} opts.name - The name of the product
   * @param {number} opts.price - price of the product in pence
   * @param {string} opts.status - the current status of the gov.uk pay charge
   * @param {Object[]} opts._links - links for the product ('self' to re-GET this product from the server, and 'pay' to create a payment for this product)
   * @param {string} opts._links[].href - url of the link
   * @param {string} opts._links[].method - the http method of the link
   * @param {string} opts._links[].rel - the name of the link
   * @param {string=} opts.description - The name of the product
   * @param {string=} opts.type - The type of the product
   * @param {string=} opts.return_url - return url of where to redirect for any charge of this product
   * @param {string} opts.language - the language product and payment pages is displayed in
   * @param {Object[]} opts.metadata - metadata for the product
   **/
  constructor (opts) {
    this.externalId = opts.external_id
    this.gatewayAccountId = opts.gateway_account_id
    this.name = opts.name
    this.price = opts.price
    this.govukStatus = opts.status
    this.apiToken = opts.pay_api_token
    this.description = opts.description
    this.type = opts.type
    this.returnUrl = opts.return_url
    this.referenceEnabled = opts.reference_enabled
    if (opts.reference_enabled) {
      this.referenceLabel = opts.reference_label
      this.referenceHint = opts.reference_hint
    }
    this.language = opts.language
    this.metadata = opts.metadata
    opts._links.forEach(link => lodash.set(this, `links.${link.rel}`, { method: link.method, href: link.href }))
  }
}

module.exports = Product
