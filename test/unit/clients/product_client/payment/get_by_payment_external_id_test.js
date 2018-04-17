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
const PAYMENT_RESOURCE = '/v1/api/payments'
const mockPort = Math.floor(Math.random() * 65535)
const mockServer = pactProxy.create('localhost', mockPort)
let productsMock, response, result, paymentExternalId

function getProductsClient (baseUrl = `http://localhost:${mockPort}`, productsApiKey = 'ABC1234567890DEF') {
  return proxyquire('../../../../../app/services/clients/products_client', {
    '../../../config': {
      PRODUCTS_URL: baseUrl
    }
  })
}

describe('products client - find a payment by it\'s own external id', function () {
  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000)
    mockServer.start().then(function () {
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

  describe('when a product is successfully found', () => {
    before(done => {
      const productsClient = getProductsClient()
      paymentExternalId = 'existing-id'
      response = productFixtures.validCreatePaymentResponse({external_id: paymentExternalId})
      const interaction = new PactInteractionBuilder(`${PAYMENT_RESOURCE}/${paymentExternalId}`)
        .withUponReceiving('a valid get payment request')
        .withMethod('GET')
        .withStatusCode(200)
        .withResponseBody(response.getPactified())
        .build()
      productsMock.addInteraction(interaction)
        .then(() => productsClient.payment.getByPaymentExternalId(paymentExternalId))
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    after(() => productsMock.finalize())

    it('should find an existing payment', () => {
      const plainResponse = response.getPlain()
      expect(result.productExternalId).to.equal(plainResponse.product_external_id)
      expect(result.externalId).to.equal(plainResponse.external_id).and.to.equal(paymentExternalId)
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

  describe('when a product is not found', () => {
    before(done => {
      const productsClient = getProductsClient()
      paymentExternalId = 'non-existing-id'
      productsMock.addInteraction(
        new PactInteractionBuilder(`${PAYMENT_RESOURCE}/${paymentExternalId}`)
          .withUponReceiving('a valid find product request with non existing id')
          .withMethod('GET')
          .withStatusCode(404)
          .build()
      )
        .then(() => productsClient.payment.getByPaymentExternalId(paymentExternalId), done)
        .then(() => done(new Error('Promise unexpectedly resolved')))
        .catch((err) => {
          result = err
          done()
        })
    })

    after(() => productsMock.finalize())

    it('should reject with error: 404 not found', () => {
      expect(result.errorCode).to.equal(404)
    })
  })
})
