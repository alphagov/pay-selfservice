var assert = require('assert');
var expect = require('chai').expect;
var sinon = require('sinon');
var paths = require(__dirname + '/../../app/paths.js');
var proxyquire = require('proxyquire');

describe('forgotten password', function () {

  var forgottenPassword = (userMock) => {
    return proxyquire(__dirname + '/../../app/controllers/forgotten_password_controller.js',
      {'../models/user.js': userMock});
  };

  describe('post username to request reset password', function () {

    it('should send password reset token and redirect to password reset requested path on success', function () {

      req = {body: {username: "foo"}, headers: {'x-request-id': 'correlationValue'}};
      var res = {redirect: sinon.spy()};
      var user = {
        findByUsername: (username, correlationId) => {
          expect(username).to.be.equal('foo');
          expect(correlationId).to.be.equal('correlationValue');
          return {
            then: (success, fail) => {
              success({
                sendPasswordResetToken: (correlationId) => {
                  expect(correlationId).to.be.equal('correlationValue');
                  return {
                    then: (success, fail) => {
                      success();
                    }
                  }
                }
              });
            }
          }
        }
      };

      forgottenPassword(user)
        .emailPost(req, res);

      assert(res.redirect.calledWithExactly('/reset-password-requested'));
    });

    it('should redirect to password reset requested path anyway when findByUsername fails', function () {

      req = {body: {username: "foo"}, headers: {'x-request-id': 'correlationValue'}};
      var res = {redirect: sinon.spy()};
      var user = {
        findByUsername: (username, correlationId) => {
          expect(username).to.be.equal('foo');
          expect(correlationId).to.be.equal('correlationValue');
          return {
            then: (success, fail) => {
              fail();
            }
          }
        }
      };

      forgottenPassword(user)
        .emailPost(req, res);

      assert(res.redirect.calledWithExactly('/reset-password-requested'));
    });

    it('should redirect to password reset requested path anyway when sendPasswordResetToken fails', function () {

      req = {body: {username: "foo"}, headers: {'x-request-id': 'correlationValue'}};
      var res = {redirect: sinon.spy()};
      var user = {
        findByUsername: (username, correlationId) => {
          expect(username).to.be.equal('foo');
          expect(correlationId).to.be.equal('correlationValue');
          return {
            then: (success, fail) => {
              success({
                sendPasswordResetToken: (correlationId) => {
                  expect(correlationId).to.be.equal('correlationValue');
                  return {
                    then: (success, fail) => {
                      fail();
                    }
                  }
                }
              });
            }
          }
        }
      };

      forgottenPassword(user)
        .emailPost(req, res);

      assert(res.redirect.calledWithExactly('/reset-password-requested'));
    });
  });
});
