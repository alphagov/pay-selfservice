'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const path = require('path')
const PactInteractionBuilder = require('../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../../app/services/clients/connector.client').ConnectorClient
const gatewayAccountFixtures = require('../../../fixtures/gateway-account.fixtures')
const { pactify } = require('../../../test-helpers/pact/pactifier').defaultPactifier

// Constants
const ACCOUNTS_RESOURCE = '/v1/frontend/accounts'
const port = Math.floor(Math.random() * 48127) + 1024
const connectorClient = new Connector(`http://localhost:${port}`)
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

const existingGatewayAccountId = 666

describe('connector client - get gateway account', function () {
  let provider = new Pact({
    consumer: 'selfservice',
    provider: 'connector',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after(() => provider.finalize())

  describe('get single gateway account - success', () => {
    const validGetGatewayAccountResponse = gatewayAccountFixtures.validGatewayAccountResponse({
      gateway_account_id: existingGatewayAccountId
    })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${existingGatewayAccountId}`)
          .withUponReceiving('a valid get gateway account request')
          .withState(`User ${existingGatewayAccountId} exists in the database`)
          .withMethod('GET')
          .withResponseBody(pactify(validGetGatewayAccountResponse))
          .withStatusCode(200)
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should get gateway account successfully', function (done) {
      const params = {
        gatewayAccountId: existingGatewayAccountId,
        correlationId: null
      }
      connectorClient.getAccount(params)
        .should.be.fulfilled.then((response) => {
          expect(response).to.deep.equal(validGetGatewayAccountResponse)
        }).should.notify(done)
    })
  })
})
