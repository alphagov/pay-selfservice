'use strict'

const { Pact } = require('@pact-foundation/pact')
const { expect } = require('chai')
const proxyquire = require('proxyquire')

const path = require('path')
const PactInteractionBuilder = require('../../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const productFixtures = require('../../../../fixtures/product.fixtures')
const { pactify } = require('../../../../test-helpers/pact/pactifier').defaultPactifier

// Constants
const API_RESOURCE = '/v1/api'
let result, productsClient

function getProductsClient (baseUrl) {
  return proxyquire('../../../../../app/services/clients/products.client', {
    '../../../config': {
      PRODUCTS_URL: baseUrl
    }
  })
}

describe('products client - find a product by it\'s external id', function () {
  const provider = new Pact({
    consumer: 'selfservice',
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
    const gatewayAccountId = 42
    const productExternalId = 'existing-id'
    const response = productFixtures.validProductResponse({
      external_id: productExternalId,
      gateway_account_id: 42,
      price: 1000,
      name: 'A Product Name',
      description: 'About this product',
      return_url: 'https://example.gov.uk',
      type: 'DEMO'
    })

    before(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${API_RESOURCE}/gateway-account/${gatewayAccountId}/products/${productExternalId}`)
          .withUponReceiving('a valid get product request by external id')
          .withMethod('GET')
          .withState('a product with external id existing-id and gateway account id 42 exists')
          .withStatusCode(200)
          .withResponseBody(pactify(response))
          .build()
      )
        .then(() => productsClient.product.getByProductExternalId(gatewayAccountId, productExternalId))
        .then(res => {
          result = res
          done()
        })
    })

    after(() => provider.verify())

    it('should find an existing product', () => {
      expect(result.externalId).to.equal(productExternalId)
      expect(result.name).to.exist.and.equal(response.name)
      expect(result.description).to.exist.and.equal(response.description)
      expect(result.price).to.exist.and.equal(response.price)
      expect(result.returnUrl).to.exist.and.equal(response.return_url)
      expect(result.type).to.equal('DEMO')
      expect(result.language).to.exist.and.equal(response.language)
      expect(result).to.have.property('links')
      expect(Object.keys(result.links).length).to.equal(2)
      expect(result.links).to.have.property('self')
      expect(result.links.self).to.have.property('method').to.equal(response._links.find(link => link.rel === 'self').method)
      expect(result.links.self).to.have.property('href').to.equal(response._links.find(link => link.rel === 'self').href)
      expect(result.links).to.have.property('pay')
      expect(result.links.pay).to.have.property('method').to.equal(response._links.find(link => link.rel === 'pay').method)
      expect(result.links.pay).to.have.property('href').to.equal(response._links.find(link => link.rel === 'pay').href)
    })
  })

  describe('when a product is not found', () => {
    before(done => {
      const gatewayAccountId = 999
      const productExternalId = 'non-existing-id'
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

    after(() => provider.verify())

    it('should reject with error: 404 not found', () => {
      expect(result.errorCode).to.equal(404)
    })
  })
})
