'use strict'

const { Pact } = require('@pact-foundation/pact')
const { expect } = require('chai')
const proxyquire = require('proxyquire')

const path = require('path')
const PactInteractionBuilder = require('../../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const productFixtures = require('../../../../fixtures/product.fixtures')
const { pactify } = require('../../../../test-helpers/pact/pactifier').defaultPactifier

// Constants
const PRODUCT_RESOURCE = '/v1/api/products'
const port = Math.floor(Math.random() * 48127) + 1024
let result

const randomPrice = () => Math.round(Math.random() * 10000) + 1

function getProductsClient (baseUrl = `http://localhost:${port}`, productsApiKey = 'ABC1234567890DEF') {
  return proxyquire('../../../../../app/services/clients/products.client', {
    '../../../config': {
      PRODUCTS_URL: baseUrl
    }
  })
}

describe('products client - create a new product', () => {
  let provider = new Pact({
    consumer: 'selfservice-to-be',
    provider: 'products',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after(() => provider.finalize())

  describe('when a product is successfully created', () => {
    const language = 'cy'
    const request = productFixtures.validCreateProductRequest({
      description: 'a test product',
      returnUrl: 'https://example.gov.uk/paid-for-somet',
      price: randomPrice(),
      language
    })
    const response = productFixtures.validProductResponse(request)

    before(done => {
      const productsClient = getProductsClient()
      provider.addInteraction(
        new PactInteractionBuilder(PRODUCT_RESOURCE)
          .withUponReceiving('a valid create product request')
          .withMethod('POST')
          .withRequestBody(request)
          .withStatusCode(201)
          .withResponseBody(pactify(response))
          .build()
      )
        .then(() => productsClient.product.create({
          gatewayAccountId: request.gateway_account_id,
          payApiToken: request.pay_api_token,
          name: request.name,
          price: request.price,
          description: request.description,
          returnUrl: request.return_url,
          type: 'DEMO',
          language
        }))
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    afterEach(() => provider.verify())

    it('should create a new product', () => {
      expect(result.gatewayAccountId).to.equal(request.gateway_account_id)
      expect(result.name).to.equal(request.name)
      expect(result.description).to.equal(request.description)
      expect(result.price).to.equal(request.price)
      expect(result.returnUrl).to.equal('https://example.gov.uk/paid-for-somet')
      expect(result.type).to.equal('DEMO')
      expect(result.language).to.equal(language)
      expect(result).to.have.property('links')
      expect(Object.keys(result.links).length).to.equal(2)
      expect(result.links).to.have.property('self')
      expect(result.links.self).to.have.property('method').to.equal(response._links.find(link => link.rel === 'self').method)
      expect(result.links.self).to.have.property('href').to.equal(response._links.find(link => link.rel === 'self').href)
      expect(result.links).to.have.property('pay')
      expect(result.links.pay).to.have.property('method').to.equal(response._links.find(link => link.rel === 'pay').method)
      expect(result.links.pay).to.have.property('href').to.equal(response._links.find(link => link.rel === 'pay').href)
    })
  })

  describe('create a product - bad request', () => {
    const request = productFixtures.validCreateProductRequest({ pay_api_token: '' })

    before(done => {
      const productsClient = getProductsClient()
      provider.addInteraction(
        new PactInteractionBuilder(PRODUCT_RESOURCE)
          .withUponReceiving('an invalid create product request')
          .withMethod('POST')
          .withRequestBody(request)
          .withStatusCode(400)
          .build()
      )
        .then(() => productsClient.product.create({
          gatewayAccountId: request.gateway_account_id,
          payApiToken: request.pay_api_token,
          name: request.name,
          price: request.price,
          description: request.description,
          returnUrl: request.return_url,
          type: request.type,
          language: request.language
        }), done)
        .then(() => done(new Error('Promise unexpectedly resolved')))
        .catch((err) => {
          result = err
          done()
        })
    })

    afterEach(() => provider.verify())

    it('should reject with error: bad request', () => {
      expect(result.errorCode).to.equal(400)
    })
  })
})
