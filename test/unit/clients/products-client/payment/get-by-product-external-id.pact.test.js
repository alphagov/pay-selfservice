'use strict'

const { Pact } = require('@pact-foundation/pact')

const Payment = require('../../../../../app/models/Payment.class')
const path = require('path')
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const productFixtures = require('../../../../fixtures/product.fixtures')

// Constants
const PRODUCT_RESOURCE = '/v1/api/products'
const port = Math.floor(Math.random() * 48127) + 1024
let response, result, productExternalId

jest.mock('../../../config', () => ({
  PRODUCTS_URL: baseUrl
}));

function getProductsClient (baseUrl = `http://localhost:${port}`, productsApiKey = 'ABC1234567890DEF') {
  return require('../../../../../app/services/clients/products.client');
}

describe('products client - find a payment by it\'s associated product external id', () => {
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
      productExternalId = 'existing-id'
      response = [
        productFixtures.validCreatePaymentResponse({ product_external_id: productExternalId }),
        productFixtures.validCreatePaymentResponse({ product_external_id: productExternalId }),
        productFixtures.validCreatePaymentResponse({ product_external_id: productExternalId })
      ]
      const interaction = new PactInteractionBuilder(`${PRODUCT_RESOURCE}/${productExternalId}/payments`)
        .withUponReceiving('a valid get payment by product request')
        .withMethod('GET')
        .withStatusCode(200)
        .withResponseBody(response.map(item => item.getPactified()))
        .build()
      provider.addInteraction(interaction)
        .then(() => productsClient.payment.getByProductExternalId(productExternalId))
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    afterAll(() => provider.verify())

    it('should return a list of payments', () => {
      expect(result.length).toBe(3)
      expect(result.map(item => item.constructor)).toEqual([Payment, Payment, Payment])
      result.forEach((payment, index) => {
        const plainResponse = response[index].getPlain()
        expect(payment.productExternalId).toBe(plainResponse.product_external_id).and.toBe(productExternalId)
        expect(payment.externalId).toBe(plainResponse.external_id)
        expect(payment.status).toBe(plainResponse.status)
        expect(payment.nextUrl).toBe(plainResponse.next_url)
        expect(payment).toHaveProperty('links')
        expect(Object.keys(payment.links).length).toBe(2)
        expect(payment.links).toHaveProperty('self')
        expect(payment.links.self).to.have.property('method').toBe(plainResponse._links.find(link => link.rel === 'self').method)
        expect(payment.links.self).to.have.property('href').toBe(plainResponse._links.find(link => link.rel === 'self').href)
        expect(payment.links).toHaveProperty('next')
        expect(payment.links.next).to.have.property('method').toBe(plainResponse._links.find(link => link.rel === 'next').method)
        expect(payment.links.next).to.have.property('href').toBe(plainResponse._links.find(link => link.rel === 'next').href)
      })
    })
  })

  describe('when a product is not found', () => {
    beforeAll(done => {
      const productsClient = getProductsClient()
      productExternalId = 'non-existing-id'
      provider.addInteraction(
        new PactInteractionBuilder(`${PRODUCT_RESOURCE}/${productExternalId}/payments`)
          .withUponReceiving('a valid find product payments request with non existing id')
          .withMethod('GET')
          .withStatusCode(404)
          .build()
      )
        .then(() => productsClient.payment.getByProductExternalId(productExternalId), done)
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
