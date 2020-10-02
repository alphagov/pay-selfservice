'use strict'

// NPM dependencies
const { Pact } = require('@pact-foundation/pact')

// Custom dependencies
const path = require('path')
const PactInteractionBuilder = require('../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../../app/services/clients/connector.client').ConnectorClient
const gatewayAccountFixtures = require('../../../fixtures/gateway-account.fixtures')

const ACCOUNTS_RESOURCE = '/v1/api/accounts'
const port = Math.floor(Math.random() * 48127) + 1024
const connectorClient = new Connector(`http://localhost:${port}`)
const existingGatewayAccountId = 667

// Global setup

describe('connector client - patch MOTO mask card number toggle (enabled) request', () => {
  const patchRequestParams = { path: 'moto_mask_card_number_input', value: true }
  const request = gatewayAccountFixtures.validGatewayAccountPatchRequest(patchRequestParams).getPlain()

  let provider = new Pact({
    consumer: 'selfservice',
    provider: 'connector',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  beforeAll(() => provider.setup())
  afterAll(() => provider.finalize())

  describe('MOTO mask card number input toggle - supported payment provider request', () => {
    const motoMaskCardNumberInputProviderState =
      `a gateway account with MOTO enabled and an external id ${existingGatewayAccountId} exists in the database`

    beforeAll(() => {
      return provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}`)
          .withUponReceiving('a valid patch MOTO mask card number input (enabled) request')
          .withState(motoMaskCardNumberInputProviderState)
          .withMethod('PATCH')
          .withRequestBody(request)
          .withStatusCode(200)
          .withResponseHeaders({})
          .build())
    })

    afterEach(() => provider.verify())

    it('should toggle successfully', () => {
      return connectorClient.toggleMotoMaskCardNumberInput(existingGatewayAccountId, true, null)
    })
  })
})
