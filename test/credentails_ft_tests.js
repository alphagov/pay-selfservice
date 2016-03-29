var express = require('express');
var request = require('supertest');
var _app         = require(__dirname + '/../server.js').getApp;
var winston     = require('winston');
var portfinder  = require('portfinder');
var nock        = require('nock');
var should      = require('chai').should();
var paths       = require(__dirname + '/../app/paths.js');

var ACCOUNT_ID = 182364;

var app = express();
app.all("*", function (req, res, next) {
  req.session = {passport: {user: {_json: {app_metadata: {account_id: ACCOUNT_ID}}}}};
  next();
});
app.use(_app);

portfinder.getPort(function (err, freePort) {

  var CONNECTOR_ACCOUNT_CREDENTIALS_PATH = "/v1/frontend/accounts/" + ACCOUNT_ID;
  var localServer = 'http://localhost:' + freePort;
  var connectorMock = nock(localServer);

  function build_get_request(path) {
    return request(app)
      .get(path)
      .set('Accept', 'application/json');
  }

  function build_form_post_request(path, sendData) {
    return request(app)
      .post(path)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(sendData);
  }

  [
    {'path':paths.credentials.index,
     'edit':false
    },
    {'path':paths.credentials.edit,
    'edit':true
    }
   ].forEach(function(testSetup) {

    describe('The ' + testSetup.path + ' endpoint', function () {
      beforeEach(function () {
        process.env.CONNECTOR_URL = localServer;
        nock.cleanAll();
      });

      before(function () {
        // Disable logging.
        winston.level = 'none';
      });

      it('should display payment provider name in title case', function (done) {
        connectorMock.get(CONNECTOR_ACCOUNT_CREDENTIALS_PATH)
          .reply(200, {
            "payment_provider": "sandbox",
            "gateway_account_id": "1",
            "credentials": {}
          });

        var expectedData = {
           "payment_provider": "Sandbox",
           "credentials": {}
        };

        if(testSetup.edit) expectedData.editMode = 'true';

        build_get_request(testSetup.path)
            .expect(200, expectedData)
            .end(done);
      });

      it('should display empty credential values when no gateway credentials are set', function (done) {
        connectorMock.get(CONNECTOR_ACCOUNT_CREDENTIALS_PATH)
          .reply(200, {
            "payment_provider": "sandbox",
            "gateway_account_id": "1",
            "credentials": {}
          });

        var expectedData = {
           "payment_provider": "Sandbox",
           "credentials": {}
        };

        if(testSetup.edit) expectedData.editMode = 'true';

        build_get_request(testSetup.path)
            .expect(200, expectedData)
            .end(done);
      });

      it('should display received credentials from connector', function (done) {
        connectorMock.get(CONNECTOR_ACCOUNT_CREDENTIALS_PATH)
          .reply(200, {
            "payment_provider": "sandbox",
            "gateway_account_id": "1",
            "credentials": {"username": "a-username"}
          });

        var expectedData = {
           "payment_provider": "Sandbox",
           "credentials": {
             'username': 'a-username'
           }
        };

        if(testSetup.edit) expectedData.editMode = 'true';

        build_get_request(testSetup.path)
            .expect(200, expectedData)
            .end(done);
      });

      it('should return the account', function (done) {
        connectorMock.get(CONNECTOR_ACCOUNT_CREDENTIALS_PATH)
          .reply(200, {
            "payment_provider": "sandbox",
            "gateway_account_id": "1",
            "credentials": {username: "a-username", merchant_id: 'a-merchant-id'}
          });

        var expectedData = {
           "payment_provider": "Sandbox",
            "credentials": {
              'username': 'a-username',
              'merchant_id': 'a-merchant-id'
            }
        };

        if(testSetup.edit) expectedData.editMode = 'true';

        build_get_request(testSetup.path)
            .expect(200, expectedData)
            .end(done);
      });

      it('should display an error if the account does not exist', function (done) {
        connectorMock.get(CONNECTOR_ACCOUNT_CREDENTIALS_PATH)
          .reply(404, {
            "message": "The gateway account id '"+ACCOUNT_ID+"' does not exist"
          });

        build_get_request(testSetup.path)
            .expect(200, {"message": "There is a problem with the payments platform"})
            .end(done);
      });

      it('should display an error if connector returns any other error', function (done) {

        connectorMock.get(CONNECTOR_ACCOUNT_CREDENTIALS_PATH)
          .reply(999, {
            "message": "Some error in Connector"
          });

        build_get_request(testSetup.path)
            .expect(200, {"message": "There is a problem with the payments platform"})
            .end(done);
      });

      it('should display an error if the connection to connector fails', function (done){
        // No connectorMock defined on purpose to mock a network failure

        build_get_request(testSetup.path)
            .expect(200, {"message": "There is a problem with the payments platform"})
            .end(done);
      });
    });
  });

  describe('The provider update credentials endpoint', function () {
    beforeEach(function () {
      process.env.CONNECTOR_URL = localServer;
      nock.cleanAll();
    });

    before(function () {
      // Disable logging.
      winston.level = 'none';
    });

    it('should send new username and password credentials to connector', function (done) {
      connectorMock.put(CONNECTOR_ACCOUNT_CREDENTIALS_PATH, {
        "username": "a-username",
        "password": "a-password"
      })
      .reply(200, {});


//    verify_post_request(path, sendData, cookieValue, expectedRespCode, expectedData, expectedLocation) {
    var sendData = {'username': 'a-username', 'password': 'a-password'};
    var expectedLocation = paths.credentials.index;
    var path = paths.credentials.index;
    build_form_post_request(path, sendData)
        .expect(303, {})
        .expect('Location', expectedLocation)
        .end(done);
    });

    it('should send any arbitrary credentials together with username and password to connector', function (done) {
      connectorMock.put(CONNECTOR_ACCOUNT_CREDENTIALS_PATH, {
        "username": "a-username",
        "password": "a-password",
        "merchant_id": "a-merchant-id"
      })
      .reply(200, {});

    var sendData = {'username': 'a-username', 'password': 'a-password', 'merchantId': 'a-merchant-id'};
    var expectedLocation = paths.credentials.index;
    var path = paths.credentials.index;
    build_form_post_request(path, sendData)
        .expect(303, {})
        .expect('Location', expectedLocation)
        .end(done);
    });

    it('should display an error if connector returns failure', function (done) {
      connectorMock.put(CONNECTOR_ACCOUNT_CREDENTIALS_PATH, {
        "username": "a-username",
        "password": "a-password"
      })
      .reply(999, {
        "message": "Error message"
      });

      var sendData = {'username': 'a-username', 'password': 'a-password'};
      var expectedData = {"message": "There is a problem with the payments platform"};
      var path = paths.credentials.index;
      build_form_post_request(path, sendData)
        .expect(200, expectedData)
        .end(done);
    });

    it('should display an error if the connection to connector fails', function (done){
      // No connectorMock defined on purpose to mock a network failure

      var sendData = {'username': 'a-username', 'password': 'a-password'};
      var expectedData = {"message": "There is a problem with the payments platform"};
      var path = paths.credentials.index;
      build_form_post_request(path, sendData)
        .expect(200, expectedData)
        .end(done);
    });
  });
});
