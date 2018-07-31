'use strict'

// NPM dependencies
const Pact = require('pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const path = require('path')
const PactInteractionBuilder = require('../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const Connector = require('../../../../app/services/clients/connector_client').ConnectorClient
const gatewayAccountFixtures = require('../../../fixtures/gateway_account_fixtures')

// Constants
const ACCOUNTS_RESOURCE = '/v1/frontend/accounts'
const port = Math.floor(Math.random() * 48127) + 1024
const connectorClient = new Connector(`http://localhost:${port}`)
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

// Note: the browser tests use values in the fixed config below, which match the defined interations
const ssUserConfig = require('../../../fixtures/config/self_service_user.json')
const ssDefaultUser = ssUserConfig.config.users.filter(fil => fil.isPrimary === 'true')[0]

describe('connector client - get multiple gateway accounts', function () {

  let provider = Pact({
    consumer: 'selfservice-to-be',
    provider: 'connector',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after((done) => provider.finalize().then(done()))

  describe('get multiple gateway accounts - success', () => {

    const sortDescending = (GatewayAccoutA, GatewayAccoutB) => GatewayAccoutB.id - GatewayAccoutA.id

    const params = {
      gateway_account_ids: ssDefaultUser.gateway_accounts.sort(sortDescending).map(gateWayAccount => gateWayAccount.id), // gateway account ids in descending order
      accounts: ssDefaultUser.gateway_accounts.sort(sortDescending).map(gateWayAccount => {
        return {
          type: gateWayAccount.name === 'nonsandbox' ? 'live' : 'test',
          gateway_account_id: gateWayAccount.id,
          payment_provider: gateWayAccount.name === 'nonsandbox' ? 'worldpay' : 'sandbox',
          service_name: gateWayAccount.name,
          _links: {
            self: {
              href: `https://connector.pymnt.localdomain/v1/api/accounts/${gateWayAccount.id}`
            }
          }
        }
      })
    }

    const validGetGatewayAccountsResponse = gatewayAccountFixtures.validGatewayAccountsResponse(params)

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(ACCOUNTS_RESOURCE)
          .withUponReceiving('a valid get gateway accounts request')
          .withState(`Gateway accounts with id ${params.gateway_account_id} exist in the database`)
          .withMethod('GET')
          .withQuery('accountIds', params.gateway_account_ids.join(','))
          .withResponseBody(validGetGatewayAccountsResponse.getPactified())
          .withStatusCode(200)
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should get multiple gateway accounts successfully', function (done) {
      const getGatewayAccounts = validGetGatewayAccountsResponse.getPlain()
      connectorClient.getAccounts({gatewayAccountIds: params.gateway_account_ids, correlationId: null})
        .should.be.fulfilled.then((response) => {
        expect(response).to.deep.equal(getGatewayAccounts)
      }).should.notify(done)
    })
  })

})
