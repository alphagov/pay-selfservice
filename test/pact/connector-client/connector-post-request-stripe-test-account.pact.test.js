'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const path = require('path')
const PactInteractionBuilder = require('../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../app/services/clients/connector.client').ConnectorClient
const { string } = require('@pact-foundation/pact').Matchers

// Constants
let connectorClient
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

const serviceId = 'a-service-id'

describe('connector client - request stripe test account', function () {
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

  describe('when a post to request stripe test account is made', () => {
    describe('success', () => {
      const validResponse = {
        stripe_connect_account_id: 'acct_123',
        gateway_account_id: string('1'),
        gateway_account_external_id: string('an-external-id')
      }

      before(() => {
        return provider.addInteraction(
          new PactInteractionBuilder(`/v1/service/${serviceId}/request-stripe-test-account`)
            .withUponReceiving('a valid post create charge request')
            .withState('a sandbox gateway account with service id a-service-id exists')
            .withMethod('POST')
            .withStatusCode(200)
            .withResponseHeaders({ 'Content-Type': 'application/json' })
            .withResponseBody(validResponse)
            .build()
        )
      })

      afterEach(() => provider.verify())

      it('a stripe test account and new gateway account should be created', async () => {
        const connectorResponse = await connectorClient.requestStripeTestAccount(serviceId)
        expect(connectorResponse.state.status).to.equal('ok')
      })
    })
  })
})
