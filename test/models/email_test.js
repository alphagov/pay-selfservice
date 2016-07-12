require(__dirname + '/../test_helpers/html_assertions.js');
var should    = require('chai').should();
var assert    = require('assert');
var Email = require(__dirname + '/../../app/models/email.js');
var nock      = require('nock');
var wrongPromise = function(data){
  throw new Error('Promise was unexpectedly fulfilled.');
};

describe('email notification', function() {
  describe('getting the template body', function(){

    describe('when connector is unavailable', function () {
      before(function() {
        nock.cleanAll();
      });

      after(function() {
        nock.cleanAll();
      });

      it('should return client unavailable', function () {
        return Email.get(123).then(wrongPromise,
            function rejected(error){
              assert.equal(error.message,"CLIENT_UNAVAILABLE")
            }
          );
        }
      );
    });

    describe('when connector returns incorrect response code', function () {
      before(function() {
        nock.cleanAll();

        nock(process.env.CONNECTOR_URL)
          .get("/v1/api/accounts/123/email-notification")
          .reply(404, '');
      });

      it('should return get_failed', function () {
        return Email.get(123).then(wrongPromise,
          function rejected(error){
            assert.equal(error.message,"GET_FAILED")
          });
        });
      });

    describe('when connector returns correctly', function () {
      before(function() {
        nock.cleanAll();

        nock(process.env.CONNECTOR_URL)
          .get("/v1/api/accounts/123/email-notification")
          .reply(200, {"template_body": "hello"});
      });

      it('should return the correct promise', function () {
        return Email.get(123).then(function(data){
          assert.equal(data,"hello");
        },wrongPromise);
      });
    });
  });

  describe('updating the email notification template body', function(){

    describe('when connector is unavailable', function () {
      before(function() {
        nock.cleanAll();
      });

      after(function() {
        nock.cleanAll();
      });

      it('should return client unavailable', function () {
        return Email.update(123).then(wrongPromise,
            function rejected(error){
              assert.equal(error.message,"CLIENT_UNAVAILABLE")
            }
          );
        }
      );
    });

    describe('when connector returns incorrect response code', function () {
      before(function() {
        nock.cleanAll();

        nock(process.env.CONNECTOR_URL)
          .post("/v1/api/accounts/123/email-notification")
          .reply(404, '');
      });

      it('should return POST_FAILED', function () {
        return Email.update(123, "hello")
        .then(wrongPromise, function rejected(error){
            assert.equal(error.message,"POST_FAILED")
          });
        });
      });

    describe('when connector returns correctly', function () {
      before(function() {
        nock.cleanAll();

        nock(process.env.CONNECTOR_URL)
          .post("/v1/api/accounts/123/email-notification")
          .reply(200, {});
      });

      it('should update the email notification template body', function () {
        return Email.update(123,"hello").then(function(data){
          assert.equal(1,1);
        },wrongPromise);
      });
    });
  });
});
