'use strict'

const productFixtures = require('../../fixtures/product.fixtures')
const { stubBuilder } = require('./stub-builder')

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

function getProductsByGatewayAccountIdAndTypeFailure (gatewayAccountId, productType) {
  const path = `/v1/api/gateway-account/${gatewayAccountId}/products`
  return stubBuilder('GET', path, 500, {
    query: {
      type: productType
    }
  })
}

function postCreateProductSuccess () {
  const path = '/v1/api/products'
  return stubBuilder('POST', path, 200, {
    response: productFixtures.validAdhocProductResponse()
  })
}

function postCreateProductSuccessWithRequestBody (opts) {
  const path = '/v1/api/products'
  return stubBuilder('POST', path, 200, {
    request: productFixtures.validCreateProductRequest(opts),
    response: productFixtures.validAdhocProductResponse()
  })
}

function patchUpdateProductSuccess (opts) {
  const path = `/v1/api/gateway-account/${opts.gatewayAccountId}/products/${opts.productExternalId}`
  return stubBuilder('PATCH', path, 200, {
    request: productFixtures.validUpdateProductRequest(opts),
    response: productFixtures.validAdhocProductResponse()
  })
}

module.exports = {
  getProductsByGatewayAccountIdAndTypeStub,
  getProductByExternalIdAndGatewayAccountIdStub: getProductByExternalIdAndGatewayAccountIdStub,
  deleteProductStub,
  getProductsByGatewayAccountIdAndTypeFailure,
  postCreateProductSuccess,
  postCreateProductSuccessWithRequestBody,
  patchUpdateProductSuccess
}
