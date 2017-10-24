'use strict'

/**
 @class Product
 * @property {string} externalId - The external ID of the product
 * @property {string} gatewayAccountId
 * @property {string} name
 * @property {number} price
 * @property {string} description
 * @property {string} returnUrl
 * @property {object} payLink
 * @property {string} payLink.href - url to use to create a payment for the product
 * @property {string} payLink.method - the http method to use to create a payment for the product
 * @property {string} payLink.rel - the name of the link ('pay')
 * @property {object} selfLink
 * @property {string} selfLink.href - url to use to re-fetch the product
 * @property {string} selfLink.method - the http method to use to re-fetch the product
 * @property {string} selfLink.rel - the name of the link ('self')
 */
class Product {
  /**
   * Create an instance of Product
   * @param {Object} opts - raw 'product' object from server
   * @param {string} opts.external_id - The external ID of the product
   * @param {string} opts.gateway_account_id - The id of the product's associated gateway account
   * @param {string} opts.name - The name of the product
   * @param {number} opts.price - price of the product in pence
   * @param {Object[]} opts._links - links for the product ('self' to re-GET this product from the server, and 'pay' to create a payment for this product)
   * @param {string} opts._links[].href - url of the link
   * @param {string} opts._links[].method - the http method of the link
   * @param {string} opts._links[].rel - the name of the link
   * @param {string=} opts.description - The name of the product
   * @param {string=} opts.return_url - return url of where to redirect for any charge of this product
   **/
  constructor (opts) {
    this.externalId = opts.external_id
    this.gatewayAccountId = opts.gateway_account_id
    this.name = opts.name
    this.price = opts.price
    this.description = opts.description || ''
    this.returnUrl = opts.return_url || ''
    this.payLink = opts._links.find(link => link.rel === 'pay')
    this.selfLink = opts._links.find(link => link.rel === 'self')
  }
}

module.exports = Product
