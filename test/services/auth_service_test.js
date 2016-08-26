var should = require('chai').should();
var assert = require('assert');
var sinon = require('sinon');
var _ = require('lodash');
var expect = require('chai').expect;
var nock = require('nock');
var auth = require(__dirname + '/../../app/services/auth_service.js');
var paths = require(__dirname + '/../../app/paths.js');
var proxyquire = require('proxyquire');

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
    validRequest = {
      session: {
        secondFactor: 'totp',
        passport: {
          user: {
            name: 'Michael',
            gateway_account_id: 123
          }
        },
        reload : mockByPass,
        save: mockByPass
      },
      user: {
        name: 'Michael',
        gateway_account_id: 123
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


  describe('enforce', function () {
    it("should call next if has valid user", function (done) {
      auth.enforce(validRequest, response, next);
      expect(next.calledOnce).to.be.true;
      done();
    });

    it("should not call next if has invalid user", function (done) {
      var invalid = _.cloneDeep(validRequest);
      delete invalid.user.gateway_account_id;
      auth.enforce(invalid, response, next);
      expect(next.called).to.be.false;
      assert(redirect.calledWith(paths.user.noAccess));
      done();
    });

    it("should not call next if has a disabled user", function (done) {
      var invalid = _.cloneDeep(validRequest);
      invalid.user.disabled = true;
      auth.enforce(invalid, response, next);
      expect(next.called).to.be.false;
      assert(redirect.calledWith(paths.user.noAccess));
      done();
    });


  });

  describe('no_access', function () {
    it("call next when on no access", function (done) {
      var invalid = _.cloneDeep(validRequest);
      invalid.url = paths.user.noAccess;
      auth.no_access(invalid, response, next);
      expect(next.calledOnce).to.be.true;
      done();
    });

    it("call redirect to no access", function (done) {
      auth.no_access(validRequest, response, next);
      assert(redirect.calledWith(paths.user.noAccess));
      done();
    });
  });

  describe('get_gateway_account_id', function () {
    it("should return gateway_account_id", function (done) {
      var test = auth.get_gateway_account_id({user: { gateway_account_id: 1}});
      assert.equal(test,1);
      done();
    });
   it("should not return gateway_account_id", function (done) {
      var test1 = auth.get_gateway_account_id({session: {passport: {user: { }}}});
      var test2 = auth.get_gateway_account_id({session: {passport: {}}});
      var test3 = auth.get_gateway_account_id({session: {}});
      var test4 = auth.get_gateway_account_id({});

      assert.equal(test1,null);
      assert.equal(test2,null);
      assert.equal(test3,null);
      assert.equal(test4,null);
      done();
    });

  });

});
