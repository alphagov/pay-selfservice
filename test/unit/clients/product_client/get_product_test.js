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
let productsMock, response, result, productExternalId

function getProductsClient (baseUrl = `http://localhost:${mockPort}`, productsApiKey = 'ABC1234567890DEF') {
  return proxyquire('../../../../app/services/clients/products_client', {
    '../../../config': {
      PRODUCTS_URL: baseUrl,
      PRODUCTS_API_TOKEN: productsApiKey
    }
  })
}

describe('products client - find a new product', function () {
  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000)
    mockServer.start().then(function () {
      productsMock = Pact({consumer: 'Selfservice-find-product', provider: 'products', port: mockPort})
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

  describe('when a product is successfully found', () => {
    before(done => {
      const productsClient = getProductsClient()
      productExternalId = 'existing-id'
      response = productFixtures.validCreateProductResponse({
        external_id: productExternalId,
        price: 1000,
        name: 'A Product Name',
        description: 'About this product',
        return_url: 'https://example.gov.uk'
      })
      productsMock.addInteraction(
        new PactInteractionBuilder(`${PRODUCT_RESOURCE}/${productExternalId}`)
          .withUponReceiving('a valid get product request')
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(response.getPactified())
          .build()
      )
        .then(() => productsClient.getProduct(productExternalId))
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    after((done) => {
      productsMock.finalize().then(() => done())
    })

    it('should find an existing product', () => {
      const plainResponse = response.getPlain()
      expect(result.externalId).to.equal(productExternalId)
      expect(result.name).to.exist.and.equal(plainResponse.name)
      expect(result.description).to.exist.and.equal(plainResponse.description)
      expect(result.price).to.exist.and.equal(plainResponse.price)
      expect(result.returnUrl).to.exist.and.equal(plainResponse.return_url)
      expect(result.payLink.href).to.exist.and.equal(`http://products-ui.url/pay/${productExternalId}`)
      expect(result.selfLink.href).to.exist.and.equal(`http://products.url/v1/api/products/${productExternalId}`)
    })
  })

  describe('when the request has invalid authorization credentials', () => {
    beforeEach(done => {
      const productsClient = getProductsClient(`http://localhost:${mockPort}`, 'invalid-api-key')
      productExternalId = 'existing-id'
      productsMock.addInteraction(
        new PactInteractionBuilder(`${PRODUCT_RESOURCE}/${productExternalId}`)
          .withUponReceiving('a valid find product request with invalid PRODUCTS_API_TOKEN')
          .withMethod('GET')
          .withStatusCode(401)
          .build()
      )
        .then(() => productsClient.getProduct(productExternalId), done)
        .then(() => done(new Error('Promise unexpectedly resolved')))
        .catch((err) => {
          result = err
          done()
        })
    })

    after((done) => {
      productsMock.finalize().then(() => done())
    })

    it('should reject with error: 401 unauthorised', () => {
      expect(result.errorCode).to.equal(401)
    })
  })

  describe('when a product is not found', () => {
    before(done => {
      const productsClient = getProductsClient()
      productExternalId = 'non-existing-id'
      productsMock.addInteraction(
        new PactInteractionBuilder(`${PRODUCT_RESOURCE}/${productExternalId}`)
          .withUponReceiving('a valid find product request with non existing id')
          .withMethod('GET')
          .withStatusCode(404)
          .build()
      )
        .then(() => productsClient.getProduct(productExternalId), done)
        .then(() => done(new Error('Promise unexpectedly resolved')))
        .catch((err) => {
          result = err
          done()
        })
    })

    after((done) => {
      productsMock.finalize().then(() => done())
    })

    it('should reject with error: 404 not found', () => {
      expect(result.errorCode).to.equal(404)
    })
  })
})
