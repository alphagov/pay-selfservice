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
  after(() => provider.finalize())

  describe('get transaction summary', () => {
    const params = {
      gatewayAccountId: 42,
      fromDateTime: '2018-05-14T00:00:00+01:00',
      toDateTime: '2018-05-15T00:00:00+01:00'
    }
    const validGetTransactionSummaryResponse = transactionSummaryFixtures.validTransactionSummaryResponse()

    before((done) => {
      const pactified = validGetTransactionSummaryResponse.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${ACCOUNTS_RESOURCE}/${params.gatewayAccountId}/transactions-summary`)
          .withUponReceiving('a valid transaction summary request')
          .withState(`Account ${params.gatewayAccountId} exists in the database and has 2 available transactions between 2018-05-14T00:00:00 and 2018-05-15T00:00:00`)
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
    const gatewayAccountId = 42
    const validGetTransactionsResponse = transactionSummaryFixtures.validTransactionsResponse({
      transactions: [
        { reference: 'payment1' },
        { reference: 'payment2' }
      ]
    })

    before((done) => {
      const pactified = validGetTransactionsResponse.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTIONS_RESOURCE}/${gatewayAccountId}/charges`)
          .withUponReceiving('a valid transactions request')
          .withState(`Account ${gatewayAccountId} exists in the database and has 2 transactions available`)
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
      connectorClient.searchTransactions({ gatewayAccountId: gatewayAccountId },
        (connectorData, connectorResponse) => {
          expect(connectorResponse.body).to.deep.equal(getTransactions)
          done()
        })
    })
  })

  // these date tests replace some end-to-end tests
  describe('get filtered transactions with a \'from_date\' defined and an EXPLICIT time specified', () => {
    const params = {
      gatewayAccountId: 42,
      fromDate: '03/5/2018',
      fromTime: '01:00:00'
    }
    const validGetFilteredTransactionsResponse = transactionSummaryFixtures.validTransactionsResponse({
      transactions: [
        { reference: 'payment1' },
        { reference: 'payment2' }
      ]
    })

    before((done) => {
      const pactified = validGetFilteredTransactionsResponse.getPactified()
      const fromDate = '2018-05-03T00:00:00.000Z'
      provider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTIONS_RESOURCE}/${params.gatewayAccountId}/charges`)
          .withUponReceiving('a valid transactions request filtered by from_date only')
          .withState(`Account ${params.gatewayAccountId} exists in the database and has 2 available transactions occurring after ${fromDate}`)
          .withMethod('GET')
          .withQuery('reference', '')
          .withQuery('cardholder_name', '')
          .withQuery('last_digits_card_number', '')
          .withQuery('email', '')
          .withQuery('card_brand', '')
          .withQuery('from_date', fromDate)
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
    const params = {
      gatewayAccountId: 42,
      toDate: '03/5/2018',
      toTime: '01:00:00'
    }
    const validGetFilteredTransactionsResponse = transactionSummaryFixtures.validTransactionsResponse({
      transactions: [
        { reference: 'payment1' },
        { reference: 'payment2' }
      ]
    })

    before((done) => {
      const pactified = validGetFilteredTransactionsResponse.getPactified()
      const toDate = '2018-05-03T00:00:01.000Z'
      provider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTIONS_RESOURCE}/${params.gatewayAccountId}/charges`)
          .withUponReceiving('a valid transactions request filtered by to_date only')
          .withState(`Account ${params.gatewayAccountId} exists in the database and has 2 available transactions occurring before ${toDate}`)
          .withMethod('GET')
          .withQuery('reference', '')
          .withQuery('cardholder_name', '')
          .withQuery('last_digits_card_number', '')
          .withQuery('email', '')
          .withQuery('card_brand', '')
          .withQuery('from_date', '')
          .withQuery('to_date', toDate)
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
    const params = {
      gatewayAccountId: 42,
      email: 'blah',
      brand: ['visa', 'master-card']
    }
    const validGetFilteredTransactionsResponse = transactionSummaryFixtures.validTransactionsResponse({
      transactions: [
        { reference: 'payment1' }
      ]
    })

    // Stop the transactions data being flowed through into anything else
    delete params.transactions

    before((done) => {
      const pactified = validGetFilteredTransactionsResponse.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTIONS_RESOURCE}/${params.gatewayAccountId}/charges`)
          .withUponReceiving('a valid transactions request filtered by partial email and card_brand of visa')
          .withState(`Account ${params.gatewayAccountId} exists in the database and has 1 available transaction with a card brands visa and mastercard and a partial email matching ${params.email}`)
          .withMethod('GET')
          .withQuery('reference', '')
          .withQuery('cardholder_name', '')
          .withQuery('last_digits_card_number', '')
          .withQuery('email', params.email)
          .withQuery('card_brand', params.brand)
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
    const params = {
      gatewayAccountId: 42,
      reference: 'payment1',
      payment_states: ['created', 'started', 'submitted', 'success'],
      fromDate: '03/5/2018',
      fromTime: '01:00:00',
      toDate: '04/5/2018',
      toTime: '01:00:00'
    }
    const validGetFilteredTransactionsResponse = transactionSummaryFixtures.validTransactionsResponse({
      transactions: [
        { reference: 'payment1' }
      ]
    })

    const fromDateTime = '2018-05-03T00:00:00.000Z'
    const toDateTime = '2018-05-04T00:00:01.000Z'

    before((done) => {
      const pactified = validGetFilteredTransactionsResponse.getPactified()
      provider.addInteraction(
        new PactInteractionBuilder(`${TRANSACTIONS_RESOURCE}/${params.gatewayAccountId}/charges`)
          .withUponReceiving('a valid transactions request filtered by payment states, a date range and a partial reference')
          .withState(`Account ${params.gatewayAccountId} exists in the database and has 1 available transaction with a payment state of success, a reference matching the partial search ${params.reference} and falls between the date range ${fromDateTime} amd ${toDateTime}`)
          .withMethod('GET')
          .withQuery('reference', params.reference)
          .withQuery('cardholder_name', '')
          .withQuery('last_digits_card_number', '')
          .withQuery('email', '')
          .withQuery('card_brand', '')
          .withQuery('from_date', fromDateTime)
          .withQuery('to_date', toDateTime)
          .withQuery('page', '1')
          .withQuery('display_size', '100')
          .withQuery('payment_states', params.payment_states.join(','))
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
