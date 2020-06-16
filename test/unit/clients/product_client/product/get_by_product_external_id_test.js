'use strict'

const { Pact } = require('@pact-foundation/pact')
const { expect } = require('chai')
const proxyquire = require('proxyquire')

const path = require('path')
const PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const productFixtures = require('../../../../fixtures/product_fixtures')

// Constants
const API_RESOURCE = '/v1/api'
const port = Math.floor(Math.random() * 48127) + 1024
let response, result, productExternalId, gatewayAccountId

function getProductsClient (baseUrl = `http://localhost:${port}`, productsApiKey = 'ABC1234567890DEF') {
  return proxyquire('../../../../../app/services/clients/products_client', {
    '../../../config': {
      PRODUCTS_URL: baseUrl
    }
  })
}

describe('products client - find a product by it\'s external id', function () {
  let provider = new Pact({
    consumer: 'selfservice',
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
      gatewayAccountId = 42
      productExternalId = 'existing-id'
      response = productFixtures.validProductResponse({
        external_id: productExternalId,
        gateway_account_id: 42,
        price: 1000,
        name: 'A Product Name',
        description: 'About this product',
        return_url: 'https://example.gov.uk',
        type: 'DEMO'
      })
      provider.addInteraction(
        new PactInteractionBuilder(`${API_RESOURCE}/gateway-account/${gatewayAccountId}/products/${productExternalId}`)
          .withUponReceiving('a valid get product request by external id')
          .withMethod('GET')
          .withState('a product with external id existing-id and gateway account id 42 exists')
          .withStatusCode(200)
          .withResponseBody(response.getPactified())
          .build()
      )
        .then(() => productsClient.product.getByProductExternalId(gatewayAccountId, productExternalId))
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    after(() => provider.verify())

    it('should find an existing product', () => {
      const plainResponse = response.getPlain()
      expect(result.externalId).to.equal(productExternalId)
      expect(result.name).to.exist.and.equal(plainResponse.name)
      expect(result.description).to.exist.and.equal(plainResponse.description)
      expect(result.price).to.exist.and.equal(plainResponse.price)
      expect(result.returnUrl).to.exist.and.equal(plainResponse.return_url)
      expect(result.type).to.equal('DEMO')
      expect(result.language).to.exist.and.equal(plainResponse.language)
      expect(result).to.have.property('links')
      expect(Object.keys(result.links).length).to.equal(2)
      expect(result.links).to.have.property('self')
      expect(result.links.self).to.have.property('method').to.equal(plainResponse._links.find(link => link.rel === 'self').method)
      expect(result.links.self).to.have.property('href').to.equal(plainResponse._links.find(link => link.rel === 'self').href)
      expect(result.links).to.have.property('pay')
      expect(result.links.pay).to.have.property('method').to.equal(plainResponse._links.find(link => link.rel === 'pay').method)
      expect(result.links.pay).to.have.property('href').to.equal(plainResponse._links.find(link => link.rel === 'pay').href)
    })
  })

  describe('when a product is not found', () => {
    before(done => {
      const productsClient = getProductsClient()
      gatewayAccountId = 999
      productExternalId = 'non-existing-id'
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
