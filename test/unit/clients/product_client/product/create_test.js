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
const PRODUCT_RESOURCE = '/v1/api/products'
const mockPort = Math.floor(Math.random() * 65535)
const mockServer = pactProxy.create('localhost', mockPort)
let productsMock, request, response, result

const randomPrice = () => Math.round(Math.random() * 10000) + 1

function getProductsClient (baseUrl = `http://localhost:${mockPort}`, productsApiKey = 'ABC1234567890DEF') {
  return proxyquire('../../../../../app/services/clients/products_client', {
    '../../../config': {
      PRODUCTS_URL: baseUrl
    }
  })
}

describe('products client - create a new product', () => {
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
  })

  describe('when a product is successfully created', () => {
    before(done => {
      const productsClient = getProductsClient()
      request = productFixtures.validCreateProductRequest({
        description: 'a test product',
        returnUrl: 'https://example.gov.uk/paid-for-somet',
        price: randomPrice()
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
        .then(() => productsClient.product.create({
          gatewayAccountId: requestPlain.gateway_account_id,
          payApiToken: requestPlain.pay_api_token,
          name: requestPlain.name,
          price: requestPlain.price,
          serviceName: requestPlain.service_name,
          description: requestPlain.description,
          returnUrl: requestPlain.return_url,
          type: 'DEMO'
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
      const plainRequest = request.getPlain()
      const plainResponse = response.getPlain()
      expect(result.gatewayAccountId).to.equal(plainRequest.gateway_account_id)
      expect(result.name).to.equal(plainRequest.name)
      expect(result.description).to.equal(plainRequest.description)
      expect(result.price).to.equal(plainRequest.price)
      expect(result.returnUrl).to.equal('https://example.gov.uk/paid-for-somet')
      expect(result.type).to.equal('DEMO')
      expect(result).to.have.property('links')
      expect(Object.keys(result.links).length).to.equal(2)
      expect(result.links).to.have.property('self')
      expect(result.links.self).to.have.property('method').to.equal(plainResponse._links.find(link => link.rel === 'self').method)
      expect(result.links.self).to.have.property('href').to.equal(plainResponse._links.find(link => link.rel === 'self').href)
      expect(result.links).to.have.property('pay')
      expect(result.links.pay).to.have.property('method').to.equal(plainResponse._links.find(link => link.rel === 'pay').method)
      expect(result.links.pay).to.have.property('href').to.equal(plainResponse._links.find(link => link.rel === 'pay').href)
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
        .then(() => productsClient.product.create({
          gatewayAccountId: requestPlain.gateway_account_id,
          payApiToken: requestPlain.pay_api_token,
          name: requestPlain.name,
          price: requestPlain.price,
          description: requestPlain.description,
          serviceName: requestPlain.service_name,
          returnUrl: requestPlain.return_url,
          type: requestPlain.type
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
