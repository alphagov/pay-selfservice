'use strict'

const { Pact } = require('@pact-foundation/pact')
const { expect } = require('chai')
const proxyquire = require('proxyquire')

const path = require('path')
const PactInteractionBuilder = require('../../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const productFixtures = require('../../../../fixtures/product.fixtures')
const { pactifySimpleArray } = require('../../../../test-helpers/pact/pactifier').defaultPactifier

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

describe('products client - find products associated with a particular gateway account id and type', function () {
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

  describe('when products are successfully found', () => {
    const gatewayAccountId = 42
    const productType = 'ADHOC'
    const response = [
      productFixtures.validProductResponse({ gateway_account_id: gatewayAccountId, price: 1000, type: productType }),
      productFixtures.validProductResponse({ gateway_account_id: gatewayAccountId, price: 2000, type: productType }),
      productFixtures.validProductResponse({ gateway_account_id: gatewayAccountId, price: 3000, type: productType })
    ]

    before(done => {
      const interaction = new PactInteractionBuilder(`${API_RESOURCE}/gateway-account/${gatewayAccountId}/products`)
        .withQuery('type', productType)
        .withUponReceiving('a valid get product by gateway account id request')
        .withMethod('GET')
        .withState('three products with gateway account id 42 and type ADHOC exist')
        .withStatusCode(200)
        .withResponseBody(pactifySimpleArray(response))
        .build()
      provider.addInteraction(interaction)
        .then(() => productsClient.product.getByGatewayAccountIdAndType(gatewayAccountId, productType))
        .then(res => {
          result = res
          done()
        })
    })

    after(() => provider.verify())

    it('should find an existing product', () => {
      expect(result.length).to.equal(3)
      result.forEach((product, index) => {
        expect(product.gatewayAccountId).to.equal(gatewayAccountId)
        expect(product.externalId).to.exist.and.equal(response[index].external_id)
        expect(product.name).to.exist.and.equal(response[index].name)
        expect(product.price).to.exist.and.equal(response[index].price)
        expect(product.type).to.exist.and.equal(response[index].type)
        expect(product.language).to.exist.and.equal(response[index].language)
        expect(product).to.have.property('links')
        expect(Object.keys(product.links).length).to.equal(2)
        expect(product.links).to.have.property('self')
        expect(product.links.self).to.have.property('method').to.equal(response[index]._links.find(link => link.rel === 'self').method)
        expect(product.links.self).to.have.property('href').to.equal(response[index]._links.find(link => link.rel === 'self').href)
        expect(product.links).to.have.property('pay')
        expect(product.links.pay).to.have.property('method').to.equal(response[index]._links.find(link => link.rel === 'pay').method)
        expect(product.links.pay).to.have.property('href').to.equal(response[index]._links.find(link => link.rel === 'pay').href)
      })
    })
  })

  describe('when no products are found', () => {
    before(done => {
      const gatewayAccountId = 98765
      const productType = 'PROTOTYPE'
      const interaction = new PactInteractionBuilder(`${API_RESOURCE}/gateway-account/${gatewayAccountId}/products`)
        .withQuery('type', productType)
        .withUponReceiving('a valid get product by gateway account id where the gateway account has no products')
        .withMethod('GET')
        .withStatusCode(200)
        .withResponseBody([])
        .build()
      provider.addInteraction(interaction)
        .then(() => productsClient.product.getByGatewayAccountIdAndType(gatewayAccountId, productType), done)
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    after(() => provider.verify())

    it('should return an empty array', () => {
      expect(result).to.be.an('array').that.is.empty // eslint-disable-line
    })
  })
})
