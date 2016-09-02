var dbMock      = require(__dirname + '/../test_helpers/db_mock.js');
var request     = require('supertest');
var _app        = require(__dirname + '/../../server.js').getApp;
var winston     = require('winston');
var portfinder  = require('portfinder');
var nock        = require('nock');
var csrf        = require('csrf');
var should      = require('chai').should();
var paths       = require(__dirname + '/../../app/paths.js');
var session     = require(__dirname + '/../test_helpers/mock_session.js');
var ACCOUNT_ID  = 182364;

var app = session.mockValidAccount(_app, ACCOUNT_ID);

portfinder.getPort(function (err, freePort) {

  var CONNECTOR_ACCOUNT_PATH = "/v1/frontend/accounts/" + ACCOUNT_ID;
  var CONNECTOR_ACCOUNT_SERVICE_NAME_PATH = CONNECTOR_ACCOUNT_PATH + "/servicename";
  var localServer = 'http://localhost:' + freePort;
  var connectorMock = nock(localServer);

  function build_get_request(path) {
    return request(app)
      .get(path)
      .set('Accept', 'application/json');
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
      .send(sendData);
  }

  [
    {
      'path': paths.serviceName.index,
      'edit': false
    },
    {
      'path': paths.serviceName.edit,
      'edit': true
    }
  ].forEach(function (testSetup) {

      describe('The ' + testSetup.path + ' endpoint', function () {
        beforeEach(function () {
          process.env.CONNECTOR_URL = localServer;
          nock.cleanAll();
        });

        before(function () {
          // Disable logging.
          winston.level = 'none';
        });

        it('should display received service name from connector', function (done) {
          connectorMock.get(CONNECTOR_ACCOUNT_PATH)
            .reply(200, {
              "service_name": "Service name"
            });

          var expectedData = {
            "serviceName": "Service name",
            "editMode": testSetup.edit
          };

          build_get_request(testSetup.path)
            .expect(200, expectedData)
            .end(done);
        });

        it('should display an error if the account does not exist', function (done) {
          connectorMock.get(CONNECTOR_ACCOUNT_PATH)
            .reply(404, {
              "message": "The gateway account id '" + ACCOUNT_ID + "' does not exist"
            });

          build_get_request(testSetup.path)
            .expect(200, {"message": "Unable to retrieve the service name."})
            .end(done);
        });

        it('should display an error if connector returns any other error', function (done) {
          connectorMock.get(CONNECTOR_ACCOUNT_PATH)
            .reply(999, {
              "message": "Some error in Connector"
            });

          build_get_request(testSetup.path)
            .expect(200, {"message": "Unable to retrieve the service name."})
            .end(done);
        });

        it('should display an error if the connection to connector fails', function (done) {
          // No connectorMock defined on purpose to mock a network failure

          build_get_request(testSetup.path)
            .expect(200, {"message": "Internal server error"})
            .end(done);
        });
      });
    });


  describe('The provider update service name endpoint', function () {
    beforeEach(function () {
      process.env.CONNECTOR_URL = localServer;
      nock.cleanAll();
    });

    before(function () {
      // Disable logging.
      winston.level = 'none';
    });

    it('should send new service name to connector', function (done) {
      connectorMock.patch(CONNECTOR_ACCOUNT_SERVICE_NAME_PATH, {
        "service_name": "Service name"
      })
        .reply(200, {});

      var sendData = {'service-name-input': 'Service name'};
      var expectedLocation = paths.serviceName.index;
      var path = paths.serviceName.index;
      build_form_post_request(path, sendData)
        .expect(303, {})
        .expect('Location', expectedLocation)
        .end(done);
    });

    it('should display an error if connector returns failure', function (done) {
      connectorMock.patch(CONNECTOR_ACCOUNT_PATH, {"service_name": "Service name"})
        .reply(999, {
          "message": "Error message"
        });

      var sendData = {'service-name-input': 'Service name'};
      var expectedData = {"message": "Internal server error"};
      var path = paths.serviceName.index;
      build_form_post_request(path, sendData)
        .expect(200, expectedData)
        .end(done);
    });

    it('should display an error if the connection to connector fails', function (done) {
      // No connectorMock defined on purpose to mock a network failure
      var sendData = {'service-name-input': 'Service name'};
      var expectedData = {"message": "Internal server error"};
      var path = paths.serviceName.index;
      build_form_post_request(path, sendData)
        .expect(200, expectedData)
        .end(done);
    });

    it('should display an error if csrf token does not exist for the update', function (done) {
      var sendData = {'service-name-input': 'Service name'};
      var path = paths.serviceName.index;
      build_form_post_request(path, sendData, false)
          .expect(200, { message: "There is a problem with the payments platform"})
          .end(done);
    });
  });
});
