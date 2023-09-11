'use strict'

const { Pact } = require('@pact-foundation/pact')
const { expect } = require('chai')
const proxyquire = require('proxyquire')

const path = require('path')
const PactInteractionBuilder = require('../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const productFixtures = require('../../../fixtures/product.fixtures')
const { pactify } = require('../../../test-helpers/pact/pactifier').defaultPactifier

// Constants
const PRODUCTS_RESOURCE = '/v1/api/products'
let result, productsClient

function getProductsClient (baseUrl) {
  return proxyquire('../../../../app/services/clients/products.client', {
    '../../../config': {
      PRODUCTS_URL: baseUrl
    }
  })
}

describe('products client - creating a new payment', () => {
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
    productsClient = getProductsClient(`http://127.0.0.1:${opts.port}`)
  })
  after(() => provider.finalize())

  describe('when a charge is successfully created', () => {
    const productExternalId = 'a-valid-product-id'
    const response = productFixtures.validCreatePaymentResponse({ product_external_id: productExternalId })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${PRODUCTS_RESOURCE}/${productExternalId}/payments`)
          .withUponReceiving('a valid create charge create request')
          .withMethod('POST')
          .withStatusCode(201)
          .withResponseBody(pactify(response))
          .build()
      )
        .then(() => productsClient.payment.create(productExternalId))
        .then(res => {
          result = res
          done()
        })
    })

    after(() => provider.verify())

    it('should create a new product', () => {
      expect(result.productExternalId).to.equal(response.product_external_id).and.to.equal(productExternalId)
      expect(result.externalId).to.equal(response.external_id)
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

  describe('when creating a charge using a malformed request', () => {
    beforeEach(done => {
      const productExternalId = 'invalid-id'
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

    after(() => provider.verify())

    it('should reject with error: bad request', () => {
      expect(result.errorCode).to.equal(400)
    })
  })
})
