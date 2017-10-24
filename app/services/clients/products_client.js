'use strict'

// Local Dependencies
const Product = require('../../models/Product.class')
const baseClient = require('./base_client/base_client')
const {PRODUCTS_URL, PRODUCTS_API_TOKEN} = require('../../../config')

// Constants
const SERVICE_NAME = 'products'

// Use baseurl to create a baseclient for the product microservice
const baseUrl = `${PRODUCTS_URL}/v1/api`
const headers = {
  Authorization: `Bearer ${PRODUCTS_API_TOKEN}`
}

// Exports
module.exports = {
  createProduct,
  getProduct
}

/**
 * @param {String} externalProductId: the external id of the product you wish to retrieve
 * @returns {Promise<Product>}
 */
function getProduct (externalProductId) {
  return baseClient.get({
    headers,
    baseUrl,
    url: `/products/${externalProductId}`,
    description: 'find a product',
    service: SERVICE_NAME
  }).then(product => new Product(product))
}

/**
 * @param {Object} options
 * @param {string} options.gatewayAccountId - The id of the gateway account you wish to use to pay for the product
 * @param {string} options.payApiToken - The API token to use to access GOV.UK Pay in order to initiate payments for the product
 * @param {string} options.name - The name of the product
 * @param {number} options.price - The price of product in pence
 * @param {string=} options.description - The description of the product
 * @param {string=} options.returnUrl - Where to redirect to upon completion of a charge for this product
 * @returns {Promise<Product>}
 */
function createProduct (options) {
  return baseClient.post({
    headers,
    baseUrl,
    url: `/products`,
    json: true,
    body: {
      gateway_account_id: options.gatewayAccountId,
      pay_api_token: options.payApiToken,
      name: options.name,
      price: options.price,
      description: options.description,
      return_url: options.returnUrl
    },
    description: 'create a product for a service',
    service: SERVICE_NAME
  }).then(product => new Product(product))
}
