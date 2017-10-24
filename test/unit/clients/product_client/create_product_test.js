'use strict'

// NPM dependencies
const Pact = require('pact')
const {expect} = require('chai')
const proxyquire = require('proxyquire')

// Custom dependencies
const pactProxy = require('../../../test_helpers/pact_proxy')
const PactInteractionBuilder = require('../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const productFixtures = require('../../../fixtures/product_fixtures')

// Constants
const PRODUCT_RESOURCE = '/v1/api/products'
const mockPort = Math.floor(Math.random() * 65535)
const mockServer = pactProxy.create('localhost', mockPort)
let productsMock, request, response, result

function getProductsClient (baseUrl = `http://localhost:${mockPort}`, productsApiKey = 'ABC1234567890DEF') {
  return proxyquire('../../../../app/services/clients/products_client', {
    '../../../config': {
      PRODUCTS_URL: baseUrl,
      PRODUCTS_API_TOKEN: productsApiKey
    }
  })
}

describe('products client - creating a new product', () => {
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

  describe('when a product is successfully created', () => {
    before(done => {
      const productsClient = getProductsClient()
      request = productFixtures.validCreateProductRequest({
        description: 'a test product',
        returnUrl: 'https://example.gov.uk/paid-for-somet'
      })
      const requestPlain = request.getPlain()
      response = productFixtures.validCreateProductResponse(requestPlain)
      productsMock.addInteraction(
        new PactInteractionBuilder(PRODUCT_RESOURCE)
          .withUponReceiving('a valid create product request')
          .withMethod('POST')
          .withRequestBody(request.getPactified())
          .withStatusCode(201)
          .withResponseBody(response.getPactified())
          .build()
      )
        .then(() => productsClient.createProduct({
          gatewayAccountId: requestPlain.gateway_account_id,
          payApiToken: requestPlain.pay_api_token,
          name: requestPlain.name,
          price: requestPlain.price,
          description: requestPlain.description,
          returnUrl: requestPlain.return_url
        }))
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    afterEach(done => {
      productsMock.finalize().then(() => done())
    })

    it('should create a new product', () => {
      const requestPlain = request.getPlain()
      const responsePlain = response.getPlain()
      expect(result.gatewayAccountId).to.equal(requestPlain.gateway_account_id)
      expect(result.name).to.equal(requestPlain.name)
      expect(result.description).to.equal(requestPlain.description)
      expect(result.price).to.equal(requestPlain.price)
      expect(result.returnUrl).to.equal('https://example.gov.uk/paid-for-somet')
      expect(result.payLink.href).to.equal(`http://products-ui.url/pay/${responsePlain.external_id}`)
      expect(result.selfLink.href).to.equal(`http://products.url/v1/api/products/${responsePlain.external_id}`)
    })
  })

  describe('when the request has invalid authorization credentials', () => {
    before(done => {
      const productsClient = getProductsClient(`http://localhost:${mockPort}`, 'invalid-api-key')
      request = productFixtures.validCreateProductRequest()
      const requestPlain = request.getPlain()
      productsMock.addInteraction(
        new PactInteractionBuilder(PRODUCT_RESOURCE)
          .withUponReceiving('a valid create product request with invalid PRODUCTS_API_TOKEN')
          .withMethod('POST')
          .withRequestBody(request.getPactified())
          .withStatusCode(401)
          .build()
      )
        .then(() => productsClient.createProduct({
          gatewayAccountId: requestPlain.gateway_account_id,
          payApiToken: requestPlain.pay_api_token,
          name: requestPlain.name,
          price: requestPlain.price,
          description: requestPlain.description,
          returnUrl: requestPlain.return_url
        }), done)
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

  describe('create a product - bad request', () => {
    before(done => {
      const productsClient = getProductsClient()
      request = productFixtures.validCreateProductRequest({pay_api_token: ''})
      const requestPlain = request.getPlain()
      productsMock.addInteraction(
        new PactInteractionBuilder(PRODUCT_RESOURCE)
          .withUponReceiving('an invalid create product request')
          .withMethod('POST')
          .withRequestBody(request.getPactified())
          .withStatusCode(400)
          .build()
      )
        .then(() => productsClient.createProduct({
          gatewayAccountId: requestPlain.gateway_account_id,
          payApiToken: requestPlain.pay_api_token,
          name: requestPlain.name,
          price: requestPlain.price,
          description: requestPlain.description,
          returnUrl: requestPlain.return_url
        }), done)
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
