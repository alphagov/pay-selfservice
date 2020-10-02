'use strict'

const { Pact } = require('@pact-foundation/pact')

const path = require('path')
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const productFixtures = require('../../../../fixtures/product.fixtures')

// Constants
const API_RESOURCE = '/v1/api'
const port = Math.floor(Math.random() * 48127) + 1024
let response, result, productExternalId, gatewayAccountId

jest.mock('../../../config', () => ({
  PRODUCTS_URL: baseUrl
}));

function getProductsClient (baseUrl = `http://localhost:${port}`, productsApiKey = 'ABC1234567890DEF') {
  return require('../../../../../app/services/clients/products.client');
}

describe('products client - find a product by it\'s external id', () => {
  let provider = new Pact({
    consumer: 'selfservice',
    provider: 'products',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  beforeAll(() => provider.setup())
  afterAll(() => provider.finalize())

  describe('when a product is successfully found', () => {
    beforeAll(done => {
      const productsClient = getProductsClient()
      gatewayAccountId = 42
      productExternalId = 'existing-id'
      response = productFixtures.validProductResponse({
        external_id: productExternalId,
        gateway_account_id: 42,
        price: 1000,
        name: 'A Product Name',
        description: 'About this product',
        return_url: 'https://example.gov.uk',
        type: 'DEMO'
      })
      provider.addInteraction(
        new PactInteractionBuilder(`${API_RESOURCE}/gateway-account/${gatewayAccountId}/products/${productExternalId}`)
          .withUponReceiving('a valid get product request by external id')
          .withMethod('GET')
          .withState('a product with external id existing-id and gateway account id 42 exists')
          .withStatusCode(200)
          .withResponseBody(response.getPactified())
          .build()
      )
        .then(() => productsClient.product.getByProductExternalId(gatewayAccountId, productExternalId))
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    afterAll(() => provider.verify())

    it('should find an existing product', () => {
      const plainResponse = response.getPlain()
      expect(result.externalId).toBe(productExternalId)
      expect(result.name).toBe(plainResponse.name)
      expect(result.description).toBe(plainResponse.description)
      expect(result.price).toBe(plainResponse.price)
      expect(result.returnUrl).toBe(plainResponse.return_url)
      expect(result.type).toBe('DEMO')
      expect(result.language).toBe(plainResponse.language)
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

  describe('when a product is not found', () => {
    beforeAll(done => {
      const productsClient = getProductsClient()
      gatewayAccountId = 999
      productExternalId = 'non-existing-id'
      provider.addInteraction(
        new PactInteractionBuilder(`${API_RESOURCE}/gateway-account/${gatewayAccountId}/products/${productExternalId}`)
          .withUponReceiving('a valid find product request with non existing id')
          .withMethod('GET')
          .withStatusCode(404)
          .withResponseHeaders({})
          .build()
      )
        .then(() => productsClient.product.getByProductExternalId(gatewayAccountId, productExternalId), done)
        .then(() => done(new Error('Promise unexpectedly resolved')))
        .catch((err) => {
          result = err
          done()
        })
    })

    afterAll(() => provider.verify())

    it('should reject with error: 404 not found', () => {
      expect(result.errorCode).toBe(404)
    })
  })
})
