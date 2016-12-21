var assert = require('assert');
var expect = require('chai').expect;
var sinon = require('sinon');
var paths = require(__dirname + '/../../app/paths.js');
var proxyquire = require('proxyquire');
var q                     = require('q');


describe.only('forgotten password', function () {

  var forgottenPassword = (userMock) => {
    return proxyquire(__dirname + '/../../app/controllers/forgotten_password_controller.js',
      {'../services/user_service.js': userMock});
  };

  describe('post username to request reset password', function () {

    it('should send password reset token and redirect to password reset requested path on success', function () {

      req = {body: {username: "foo"}, headers: {'x-request-id': 'correlationValue'}};
      var res = {redirect: sinon.spy()};
      var mockedUserService = {
        findByUsername: (username, correlationId) => {
          expect(username).to.be.equal('foo');
          expect(correlationId).to.be.equal('correlationValue');
          return {
            then: (success, fail) => {
              return success();
            }
          }
        },
        sendPasswordResetToken: (user, correlationId) => {
          expect(correlationId).to.be.equal('correlationValue');
          return {
            finally: (success) => {
              success();
            }
          }
        }
      };

      forgottenPassword(mockedUserService)
        .emailPost(req, res);

      assert(res.redirect.calledWithExactly('/reset-password-requested'));
      res.redirect.reset();

    });

    it('should redirect to password reset requested path anyway when findByUsername fails', function (done) {

      req = {body: {username: "foo"}, headers: {'x-request-id': 'correlationValue'}};
      var res = {redirect: sinon.spy()};
      var sendPasswordResetToken = sinon.spy();
      var mockedUserService = {
        findByUsername: () => {
          var defer = q.defer();
          defer.reject();
          return defer.promise;
        },

        sendPasswordResetToken: sendPasswordResetToken
      };

      forgottenPassword(mockedUserService)
        .emailPost(req, res)
        .then(() => {
          assert(res.redirect.calledWithExactly('/reset-password-requested'));
          assert(mockedUserService.sendPasswordResetToken.notCalled);
          res.redirect.reset();
          mockedUserService.sendPasswordResetToken.reset();
          done();
        });
    });

    it('should redirect to password reset requested path anyway when sendPasswordResetToken fails', function (done) {

      req = {body: {username: "foo"}, headers: {'x-request-id': 'correlationValue'}};
      var res = {redirect: sinon.spy()};
      var mockedUserService = {
        findByUsername: () => {
          var defer = q.defer();
          defer.resolve();
          return defer.promise;
        },
        sendPasswordResetToken: () => {}
      };

      var resetPromise = q.defer();
      resetPromise.resolve();
      sinon.stub(mockedUserService, 'sendPasswordResetToken').returns(resetPromise.promise);
      forgottenPassword(mockedUserService)
        .emailPost(req, res)
        .then(() => {
          assert(res.redirect.calledWithExactly('/reset-password-requested'));
          assert(mockedUserService.sendPasswordResetToken.calledOnce);
          res.redirect.reset();
          mockedUserService.sendPasswordResetToken.reset();
          done();
        });
    });
  });
});
