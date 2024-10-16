'use strict'

const Product = require('../../models/Product.class')
const Payment = require('../../models/Payment.class')
const { Client } = require('@govuk-pay/pay-js-commons/lib/utils/axios-base-client/axios-base-client')
const { configureClient } = require('./base/config')
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
    getByProductExternalIdAndGatewayAccountId: getProductByExternalIdAndGatewayAccountId,
    getProductByExternalId,
    getByGatewayAccountIdAndType: getProductsByGatewayAccountIdAndType,
    getByProductPath: getProductByPath
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
async function createProduct (options) {
  const body = {
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
    amount_hint: options.amountHint,
    language: options.language || supportedLanguage.ENGLISH,
    ...options.metadata && { metadata: options.metadata }
  }
  this.client = new Client(SERVICE_NAME)
  const url = `${baseUrl}/products`
  configureClient(this.client, url)
  const response = await this.client.post(url, body, 'create a product for a service')
  return new Product(response.data)
}

/**
 * @param {String} productExternalId: the external id of the product you wish to update
 * @param {Object} options
 * @param {string} options.name - The name of the product
 * @param {string=} options.description - The description of the product
 * @param {number} options.price - The price of product in pence
 * @returns {Promise<Product>}
*/
async function updateProduct (gatewayAccountId, productExternalId, options) {
  const body = {
    name: options.name,
    description: options.description,
    price: options.price,
    reference_enabled: options.referenceEnabled,
    reference_label: options.referenceLabel,
    reference_hint: options.referenceHint,
    amount_hint: options.amountHint,
    ...options.metadata && { metadata: options.metadata }
  }
  this.client = new Client(SERVICE_NAME)
  const url = `${baseUrl}/gateway-account/${gatewayAccountId}/products/${productExternalId}`
  configureClient(this.client, url)
  const response = await this.client.patch(url, body, 'update an existing product')
  return new Product(response.data)
}

/**
 * @param {String} gatewayAccountId: the internal id of the gateway account
 * @param {String} productExternalId: the external id of the product you wish to retrieve
 * @returns {Promise<Product>}
 */
async function getProductByExternalIdAndGatewayAccountId (gatewayAccountId, productExternalId) {
  this.client = new Client(SERVICE_NAME)
  const url = `${baseUrl}/gateway-account/${gatewayAccountId}/products/${productExternalId}`
  configureClient(this.client, url)
  const response = await this.client.get(url, 'find a product by it\'s external id')
  return new Product(response.data)
}

/**
 * @param {String} productExternalId: the external id of the product you wish to retrieve
 * @returns {Promise<Product>}
 */
async function getProductByExternalId (productExternalId) {
  this.client = new Client(SERVICE_NAME)
  const url = `${baseUrl}/products/${productExternalId}`
  configureClient(this.client, url)
  const response = await this.client.get(url, 'find a product by it\'s external id')
  return new Product(response.data)
}

/**
 * @param {String} gatewayAccountId - The id of the gateway account to retrieve products associated with
 * @returns {Promise<Array<Product>>}
 */
async function getProductsByGatewayAccountIdAndType (gatewayAccountId, productType) {
  this.client = new Client(SERVICE_NAME)
  const url = `${baseUrl}/gateway-account/${gatewayAccountId}/products?type=${productType}`
  configureClient(this.client, url)
  const response = await this.client.get(url, 'find a list products associated with a gateway account and a specific type')
  return response.data.map(product => new Product(product))
}

/**
 * @param {String} productExternalId: the external id of the product you wish to disable
 * @returns Promise<undefined>
 */
async function disableProduct (gatewayAccountId, productExternalId) {
  this.client = new Client(SERVICE_NAME)
  const url = `${baseUrl}/gateway-account/${gatewayAccountId}/products/${productExternalId}/disable`
  configureClient(this.client, url)
  const response = await this.client.patch(url, 'disable a product')
  return response
}

/**
 * @param {String} gatewayAccountId: the id of the gateway account whose service the product belongs to
 * @param {String} productExternalId: the external id of the product you wish to delete
 * @returns Promise<undefined>
 */
async function deleteProduct (gatewayAccountId, productExternalId) {
  this.client = new Client(SERVICE_NAME)
  const url = `${baseUrl}/gateway-account/${gatewayAccountId}/products/${productExternalId}`
  configureClient(this.client, url)
  const response = await this.client.delete(url, 'disable a product')
  return response
}

// PAYMENT
/**
 * @param {String} productExternalId The external ID of the product to create a payment for
 * @returns Promise<Payment>
 */
async function createPayment (productExternalId) {
  this.client = new Client(SERVICE_NAME)
  const url = `${baseUrl}/products/${productExternalId}/payments`
  configureClient(this.client, url)
  const response = await this.client.post(url, 'create a payment for a product')
  return new Payment(response.data)
}

/**
 * @param {String} paymentExternalId
 * @returns Promise<Payment>
 */
async function getPaymentByPaymentExternalId (paymentExternalId) {
  this.client = new Client(SERVICE_NAME)
  const url = `${baseUrl}/payments/${paymentExternalId}`
  configureClient(this.client, url)
  const response = await this.client.get(url, 'find a payment by it\'s external id')
  return new Payment(response.data)
}

/**
 * @param {String} productExternalId
 * @returns Promise<Array<Payment>>
 */
async function getPaymentsByProductExternalId (productExternalId) {
  this.client = new Client(SERVICE_NAME)
  const url = `${baseUrl}/products/${productExternalId}/payments`
  configureClient(this.client, url)
  const response = await this.client.get(url, 'find payments associated with a particular product')
  return response.data.map(payment => new Payment(payment))
}

/**
 * @param {String} serviceNamePath: the service name path of the product you wish to retrieve
 * @param {String} productNamePath: the product name path of the product you wish to retrieve
 * @returns {Promise<Product>}
 */
async function getProductByPath (serviceNamePath, productNamePath) {
  this.client = new Client(SERVICE_NAME)
  const url = `${baseUrl}/products?serviceNamePath=${serviceNamePath}&productNamePath=${productNamePath}`
  configureClient(this.client, url)
  const response = await this.client.get(url, 'find a product by it\'s product path')
  return new Product(response.data)
}
