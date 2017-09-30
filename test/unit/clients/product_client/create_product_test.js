'use strict'

// NPM dependencies
const Pact = require('pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const pactProxy = require('../../../test_helpers/pact_proxy')
const PactInteractionBuilder = require('../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const getProductsClient = require('../../../../app/services/clients/products_client')
const productFixtures = require('../../../fixtures/product_fixtures')

// Constants
const PRODUCT_RESOURCE = '/v1/api/products'
const mockPort = Math.floor(Math.random() * 65535)
const mockServer = pactProxy.create('localhost', mockPort)
const productsClient = getProductsClient({baseUrl: `http://localhost:${mockPort}`})
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

describe('products client - create a new product', function () {
  let productsMock

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
  after(function (done) {
    mockServer.delete()
      .then(() => pactProxy.removeAll())
      .then(() => done())
  })

  describe('creating a product', function () {
    context('create a product - success', () => {
      let validCreateProductRequest = productFixtures.validCreateProductRequest()
      let validCreateProductResponse = productFixtures.validCreateProductResponse(
        {
          name: validCreateProductRequest.getPlain().name,
          description: validCreateProductRequest.getPlain().description,
          external_service_id: validCreateProductRequest.getPlain().external_service_id,
          price: validCreateProductRequest.getPlain().price
        }
      )

      beforeEach((done) => {
        productsMock.addInteraction(
          new PactInteractionBuilder(PRODUCT_RESOURCE)
            .withUponReceiving('a valid create product request')
            .withMethod('POST')
            .withRequestBody(validCreateProductRequest.getPactified())
            .withStatusCode(201)
            .withResponseBody(validCreateProductResponse.getPactified())
            .build()
        ).then(() => {
          done()
        }).catch(e =>
          console.log(e)
        )
      })

      afterEach((done) => {
        productsMock.finalize().then(() => done())
      })

      it('should create a new product', function (done) {
        let productRequestData = validCreateProductRequest.getPlain()
        productsClient.createProduct(productRequestData).should.be.fulfilled.then(product => {
          expect(product.externalProductId).to.equal('product-externalId')
          expect(product.name).to.equal(productRequestData.name)
          expect(product.description).to.equal(productRequestData.description)
          expect(product.price).to.equal(productRequestData.price)
          expect(product.returnUrl).to.equal('http://some.return.url/')
          expect(product.payLink.href).to.equal(`http://products-ui.url/pay/product-externalId`)
          expect(product.selfLink.href).to.equal(`http://products.url/v1/api/products/product-externalId`)
        }).should.notify(done)
      })
    })

    context('create a product - unauthorized', () => {
      let validCreateProductRequest = productFixtures.validCreateProductRequest()

      beforeEach((done) => {
        productsMock.addInteraction(
          new PactInteractionBuilder(PRODUCT_RESOURCE)
            .withUponReceiving('a valid create product request with invalid PRODUCTS_API_KEY')
            .withMethod('POST')
            .withRequestBody(validCreateProductRequest.getPactified())
            .withStatusCode(401)
            .build()
        ).then(() => {
          done()
        }).catch(e =>
          console.log(e)
        )
      })

      afterEach((done) => {
        productsMock.finalize().then(() => done())
      })

      it('should error unauthorised', function (done) {
        let productRequestData = validCreateProductRequest.getPlain()
        const productsClientWithInvalidToken = getProductsClient({
          baseUrl: `http://localhost:${mockPort}`,
          productsApiKey: 'invalid-api-key'
        })

        productsClientWithInvalidToken.createProduct(productRequestData).should.be.rejected.then(response => {
          expect(response.errorCode).to.equal(401)
        }).should.notify(done)
      })
    })

    context('create a product - bad request', () => {
      let invalidCreateProductRequest = productFixtures.validCreateProductRequest({pay_api_token: ''})

      beforeEach((done) => {
        productsMock.addInteraction(
          new PactInteractionBuilder(PRODUCT_RESOURCE)
            .withUponReceiving('an invalid create product request')
            .withMethod('POST')
            .withRequestBody(invalidCreateProductRequest.getPactified())
            .withStatusCode(400)
            .build()
        ).then(() => {
          done()
        }).catch(e =>
          console.log(e)
        )
      })

      afterEach((done) => {
        productsMock.finalize().then(() => done())
      })

      it('should error unauthorised', function (done) {
        let productRequestData = invalidCreateProductRequest.getPlain()

        productsClient.createProduct(productRequestData).should.be.rejected.then(response => {
          expect(response.errorCode).to.equal(400)
        }).should.notify(done)
      })
    })
  })
})
