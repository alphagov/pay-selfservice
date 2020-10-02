'use strict'

const { Pact } = require('@pact-foundation/pact')

const path = require('path')
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const productFixtures = require('../../../../fixtures/product.fixtures')

// Constants
const PRODUCTS_RESOURCE = '/v1/api/products'
const port = Math.floor(Math.random() * 48127) + 1024
let result, response, productExternalId

jest.mock('../../../config', () => ({
  PRODUCTS_URL: baseUrl
}));

function getProductsClient (baseUrl = `http://localhost:${port}`, productsApiKey = 'ABC1234567890DEF') {
  return require('../../../../../app/services/clients/products.client');
}

describe('products client - creating a new payment', () => {
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

  describe('when a charge is successfully created', () => {
    beforeAll((done) => {
      const productsClient = getProductsClient()
      productExternalId = 'a-valid-product-id'
      response = productFixtures.validCreatePaymentResponse({ product_external_id: productExternalId })
      provider.addInteraction(
        new PactInteractionBuilder(`${PRODUCTS_RESOURCE}/${productExternalId}/payments`)
          .withUponReceiving('a valid create charge create request')
          .withMethod('POST')
          .withStatusCode(201)
          .withResponseBody(response.getPactified())
          .build()
      )
        .then(() => productsClient.payment.create(productExternalId))
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    afterAll(() => provider.verify())

    it('should create a new product', () => {
      const plainResponse = response.getPlain()
      expect(result.productExternalId).toBe(plainResponse.product_external_id).and.toBe(productExternalId)
      expect(result.externalId).toBe(plainResponse.external_id)
      expect(result.status).toBe(plainResponse.status)
      expect(result.nextUrl).toBe(plainResponse.next_url)
      expect(result).toHaveProperty('links')
      expect(Object.keys(result.links).length).toBe(2)
      expect(result.links).toHaveProperty('self')
      expect(result.links.self).to.have.property('method').toBe(plainResponse._links.find(link => link.rel === 'self').method)
      expect(result.links.self).to.have.property('href').toBe(plainResponse._links.find(link => link.rel === 'self').href)
      expect(result.links).toHaveProperty('next')
      expect(result.links.next).to.have.property('method').toBe(plainResponse._links.find(link => link.rel === 'next').method)
      expect(result.links.next).to.have.property('href').toBe(plainResponse._links.find(link => link.rel === 'next').href)
    })
  })

  describe('when creating a charge using a malformed request', () => {
    beforeEach(done => {
      const productsClient = getProductsClient()
      productExternalId = 'invalid-id'
      provider.addInteraction(
        new PactInteractionBuilder(`${PRODUCTS_RESOURCE}/${productExternalId}/payments`)
          .withUponReceiving('an invalid create charge request')
          .withMethod('POST')
          .withStatusCode(400)
          .build()
      )
        .then(() => productsClient.payment.create(productExternalId), done)
        .then(() => done(new Error('Promise unexpectedly resolved')))
        .catch((err) => {
          result = err
          done()
        })
    })

    afterAll(() => provider.verify())

    it('should reject with error: bad request', () => {
      expect(result.errorCode).toBe(400)
    })
  })
})
