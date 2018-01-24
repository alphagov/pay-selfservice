'use strict'

// NPM dependencies
const Pact = require('pact')
const {expect} = require('chai')
const proxyquire = require('proxyquire')

// Custom dependencies
const pactProxy = require('../../../../test_helpers/pact_proxy')
const {invalidUpdateServiceNameOfProductsByGatewayAccountIdRequest, validUpdateServiceNameOfProductsByGatewayAccountIdRequest} = require('../../../../fixtures/product_fixtures')
const PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder

// Constants
const GATEWAY_ACCOUNT_RESOURCE = '/v1/api/gateway-account'
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

describe('products client - update product service name by gateway account id', () => {
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

  describe('when the request is successful', () => {
    let result, gatewayAccountId, newServiceName
    before(done => {
      const productsClient = getProductsClient()
      gatewayAccountId = '541'
      newServiceName = 'Buy a Fish'
      productsMock.addInteraction(
        new PactInteractionBuilder(`${GATEWAY_ACCOUNT_RESOURCE}/${gatewayAccountId}`)
          .withUponReceiving('a valid update product service_name request')
          .withRequestBody(validUpdateServiceNameOfProductsByGatewayAccountIdRequest(newServiceName).getPactified())
          .withMethod('PATCH')
          .withStatusCode(200)
          .build()
      )
        .then(() => productsClient.product.updateServiceNameOfProductsByGatewayAccountId(gatewayAccountId, newServiceName))
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    afterEach(done => {
      productsMock.finalize().then(() => done())
    })

    it(`should update the service name of any products associated with the service name`, () => {
      expect(result).to.equal(undefined)
    })
  })

  describe('when the request has invalid authorization credentials', () => {
    let result, gatewayAccountId, newServiceName
    before(done => {
      const productsClient = getProductsClient(`http://localhost:${mockPort}`, 'invalid-api-key')
      gatewayAccountId = '541'
      newServiceName = 'Buy a Fish'
      productsMock.addInteraction(
        new PactInteractionBuilder(`${GATEWAY_ACCOUNT_RESOURCE}/${gatewayAccountId}`)
          .withUponReceiving('a valid update product service_name request with invalid PRODUCTS_API_TOKEN')
          .withRequestBody(validUpdateServiceNameOfProductsByGatewayAccountIdRequest(newServiceName).getPactified())
          .withMethod('PATCH')
          .withStatusCode(401)
          .build()
      )
        .then(() => productsClient.product.updateServiceNameOfProductsByGatewayAccountId(gatewayAccountId, newServiceName))
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

  describe('when the request is malformed', () => {
    let result, gatewayAccountId
    before(done => {
      const productsClient = getProductsClient()
      gatewayAccountId = '541'
      productsMock.addInteraction(new PactInteractionBuilder(`${GATEWAY_ACCOUNT_RESOURCE}/${gatewayAccountId}`)
        .withUponReceiving('a invalid update product service_name request')
        .withRequestBody(invalidUpdateServiceNameOfProductsByGatewayAccountIdRequest().getPactified())
        .withMethod('PATCH')
        .withStatusCode(400)
        .build())
        .then(() => productsClient.product.updateServiceNameOfProductsByGatewayAccountId(gatewayAccountId))
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
