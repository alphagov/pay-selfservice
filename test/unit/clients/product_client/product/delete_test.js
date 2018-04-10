'use strict'

// NPM dependencies
const Pact = require('pact')
const {expect} = require('chai')
const proxyquire = require('proxyquire')

// Custom dependencies
const pactProxy = require('../../../../test_helpers/pact_proxy')
const PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder

// Constants
const API_RESOURCE = '/v1/api'
const mockPort = Math.floor(Math.random() * 65535)
const mockServer = pactProxy.create('localhost', mockPort)
let productsMock, result, productExternalId, gatewayAccountId

function getProductsClient (baseUrl = `http://localhost:${mockPort}`, productsApiKey = 'ABC1234567890DEF') {
  return proxyquire('../../../../../app/services/clients/products_client', {
    '../../../config': {
      PRODUCTS_URL: baseUrl
    }
  })
}

describe('products client - delete a product', () => {
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

  describe('when a product is successfully deleted', () => {
    before(done => {
      const productsClient = getProductsClient()
      gatewayAccountId = '999'
      productExternalId = 'a_valid_external_id'
      productsMock.addInteraction(
        new PactInteractionBuilder(`${API_RESOURCE}/gateway-account/${gatewayAccountId}/products/${productExternalId}`)
          .withUponReceiving('a valid disable product request')
          .withMethod('DELETE')
          .withStatusCode(204)
          .build()
      )
        .then(() => productsClient.product.delete(gatewayAccountId, productExternalId))
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    afterEach(done => {
      productsMock.finalize().then(() => done())
    })

    it('should delete the product', () => {
      expect(result).to.equal(undefined)
    })
  })

  describe('delete a product - bad request', () => {
    before(done => {
      const productsClient = getProductsClient()
      productExternalId = 'a_non_existant_external_id'
      productsMock.addInteraction(
        new PactInteractionBuilder(`${API_RESOURCE}/gateway-account/${gatewayAccountId}/products/${productExternalId}`)
          .withUponReceiving('an invalid delete product request')
          .withMethod('DELETE')
          .withStatusCode(404)
          .build()
      )
        .then(() => productsClient.product.delete(gatewayAccountId, productExternalId), done)
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
      expect(result.errorCode).to.equal(404)
    })
  })
})
