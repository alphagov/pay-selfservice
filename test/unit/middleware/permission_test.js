var sinon = require('sinon');
var permission = require(__dirname + '/../../../app/middleware/permission.js');
var mockSession = require(__dirname + '/../../test_helpers/mock_session.js');
var assert = require('assert');

describe('permission test', function () {

  it('should be authorised if permissions to check is empty no matter what permissions the user has', function () {
    var nextSpy = sinon.spy();
    var permissionMiddleware = permission();

    let req = {user: mockSession.getUser(), headers: {}};
    permissionMiddleware(req, {}, nextSpy);
    assert(nextSpy.called);
  });


  it('should be authorised if user has valid permission', function (done) {
    var permissionMiddleware = permission('refunds:create');
    var nextSpy = sinon.spy();
    let user = mockSession.getUser({permissions:['refunds:create']});
    permissionMiddleware({user: user, headers: {}}, {}, nextSpy );
    assert(nextSpy.calledOnce);
    done();
  });


  it('should render unauthorised error if user does not have permission', function (done) {

    var permissionMiddleware = permission('refunds:create');
    var nextSpy = sinon.spy();
    var res = {render: sinon.stub()};

    let user = mockSession.getUser();
    permissionMiddleware({user: user, headers: {}}, res, nextSpy );
    assert(nextSpy.notCalled);
    assert(res.render.calledWithExactly('error', {'message': 'You are not authorised to do this operation'}));
    done();
  });

});
