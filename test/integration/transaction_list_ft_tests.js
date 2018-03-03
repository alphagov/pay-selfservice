'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
require('../test_helpers/serialize_mock.js')
const userCreator = require('../test_helpers/user_creator.js')
const request = require('supertest')
const nock = require('nock')
const getApp = require('../../server.js').getApp
const paths = require('../../app/paths.js')
const session = require('../test_helpers/mock_session.js')
const getQueryStringForParams = require('../../app/utils/get_query_string_for_params')

const CONNECTOR_DATE = '2016-02-10T12:44:01.000Z'
const DISPLAY_DATE = '10 Feb 2016 — 12:44:01'
const gatewayAccountId = '651342'
const {expect} = chai
const searchParameters = {}
const CONNECTOR_CHARGES_API_PATH = '/v1/api/accounts/' + gatewayAccountId + '/transactions'
const CONNECTOR_ALL_CARD_TYPES_API_PATH = '/v1/api/card-types'
const ALL_CARD_TYPES = {
  'card_types': [
    {'id': '1', 'brand': 'mastercard', 'label': 'Mastercard', 'type': 'CREDIT'},
    {'id': '2', 'brand': 'mastercard', 'label': 'Mastercard', 'type': 'DEBIT'},
    {'id': '3', 'brand': 'discover', 'label': 'Discover', 'type': 'CREDIT'},
    {'id': '4', 'brand': 'maestro', 'label': 'Maestro', 'type': 'DEBIT'}]
}
const requestId = 'unique-request-id'
const aCorrelationHeader = {
  reqheaders: {'x-request-id': requestId}
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
    let permissions = 'transactions:read'
    var user = session.getUser({
      gateway_account_ids: [gatewayAccountId], permissions: [{name: permissions}]
    })
    app = session.getAppWithLoggedInUser(getApp(), user)

    userCreator.mockUserResponse(user.toJson(), done)
  })

  it('should return a list of transactions for the gateway account', function (done) {
    connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
      .reply(200, ALL_CARD_TYPES)

    var connectorData = {
      'results': [
        {
          'charge_id': '100',
          'gateway_transaction_id': 'tnx-id-1',
          'amount': 5000,
          'reference': 'ref1',
          'email': 'alice.222@mail.fake',
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
          'created_date': CONNECTOR_DATE

        }
      ],
      total: 2
    }

    connectorMockResponds(200, connectorData, searchParameters)

    var expectedData = {
      'results': [
        {
          'charge_id': '100',
          'gateway_transaction_id': 'tnx-id-1',
          'amount': '£50.00',
          'reference': 'ref1',
          'email': 'alice.222@mail.fake',
          'state': {
            'status': 'testing',
            'finished': false
          },
          'card_brand': 'Visa',
          'state_friendly': 'Testing',
          'gateway_account_id': gatewayAccountId,
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
          'gateway_account_id': gatewayAccountId,
          'updated': DISPLAY_DATE,
          'created': DISPLAY_DATE,
          'link': paths.generateRoute(paths.transactions.detail, {chargeId: 101})
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

  it('should return a list of transactions for the gateway account', function (done) {
    connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
      .reply(200, ALL_CARD_TYPES)

    var connectorData = {
      'results': [
        {
          'charge_id': '100',
          'gateway_transaction_id': 'tnx-id-1',
          'amount': 5000,
          'reference': 'ref1',
          'email': 'alice.222@mail.fake',
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
          'created_date': CONNECTOR_DATE

        }
      ],
      total: 10001
    }

    connectorMockResponds(200, connectorData, searchParameters)

    var expectedData = {
      'results': [
        {
          'charge_id': '100',
          'gateway_transaction_id': 'tnx-id-1',
          'amount': '£50.00',
          'reference': 'ref1',
          'email': 'alice.222@mail.fake',
          'state': {
            'status': 'testing',
            'finished': false
          },
          'card_brand': 'Visa',
          'state_friendly': 'Testing',
          'gateway_account_id': gatewayAccountId,
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
          'gateway_account_id': gatewayAccountId,
          'updated': DISPLAY_DATE,
          'created': DISPLAY_DATE,
          'link': paths.generateRoute(paths.transactions.detail, {chargeId: 101})
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

  it('should return a list of transactions for the gateway account when a state is selected', function (done) {
    connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
      .reply(200, ALL_CARD_TYPES)

    var connectorData = {
      'results': [
        {
          'charge_id': '100',
          'gateway_transaction_id': 'tnx-id-1',
          'amount': 5000,
          'reference': 'ref1',
          'email': 'alice.222@mail.fake',
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
          'created_date': CONNECTOR_DATE

        }
      ]
    }

    connectorMockResponds(200, connectorData, {state: 'started', payment_states: 'started'})
    request(app)
      .get(paths.transactions.index + '?state=started')
      .set('Accept', 'application/json')
      .set('x-request-id', requestId)
      .expect(200)
      .expect(function (res) {
        res.body.downloadTransactionLink.should.eql('/transactions/download?state=started&payment_states=started')
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
          'created_date': CONNECTOR_DATE
        }
      ]
    }

    connectorMockResponds(200, connectorData, searchParameters)

    var expectedData = {
      'results': [
        {
          'charge_id': '100',
          'gateway_transaction_id': 'tnx-id-1',
          'amount': '£50.00',
          'email': 'alice.111@mail.fake',
          'state': {
            'status': 'testing',
            'finished': false
          },
          'card_brand': 'Visa',
          'state_friendly': 'Testing',
          'gateway_account_id': gatewayAccountId,
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
          'gateway_account_id': gatewayAccountId,
          'updated': DISPLAY_DATE,
          'created': DISPLAY_DATE,
          'link': paths.generateRoute(paths.transactions.detail, {chargeId: 101})
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

    var connectorData = {
      'results': []
    }
    connectorMockResponds(200, connectorData, searchParameters)

    getTransactionList()
      .expect(200)
      .expect(function (res) {
        res.body.results.should.eql([])
      })
      .end(done)
  })

  it('should show error message on a bad request while retrieving the list of transactions', function (done) {
    var errorMessage = 'Unable to retrieve list of transactions.'
    connectorMockResponds(400, {'message': errorMessage}, searchParameters)

    getTransactionList()
      .expect(500, {'message': errorMessage})
      .end(done)
  })

  it('should show a generic error message on a connector service error while retrieving the list of transactions', function (done) {
    connectorMockResponds(500, {'message': 'some error from connector'}, searchParameters)

    getTransactionList()
      .expect(500, {'message': 'Unable to retrieve list of transactions.'})
      .end(done)
  })

  it('should show internal error message if any error happens while retrieving the list of transactions', function (done) {
    // No connectorMock defined on purpose to mock a network failure

    getTransactionList()
      .expect(500, {'message': 'Unable to retrieve list of transactions.'})
      .end(done)
  })

  //
  // PP-1158 Fix 3 selfservice problematic tests in transaction_list_ft_tests
  //
  // These 3 tests have been commented out deliberately in selfservice due to a
  // very obscure condition causing an Uncaught Error: Can't set headers
  // after they are sent.
  //
  // This matter has already been investigate by a few team members but
  // with no real solution so far!
  //
  // The problem seems to be around promises being resolved aggressively in
  // tests resulting in the response being rendered more than once.
  //

  // it('should show error message on a bad request while retrieving the list of card brands', function (done) {
  //  var connectorData = {
  //    'results': []
  //  };
  //  connectorMockResponds(200, connectorData, searchParameters);
  //
  //  var errorMessage = 'Unable to retrieve list of card brands.';
  //  connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
  //    .reply(400, {'message': errorMessage});
  //
  //  getTransactionList()
  //    .expect(500, {'message': errorMessage})
  //    .end(done);
  // });

  // it('should show a generic error message on a connector service error while retrieving the list of card brands', function (done) {
  //  var connectorData = {
  //    'results': []
  //  };
  //  connectorMockResponds(200, connectorData, searchParameters);
  //
  //  connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
  //    .reply(500, {'message': 'some error from connector'});
  //
  //  getTransactionList()
  //    .expect(500, {'message': 'Unable to retrieve list of transactions.'})
  //    .end(done);
  // });

  // it('should show internal error message if any error happens while retrieving the list of card brands', function (done) {
  //
  //  var connectorData = {
  //    'results': []
  //  };
  //  connectorMockResponds(200, connectorData, searchParameters);
  //
  //  getTransactionList()
  //    .expect(500, {'message': 'Unable to retrieve list of transactions.'})
  //    .end(done);
  // });
})

describe('The /transactions endpoint (when feature flag: \'REFUNDS_IN_TX_LIST\' is enabled)', () => {
  afterEach(function () {
    nock.cleanAll()
    app = null
  })

  beforeEach(function (done) {
    let permissions = 'transactions:read'
    var user = session.getUser({
      gateway_account_ids: [gatewayAccountId], permissions: [{name: permissions}]
    })
    user.features = ['REFUNDS_IN_TX_LIST']
    app = session.getAppWithLoggedInUser(getApp(), user)

    userCreator.mockUserResponse(user.toJson(), done)
  })

  it('should allow filtering by charge and refund states', function (done) {
    connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
      .reply(200, ALL_CARD_TYPES)

    var connectorData = {
      'results': []
    }

    connectorMockResponds(200, connectorData, searchParameters)

    getTransactionList()
      .expect(200)
      .expect(function (res) {
        expect(res.body.eventStates).property('length').to.equal(10)
        expect(res.body.eventStates.map(state => state.value.text)).to.deep.equal([
          'Created',
          'Started',
          'Submitted',
          'Success',
          'Error',
          'Failed',
          'Cancelled',
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

    var connectorData = {
      'results': []
    }

    connectorMockResponds(200, connectorData, {state: 'started', payment_states: 'started'})

    request(app)
      .get(paths.transactions.index + '?state=payment-started')
      .set('Accept', 'application/json')
      .set('x-request-id', requestId)
      .expect(200)
      .expect(function (res) {
        expect(res.body.eventStates).property('length').to.equal(10)
        expect(res.body.eventStates.map(state => state.value.text)).to.deep.equal([
          'Created',
          'Started',
          'Submitted',
          'Success',
          'Error',
          'Failed',
          'Cancelled',
          'Refund submitted',
          'Refund error',
          'Refund success'
        ])
        res.body.downloadTransactionLink.should.eql('/transactions/download?state=started&payment_states=started')
      })
      .end(done)
  })

  it('should allow filtering by refund states', function (done) {
    connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
      .reply(200, ALL_CARD_TYPES)

    var connectorData = {
      'results': []
    }

    connectorMockResponds(200, connectorData, {state: 'started', refund_states: 'started'})

    request(app)
      .get(paths.transactions.index + '?state=refund-started')
      .set('Accept', 'application/json')
      .set('x-request-id', requestId)
      .expect(200)
      .expect(function (res) {
        expect(res.body.eventStates).property('length').to.equal(10)
        expect(res.body.eventStates.map(state => state.value.text)).to.deep.equal([
          'Created',
          'Started',
          'Submitted',
          'Success',
          'Error',
          'Failed',
          'Cancelled',
          'Refund submitted',
          'Refund error',
          'Refund success'
        ])
        res.body.downloadTransactionLink.should.eql('/transactions/download?state=started&refund_states=started')
      })
      .end(done)
  })
})

function connectorMockResponds (code, data, searchParameters) {
  var queryString = getQueryStringForParams(searchParameters)

  return connectorMock.get(CONNECTOR_CHARGES_API_PATH + '?' + queryString)
    .reply(code, data)
}

function getTransactionList () {
  return request(app)
    .get(paths.transactions.index)
    .set('Accept', 'application/json')
    .set('x-request-id', requestId)
}
