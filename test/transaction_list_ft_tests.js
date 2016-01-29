process.env.SESSION_ENCRYPTION_KEY = 'naskjwefvwei72rjkwfmjwfi72rfkjwefmjwefiuwefjkbwfiu24fmjbwfk';

var request = require('supertest');
var portfinder = require('portfinder');
var nock = require('nock');
var app = require(__dirname + '/../server.js').getApp;
var auth_cookie = require(__dirname + '/utils/login-session.js');

var winston = require('winston');

portfinder.getPort(function (err, connectorPort) {
  var gatewayAccountId = 651342;
  var searchParameters= {};
  var CHARGES_API_PATH = '/v1/api/accounts/' + gatewayAccountId + '/charges';
  var TRANSACTION_LIST_PATH = '/selfservice/transactions';

  var localServer = 'http://localhost:' + connectorPort;
  var connectorMock = nock(localServer);
  var AUTH_COOKIE_VALUE = auth_cookie.create({passport:{user:{_json:{app_metadata:{account_id:gatewayAccountId}}}}});

  function connectorMock_responds(code, data, searchParameters) {
      var queryStr = '?';
          queryStr+=  'reference=' + (searchParameters.reference ? searchParameters.reference : '') +
                      '&status=' + (searchParameters.status ? searchParameters.status : '') +
                      '&from_date=' + (searchParameters.fromDate ? searchParameters.fromDate : '') +
                      '&to_date=' + (searchParameters.toDate ? searchParameters.toDate : '');
      return connectorMock.get(CHARGES_API_PATH + encodeURI(queryStr))
        .reply(code, data);
    }

  function get_transaction_list() {
    return request(app)
      .get(TRANSACTION_LIST_PATH)
      .set('Accept', 'application/json')
      .set('Cookie', ['session=' + AUTH_COOKIE_VALUE]);
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
        
        connectorMock_responds(200, connectorData, searchParameters);

        var expectedData = {
          'results': [
            {
              'charge_id': '100',
              'gateway_transaction_id': 'tnx-id-1',
              'amount': '50.00',
              'reference': 'ref1',
              'status': 'TEST STATUS',
              'gateway_account_id': gatewayAccountId
            },
            {
              'charge_id': '101',
              'gateway_transaction_id': 'tnx-id-2',
              'amount': '20.00',
              'reference': 'ref2',
              'status': 'TEST STATUS 2',
              'gateway_account_id': gatewayAccountId
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
        
        connectorMock_responds(200, connectorData, searchParameters);

        var expectedData = {
          'results': [
            {
              'charge_id': '100',
              'gateway_transaction_id': 'tnx-id-1',
              'amount': '50.00',
              'reference': '',
              'status': 'TEST STATUS',
              'gateway_account_id': gatewayAccountId
            },
            {
              'charge_id': '101',
              'gateway_transaction_id': 'tnx-id-2',
              'amount': '20.00',
              'reference': 'ref2',
              'status': 'TEST STATUS 2',
              'gateway_account_id': gatewayAccountId
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
          .expect(200, {'message': 'Internal server error'})
          .end(done);
      });
    });
  });
});
