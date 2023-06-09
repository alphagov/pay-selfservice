'use strict'

const { Pact } = require('@pact-foundation/pact')
const { expect } = require('chai')
const proxyquire = require('proxyquire')

const path = require('path')
const PactInteractionBuilder = require('../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder

// Constants
const API_RESOURCE = '/v1/api'
let result, productExternalId, gatewayAccountId, productsClient

function getProductsClient (baseUrl) {
  return proxyquire('../../../../app/services/clients/products.client', {
    '../../../config': {
      PRODUCTS_URL: baseUrl
    }
  })
}

describe('products client - delete a product', () => {
  const provider = new Pact({
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

  describe('when a product is successfully deleted', () => {
    before(done => {
      gatewayAccountId = '999'
      productExternalId = 'a_valid_external_id'
      provider.addInteraction(
        new PactInteractionBuilder(`${API_RESOURCE}/gateway-account/${gatewayAccountId}/products/${productExternalId}`)
          .withUponReceiving('a valid delete product request')
          .withMethod('DELETE')
          .withStatusCode(204)
          .build()
      )
        .then(() => productsClient.product.delete(gatewayAccountId, productExternalId))
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    afterEach(() => provider.verify())

    it('should delete the product', () => {
      expect(result).to.equal(undefined)
    })
  })

  describe('delete a product - bad request', () => {
    before(done => {
      productExternalId = 'a_non_existant_external_id'
      provider.addInteraction(
        new PactInteractionBuilder(`${API_RESOURCE}/gateway-account/${gatewayAccountId}/products/${productExternalId}`)
          .withUponReceiving('an invalid delete product request')
          .withMethod('DELETE')
          .withStatusCode(404)
          .build()
      )
        .then(() => productsClient.product.delete(gatewayAccountId, productExternalId), done)
        .then(() => done(new Error('Promise unexpectedly resolved')))
        .catch((err) => {
          result = err
          done()
        })
    })

    afterEach(() => provider.verify())

    it('should reject with error: bad request', () => {
      expect(result.errorCode).to.equal(404)
    })
  })
})
