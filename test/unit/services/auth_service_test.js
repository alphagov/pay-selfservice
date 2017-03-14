var should = require('chai').should();
var assert = require('assert');
var sinon = require('sinon');
var q = require('q');
var _ = require('lodash');
var expect = require('chai').expect;
var nock = require('nock');
var auth = require(__dirname + '/../../../app/services/auth_service.js');
var paths = require(__dirname + '/../../../app/paths.js');
var proxyquire = require('proxyquire');
var mockSession = require(__dirname + '/../../test_helpers/mock_session.js');

function mockUser(opts) {
  return mockSession.getUser(opts);
}

describe('auth service', function () {

  var mockByPass = function (next) {
    next()
  };

  var response = {
      status: function () {
      },
      render: function () {
      },
      redirect: function () {
      }
    },
    status = undefined,
    render = undefined,
    next = undefined,

    validRequest = () => {
      return {
        session: {
          secondFactor: 'totp',
          passport: {
            user: {
              name: 'Michael',
              gateway_account_ids: [123]
            }
          },
          reload: mockByPass,
          save: mockByPass
        },
        user: mockUser(),
        headers: {}
      }
    };


  beforeEach(function () {
    status = sinon.stub(response, "status");
    render = sinon.stub(response, "render");
    redirect = sinon.stub(response, "redirect");

    next = sinon.spy();
    nock.cleanAll();
  });

  afterEach(function () {
    status.restore();
    render.restore();
    redirect.restore();
  });

  describe('serialize user', function () {

    it("should call done function with username", function (done) {
      let user = {username: 'foo'};
      let doneSpy = sinon.spy(done);

      auth.serializeUser(user, doneSpy);

      assert(doneSpy.calledWithExactly(null, 'foo'))
    });
  });

  describe('deserialize user', function () {

    it("should find user by username", function (done) {
      let authService = (userMock) => {
        return proxyquire(__dirname + '/../../../app/services/auth_service.js',
          {'./user_service.js': userMock});
      };

      let user = mockUser();
      let doneSpy = sinon.spy(() => {
      });
      let userServiceMock = {
        findByUsername: (username) => {
          expect(username).to.be.equal('foo');
          var defer = q.defer();
          defer.resolve(user);
          return defer.promise;
        }
      };

      authService(userServiceMock).deserializeUser('foo', doneSpy)
        .then(() => {
          assert(doneSpy.calledWithExactly(null, user));
          done();
        });
    });
  });

  describe('enforceUserAndSecondFactor', function () {

    it("should call next if has valid user", function (done) {
      auth.enforceUserAuthenticated(validRequest(), response, next);
      expect(next.calledOnce).to.be.true;
      done();
    });

    it("should not call next if has invalid user", function (done) {
      let invalid = _.cloneDeep(validRequest());
      invalid.user.gatewayAccountIds = null;
      auth.enforceUserAuthenticated(invalid, response, next);
      expect(next.called).to.be.false;
      assert(redirect.calledWith(paths.user.noAccess));
      done();
    });

    it("should not call next if has a disabled user", function (done) {
      let invalid = _.cloneDeep(validRequest());
      invalid.user.disabled = true;
      auth.enforceUserAuthenticated(invalid, response, next);
      expect(next.called).to.be.false;
      assert(redirect.calledWith(paths.user.noAccess));
      done();
    });


  });

  describe('no_access', function () {

    it("call next when on no access", function (done) {
      var invalid = _.cloneDeep(validRequest());
      invalid.url = paths.user.noAccess;
      auth.no_access(invalid, response, next);
      expect(next.calledOnce).to.be.true;
      done();
    });

    it("call redirect to no access", function (done) {
      auth.no_access(validRequest(), response, next);
      assert(redirect.calledWith(paths.user.noAccess));
      done();
    });
  });

  describe('getCurrentGatewayAccountId', function () {

    it("should return first gateway_account_id if user has multiple gateway accounts if its undefined in cookie", function (done) {
      let req = {
        user: mockUser({
          gateway_account_ids: ["1", "2"]
        })
      };
      let test = auth.getCurrentGatewayAccountId(req);
      assert.equal(test, 1);
      assert.equal(req.gateway_account.currentGatewayAccountId, 1);
      done();
    });

    it("should return first gateway_account_id if user has multiple gateway accounts if its empty object in cookie", function (done) {
      let req = {
        gateway_account: {},
        user: mockUser({
          gateway_account_ids: ["1", "2"]
        })
      };
      let test = auth.getCurrentGatewayAccountId(req);
      assert.equal(test, 1);
      assert.equal(req.gateway_account.currentGatewayAccountId, 1);
      done();
    });

    it("should return first gateway_account_id if user has multiple gateway accounts if its null value in cookie", function (done) {
      let req = {
        gateway_account: {
          currentGatewayAccountId: null
        },
        user: mockUser({
          gateway_account_ids: ["1", "2"]
        })
      };
      let test = auth.getCurrentGatewayAccountId(req);
      assert.equal(test, 1);
      assert.equal(req.gateway_account.currentGatewayAccountId, 1);
      done();
    });

    it("should return first gateway_account_id if user has invalid currentGatewayAccountId cookie value", function (done) {
      let req = {
        gateway_account: {
          currentGatewayAccountId: "777"
        },
        user: mockUser({
          gateway_account_ids: ["1", "2", "3"]
        })
      };
      let test = auth.getCurrentGatewayAccountId(req);
      assert.equal(test, 1);
      assert.equal(req.gateway_account.currentGatewayAccountId, 1);
      done();
    });

    it("should return gateway_account_id from cookie", function (done) {
      let req = {
        gateway_account: {
          currentGatewayAccountId: "3"
        },
        user: mockUser({
          gateway_account_ids: ["1", "2", "3"]
        })
      };
      let test = auth.getCurrentGatewayAccountId(req);
      assert.equal(test, 3);
      assert.equal(req.gateway_account.currentGatewayAccountId, 3);
      done();
    });

    it("should not return gateway_account_id", function (done) {
      var test1 = auth.getCurrentGatewayAccountId({session: {passport: {user: {}}}});
      var test2 = auth.getCurrentGatewayAccountId({session: {passport: {}}});
      var test3 = auth.getCurrentGatewayAccountId({session: {}});
      var test4 = auth.getCurrentGatewayAccountId({});

      assert.equal(test1, null);
      assert.equal(test2, null);
      assert.equal(test3, null);
      assert.equal(test4, null);
      done();
    });

  });
});
