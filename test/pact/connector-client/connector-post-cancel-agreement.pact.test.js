'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const path = require('path')
const PactInteractionBuilder = require('../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../app/services/clients/connector.client').ConnectorClient
const cancelAgreementFixture = require('../../fixtures/cancel-agreement.fixtures')

// Constants
let connectorClient
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

const gatewayAccountId = 3456
const agreementId = 3333

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
    connectorClient = new Connector(`http://localhost:${opts.port}`)
  })
  after(() => provider.finalize())

  describe('post cancel agreement', () => {
    describe('success', () => {
      const cancelAgreementRequest = cancelAgreementFixture.cancelAgreementRequest()

      const cancelAgreementResponse = cancelAgreementFixture.cancelAgreementResponse()

      before(() => {
        return provider.addInteraction(
          new PactInteractionBuilder(`/v1/api/accounts/${gatewayAccountId}/agreements/${agreementId}/cancel`)
            .withUponReceiving('a valid post cancel agreement request')
            .withState('a gateway account with id 3456, agreement with external_id 3333 exists')
            .withMethod('POST')
            .withRequestHeaders({ 'Content-Type': 'application/json' })
            .withRequestBody(cancelAgreementRequest.payload)
            .withStatusCode(200)
            .withResponseHeaders({ 'Content-Type': 'application/json' })
            .withResponseBody(cancelAgreementResponse)
            .build()
        )
      })

      afterEach(() => provider.verify())

      it('should post cancel agreement successfully', async () => {
        const connectorResponse = await connectorClient.postCancelAgreement(cancelAgreementRequest)
        expect(connectorResponse).to.deep.equal(cancelAgreementResponse)
      })
    })
  })
})
