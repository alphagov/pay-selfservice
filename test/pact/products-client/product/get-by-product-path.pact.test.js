'use strict'

const { Pact } = require('@pact-foundation/pact')
const { expect } = require('chai')
const proxyquire = require('proxyquire')

const path = require('path')
const PactInteractionBuilder = require('../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const productFixtures = require('../../../fixtures/product.fixtures')
const { pactify } = require('../../../test-helpers/pact/pactifier').defaultPactifier

// Constants
const PRODUCT_RESOURCE = '/v1/api/products'
let result, productsClient

function getProductsClient (baseUrl) {
  return proxyquire('../../../../app/services/clients/products.client', {
    '../../../config': {
      PRODUCTS_URL: baseUrl
    }
  })
}

describe('products client - find a product by it\'s product path', function () {
  let provider = new Pact({
    consumer: 'selfservice',
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

  describe('when a product is successfully found', () => {
    const productExternalId = 'existing-id'
    const serviceNamePath = 'service-name-path'
    const productNamePath = 'product-name-path'
    const response = productFixtures.validProductResponse({
      external_id: productExternalId,
      price: 1000,
      name: 'A Product Name',
      description: 'About this product',
      return_url: 'https://example.gov.uk',
      service_name_path: serviceNamePath,
      product_name_path: productNamePath
    })

    before(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${PRODUCT_RESOURCE}`)
          .withQuery('serviceNamePath', serviceNamePath)
          .withQuery('productNamePath', productNamePath)
          .withUponReceiving('a valid get product request by product path')
          .withMethod('GET')
          .withState('a product with path service-name-path/product-name-path exists')
          .withStatusCode(200)
          .withResponseBody(pactify(response))
          .build()
      )
        .then(() => productsClient.product.getByProductPath(serviceNamePath, productNamePath))
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
      expect(result.language).to.exist.and.equal(response.language)
      expect(result).to.have.property('links')
      expect(Object.keys(result.links).length).to.equal(3)
      expect(result.links).to.have.property('self')
      expect(result.links.self).to.have.property('method').to.equal(response._links.find(link => link.rel === 'self').method)
      expect(result.links.self).to.have.property('href').to.equal(response._links.find(link => link.rel === 'self').href)
      expect(result.links).to.have.property('pay')
      expect(result.links.pay).to.have.property('method').to.equal(response._links.find(link => link.rel === 'pay').method)
      expect(result.links.pay).to.have.property('href').to.equal(response._links.find(link => link.rel === 'pay').href)
      expect(result.links).to.have.property('friendly')
      expect(result.links.friendly).to.have.property('method').to.equal(response._links.find(link => link.rel === 'friendly').method)
      expect(result.links.friendly).to.have.property('href').to.equal(response._links.find(link => link.rel === 'friendly').href)
    })
  })

  describe('when a product is not found', () => {
    before(done => {
      const serviceNamePath = 'non-existing-service-name-path'
      const productNamePath = 'non-existing-product-name-path'
      provider.addInteraction(
        new PactInteractionBuilder(`${PRODUCT_RESOURCE}`)
          .withQuery('serviceNamePath', serviceNamePath)
          .withQuery('productNamePath', productNamePath)
          .withUponReceiving('a valid find product request with non existing product path')
          .withMethod('GET')
          .withStatusCode(404)
          .withResponseHeaders({})
          .build()
      )
        .then(() => productsClient.product.getByProductPath(serviceNamePath, productNamePath), done)
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
