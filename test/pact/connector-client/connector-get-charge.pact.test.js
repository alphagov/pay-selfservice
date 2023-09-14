'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const path = require('path')

const PactInteractionBuilder = require('../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../app/services/clients/connector.client').ConnectorClient
const chargeFixture = require('../../fixtures/charge.fixtures')
const { pactify } = require('../../test-helpers/pact/pactifier').defaultPactifier

// Constants
const ACCOUNTS_RESOURCE = '/v1/api/accounts'
let connectorClient
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

const existingGatewayAccountId = 42
const existingChargeExternalId = 'abcdef1234'
const defaultState = `a charge with gateway account id ${existingGatewayAccountId} and charge id ${existingChargeExternalId} exists`

describe('connector client - get single charge', () => {
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

  describe('get single charge', () => {
    const opts = {
      chargeId: existingChargeExternalId,
      state: {
        status: 'success',
        finished: true
      }
    }
    const response = chargeFixture.validGetChargeResponse(opts)

    before(() => {
      return provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}/charges/${existingChargeExternalId}`)
          .withUponReceiving('a valid get charge request')
          .withState(defaultState)
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactify(response))
          .build())
    })

    afterEach(() => provider.verify())

    it('should get a charge successfully', function () {
      return connectorClient.getCharge(existingGatewayAccountId, existingChargeExternalId)
        .then(charge => {
          expect(charge.charge_id).to.equal(existingChargeExternalId)
          expect(charge.state.status).to.equal('success')
          expect(charge.state.finished).to.equal(true)
        })
    })
  })
})
