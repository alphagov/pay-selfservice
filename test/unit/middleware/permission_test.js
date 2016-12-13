var proxyquire = require('proxyquire');
var sinon = require('sinon');
var assert = require('assert');
var expect = require('chai').expect;

describe('permission test', function () {

  var permission = (userMock)=> {
    return proxyquire(__dirname + '/../../../app/middleware/permission.js',
      {'../models/user.js': userMock});
  };

  it('should be authorised if permissions to check is empty no matter what permissions the user has', function () {
    var nextSpy = sinon.spy();
    var permissionMiddleware = permission({});

    permissionMiddleware()({user: {username: "foo"}, headers: {}}, {}, nextSpy);

    assert(nextSpy.called);
  });

  it('should be authorised if user has valid permission', function () {
    var user = {
      findByUsername: (username, correlationId)=> {
        expect(username).to.be.equal('foo');
        expect(correlationId).to.be.equal('');
        return {
          then: (success, fail)=> {
            success({
              hasPermission: (permission) => {
                expect(permission).to.be.equal('refunds:create');
                return {then: (suc, fail)=> suc(true)}
              }
            })
          }
        }
      }
    };
    var nextSpy = sinon.spy();
    var permissionMiddleware = permission(user);

    permissionMiddleware('refunds:create')({user: {username: "foo"}, headers: {}}, {}, nextSpy);

    assert(nextSpy.called);
  });

  it('should render unauthorised error if user has not valid permission', function () {

    var user = {
      findByUsername: (username, correlationId)=> {
        expect(username).to.be.equal('foo');
        expect(correlationId).to.be.equal('');
        return {
          then: (success, fail)=> {
            success({
              hasPermission: (permission) => {
                expect(permission).to.be.equal('refunds:create');
                return {then: (suc, fail)=> suc(false)}
              }
            })
          }
        }
      }
    };
    var nextSpy = sinon.spy();
    var res = {render: sinon.spy()};
    var permissionMiddleware = permission(user);

    permissionMiddleware('refunds:create')({user: {username: "foo"}, headers: {}}, res, nextSpy);

    assert(nextSpy.notCalled);
    assert(res.render.calledWithExactly('error', {'message': 'You are not Authorized to do this operation'}))
  });

  it('should return error if find user fails', function () {

    var user = {
      findByUsername: (username, correlationId)=> {
        expect(username).to.be.equal('foo');
        expect(correlationId).to.be.equal('');
        return { then: (success, fail)=> fail() }
      }
    };
    var nextSpy = sinon.spy();
    var permissionMiddleware = permission(user);

    expect(() => permissionMiddleware('refunds:create')({user: {username: "foo"}, headers: {}}, {}, nextSpy))
      .to.throw(Error, "Could not get user");

    assert(nextSpy.notCalled);
  });

  it('should return error if checking for user permission fails', function () {

    var user = {
      findByUsername: (username, correlationId)=> {
        expect(username).to.be.equal('foo');
        expect(correlationId).to.be.equal('');
        return {
          then: (success, fail)=> {
            success({
              hasPermission: (permission) => {
                expect(permission).to.be.equal('refunds:create');
                return {then: (suc, fail)=> fail()}
              }
            })
          }
        }
      }
    };
    var nextSpy = sinon.spy();
    var permissionMiddleware = permission(user);

    expect(() => permissionMiddleware('refunds:create')({user: {username: "foo"}, headers: {}}, {}, nextSpy))
      .to.throw(Error, "Could not check user permission");

    assert(nextSpy.notCalled);
  });
});
