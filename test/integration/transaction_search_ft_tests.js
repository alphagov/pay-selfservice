var dbMock = require(__dirname + '/../test_helpers/db_mock.js');
var userPermissions = require(__dirname + '/../test_helpers/user_permissions.js');
var request = require('supertest');
var csrf = require('csrf');
var nock = require('nock');
var _app = require(__dirname + '/../../server.js').getApp;
var dates = require('../../app/utils/dates.js');
var paths = require(__dirname + '/../../app/paths.js');
var winston = require('winston');
var session = require(__dirname + '/../test_helpers/mock_session.js');
var querystring = require('querystring');
var _ = require('lodash');

var gatewayAccountId = 452345;

var app = session.getAppWithLoggedInSession(_app, gatewayAccountId);
var user = session.user;

var CONNECTOR_CHARGES_SEARCH_API_PATH = '/v1/api/accounts/' + gatewayAccountId + '/charges';
var CONNECTOR_ALL_CARD_TYPES_API_PATH = "/v1/api/card-types";

var connectorMock = nock(process.env.CONNECTOR_URL);
var CONNECTOR_DATE = new Date();
var DISPLAY_DATE = dates.utcToDisplay(CONNECTOR_DATE);

var ALL_CARD_TYPES = {
  "card_types": [
    {"id": "1", "brand": "mastercard", "label": "Mastercard", "type": "CREDIT"},
    {"id": "2", "brand": "mastercard", "label": "Mastercard", "type": "DEBIT"},
    {"id": "3", "brand": "discover", "label": "Discover", "type": "CREDIT"},
    {"id": "4", "brand": "maestro", "label": "Maestro", "type": "DEBIT"}]
};

function connectorMock_responds(data, searchParameters) {
  var queryString = querystring.stringify({
    reference: searchParameters.reference ? searchParameters.reference : '',
    email: searchParameters.email ? searchParameters.email : '',
    state: searchParameters.state ? searchParameters.state : '',
    card_brand: searchParameters.brand ? searchParameters.brand : '',
    from_date: searchParameters.fromDate ? searchParameters.fromDate : '',
    to_date: searchParameters.toDate ? searchParameters.toDate : '',
    page: searchParameters.page ? searchParameters.page : "1",
    display_size: searchParameters.pageSize ? searchParameters.pageSize : "100"
  });

  return connectorMock.get(CONNECTOR_CHARGES_SEARCH_API_PATH + '?' + queryString)
    .reply(200, data);
}

function search_transactions(data) {
  var query = querystring.stringify(data);

  return request(app).get(paths.transactions.index + "?" + query)
    .set('Accept', 'application/json').send();
}

