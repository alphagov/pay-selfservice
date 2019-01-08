'use strict'

// NPM modules
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const request = require('supertest')
const nock = require('nock')

// Local modules
require('../test_helpers/serialize_mock')
const userCreator = require('../test_helpers/user_creator')
const getApp = require('../../server').getApp
const paths = require('../../app/paths')
const session = require('../test_helpers/mock_session')
const getQueryStringForParams = require('../../app/utils/get_query_string_for_params')

// Setup
const CONNECTOR_DATE = '2016-02-10T12:44:01.000Z'
const DISPLAY_DATE = '10 Feb 2016 — 12:44:01'
const gatewayAccountId = '651342'
const { expect } = chai
const connectorSearchParameters = {}
const CONNECTOR_CHARGES_API_PATH = '/v2/api/accounts/' + gatewayAccountId + '/charges'
const CONNECTOR_ALL_CARD_TYPES_API_PATH = '/v1/api/card-types'
const ALL_CARD_TYPES = {
  'card_types': [
    { 'id': '1', 'brand': 'mastercard', 'label': 'Mastercard', 'type': 'CREDIT' },
    { 'id': '2', 'brand': 'mastercard', 'label': 'Mastercard', 'type': 'DEBIT' },
    { 'id': '3', 'brand': 'discover', 'label': 'Discover', 'type': 'CREDIT' },
    { 'id': '4', 'brand': 'maestro', 'label': 'Maestro', 'type': 'DEBIT' }]
}
const requestId = 'unique-request-id'
const aCorrelationHeader = {
  reqheaders: { 'x-request-id': requestId }
}
const connectorMock = nock(process.env.CONNECTOR_URL, aCorrelationHeader)

chai.use(chaiAsPromised)
chai.should()
let app

