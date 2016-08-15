var request = require('supertest');
var portfinder = require('portfinder');
var nock = require('nock');
var csrf = require('csrf');
var _app = require(__dirname + '/../../server.js').getApp;
var winston = require('winston');
var paths = require(__dirname + '/../../app/paths.js');
var session = require(__dirname + '/../test_helpers/mock_session.js');

var ACCOUNT_ID = 15486734;
var app = session.mockValidAccount(_app, ACCOUNT_ID);

var localServer = 'http://aServer:8002';
var connectorMock = nock(localServer);

describe('The transaction view - refund scenarios', function () {

  beforeEach(function () {
    process.env.CONNECTOR_URL = localServer;
    nock.cleanAll();
  });

  before(function () {
    // Disable logging.
    winston.level = 'none';
  });

  it('should redirect to transaction view after issuing a refund', function (done) {

    var chargeWithRefund = 12345;
    var expectedRefundRequestToConnector = {
      'amount': 1050
    };
    var mockRefundResponse = {
      'refund_id': 'Just looking the status code of the response at the moment'
    };

    connectorMock.post('/v1/api/accounts/' + ACCOUNT_ID + '/charges/' + chargeWithRefund + '/refunds', expectedRefundRequestToConnector)
      .reply(202, mockRefundResponse);

    var viewFormData = {
      'refund-amount': 10.50,
      'csrfToken': csrf().create('123')
    };

    request(app)
      .post(paths.generateRoute(paths.transactions.refund, {chargeId: chargeWithRefund}))
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(viewFormData)
      .expect(302)
      .expect('Location', '/transactions/' + chargeWithRefund)
      .end(done);
  });

  it('should redirect to error view issuing a refund when amount is not available for refund', function (done) {

    var chargeId = 12345;
    var expectedRefundRequestToConnector = {
      'amount': 99999
    };
    var mockRefundResponse = {
      'reason': 'amount_not_available'
    };

    connectorMock.post('/v1/api/accounts/' + ACCOUNT_ID + '/charges/' + chargeId + '/refunds', expectedRefundRequestToConnector)
      .reply(400, mockRefundResponse);

    var viewFormData = {
      'refund-amount': 999.99,
      'csrfToken': csrf().create('123')
    };

    request(app)
      .post(paths.generateRoute(paths.transactions.refund, {chargeId: chargeId}))
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('Accept', 'application/json')
      .send(viewFormData)
      .expect(200, {"message": "Can't do refund: The requested amount is bigger than the amount available for refund"})
      .end(done);
  });

  it('should redirect to error view issuing a refund when amount is less than the minimum accepted for a refund', function (done) {

    var chargeId = 12345;
    var expectedRefundRequestToConnector = {
      'amount': 0
    };
    var mockRefundResponse = {
      'reason': 'amount_min_validation'
    };

    connectorMock.post('/v1/api/accounts/' + ACCOUNT_ID + '/charges/' + chargeId + '/refunds', expectedRefundRequestToConnector)
      .reply(400, mockRefundResponse);

    var viewFormData = {
      'refund-amount': 0,
      'csrfToken': csrf().create('123')
    };

    request(app)
      .post(paths.generateRoute(paths.transactions.refund, {chargeId: chargeId}))
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('Accept', 'application/json')
      .send(viewFormData)
      .expect(200, {"message": "Can't do refund: The requested amount is less than the minimum accepted for issuing a refund for this charge"})
      .end(done);
  });

  it('should redirect to error view issuing a refund when refund amount has been fully refunded', function (done) {

    var chargeId = 12345;
    var expectedRefundRequestToConnector = {
      'amount': 1000
    };
    var mockRefundResponse = {
      'reason': 'full'
    };

    connectorMock.post('/v1/api/accounts/' + ACCOUNT_ID + '/charges/' + chargeId + '/refunds', expectedRefundRequestToConnector)
      .reply(400, mockRefundResponse);

    var viewFormData = {
      'refund-amount': 10,
      'csrfToken': csrf().create('123')
    };

    request(app)
      .post(paths.generateRoute(paths.transactions.refund, {chargeId: chargeId}))
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('Accept', 'application/json')
      .send(viewFormData)
      .expect(200, {"message": "Can't do refund: This charge has been already fully refunded"})
      .end(done);
  });

  it('should redirect to error view when unexpected error issuing a refund', function (done) {

    var chargeId = 12345;
    var expectedRefundRequestToConnector = {
      'amount': 1000
    };
    var mockRefundResponse = {
      'message': 'what happeneeed!'
    };

    connectorMock.post('/v1/api/accounts/' + ACCOUNT_ID + '/charges/' + chargeId + '/refunds', expectedRefundRequestToConnector)
      .reply(400, mockRefundResponse);

    var viewFormData = {
      'refund-amount': 10,
      'csrfToken': csrf().create('123')
    };

    request(app)
      .post(paths.generateRoute(paths.transactions.refund, {chargeId: chargeId}))
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('Accept', 'application/json')
      .send(viewFormData)
      .expect(200, {"message": "Can't process refund"})
      .end(done);
  });
});
