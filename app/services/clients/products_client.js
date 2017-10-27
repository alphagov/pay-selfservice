'use strict'

// Local Dependencies
const Product = require('../../models/Product.class')
const Payment = require('../../models/Payment.class')
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
  product: {
    create: createProduct,
    disable: disableProduct,
    getByProductExternalId: getProductByExternalId,
    getByGatewayAccountId: getProductsByGatewayAccountId
  },
  payment: {
    create: createPayment,
    getByPaymentExternalId: getPaymentByPaymentExternalId,
    getByProductExternalId: getPaymentsByProductExternalId
  }
}

// PRODUCT
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

/**
 * @param {String} externalProductId: the external id of the product you wish to retrieve
 * @returns {Promise<Product>}
 */
function getProductByExternalId (externalProductId) {
  return baseClient.get({
    headers,
    baseUrl,
    url: `/products/${externalProductId}`,
    description: `find a product by it's external id`,
    service: SERVICE_NAME
  }).then(product => new Product(product))
}

/**
 * @param {String} gatewayAccountId - The id of the gateway account to retrieve products associated with
 * @returns {Promise<Array<Product>>}
 */
function getProductsByGatewayAccountId (gatewayAccountId) {
  return baseClient.get({
    headers,
    baseUrl,
    url: '/products',
    qs: {
      gatewayAccountId
    },
    description: 'find a list products associated with a gateway account',
    service: SERVICE_NAME
  }).then(products => products.map(product => new Product(product)))
}

/**
 * @param {String} productExternalId: the external id of the product you wish to disable
 * @returns {undefined}
 */
function disableProduct (productExternalId) {
  return baseClient.patch({
    headers,
    baseUrl,
    url: `/products/${productExternalId}/disable`,
    description: `disable a product`,
    service: SERVICE_NAME
  })
}

// PAYMENT
/**
 * @param {String} productExternalId The external ID of the product to create a payment for
 * @returns Promise<Payment>
 */
function createPayment (productExternalId) {
  return baseClient.post({
    headers,
    baseUrl,
    url: `/products/${productExternalId}/payments`,
    description: 'create a payment for a product',
    service: SERVICE_NAME
  }).then(payment => new Payment(payment))
}

/**
 * @param {String} paymentExternalId
 * @returns Promise<Payment>
 */
function getPaymentByPaymentExternalId (paymentExternalId) {
  return baseClient.get({
    headers,
    baseUrl,
    url: `/payments/${paymentExternalId}`,
    description: `find a payment by it's external id`,
    service: SERVICE_NAME
  }).then(charge => new Payment(charge))
}

/**
 * @param {String} productExternalId
 * @returns Promise<Array<Payment>>
 */
function getPaymentsByProductExternalId (productExternalId) {
  return baseClient.get({
    headers,
    baseUrl,
    url: `/products/${productExternalId}/payments`,
    description: `find a payments associated with a particular product`,
    service: SERVICE_NAME
  }).then(payments => payments.map(payment => new Payment(payment)))
}
