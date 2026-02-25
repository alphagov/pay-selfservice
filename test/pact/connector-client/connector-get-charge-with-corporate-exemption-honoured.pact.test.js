'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const path = require('path')

const PactInteractionBuilder = require('../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../src/services/clients/connector.client').ConnectorClient
const chargeFixture = require('../../fixtures/charge.fixtures')
const pactify = require('@test/test-helpers/pact/pact-base')

// Constants
const ACCOUNTS_RESOURCE = '/v1/api/accounts'
let connectorClient
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

const existingGatewayAccountId = 123456
const existingChargeExternalId = 'ch_123abc456def'

describe('connector client - get single charge', () => {
  const provider = new Pact({
    consumer: 'selfservice',
    provider: 'connector',
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge',
  })

  before(async () => {
    const opts = await provider.setup()
    connectorClient = new Connector(`http://127.0.0.1:${opts.port}`)
  })
  after(() => provider.finalize())

  describe('get single charge which has an honoured corporate exemption request', () => {
    const opts = {
      chargeId: existingChargeExternalId,
      state: {
        status: 'success',
        finished: true,
      },
      authorisation_summary: { three_d_secure: { required: false } },
    }
    const response = chargeFixture.validGetChargeResponseWithExemption(opts)

    before(() => {
      return provider.addInteraction(
        new PactInteractionBuilder(
          `${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}/charges/${existingChargeExternalId}`
        )
          .withUponReceiving('a valid get charge which has an honoured corporate exemption request')
          .withState('a charge with honoured corporate exemption exists')
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactify(response))
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('should get a charge which has an honoured corporate exemption successfully', function () {
      return connectorClient.getCharge(existingGatewayAccountId, existingChargeExternalId).then((charge) => {
        expect(charge.charge_id).to.equal(existingChargeExternalId)
        expect(charge.exemption.requested).to.equal(true)
        expect(charge.exemption.type).to.equal('corporate')
        expect(charge.exemption.outcome.result).to.equal('honoured')
      })
    })
  })
})
