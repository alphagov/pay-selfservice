var dbMock = require(__dirname + '/../test_helpers/db_mock.js');
var request = require('supertest');
var _app = require(__dirname + '/../../server.js').getApp;
var winston = require('winston');
var nock = require('nock');
var csrf = require('csrf');
var should = require('chai').should();
var paths = require(__dirname + '/../../app/paths.js');
var session = require(__dirname + '/../test_helpers/mock_session.js');
var User = require(__dirname + '/../../app/models/user.js');
var Permission = require(__dirname + '/../../app/models/permission.js');
var Role = require(__dirname + '/../../app/models/role.js');
var UserRole = require(__dirname + '/../../app/models/user_role.js');
var expect = require("chai").expect;
var {TYPES} = require(__dirname + '/../../app/controllers/payment_types_controller.js');

var ACCOUNT_ID = 182364;
var app = session.mockValidAccount(_app, ACCOUNT_ID);
var user = session.user;
var requestId = 'unique-request-id';
var aCorrelationHeader = {
  reqheaders: {'x-request-id': requestId}
};

var CONNECTOR_ACCOUNT_PATH = "/v1/frontend/accounts/" + ACCOUNT_ID;
var CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH = CONNECTOR_ACCOUNT_PATH + "/card-types";
var connectorMock = nock(process.env.CONNECTOR_URL, aCorrelationHeader);

function sync_db() {
  return Permission.sequelize.sync({force: true})
    .then(() => Role.sequelize.sync({force: true}))
    .then(() => User.sequelize.sync({force: true}))
    .then(() => UserRole.sequelize.sync({force: true}))
}

function build_get_request(path) {
  return request(app)
    .get(path)
    .set('Accept', 'application/json')
    .set('x-request-id', requestId);
}

function build_form_post_request(path, sendData, sendCSRF) {
  sendCSRF = (sendCSRF === undefined) ? true : sendCSRF;
  if (sendCSRF) {
    sendData.csrfToken = csrf().create('123');
  }
  return request(app)
    .post(path)
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .set('x-request-id', requestId)
    .send(sendData);
}

describe('The payment types endpoint,', function () {
  describe('render select type view,', function () {

    before(function (done) {
      var roleDef;
      var permissionDef;
      var userAttributes = {
        username: user.username,
        password: 'password10',
        gateway_account_id: user.gateway_account_id,
        email: user.email,
        telephone_number: "1"
      };
      winston.level = 'none';
      sync_db()
        .then(()=> Permission.sequelize.create({name: 'payment-types:read', description: 'Read payment types'}))
        .then((permission)=> permissionDef = permission)
        .then(()=> Role.sequelize.create({name: 'View', description: "View Stuff"}))
        .then((role)=> roleDef = role)
        .then(()=> roleDef.setPermissions([permissionDef]))
        .then(()=> User.create(userAttributes, roleDef))
        .then(()=> done());
    });

    beforeEach(function () {
      nock.cleanAll();
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
        }
      };

      build_get_request(paths.paymentTypes.selectType)
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
        }
      };

      build_get_request(paths.paymentTypes.selectType)
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
        }
      };

      build_get_request(paths.paymentTypes.selectType)
        .expect(200, expectedData)
        .end(done);
    });

    it('should display an error if the account does not exist', function (done) {
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(404, {
          "message": "The gateway account id '" + ACCOUNT_ID + "' does not exist"
        });

      build_get_request(paths.paymentTypes.selectType)
        .expect(200, {"message": "Unable to retrieve accepted card types for the account."})
        .end(done);
    });

    it('should display an error if connector returns any other error', function (done) {
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(999, {
          "message": "Some error in Connector"
        });

      build_get_request(paths.paymentTypes.selectType)
        .expect(200, {"message": "Unable to retrieve accepted card types for the account."})
        .end(done);
    });

    it('should display an error if the connection to connector fails', function (done) {
      // No connectorMock defined on purpose to mock a network failure

      build_get_request(paths.paymentTypes.selectType)
        .expect(200, {"message": "Internal server error"})
        .end(done);
    });
  });

  describe('submit select type view,', function () {

    before(function (done) {
      var roleDef;
      var permissionDef;
      var userAttributes = {
        username: user.username,
        password: 'password10',
        gateway_account_id: user.gateway_account_id,
        email: user.email,
        telephone_number: "1"
      };
      winston.level = 'none';
      sync_db()
        .then(()=> Permission.sequelize.create({name: 'payment-types:update', description: 'Update payment types'}))
        .then((permission)=> permissionDef = permission)
        .then(()=> Role.sequelize.create({name: 'Update', description: "Update Stuff"}))
        .then((role)=> roleDef = role)
        .then(()=> roleDef.setPermissions([permissionDef]))
        .then(()=> User.create(userAttributes, roleDef))
        .then(()=> done());
    });

    it('should redirect to select brand view when debit cards option selected', function (done) {
      build_form_post_request(paths.paymentTypes.selectType, {"payment-types-card-type": TYPES.ALL})
        .expect(303)
        .end(function (err, res) {
          expect(res.headers.location).to.deep.equal(paths.paymentTypes.selectBrand + "?acceptedType=ALL");
          done();
        })
    });

    it('should redirect to select brand view when debit cards option selected', function (done) {
      build_form_post_request(paths.paymentTypes.selectType, {"payment-types-card-type": TYPES.DEBIT})
        .expect(303)
        .end(function (err, res) {
          expect(res.headers.location).to.deep.equal(paths.paymentTypes.selectBrand + "?acceptedType=DEBIT");
          done();
        })
    });
  });
});
