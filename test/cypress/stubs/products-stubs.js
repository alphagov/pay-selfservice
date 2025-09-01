'use strict'

const productFixtures = require('../../fixtures/product.fixtures')
const { stubBuilder } = require('./stub-builder')
const { validProductResponse } = require('@test/fixtures/product.fixtures')

function getProductsByGatewayAccountIdAndTypeStub (products, gatewayAccountId, productType) {
  const path = `/v1/api/gateway-account/${gatewayAccountId}/products`
  return stubBuilder('GET', path, 200, {
    query: {
      type: productType
    },
    response: products.map(product =>
      productFixtures.validAdhocProductResponse(product))
  })
}

function getProductByExternalIdAndGatewayAccountIdStub (product, gatewayAccountId) {
  const path = `/v1/api/gateway-account/${gatewayAccountId}/products/${product.external_id}`
  return stubBuilder('GET', path, 200, {
    response: productFixtures.validAdhocProductResponse(product)
  })
}

function deleteProductStub (product, gatewayAccountId) {
  const path = `/v1/api/gateway-account/${gatewayAccountId}/products/${product.external_id}`
  return stubBuilder('DELETE', path, 200)
}

function disableProductStub (gatewayAccountId, productExternalId) {
  const path = `/v1/api/gateway-account/${gatewayAccountId}/products/${productExternalId}/disable`
  return stubBuilder('PATCH', path, 200)
}

function getProductsByGatewayAccountIdAndTypeFailure (gatewayAccountId, productType) {
  const path = `/v1/api/gateway-account/${gatewayAccountId}/products`
  return stubBuilder('GET', path, 500, {
    query: {
      type: productType
    }
  })
}

function postCreateProductSuccess (opts) {
  const path = '/v1/api/products'
  return stubBuilder('POST', path, 200, {
    deepMatchRequest: false,
    response: productFixtures.validAdhocProductResponse(opts)
  })
}

function postCreateProductSuccessWithRequestBody (opts) {
  const path = '/v1/api/products'
  return stubBuilder('POST', path, 200, {
    request: productFixtures.validCreateProductRequest(opts),
    response: productFixtures.validAdhocProductResponse()
  })
}

function patchUpdateProductSuccess (opts, mockBehaviour = { deepMatch: false }) {
  const path = `/v1/api/gateway-account/${opts.gatewayAccountId}/products/${opts.productExternalId}`
  return stubBuilder('PATCH', path, 200, {
    request: productFixtures.validUpdateProductRequest(opts),
    response: productFixtures.validAdhocProductResponse(),
    deepMatchRequest: mockBehaviour.deepMatch,
  })
}

function getProductByExternalId (productExternalId, productResponse = {}) {
  const path = `/v1/api/products/${productExternalId}`
  return stubBuilder('GET', path, 200, {
    response: validProductResponse(productResponse)
  })
}

module.exports = {
  getProductsByGatewayAccountIdAndTypeStub,
  getProductByExternalIdAndGatewayAccountIdStub,
  deleteProductStub,
  getProductsByGatewayAccountIdAndTypeFailure,
  postCreateProductSuccess,
  postCreateProductSuccessWithRequestBody,
  patchUpdateProductSuccess,
  disableProductStub,
  getProductByExternalId
}
