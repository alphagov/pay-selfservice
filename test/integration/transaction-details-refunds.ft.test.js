'use strict'

const chai = require('chai')
const request = require('supertest')
const nock = require('nock')
const csrf = require('csrf')
const { getApp } = require('../../server')
const paths = require('../../app/paths')
const session = require('../test-helpers/mock-session')
const userCreator = require('../test-helpers/user-creator')
const gatewayAccountFixtures = require('../fixtures/gateway-account.fixtures')
const expect = chai.expect

const ACCOUNT_ID = '15486734'
const USER_EXTERNAL_ID = 'efc2e588d92e42969d1fc32f61f5653b'
const connectorMock = nock(process.env.CONNECTOR_URL)
let app

describe('The transaction view - refund scenarios', function () {
  afterEach(function () {
    nock.cleanAll()
    app = null
  })

  beforeEach(function (done) {
    let permissions = 'refunds:create'
    const user = session.getUser({
      gateway_account_ids: [ACCOUNT_ID], permissions: [{ name: permissions }], external_id: USER_EXTERNAL_ID
    })
    app = session.getAppWithLoggedInUser(getApp(), user)

    userCreator.mockUserResponse(user.toJson(), done)
    connectorMock.get(`/v1/frontend/accounts/${ACCOUNT_ID}`)
      .reply(200, gatewayAccountFixtures.validGatewayAccountResponse({ gateway_account_id: ACCOUNT_ID }))
  })

  // known FP issue with node, it cannot mulitply 19.90 by 100 accurately
  it('should redirect to transaction view after issuing a refund of £19.90', function (done) {
    const chargeWithRefund = 12345
    const expectedRefundRequestToConnector = {
      'amount': 1990,
      'refund_amount_available': 5000,
      'user_external_id': USER_EXTERNAL_ID
    }
    const mockRefundResponse = {
      'refund_id': 'Just looking the status code of the response at the moment'
    }

    connectorMock.post('/v1/api/accounts/' + ACCOUNT_ID + '/charges/' + chargeWithRefund + '/refunds', expectedRefundRequestToConnector)
      .reply(202, mockRefundResponse)

    const viewFormData = {
      'refund-amount': '19.90',
      'refund-amount-available-in-pence': '5000',
      'csrfToken': csrf().create('123')
    }

    request(app)
      .post(paths.generateRoute(paths.transactions.refund, { chargeId: chargeWithRefund }))
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(viewFormData)
      .expect(302)
      .expect('Location', '/transactions/' + chargeWithRefund)
      .end(done)
  })

  it('should redirect to transaction view after issuing a refund of £10 (no pence)', function (done) {
    const chargeWithRefund = 12345
    const expectedRefundRequestToConnector = {
      'amount': 1000,
      'refund_amount_available': 5000,
      'user_external_id': USER_EXTERNAL_ID
    }
    const mockRefundResponse = {
      'refund_id': 'Just looking the status code of the response at the moment'
    }

    connectorMock.post('/v1/api/accounts/' + ACCOUNT_ID + '/charges/' + chargeWithRefund + '/refunds', expectedRefundRequestToConnector)
      .reply(202, mockRefundResponse)

    const viewFormData = {
      'refund-amount': '10',
      'refund-amount-available-in-pence': '5000',
      'csrfToken': csrf().create('123')
    }

    request(app)
      .post(paths.generateRoute(paths.transactions.refund, { chargeId: chargeWithRefund }))
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(viewFormData)
      .expect(302)
      .expect('Location', '/transactions/' + chargeWithRefund)
      .end(done)
  })

  it('should redirect to error view issuing a refund for amount that does not look like pounds and pence', function (done) {
    const chargeId = 12345

    const viewFormData = {
      'refund-amount': '1.9',
      'refund-amount-available-in-pence': '5000',
      'csrfToken': csrf().create('123')
    }

    request(app)
      .post(paths.generateRoute(paths.transactions.refund, { chargeId: chargeId }))
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
    const chargeId = 12345
    const expectedRefundRequestToConnector = {
      'amount': 99999,
      'refund_amount_available': 5000,
      'user_external_id': USER_EXTERNAL_ID
    }
    const mockRefundResponse = {
      'reason': 'amount_not_available'
    }

    connectorMock.post('/v1/api/accounts/' + ACCOUNT_ID + '/charges/' + chargeId + '/refunds', expectedRefundRequestToConnector)
      .reply(400, mockRefundResponse)

    const viewFormData = {
      'refund-amount': '999.99',
      'refund-amount-available-in-pence': '5000',
      'csrfToken': csrf().create('123')
    }

    request(app)
      .post(paths.generateRoute(paths.transactions.refund, { chargeId: chargeId }))
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
