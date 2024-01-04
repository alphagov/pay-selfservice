'use strict'

const { Pact } = require('@pact-foundation/pact')
const path = require('path')
const chai = require('chai')
const { expect } = chai
const chaiAsPromised = require('chai-as-promised')
const proxyquire = require('proxyquire')

// constants
const TOKENS_PATH = '/v1/frontend/auth'

const gatewayAccountFixtures = require('../../fixtures/gateway-account.fixtures')
const PactInteractionBuilder = require('../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const { pactify } = require('../../test-helpers/pact/pactifier').defaultPactifier

chai.use(chaiAsPromised)

let publicAuthClient

function getPublicAuthClient (baseUrl) {
  return proxyquire('../../../app/services/clients/public-auth.client', {
    '../../../config': {
      PUBLIC_AUTH_URL: baseUrl
    }
  })
}

describe('publicauth client - get tokens', function () {
  let provider = new Pact({
    consumer: 'selfservice-to-be',
    provider: 'publicauth',
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(async () => {
    const opts = await provider.setup()
    publicAuthClient = getPublicAuthClient(`http://127.0.0.1:${opts.port}/${TOKENS_PATH}`)
  })
  after(() => provider.finalize())

  describe('success', () => {
    const params = {
      accountId: 42
    }

    const getServiceAuthResponse = gatewayAccountFixtures.validGatewayAccountTokensResponse(params)

    before(() => {
      return provider.addInteraction(
        new PactInteractionBuilder(`/${TOKENS_PATH}/${params.accountId}`)
          .withUponReceiving('a valid service auth request')
          .withState(`Gateway account ${params.accountId} exists in the database`)
          .withResponseBody(pactify(getServiceAuthResponse))
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('should return service tokens information successfully', function (done) {
      publicAuthClient.getActiveTokensForAccount(params).then(function (tokens) {
        expect(tokens).to.deep.equal(getServiceAuthResponse)
        done()
      })
    })
  })
})
