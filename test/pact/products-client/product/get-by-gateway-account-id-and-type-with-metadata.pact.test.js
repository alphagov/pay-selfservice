'use strict'

const { Pact } = require('@pact-foundation/pact')
const { expect } = require('chai')
const proxyquire = require('proxyquire')

const path = require('path')
const PactInteractionBuilder = require('../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const productFixtures = require('../../../fixtures/product.fixtures')
const { pactifySimpleArray } = require('../../../test-helpers/pact/pactifier').defaultPactifier

// Constants
const API_RESOURCE = '/v1/api'
let result, productsClient

function getProductsClient (baseUrl) {
  return proxyquire('../../../../app/services/clients/products.client', {
    '../../../config': {
      PRODUCTS_URL: baseUrl
    }
  })
}

describe('products client - find a product with metadata associated with a particular gateway account id and type', function () {
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

  describe('when the product is successfully found', () => {
    const gatewayAccountId = 42
    const productType = 'ADHOC'
    const response = [
      productFixtures.validProductResponse({ gateway_account_id: gatewayAccountId, price: 1000, type: productType, metadata: { key: 'value' } })
    ]
    before(done => {
      const interaction = new PactInteractionBuilder(`${API_RESOURCE}/gateway-account/${gatewayAccountId}/products`)
        .withQuery('type', productType)
        .withUponReceiving('a valid get product with metadata by gateway account id and type request')
        .withMethod('GET')
        .withState('a product with gateway account id 42 and type ADHOC and metadata exist')
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

    it('should find an existing product with metadata', () => {
      expect(result.length).to.equal(1)
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
        expect(product.metadata).to.exist.and.to.have.property('key').equal(response[index].metadata.key)
      })
    })
  })
})
