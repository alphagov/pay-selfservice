'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const path = require('path')
require(path.join(__dirname, '/../test_helpers/serialize_mock.js'))
const userCreator = require(path.join(__dirname, '/../test_helpers/user_creator.js'))
const request = require('supertest')
const nock = require('nock')
const getApp = require(path.join(__dirname, '/../../server.js')).getApp
const dates = require('../../app/utils/dates.js')
const paths = require(path.join(__dirname, '/../../app/paths.js'))
const session = require(path.join(__dirname, '/../test_helpers/mock_session.js'))
const querystring = require('querystring')
const getQueryStringForParams = require('../../app/utils/get_query_string_for_params')
const _ = require('lodash')
chai.use(chaiAsPromised)
chai.should()

const gatewayAccountId = '452345'

let app

const CONNECTOR_CHARGES_SEARCH_API_PATH = '/v2/api/accounts/' + gatewayAccountId + '/charges'
const CONNECTOR_ALL_CARD_TYPES_API_PATH = '/v1/api/card-types'

const connectorMock = nock(process.env.CONNECTOR_URL)
const CONNECTOR_DATE = new Date()
const DISPLAY_DATE = dates.utcToDisplay(CONNECTOR_DATE)

const ALL_CARD_TYPES = {
  'card_types': [
    {'id': '1', 'brand': 'mastercard', 'label': 'Mastercard', 'type': 'CREDIT'},
    {'id': '2', 'brand': 'mastercard', 'label': 'Mastercard', 'type': 'DEBIT'},
    {'id': '3', 'brand': 'discover', 'label': 'Discover', 'type': 'CREDIT'},
    {'id': '4', 'brand': 'maestro', 'label': 'Maestro', 'type': 'DEBIT'}]
}

function connectorMockResponds (data, searchParameters) {
  let queryString = '?' + getQueryStringForParams(searchParameters)

  return connectorMock.get(CONNECTOR_CHARGES_SEARCH_API_PATH + queryString)
    .reply(200, data)
}

function searchTransactions (data) {
  let query = querystring.stringify(data)

  return request(app).get(paths.transactions.index + '?' + query)
    .set('Accept', 'application/json').send()
}

