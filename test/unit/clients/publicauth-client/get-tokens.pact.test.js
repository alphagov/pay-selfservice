'use strict'

const { Pact } = require('@pact-foundation/pact')
const path = require('path')

// constants
const port = Math.floor(Math.random() * 48127) + 1024
const TOKENS_PATH = '/v1/frontend/auth'
process.env.PUBLIC_AUTH_URL = `http://localhost:${port}${TOKENS_PATH}`

const gatewayAccountFixtures = require('../../../fixtures/gateway-account.fixtures')
const publicauthClient = require('../../../../app/services/clients/public-auth.client')
const PactInteractionBuilder = require('../../../fixtures/pact-interaction-builder').PactInteractionBuilder

describe('publicauth client - get tokens', () => {
  let provider = new Pact({
    consumer: 'selfservice-to-be',
    provider: 'publicauth',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  beforeAll(() => provider.setup())
  afterAll(() => provider.finalize())

  describe('success', () => {
    const params = {
      accountId: 42
    }

    const getServiceAuthResponse = gatewayAccountFixtures.validGatewayAccountTokensResponse(params)

    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${TOKENS_PATH}/${params.accountId}`)
          .withState(`Gateway account ${params.accountId} exists in the database`)
          .withUponReceiving('a valid service auth request')
          .withResponseBody(getServiceAuthResponse.getPactified())
          .build()
      ).then(() => { done() })
    })

    afterEach(() => provider.verify())

    it('should return service tokens information successfully', done => {
      const expectedTokensData = getServiceAuthResponse.getPlain()

      publicauthClient.getActiveTokensForAccount(params).then(function (tokens) {
        expect(tokens).toEqual(expectedTokensData)
        done()
      })
    })
  })
})
