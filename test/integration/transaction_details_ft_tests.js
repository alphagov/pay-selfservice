var request     = require('supertest');
var portfinder  = require('portfinder');
var nock        = require('nock');
var dbMock      = require(__dirname + '/../test_helpers/db_mock.js');
var _app        = require(__dirname + '/../../server.js').getApp;
var winston     = require('winston');
var paths       = require(__dirname + '/../../app/paths.js');
var session     = require(__dirname + '/../test_helpers/mock_session.js');

var gatewayAccountId = ACCOUNT_ID = 15486734;

var app = session.mockValidAccount(_app,gatewayAccountId);
var chargeId = 452345;
var chargeWithRefund = 12345;
var CONNECTOR_EVENTS_PATH = '/v1/api/accounts/' + gatewayAccountId + '/charges/' + chargeId + '/events';
var CONNECTOR_CHARGE_PATH = '/v1/api/accounts/' + gatewayAccountId + '/charges/{chargeId}';

var CONNECTOR_CHARGE_PATH = '/v1/api/accounts/' + ACCOUNT_ID + '/charges/{chargeId}';
var localServer = 'http://aServer:8002';
var connectorMock = nock(localServer);

function connectorMock_responds(path, data) {
  return connectorMock.get(path)
    .reply(200, data);
}

function when_getTransactionHistory(chargeId) {
  return request(app)
    .get(paths.generateRoute(paths.transactions.show, {chargeId: chargeId}))
    .set('Accept', 'application/json');
}

function connectorChargePathFor(chargeId) {
  return CONNECTOR_CHARGE_PATH.replace('{chargeId}', chargeId);
}

