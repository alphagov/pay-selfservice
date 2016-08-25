var dbMock      = require(__dirname + '/../test_helpers/db_mock.js');
var request     = require('supertest');
var portfinder  = require('portfinder');
var csrf        = require('csrf');
var nock        = require('nock');
var _app        = require(__dirname + '/../../server.js').getApp;
var dates       = require('../../app/utils/dates.js');
var paths       = require(__dirname + '/../../app/paths.js');
var winston     = require('winston');
var session     = require(__dirname + '/../test_helpers/mock_session.js');
var querystring = require('querystring');
var _           = require('lodash');

var gatewayAccountId = 452345;

var app = session.mockValidAccount(_app, gatewayAccountId);

portfinder.getPort(function (err, connectorPort) {

  var CHARGES_SEARCH_API_PATH = '/v1/api/accounts/' + gatewayAccountId + '/charges';

  var localServer = 'http://localhost:' + connectorPort;
  var connectorMock = nock(localServer);
  var CONNECTOR_DATE = new Date();
  var DISPLAY_DATE = dates.utcToDisplay(CONNECTOR_DATE);

  function connectorMock_responds(data, searchParameters) {
    var queryString = querystring.stringify({
      reference: searchParameters.reference ? searchParameters.reference : '',
      email: searchParameters.email ? searchParameters.email : '',
      state: searchParameters.state ? searchParameters.state : '',
      from_date: searchParameters.fromDate ? searchParameters.fromDate : '',
      to_date: searchParameters.toDate ? searchParameters.toDate : '',
      page: searchParameters.page ? searchParameters.page : "1",
      display_size: searchParameters.pageSize ? searchParameters.pageSize : "100"
    });

    return connectorMock.get(CHARGES_SEARCH_API_PATH + '?' + queryString)
      .reply(200, data);
  }

  function search_transactions(data) {
    var query = querystring.stringify(data);

    return request(app).get(paths.transactions.index + "?" + query)
      .set('Accept', 'application/json').send();
  }

  describe('Transactions endpoints', function () {

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
                    'email': 'alice.111@mail.fake',
                    'state': {
                      'status': 'testing',
                      'finished' : false
                    },
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
                      'finished' : false
                    },
                    'updated': CONNECTOR_DATE,
                    'created_date': CONNECTOR_DATE,
                    "link": paths.generateRoute(paths.transactions.show,{chargeId: 101})
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
                    'email': 'alice.111@mail.fake',
                    'state': {
                      'status': 'testing',
                      'finished' : false
                    },
                    'state_friendly': 'Testing',
                    'gateway_account_id': 452345,
                    'updated': DISPLAY_DATE,
                    'created': DISPLAY_DATE,
                    "link": paths.generateRoute(paths.transactions.show,{chargeId: 100})

                  },
                  {
                    'charge_id': '101',
                    'gateway_transaction_id': 'tnx-id-2',
                    'amount': '20.00',
                    'reference': 'ref2',
                    'email': 'alice.111@mail.fake',
                    'state': {
                      'status': 'testing2',
                      'finished' : false
                    },
                    'state_friendly': 'Testing2',
                    'gateway_account_id': 452345,
                    'updated': DISPLAY_DATE,
                    'created': DISPLAY_DATE,
                    "link": paths.generateRoute(paths.transactions.show,{chargeId: 101})

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
                    'email': 'alice.111@mail.fake',
                    'state': {
                      'status': 'testing',
                      'finished' : false
                    },
                    'updated': CONNECTOR_DATE,
                    'created_date': CONNECTOR_DATE

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
                    'email': 'alice.111@mail.fake',
                    'state': {
                      'status': 'testing',
                      'finished' : false
                    },
                    'state_friendly': 'Testing',
                    'gateway_account_id': 452345,
                    'updated': DISPLAY_DATE,
                    'created': DISPLAY_DATE,
                    "link": paths.generateRoute(paths.transactions.show,{chargeId: 100})
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
                      'finished' : false
                    },
                    'updated': CONNECTOR_DATE,
                    'created_date': CONNECTOR_DATE
                  }
                ]
              };
              var data= {'email': 'alice'};
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
                      'finished' : false
                    },
                    'state_friendly': 'Testing',
                    'gateway_account_id': 452345,
                    'updated': DISPLAY_DATE,
                    'created': DISPLAY_DATE,
                    "link": paths.generateRoute(paths.transactions.show,{chargeId: 100})

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
                      'finished' : false
                    },
                    'updated': CONNECTOR_DATE,
                    'created_date': CONNECTOR_DATE

                  }
                ]
              };
              var data= {'email': 'alice.111@mail.fake'};
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
                      'finished' : false
                    },
                    'state_friendly': 'Testing',
                    'gateway_account_id': 452345,
                    'updated': DISPLAY_DATE,
                    'created': DISPLAY_DATE,
                    "link": paths.generateRoute(paths.transactions.show,{chargeId: 100})
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
                    'email': 'alice.111@mail.fake',
                    'state': {
                      'status': 'testing',
                      'finished' : false
                    },
                    'state_friendly': 'Testing',
                    'updated': CONNECTOR_DATE,
                    'created_date': CONNECTOR_DATE
                  }
                ]
              };
              var data= {'reference': 'ref1', 'state': 'TEST_STATUS'};
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
                      'finished' : false
                    },
                    'state_friendly': 'Testing',
                    'gateway_account_id': 452345,
                    'updated': DISPLAY_DATE,
                    'created': DISPLAY_DATE,
                    "link": paths.generateRoute(paths.transactions.show,{chargeId: 100})
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
                    'email': 'alice.111@mail.fake',
                    'state': {
                      'status': 'testing',
                      'finished' : false
                    },
                    'updated': '2016-01-11 01:01:01',
                    'created_date': '2016-01-11 01:01:01'
                  }
                ]
              };

        var data = {
          'reference': 'ref1',
          'state': 'TEST_STATUS',
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
                      'finished' : false
                    },
                    'state_friendly': 'Testing',
                    'gateway_account_id': 452345,
                    'updated': '11 Jan 2016 — 01:01:01',
                    'created': '11 Jan 2016 — 01:01:01',
                    "link": paths.generateRoute(paths.transactions.show,{chargeId: 100})
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

