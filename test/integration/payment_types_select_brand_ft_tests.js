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
var _ = require('lodash');
var {TYPES} = require(__dirname + '/../../app/controllers/payment_types_controller.js');

var ACCOUNT_ID = 182364;
var app = session.mockValidAccount(_app, ACCOUNT_ID);
var user = session.user;
var CONNECTOR_ALL_CARD_TYPES_API_PATH = "/v1/api/card-types";
var CONNECTOR_ACCOUNT_PATH = "/v1/frontend/accounts/" + ACCOUNT_ID;
var CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH = CONNECTOR_ACCOUNT_PATH + "/card-types";
var requestId = 'unique-request-id';
var aCorrelationHeader = {
  reqheaders: {'x-request-id': requestId}
};

var connectorMock = nock(process.env.CONNECTOR_URL, aCorrelationHeader);

var buildAcceptedCardType = function (value, available = true, selected = '') {
  return {
    "id": `payment-types-${value}-brand`,
    "value": value,
    "label": _.capitalize(value),
    "available": available,
    "selected": selected
  }
};

var ALL_CARD_TYPES = {
  "card_types": [
    {"id": "1", "brand": "mastercard", "label": "Mastercard", "type": "CREDIT"},
    {"id": "2", "brand": "mastercard", "label": "Mastercard", "type": "DEBIT"},
    {"id": "3", "brand": "discover", "label": "Discover", "type": "CREDIT"},
    {"id": "4", "brand": "maestro", "label": "Maestro", "type": "DEBIT"}]
};

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
    .set('x-request-id',requestId);
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
    .set('x-request-id',requestId)
    .send(sendData);
}

