'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const path = require('path')
const PactInteractionBuilder = require('../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../app/services/clients/connector.client').ConnectorClient
const chargeFixture = require('../../fixtures/charge.fixtures')

// Constants
const CHARGES_RESOURCE = '/v1/api/accounts'
let connectorClient
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

const gatewayAccountId = 3456

describe('connector client', function () {
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

  describe('post create charge', () => {
    describe('success', () => {
      const validPostCreateChargeRequest = chargeFixture.validPostChargeRequestRequest({
        amount: 100,
        return_url: 'https://somewhere.gov.uk/rainbow/1',
        credential_id: 'creds123'
      })

      const validResponse = chargeFixture.validPostChargeRequestResponse()

      before(() => {
        return provider.addInteraction(
          new PactInteractionBuilder(`${CHARGES_RESOURCE}/${gatewayAccountId}/charges`)
            .withUponReceiving('a valid post create charge request')
            .withState('a Worldpay gateway account with id 3456, gateway account credentials with external_id creds123 exists')
            .withMethod('POST')
            .withRequestBody(validPostCreateChargeRequest)
            .withStatusCode(201)
            .withResponseHeaders({ 'Content-Type': 'application/json' })
            .withResponseBody(validResponse)
            .build()
        )
      })

      afterEach(() => provider.verify())

      it('should post a refund request successfully', async () => {
        const connectorResponse = await connectorClient.postChargeRequest(gatewayAccountId, validPostCreateChargeRequest)
        expect(connectorResponse.state.status).to.equal('created')
        expect(connectorResponse.return_url).to.equal('https://somewhere.gov.uk/rainbow/1')
        expect(connectorResponse.links).to.be.a('array')
      })
    })
  })
})
