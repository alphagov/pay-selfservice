'use strict'

const Product = require('../../models/Product.class')
const Payment = require('../../models/Payment.class')
const baseClient = require('./base_client/base_client')
const { PRODUCTS_URL } = require('../../../config')
const supportedLanguage = require('../../models/supported-language')

// Constants
const SERVICE_NAME = 'products'

// Use baseurl to create a baseclient for the product microservice
const baseUrl = `${PRODUCTS_URL}/v1/api`

// Exports
module.exports = {
  product: {
    create: createProduct,
    update: updateProduct,
    disable: disableProduct,
    delete: deleteProduct,
    getByProductExternalId: getProductByExternalId,
    getByGatewayAccountId: getProductsByGatewayAccountId,
    getByProductPath: getProductByPath,
    addMetadataToProduct: addMetadataToProduct,
    updateProductMetadata: updateProductMetadata,
    deleteProductMetadata: deleteProductMetadata
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
 * @param {string=} options.type - The type of the product
 * @param {string=} options.returnUrl - Where to redirect to upon completion of a charge for this product
 * @param {string=} options.serviceNamePath - first part of friendly url derived from the service name
 * @param {string=} options.productNamePath - second part of friendly url derived from the payment link title
 * @returns {Promise<Product>}
 */
function createProduct (options) {
  return baseClient.post({
    baseUrl,
    url: `/products`,
    json: true,
    body: {
      gateway_account_id: options.gatewayAccountId,
      pay_api_token: options.payApiToken,
      name: options.name,
      price: options.price,
      description: options.description,
      type: options.type,
      return_url: options.returnUrl,
      service_name_path: options.serviceNamePath,
      product_name_path: options.productNamePath,
      reference_enabled: options.referenceEnabled,
      reference_label: options.referenceLabel,
      reference_hint: options.referenceHint,
      language: options.language || supportedLanguage.ENGLISH
    },
    description: 'create a product for a service',
    service: SERVICE_NAME
  }).then(product => new Product(product))
}

/**
 * @param {String} productExternalId: the external id of the product you wish to update
 * @param {Object} options
 * @param {string} options.name - The name of the product
 * @param {string=} options.description - The description of the product
 * @param {number} options.price - The price of product in pence
 * @returns {Promise<Product>}
*/
function updateProduct (gatewayAccountId, productExternalId, options) {
  return baseClient.patch({
    baseUrl,
    url: `/gateway-account/${gatewayAccountId}/products/${productExternalId}`,
    json: true,
    body: {
      name: options.name,
      description: options.description,
      price: options.price,
      reference_enabled: options.referenceEnabled,
      reference_label: options.referenceLabel,
      reference_hint: options.referenceHint
    },
    description: 'update an existing product',
    service: SERVICE_NAME
  }).then(product => new Product(product))
}

function addMetadataToProduct (productExternalId, key, value) {
  const body = {}
  body[key] = value
  return baseClient.post({
    baseUrl,
    body,
    url: `/products/${productExternalId}/metadata`,
    description: 'add metadata to an existing product',
    service: SERVICE_NAME
  })
}

function updateProductMetadata (productExternalId, key, value) {
  const body = {}
  body[key] = value
  return baseClient.patch({
    baseUrl,
    body,
    url: `/products/${productExternalId}/metadata`,
    description: 'update existing metadata on an existing product',
    service: SERVICE_NAME
  })
}

function deleteProductMetadata (productExternalId, key) {
  return baseClient.delete({
    baseUrl,
    url: `/products/${productExternalId}/metadata/${key}`,
    description: 'delete metadata on an existing product',
    service: SERVICE_NAME
  })
}

/**
 * @param {String} productExternalId: the external id of the product you wish to retrieve
 * @returns {Promise<Product>}
 */
function getProductByExternalId (gatewayAccountId, productExternalId) {
  return baseClient.get({
    baseUrl,
    url: `/gateway-account/${gatewayAccountId}/products/${productExternalId}`,
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
    baseUrl,
    url: `/gateway-account/${gatewayAccountId}/products`,
    description: 'find a list products associated with a gateway account',
    service: SERVICE_NAME
  }).then(products => products.map(product => new Product(product)))
}

/**
 * @param {String} productExternalId: the external id of the product you wish to disable
 * @returns Promise<undefined>
 */
function disableProduct (gatewayAccountId, productExternalId) {
  return baseClient.patch({
    baseUrl,
    url: `/gateway-account/${gatewayAccountId}/products/${productExternalId}/disable`,
    description: `disable a product`,
    service: SERVICE_NAME
  })
}

/**
 * @param {String} gatewayAccountId: the id of the gateway account whose service the product belongs to
 * @param {String} productExternalId: the external id of the product you wish to delete
 * @returns Promise<undefined>
 */
function deleteProduct (gatewayAccountId, productExternalId) {
  return baseClient.delete({
    baseUrl,
    url: `/gateway-account/${gatewayAccountId}/products/${productExternalId}`,
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
    baseUrl,
    url: `/products/${productExternalId}/payments`,
    description: `find a payments associated with a particular product`,
    service: SERVICE_NAME
  }).then(payments => payments.map(payment => new Payment(payment)))
}

/**
 * @param {String} serviceNamePath: the service name path of the product you wish to retrieve
 * @param {String} productNamePath: the product name path of the product you wish to retrieve
 * @returns {Promise<Product>}
 */
function getProductByPath (serviceNamePath, productNamePath) {
  return baseClient.get({
    baseUrl,
    url: `/products?serviceNamePath=${serviceNamePath}&productNamePath=${productNamePath}`,
    description: `find a product by it's product path`,
    service: SERVICE_NAME
  }).then(product => new Product(product))
}
