'use strict'

const q = require('q')
const requestLogger = require('../../utils/request_logger')
const baseClient = require('./base_client')
const Product = require('../../models/Product.class')
const createCallbackToPromiseConverter = require('../../utils/response_converter').createCallbackToPromiseConverter

const SERVICE_NAME = 'products'
const PRODUCTS_URL = process.env.PRODUCTS_URL
const PRODUCTS_API_KEY = process.env.PRODUCTS_API_KEY

const responseBodyToProductTransformer = body => new Product(body)

module.exports = function (clientOptions = {}) {
  const baseUrl = clientOptions.baseUrl || PRODUCTS_URL
  const productsApiKey = clientOptions.productsApiKey || PRODUCTS_API_KEY
  const correlationId = clientOptions.correlationId || ''
  const productResource = `${baseUrl}/v1/api/products`

  /**
   *
   * @returns {Promise<Product>}
   */
  const createProduct = (productData) => {
    const params = {
      correlationId: correlationId,
      payload: {
        external_service_id: productData.external_service_id,
        pay_api_token: productData.pay_api_token,
        name: productData.name,
        description: productData.description,
        price: productData.price
      },
      headers: {
        Authorization: `Bearer ${productsApiKey}`
      }
    }

    if (productData.return_url) {
      params.payload.return_url = productData.return_url
    }

    const url = productResource
    const defer = q.defer()
    const startTime = new Date()
    const context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: correlationId,
      method: 'POST',
      description: 'create a product for a service',
      service: SERVICE_NAME
    }

    const callbackToPromiseConverter = createCallbackToPromiseConverter(context, responseBodyToProductTransformer)

    requestLogger.logRequestStart(context)

    baseClient.post(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter)

    return defer.promise
  }

  return {
    createProduct
  }
}
