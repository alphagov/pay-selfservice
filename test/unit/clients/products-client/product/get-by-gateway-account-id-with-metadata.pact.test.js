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

describe('products client - find a product with metadata associated with a particular gateway account id', () => {
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

  describe('when the product is successfully found', () => {
    beforeAll(done => {
      const productsClient = getProductsClient()
      gatewayAccountId = 42
      response = [
        productFixtures.validProductResponse({ gateway_account_id: gatewayAccountId, price: 1000, metadata: { key: 'value' } })
      ]
      const interaction = new PactInteractionBuilder(`${API_RESOURCE}/gateway-account/${gatewayAccountId}/products`)
        .withUponReceiving('a valid get product with metadata by gateway account id request')
        .withMethod('GET')
        .withState('a product with gateway account id 42 and metadata exist')
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

    it('should find an existing product with metadata', () => {
      const plainResponse = response.map(item => item.getPlain())
      expect(result.length).toBe(1)
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
        expect(product.metadata).toBeDefined().and.to.have.property('key').toBe(plainResponse[index].metadata.key)
      })
    })
  })
})