describe('The /transactions endpoint', function () {
  afterEach(function () {
    nock.cleanAll()
    app = null
  })

  beforeEach(function (done) {
    const permissions = 'transactions:read'
    const user = session.getUser({
      gateway_account_ids: [gatewayAccountId],
      permissions: [{ name: permissions }]
    })
    app = session.getAppWithLoggedInUser(getApp(), user)

    userCreator.mockUserResponse(user.toJson(), done)
  })

  it('should return a list of transactions for the gateway account', function (done) {
    connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
      .reply(200, ALL_CARD_TYPES)

    const connectorData = {
      'results': [
        {
          'charge_id': '100',
          'gateway_transaction_id': 'tnx-id-1',
          'amount': 5000,
          'reference': 'ref1',
          'email': 'alice.222@mail.fake',
          transaction_type: 'charge',
          'state': {
            'status': 'created',
            'finished': false
          },
          'card_brand': 'Visa',
          'updated': CONNECTOR_DATE,
          'created_date': CONNECTOR_DATE

        },
        {
          'charge_id': '101',
          'gateway_transaction_id': 'tnx-id-2',
          'amount': 2000,
          'reference': 'ref2',
          'email': 'alice.111@mail.fake',
          transaction_type: 'charge',
          'state': {
            'status': 'success',
            'finished': true
          },
          'card_brand': 'Visa',
          'updated': CONNECTOR_DATE,
          'created_date': CONNECTOR_DATE

        }
      ],
      total: 2
    }

    connectorMockResponds(200, connectorData, connectorSearchParameters)

    const expectedData = {
      'results': [
        {
          'charge_id': '100',
          'gateway_transaction_id': 'tnx-id-1',
          'amount': '£50.00',
          'reference': 'ref1',
          'email': 'alice.222@mail.fake',
          transaction_type: 'charge',
          'state': {
            'status': 'created',
            'finished': false
          },
          'card_brand': 'Visa',
          'state_friendly': 'In progress',
          'gateway_account_id': gatewayAccountId,
          'updated': DISPLAY_DATE,
          'created': DISPLAY_DATE,
          'link': paths.generateRoute(paths.transactions.detail, { chargeId: 100 })
        },
        {
          'charge_id': '101',
          'gateway_transaction_id': 'tnx-id-2',
          'amount': '£20.00',
          'reference': 'ref2',
          'email': 'alice.111@mail.fake',
          transaction_type: 'charge',
          'state': {
            'status': 'success',
            'finished': true
          },
          'card_brand': 'Visa',
          'state_friendly': 'Success',
          'gateway_account_id': gatewayAccountId,
          'updated': DISPLAY_DATE,
          'created': DISPLAY_DATE,
          'link': paths.generateRoute(paths.transactions.detail, { chargeId: 101 })
        }
      ]
    }

    getTransactionList()
      .expect(200)
      .expect(function (res) {
        res.body.results.should.eql(expectedData.results)
        res.body.csvMaxLimitFormatted.should.eql('10,000')
        res.body.showCsvDownload.should.eql(true)
      })
      .end(done)
  })

  it('should return a list of transactions for the gateway account with no csv download link', function (done) {
    connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
      .reply(200, ALL_CARD_TYPES)

    const connectorData = {
      results: [
        {
          charge_id: '100',
          gateway_transaction_id: 'tnx-id-1',
          amount: 5000,
          reference: 'ref1',
          email: 'alice.222@mail.fake',
          transaction_type: 'charge',
          state: {
            status: 'failed',
            finished: true,
            code: 'P0030',
            message: 'Payment was cancelled by the service'
          },
          card_brand: 'Visa',
          updated: CONNECTOR_DATE,
          created_date: CONNECTOR_DATE

        },
        {
          charge_id: '101',
          gateway_transaction_id: 'tnx-id-2',
          amount: 2000,
          reference: 'ref2',
          email: 'alice.111@mail.fake',
          transaction_type: 'refund',
          state: {
            status: 'success',
            finished: true
          },
          card_brand: 'Visa',
          updated: CONNECTOR_DATE,
          created_date: CONNECTOR_DATE

        }
      ],
      total: 10001
    }

    connectorMockResponds(200, connectorData, connectorSearchParameters)

    const expectedData = {
      'results': [
        {
          'charge_id': '100',
          'gateway_transaction_id': 'tnx-id-1',
          'amount': '£50.00',
          'reference': 'ref1',
          'email': 'alice.222@mail.fake',
          transaction_type: 'charge',
          'state': {
            'status': 'failed',
            'finished': true,
            'code': 'P0030',
            'message': 'Payment was cancelled by the service'
          },
          'card_brand': 'Visa',
          'state_friendly': 'Cancelled',
          'gateway_account_id': gatewayAccountId,
          'updated': DISPLAY_DATE,
          'created': DISPLAY_DATE,
          'link': paths.generateRoute(paths.transactions.detail, { chargeId: 100 })
        },
        {
          'charge_id': '101',
          'gateway_transaction_id': 'tnx-id-2',
          'amount': '–£20.00',
          'reference': 'ref2',
          'email': 'alice.111@mail.fake',
          transaction_type: 'refund',
          'state': {
            'status': 'success',
            'finished': true
          },
          'card_brand': 'Visa',
          'state_friendly': 'Refund success',
          'gateway_account_id': gatewayAccountId,
          'updated': DISPLAY_DATE,
          'created': DISPLAY_DATE,
          'link': paths.generateRoute(paths.transactions.detail, { chargeId: 101 })
        }
      ]
    }

    getTransactionList()
      .expect(200)
      .expect(function (res) {
        res.body.results.should.eql(expectedData.results)
        res.body.csvMaxLimitFormatted.should.eql('10,000')
        res.body.totalFormatted.should.eql('10,001')
        res.body.showCsvDownload.should.eql(false)
      })
      .end(done)
  })

  it('should return a list of transactions for the gateway account when some display states is selected', function (done) {
    connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
      .reply(200, ALL_CARD_TYPES)

    const connectorData = {
      'results': [
        {
          'charge_id': '100',
          'gateway_transaction_id': 'tnx-id-1',
          'amount': 5000,
          'reference': 'ref1',
          'email': 'alice.222@mail.fake',
          transaction_type: 'charge',
          'state': {
            'status': 'created',
            'finished': false
          },
          'card_brand': 'Visa',
          'updated': CONNECTOR_DATE,
          'created_date': CONNECTOR_DATE

        },
        {
          'charge_id': '101',
          'gateway_transaction_id': 'tnx-id-2',
          'amount': 2000,
          'reference': 'ref2',
          'email': 'alice.111@mail.fake',
          transaction_type: 'charge',
          'state': {
            'status': 'submitted',
            'finished': false
          },
          'card_brand': 'Visa',
          'updated': CONNECTOR_DATE,
          'created_date': CONNECTOR_DATE
        },
        {
          'charge_id': '102',
          'gateway_transaction_id': 'tnx-id-3',
          'amount': 4500,
          'reference': 'ref2',
          'email': 'alice.111@mail.fake',
          transaction_type: 'charge',
          'state': {
            'status': 'failed',
            'finished': false,
            'code': 'P0020',
            'message': 'some error'
          },
          'card_brand': 'Visa',
          'updated': CONNECTOR_DATE,
          'created_date': CONNECTOR_DATE
        },
        {
          'charge_id': '103',
          'gateway_transaction_id': 'tnx-id-2',
          'amount': 5000,
          'reference': 'ref2',
          'email': 'alice.111@mail.fake',
          transaction_type: 'refund',
          'state': {
            'status': 'submitted',
            'finished': true
          },
          'card_brand': 'Visa',
          'updated': CONNECTOR_DATE,
          'created_date': CONNECTOR_DATE
        }
      ]
    }

    connectorMockResponds(200, connectorData, {
      payment_states: 'created,started,submitted,timedout',
      refund_states: 'submitted'
    })
    request(app)
      .get(paths.transactions.index)
      .query({ state: ['In progress', 'Timed out', 'Refund submitted'] })
      .set('Accept', 'application/json')
      .set('x-request-id', requestId)
      .expect(200)
      .expect(function (res) {
        expect(res.body.results.length).to.equal(4)
        expect(res.body.results.map(row => row.charge_id)).to.deep.equal(['100', '101', '102', '103'])
        expect(res.body.results.map(row => row.state_friendly)).to.deep.equal(['In progress', 'In progress', 'Timed out', 'Refund submitted'])
        expect(res.body.eventStates.length).to.equal(10)
        const selectedStates = res.body.eventStates.filter(state => state.selected === true)
        expect(selectedStates.length).to.equal(3)
        selectedStates.forEach(state => {
          expect(['In progress', 'Timed out', 'Refund submitted']).to.include(state.text)
        })

        res.body.downloadTransactionLink.should.eql('/transactions/download?payment_states=created&payment_states=started&payment_states=submitted&payment_states=timedout&refund_states=submitted')
      })
      .end(done)
  })

  it('should return a list of transactions for the gateway account with reference missing', function (done) {
    connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
      .reply(200, ALL_CARD_TYPES)

    var connectorData = {
      'results': [
        {
          'charge_id': '100',
          'gateway_transaction_id': 'tnx-id-1',
          'amount': 5000,
          'email': 'alice.111@mail.fake',
          transaction_type: 'charge',
          'state': {
            'status': 'created',
            'finished': false
          },
          'card_brand': 'Visa',
          'updated': CONNECTOR_DATE,
          'created_date': CONNECTOR_DATE

        },
        {
          'charge_id': '101',
          'gateway_transaction_id': 'tnx-id-2',
          'amount': 2000,
          'reference': 'ref2',
          'email': 'alice.111@mail.fake',
          transaction_type: 'charge',
          'state': {
            'status': 'success',
            'finished': false
          },
          'card_brand': 'Visa',
          'updated': CONNECTOR_DATE,
          'created_date': CONNECTOR_DATE
        }
      ]
    }

    connectorMockResponds(200, connectorData, connectorSearchParameters)

    var expectedData = {
      'results': [
        {
          'charge_id': '100',
          'gateway_transaction_id': 'tnx-id-1',
          'amount': '£50.00',
          'email': 'alice.111@mail.fake',
          transaction_type: 'charge',
          'state': {
            'status': 'created',
            'finished': false
          },
          'card_brand': 'Visa',
          'state_friendly': 'In progress',
          'gateway_account_id': gatewayAccountId,
          'updated': DISPLAY_DATE,
          'created': DISPLAY_DATE,
          'link': paths.generateRoute(paths.transactions.detail, { chargeId: 100 })

        },
        {
          'charge_id': '101',
          'gateway_transaction_id': 'tnx-id-2',
          'amount': '£20.00',
          'reference': 'ref2',
          'email': 'alice.111@mail.fake',
          transaction_type: 'charge',
          'state': {
            'status': 'success',
            'finished': false
          },
          'card_brand': 'Visa',
          'state_friendly': 'Success',
          'gateway_account_id': gatewayAccountId,
          'updated': DISPLAY_DATE,
          'created': DISPLAY_DATE,
          'link': paths.generateRoute(paths.transactions.detail, { chargeId: 101 })
        }
      ]
    }

    getTransactionList()
      .expect(200)
      .expect(function (res) {
        res.body.results.should.eql(expectedData.results)
      })
      .end(done)
  })

  it('should display page with empty list of transactions if no records returned by connector', function (done) {
    connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
      .reply(200, ALL_CARD_TYPES)

    const connectorData = {
      'results': []
    }
    connectorMockResponds(200, connectorData, connectorSearchParameters)

    getTransactionList()
      .expect(200)
      .expect(function (res) {
        res.body.results.should.eql([])
      })
      .end(done)
  })

  it('should show error message on a bad request while retrieving the list of transactions', function (done) {
    const errorMessage = 'Unable to retrieve list of transactions.'
    connectorMockResponds(400, { 'message': errorMessage }, connectorSearchParameters)

    getTransactionList()
      .expect(500, { 'message': errorMessage })
      .end(done)
  })

  it('should show a generic error message on a connector service error while retrieving the list of transactions', function (done) {
    connectorMockResponds(500, { 'message': 'some error from connector' }, connectorSearchParameters)

    getTransactionList()
      .expect(500, { 'message': 'Unable to retrieve list of transactions.' })
      .end(done)
  })

  it('should show internal error message if any error happens while retrieving the list of transactions', function (done) {
    // No connectorMock defined on purpose to mock a network failure

    getTransactionList()
      .expect(500, { 'message': 'Unable to retrieve list of transactions.' })
      .end(done)
  })
})


