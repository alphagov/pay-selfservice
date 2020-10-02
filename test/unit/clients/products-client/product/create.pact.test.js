'use strict'

const { Pact } = require('@pact-foundation/pact')

const path = require('path')
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const productFixtures = require('../../../../fixtures/product.fixtures')

// Constants
const PRODUCT_RESOURCE = '/v1/api/products'
const port = Math.floor(Math.random() * 48127) + 1024
let request, response, result

const randomPrice = () => Math.round(Math.random() * 10000) + 1

jest.mock('../../../config', () => ({
  PRODUCTS_URL: baseUrl
}));

function getProductsClient (baseUrl = `http://localhost:${port}`, productsApiKey = 'ABC1234567890DEF') {
  return require('../../../../../app/services/clients/products.client');
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

  beforeAll(() => provider.setup())
  afterAll(() => provider.finalize())

  describe('when a product is successfully created', () => {
    const language = 'cy'

    beforeAll(done => {
      const productsClient = getProductsClient()
      request = productFixtures.validCreateProductRequest({
        description: 'a test product',
        returnUrl: 'https://example.gov.uk/paid-for-somet',
        price: randomPrice(),
        language
      })
      const requestPlain = request.getPlain()
      response = productFixtures.validProductResponse(requestPlain)
      provider.addInteraction(
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
          description: requestPlain.description,
          returnUrl: requestPlain.return_url,
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
      const plainRequest = request.getPlain()
      const plainResponse = response.getPlain()
      expect(result.gatewayAccountId).toBe(plainRequest.gateway_account_id)
      expect(result.name).toBe(plainRequest.name)
      expect(result.description).toBe(plainRequest.description)
      expect(result.price).toBe(plainRequest.price)
      expect(result.returnUrl).toBe('https://example.gov.uk/paid-for-somet')
      expect(result.type).toBe('DEMO')
      expect(result.language).toBe(language)
      expect(result).toHaveProperty('links')
      expect(Object.keys(result.links).length).toBe(2)
      expect(result.links).toHaveProperty('self')
      expect(result.links.self).to.have.property('method').toBe(plainResponse._links.find(link => link.rel === 'self').method)
      expect(result.links.self).to.have.property('href').toBe(plainResponse._links.find(link => link.rel === 'self').href)
      expect(result.links).toHaveProperty('pay')
      expect(result.links.pay).to.have.property('method').toBe(plainResponse._links.find(link => link.rel === 'pay').method)
      expect(result.links.pay).to.have.property('href').toBe(plainResponse._links.find(link => link.rel === 'pay').href)
    })
  })

  describe('create a product - bad request', () => {
    beforeAll(done => {
      const productsClient = getProductsClient()
      request = productFixtures.validCreateProductRequest({ pay_api_token: '' })
      const requestPlain = request.getPlain()
      provider.addInteraction(
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
          returnUrl: requestPlain.return_url,
          type: requestPlain.type,
          language: requestPlain.language
        }), done)
        .then(() => done(new Error('Promise unexpectedly resolved')))
        .catch((err) => {
          result = err
          done()
        })
    })

    afterEach(() => provider.verify())

    it('should reject with error: bad request', () => {
      expect(result.errorCode).toBe(400)
    })
  })
})
