'use strict'

// NPM dependencies
const Pact = require('pact')
const {expect} = require('chai')
const proxyquire = require('proxyquire')

// Custom dependencies
const pactProxy = require('../../../../test_helpers/pact_proxy')
const PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const productFixtures = require('../../../../fixtures/product_fixtures')

// Constants
const PRODUCTS_RESOURCE = '/v1/api/products'
const mockPort = Math.floor(Math.random() * 65535)
const mockServer = pactProxy.create('localhost', mockPort)
let productsMock, result, response, productExternalId

function getProductsClient (baseUrl = `http://localhost:${mockPort}`, productsApiKey = 'ABC1234567890DEF') {
  return proxyquire('../../../../../app/services/clients/products_client', {
    '../../../config': {
      PRODUCTS_URL: baseUrl
    }
  })
}

describe('products client - creating a new payment', () => {
  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000)
    mockServer.start().then(() => {
      productsMock = Pact({consumer: 'selfservice', provider: 'products', port: mockPort, pactfileWriteMode: 'merge'})
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
      .catch(done)
  })

  describe('when a charge is successfully created', () => {
    before((done) => {
      const productsClient = getProductsClient()
      productExternalId = 'a-valid-product-id'
      response = productFixtures.validCreatePaymentResponse({product_external_id: productExternalId})
      productsMock.addInteraction(
        new PactInteractionBuilder(`${PRODUCTS_RESOURCE}/${productExternalId}/payments`)
          .withUponReceiving('a valid create charge create request')
          .withMethod('POST')
          .withStatusCode(201)
          .withResponseBody(response.getPactified())
          .build()
      )
        .then(() => productsClient.payment.create(productExternalId))
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    after(() => productsMock.finalize())

    it('should create a new product', () => {
      const plainResponse = response.getPlain()
      expect(result.productExternalId).to.equal(plainResponse.product_external_id).and.to.equal(productExternalId)
      expect(result.externalId).to.equal(plainResponse.external_id)
      expect(result.status).to.equal(plainResponse.status)
      expect(result.nextUrl).to.equal(plainResponse.next_url)
      expect(result).to.have.property('links')
      expect(Object.keys(result.links).length).to.equal(2)
      expect(result.links).to.have.property('self')
      expect(result.links.self).to.have.property('method').to.equal(plainResponse._links.find(link => link.rel === 'self').method)
      expect(result.links.self).to.have.property('href').to.equal(plainResponse._links.find(link => link.rel === 'self').href)
      expect(result.links).to.have.property('next')
      expect(result.links.next).to.have.property('method').to.equal(plainResponse._links.find(link => link.rel === 'next').method)
      expect(result.links.next).to.have.property('href').to.equal(plainResponse._links.find(link => link.rel === 'next').href)
    })
  })

  describe('when creating a charge using a malformed request', () => {
    beforeEach(done => {
      const productsClient = getProductsClient()
      productExternalId = 'invalid-id'
      productsMock.addInteraction(
        new PactInteractionBuilder(`${PRODUCTS_RESOURCE}/${productExternalId}/payments`)
          .withUponReceiving('an invalid create charge request')
          .withMethod('POST')
          .withStatusCode(400)
          .build()
      )
        .then(() => productsClient.payment.create(productExternalId), done)
        .then(() => done(new Error('Promise unexpectedly resolved')))
        .catch((err) => {
          result = err
          done()
        })
    })

    after(() => productsMock.finalize())

    it('should reject with error: bad request', () => {
      expect(result.errorCode).to.equal(400)
    })
  })
})
