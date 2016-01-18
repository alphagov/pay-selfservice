var request = require('supertest');
var app = require(__dirname + '/../server.js').getApp;
var winston = require('winston');
var portfinder = require('portfinder');
var nock = require('nock');
var auth_cookie = require(__dirname + '/utils/login-session.js');
var should = require('chai').should();

portfinder.getPort(function (err, freePort) {
  var ACCOUNT_ID = 182364;
  var CONNECTOR_ACCOUNT_CREDENTIALS_PATH = "/v1/frontend/accounts/" + ACCOUNT_ID;
  var SELF_SERVICE_CREDENTIALS_PATH = "/selfservice/credentials";
  var SELF_SERVICE_EDIT_CREDENTIALS_PATH = "/selfservice/credentials?edit";
  var AUTH_COOKIE_VALUE = auth_cookie.create({passport:{user:{_json:{app_metadata:{account_id:ACCOUNT_ID}}}}});
  var localServer = 'http://localhost:' + freePort;
  var connectorMock = nock(localServer);
  
  function build_get_request(path, cookieValue) {
    return request(app)
      .get(path)
      .set('Accept', 'application/json')
      .set('Cookie', cookieValue);
  }

  function build_form_post_request(path, sendData, cookieValue) {
    return request(app)
      .post(path)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('Cookie', cookieValue)
      .send(sendData);
  }

  [
    {'path':SELF_SERVICE_CREDENTIALS_PATH,
     'edit':false
    },
    {'path':SELF_SERVICE_EDIT_CREDENTIALS_PATH,
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

        build_get_request(testSetup.path, ['session=' + AUTH_COOKIE_VALUE])
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

        build_get_request(testSetup.path, ['session=' + AUTH_COOKIE_VALUE])
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

        build_get_request(testSetup.path, ['session=' + AUTH_COOKIE_VALUE])
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

        build_get_request(testSetup.path, ['session=' + AUTH_COOKIE_VALUE])
            .expect(200, expectedData)
            .end(done);
      });

      it('should display an error if the account does not exist', function (done) {
        connectorMock.get(CONNECTOR_ACCOUNT_CREDENTIALS_PATH)
          .reply(404, {
            "message": "The gateway account id '"+ACCOUNT_ID+"' does not exist"
          });

        build_get_request(testSetup.path, ['session=' + AUTH_COOKIE_VALUE])
            .expect(200, {"message": "There is a problem with the payments platform"})
            .end(done);
      });

      it('should display an error if connector returns any other error', function (done) {

        connectorMock.get(CONNECTOR_ACCOUNT_CREDENTIALS_PATH)
          .reply(999, {
            "message": "Some error in Connector"
          });

        build_get_request(testSetup.path, ['session=' + AUTH_COOKIE_VALUE])
            .expect(200, {"message": "There is a problem with the payments platform"})
            .end(done);
      });

      it('should display an error if the connection to connector fails', function (done){
        // No connectorMock defined on purpose to mock a network failure

        build_get_request(testSetup.path, ['session=' + AUTH_COOKIE_VALUE])
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
    var expectedLocation = SELF_SERVICE_CREDENTIALS_PATH;
    var path = SELF_SERVICE_CREDENTIALS_PATH;
    build_form_post_request(path, sendData, ['session=' + AUTH_COOKIE_VALUE])
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
    var expectedLocation = SELF_SERVICE_CREDENTIALS_PATH;
    var path = SELF_SERVICE_CREDENTIALS_PATH;
    build_form_post_request(path, sendData, ['session=' + AUTH_COOKIE_VALUE])
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
      var path = SELF_SERVICE_CREDENTIALS_PATH;
      build_form_post_request(path, sendData, ['session=' + AUTH_COOKIE_VALUE])
        .expect(200, expectedData)
        .end(done);
    });

    it('should display an error if the connection to connector fails', function (done){
      // No connectorMock defined on purpose to mock a network failure

      var sendData = {'username': 'a-username', 'password': 'a-password'};
      var expectedData = {"message": "There is a problem with the payments platform"};
      var path = SELF_SERVICE_CREDENTIALS_PATH;
      build_form_post_request(path, sendData, ['session=' + AUTH_COOKIE_VALUE])
        .expect(200, expectedData)
        .end(done);
    });
  });
});
