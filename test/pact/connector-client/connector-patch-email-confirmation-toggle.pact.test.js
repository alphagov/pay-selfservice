'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const path = require('path')
const PactInteractionBuilder = require('../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../app/services/clients/connector.client').ConnectorClient
const gatewayAccountFixtures = require('../../fixtures/gateway-account.fixtures')

// Constants
const ACCOUNTS_RESOURCE = '/v1/api/accounts'
let connectorClient
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

const existingGatewayAccountId = 42
const defaultState = `a stripe gateway account with external id ${existingGatewayAccountId} exists in the database`

describe('connector client - patch email confirmation toggle', function () {
  const provider = new Pact({
    consumer: 'selfservice',
    provider: 'connector',
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(async () => {
    const opts = await provider.setup()
    connectorClient = new Connector(`http://127.0.0.1:${opts.port}`)
  })
  after(() => provider.finalize())

  describe('patch email confirmation toggle - enabled', () => {
    const validGatewayAccountEmailConfirmationToggleRequest = gatewayAccountFixtures.validGatewayAccountEmailConfirmationToggleRequest(true)

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}/email-notification`)
          .withUponReceiving('a valid patch email confirmation toggle (enabled) request')
          .withState(defaultState)
          .withMethod('PATCH')
          .withRequestBody(validGatewayAccountEmailConfirmationToggleRequest)
          .withStatusCode(200)
          .withResponseHeaders({})
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should toggle successfully', function () {
      const params = {
        gatewayAccountId: existingGatewayAccountId,
        payload: validGatewayAccountEmailConfirmationToggleRequest
      }

      return expect(connectorClient.updateConfirmationEmailEnabled(params)).to.be.fulfilled
    })
  })
})
