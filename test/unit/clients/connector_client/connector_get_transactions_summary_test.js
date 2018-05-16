'use strict'

// NPM dependencies
const Pact = require('pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const path = require('path')
const PactInteractionBuilder = require('../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const Connector = require('../../../../app/services/clients/connector_client').ConnectorClient
const transactionSummaryFixtures = require('../../../fixtures/transaction_summary_fixtures')

// Constants
const ACCOUNTS_RESOURCE = '/v1/api/accounts'
const port = Math.floor(Math.random() * 48127) + 1024
const connectorClient = new Connector(`http://localhost:${port}`)
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

describe('connector client - get transaction summary', function () {
  const provider = Pact({
    consumer: 'selfservice',
    provider: 'connector',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after((done) => provider.finalize().then(done()))

  describe('get transaction summary - success', () => {
    // Note: the browser tests attempt to get a custom summary range based on these values.
    // Ensure they match here and in the browser tests, or they refer to the same config file.
    const params = {
      gatewayAccountId: '666',
      fromDateTime: '2018-05-14T00:00:00+01:00',
      toDateTime: '2018-05-15T00:00:00+01:00'
    }
    const validGetTransactionSummaryResponse = transactionSummaryFixtures.validTransactionSummaryResponse(params)

    before((done) => {
      const pactified = validGetTransactionSummaryResponse.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${params.gatewayAccountId}/transactions-summary`)
          .withUponReceiving('a valid transaction summary request')
          .withMethod('GET')
          .withQuery('from_date', params.fromDateTime)
          .withQuery('to_date', params.toDateTime)
          .withStatusCode(200)
          .withResponseBody(pactified)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should get gateway account successfully', function (done) {
      const getTransactionSummary = validGetTransactionSummaryResponse.getPlain()
      connectorClient.getTransactionSummary(params,
        (connectorData, connectorResponse) => {
          expect(connectorResponse.body).to.deep.equal(getTransactionSummary)
          done()
        })
    })
  })
})
