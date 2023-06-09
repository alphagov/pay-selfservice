'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')

const path = require('path')
const PactInteractionBuilder = require('../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../app/services/clients/connector.client').ConnectorClient
const gatewayAccountFixtures = require('../../fixtures/gateway-account.fixtures')
const { pactify } = require('../../test-helpers/pact/pactifier').defaultPactifier

// Constants
let connectorClient
const expect = chai.expect

const gatewayAccountExternalId = 'abc123'

describe('connector client - get gateway account by external id', function () {
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

  describe('get Worldpay account - success', () => {
    const validGetGatewayAccountResponse = gatewayAccountFixtures.validGatewayAccountResponse({
      external_id: gatewayAccountExternalId,
      payment_provider: 'worldpay',
      description: 'A description',
      analytics_id: 'an-analytics-id',
      worldpay_3ds_flex: {
        organisational_unit_id: 'an-org-id',
        issuer: 'an-issues'
      }
    })

    before(() => {
      return provider.addInteraction(
        new PactInteractionBuilder(`/v1/frontend/accounts/external-id/${gatewayAccountExternalId}`)
          .withUponReceiving('a valid get Worldpay gateway account by external id request')
          .withState('a gateway account 333 with Worldpay 3DS Flex credentials exists')
          .withMethod('GET')
          .withResponseBody(pactify(validGetGatewayAccountResponse))
          .withStatusCode(200)
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('should get gateway account successfully', async () => {
      const params = {
        gatewayAccountExternalId
      }
      const response = await connectorClient.getAccountByExternalId(params)
      expect(response).to.deep.equal(validGetGatewayAccountResponse)
    })
  })

  describe('get ePDQ account - success', () => {
    const validGetGatewayAccountResponse = gatewayAccountFixtures.validGatewayAccountResponse({
      external_id: gatewayAccountExternalId,
      payment_provider: 'worldpay',
      description: 'A description',
      analytics_id: 'an-analytics-id'
    })

    before(() => {
      return provider.addInteraction(
        new PactInteractionBuilder(`/v1/frontend/accounts/external-id/${gatewayAccountExternalId}`)
          .withUponReceiving('a valid get ePDQ gateway account by external id request')
          .withState('an ePDQ gateway account with id 333 and external abc123 with credentials exists')
          .withMethod('GET')
          .withResponseBody(pactify(validGetGatewayAccountResponse))
          .withStatusCode(200)
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('should get gateway account successfully', async () => {
      const params = {
        gatewayAccountExternalId
      }
      const response = await connectorClient.getAccountByExternalId(params)
      expect(response).to.deep.equal(validGetGatewayAccountResponse)
    })
  })
})
