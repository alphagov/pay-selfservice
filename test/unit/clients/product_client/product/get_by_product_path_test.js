'use strict'

// NPM dependencies
const Pact = require('pact')
const {expect} = require('chai')
const proxyquire = require('proxyquire')

// Custom dependencies
const pactProxy = require('../../../../test_helpers/pact_proxy')
const PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const productFixtures = require('../../../../fixtures/product_fixtures')

// Constants
const PRODUCT_RESOURCE = '/v1/api/products'
const mockPort = Math.floor(Math.random() * 65535)
const mockServer = pactProxy.create('localhost', mockPort)
let productsMock, response, result, productExternalId, serviceNamePath, productNamePath

function getProductsClient (baseUrl = `http://localhost:${mockPort}`) {
  return proxyquire('../../../../../app/services/clients/products_client', {
    '../../../config': {
      PRODUCTS_URL: baseUrl
    }
  })
}

describe('products client - find a product by it\'s product path', function () {
  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000)
    mockServer.start().then(function () {
      productsMock = Pact({consumer: 'Selfservice-find-product', provider: 'products', port: mockPort})
      done()
    })
  })

  /**
   * Remove the server and publish pacts to broker
   */
  after(done => {
    mockServer.delete()
      .then(() => pactProxy.removeAll())
      .then(() => done())
  })

  describe('when a product is successfully found', () => {
    before(done => {
      const productsClient = getProductsClient()
      productExternalId = 'existing-id'
      serviceNamePath = 'service-name-path'
      productNamePath = 'product-name-path'
      response = productFixtures.validCreateProductResponse({
        external_id: productExternalId,
        price: 1000,
        name: 'A Product Name',
        description: 'About this product',
        return_url: 'https://example.gov.uk',
        service_name_path: serviceNamePath,
        product_name_path: productNamePath
      })
      productsMock.addInteraction(
        new PactInteractionBuilder(`${PRODUCT_RESOURCE}`)
          .withQuery('serviceNamePath', serviceNamePath)
          .withQuery('productNamePath', productNamePath)
          .withUponReceiving('a valid get product request')
          .withMethod('GET')
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

    after((done) => {
      productsMock.finalize().then(() => done())
    })

    it('should find an existing product', () => {
      const plainResponse = response.getPlain()
      expect(result.externalId).to.equal(productExternalId)
      expect(result.name).to.exist.and.equal(plainResponse.name)
      expect(result.description).to.exist.and.equal(plainResponse.description)
      expect(result.price).to.exist.and.equal(plainResponse.price)
      expect(result.returnUrl).to.exist.and.equal(plainResponse.return_url)
      expect(result).to.have.property('links')
      expect(Object.keys(result.links).length).to.equal(3)
      expect(result.links).to.have.property('self')
      expect(result.links.self).to.have.property('method').to.equal(plainResponse._links.find(link => link.rel === 'self').method)
      expect(result.links.self).to.have.property('href').to.equal(plainResponse._links.find(link => link.rel === 'self').href)
      expect(result.links).to.have.property('pay')
      expect(result.links.pay).to.have.property('method').to.equal(plainResponse._links.find(link => link.rel === 'pay').method)
      expect(result.links.pay).to.have.property('href').to.equal(plainResponse._links.find(link => link.rel === 'pay').href)
      expect(result.links).to.have.property('friendly')
      expect(result.links.friendly).to.have.property('method').to.equal(plainResponse._links.find(link => link.rel === 'friendly').method)
      expect(result.links.friendly).to.have.property('href').to.equal(plainResponse._links.find(link => link.rel === 'friendly').href)
    })
  })

  describe('when a product is not found', () => {
    before(done => {
      const productsClient = getProductsClient()
      serviceNamePath = 'non-existing-service-name-path'
      productNamePath = 'non-existing-product-name-path'
      productsMock.addInteraction(
        new PactInteractionBuilder(`${PRODUCT_RESOURCE}`)
          .withQuery('serviceNamePath', serviceNamePath)
          .withQuery('productNamePath', productNamePath)
          .withUponReceiving('a valid find product request with non existing product path')
          .withMethod('GET')
          .withStatusCode(404)
          .build()
      )
        .then(() => productsClient.product.getByProductPath(serviceNamePath, productNamePath), done)
        .then(() => done(new Error('Promise unexpectedly resolved')))
        .catch((err) => {
          result = err
          done()
        })
    })

    after((done) => {
      productsMock.finalize().then(() => done())
    })

    it('should reject with error: 404 not found', () => {
      expect(result.errorCode).to.equal(404)
    })
  })
})
