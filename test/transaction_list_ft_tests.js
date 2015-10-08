var request = require('supertest');
var portfinder = require('portfinder');
var nock = require('nock');
var app = require(__dirname + '/../server.js').getApp;

var winston = require('winston');

portfinder.getPort(function (err, connectorPort) {
  var gatewayAccountId = 452345;
  var connectorChargesPath = '/v1/frontend/charges';
  var txListPath = '/transactions/' + gatewayAccountId;

  var localServer = 'http://localhost:' + connectorPort;
  process.env.CONNECTOR_URL = localServer;
  var connectorMock = nock(localServer);

  function connectorMock_responds(data) {
    return connectorMock.get(connectorChargesPath + "?gatewayAccountId=" + gatewayAccountId)
      .reply(200, data);
  }

  function get_transaction_list() {
    return request(app)
      .get(txListPath)
      .set('Accept', 'application/json');
  }

  beforeEach(function () {
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
            'status': 'TEST STATUS'
          },
          {
            'charge_id': '101',
            'gateway_transaction_id': 'tnx-id-2',
            'amount': 2000,
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
            'status': 'TEST STATUS'
          },
          {
            'charge_id': '101',
            'gateway_transaction_id': 'tnx-id-2',
            'amount': '20.00',
            'status': 'TEST STATUS 2'
          }
        ]
      };

      get_transaction_list()
        .expect(200, expectedData)
        .end(done);
    });
  });
});

