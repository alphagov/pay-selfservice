'use strict'

// NPM dependencies
const { Pact } = require('@pact-foundation/pact')
const { expect } = require('chai')
const proxyquire = require('proxyquire')

// Custom dependencies
const Payment = require('../../../../../app/models/Payment.class')
const path = require('path')
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const productFixtures = require('../../../../fixtures/product.fixtures')

// Constants
const PRODUCT_RESOURCE = '/v1/api/products'
const port = Math.floor(Math.random() * 48127) + 1024
let response, result, productExternalId

function getProductsClient (baseUrl = `http://localhost:${port}`, productsApiKey = 'ABC1234567890DEF') {
  return proxyquire('../../../../../app/services/clients/products.client', {
    '../../../config': {
      PRODUCTS_URL: baseUrl
    }
  })
}

describe('products client - find a payment by it\'s associated product external id', function () {
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

  describe('when a product is successfully found', () => {
    before(done => {
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

    after(() => provider.verify())

    it('should return a list of payments', () => {
      expect(result.length).to.equal(3)
      expect(result.map(item => item.constructor)).to.deep.equal([Payment, Payment, Payment])
      result.forEach((payment, index) => {
        const plainResponse = response[index].getPlain()
        expect(payment.productExternalId).to.equal(plainResponse.product_external_id).and.to.equal(productExternalId)
        expect(payment.externalId).to.equal(plainResponse.external_id)
        expect(payment.status).to.equal(plainResponse.status)
        expect(payment.nextUrl).to.equal(plainResponse.next_url)
        expect(payment).to.have.property('links')
        expect(Object.keys(payment.links).length).to.equal(2)
        expect(payment.links).to.have.property('self')
        expect(payment.links.self).to.have.property('method').to.equal(plainResponse._links.find(link => link.rel === 'self').method)
        expect(payment.links.self).to.have.property('href').to.equal(plainResponse._links.find(link => link.rel === 'self').href)
        expect(payment.links).to.have.property('next')
        expect(payment.links.next).to.have.property('method').to.equal(plainResponse._links.find(link => link.rel === 'next').method)
        expect(payment.links.next).to.have.property('href').to.equal(plainResponse._links.find(link => link.rel === 'next').href)
      })
    })
  })

  describe('when a product is not found', () => {
    before(done => {
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

    after(() => provider.verify())

    it('should reject with error: 404 not found', () => {
      expect(result.errorCode).to.equal(404)
    })
  })
})
