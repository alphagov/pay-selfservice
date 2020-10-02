'use strict'

const { Pact } = require('@pact-foundation/pact')

const path = require('path')
const PactInteractionBuilder = require('../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../../app/services/clients/connector.client').ConnectorClient
const gatewayAccountFixtures = require('../../../fixtures/gateway-account.fixtures')

// Constants
const ACCOUNTS_RESOURCE = '/v1/api/accounts'
const port = Math.floor(Math.random() * 48127) + 1024
const connectorClient = new Connector(`http://localhost:${port}`)

// Global setup

const existingGatewayAccountId = 42
const defaultState = `Gateway account ${existingGatewayAccountId} exists in the database`

describe('connector client - patch email confirmation toggle', () => {
  let provider = new Pact({
    consumer: 'selfservice-to-be',
    provider: 'connector',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  beforeAll(() => provider.setup())
  afterAll(() => provider.finalize())

  describe('patch email confirmation toggle - enabled', () => {
    const validGatewayAccountEmailConfirmationToggleRequest = gatewayAccountFixtures.validGatewayAccountEmailConfirmationToggleRequest(true)

    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}/email-notification`)
          .withUponReceiving('a valid patch email confirmation toggle (enabled) request')
          .withState(defaultState)
          .withMethod('PATCH')
          .withRequestBody(validGatewayAccountEmailConfirmationToggleRequest.getPactified())
          .withStatusCode(200)
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should toggle successfully', done => {
      const params = {
        gatewayAccountId: existingGatewayAccountId,
        payload: validGatewayAccountEmailConfirmationToggleRequest.getPlain()
      }
      connectorClient.updateConfirmationEmailEnabled(params, (connectorData, connectorResponse) => {
        expect(connectorResponse.statusCode).toBe(200)
        done()
      })
    })
  })
})
