process.env.SESSION_ENCRYPTION_KEY = 'naskjwefvwei72rjkwfmjwfi72rfkjwefmjwefiuwefjkbwfiu24fmjbwfk';

var request = require('supertest');
var portfinder = require('portfinder');
var nock = require('nock');
var app = require(__dirname + '/../server.js').getApp;
var auth_cookie = require(__dirname + '/utils/login-session.js');
var dates = require('../app/utils/dates.js');


var winston = require('winston');

portfinder.getPort(function (err, connectorPort) {
  var gatewayAccountId = 452345;
  var CHARGES_SEARCH_API_PATH = '/v1/api/accounts/' + gatewayAccountId + '/charges';
  var TRANSACTIONS_SEARCH_PATH = '/selfservice/transactions';

  var localServer = 'http://localhost:' + connectorPort;
  var connectorMock = nock(localServer);
  var AUTH_COOKIE_VALUE = auth_cookie.create({passport:{user:{_json:{app_metadata:{account_id:gatewayAccountId}}}}});
  var CONNECTOR_DATE = new Date();
  var DISPLAY_DATE = dates.utcToDisplay(CONNECTOR_DATE);

  function connectorMock_responds(data, searchParameters) {
    var queryStr = '?';
        queryStr+=  'reference=' + (searchParameters.reference ? searchParameters.reference : '') +
                    '&status=' + (searchParameters.status ? searchParameters.status : '') +
                    '&from_date=' + (searchParameters.fromDate ? searchParameters.fromDate : '') +
                    '&to_date=' + (searchParameters.toDate ? searchParameters.toDate : '');
    return connectorMock.get(CHARGES_SEARCH_API_PATH + encodeURI(queryStr))
      .reply(200, data);
  }

  function search_transactions(data) {
    return request(app).post(TRANSACTIONS_SEARCH_PATH)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('Cookie', ['session=' + AUTH_COOKIE_VALUE])
      .send(data);
  }

  describe('Transactions endpoints', function() {

    beforeEach(function () {
      process.env.CONNECTOR_URL = localServer;
      nock.cleanAll();
    });

    before(function () {
      // Disable logging.
      winston.level = 'none';
    });

    describe('The search transactions endpoint', function () {

          it('should return a list of transactions for the gateway account when searching by partial reference', function (done) {

              var connectorData = {
                'results': [
                  {
                    'charge_id': '100',
                    'gateway_transaction_id': 'tnx-id-1',
                    'amount': 5000,
                    'reference': 'ref1',
                    'status': 'TEST STATUS',
                    'updated': CONNECTOR_DATE
                  },
                  {
                    'charge_id': '101',
                    'gateway_transaction_id': 'tnx-id-2',
                    'amount': 2000,
                    'reference': 'ref2',
                    'status': 'TEST STATUS 2',
                    'updated': CONNECTOR_DATE
                  }
                ]
              };
              var data= {'reference': 'ref'};
              connectorMock_responds(connectorData, data);

              var expectedData = {
                'results': [
                  {
                    'charge_id': '100',
                    'gateway_transaction_id': 'tnx-id-1',
                    'amount': '50.00',
                    'reference': 'ref1',
                    'status': 'TEST STATUS',
                    'gateway_account_id': 452345,
                    'updated': DISPLAY_DATE
                  },
                  {
                    'charge_id': '101',
                    'gateway_transaction_id': 'tnx-id-2',
                    'amount': '20.00',
                    'reference': 'ref2',
                    'status': 'TEST STATUS 2',
                    'gateway_account_id': 452345,
                    'updated': DISPLAY_DATE
                  }
                ]
              };

              search_transactions(data)
                  .expect(200)
                  .expect(function(res) {
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
                    'status': 'TEST STATUS',
                    'updated': CONNECTOR_DATE
                  }
                ]
              };
              var data= {'reference': 'ref1'};
              connectorMock_responds(connectorData, data);

              var expectedData = {
                'results': [
                  {
                    'charge_id': '100',
                    'gateway_transaction_id': 'tnx-id-1',
                    'amount': '50.00',
                    'reference': 'ref1',
                    'status': 'TEST STATUS',
                    'gateway_account_id': 452345,
                    'updated': DISPLAY_DATE
                  }
                ]
              };

              search_transactions(data)
                  .expect(200)
                  .expect(function(res) {
                           res.body.results.should.eql(expectedData.results);
                   })
                  .end(done);
            });

          it('should return a list of transactions for the gateway account when searching by partial reference and status', function (done) {

              var connectorData = {
                'results': [
                  {
                    'charge_id': '100',
                    'gateway_transaction_id': 'tnx-id-1',
                    'amount': 5000,
                    'reference': 'ref1',
                    'status': 'TEST_STATUS',
                    'updated': CONNECTOR_DATE
                  }
                ]
              };
              var data= {'reference': 'ref1', 'status': 'TEST_STATUS'};
              connectorMock_responds(connectorData, data);

              var expectedData = {
                'results': [
                  {
                    'charge_id': '100',
                    'gateway_transaction_id': 'tnx-id-1',
                    'amount': '50.00',
                    'reference': 'ref1',
                    'status': 'TEST_STATUS',
                    'gateway_account_id': 452345,
                    'updated': DISPLAY_DATE
                  }
                ]
              };

              search_transactions(data)
                  .expect(200)
                  .expect(function(res) {
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
                    'status': 'TEST_STATUS',
                    'updated': '2016-01-11 01:01:01'
                  }
                ]
              };

              var data= {
                'reference': 'ref1',
                'status': 'TEST_STATUS',
                'from_date': '01/01/2016',
                'to_date': '01/01/2020'
                };
              connectorMock_responds(connectorData, data);

              var expectedData = {
                'results': [
                  {
                    'charge_id': '100',
                    'gateway_transaction_id': 'tnx-id-1',
                    'amount': '50.00',
                    'reference': 'ref1',
                    'status': 'TEST_STATUS',
                    'gateway_account_id': 452345,
                    'updated': '11 Jan 2016 — 01:01'
                  }
                ]
              };

              search_transactions(data)
                  .expect(200)
                  .expect(function(res) {
                    res.body.results.should.eql(expectedData.results);
                   })
                  .end(done);
            });

          it('should return no transactions', function (done) {

              var connectorData = {
                'results': []
              };

              var data= {'reference': 'test'};
              connectorMock_responds(connectorData, data);

              var expectedData = {
                'results': []
              };

              search_transactions(data)
                  .expect(200)
                  .expect(function(res) {
                           res.body.results.should.eql(expectedData.results);
                   })
                  .end(done);
            });

        });
    });

});

