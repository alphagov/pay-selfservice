const path = require('path')
require(path.join(__dirname, '/../test_helpers/serialize_mock.js'))
const userCreator = require(path.join(__dirname, '/../test_helpers/user_creator.js'))
const request = require('supertest')
const getApp = require(path.join(__dirname, '/../../server.js')).getApp
const nock = require('nock')
const csrf = require('csrf')
const paths = require(path.join(__dirname, '/../../app/paths.js'))
const session = require(path.join(__dirname, '/../test_helpers/mock_session.js'))
const expect = require('chai').expect
const {TYPES} = require(path.join(__dirname, '/../../app/controllers/payment_types_controller.js'))

const ACCOUNT_ID = 182364
let app
const requestId = 'unique-request-id'
const aCorrelationHeader = {
  reqheaders: {'x-request-id': requestId}
}

const CONNECTOR_ACCOUNT_PATH = '/v1/frontend/accounts/' + ACCOUNT_ID
const CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH = CONNECTOR_ACCOUNT_PATH + '/card-types'
const connectorMock = nock(process.env.CONNECTOR_URL, aCorrelationHeader)

function buildGetRequest (path, baseApp) {
  return request(baseApp)
    .get(path)
    .set('Accept', 'application/json')
    .set('x-request-id', requestId)
}

function buildFormPostRequest (path, sendData, sendCSRF, baseApp) {
  sendCSRF = (sendCSRF === undefined) ? true : sendCSRF
  if (sendCSRF) {
    sendData.csrfToken = csrf().create('123')
  }
  return request(baseApp)
    .post(path)
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .set('x-request-id', requestId)
    .send(sendData)
}

describe('The payment types endpoint,', function () {
  describe('render select type view,', function () {
    afterEach(function () {
      nock.cleanAll()
      app = null
    })

    beforeEach(function (done) {
      let permissions = 'payment-types:read'
      var user = session.getUser({
        gateway_account_ids: [ACCOUNT_ID], permissions: [permissions]
      })
      app = session.getAppWithLoggedInUser(getApp(), user)

      userCreator.mockUserResponse(user.toJson(), done)
    })
    it('should select debit and credit cards option by default if no card types are accepted for the account', function (done) {
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(200, {
          'card_types': []
        })

      var expectedData = {
        allCardOption: {
          type: TYPES.ALL,
          selected: 'checked'
        },
        debitCardOption: {
          type: TYPES.DEBIT,
          selected: ''
        },
        permissions: {
          'payment_types_read': true
        },
        navigation: true
      }

      buildGetRequest(paths.paymentTypes.selectType, app)
        .expect(200, expectedData)
        .end(done)
    })

    it('should select debit and credit cards option if at least one credit card is accepted for the account', function (done) {
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(200, {
          'card_types': [{'type': 'DEBIT'}, {'type': 'CREDIT'}]
        })

      var expectedData = {
        allCardOption: {
          type: TYPES.ALL,
          selected: 'checked'
        },
        debitCardOption: {
          type: TYPES.DEBIT,
          selected: ''
        },
        permissions: {
          'payment_types_read': true
        },
        navigation: true
      }

      buildGetRequest(paths.paymentTypes.selectType, app)
        .expect(200, expectedData)
        .end(done)
    })

    it('should select debit cards option if only debit cards are accepted for the account', function (done) {
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(200, {
          'card_types': [{'type': 'DEBIT'}, {'type': 'DEBIT'}]
        })

      var expectedData = {
        allCardOption: {
          type: TYPES.ALL,
          selected: ''
        },
        debitCardOption: {
          type: TYPES.DEBIT,
          selected: 'checked'
        },
        permissions: {
          'payment_types_read': true
        },
        navigation: true
      }

      buildGetRequest(paths.paymentTypes.selectType, app)
        .expect(200, expectedData)
        .end(done)
    })

    it('should display an error if the account does not exist', function (done) {
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(404, {
          'message': "The gateway account id '" + ACCOUNT_ID + "' does not exist"
        })

      buildGetRequest(paths.paymentTypes.selectType, app)
        .expect(500, {'message': 'Unable to retrieve accepted card types for the account.'})
        .end(done)
    })

    it('should display an error if connector returns any other error', function (done) {
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(999, {
          'message': 'Some error in Connector'
        })

      buildGetRequest(paths.paymentTypes.selectType, app)
        .expect(500, {'message': 'Unable to retrieve accepted card types for the account.'})
        .end(done)
    })

    it('should display an error if the connection to connector fails', function (done) {
      // No connectorMock defined on purpose to mock a network failure

      buildGetRequest(paths.paymentTypes.selectType, app)
        .expect(500, {'message': 'Internal server error'})
        .end(done)
    })
  })

  describe('submit select type view,', function () {
    afterEach(function () {
      nock.cleanAll()
      app = null
    })

    beforeEach(function (done) {
      let permissions = 'payment-types:update'
      var user = session.getUser({
        gateway_account_id: ACCOUNT_ID, permissions: [permissions]
      })
      app = session.getAppWithLoggedInUser(getApp(), user)

      userCreator.mockUserResponse(user.toJson(), done)
    })

    it('should redirect to select brand view when debit cards option selected', function (done) {
      buildFormPostRequest(paths.paymentTypes.selectType, {'payment-types-card-type': TYPES.ALL}, true, app)
        .expect(303)
        .end(function (err, res) {
          if (err) done(err)
          expect(res.headers.location).to.deep.equal(paths.paymentTypes.selectBrand + '?acceptedType=ALL')
          done()
        })
    })

    it('should redirect to select brand view when debit cards option selected', function (done) {
      buildFormPostRequest(paths.paymentTypes.selectType, {'payment-types-card-type': TYPES.DEBIT}, true, app)
        .expect(303)
        .end(function (err, res) {
          if (err) done(err)
          expect(res.headers.location).to.deep.equal(paths.paymentTypes.selectBrand + '?acceptedType=DEBIT')
          done()
        })
    })
  })
})
