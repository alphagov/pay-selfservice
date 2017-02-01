var should = require('chai').should();
var assert = require('assert');
var sinon = require('sinon');
var nock = require('nock');
var proxyquire = require('proxyquire');
var q = require('q');
var mockSession = require(__dirname + '/../../test_helpers/mock_session.js');

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

describe('login counter test', function () {

  var login = (userServiceMock) => {
    return proxyquire(__dirname + '/../../../app/middleware/login_counter.js',
      {'../services/user_service2.js': userServiceMock});
  };

  it('should call increment login count during otp login', function (done) {
    var user = mockSession.getUser();
    var incrementLoginCountSpy = sinon.spy();
    var nextSpy = sinon.spy();
    var mockedUserService = {
      findByUsername: () => {
        var defer = q.defer();
        defer.resolve(user);
        return defer.promise;
      },
      incrementLoginCount: () => {
        var defer = q.defer();
        defer.resolve(user);
        incrementLoginCountSpy();
        return defer.promise;
      }
    };

    var loginMiddleware = login(mockedUserService);

    loginMiddleware.enforceOtp({user: user, headers: {}}, {}, nextSpy)
      .then(() => {
        assert(incrementLoginCountSpy.calledOnce);
        assert(nextSpy.called);
        done();
      });
  });

  it('should call lockout user when user disabled in otplogin', function (done) {
    var user = mockSession.getUser();
    var incrementLoginCountSpy = sinon.spy();
    var nextSpy = sinon.spy();
    var mockedUserService = {
      findByUsername: () => {
        var defer = q.defer();
        defer.resolve(user);
        return defer.promise;
      },
      incrementLoginCount: () => {
        var defer = q.defer();
        user.disabled = true;
        defer.resolve(user);
        incrementLoginCountSpy();
        return defer.promise;
      }
    };

    var loginMiddleware = login(mockedUserService);
    var res = {render: sinon.stub()};

    loginMiddleware.enforceOtp({user: user, headers: {}}, res, nextSpy).should.be.fulfilled.then(() => {
        assert(incrementLoginCountSpy.calledOnce);
        assert(nextSpy.notCalled);
        assert(res.render.calledWithExactly("login/noaccess"));
      }).should.notify(done);
  });
});
