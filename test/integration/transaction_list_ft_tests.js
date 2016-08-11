var request     = require('supertest');
var portfinder  = require('portfinder');
var nock        = require('nock');
var _app         = require(__dirname + '/../../server.js').getApp;
var dates       = require('../../app/utils/dates.js');
var winston     = require('winston');
var paths       = require(__dirname + '/../../app/paths.js');
var session     = require(__dirname + '/../test_helpers/mock_session.js');
var CONNECTOR_DATE = "2016-02-10T12:44:01.000Z";
var DISPLAY_DATE = "10 Feb 2016 — 12:44:01";
var gatewayAccountId = 651342;

var app = session.mockValidAccount(_app, gatewayAccountId);

portfinder.getPort(function (err, connectorPort) {

  var searchParameters= {};
  var CHARGES_API_PATH = '/v1/api/accounts/' + gatewayAccountId + '/charges';

  var localServer = 'http://localhost:' + connectorPort;
  var connectorMock = nock(localServer);

  function connectorMock_responds(code, data, searchParameters) {
      var queryStr = '?';
          queryStr+=  'reference=' + (searchParameters.reference ? searchParameters.reference : '') +
                      '&state=' + (searchParameters.state ? searchParameters.state : '') +
                      '&from_date=' + (searchParameters.fromDate ? searchParameters.fromDate : '') +
                      '&to_date=' + (searchParameters.toDate ? searchParameters.toDate : '') +
                      '&page=' + (searchParameters.page ? searchParameters.page : "1") +
                      '&display_size=' + (searchParameters.pageSize ? searchParameters.pageSize : "100");

      return connectorMock.get(CHARGES_API_PATH + encodeURI(queryStr))
        .reply(code, data);
    }

  function get_transaction_list() {
    return request(app)
      .get(paths.transactions.index)
      .set('Accept', 'application/json');
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

    describe('The /transactions endpoint', function () {
      it('should return a list of transactions for the gateway account', function (done) {
        var connectorData = {
          'results': [
            {
              'charge_id': '100',
              'gateway_transaction_id': 'tnx-id-1',
              'amount': 5000,
              'reference': 'ref1',
              'email':'alice.111@mail.fake',
              'state': {
                'status': 'testing',
                'finished': false
              },
              'updated': CONNECTOR_DATE,
              'created_date': CONNECTOR_DATE

            },
            {
              'charge_id': '101',
              'gateway_transaction_id': 'tnx-id-2',
              'amount': 2000,
              'reference': 'ref2',
              'state': {
                'status': 'testing2',
                'finished': false
              },
              'updated': CONNECTOR_DATE,
              'created_date': CONNECTOR_DATE

            }
          ]
        };

        connectorMock_responds(200, connectorData, searchParameters);

        var expectedData = {
          'results': [
            {
              'charge_id': '100',
              'gateway_transaction_id': 'tnx-id-1',
              'amount': '50.00',
              'reference': 'ref1',
              'email':'alice.111@mail.fake',
              'state': {
                'status': 'testing',
                'finished': false
              },
              'state_friendly': 'Testing',
              'gateway_account_id': gatewayAccountId,
              'updated': DISPLAY_DATE,
              'created': DISPLAY_DATE,
              "link": paths.generateRoute(paths.transactions.show,{chargeId: 100})
            },
            {
              'charge_id': '101',
              'gateway_transaction_id': 'tnx-id-2',
              'amount': '20.00',
              'reference': 'ref2',
              'state': {
                'status': 'testing2',
                'finished': false
              },
              'state_friendly': 'Testing2',
              'gateway_account_id': gatewayAccountId,
              'updated': DISPLAY_DATE,
              'created': DISPLAY_DATE,
              "link": paths.generateRoute(paths.transactions.show,{chargeId: 101})
            }
          ]
        };

        get_transaction_list()
            .expect(200)
            .expect(function(res) {
               res.body.results.should.eql(expectedData.results);
             })
            .end(done);
      });

      it('should return a list of transactions for the gateway account', function (done) {
        var connectorData = {
          'results': [
            {
              'charge_id': '100',
              'gateway_transaction_id': 'tnx-id-1',
              'amount': 5000,
              'reference': 'ref1',
              'email':'alice.111@mail.fake',
              'state': {
                'status': 'testing',
                'finished': false
              },
              'updated': CONNECTOR_DATE,
              'created_date': CONNECTOR_DATE

            },
            {
              'charge_id': '101',
              'gateway_transaction_id': 'tnx-id-2',
              'amount': 2000,
              'reference': 'ref2',
              'state': {
                'status': 'testing2',
                'finished': false
              },
              'updated': CONNECTOR_DATE,
              'created_date': CONNECTOR_DATE

            }
          ]
        };

        connectorMock_responds(200, connectorData, {state: "started"});
          request(app)
            .get(paths.transactions.index + "?state=started")
            .set('Accept', 'application/json')
            .expect(200)
            .expect(function(res) {
               res.body.downloadTransactionLink.should.eql("/transactions/download?state=started");
             })
            .end(done);
      });





      it('should return a list of transactions for the gateway account with reference missing', function (done) {
        var connectorData = {
          'results': [
            {
              'charge_id': '100',
              'gateway_transaction_id': 'tnx-id-1',
              'amount': 5000,
              'email':'alice.111@mail.fake',
              'state': {
                'status': 'testing',
                'finished': false
              },
              'updated': CONNECTOR_DATE,
              'created_date': CONNECTOR_DATE

            },
            {
              'charge_id': '101',
              'gateway_transaction_id': 'tnx-id-2',
              'amount': 2000,
              'reference': 'ref2',
              'email':'alice.111@mail.fake',
              'state': {
                'status': 'testing2',
                'finished': false
              },
              'updated': CONNECTOR_DATE,
              'created_date': CONNECTOR_DATE
            }
          ]
        };

        connectorMock_responds(200, connectorData, searchParameters);

        var expectedData = {
          'results': [
            {
              'charge_id': '100',
              'gateway_transaction_id': 'tnx-id-1',
              'amount': '50.00',
              'email':'alice.111@mail.fake',
              'state': {
                'status': 'testing',
                'finished': false
              },
              'state_friendly': 'Testing',
              'gateway_account_id': gatewayAccountId,
              'updated': DISPLAY_DATE,
              'created': DISPLAY_DATE,
              "link": paths.generateRoute(paths.transactions.show,{chargeId: 100})

            },
            {
              'charge_id': '101',
              'gateway_transaction_id': 'tnx-id-2',
              'amount': '20.00',
              'reference': 'ref2',
              'email':'alice.111@mail.fake',
              'state': {
                'status': 'testing2',
                'finished': false
              },
              'state_friendly': 'Testing2',
              'gateway_account_id': gatewayAccountId,
              'updated': DISPLAY_DATE,
              'created': DISPLAY_DATE,
              "link": paths.generateRoute(paths.transactions.show,{chargeId: 101})
            }
          ]
        };

        get_transaction_list()
          .expect(200)
          .expect(function(res) {
            res.body.results.should.eql(expectedData.results);
          })
          .end(done);
      });

      it('should display page with empty list of transactions if no records returned by connector', function (done) {
        var connectorData = {
          'results': []
        };
        connectorMock_responds(200, connectorData, searchParameters);

        get_transaction_list()
          .expect(200)
          .expect(function(res) {
            res.body.results.should.eql([]);
          })
          .end(done);
      });

      it('should show error message on a bad request', function (done) {
        var errorMessage = 'Unable to retrieve list of transactions.';
        connectorMock_responds(400, {'message': errorMessage}, searchParameters);

        get_transaction_list()
          .expect(200, {'message': errorMessage})
          .end(done);
      });

      it('should show a generic error message on a connector service error.', function (done) {
        connectorMock_responds(500, {'message': 'some error from connector'}, searchParameters);

        get_transaction_list()
          .expect(200, {'message': 'Unable to retrieve list of transactions.'})
          .end(done);
      });

      it('should show internal error message if any error happens while retrieving the list from connector', function (done){
        // No connectorMock defined on purpose to mock a network failure

        get_transaction_list()
          .expect(200, {'message': 'Unable to retrieve list of transactions.'})
          .end(done);
      });
    });
  });
});
