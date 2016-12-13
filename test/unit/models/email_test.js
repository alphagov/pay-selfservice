require(__dirname + '/../../test_helpers/html_assertions.js');
var should    = require('chai').should();
var assert    = require('assert');
var Email     = require(__dirname + '/../../../app/models/email.js');
var nock      = require('nock');
var expect    = require("chai").expect;
var _         = require("lodash")

var wrongPromise = function(data){
  throw new Error('Promise was unexpectedly fulfilled.');
};

var aCorrelationHeader = {
  reqheaders: {
    'x-request-id': 'some-unique-id'
  }
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
        var emailModel = Email("some-unique-id");
        return emailModel.get(123).then(wrongPromise,
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

        nock(process.env.CONNECTOR_URL, aCorrelationHeader)
          .get("/v1/api/accounts/123/email-notification")
          .reply(404, '');
      });

      it('should return get_failed', function () {
        var emailModel = Email("some-unique-id");
        return emailModel.get(123).then(wrongPromise,
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
          .reply(200, {"template_body": "hello", "enabled":true});
      });

      it('should return the correct promise', function () {
        var emailModel = Email("some-unique-id");
        return emailModel.get(123).then(function(data){
          expect(data).to.deep.equal({"customEmailText": "hello", "emailEnabled":true});
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
        var emailModel = Email("some-unique-id");
        return emailModel.update(123).then(wrongPromise,
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
        var emailModel = Email("some-unique-id");
        return emailModel.update(123, "hello")
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
        var emailModel = Email("some-unique-id");
        return emailModel.update(123,"hello").then(function(data){
          assert.equal(1,1);
        },wrongPromise);
      });
    });
  });

  describe('enabling/disabling email notifications', function(){

    _.each([true,false],function(toggle){
      describe('when connector is unavailable', function () {
        before(function() {
          nock.cleanAll();
        });

        after(function() {
          nock.cleanAll();
        });

        it('should return client unavailable', function () {
          var emailModel = Email("some-unique-id");
          return emailModel.setEnabled(123,toggle).then(wrongPromise,
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
            .patch("/v1/api/accounts/123/email-notification",{"op":"replace", "path":"enabled", "value": toggle})
            .reply(404, '');
        });

        it('should return PATCH_FAILED', function () {
          var emailModel = Email("some-unique-id");
          return emailModel.setEnabled(123,toggle)
          .then(wrongPromise, function rejected(error){
              assert.equal(error.message,"PATCH_FAILED")
            });
          });
        });

      describe('when connector returns correctly', function () {
        before(function() {
          nock.cleanAll();
          nock(process.env.CONNECTOR_URL)
            .patch("/v1/api/accounts/123/email-notification",{"op":"replace", "path":"enabled", "value": toggle})
            .reply(200, {});
        });

        it('should disable email notifications', function () {
          var emailModel = Email("some-unique-id");
          return emailModel.setEnabled(123,toggle).then(function(data){
            assert.equal(1,1);
          },wrongPromise);
        });
      });
    });

  });
});
