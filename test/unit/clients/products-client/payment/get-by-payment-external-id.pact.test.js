'use strict'

const { Pact } = require('@pact-foundation/pact')

const path = require('path')
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const productFixtures = require('../../../../fixtures/product.fixtures')

// Constants
const PAYMENT_RESOURCE = '/v1/api/payments'
const port = Math.floor(Math.random() * 48127) + 1024
let response, result, paymentExternalId

jest.mock('../../../config', () => ({
  PRODUCTS_URL: baseUrl
}));

function getProductsClient (baseUrl = `http://localhost:${port}`, productsApiKey = 'ABC1234567890DEF') {
  return require('../../../../../app/services/clients/products.client');
}

describe('products client - find a payment by it\'s own external id', () => {
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

  describe('when a product is successfully found', () => {
    beforeAll(done => {
      const productsClient = getProductsClient()
      paymentExternalId = 'existing-id'
      response = productFixtures.validCreatePaymentResponse({ external_id: paymentExternalId })
      const interaction = new PactInteractionBuilder(`${PAYMENT_RESOURCE}/${paymentExternalId}`)
        .withUponReceiving('a valid get payment request')
        .withMethod('GET')
        .withStatusCode(200)
        .withResponseBody(response.getPactified())
        .build()
      provider.addInteraction(interaction)
        .then(() => productsClient.payment.getByPaymentExternalId(paymentExternalId))
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    afterAll(() => provider.verify())

    it('should find an existing payment', () => {
      const plainResponse = response.getPlain()
      expect(result.productExternalId).toBe(plainResponse.product_external_id)
      expect(result.externalId).toBe(plainResponse.external_id).and.toBe(paymentExternalId)
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

  describe('when a product is not found', () => {
    beforeAll(done => {
      const productsClient = getProductsClient()
      paymentExternalId = 'non-existing-id'
      provider.addInteraction(
        new PactInteractionBuilder(`${PAYMENT_RESOURCE}/${paymentExternalId}`)
          .withUponReceiving('a valid find payment request with non existing id')
          .withMethod('GET')
          .withStatusCode(404)
          .build()
      )
        .then(() => productsClient.payment.getByPaymentExternalId(paymentExternalId), done)
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
