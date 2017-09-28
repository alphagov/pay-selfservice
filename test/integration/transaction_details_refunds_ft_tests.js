var chai = require('chai')
var request = require('supertest')
var nock = require('nock')
var csrf = require('csrf')
var getApp = require('../../server.js').getApp
var paths = require('../../app/paths.js')
var session = require('../test_helpers/mock_session.js')
var userCreator = require('../test_helpers/user_creator.js')
var expect = chai.expect

var ACCOUNT_ID = 15486734
var USER_EXTERNAL_ID = 'efc2e588d92e42969d1fc32f61f5653b'
var app
var connectorMock = nock(process.env.CONNECTOR_URL)

describe('The transaction view - refund scenarios', function () {
  afterEach(function () {
    nock.cleanAll()
    app = null
  })

  beforeEach(function (done) {
    let permissions = 'refunds:create'
    var user = session.getUser({
      gateway_account_ids: [ACCOUNT_ID], permissions: [{name: permissions}], external_id: USER_EXTERNAL_ID
    })
    app = session.getAppWithLoggedInUser(getApp(), user)

    userCreator.mockUserResponse(user.toJson(), done)
  })

  // known FP issue with node, it cannot mulitply 19.90 by 100 accurately
  it('should redirect to transaction view after issuing a refund of £19.90', function (done) {
    var chargeWithRefund = 12345
    var expectedRefundRequestToConnector = {
      'amount': 1990,
      'refund_amount_available': 5000,
      'user_external_id': USER_EXTERNAL_ID
    }
    var mockRefundResponse = {
      'refund_id': 'Just looking the status code of the response at the moment'
    }

    connectorMock.post('/v1/api/accounts/' + ACCOUNT_ID + '/charges/' + chargeWithRefund + '/refunds', expectedRefundRequestToConnector)
      .reply(202, mockRefundResponse)

    var viewFormData = {
      'refund-amount': '19.90',
      'refund-amount-available-in-pence': '5000',
      'csrfToken': csrf().create('123')
    }

    request(app)
      .post(paths.generateRoute(paths.transactions.refund, {chargeId: chargeWithRefund}))
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(viewFormData)
      .expect(302)
      .expect('Location', '/transactions/' + chargeWithRefund)
      .end(done)
  })

  it('should redirect to transaction view after issuing a refund of £10 (no pence)', function (done) {
    var chargeWithRefund = 12345
    var expectedRefundRequestToConnector = {
      'amount': 1000,
      'refund_amount_available': 5000,
      'user_external_id': USER_EXTERNAL_ID
    }
    var mockRefundResponse = {
      'refund_id': 'Just looking the status code of the response at the moment'
    }

    connectorMock.post('/v1/api/accounts/' + ACCOUNT_ID + '/charges/' + chargeWithRefund + '/refunds', expectedRefundRequestToConnector)
      .reply(202, mockRefundResponse)

    var viewFormData = {
      'refund-amount': '10',
      'refund-amount-available-in-pence': '5000',
      'csrfToken': csrf().create('123')
    }

    request(app)
      .post(paths.generateRoute(paths.transactions.refund, {chargeId: chargeWithRefund}))
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(viewFormData)
      .expect(302)
      .expect('Location', '/transactions/' + chargeWithRefund)
      .end(done)
  })

  it('should redirect to error view issuing a refund for amount that does not look like pounds and pence', function (done) {
    var chargeId = 12345

    var viewFormData = {
      'refund-amount': '1.9',
      'refund-amount-available-in-pence': '5000',
      'csrfToken': csrf().create('123')
    }

    request(app)
    .post(paths.generateRoute(paths.transactions.refund, {chargeId: chargeId}))
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .set('Accept', 'application/json')
    .send(viewFormData)
    .expect(302)
    .end((err, res) => {
      expect(err).to.equal(null)
      expect(res.header.location).to.equal('/transactions/12345')
      done()
    })
  })

  it('should redirect to error view issuing a refund when amount is not available for refund', function (done) {
    var chargeId = 12345
    var expectedRefundRequestToConnector = {
      'amount': 99999,
      'refund_amount_available': 5000,
      'user_external_id': USER_EXTERNAL_ID
    }
    var mockRefundResponse = {
      'reason': 'amount_not_available'
    }

    connectorMock.post('/v1/api/accounts/' + ACCOUNT_ID + '/charges/' + chargeId + '/refunds', expectedRefundRequestToConnector)
      .reply(400, mockRefundResponse)

    var viewFormData = {
      'refund-amount': '999.99',
      'refund-amount-available-in-pence': '5000',
      'csrfToken': csrf().create('123')
    }

    request(app)
      .post(paths.generateRoute(paths.transactions.refund, {chargeId: chargeId}))
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('Accept', 'application/json')
      .send(viewFormData)
      .expect(302)
      .end((err, res) => {
        expect(err).to.equal(null)
        expect(res.header.location).to.equal('/transactions/12345')
        done()
      })
  })
})
