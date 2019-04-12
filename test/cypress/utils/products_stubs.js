'use strict'

const getProductsStub = function getProductsStub (products, gatewayAccountId) {
  return {
    name: 'getProductsByGatewayAccountIdSuccess',
    opts: {
      gateway_account_id: gatewayAccountId,
      products: products
    }
  }
}

const getProductByExternalIdStub = function getProductByExternalIdStub (product, gatewayAccountId) {
  return {
    name: 'getProductByExternalIdSuccess',
    opts: {
      gateway_account_id: gatewayAccountId,
      product: product
    }
  }
}

module.exports = { getProductsStub, getProductByExternalIdStub }
