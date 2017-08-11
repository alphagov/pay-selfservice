var path = require('path')
var request = require('supertest')
var nock = require('nock')

require('../test_helpers/serialize_mock.js')
var userCreator = require('../test_helpers/user_creator.js')
var getApp = require('../../server.js').getApp
var paths = require('../../app/paths.js')
var session = require('../test_helpers/mock_session.js')
var {expect} = require('chai')
var gatewayAccountId = 15486734

var app

var CONNECTOR_CHARGE_PATH = '/v1/api/accounts/' + gatewayAccountId + '/charges/{chargeId}'
var connectorMock = nock(process.env.CONNECTOR_URL)

function connectorMockResponds (path, data) {
  return connectorMock.get(path)
    .reply(200, data)
}

function whenGetTransactionHistory (chargeId, baseApp) {
  return request(baseApp)
    .get(paths.generateRoute(paths.transactions.detail, {chargeId: chargeId}))
    .set('Accept', 'application/json')
}

function connectorChargePathFor (chargeId) {
  return CONNECTOR_CHARGE_PATH.replace('{chargeId}', chargeId)
}

describe('The transaction view scenarios', function () {
  afterEach(function () {
    nock.cleanAll()
    app = null
  })

  beforeEach(function (done) {
    let permissions = 'transactions-details:read'
    var user = session.getUser({
      gateway_account_ids: [gatewayAccountId], permissions: [{name: permissions}]
    })
    app = session.getAppWithLoggedInUser(getApp(), user)

    userCreator.mockUserResponse(user.toJson(), done)
  })

  describe('The transaction history endpoint', function () {
    it('should return a list of transaction history for a given charge id', function (done) {
      var chargeId = 452345
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
      }

      var mockChargeResponse = {
        'charge_id': chargeId,
        'description': 'Breathing licence',
        'reference': 'Ref-1234',
        'email': 'alice.111@mail.fake',
        'amount': 5000,
        'gateway_account_id': gatewayAccountId,
        'payment_provider': 'sandbox',
        'gateway_transaction_id': 'dsfh-34578fb-4und-8dhry',
        'state': {
          'status': 'success',
          'finished': true
        },
        'card_details': {
          'billing_address': {
            'city': 'TEST',
            'country': 'GB',
            'line1': 'TEST',
            'line2': 'TEST - DO NOT PROCESS',
            'postcode': 'SE1 3UZ'
          },
          'card_brand': 'Mastercard',
          'cardholder_name': 'TEST',
          'expiry_date': '12/19',
          'last_digits_card_number': '4242'
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
        ]
      }

      var expectedEventsView = {
        'charge_id': chargeId,
        'description': 'Breathing licence',
        'reference': 'Ref-1234',
        'email': 'alice.111@mail.fake',
        'refundable': true,
        'net_amount': '50.00',
        'net_amount_display': '£50.00',
        'refunded_amount': '£0.00',
        'refunded': false,
        'amount': '£50.00',
        'gateway_account_id': gatewayAccountId,
        'updated': '24 Dec 2015 — 13:21:05',
        'state': {
          'status': 'success',
          'finished': true
        },
        'card_details': {
          'billing_address': {
            'city': 'TEST',
            'country': 'GB',
            'line1': 'TEST',
            'line2': 'TEST - DO NOT PROCESS',
            'postcode': 'SE1 3UZ'
          },
          'card_brand': 'Mastercard',
          'cardholder_name': 'TEST',
          'expiry_date': '12/19',
          'last_digits_card_number': '4242'
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
            'state_friendly': 'User failed to complete payment of £50.00',
            'updated': '2015-12-24 12:05:43',
            'updated_friendly': '24 Dec 2015 — 12:05:43'
          },
          {
            'state': {
              'status': 'cancelled',
              'finished': true,
              'message': 'Payment was cancelled by the service',
              'code': 'P0040'
            },
            'state_friendly': 'Service cancelled payment of £50.00',
            'updated': '2015-12-24 12:05:43',
            'updated_friendly': '24 Dec 2015 — 12:05:43'
          },
          {
            'state': {
              'status': 'success',
              'finished': true
            },
            'state_friendly': 'Payment of £50.00 succeeded',
            'updated': '2015-12-24 12:05:43',
            'updated_friendly': '24 Dec 2015 — 12:05:43'
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
        ],
        'permissions': {
          'transactions_details_read': true
        }
      }

      connectorMockResponds(connectorChargePathFor(chargeId), mockChargeResponse)
      connectorMockResponds('/v1/api/accounts/' + gatewayAccountId + '/charges/' + chargeId + '/events', mockEventsResponse)

      whenGetTransactionHistory(chargeId, app)
        .expect(200)
        .expect(response => {
          expect(response.body).to.deep.contain(expectedEventsView)
        })
        .end(done)
    })

    it('should show a transaction when no card details are present', function (done) {
      var chargeId = 452345
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
          }
        ]
      }

      var mockChargeResponse = {
        'charge_id': chargeId,
        'description': 'Breathing licence',
        'reference': 'Ref-1234',
        'email': 'alice.111@mail.fake',
        'amount': 5000,
        'gateway_account_id': gatewayAccountId,
        'payment_provider': 'sandbox',
        'gateway_transaction_id': 'dsfh-34578fb-4und-8dhry',
        'state': {
          'status': 'started',
          'finished': false
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
        ]
      }

      var expectedEventsView = {
        'charge_id': chargeId,
        'description': 'Breathing licence',
        'reference': 'Ref-1234',
        'email': 'alice.111@mail.fake',
        'refundable': true,
        'net_amount': '50.00',
        'net_amount_display': '£50.00',
        'refunded_amount': '£0.00',
        'refunded': false,
        'amount': '£50.00',
        'gateway_account_id': gatewayAccountId,
        'updated': '24 Dec 2015 — 13:21:05',
        'state': {
          'status': 'started',
          'finished': false
        },
        'card_details': {
          'card_brand': 'Data unavailable',
          'cardholder_name': 'Data unavailable',
          'expiry_date': 'Data unavailable',
          'last_digits_card_number': '****'
        },
        'state_friendly': 'Started',
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
        ],
        'permissions': {
          'transactions_details_read': true
        }
      }

      connectorMockResponds(connectorChargePathFor(chargeId), mockChargeResponse)
      connectorMockResponds('/v1/api/accounts/' + gatewayAccountId + '/charges/' + chargeId + '/events', mockEventsResponse)

      whenGetTransactionHistory(chargeId, app)
        .expect(200)
        .expect(response => {
          expect(response.body).to.deep.contain(expectedEventsView)
        })
        .end(done)
    })

    it('should show a transaction when legacy cards details are present', function (done) {
      var chargeId = 452345
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
          }
        ]
      }

      var mockChargeResponse = {
        'charge_id': chargeId,
        'description': 'Breathing licence',
        'reference': 'Ref-1234',
        'email': 'alice.111@mail.fake',
        'amount': 5000,
        'gateway_account_id': gatewayAccountId,
        'payment_provider': 'sandbox',
        'gateway_transaction_id': 'dsfh-34578fb-4und-8dhry',
        'state': {
          'status': 'started',
          'finished': false
        },
        'card_details': {
          'billing_address': null,
          'card_brand': 'Mastercard',
          'cardholder_name': null,
          'expiry_date': null,
          'last_digits_card_number': null
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
        ]
      }

      var expectedEventsView = {
        'charge_id': chargeId,
        'description': 'Breathing licence',
        'reference': 'Ref-1234',
        'email': 'alice.111@mail.fake',
        'refundable': true,
        'net_amount': '50.00',
        'net_amount_display': '£50.00',
        'refunded_amount': '£0.00',
        'refunded': false,
        'amount': '£50.00',
        'gateway_account_id': gatewayAccountId,
        'updated': '24 Dec 2015 — 13:21:05',
        'state': {
          'status': 'started',
          'finished': false
        },
        'card_details': {
          'billing_address': null,
          'card_brand': 'Mastercard',
          'cardholder_name': 'Data unavailable',
          'expiry_date': 'Data unavailable',
          'last_digits_card_number': '****'
        },
        'state_friendly': 'Started',
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
        ],
        'permissions': {
          'transactions_details_read': true
        }
      }

      connectorMockResponds(connectorChargePathFor(chargeId), mockChargeResponse)
      connectorMockResponds('/v1/api/accounts/' + gatewayAccountId + '/charges/' + chargeId + '/events', mockEventsResponse)

      whenGetTransactionHistory(chargeId, app)
        .expect(200)
        .expect(response => {
          expect(response.body).to.deep.contain(expectedEventsView)
        })
        .end(done)
    })

    it('should return a list of transaction history for a given charge id and show refunded', function (done) {
      var chargeWithRefund = 12345
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
      }

      var mockChargeResponse = {
        'charge_id': chargeWithRefund,
        'description': 'Breathing licence',
        'reference': 'Ref-1234',
        'email': 'alice.111@mail.fake',
        'amount': 5000,
        'gateway_account_id': gatewayAccountId,
        'payment_provider': 'sandbox',
        'gateway_transaction_id': 'dsfh-34578fb-4und-8dhry',
        'state': {
          'status': 'success',
          'finished': true
        },
        'card_details': {
          'billing_address': {
            'city': 'TEST',
            'country': 'GB',
            'line1': 'TEST',
            'line2': 'TEST - DO NOT PROCESS',
            'postcode': 'SE1 3UZ'
          },
          'card_brand': 'Mastercard',
          'cardholder_name': 'TEST',
          'expiry_date': '12/19',
          'last_digits_card_number': '4242'
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
        ]
      }

      var expectedEventsView = {
        'charge_id': chargeWithRefund,
        'description': 'Breathing licence',
        'reference': 'Ref-1234',
        'email': 'alice.111@mail.fake',
        'amount': '£50.00',
        'gateway_account_id': gatewayAccountId,
        'updated': '24 Dec 2015 — 13:21:05',
        'state': {
          'status': 'success',
          'finished': true
        },
        'card_details': {
          'billing_address': {
            'city': 'TEST',
            'country': 'GB',
            'line1': 'TEST',
            'line2': 'TEST - DO NOT PROCESS',
            'postcode': 'SE1 3UZ'
          },
          'card_brand': 'Mastercard',
          'cardholder_name': 'TEST',
          'expiry_date': '12/19',
          'last_digits_card_number': '4242'
        },
        'refund_summary': {
          'status': 'full',
          'amount_available': 0,
          'amount_submitted': 5000
        },
        'net_amount_display': '£0.00',
        'net_amount': '0.00',
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
            'state_friendly': 'User failed to complete payment of £50.00',
            'updated': '2015-12-24 12:05:43',
            'updated_friendly': '24 Dec 2015 — 12:05:43'
          },
          {
            'state': {
              'status': 'cancelled',
              'finished': true,
              'message': 'Payment was cancelled by the service',
              'code': 'P0040'
            },
            'state_friendly': 'Service cancelled payment of £50.00',
            'updated': '2015-12-24 12:05:43',
            'updated_friendly': '24 Dec 2015 — 12:05:43'
          },
          {
            'state': {
              'status': 'success',
              'finished': true
            },
            'state_friendly': 'Payment of £50.00 succeeded',
            'updated': '2015-12-24 12:05:43',
            'updated_friendly': '24 Dec 2015 — 12:05:43'
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
        ],
        'permissions': {
          'transactions_details_read': true
        }
      }

      var events = '/v1/api/accounts/' + gatewayAccountId + '/charges/' + chargeWithRefund + '/events'
      connectorMockResponds(connectorChargePathFor(chargeWithRefund), mockChargeResponse)
      connectorMockResponds(events, mockEventsResponse)

      whenGetTransactionHistory(chargeWithRefund, app)
        .expect(200)
        .expect(response => {
          expect(response.body).to.deep.contain(expectedEventsView)
        })
        .end(done)
    })

    it('should return charge not found if a non existing charge id requested', function (done) {
      var nonExistentChargeId = 888
      var connectorError = {'message': 'Charge not found'}
      connectorMock.get(connectorChargePathFor(nonExistentChargeId))
        .reply(404, connectorError)

      whenGetTransactionHistory(nonExistentChargeId, app)
        .expect(500, connectorError)
        .end(done)
    })

    it('should return a generic if connector responds with an error', function (done) {
      var nonExistentChargeId = 888
      var connectorError = {'message': 'Internal server error'}
      connectorMock.get(connectorChargePathFor(nonExistentChargeId))
        .reply(500, connectorError)

      whenGetTransactionHistory(nonExistentChargeId, app)
        .expect(500, {'message': 'Error processing transaction view'})
        .end(done)
    })

    it('should return a generic if unable to communicate with connector', function (done) {
      var chargeId = 452345
      whenGetTransactionHistory(chargeId, app)
        .expect(500, {'message': 'Error processing transaction view'})
        .end(done)
    })
  })
})
