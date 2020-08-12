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

const deleteProductStub = function deleteProductStub (product, gatewayAccountId, verifyCalledTimes) {
  return {
    name: 'deleteProductSuccess',
    opts: {
      gateway_account_id: gatewayAccountId,
      product: product,
      verifyCalledTimes: verifyCalledTimes
    }
  }
}

const getProductsByGatewayAccountIdFailure = function (gatewayAccountId) {
  return {
    name: 'getProductsByGatewayAccountIdFailure',
    opts: { gateway_account_id: gatewayAccountId }
  }
}

module.exports = {
  getProductsStub,
  getProductByExternalIdStub,
  deleteProductStub,
  getProductsByGatewayAccountIdFailure
}