describe.only('The /transactions endpoint filtering', () => {
  afterEach(function () {
    nock.cleanAll()
    app = null
  })

  beforeEach(function (done) {
    const permissions = 'transactions:read'
    const user = session.getUser({
      gateway_account_ids: [gatewayAccountId],
      permissions: [{ name: permissions }]
    })
    app = session.getAppWithLoggedInUser(getApp(), user)

    userCreator.mockUserResponse(user.toJson(), done)
  })

  it('should show all options in state filter', function (done) {
    connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
      .reply(200, ALL_CARD_TYPES)

    const connectorData = {
      'results': []
    }

    connectorMockResponds(200, connectorData, connectorSearchParameters)

    getTransactionList()
      .expect(200)
      .expect(function (res) {
        expect(res.body.eventStates).property('length').to.equal(10)
        expect(res.body.eventStates.map(state => state.text)).to.deep.equal([
          'Any',
          'In progress',
          'Success',
          'Declined',
          'Timed out',
          'Cancelled',
          'Error',
          'Refund submitted',
          'Refund error',
          'Refund success'
        ])
      })
      .end(done)
  })

  it('should allow filtering by charge states', function (done) {
    connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
      .reply(200, ALL_CARD_TYPES)

    const connectorData = {
      'results': []
    }

    connectorMockResponds(200, connectorData, { payment_states: 'created,started,submitted' })

    request(app)
      .get(paths.transactions.index)
      .query({ state: 'In progress' })
      .set('Accept', 'application/json')
      .set('x-request-id', requestId)
      .expect(200)
      .expect(function (res) {
        expect(res.body.eventStates).property('length').to.equal(10)
        expect(res.body.eventStates.map(state => state.text)).to.deep.equal([
          'Any',
          'In progress',
          'Success',
          'Declined',
          'Timed out',
          'Cancelled',
          'Error',
          'Refund submitted',
          'Refund error',
          'Refund success'
        ])
        res.body.downloadTransactionLink.should.eql('/transactions/download?payment_states=created&payment_states=started&payment_states=submitted')
      })
      .end(done)
  })

  it('should allow filtering by refund states', function (done) {
    connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
      .reply(200, ALL_CARD_TYPES)

    const connectorData = {
      'results': []
    }

    connectorMockResponds(200, connectorData, { refund_states: 'submitted' })

    request(app)
      .get(paths.transactions.index)
      .query({ state: 'Refund submitted' })
      .set('Accept', 'application/json')
      .set('x-request-id', requestId)
      .expect(200)
      .expect(function (res) {
        expect(res.body.eventStates).property('length').to.equal(10)
        expect(res.body.eventStates.map(state => state.text)).to.deep.equal([
          'Any',
          'In progress',
          'Success',
          'Declined',
          'Timed out',
          'Cancelled',
          'Error',
          'Refund submitted',
          'Refund error',
          'Refund success'
        ])
        res.body.downloadTransactionLink.should.eql('/transactions/download?refund_states=submitted')
      })
      .end(done)
  })

  it('should correctly map cardholder_name and last_digits_card_number to the CSV download link', function (done) {
    connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
      .reply(200, ALL_CARD_TYPES)

    const expectedCSVFilters = {
      cardholderName: 'example-name',
      lastDigitsCardNumber: '9304'
    }

    const connectorData = {
      'results': []
    }

    connectorMockResponds(200, connectorData, expectedCSVFilters)

    request(app)
      .get(paths.transactions.index)
      .query(expectedCSVFilters)
      .set('Accept', 'application/json')
      .set('x-request-id', requestId)
      .expect(200)
      .expect(function (res) {
        // This will only be formatted correctly if utils/transaction_view maps filters correctly the CSV download link returned to the client
        res.body.downloadTransactionLink.should.eql(
          `/transactions/download?cardholderName=${expectedCSVFilters.cardholderName}&lastDigitsCardNumber=${expectedCSVFilters.lastDigitsCardNumber}`
        )
      })
      .end(done)
  })
})

function connectorMockResponds (code, data, searchParameters) {
  const queryString = getQueryStringForParams(searchParameters)

  return connectorMock.get(CONNECTOR_CHARGES_API_PATH + '?' + queryString)
    .reply(code, data)
}

function getTransactionList () {
  return request(app)
    .get(paths.transactions.index)
    .set('Accept', 'application/json')
    .set('x-request-id', requestId)
}
