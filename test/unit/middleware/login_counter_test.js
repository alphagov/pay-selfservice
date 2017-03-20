var should = require('chai').should();
var assert = require('assert');
var sinon = require('sinon');
var nock = require('nock');
var mockSession = require(__dirname + '/../../test_helpers/mock_session.js');
let login = require(__dirname + '/../../../app/middleware/login_counter.js');

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

describe('login counter test', function () {

  it('should call lockout user when user disabled in otplogin', function (done) {
    let user = mockSession.getUser({disabled: true});
    let nextSpy = sinon.spy();

    let res = {render: sinon.stub()};

    login.enforceOtp({user: user, headers: {}}, res, nextSpy);
    assert(nextSpy.notCalled);
    assert(res.render.calledWithExactly("login/noaccess"));
    done();
  });
});
