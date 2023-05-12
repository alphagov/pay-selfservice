'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const path = require('path')
const PactInteractionBuilder = require('../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const Connector = require('../../../app/services/clients/connector.client').ConnectorClient
const gatewayAccountFixtures = require('../../fixtures/gateway-account.fixtures')
const { pactify } = require('../../test-helpers/pact/pactifier').defaultPactifier

// Constants
const ACCOUNTS_RESOURCE = '/v1/frontend/accounts'
let connectorClient
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

describe('connector client - get multiple gateway accounts', function () {
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

  describe('get multiple gateway accounts - success', () => {
    const validGetGatewayAccountsResponse = gatewayAccountFixtures.validGatewayAccountsResponse({
      accounts: [
        { gateway_account_id: 111 },
        { gateway_account_id: 222 }
      ]
    })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(ACCOUNTS_RESOURCE)
          .withUponReceiving('a valid get gateway accounts request')
          .withState('gateway accounts with ids 111, 222 exist in the database')
          .withMethod('GET')
          .withQuery('accountIds', '111,222')
          .withResponseBody(pactify(validGetGatewayAccountsResponse))
          .withStatusCode(200)
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should get multiple gateway accounts successfully', function (done) {
      connectorClient.getAccounts({ gatewayAccountIds: [111, 222] })
        .should.be.fulfilled.then((response) => {
          expect(response).to.deep.equal(validGetGatewayAccountsResponse)
        }).should.notify(done)
    })
  })
})
