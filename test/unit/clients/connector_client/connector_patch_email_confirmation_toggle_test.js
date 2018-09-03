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
const ACCOUNTS_RESOURCE = '/v1/api/accounts'
const port = Math.floor(Math.random() * 48127) + 1024
const connectorClient = new Connector(`http://localhost:${port}`)
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

// Note: the browser tests use values in the fixed config below, which match the defined interations
const ssUserConfig = require('../../../fixtures/config/self_service_user.json')
const ssDefaultUser = ssUserConfig.config.users.filter(fil => fil.isPrimary === 'true')[0]

describe('connector client - patch email confirmation toggle', function () {
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

  describe('patch email confirmation toggle - enabled', () => {
    const params = {
      gatewayAccountId: parseInt(ssDefaultUser.gateway_accounts.filter(fil => fil.isPrimary === 'true')[0].id), // 666
      enabled: true
    }

    const validGatewayAccountEmailConfirmationToggleRequest = gatewayAccountFixtures.validGatewayAccountEmailConfirmationToggleRequest(params)

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${params.gatewayAccountId}/email-notification`)
          .withUponReceiving('a valid patch email confirmation toggle (enabled) request')
          .withState(`Gateway account ${params.gatewayAccountId} exists in the database`)
          .withMethod('PATCH')
          .withRequestBody(validGatewayAccountEmailConfirmationToggleRequest.getPactified())
          .withStatusCode(200)
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should toggle successfully', function (done) {
      const payload = {'op': 'replace', 'path': 'enabled', 'value': true}
      connectorClient.updateNotificationEmailEnabled({gatewayAccountId: params.gatewayAccountId, payload: payload}, (connectorData, connectorResponse) => {
        expect(connectorResponse.statusCode).to.equal(200)
        done()
      })
    })
  })

})
