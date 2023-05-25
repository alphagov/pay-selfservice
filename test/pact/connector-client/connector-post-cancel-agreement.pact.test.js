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

// Global setup
chai.use(chaiAsPromised)

const gatewayAccountId = 3456
const agreementId = 'abcdefghijklmnopqrstuvwxyz'

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

      before(() => {
        return provider.addInteraction(
          new PactInteractionBuilder(`/v1/api/accounts/${gatewayAccountId}/agreements/${agreementId}/cancel`)
            .withUponReceiving('a valid post cancel agreement request')
            .withState('a gateway account with id 3456 and an active agreement exists')
            .withMethod('POST')
            .withRequestBody(cancelAgreementRequest.payload)
            .withStatusCode(204)
            .withResponseWithoutHeaders()
            .build()
        )
      })

      afterEach(() => provider.verify())

      it('should post cancel agreement successfully', async () => {
        return  connectorClient.postCancelAgreement(cancelAgreementRequest).should.be.fulfilled
      })
    })
  })
})