describe('The search transactions endpoint', function () {
  afterEach(function () {
    nock.cleanAll()
    app = null
  })

  beforeEach(function (done) {
    let permissions = 'transactions:read'
    let user = session.getUser({
      gateway_account_ids: [gatewayAccountId], permissions: [{name: permissions}]
    })
    app = session.getAppWithLoggedInUser(getApp(), user)

    userCreator.mockUserResponse(user.toJson(), done)

    connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
      .reply(200, ALL_CARD_TYPES)
  })

  it('should return a list of transactions for the gateway account when searching by partial reference', function (done) {
    let connectorData = {
      'results': [
        {
          'charge_id': '100',
          'gateway_transaction_id': 'tnx-id-1',
          'amount': 5000,
          'reference': 'ref1',
          'email': 'alice.111@mail.fake',
          'state': {
            'status': 'testing',
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
          'state': {
            'status': 'testing2',
            'finished': false
          },
          'card_brand': 'Visa',
          'updated': CONNECTOR_DATE,
          'created_date': CONNECTOR_DATE,
          'link': paths.generateRoute(paths.transactions.detail, {chargeId: 101})
        }
      ]
    }
    let searchParameters = {'reference': 'ref'}
    connectorMockResponds(connectorData, searchParameters)

    let expectedData = {
      'results': [
        {
          'charge_id': '100',
          'gateway_transaction_id': 'tnx-id-1',
          'amount': '£50.00',
          'reference': 'ref1',
          'email': 'alice.111@mail.fake',
          'state': {
            'status': 'testing',
            'finished': false
          },
          'card_brand': 'Visa',
          'state_friendly': 'Testing',
          'gateway_account_id': '452345',
          'updated': DISPLAY_DATE,
          'created': DISPLAY_DATE,
          'link': paths.generateRoute(paths.transactions.detail, {chargeId: 100})

        },
        {
          'charge_id': '101',
          'gateway_transaction_id': 'tnx-id-2',
          'amount': '£20.00',
          'reference': 'ref2',
          'email': 'alice.111@mail.fake',
          'state': {
            'status': 'testing2',
            'finished': false
          },
          'card_brand': 'Visa',
          'state_friendly': 'Testing2',
          'gateway_account_id': '452345',
          'updated': DISPLAY_DATE,
          'created': DISPLAY_DATE,
          'link': paths.generateRoute(paths.transactions.detail, {chargeId: 101})

        }
      ]
    }

    searchTransactions(searchParameters)
      .expect(200)
      .expect(function (res) {
        res.body.results.should.eql(expectedData.results)
      })
      .end(done)
  })

  it('should return a list of transactions for the gateway account when searching by full reference', function (done) {
    let connectorData = {
      'results': [
        {
          'charge_id': '100',
          'gateway_transaction_id': 'tnx-id-1',
          'amount': 5000,
          'reference': 'ref1',
          'email': 'alice.111@mail.fake',
          'state': {
            'status': 'testing',
            'finished': false
          },
          'card_brand': 'Visa',
          'updated': CONNECTOR_DATE,
          'created_date': CONNECTOR_DATE

        }
      ]
    }
    let data = {'reference': 'ref1'}
    connectorMockResponds(connectorData, data)

    let expectedData = {
      'results': [
        {
          'charge_id': '100',
          'gateway_transaction_id': 'tnx-id-1',
          'amount': '£50.00',
          'reference': 'ref1',
          'email': 'alice.111@mail.fake',
          'state': {
            'status': 'testing',
            'finished': false
          },
          'card_brand': 'Visa',
          'state_friendly': 'Testing',
          'gateway_account_id': '452345',
          'updated': DISPLAY_DATE,
          'created': DISPLAY_DATE,
          'link': paths.generateRoute(paths.transactions.detail, {chargeId: 100})
        }
      ]
    }

    searchTransactions(data)
      .expect(200)
      .expect(function (res) {
        res.body.results.should.eql(expectedData.results)
      })
      .end(done)
  })

  it('should return a list of transactions for the gateway account when searching by partial email', function (done) {
    let connectorData = {
      'results': [
        {
          'charge_id': '100',
          'gateway_transaction_id': 'tnx-id-1',
          'amount': 5000,
          'reference': 'ref1',
          'email': 'alice.111@mail.fake',
          'state': {
            'status': 'testing',
            'finished': false
          },
          'card_brand': 'Visa',
          'updated': CONNECTOR_DATE,
          'created_date': CONNECTOR_DATE
        }
      ]
    }
    let data = {'email': 'alice'}
    connectorMockResponds(connectorData, data)

    let expectedData = {
      'results': [
        {
          'charge_id': '100',
          'gateway_transaction_id': 'tnx-id-1',
          'amount': '£50.00',
          'reference': 'ref1',
          'email': 'alice.111@mail.fake',
          'state': {
            'status': 'testing',
            'finished': false
          },
          'card_brand': 'Visa',
          'state_friendly': 'Testing',
          'gateway_account_id': '452345',
          'updated': DISPLAY_DATE,
          'created': DISPLAY_DATE,
          'link': paths.generateRoute(paths.transactions.detail, {chargeId: 100})

        }
      ]
    }

    searchTransactions(data)
      .expect(200)
      .expect(function (res) {
        res.body.results.should.eql(expectedData.results)
      })
      .end(done)
  })

  it('should return a list of transactions for the gateway account when searching by full email', function (done) {
    let connectorData = {
      'results': [
        {
          'charge_id': '100',
          'gateway_transaction_id': 'tnx-id-1',
          'amount': 5000,
          'reference': 'ref1',
          'email': 'alice.111@mail.fake',
          'state': {
            'status': 'testing',
            'finished': false
          },
          'card_brand': 'Visa',
          'updated': CONNECTOR_DATE,
          'created_date': CONNECTOR_DATE

        }
      ]
    }
    let data = {'email': 'alice.111@mail.fake'}
    connectorMockResponds(connectorData, data)

    let expectedData = {
      'results': [
        {
          'charge_id': '100',
          'gateway_transaction_id': 'tnx-id-1',
          'amount': '£50.00',
          'reference': 'ref1',
          'email': 'alice.111@mail.fake',
          'state': {
            'status': 'testing',
            'finished': false
          },
          'card_brand': 'Visa',
          'state_friendly': 'Testing',
          'gateway_account_id': '452345',
          'updated': DISPLAY_DATE,
          'created': DISPLAY_DATE,
          'link': paths.generateRoute(paths.transactions.detail, {chargeId: 100})
        }
      ]
    }

    searchTransactions(data)
      .expect(200)
      .expect(function (res) {
        res.body.results.should.eql(expectedData.results)
      })
      .end(done)
  })

  it('should return a list of transactions for the gateway account when searching by card brand', function (done) {
    let connectorData = {
      'results': [
        {
          'charge_id': '100',
          'gateway_transaction_id': 'tnx-id-1',
          'amount': 5000,
          'reference': 'ref1',
          'email': 'alice.111@mail.fake',
          'state': {
            'status': 'testing',
            'finished': false
          },
          'card_brand': 'Visa',
          'updated': CONNECTOR_DATE,
          'created_date': CONNECTOR_DATE

        }
      ]
    }
    let data = {'brand': 'visa'}
    connectorMockResponds(connectorData, data)

    let expectedData = {
      'results': [
        {
          'charge_id': '100',
          'gateway_transaction_id': 'tnx-id-1',
          'amount': '£50.00',
          'reference': 'ref1',
          'email': 'alice.111@mail.fake',
          'state': {
            'status': 'testing',
            'finished': false
          },
          'card_brand': 'Visa',
          'state_friendly': 'Testing',
          'gateway_account_id': '452345',
          'updated': DISPLAY_DATE,
          'created': DISPLAY_DATE,
          'link': paths.generateRoute(paths.transactions.detail, {chargeId: 100})
        }
      ]
    }

    searchTransactions(data)
      .expect(200)
      .expect(function (res) {
        res.body.results.should.eql(expectedData.results)
      })
      .end(done)
  })

  it('should return a list of transactions for the gateway account when searching by partial reference, status and brand', function (done) {
    let connectorData = {
      'results': [
        {
          'charge_id': '100',
          'gateway_transaction_id': 'tnx-id-1',
          'amount': 5000,
          'reference': 'ref1',
          'email': 'alice.111@mail.fake',
          'state': {
            'status': 'testing',
            'finished': false
          },
          'card_brand': 'Visa',
          'state_friendly': 'Testing',
          'updated': CONNECTOR_DATE,
          'created_date': CONNECTOR_DATE
        }
      ]
    }
    let data = { 'reference': 'ref1', 'payment_states': 'TEST_STATUS', 'brand': 'visa' }
    connectorMockResponds(connectorData, data)

    let expectedData = {
      'results': [
        {
          'charge_id': '100',
          'gateway_transaction_id': 'tnx-id-1',
          'amount': '£50.00',
          'reference': 'ref1',
          'email': 'alice.111@mail.fake',
          'state': {
            'status': 'testing',
            'finished': false
          },
          'card_brand': 'Visa',
          'state_friendly': 'Testing',
          'gateway_account_id': '452345',
          'updated': DISPLAY_DATE,
          'created': DISPLAY_DATE,
          'link': paths.generateRoute(paths.transactions.detail, {chargeId: 100})
        }
      ]
    }

    let formData = _.omit(_.merge({'state': data.payment_states}, data), 'payment_states')
    searchTransactions(formData)
      .expect(200)
      .expect(function (res) {
        res.body.results.should.eql(expectedData.results)
      })
      .end(done)
  })

  it('should return a list of transactions for the gateway account when searching by partial reference, status, fromDate and toDate', function (done) {
    let connectorData = {
      'results': [
        {
          'charge_id': '100',
          'gateway_transaction_id': 'tnx-id-1',
          'amount': 5000,
          'reference': 'ref1',
          'email': 'alice.111@mail.fake',
          'state': {
            'status': 'testing',
            'finished': false
          },
          'card_brand': 'Visa',
          'updated': '2016-01-11 01:01:01',
          'created_date': '2016-01-11 01:01:01'
        }
      ]
    }

    let data = {
      'reference': 'ref1',
      'payment_states': 'TEST_STATUS',
      'brand': 'visa',
      'fromDate': '21/01/2016',
      'fromTime': '13:04:45',
      'toDate': '22/01/2016',
      'toTime': '14:12:18'
    }

    let queryStringParams = _.extend({}, data, {
      'from_date': '2016-01-21T13:04:45.000Z',
      'to_date': '2016-01-22T14:12:19.000Z'
    })

    connectorMockResponds(connectorData, queryStringParams)

    let expectedData = {
      'results': [
        {
          'charge_id': '100',
          'gateway_transaction_id': 'tnx-id-1',
          'amount': '£50.00',
          'reference': 'ref1',
          'email': 'alice.111@mail.fake',
          'state': {
            'status': 'testing',
            'finished': false
          },
          'card_brand': 'Visa',
          'state_friendly': 'Testing',
          'gateway_account_id': '452345',
          'updated': '11 Jan 2016 — 01:01:01',
          'created': '11 Jan 2016 — 01:01:01',
          'link': paths.generateRoute(paths.transactions.detail, {chargeId: 100})
        }
      ]
    }

    let formData = _.omit(_.merge({'state': data.payment_states}, data), 'payment_states')
    searchTransactions(formData)
      .expect(200)
      .expect(function (res) {
        res.body.results.should.eql(expectedData.results)
      })
      .end(done)
  })

  it('should return no transactions', function (done) {
    let connectorData = {
      'results': []
    }

    let data = {'reference': 'test'}
    connectorMockResponds(connectorData, data)

    let expectedData = {
      'results': []
    }

    searchTransactions(data)
      .expect(200)
      .expect(function (res) {
        res.body.results.should.eql(expectedData.results)
      })
      .end(done)
  })
})
