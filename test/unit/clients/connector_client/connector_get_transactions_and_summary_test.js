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

  describe('get transaction summary', () => {
    const params = {
      gatewayAccountId: ssDefaultUser.gateway_accounts.filter(fil => fil.isPrimary === 'true')[0].id,
      fromDateTime: ssDefaultUser.sections.dashboard.transaction_summary.from_date,
      toDateTime: ssDefaultUser.sections.dashboard.transaction_summary.to_date
    }
    const validGetTransactionSummaryResponse = transactionSummaryFixtures.validTransactionSummaryResponse()

    before((done) => {
      const pactified = validGetTransactionSummaryResponse.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${params.gatewayAccountId}/transactions-summary`)
          .withUponReceiving('a valid transaction summary request')
          .withState(`User ${params.gatewayAccountId} exists in the database and has 2 available transactions between 2018-05-14T00:00:00 and 2018-05-15T00:00:00`)
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
      gatewayAccountId: ssDefaultUser.gateway_accounts.filter(fil => fil.isPrimary === 'true')[0].id,
      transactions: ssDefaultUser.sections.transactions.data,
      links: ssDefaultUser.sections.transactions.links
    }
    const validGetTransactionsResponse = transactionSummaryFixtures.validTransactionsResponse(params)

    // Stop the transactions data being flowed through into anything else
    delete params.transactions

    before((done) => {
      const pactified = validGetTransactionsResponse.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTIONS_RESOURCE}/${params.gatewayAccountId}/charges`)
          .withUponReceiving('a valid transactions request')
          .withState(`User ${params.gatewayAccountId} exists in the database and has 4 transactions available`)
          .withMethod('GET')
          .withQuery('reference', '')
          .withQuery('cardholder_name', '')
          .withQuery('last_digits_card_number', '')
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

  // these date tests replace some end-to-end tests
  describe('get filtered transactions with a \'from_date\' defined and an EXPLICIT time specified', () => {
    // from the connector POV, there is always a date/time specified, but this pact/contract and the implicit one (below)
    // cover scenarios where the UI will compute a date/time
    const filtered = ssDefaultUser.sections.filteredTransactions.data.filter(fil => fil.filtering.kind === 'fromdate')[0]
    const params = {
      gatewayAccountId: ssDefaultUser.gateway_accounts.filter(fil => fil.isPrimary === 'true')[0].id,
      fromDate: filtered.filtering.from_date_raw,
      fromTime: filtered.filtering.from_time_raw,
      transactions: filtered.data,
      links: filtered.links
    }
    const validGetFilteredTransactionsResponse = transactionSummaryFixtures.validTransactionsResponse(params)

    // Stop the transactions data being flowed through into anything else
    delete params.transactions

    before((done) => {
      const pactified = validGetFilteredTransactionsResponse.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTIONS_RESOURCE}/${params.gatewayAccountId}/charges`)
          .withUponReceiving('a valid transactions request filtered by from_date only')
          .withState(`User ${params.gatewayAccountId} exists in the database and has 2 available transactions occurring after ${filtered.filtering.from_date}`)
          .withMethod('GET')
          .withQuery('reference', '')
          .withQuery('cardholder_name', '')
          .withQuery('last_digits_card_number', '')
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
      gatewayAccountId: ssDefaultUser.gateway_accounts.filter(fil => fil.isPrimary === 'true')[0].id,
      toDate: filtered.filtering.to_date_raw,
      toTime: filtered.filtering.to_time_raw,
      transactions: filtered.data,
      links: filtered.links
    }
    const validGetFilteredTransactionsResponse = transactionSummaryFixtures.validTransactionsResponse(params)

    // Stop the transactions data being flowed through into anything else
    delete params.transactions

    before((done) => {
      const pactified = validGetFilteredTransactionsResponse.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTIONS_RESOURCE}/${params.gatewayAccountId}/charges`)
          .withUponReceiving('a valid transactions request filtered by to_date only')
          .withState(`User ${params.gatewayAccountId} exists in the database and has 2 available transactions occurring before ${filtered.filtering.to_date}`)
          .withMethod('GET')
          .withQuery('reference', '')
          .withQuery('cardholder_name', '')
          .withQuery('last_digits_card_number', '')
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

  describe('get filtered transactions with multiple values for \'card_brand\' and a value for \'email\' defined', () => {
    const filtered = ssDefaultUser.sections.filteredTransactions.data.filter(fil => fil.filtering.kind === 'partialemail')[0]
    const params = {
      gatewayAccountId: ssDefaultUser.gateway_accounts.filter(fil => fil.isPrimary === 'true')[0].id,
      email: filtered.filtering.email,
      brand: filtered.filtering.card_brand,
      transactions: filtered.data,
      links: filtered.links
    }
    const validGetFilteredTransactionsResponse = transactionSummaryFixtures.validTransactionsResponse(params)

    // Stop the transactions data being flowed through into anything else
    delete params.transactions

    before((done) => {
      const pactified = validGetFilteredTransactionsResponse.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTIONS_RESOURCE}/${params.gatewayAccountId}/charges`)
          .withUponReceiving('a valid transactions request filtered by partial email and card_brand of visa')
          .withState(`Account ${params.gatewayAccountId} exists in the database and has 1 available transaction with a card brand of ${filtered.filtering.card_brand[0]}, and a partial email matching ${filtered.filtering.email}`)
          .withMethod('GET')
          .withQuery('reference', '')
          .withQuery('cardholder_name', '')
          .withQuery('last_digits_card_number', '')
          .withQuery('email', filtered.filtering.email)
          .withQuery('card_brand', filtered.filtering.card_brand[0])
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

    it('should get partial email filtered transactions successfully', function (done) {
      const getFilteredTransactions = validGetFilteredTransactionsResponse.getPlain()
      connectorClient.searchTransactions(params,
        (connectorData, connectorResponse) => {
          expect(connectorResponse.body).to.deep.equal(getFilteredTransactions)
          done()
        })
    })
  })

  describe('get filtered transactions with multiple values for \'payment_states\', a partial value for \'reference\' and a to/from date defined', () => {
    const filtered = ssDefaultUser.sections.filteredTransactions.data.filter(fil => fil.filtering.kind === 'multiplestates-partialref-startenddate')[0]
    const params = {
      gatewayAccountId: ssDefaultUser.gateway_accounts.filter(fil => fil.isPrimary === 'true')[0].id,
      reference: filtered.filtering.reference,
      payment_states: filtered.filtering.payment_states_expanded,
      fromDate: filtered.filtering.from_date_raw,
      fromTime: filtered.filtering.from_time_raw,
      toDate: filtered.filtering.to_date_raw,
      toTime: filtered.filtering.to_time_raw,
      transactions: filtered.data,
      links: filtered.links
    }
    const validGetFilteredTransactionsResponse = transactionSummaryFixtures.validTransactionsResponse(params)

    // Stop the transactions data being flowed through into anything else
    delete params.transactions

    before((done) => {
      const pactified = validGetFilteredTransactionsResponse.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTIONS_RESOURCE}/${params.gatewayAccountId}/charges`)
          .withUponReceiving('a valid transactions request filtered by payment states, a date range and a partial reference')
          .withState(`Account ${params.gatewayAccountId} exists in the database and has 1 available transaction with a payment state of success, a reference matching the partial search ${filtered.filtering.reference} and falls between the date range ${filtered.filtering.from_date} amd ${filtered.filtering.to_date}`)
          .withMethod('GET')
          .withQuery('reference', filtered.filtering.reference)
          .withQuery('cardholder_name', '')
          .withQuery('last_digits_card_number', '')
          .withQuery('email', '')
          .withQuery('card_brand', '')
          .withQuery('from_date', filtered.filtering.from_date)
          .withQuery('to_date', filtered.filtering.to_date)
          .withQuery('page', '1')
          .withQuery('display_size', '100')
          .withQuery('payment_states', filtered.filtering.payment_states_expanded.join(','))
          .withStatusCode(200)
          .withResponseBody(pactified)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should get partial email filtered transactions successfully', function (done) {
      const getFilteredTransactions = validGetFilteredTransactionsResponse.getPlain()
      connectorClient.searchTransactions(params,
        (connectorData, connectorResponse) => {
          expect(connectorResponse.body).to.deep.equal(getFilteredTransactions)
          done()
        })
    })
  })
})
