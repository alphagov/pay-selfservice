var request = require('supertest');
var _app = require(__dirname + '/../../server.js').getApp;
var winston = require('winston');
var portfinder = require('portfinder');
var nock = require('nock');
var csrf = require('csrf');
var should = require('chai').should();
var paths = require(__dirname + '/../../app/paths.js');
var session = require(__dirname + '/../test_helpers/mock_session.js');
var ACCOUNT_ID = 182364;
var expect = require("chai").expect;
var _ = require('lodash');

var {TYPES} = require(__dirname + '/../../app/controllers/payment_types_controller.js');

var app = session.mockValidAccount(_app, ACCOUNT_ID);

portfinder.getPort(function (err, freePort) {

  var CONNECTOR_ALL_CARD_TYPES_API_PATH = "/v1/api/card-types";
  var CONNECTOR_ACCOUNT_PATH = "/v1/frontend/accounts/" + ACCOUNT_ID;
  var CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH = CONNECTOR_ACCOUNT_PATH + "/card-types";
  var localServer = 'http://localhost:' + freePort;
  var connectorMock = nock(localServer);

  var buildAcceptedCardType = function (value, available = true, selected = '') {
    return {
      "id": `payment-types-${value}-brand`,
      "value": value,
      "label": _.capitalize(value),
      "available": available,
      "selected": selected
    }
  }

  var ALL_CARD_TYPES = {
    "card_types": [
      {"id": "1", "brand": "mastercard", "label": "Mastercard", "type": "CREDIT"},
      {"id": "2", "brand": "mastercard", "label": "Mastercard", "type": "DEBIT"},
      {"id": "3", "brand": "discover", "label": "Discover", "type": "CREDIT"},
      {"id": "4", "brand": "maestro", "label": "Maestro", "type": "DEBIT"}]
  };

  function build_get_request(path) {
    return request(app)
      .get(path)
      .set('Accept', 'application/json');
  }

  describe('The payment types endpoint,', function () {
    describe('render summary view,', function () {
      beforeEach(function () {
        process.env.CONNECTOR_URL = localServer;
        nock.cleanAll();
      });

      before(function () {
        // Disable logging.
        winston.level = 'none';
      });

      it('should show all the card type options that have been previously accepted', function (done) {
        connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
          .reply(200, ALL_CARD_TYPES);
        connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
          .reply(200, {
            "card_types": [{"id": "1"}, {"id": "3"}, {"id": "4"}]
          });

        var expectedData = {
          isAcceptedTypeAll: true,
          isAcceptedTypeDebit: false,
          brands: [
            buildAcceptedCardType("mastercard", true, 'checked'),
            buildAcceptedCardType("discover", true, 'checked'),
            buildAcceptedCardType("maestro", true, 'checked')
          ]
        };

        build_get_request(paths.paymentTypes.summary)
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

        build_get_request(paths.paymentTypes.summary)
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

        build_get_request(paths.paymentTypes.summary)
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

        build_get_request(paths.paymentTypes.summary)
          .expect(200, {"message": "Unable to retrieve card types."})
          .end(done);
      });

      it('should display an error if the connection to connector fails', function (done) {
        // No connectorMock defined on purpose to mock a network failure

        build_get_request(paths.paymentTypes.summary)
          .expect(200, {"message": "Internal server error"})
          .end(done);
      });
    });
  });
});
