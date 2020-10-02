'use strict'

const { Pact } = require('@pact-foundation/pact')

const path = require('path')
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const productFixtures = require('../../../../fixtures/product.fixtures')

// Constants
const PRODUCT_RESOURCE = '/v1/api/products'
const port = Math.floor(Math.random() * 48127) + 1024
let response, result, productExternalId, serviceNamePath, productNamePath

jest.mock('../../../config', () => ({
  PRODUCTS_URL: baseUrl
}));

function getProductsClient (baseUrl = `http://localhost:${port}`) {
  return require('../../../../../app/services/clients/products.client');
}

describe('products client - find a product by it\'s product path', () => {
  let provider = new Pact({
    consumer: 'selfservice',
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
      serviceNamePath = 'service-name-path'
      productNamePath = 'product-name-path'
      response = productFixtures.validProductResponse({
        external_id: productExternalId,
        price: 1000,
        name: 'A Product Name',
        description: 'About this product',
        return_url: 'https://example.gov.uk',
        service_name_path: serviceNamePath,
        product_name_path: productNamePath
      })
      provider.addInteraction(
        new PactInteractionBuilder(`${PRODUCT_RESOURCE}`)
          .withQuery('serviceNamePath', serviceNamePath)
          .withQuery('productNamePath', productNamePath)
          .withUponReceiving('a valid get product request by product path')
          .withMethod('GET')
          .withState('a product with path service-name-path/product-name-path exists')
          .withStatusCode(200)
          .withResponseBody(response.getPactified())
          .build()
      )
        .then(() => productsClient.product.getByProductPath(serviceNamePath, productNamePath))
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    afterAll(() => provider.verify())

    it('should find an existing product', () => {
      const plainResponse = response.getPlain()
      expect(result.externalId).toBe(productExternalId)
      expect(result.name).toBe(plainResponse.name)
      expect(result.description).toBe(plainResponse.description)
      expect(result.price).toBe(plainResponse.price)
      expect(result.returnUrl).toBe(plainResponse.return_url)
      expect(result.language).toBe(plainResponse.language)
      expect(result).toHaveProperty('links')
      expect(Object.keys(result.links).length).toBe(3)
      expect(result.links).toHaveProperty('self')
      expect(result.links.self).to.have.property('method').toBe(plainResponse._links.find(link => link.rel === 'self').method)
      expect(result.links.self).to.have.property('href').toBe(plainResponse._links.find(link => link.rel === 'self').href)
      expect(result.links).toHaveProperty('pay')
      expect(result.links.pay).to.have.property('method').toBe(plainResponse._links.find(link => link.rel === 'pay').method)
      expect(result.links.pay).to.have.property('href').toBe(plainResponse._links.find(link => link.rel === 'pay').href)
      expect(result.links).toHaveProperty('friendly')
      expect(result.links.friendly).to.have.property('method').toBe(plainResponse._links.find(link => link.rel === 'friendly').method)
      expect(result.links.friendly).to.have.property('href').toBe(plainResponse._links.find(link => link.rel === 'friendly').href)
    })
  })

  describe('when a product is not found', () => {
    beforeAll(done => {
      const productsClient = getProductsClient()
      serviceNamePath = 'non-existing-service-name-path'
      productNamePath = 'non-existing-product-name-path'
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

    afterAll(() => provider.verify())

    it('should reject with error: 404 not found', () => {
      expect(result.errorCode).toBe(404)
    })
  })
})
