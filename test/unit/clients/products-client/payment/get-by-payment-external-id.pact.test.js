'use strict'

const { Pact } = require('@pact-foundation/pact')
const { expect } = require('chai')
const proxyquire = require('proxyquire')

const path = require('path')
const PactInteractionBuilder = require('../../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const productFixtures = require('../../../../fixtures/product.fixtures')
const { pactify } = require('../../../../test-helpers/pact/pactifier').defaultPactifier

// Constants
const PAYMENT_RESOURCE = '/v1/api/payments'
let result, productsClient

function getProductsClient (baseUrl) {
  return proxyquire('../../../../../app/services/clients/products.client', {
    '../../../config': {
      PRODUCTS_URL: baseUrl
    }
  })
}

describe('products client - find a payment by it\'s own external id', function () {
  let provider = new Pact({
    consumer: 'selfservice-to-be',
    provider: 'products',
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(async () => {
    const opts = await provider.setup()
    productsClient = getProductsClient(`http://localhost:${opts.port}`)
  })
  after(() => provider.finalize())

  describe('when a product is successfully found', () => {
    const paymentExternalId = 'existing-id'
    const response = productFixtures.validCreatePaymentResponse({ external_id: paymentExternalId })

    before(done => {
      const interaction = new PactInteractionBuilder(`${PAYMENT_RESOURCE}/${paymentExternalId}`)
        .withUponReceiving('a valid get payment request')
        .withMethod('GET')
        .withStatusCode(200)
        .withResponseBody(pactify(response))
        .build()
      provider.addInteraction(interaction)
        .then(() => productsClient.payment.getByPaymentExternalId(paymentExternalId))
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    after(() => provider.verify())

    it('should find an existing payment', () => {
      expect(result.productExternalId).to.equal(response.product_external_id)
      expect(result.externalId).to.equal(response.external_id).and.to.equal(paymentExternalId)
      expect(result.status).to.equal(response.status)
      expect(result.nextUrl).to.equal(response.next_url)
      expect(result).to.have.property('links')
      expect(Object.keys(result.links).length).to.equal(2)
      expect(result.links).to.have.property('self')
      expect(result.links.self).to.have.property('method').to.equal(response._links.find(link => link.rel === 'self').method)
      expect(result.links.self).to.have.property('href').to.equal(response._links.find(link => link.rel === 'self').href)
      expect(result.links).to.have.property('next')
      expect(result.links.next).to.have.property('method').to.equal(response._links.find(link => link.rel === 'next').method)
      expect(result.links.next).to.have.property('href').to.equal(response._links.find(link => link.rel === 'next').href)
    })
  })

  describe('when a product is not found', () => {
    before(done => {
      const paymentExternalId = 'non-existing-id'
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

    after(() => provider.verify())

    it('should reject with error: 404 not found', () => {
      expect(result.errorCode).to.equal(404)
    })
  })
})
