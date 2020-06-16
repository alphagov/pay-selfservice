'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const path = require('path')
const PactInteractionBuilder = require('../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const Connector = require('../../../../app/services/clients/connector_client').ConnectorClient
const gatewayAccountFixtures = require('../../../fixtures/gateway_account_fixtures')

// Constants
const ACCOUNTS_RESOURCE = '/v1/api/accounts'
const port = Math.floor(Math.random() * 48127) + 1024
const connectorClient = new Connector(`http://localhost:${port}`)
const expect = chai.expect

chai.use(chaiAsPromised)

const existingGatewayAccountId = 42
const defaultState = `Gateway account ${existingGatewayAccountId} exists in the database`

describe('connector client - patch email confirmation toggle', function () {
  let provider = new Pact({
    consumer: 'selfservice-to-be',
    provider: 'connector',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after(() => provider.finalize())

  describe('patch email confirmation toggle - enabled', () => {
    const validGatewayAccountEmailConfirmationToggleRequest = gatewayAccountFixtures.validGatewayAccountEmailConfirmationToggleRequest(true)

    before((done) => {
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

    it('should toggle successfully', function (done) {
      const params = {
        gatewayAccountId: existingGatewayAccountId,
        payload: validGatewayAccountEmailConfirmationToggleRequest.getPlain()
      }
      connectorClient.updateConfirmationEmailEnabled(params, (connectorData, connectorResponse) => {
        expect(connectorResponse.statusCode).to.equal(200)
        done()
      })
    })
  })
})
