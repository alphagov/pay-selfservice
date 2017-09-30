'use strict'

const {dateToDefaultFormat} = require('../utils/dates.js')
const getProductsClient = require('./clients/products_client')
const publicAuthClient = require('./clients/public_auth_client')

// Exports
module.exports = {
  createProduct
}

/**
 *
 * @param {String} userEmail
 * @param {int} gatewayAccountId
 * @param {Object} productOptions
 * @param {string} productOptions.external_service_id - The external service id of this gatewayAccountId
 * @param {string} productOptions.name - The name of the product
 * @param {long} productOptions.price - The price of product in pence
 * @param {string} productOptions.description - (Optional) The description of the product
 * @param {string} productOptions.return_url - (Optional) Where to redirect to upon completion of a charge for this product
 * @param correlationId
 *
 * @returns Promise<Product>
 */
function createProduct (userEmail, gatewayAccountId, productOptions, correlationId) {
  let productsClient = getProductsClient({correlationId})
  let payTokenPayload = {
    'account_id': gatewayAccountId,
    'description': `Pay token for product ${productOptions.name} on ${dateToDefaultFormat(new Date())}`,
    'created_by': userEmail
  }

  return publicAuthClient.createTokenForAccount({
    payload: payTokenPayload,
    accountId: gatewayAccountId,
    correlationId: correlationId
  }).then(publicAuthResponse => {
    productOptions.pay_api_token = publicAuthResponse.token
    return productsClient.createProduct(productOptions)
  })
}
