var proxyquire = require('proxyquire');
var sinon = require('sinon');
var assert = require('assert');
var expect = require('chai').expect;
var q                     = require('q');

describe('permission test', function () {
  var mockUserService, res;

  var permission = (userServiceMock)=> {
    return proxyquire(__dirname + '/../../../app/middleware/permission.js',
      {'../services/user_service.js': userServiceMock});
  };

  afterEach(() => {
    try {
      mockUserService.findByUsername.reset();
      mockUserService.hasPermission.reset();
      res.render.reset();
    } catch(e) {
      //don't care
    }

  });

  it('should be authorised if permissions to check is empty no matter what permissions the user has', function () {
    var nextSpy = sinon.spy();
    var permissionMiddleware = permission({});

    permissionMiddleware()({user: {username: "foo"}, headers: {}}, {}, nextSpy);

    assert(nextSpy.called);
  });

  it('should be authorised if user has valid permission', function (done) {
    mockUserService = {
      findByUsername: (username, correlationId) => {
        expect(username).to.be.equal('foo');
        expect(correlationId).to.be.equal('');
        var defer = q.defer();
        defer.resolve({});
        return defer.promise;
      },
      hasPermission: () => {
        var defer = q.defer();
        defer.resolve(true);
        return defer.promise;
      }
    };
    var findByUsernameSpy = sinon.spy(mockUserService, 'findByUsername');
    var hasPermissionSpy = sinon.spy(mockUserService, 'hasPermission');

    var permissionMiddleware = permission(mockUserService);

    permissionMiddleware('refunds:create')({user: {username: "foo"}, headers: {}}, {}, () => {
      assert(findByUsernameSpy.calledOnce);
      assert(hasPermissionSpy.calledOnce);
      done();
    });
  });

  it('should render unauthorised error if user does not have permission', function (done) {
    var res = {render: sinon.stub()};

    mockUserService = {
      findByUsername: (username, correlationId) => {
        expect(username).to.be.equal('foo');
        expect(correlationId).to.be.equal('');
        var defer = q.defer();
        defer.resolve({});
        return defer.promise;
      },
      hasPermission: () => {
        var defer = q.defer();
        defer.resolve(false);
        return defer.promise;
      }
    };
    var findByUsernameSpy = sinon.spy(mockUserService, 'findByUsername');
    var hasPermissionSpy = sinon.spy(mockUserService, 'hasPermission');

    var permissionMiddleware = permission(mockUserService);
    var nextSpy = sinon.spy();

    permissionMiddleware('refunds:create')({user: {username: "foo"}, headers: {}}, res, nextSpy)
    .then(() => {
      assert(findByUsernameSpy.calledOnce);
      assert(hasPermissionSpy.calledOnce);
      assert(res.render.calledWithExactly('error', {'message': 'You are not authorised to do this operation'}));
      done();
    });
  });

  it('should render error if find user fails', function (done) {
    var res = {render: sinon.stub()};

    mockUserService = {
      findByUsername: (username, correlationId)=> {
        expect(username).to.be.equal('foo');
        expect(correlationId).to.be.equal('');
        var defer = q.defer();
        defer.reject('Big fat error');
        return defer.promise;
      }
    };
    var nextSpy = sinon.spy();
    var permissionMiddleware = permission(mockUserService);

    permissionMiddleware('refunds:create')({user: {username: "foo"}, headers: {}}, res, nextSpy)
      .then(() => {
        assert(res.render.calledWithExactly('error', {'message': 'You are not authorised to do this operation'}));
        done();
      });
  });

  it('should render error if checking for user permission fails', function (done) {
    var res = {render: sinon.stub()};

    mockUserService = {
      findByUsername: (username, correlationId) => {
        expect(username).to.be.equal('foo');
        expect(correlationId).to.be.equal('');
        var defer = q.defer();
        defer.resolve({id: 'userid132244'});
        return defer.promise;
      },
      hasPermission: () => {
        var defer = q.defer();
        defer.reject('hasPermission goes boom');
        return defer.promise;
      }
    };
    var findByUsernameSpy = sinon.spy(mockUserService, 'findByUsername');
    var hasPermissionSpy = sinon.spy(mockUserService, 'hasPermission');

    var permissionMiddleware = permission(mockUserService);
    var nextSpy = sinon.spy();

    permissionMiddleware('refunds:create')({user: {username: "foo"}, headers: {}}, res, nextSpy)
      .then((promise) => {
          assert(findByUsernameSpy.calledOnce);
          assert(hasPermissionSpy.calledOnce);
          assert(res.render.calledWithExactly('error', {'message': 'You are not authorised to do this operation'}));
          done();
      });
  });

});
