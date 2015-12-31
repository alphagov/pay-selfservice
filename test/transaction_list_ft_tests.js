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

  function connectorMock_responds(data) {
    return connectorMock.get(CONNECTOR_CHARGES_PATH + "?gatewayAccountId=" + gatewayAccountId)
      .reply(200, data);
  }

  function get_transaction_list() {
    return request(app)
      .get(TRANSACTION_LIST_PATH)
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
        connectorMock_responds(connectorData);

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

        get_transaction_list()
          .expect(200, expectedData)
          .end(done);
      });

      it('should return a list of transactions for the gateway account with reference missing', function (done) {

        var connectorData = {
          'results': [
            {
              'charge_id': '100',
              'gateway_transaction_id': 'tnx-id-1',
              'amount': 5000,
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
        connectorMock_responds(connectorData);

        var expectedData = {
          'results': [
            {
              'charge_id': '100',
              'gateway_transaction_id': 'tnx-id-1',
              'amount': '50.00',
              'reference': '',
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

        get_transaction_list()
          .expect(200, expectedData)
          .end(done);
      });

      it('should display page with empty list of transactions if no records returned by connector', function (done) {
        var connectorData = {
          'results': []
        };
        connectorMock_responds(connectorData);

        get_transaction_list()
          .expect(200, {'results': []})
          .end(done);
      });

      it('should show error message on a bad request', function (done) {

        var errorMessage = 'some error from connector';
        connectorMock.get(CONNECTOR_CHARGES_PATH + "?gatewayAccountId=" + gatewayAccountId)
          .reply(400, {'message': errorMessage});

        get_transaction_list()
          .expect(200, {'message': errorMessage})
          .end(done);

      });

      it('should show a generic error message on a connector service error.', function (done) {

        connectorMock.get(CONNECTOR_CHARGES_PATH + "?gatewayAccountId=" + gatewayAccountId)
          .reply(500, {'message': 'some error from connector'});

        get_transaction_list()
          .expect(200, {'message': 'Unable to retrieve list of transactions.'})
          .end(done);

      });


      it('should return 404 when no gateway account id', function (done) {
        request(app)
          .get('/selfservice/transactions/')
          .set('Accept', 'application/json')
          .expect(404)
          .end(done);
      });

      it('should show internal error message if any error happens while retrieving the list from connector', function (done){

        // No connectorMock defined on purpose to mock a network failure

        get_transaction_list()
          .expect(200, {'message': 'Internal server error'})
          .end(done);

      });

    });

  });

});

