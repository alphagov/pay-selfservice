'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const path = require('path')
const PactInteractionBuilder = require('../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../../app/services/clients/connector.client').ConnectorClient
const gatewayAccountFixtures = require('../../../fixtures/gateway-account.fixtures')

// Constants
const ACCOUNTS_RESOURCE = '/v1/api/accounts'
const port = Math.floor(Math.random() * 48127) + 1024
const connectorClient = new Connector(`http://localhost:${port}`)
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

const existingGatewayAccountId = 42
const defaultState = `Gateway account ${existingGatewayAccountId} exists in the database`

describe('connector client - patch email refund toggle', function () {
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

  describe('patch email refund toggle - enabled', () => {
    const validGatewayAccountEmailRefundToggleRequest = gatewayAccountFixtures.validGatewayAccountEmailRefundToggleRequest(true)

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}/email-notification`)
          .withUponReceiving('a valid patch email refund toggle (enabled) request')
          .withState(defaultState)
          .withMethod('PATCH')
          .withRequestBody(validGatewayAccountEmailRefundToggleRequest)
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
        payload: validGatewayAccountEmailRefundToggleRequest
      }
      connectorClient.updateRefundEmailEnabled(params, (connectorData, connectorResponse) => {
        expect(connectorResponse.statusCode).to.equal(200)
        done()
      })
    })
  })
})
