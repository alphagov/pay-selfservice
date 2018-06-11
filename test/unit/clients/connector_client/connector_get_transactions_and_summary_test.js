'use strict'

// NPM dependencies
const Pact = require('pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const path = require('path')
const PactInteractionBuilder = require('../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const Connector = require('../../../../app/services/clients/connector_client').ConnectorClient
const transactionSummaryFixtures = require('../../../fixtures/transaction_fixtures')

// Constants
const ACCOUNTS_RESOURCE = '/v1/api/accounts'
const TRANSACTIONS_RESOURCE = '/v2/api/accounts'
const port = Math.floor(Math.random() * 48127) + 1024
const connectorClient = new Connector(`http://localhost:${port}`)
const expect = chai.expect
// Note: the browser tests use values in the fixed config below, which match the defined interations
const ssUserConfig = require('../../../fixtures/config/self_service_user.json')
const ssDefaultUser = ssUserConfig.config.users.filter(fil => fil.isPrimary === 'true')[0]

// Global setup
chai.use(chaiAsPromised)

describe('connector client', function () {
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

  describe('get transaction summary', () => {
    const params = {
      gatewayAccountId: ssDefaultUser.gateway_accounts.filter(fil => fil.isPrimary === 'true')[0].id, // '666'
      fromDateTime: ssDefaultUser.sections.dashboard.transaction_summary.from_date, // 2018-05-14T00:00:00+01:00
      toDateTime: ssDefaultUser.sections.dashboard.transaction_summary.to_date // 2018-05-15T00:00:00+01:00
    }
    const validGetTransactionSummaryResponse = transactionSummaryFixtures.validTransactionSummaryResponse()

    before((done) => {
      const pactified = validGetTransactionSummaryResponse.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${params.gatewayAccountId}/transactions-summary`)
          .withUponReceiving('a valid transaction summary request')
          .withState(`User ${params.gatewayAccountId} exists in the database and has available transactions
          between 2018-05-14T00:00:00 and 2018-05-15T00:00:00`)
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

    it('should get transaction summary successfully', function (done) {
      const getTransactionSummary = validGetTransactionSummaryResponse.getPlain()
      connectorClient.getTransactionSummary(params,
        (connectorData, connectorResponse) => {
          expect(connectorResponse.body).to.deep.equal(getTransactionSummary)
          done()
        })
    })
  })

  describe('get transactions', () => {
    const params = {
      gatewayAccountId: ssDefaultUser.gateway_accounts.filter(fil => fil.isPrimary === 'true')[0].id, // '666'
      transactions: ssDefaultUser.sections.transactions
    }
    const validGetTransactionsResponse = transactionSummaryFixtures.validTransactionsResponse(params)

    // Stop the transactions data being flowed through into anything else
    delete params.transactions

    before((done) => {
      const pactified = validGetTransactionsResponse.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTIONS_RESOURCE}/${params.gatewayAccountId}/charges`)
          .withUponReceiving('a valid transactions request')
          .withState(`User ${params.gatewayAccountId} exists in the database and has available transactions`)
          .withMethod('GET')
          .withQuery('reference', '')
          .withQuery('email', '')
          .withQuery('card_brand', '')
          .withQuery('from_date', '')
          .withQuery('to_date', '')
          .withQuery('page', '1')
          .withQuery('display_size', '100')
          .withStatusCode(200)
          .withResponseBody(pactified)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should get unfiltered transactions successfully', function (done) {
      const getTransactions = validGetTransactionsResponse.getPlain()
      connectorClient.searchTransactions(params,
        (connectorData, connectorResponse) => {
          expect(connectorResponse.body).to.deep.equal(getTransactions)
          done()
        })
    })
  })

  describe('get filtered transactions with a \'from_date\' defined and an EXPLICIT time specified', () => {
    // from the connector POV, there is always a date/time specified, but this pact/contract and the implicit one (below)
    // cover scenarios where the UI will compute a date/time
    const filtered = ssDefaultUser.sections.filteredTransactions.data.filter(fil => fil.filtering.kind === 'fromdate')[0]
    const params = {
      gatewayAccountId: ssDefaultUser.gateway_accounts.filter(fil => fil.isPrimary === 'true')[0].id, // '666'
      fromDate: filtered.filtering.from_date_raw,
      fromTime: filtered.filtering.from_time_raw,
      transactions: filtered
    }
    const validGetFilteredTransactionsResponse = transactionSummaryFixtures.validTransactionsResponse(params)

    // Stop the transactions data being flowed through into anything else
    delete params.transactions

    before((done) => {
      const pactified = validGetFilteredTransactionsResponse.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTIONS_RESOURCE}/${params.gatewayAccountId}/charges`)
          .withUponReceiving('a valid transactions request filtered by from_date only')
          .withState(`User ${params.gatewayAccountId} exists in the database and has available transactions occuring after ${filtered.filtering.from_date}`)
          .withMethod('GET')
          .withQuery('reference', '')
          .withQuery('email', '')
          .withQuery('card_brand', '')
          .withQuery('from_date', filtered.filtering.from_date)
          .withQuery('to_date', '')
          .withQuery('page', '1')
          .withQuery('display_size', '100')
          .withStatusCode(200)
          .withResponseBody(pactified)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should get \'from_date\' filtered transactions with an explicit time, successfully', function (done) {
      const getFilteredTransactions = validGetFilteredTransactionsResponse.getPlain()
      connectorClient.searchTransactions(params,
        (connectorData, connectorResponse) => {
          expect(connectorResponse.body).to.deep.equal(getFilteredTransactions)
          done()
        })
    })
  })

  describe('get filtered transactions with a \'to_date\' defined', () => {
    const filtered = ssDefaultUser.sections.filteredTransactions.data.filter(fil => fil.filtering.kind === 'todate')[0]
    const params = {
      gatewayAccountId: ssDefaultUser.gateway_accounts.filter(fil => fil.isPrimary === 'true')[0].id, // '666'
      toDate: filtered.filtering.to_date_raw,
      toTime: filtered.filtering.to_time_raw,
      transactions: filtered
    }
    const validGetFilteredTransactionsResponse = transactionSummaryFixtures.validTransactionsResponse(params)

    // Stop the transactions data being flowed through into anything else
    delete params.transactions

    before((done) => {
      const pactified = validGetFilteredTransactionsResponse.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTIONS_RESOURCE}/${params.gatewayAccountId}/charges`)
          .withUponReceiving('a valid transactions request filtered by to_date only')
          .withState(`User ${params.gatewayAccountId} exists in the database and has available transactions occuring before ${filtered.filtering.to_date}`)
          .withMethod('GET')
          .withQuery('reference', '')
          .withQuery('email', '')
          .withQuery('card_brand', '')
          .withQuery('from_date', '')
          .withQuery('to_date', filtered.filtering.to_date)
          .withQuery('page', '1')
          .withQuery('display_size', '100')
          .withStatusCode(200)
          .withResponseBody(pactified)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should get \'to_date\' filtered transactions successfully', function (done) {
      const getFilteredTransactions = validGetFilteredTransactionsResponse.getPlain()
      connectorClient.searchTransactions(params,
        (connectorData, connectorResponse) => {
          expect(connectorResponse.body).to.deep.equal(getFilteredTransactions)
          done()
        })
    })
  })
})