describe('The transaction view scenarios', function () {

  beforeEach(function () {
    process.env.CONNECTOR_URL = localServer;
    nock.cleanAll();
  });

  before(function () {
    // Disable logging.
    winston.level = 'none';
  });

  describe('The transaction history endpoint', function () {

    it('should return a list of transaction history for a given charge id', function (done) {
      var chargeId = 452345;
      var mockEventsResponse = {
        'charge_id': chargeId,
        'events': [
          {
            'state': {
              'status': 'created',
              'finished': false
            },
            'updated': '2015-12-24 13:21:05'
          },
          {
            'state': {
              'status': 'started',
              'finished': false
            },
            'updated': '2015-12-24 13:23:12'
          },
          {
            'state': {
              'status': 'success',
              'finished': true
            },
            'updated': '2015-12-24 12:05:43'
          },
          {
            'state': {
              'status': 'cancelled',
              'finished': true,
              'message': 'Payment was cancelled by the service',
              'code': 'P0040'
            },
            'updated': '2015-12-24 12:05:43'
          },
          {
            'state': {
              'status': 'failed',
              'finished': true,
              'message': 'Payment was cancelled by the user',
              'code': 'P0030'
            },
            'updated': '2015-12-24 12:05:43'
          }
        ]
      };

      var mockChargeResponse = {
        'charge_id': chargeId,
        'description': 'Breathing licence',
        'reference': 'Ref-1234',
        'email': 'alice.111@mail.fake',
        'amount': 5000,
        'gateway_account_id': ACCOUNT_ID,
        'payment_provider': 'sandbox',
        'gateway_transaction_id': 'dsfh-34578fb-4und-8dhry',
        'state': {
          'status': 'success',
          'finished': true
        },
        'refund_summary': {
          'status': 'available',
          'amount_available': 5000,
          'amount_submitted': 0
        },
        'return_url': 'http://example.service/return_from_payments',
        'links': [
          {
            'rel': 'self',
            'method': 'GET',
            'href': 'http://connector.service/v1/api/charges/1'
          },
          {
            'rel': 'next_url',
            'method': 'GET',
            'href': 'http://frontend/charges/1?chargeTokenId=82347'
          }
        ],
      };

      var expectedEventsView = {
        'charge_id': chargeId,
        'description': 'Breathing licence',
        'reference': 'Ref-1234',
        'email': 'alice.111@mail.fake',
        'refundable': true,
        'net_amount': 50,
        'net_amount_display': '£50.00',
        'refunded_amount': '£0.00',
        'refunded': false,
        'amount': '£50.00',
        'gateway_account_id': ACCOUNT_ID,
        'updated': '24 Dec 2015 — 13:21:05',
        'state': {
          'status': 'success',
          'finished': true
        },
        'state_friendly': 'Success',
        'refund_summary': {
          'status': 'available',
          'amount_available': 5000,
          'amount_submitted': 0
        },
        'payment_provider': 'Sandbox',
        'gateway_transaction_id': 'dsfh-34578fb-4und-8dhry',
        'events': [
          {
            'state': {
              'status': 'failed',
              'finished': true,
              'message': 'Payment was cancelled by the user',
              'code': 'P0030'
            },
            "state_friendly": "User failed to complete payment of £50.00",
            "updated": "2015-12-24 12:05:43",
            "updated_friendly": "24 Dec 2015 — 12:05:43",
          },
          {
            'state': {
              'status': 'cancelled',
              'finished': true,
              'message': 'Payment was cancelled by the service',
              'code': 'P0040'
            },
            "state_friendly": "Service cancelled payment of £50.00",
            "updated": "2015-12-24 12:05:43",
            "updated_friendly": "24 Dec 2015 — 12:05:43"
          },
          {
            'state': {
              'status': 'success',
              'finished': true
            },
            "state_friendly": "Payment of £50.00 succeeded",
            "updated": "2015-12-24 12:05:43",
            "updated_friendly": "24 Dec 2015 — 12:05:43"
          },
          {
            'state': {
              'status': 'started',
              'finished': false
            },
            'state_friendly': 'User started payment of £50.00',
            'updated': '2015-12-24 13:23:12',
            'updated_friendly': '24 Dec 2015 — 13:23:12'
          },
          {
            'state': {
              'status': 'created',
              'finished': false
            },
            'state_friendly': 'Service created payment of £50.00',
            'updated': '2015-12-24 13:21:05',
            'updated_friendly': '24 Dec 2015 — 13:21:05'
          }
        ]
      };

      connectorMock_responds(connectorChargePathFor(chargeId), mockChargeResponse);
      connectorMock_responds('/v1/api/accounts/' + ACCOUNT_ID + '/charges/' + chargeId + '/events', mockEventsResponse);

      when_getTransactionHistory(chargeId)
        .expect(200, expectedEventsView)
        .end(done);
    });

    it('should return a list of transaction history for a given charge id and show refunded', function (done) {

      var chargeWithRefund = 12345;
      var mockEventsResponse = {
        'charge_id': chargeWithRefund,
        'events': [
          {
            'state': {
              'status': 'created',
              'finished': false
            },
            'updated': '2015-12-24 13:21:05'
          },
          {
            'state': {
              'status': 'started',
              'finished': false
            },
            'updated': '2015-12-24 13:23:12'
          },
          {
            'state': {
              'status': 'success',
              'finished': true
            },
            'updated': '2015-12-24 12:05:43'
          },
          {
            'state': {
              'status': 'cancelled',
              'finished': true,
              'message': 'Payment was cancelled by the service',
              'code': 'P0040'
            },
            'updated': '2015-12-24 12:05:43'
          },
          {
            'state': {
              'status': 'failed',
              'finished': true,
              'message': 'Payment was cancelled by the user',
              'code': 'P0030'
            },
            'updated': '2015-12-24 12:05:43'
          }
        ]
      };

      var mockChargeResponse = {
        'charge_id': chargeWithRefund,
        'description': 'Breathing licence',
        'reference': 'Ref-1234',
        'email': 'alice.111@mail.fake',
        'amount': 5000,
        'gateway_account_id': ACCOUNT_ID,
        'payment_provider': 'sandbox',
        'gateway_transaction_id': 'dsfh-34578fb-4und-8dhry',
        'state': {
          'status': 'success',
          'finished': true
        },
        'refund_summary': {
          'status': 'full',
          'amount_available': 0,
          'amount_submitted': 5000
        },
        'return_url': 'http://example.service/return_from_payments',
        'links': [
          {
            'rel': 'self',
            'method': 'GET',
            'href': 'http://connector.service/v1/api/charges/1'
          },
          {
            'rel': 'next_url',
            'method': 'GET',
            'href': 'http://frontend/charges/1?chargeTokenId=82347'
          }
        ],
      };

      var expectedEventsView = {
        'charge_id': chargeWithRefund,
        'description': 'Breathing licence',
        'reference': 'Ref-1234',
        'email': 'alice.111@mail.fake',
        'amount': '£50.00',
        'gateway_account_id': ACCOUNT_ID,
        'updated': '24 Dec 2015 — 13:21:05',
        'state': {
          'status': 'success',
          'finished': true
        },
        'refund_summary': {
          'status': 'full',
          'amount_available': 0,
          'amount_submitted': 5000
        },
        'net_amount_display': '£0.00',
        'net_amount': 0.00,
        'refundable': false,
        'refunded_amount': '£50.00',
        'refunded': true,
        'state_friendly': 'Success',
        'payment_provider': 'Sandbox',
        'gateway_transaction_id': 'dsfh-34578fb-4und-8dhry',
        'events': [
          {
            'state': {
              'status': 'failed',
              'finished': true,
              'message': 'Payment was cancelled by the user',
              'code': 'P0030'
            },
            "state_friendly": "User failed to complete payment of £50.00",
            "updated": "2015-12-24 12:05:43",
            "updated_friendly": "24 Dec 2015 — 12:05:43",
          },
          {
            'state': {
              'status': 'cancelled',
              'finished': true,
              'message': 'Payment was cancelled by the service',
              'code': 'P0040'
            },
            "state_friendly": "Service cancelled payment of £50.00",
            "updated": "2015-12-24 12:05:43",
            "updated_friendly": "24 Dec 2015 — 12:05:43"
          },
          {
            'state': {
              'status': 'success',
              'finished': true
            },
            "state_friendly": "Payment of £50.00 succeeded",
            "updated": "2015-12-24 12:05:43",
            "updated_friendly": "24 Dec 2015 — 12:05:43"
          },
          {
            'state': {
              'status': 'started',
              'finished': false
            },
            'state_friendly': 'User started payment of £50.00',
            'updated': '2015-12-24 13:23:12',
            'updated_friendly': '24 Dec 2015 — 13:23:12'
          },
          {
            'state': {
              'status': 'created',
              'finished': false
            },
            'state_friendly': 'Service created payment of £50.00',
            'updated': '2015-12-24 13:21:05',
            'updated_friendly': '24 Dec 2015 — 13:21:05'
          }
        ]
      };

      var events = '/v1/api/accounts/' + ACCOUNT_ID + '/charges/' + chargeWithRefund + '/events';
      connectorMock_responds(connectorChargePathFor(chargeWithRefund), mockChargeResponse);
      connectorMock_responds(events, mockEventsResponse);

      when_getTransactionHistory(chargeWithRefund)
        .expect(200, expectedEventsView)
        .end(done);
    });

    it('should return charge not found if a non existing charge id requested', function (done) {
      var nonExistentChargeId = 888;
      var connectorError = {'message': 'Charge not found'};
      connectorMock.get(connectorChargePathFor(nonExistentChargeId))
        .reply(404, connectorError);

      when_getTransactionHistory(nonExistentChargeId)
        .expect(200, connectorError)
        .end(done);
    });

    it('should return a generic if connector responds with an error', function (done) {
      var nonExistentChargeId = 888;
      var connectorError = {'message': 'Internal server error'};
      connectorMock.get(connectorChargePathFor(nonExistentChargeId))
        .reply(500, connectorError);

      when_getTransactionHistory(nonExistentChargeId)
        .expect(200, {'message': 'Error processing transaction view'})
        .end(done);
    });

    it('should return a generic if unable to communicate with connector', function (done) {
      var chargeId = 452345;
      when_getTransactionHistory(chargeId)
        .expect(200, {'message': 'Error processing transaction view'})
        .end(done);
    });
  });
});
