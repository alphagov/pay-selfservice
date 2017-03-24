let should = require('chai').should();
let assert = require('assert');
let sinon = require('sinon');
let q = require('q');
let _ = require('lodash');
let expect = require('chai').expect;
let nock = require('nock');
let auth = require(__dirname + '/../../../app/services/auth_service.js');
let paths = require(__dirname + '/../../../app/paths.js');
let proxyquire = require('proxyquire');
let mockSession = require(__dirname + '/../../test_helpers/mock_session.js');

function mockUser(opts) {
  return mockSession.getUser(opts);
}

describe('auth service', function () {

  let mockByPass = function (next) {
    next()
  };

  let response = {
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

    it("should call done function with externalId", function (done) {
      let user = {externalId: '7d19aff33f8948deb97ed16b2912dcd3'};
      let doneSpy = sinon.spy(done);

      auth.serializeUser(user, doneSpy);

      assert(doneSpy.calledWithExactly(null, '7d19aff33f8948deb97ed16b2912dcd3'))
    });
  });

  describe('deserialize user', function () {

    it("should find user by external id", function (done) {
      let authService = (userMock) => {
        return proxyquire(__dirname + '/../../../app/services/auth_service.js',
          {'./user_service.js': userMock});
      };

      let user = mockUser();
      let doneSpy = sinon.spy(() => {
      });
      let userServiceMock = {
        findByExternalId: (externalId) => {
          expect(externalId).to.be.equal('7d19aff33f8948deb97ed16b2912dcd3');
          let defer = q.defer();
          defer.resolve(user);
          return defer.promise;
        }
      };

      authService(userServiceMock).deserializeUser({headers: {'x-request-id': 'foo'}}, '7d19aff33f8948deb97ed16b2912dcd3', doneSpy)
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
      let invalid = _.cloneDeep(validRequest());
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

  describe('localStrategyAuth', function () {

    it("should return user when authenticates successfully", function (done) {

      let authService = (userMock) => {
        return proxyquire(__dirname + '/../../../app/services/auth_service.js',
          {'./user_service.js': userMock});
      };
      let req = {
        headers: {'x-request-id': 'corrId'}
      };
      let user = {username:'user@example.com'};
      let password = 'correctPassword';
      let doneSpy = sinon.spy(() => {});
      let userServiceMock = {
        authenticate: (username, password, correlationId) => {
          expect(username).to.be.equal(user.username);
          expect(password).to.be.equal('correctPassword');
          expect(correlationId).to.be.equal('corrId');
          let defer = q.defer();
          defer.resolve(user);
          return defer.promise;
        }
      };

      authService(userServiceMock).localStrategyAuth(req, user.username, password, doneSpy)
        .then(() => {
          assert(doneSpy.calledWithExactly(null, user));
          done();
        });
    });

    it("should return error message when authentication fails", function (done) {

      let authService = (userMock) => {
        return proxyquire(__dirname + '/../../../app/services/auth_service.js',
          {'./user_service.js': userMock});
      };
      let req = {
        headers: {'x-request-id': 'corrId'}
      };
      let username = 'user@example.com';
      let password = 'imagineThisIsInvalid';
      let doneSpy = sinon.spy(() => {});
      let userServiceMock = {
        authenticate: (username, password, correlationId) => {
          expect(username).to.be.equal('user@example.com');
          expect(password).to.be.equal('imagineThisIsInvalid');
          expect(correlationId).to.be.equal('corrId');
          let defer = q.defer();
          defer.reject();
          return defer.promise;
        }
      };

      authService(userServiceMock).localStrategyAuth(req, username, password, doneSpy)
        .then(() => {
          assert(doneSpy.calledWithExactly(null, false, {message: 'Invalid email or password'}));
          done();
        });
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
      let test1 = auth.getCurrentGatewayAccountId({session: {passport: {user: {}}}});
      let test2 = auth.getCurrentGatewayAccountId({session: {passport: {}}});
      let test3 = auth.getCurrentGatewayAccountId({session: {}});
      let test4 = auth.getCurrentGatewayAccountId({});

      assert.equal(test1, null);
      assert.equal(test2, null);
      assert.equal(test3, null);
      assert.equal(test4, null);
      done();
    });
  });
});