describe('Transactions endpoints', function () {
  describe('The search transactions endpoint', function () {

    before(function (done) {
      winston.level = 'none';
      var userAttributes = {
        username: user.username,
        password: 'password10',
        gateway_account_id: user.gateway_account_id,
        email: user.email,
        telephone_number: "1"
      };
      userPermissions.create(userAttributes, 'transactions:read', done);
    });

    beforeEach(function () {
      nock.cleanAll();

      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(200, ALL_CARD_TYPES);
    });

    it('should return a list of transactions for the gateway account when searching by partial reference', function (done) {
      var connectorData = {
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
            "link": paths.generateRoute(paths.transactions.show, {chargeId: 101})
          }
        ]
      };
      var searchParameters = {'reference': 'ref'};
      connectorMock_responds(connectorData, searchParameters);

      var expectedData = {
        'results': [
          {
            'charge_id': '100',
            'gateway_transaction_id': 'tnx-id-1',
            'amount': '50.00',
            'reference': 'ref1',
            'email': 'alice.111@mail.fake',
            'state': {
              'status': 'testing',
              'finished': false
            },
            'card_brand': 'Visa',
            'state_friendly': 'Testing',
            'gateway_account_id': 452345,
            'updated': DISPLAY_DATE,
            'created': DISPLAY_DATE,
            "link": paths.generateRoute(paths.transactions.show, {chargeId: 100})

          },
          {
            'charge_id': '101',
            'gateway_transaction_id': 'tnx-id-2',
            'amount': '20.00',
            'reference': 'ref2',
            'email': 'alice.111@mail.fake',
            'state': {
              'status': 'testing2',
              'finished': false
            },
            'card_brand': 'Visa',
            'state_friendly': 'Testing2',
            'gateway_account_id': 452345,
            'updated': DISPLAY_DATE,
            'created': DISPLAY_DATE,
            "link": paths.generateRoute(paths.transactions.show, {chargeId: 101})

          }
        ]
      };


      search_transactions(searchParameters)
        .expect(200)
        .expect(function (res) {
          res.body.results.should.eql(expectedData.results);
        })
        .end(done);
    });


    it('should return a list of transactions for the gateway account when searching by full reference', function (done) {

      var connectorData = {
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
      };
      var data = {'reference': 'ref1'};
      connectorMock_responds(connectorData, data);

      var expectedData = {
        'results': [
          {
            'charge_id': '100',
            'gateway_transaction_id': 'tnx-id-1',
            'amount': '50.00',
            'reference': 'ref1',
            'email': 'alice.111@mail.fake',
            'state': {
              'status': 'testing',
              'finished': false
            },
            'card_brand': 'Visa',
            'state_friendly': 'Testing',
            'gateway_account_id': 452345,
            'updated': DISPLAY_DATE,
            'created': DISPLAY_DATE,
            "link": paths.generateRoute(paths.transactions.show, {chargeId: 100})
          }
        ]
      };

      search_transactions(data)
        .expect(200)
        .expect(function (res) {
          res.body.results.should.eql(expectedData.results);
        })
        .end(done);
    });

    it('should return a list of transactions for the gateway account when searching by partial email', function (done) {

      var connectorData = {
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
      };
      var data = {'email': 'alice'};
      connectorMock_responds(connectorData, data);

      var expectedData = {
        'results': [
          {
            'charge_id': '100',
            'gateway_transaction_id': 'tnx-id-1',
            'amount': '50.00',
            'reference': 'ref1',
            'email': 'alice.111@mail.fake',
            'state': {
              'status': 'testing',
              'finished': false
            },
            'card_brand': 'Visa',
            'state_friendly': 'Testing',
            'gateway_account_id': 452345,
            'updated': DISPLAY_DATE,
            'created': DISPLAY_DATE,
            "link": paths.generateRoute(paths.transactions.show, {chargeId: 100})

          }
        ]
      };

      search_transactions(data)
        .expect(200)
        .expect(function (res) {
          res.body.results.should.eql(expectedData.results);
        })
        .end(done);
    });


    it('should return a list of transactions for the gateway account when searching by full email', function (done) {

      var connectorData = {
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
      };
      var data = {'email': 'alice.111@mail.fake'};
      connectorMock_responds(connectorData, data);

      var expectedData = {
        'results': [
          {
            'charge_id': '100',
            'gateway_transaction_id': 'tnx-id-1',
            'amount': '50.00',
            'reference': 'ref1',
            'email': 'alice.111@mail.fake',
            'state': {
              'status': 'testing',
              'finished': false
            },
            'card_brand': 'Visa',
            'state_friendly': 'Testing',
            'gateway_account_id': 452345,
            'updated': DISPLAY_DATE,
            'created': DISPLAY_DATE,
            "link": paths.generateRoute(paths.transactions.show, {chargeId: 100})
          }
        ]
      };

      search_transactions(data)
        .expect(200)
        .expect(function (res) {
          res.body.results.should.eql(expectedData.results);
        })
        .end(done);
    });

    it('should return a list of transactions for the gateway account when searching by card brand', function (done) {

      var connectorData = {
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
      };
      var data = {'brand': 'visa'};
      connectorMock_responds(connectorData, data);

      var expectedData = {
        'results': [
          {
            'charge_id': '100',
            'gateway_transaction_id': 'tnx-id-1',
            'amount': '50.00',
            'reference': 'ref1',
            'email': 'alice.111@mail.fake',
            'state': {
              'status': 'testing',
              'finished': false
            },
            'card_brand': 'Visa',
            'state_friendly': 'Testing',
            'gateway_account_id': 452345,
            'updated': DISPLAY_DATE,
            'created': DISPLAY_DATE,
            "link": paths.generateRoute(paths.transactions.show, {chargeId: 100})
          }
        ]
      };

      search_transactions(data)
        .expect(200)
        .expect(function (res) {
          res.body.results.should.eql(expectedData.results);
        })
        .end(done);
    });

    it('should return a list of transactions for the gateway account when searching by partial reference, status and brand', function (done) {

      var connectorData = {
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
      };
      var data = {'reference': 'ref1', 'state': 'TEST_STATUS', 'brand': 'visa'};
      connectorMock_responds(connectorData, data);

      var expectedData = {
        'results': [
          {
            'charge_id': '100',
            'gateway_transaction_id': 'tnx-id-1',
            'amount': '50.00',
            'reference': 'ref1',
            'email': 'alice.111@mail.fake',
            'state': {
              'status': 'testing',
              'finished': false
            },
            'card_brand': 'Visa',
            'state_friendly': 'Testing',
            'gateway_account_id': 452345,
            'updated': DISPLAY_DATE,
            'created': DISPLAY_DATE,
            "link": paths.generateRoute(paths.transactions.show, {chargeId: 100})
          }
        ]
      };

      search_transactions(data)
        .expect(200)
        .expect(function (res) {
          res.body.results.should.eql(expectedData.results);
        })
        .end(done);
    });

    it('should return a list of transactions for the gateway account when searching by partial reference, status, fromDate and toDate', function (done) {

      var connectorData = {
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
      };

      var data = {
        'reference': 'ref1',
        'state': 'TEST_STATUS',
        'brand': 'visa',
        'fromDate': '21/01/2016',
        'fromTime': '13:04:45',
        'toDate': '22/01/2016',
        'toTime': '14:12:18'
      };

      var queryStringParams = _.extend({}, data, {
        'fromDate': '2016-01-21T13:04:45.000Z',
        'toDate': '2016-01-22T14:12:19.000Z'
      });

      connectorMock_responds(connectorData, queryStringParams);

      var expectedData = {
        'results': [
          {
            'charge_id': '100',
            'gateway_transaction_id': 'tnx-id-1',
            'amount': '50.00',
            'reference': 'ref1',
            'email': 'alice.111@mail.fake',
            'state': {
              'status': 'testing',
              'finished': false
            },
            'card_brand': 'Visa',
            'state_friendly': 'Testing',
            'gateway_account_id': 452345,
            'updated': '11 Jan 2016 — 01:01:01',
            'created': '11 Jan 2016 — 01:01:01',
            "link": paths.generateRoute(paths.transactions.show, {chargeId: 100})
          }
        ]
      };

      search_transactions(data)
        .expect(200)
        .expect(function (res) {
          res.body.results.should.eql(expectedData.results);
        })
        .end(done);
    });

    it('should return no transactions', function (done) {

      var connectorData = {
        'results': []
      };

      var data = {'reference': 'test'};
      connectorMock_responds(connectorData, data);

      var expectedData = {
        'results': []
      };

      search_transactions(data)
        .expect(200)
        .expect(function (res) {
          res.body.results.should.eql(expectedData.results);
        })
        .end(done);
    });

  });
});