describe('The payment types endpoint,', function () {
  describe('render select brand view,', function () {

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

    it('should show all debit and credit card options if accepted type is debit and credit cards', function (done) {
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(200, ALL_CARD_TYPES);
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(200, {
          "card_types": [{"id": "1"}]
        });

      var expectedData = {
        acceptedType: "ALL",
        isAcceptedTypeAll: true,
        isAcceptedTypeDebit: false,
        brands: [
          buildAcceptedCardType("mastercard", true, selected = "checked"),
          buildAcceptedCardType("discover", true),
          buildAcceptedCardType("maestro", true)
        ]
      };

      build_get_request(paths.paymentTypes.selectBrand + "?acceptedType=ALL")
        .expect(200, expectedData)
        .end(done);
    });

    it('should show debit card options only if accepted type is debit cards only', function (done) {
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(200, ALL_CARD_TYPES);
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(200, {
          "card_types": [{"id": "1"}]
        });

      var expectedData = {
        acceptedType: "DEBIT",
        isAcceptedTypeAll: false,
        isAcceptedTypeDebit: true,
        brands: [
          buildAcceptedCardType("mastercard", true, selected = "checked"),
          buildAcceptedCardType("maestro", true),
          buildAcceptedCardType("discover", false)
        ]
      };

      build_get_request(paths.paymentTypes.selectBrand + "?acceptedType=DEBIT")
        .expect(200, expectedData)
        .end(done);
    });

    it('should select all the options that have been previously accepted', function (done) {
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(200, ALL_CARD_TYPES);
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(200, {
          "card_types": [{"id": "1"}, {"id": "3"}, {"id": "4"}]
        });

      var expectedData = {
        acceptedType: "ALL",
        isAcceptedTypeAll: true,
        isAcceptedTypeDebit: false,
        brands: [
          buildAcceptedCardType("mastercard", true, 'checked'),
          buildAcceptedCardType("discover", true, 'checked'),
          buildAcceptedCardType("maestro", true, 'checked')
        ]
      };

      build_get_request(paths.paymentTypes.selectBrand + "?acceptedType=ALL")
        .expect(200, expectedData)
        .end(done);
    });

    it('should select all the options by default none has been previously accepted', function (done) {
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(200, ALL_CARD_TYPES);
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(200, {
          "card_types": []
        });

      var expectedData = {
        acceptedType: "ALL",
        isAcceptedTypeAll: true,
        isAcceptedTypeDebit: false,
        brands: [
          buildAcceptedCardType("mastercard", true, 'checked'),
          buildAcceptedCardType("discover", true, 'checked'),
          buildAcceptedCardType("maestro", true, 'checked')
        ]
      };

      build_get_request(paths.paymentTypes.selectBrand + "?acceptedType=ALL")
        .expect(200, expectedData)
        .end(done);
    });

    it('should show the error if provided', function (done) {
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(200, ALL_CARD_TYPES);
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(200, {
          "card_types": [{"id": "1"}]
        });

      var expectedData = {
        acceptedType: "ALL",
        isAcceptedTypeAll: true,
        isAcceptedTypeDebit: false,
        error: "Error",
        brands: [
          buildAcceptedCardType("mastercard", true, selected = "checked"),
          buildAcceptedCardType("discover", true),
          buildAcceptedCardType("maestro", true)
        ]
      };

      build_get_request(paths.paymentTypes.selectBrand + "?acceptedType=ALL&error=Error")
        .expect(200, expectedData)
        .end(done);
    });


    it('should display an error if the account does not exist', function (done) {
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(200, ALL_CARD_TYPES);
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(404, {
          "message": "The gateway account id '" + ACCOUNT_ID + "' does not exist"
        });

      build_get_request(paths.paymentTypes.selectBrand)
        .expect(200, {"message": "Unable to retrieve accepted card types for the account."})
        .end(done);
    });

    it('should display an error if connector returns any other error while retrieving accepted card types', function (done) {
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(200, ALL_CARD_TYPES);
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(999, {
          "message": "Some error in Connector"
        });

      build_get_request(paths.paymentTypes.selectBrand)
        .expect(200, {"message": "Unable to retrieve accepted card types for the account."})
        .end(done);
    });

    it('should display an error if connector returns any other error while retrieving all card types', function (done) {
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(999, {
          "message": "Some error in Connector"
        });
      connectorMock.post(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH, {"card_types": []})
        .reply(200, {});

      build_get_request(paths.paymentTypes.selectBrand)
        .expect(200, {"message": "Unable to retrieve card types."})
        .end(done);
    });

    it('should display an error if the connection to connector fails', function (done) {
      // No connectorMock defined on purpose to mock a network failure

      build_get_request(paths.paymentTypes.selectBrand)
        .expect(200, {"message": "Internal server error"})
        .end(done);
    });
  });

  describe('submit select brand view,', function () {
    beforeEach(function () {
      nock.cleanAll();
    });

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
        .then(()=> Role.sequelize.create({name: 'View', description: "View Stuff"}))
        .then((role)=> roleDef = role)
        .then(()=> roleDef.setPermissions([permissionDef]))
        .then(()=> User.create(userAttributes, roleDef))
        .then(()=> done());
    });

    it('should post debit and credit card options if accepted type is debit and credit cards', function (done) {
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(200, ALL_CARD_TYPES);
      connectorMock.post(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH, {
        "card_types": ["1", "2", "3", "4"]
      })
        .reply(200, {});

      build_form_post_request(paths.paymentTypes.selectBrand, {
        "acceptedType": TYPES.ALL,
        "acceptedBrands": ["mastercard", "discover", "maestro"]
      })
        .expect(303)
        .end(function (err, res) {
          expect(res.headers.location).to.deep.equal(paths.paymentTypes.summary + "?acceptedType=ALL");
          done();
        })
    });

    it('should post debit card options only if accepted type is debit only', function (done) {
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(200, ALL_CARD_TYPES);
      connectorMock.post(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH, {
        "card_types": ["2", "4"]
      })
        .reply(200, {});

      build_form_post_request(paths.paymentTypes.selectBrand, {
        "acceptedType": TYPES.DEBIT,
        "acceptedBrands": ["mastercard", "discover", "maestro"]
      })
        .expect(303)
        .end(function (err, res) {
          expect(res.headers.location).to.deep.equal(paths.paymentTypes.summary + "?acceptedType=DEBIT");
          done();
        })
    });

    it('should not post any card option that is unknown', function (done) {
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(200, ALL_CARD_TYPES);
      connectorMock.post(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH, {
        "card_types": ["3"]
      })
        .reply(200, {});

      build_form_post_request(paths.paymentTypes.selectBrand, {
        "acceptedType": TYPES.ALL,
        "acceptedBrands": ["discover", "unknown"]
      })
        .expect(303)
        .end(function (err, res) {
          expect(res.headers.location).to.deep.equal(paths.paymentTypes.summary + "?acceptedType=ALL");
          done();
        })
    });

    it('should show an error if no card option selected', function (done) {
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(200, ALL_CARD_TYPES);

      build_form_post_request(paths.paymentTypes.selectBrand, {
        "acceptedType": TYPES.ALL,
        "acceptedBrands": []
      })
        .expect(303)
        .end(function (err, res) {
          expect(res.headers.location).to.deep.equal(paths.paymentTypes.selectBrand + "?acceptedType=ALL&error=You%20must%20choose%20to%20accept%20at%20least%20one%20card%20brand%20to%20continue");
          done();
        })
    });

    it('should display an error if connector returns any other error while retrieving card types', function (done) {
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(999, {
          "message": "Some error in Connector"
        });

      build_form_post_request(paths.paymentTypes.selectBrand, {
        "acceptedType": TYPES.ALL,
        "acceptedBrands": ["discover", "unknown"]
      })
        .expect(200, {"message": "Unable to retrieve card types."})
        .end(done);
    });

    it('should display an error if connector returns any other error while posting accepted card types', function (done) {
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(200, ALL_CARD_TYPES);
      connectorMock.post(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH, {
        "card_types": ["3"]
      })
        .reply(999, {
          "message": "Some error in Connector"
        });

      build_form_post_request(paths.paymentTypes.selectBrand, {
        "acceptedType": TYPES.ALL,
        "acceptedBrands": ["discover", "unknown"]
      })
        .expect(200, {"message": "Unable to save accepted card types."})
        .end(done);
    });
  });
});
