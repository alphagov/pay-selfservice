'use strict'

const { Pact } = require('@pact-foundation/pact')

const path = require('path')
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const productFixtures = require('../../../../fixtures/product.fixtures')

// Constants
const API_RESOURCE = '/v1/api'
const port = Math.floor(Math.random() * 48127) + 1024
let response, result, gatewayAccountId

jest.mock('../../../config', () => ({
  PRODUCTS_URL: baseUrl
}));

function getProductsClient (baseUrl = `http://localhost:${port}`, productsApiKey = 'ABC1234567890DEF') {
  return require('../../../../../app/services/clients/products.client');
}

describe('products client - find products associated with a particular gateway account id', () => {
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

  describe('when products are successfully found', () => {
    beforeAll(done => {
      const productsClient = getProductsClient()
      gatewayAccountId = 42
      response = [
        productFixtures.validProductResponse({ gateway_account_id: gatewayAccountId, price: 1000 }),
        productFixtures.validProductResponse({ gateway_account_id: gatewayAccountId, price: 2000 }),
        productFixtures.validProductResponse({ gateway_account_id: gatewayAccountId, price: 3000 })
      ]
      const interaction = new PactInteractionBuilder(`${API_RESOURCE}/gateway-account/${gatewayAccountId}/products`)
        .withUponReceiving('a valid get product by gateway account id request')
        .withMethod('GET')
        .withState('three products with gateway account id 42 exist')
        .withStatusCode(200)
        .withResponseBody(response.map(item => item.getPactified()))
        .build()
      provider.addInteraction(interaction)
        .then(() => productsClient.product.getByGatewayAccountId(gatewayAccountId))
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    afterAll(() => provider.verify())

    it('should find an existing product', () => {
      const plainResponse = response.map(item => item.getPlain())
      expect(result.length).toBe(3)
      result.forEach((product, index) => {
        expect(product.gatewayAccountId).toBe(gatewayAccountId)
        expect(product.externalId).toBe(plainResponse[index].external_id)
        expect(product.name).toBe(plainResponse[index].name)
        expect(product.price).toBe(plainResponse[index].price)
        expect(product.language).toBe(plainResponse[index].language)
        expect(product).toHaveProperty('links')
        expect(Object.keys(product.links).length).toBe(2)
        expect(product.links).toHaveProperty('self')
        expect(product.links.self).to.have.property('method').toBe(plainResponse[index]._links.find(link => link.rel === 'self').method)
        expect(product.links.self).to.have.property('href').toBe(plainResponse[index]._links.find(link => link.rel === 'self').href)
        expect(product.links).toHaveProperty('pay')
        expect(product.links.pay).to.have.property('method').toBe(plainResponse[index]._links.find(link => link.rel === 'pay').method)
        expect(product.links.pay).to.have.property('href').toBe(plainResponse[index]._links.find(link => link.rel === 'pay').href)
      })
    })
  })

  describe('when no products are found', () => {
    beforeAll(done => {
      const productsClient = getProductsClient()
      gatewayAccountId = 98765
      const interaction = new PactInteractionBuilder(`${API_RESOURCE}/gateway-account/${gatewayAccountId}/products`)
        .withUponReceiving('a valid get product by gateway account id where the gateway account has no products')
        .withMethod('GET')
        .withStatusCode(200)
        .withResponseBody([])
        .build()
      provider.addInteraction(interaction)
        .then(() => productsClient.product.getByGatewayAccountId(gatewayAccountId), done)
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    afterAll(() => provider.verify())

    it('should return an empty array', () => {
      expect(result).toEqual([]) // eslint-disable-line
    })
  })
})
