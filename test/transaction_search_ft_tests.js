var request = require('supertest');
var portfinder = require('portfinder');
var nock = require('nock');
var app = require(__dirname + '/../server.js').getApp;

var winston = require('winston');

portfinder.getPort(function (err, connectorPort) {
  var gatewayAccountId = 452345;
  var CONNECTOR_CHARGES_PATH = '/v1/frontend/charges';
  var TRANSACTION_LIST_PATH = '/selfservice/transactions/' + gatewayAccountId;

  var localServer = 'http://localhost:' + connectorPort;
  var connectorMock = nock(localServer);

  function connectorMock_responds(data, searchParameters) {
    var queryStr = '?gatewayAccountId=' + gatewayAccountId;
    if (searchParameters) {
       queryStr = searchParameters.reference ? queryStr+= '&reference=' + searchParameters.reference : queryStr;
       queryStr = searchParameters.status ? queryStr+= '&status=' + searchParameters.status  : queryStr;
       queryStr = searchParameters.fromDate ? queryStr+= '&fromDate=' + searchParameters.fromDate : queryStr;
       queryStr = searchParameters.toDate ? queryStr+= '&toDate=' + searchParameters.toDate : queryStr;
    }
    return connectorMock.get(CONNECTOR_CHARGES_PATH + encodeURI(queryStr))
      .reply(200, data);
  }

  function search_transactions(data) {
    return request(app).post(TRANSACTION_LIST_PATH)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/x-www-form-urlencoded')
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
                    'status': 'TEST STATUS'
                  },
                  {
                    'charge_id': '101',
                    'gateway_transaction_id': 'tnx-id-2',
                    'amount': 2000,
                    'reference': 'ref2',
                    'status': 'TEST STATUS 2'
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
                    'gateway_account_id': '452345'
                  },
                  {
                    'charge_id': '101',
                    'gateway_transaction_id': 'tnx-id-2',
                    'amount': '20.00',
                    'reference': 'ref2',
                    'status': 'TEST STATUS 2',
                    'gateway_account_id': '452345'
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
                    'status': 'TEST STATUS'
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
                    'gateway_account_id': '452345'
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
                    'status': 'TEST_STATUS'
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
                    'gateway_account_id': '452345'
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
                    'status': 'TEST_STATUS'
                  }
                ]
              };

              var data= {
                'reference': 'ref1',
                'status': 'TEST_STATUS',
                'fromDate': '2016-01-01 01:00:00',
                'toDate': '2020-01-01 01:00:00'
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
                    'gateway_account_id': '452345'
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



        });
    });

});

