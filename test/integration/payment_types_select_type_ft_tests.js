require(__dirname + '/../test_helpers/serialize_mock.js');
var userCreator = require(__dirname + '/../test_helpers/user_creator.js');
var request = require('supertest');
var getApp = require(__dirname + '/../../server.js').getApp;
var winston = require('winston');
var nock = require('nock');
var csrf = require('csrf');
var should = require('chai').should();
var paths = require(__dirname + '/../../app/paths.js');
var session = require(__dirname + '/../test_helpers/mock_session.js');
var expect = require("chai").expect;
var {TYPES} = require(__dirname + '/../../app/controllers/payment_types_controller.js');

var ACCOUNT_ID = 182364;
var app;
var requestId = 'unique-request-id';
var aCorrelationHeader = {
  reqheaders: {'x-request-id': requestId}
};

var CONNECTOR_ACCOUNT_PATH = "/v1/frontend/accounts/" + ACCOUNT_ID;
var CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH = CONNECTOR_ACCOUNT_PATH + "/card-types";
var connectorMock = nock(process.env.CONNECTOR_URL, aCorrelationHeader);

function build_get_request(path, baseApp) {
  return request(baseApp)
    .get(path)
    .set('Accept', 'application/json')
    .set('x-request-id', requestId);
}

function build_form_post_request(path, sendData, sendCSRF, baseApp) {
  sendCSRF = (sendCSRF === undefined) ? true : sendCSRF;
  if (sendCSRF) {
    sendData.csrfToken = csrf().create('123');
  }
  return request(baseApp)
    .post(path)
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .set('x-request-id', requestId)
    .send(sendData);
}

describe('The payment types endpoint,', function () {
  describe('render select type view,', function () {

    afterEach(function () {
      nock.cleanAll();
      app = null;
    });

    beforeEach(function (done) {
      let permissions = 'payment-types:read';
      var user = session.getUser({
        gateway_account_ids: [ACCOUNT_ID], permissions: [permissions]
      });
      app = session.getAppWithLoggedInUser(getApp(), user);

      userCreator.mockUserResponse(user.toJson(), done);
    });
    it('should select debit and credit cards option by default if no card types are accepted for the account', function (done) {
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(200, {
          "card_types": []
        });

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
          "payment_types_read": true
        },
        navigation: true,
        currentServiceName: "System Generated"
      };

      build_get_request(paths.paymentTypes.selectType, app)
        .expect(200, expectedData)
        .end(done);
    });

    it('should select debit and credit cards option if at least one credit card is accepted for the account', function (done) {
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(200, {
          "card_types": [{"type": "DEBIT"}, {"type": "CREDIT"}]
        });

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
          "payment_types_read": true
        },
        navigation: true,
        currentServiceName: "System Generated"
      };

      build_get_request(paths.paymentTypes.selectType, app)
        .expect(200, expectedData)
        .end(done);
    });

    it('should select debit cards option if only debit cards are accepted for the account', function (done) {
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(200, {
          "card_types": [{"type": "DEBIT"}, {"type": "DEBIT"}]
        });

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
          "payment_types_read": true
        },
        navigation: true,
        currentServiceName: "System Generated"
      };

      build_get_request(paths.paymentTypes.selectType, app)
        .expect(200, expectedData)
        .end(done);
    });

    it('should display an error if the account does not exist', function (done) {
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(404, {
          "message": "The gateway account id '" + ACCOUNT_ID + "' does not exist"
        });

      build_get_request(paths.paymentTypes.selectType, app)
        .expect(500, {"message": "Unable to retrieve accepted card types for the account."})
        .end(done);
    });

    it('should display an error if connector returns any other error', function (done) {
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(999, {
          "message": "Some error in Connector"
        });

      build_get_request(paths.paymentTypes.selectType, app)
        .expect(500, {"message": "Unable to retrieve accepted card types for the account."})
        .end(done);
    });

    it('should display an error if the connection to connector fails', function (done) {
      // No connectorMock defined on purpose to mock a network failure

      build_get_request(paths.paymentTypes.selectType, app)
        .expect(500, {"message": "Internal server error"})
        .end(done);
    });
  });

  describe('submit select type view,', function () {

    afterEach(function () {
      nock.cleanAll();
      app = null;
    });

    beforeEach(function (done) {
      let permissions = 'payment-types:update';
      var user = session.getUser({
        gateway_account_id: ACCOUNT_ID, permissions: [permissions]
      });
      app = session.getAppWithLoggedInUser(getApp(), user);

      userCreator.mockUserResponse(user.toJson(), done);
    });

    it('should redirect to select brand view when debit cards option selected', function (done) {
      build_form_post_request(paths.paymentTypes.selectType, {"payment-types-card-type": TYPES.ALL}, true, app)
        .expect(303)
        .end(function (err, res) {
          expect(res.headers.location).to.deep.equal(paths.paymentTypes.selectBrand + "?acceptedType=ALL");
          done();
        })
    });

    it('should redirect to select brand view when debit cards option selected', function (done) {
      build_form_post_request(paths.paymentTypes.selectType, {"payment-types-card-type": TYPES.DEBIT}, true, app)
        .expect(303)
        .end(function (err, res) {
          expect(res.headers.location).to.deep.equal(paths.paymentTypes.selectBrand + "?acceptedType=DEBIT");
          done();
        })
    });
  });
});
