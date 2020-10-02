'use strict'

const { Pact } = require('@pact-foundation/pact')

const path = require('path')
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder

// Constants
const API_RESOURCE = '/v1/api'
const port = Math.floor(Math.random() * 48127) + 1024
let result, productExternalId, gatewayAccountId

jest.mock('../../../config', () => ({
  PRODUCTS_URL: baseUrl
}));

function getProductsClient (baseUrl = `http://localhost:${port}`, productsApiKey = 'ABC1234567890DEF') {
  return require('../../../../../app/services/clients/products.client');
}

describe('products client - disable a product', () => {
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

  describe('when a product is successfully disabled', () => {
    beforeAll(done => {
      const productsClient = getProductsClient()
      gatewayAccountId = '999'
      productExternalId = 'a_valid_external_id'
      provider.addInteraction(
        new PactInteractionBuilder(`${API_RESOURCE}/gateway-account/${gatewayAccountId}/products/${productExternalId}/disable`)
          .withUponReceiving('a valid disable product request')
          .withMethod('PATCH')
          .withStatusCode(204)
          .build()
      )
        .then(() => productsClient.product.disable(gatewayAccountId, productExternalId))
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    afterEach(() => provider.verify())

    it('should disable the product', () => {
      expect(result).toBeUndefined()
    })
  })

  describe('create a product - bad request', () => {
    beforeAll(done => {
      const productsClient = getProductsClient()
      productExternalId = 'a_non_existant_external_id'
      provider.addInteraction(
        new PactInteractionBuilder(`${API_RESOURCE}/gateway-account/${gatewayAccountId}/products/${productExternalId}/disable`)
          .withUponReceiving('an invalid disable product request')
          .withMethod('PATCH')
          .withStatusCode(400)
          .build()
      )
        .then(() => productsClient.product.disable(gatewayAccountId, productExternalId), done)
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
