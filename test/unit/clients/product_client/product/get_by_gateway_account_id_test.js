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
const API_RESOURCE = '/v1/api'
const mockPort = Math.floor(Math.random() * 65535)
const mockServer = pactProxy.create('localhost', mockPort)
let productsMock, response, result, gatewayAccountId

const randomPrice = () => Math.round(Math.random() * 10000) + 1

function getProductsClient (baseUrl = `http://localhost:${mockPort}`, productsApiKey = 'ABC1234567890DEF') {
  return proxyquire('../../../../../app/services/clients/products_client', {
    '../../../config': {
      PRODUCTS_URL: baseUrl
    }
  })
}

describe('products client - find products associated with a particular gateway account id', function () {
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
  })

  describe('when products are successfully found', () => {
    before(done => {
      const productsClient = getProductsClient()
      gatewayAccountId = 123456
      response = [
        productFixtures.validCreateProductResponse({gateway_account_id: gatewayAccountId, price: randomPrice()}),
        productFixtures.validCreateProductResponse({gateway_account_id: gatewayAccountId, price: randomPrice()}),
        productFixtures.validCreateProductResponse({gateway_account_id: gatewayAccountId, price: randomPrice()})
      ]
      const interaction = new PactInteractionBuilder(`${API_RESOURCE}/gateway-account/${gatewayAccountId}/products`)
        .withUponReceiving('a valid get product by gateway account id request')
        .withMethod('GET')
        .withStatusCode(200)
        .withResponseBody(response.map(item => item.getPactified()))
        .build()
      productsMock.addInteraction(interaction)
        .then(() => productsClient.product.getByGatewayAccountId(gatewayAccountId))
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
      const plainResponse = response.map(item => item.getPlain())
      expect(result.length).to.equal(3)
      result.forEach((product, index) => {
        expect(product.gatewayAccountId).to.equal(gatewayAccountId)
        expect(product.externalId).to.exist.and.equal(plainResponse[index].external_id)
        expect(product.name).to.exist.and.equal(plainResponse[index].name)
        expect(product.price).to.exist.and.equal(plainResponse[index].price)
        expect(product).to.have.property('links')
        expect(Object.keys(product.links).length).to.equal(2)
        expect(product.links).to.have.property('self')
        expect(product.links.self).to.have.property('method').to.equal(plainResponse[index]._links.find(link => link.rel === 'self').method)
        expect(product.links.self).to.have.property('href').to.equal(plainResponse[index]._links.find(link => link.rel === 'self').href)
        expect(product.links).to.have.property('pay')
        expect(product.links.pay).to.have.property('method').to.equal(plainResponse[index]._links.find(link => link.rel === 'pay').method)
        expect(product.links.pay).to.have.property('href').to.equal(plainResponse[index]._links.find(link => link.rel === 'pay').href)
      })
    })
  })

  describe('when no products are found', () => {
    before(done => {
      const productsClient = getProductsClient()
      gatewayAccountId = 98765
      const interaction = new PactInteractionBuilder(`${API_RESOURCE}/gateway-account/${gatewayAccountId}/products`)
        .withUponReceiving('a valid get product by gateway account id where the gateway account has no products')
        .withMethod('GET')
        .withStatusCode(404)
        .build()
      productsMock.addInteraction(interaction)
        .then(() => productsClient.product.getByGatewayAccountId(gatewayAccountId), done)
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
