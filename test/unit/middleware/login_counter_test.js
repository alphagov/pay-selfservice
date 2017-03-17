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
      {'../services/user_service.js': userServiceMock});
  };

  
  it('should call lockout user when user disabled in otplogin', function (done) {
    let user = mockSession.getUser({disabled: true});
    let incrementLoginCountSpy = sinon.spy();
    let nextSpy = sinon.spy();
    let mockedUserService = {
      incrementLoginCount: () => {
        let defer = q.defer();
        user.disabled = true;
        defer.resolve(user);
        incrementLoginCountSpy();
        return defer.promise;
      }
    };

    let loginMiddleware = login(mockedUserService);
    let res = {render: sinon.stub()};

    loginMiddleware.enforceOtp({user: user, headers: {}}, res, nextSpy);
    assert(incrementLoginCountSpy.notCalled);
    assert(nextSpy.notCalled);
    assert(res.render.calledWithExactly("login/noaccess"));
    done();
  });
});
