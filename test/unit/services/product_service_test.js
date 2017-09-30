'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const q = require('q')
chai.use(chaiAsPromised)
const proxyquire = require('proxyquire')

const productFixtures = require('../../fixtures/product_fixtures')
const Product = require('../../../app/models/Product.class')
const expect = chai.expect
const productService = (publicAuthMock, productsClientMock) => {
  return proxyquire('../../../app/services/products_service.js',
    {
      './clients/products_client': productsClientMock,
      './clients/public_auth_client': publicAuthMock
    })
}

const resolved = data => {
  const defer = q.defer()
  defer.resolve(data)
  return defer.promise
}

const rejected = data => {
  const defer = q.defer()
  defer.reject(data)
  return defer.promise
}

let productData = {
  external_service_id: 'an-external-service-id',
  name: 'a-name',
  price: 1234
}

describe('product service', function () {
  it('should create a product successfully', function (done) {
    let publicAuthSuccessMock = {
      createTokenForAccount: () => {
        return resolved({token: 'valid-token'})
      }
    }

    let productSuccessMock = () => {
      return {
        createProduct: () => {
          return resolved(new Product(productFixtures.validCreateProductResponse(productData).getPlain()))
        }
      }
    }

    productService(publicAuthSuccessMock, productSuccessMock)
      .createProduct('email@email.com', 111, productData).should.be.fulfilled.then(product => {
        expect(product.externalServiceId).to.equal(productData.external_service_id)
        expect(product.name).to.equal(productData.name)
        expect(product.price).to.equal(productData.price)
      }).should.notify(done)
  })

  it('should fail if not able to create a pay auth token', function (done) {
    let publicAuthFailMock = {
      createTokenForAccount: () => {
        return rejected()
      }
    }

    productService(publicAuthFailMock, () => {})
      .createProduct('email@email.com', 111, productData).should.be.rejected
      .notify(done)
  })

  it('should fail if an error on product creation', function (done) {
    let publicAuthSuccessMock = {
      createTokenForAccount: () => {
        return resolved({token: 'valid-token'})
      }
    }

    let productFailMock = () => {
      return {
        createProduct: () => {
          return rejected()
        }
      }
    }

    productService(publicAuthSuccessMock, productFailMock)
      .createProduct('email@email.com', 111, productData).should.be.rejected
      .notify(done)
  })
})
