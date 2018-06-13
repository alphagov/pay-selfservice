'use strict'

// NPM dependencies
const Pact = require('pact')
const {expect} = require('chai')
const proxyquire = require('proxyquire')

// Custom dependencies
const path = require('path')
const {invalidUpdateServiceNameOfProductsByGatewayAccountIdRequest, validUpdateServiceNameOfProductsByGatewayAccountIdRequest} = require('../../../../fixtures/product_fixtures')
const PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder

// Constants
const GATEWAY_ACCOUNT_RESOURCE = '/v1/api/gateway-account'
const port = Math.floor(Math.random() * 48127) + 1024

function getProductsClient (baseUrl = `http://localhost:${port}`, productsApiKey = 'ABC1234567890DEF') {
  return proxyquire('../../../../../app/services/clients/products_client', {
    '../../../config': {
      PRODUCTS_URL: baseUrl
    }
  })
}

describe('products client - update product service name by gateway account id', () => {
  let provider = Pact({
    consumer: 'selfservice-to-be',
    provider: 'products',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after((done) => provider.finalize().then(done()))

  describe('when the request is successful', () => {
    let result, gatewayAccountId, newServiceName
    before(done => {
      const productsClient = getProductsClient()
      gatewayAccountId = '541'
      newServiceName = 'Buy a Fish'
      provider.addInteraction(
        new PactInteractionBuilder(`${GATEWAY_ACCOUNT_RESOURCE}/${gatewayAccountId}`)
          .withUponReceiving('a valid update product service_name request')
          .withRequestBody(validUpdateServiceNameOfProductsByGatewayAccountIdRequest(newServiceName).getPactified())
          .withMethod('PATCH')
          .withStatusCode(200)
          .build()
      )
        .then(() => productsClient.product.updateServiceNameOfProductsByGatewayAccountId(gatewayAccountId, newServiceName))
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    afterEach(() => provider.verify())

    it(`should update the service name of any products associated with the service name`, () => {
      expect(result).to.equal(undefined)
    })
  })

  describe('when the request is malformed', () => {
    let result, gatewayAccountId
    before(done => {
      const productsClient = getProductsClient()
      gatewayAccountId = '541'
      provider.addInteraction(new PactInteractionBuilder(`${GATEWAY_ACCOUNT_RESOURCE}/${gatewayAccountId}`)
        .withUponReceiving('a invalid update product service_name request')
        .withRequestBody(invalidUpdateServiceNameOfProductsByGatewayAccountIdRequest().getPactified())
        .withMethod('PATCH')
        .withStatusCode(400)
        .build())
        .then(() => productsClient.product.updateServiceNameOfProductsByGatewayAccountId(gatewayAccountId))
        .then(() => done(new Error('Promise unexpectedly resolved')))
        .catch((err) => {
          result = err
          done()
        })
    })

    afterEach(() => provider.verify())

    it('should reject with error: bad request', () => {
      expect(result.errorCode).to.equal(400)
    })
  })
})
