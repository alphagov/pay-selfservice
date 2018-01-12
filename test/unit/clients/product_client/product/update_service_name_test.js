'use strict'

// NPM dependencies
const Pact = require('pact')
const {expect} = require('chai')
const proxyquire = require('proxyquire')

// Custom dependencies
const pactProxy = require('../../../../test_helpers/pact_proxy')
const {invalidUpdateProductServiceNameRequest, validUpdateProductServiceNameRequest, validCreateProductResponse} = require('../../../../fixtures/product_fixtures')
const PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder

// Constants
const PRODUCT_RESOURCE = '/v1/api/products'
const mockPort = Math.floor(Math.random() * 65535)
const mockServer = pactProxy.create('localhost', mockPort)
let productsMock
function getProductsClient (baseUrl = `http://localhost:${mockPort}`, productsApiKey = 'ABC1234567890DEF') {
  return proxyquire('../../../../../app/services/clients/products_client', {
    '../../../config': {
      PRODUCTS_URL: baseUrl,
      PRODUCTS_API_TOKEN: productsApiKey
    }
  })
}

describe('products client - disable a product', () => {
  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000)
    mockServer.start().then(function () {
      productsMock = Pact({consumer: 'Selfservice-create-new-product', provider: 'products', port: mockPort})
      done()
    })
  })

  /**
   * Remove the server and publish pacts to broker
   */
  after(done => {
    mockServer.delete()
      .then(() => pactProxy.removeAll())
      .then(() => done())
  })

  describe('when a product is successfully disabled', () => {
    let result, productExternalId, newServiceName
    before(done => {
      const productsClient = getProductsClient()
      productExternalId = 'a_valid_external_id'
      newServiceName = 'Buy a Fish'
      productsMock.addInteraction(
        new PactInteractionBuilder(`${PRODUCT_RESOURCE}/${productExternalId}`)
          .withUponReceiving('a valid update product service_name request')
          .withRequestBody(validUpdateProductServiceNameRequest(newServiceName).getPactified())
          .withMethod('PATCH')
          .withStatusCode(200)
          .withResponseBody(validCreateProductResponse({serviceName: newServiceName}).getPactified())
          .build()
      )
        .then(() => productsClient.product.updateProductServiceName(productExternalId, newServiceName))
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    afterEach(done => {
      productsMock.finalize().then(() => done())
    })

    it(`should update the product's associated serviceName`, () => {
      expect(result.serviceName).to.equal(newServiceName)
    })
  })

  describe('when the request has invalid authorization credentials', () => {
    let result, productExternalId, newServiceName
    before(done => {
      const productsClient = getProductsClient(`http://localhost:${mockPort}`, 'invalid-api-key')
      productExternalId = 'a_valid_external_id'
      newServiceName = 'Buy a Fish'
      productsMock.addInteraction(
        new PactInteractionBuilder(`${PRODUCT_RESOURCE}/${productExternalId}`)
          .withUponReceiving('a valid update product service_name request with invalid PRODUCTS_API_TOKEN')
          .withRequestBody(validUpdateProductServiceNameRequest(newServiceName).getPactified())
          .withMethod('PATCH')
          .withStatusCode(401)
          .build()
      )
        .then(() => productsClient.product.updateProductServiceName(productExternalId, newServiceName))
        .then(() => done(new Error('Promise unexpectedly resolved')))
        .catch((err) => {
          result = err
          done()
        })
    })

    afterEach(done => {
      productsMock.finalize().then(() => done())
    })

    it('should error unauthorised', () => {
      expect(result.errorCode).to.equal(401)
    })
  })

  describe('update service name - bad request', () => {
    let result, productExternalId
    before(done => {
      const productsClient = getProductsClient()
      productExternalId = 'a_valid_external_id'
      const request = invalidUpdateProductServiceNameRequest()
      productsMock.addInteraction(new PactInteractionBuilder(`${PRODUCT_RESOURCE}/${productExternalId}`)
        .withUponReceiving('a invalid update product service_name request')
        .withRequestBody(request.getPactified())
        .withMethod('PATCH')
        .withStatusCode(400)
        .build())
        .then(() => productsClient.product.updateProductServiceName(productExternalId))
        .then(() => done(new Error('Promise unexpectedly resolved')))
        .catch((err) => {
          result = err
          done()
        })
    })

    afterEach(done => {
      productsMock.finalize().then(() => done())
    })

    it('should reject with error: bad request', () => {
      expect(result.errorCode).to.equal(400)
    })
  })
})
