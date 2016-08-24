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
        passport: {
          user: {
            name: 'Michael',
            _json: {
              app_metadata: {
                account_id: 123
              }
            }
          }
        },
        reload : mockByPass,
        save: mockByPass
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

    it("should call next if has invalid user", function (done) {
      var invalid = _.cloneDeep(validRequest);
      delete invalid.session.passport.user._json.app_metadata.account_id;
      auth.enforce(invalid, response, next);
      expect(next.called).to.be.false;
      assert(redirect.calledWith(paths.user.noAccess));
      done();
    });

    it("should redirect to login if no passport info", function (done) {
      var invalid = _.cloneDeep(validRequest);
      invalid.originalUrl = '/foo?user=random';
      delete invalid.session.passport;
      auth.enforce(invalid, response, next);
      expect(next.called).to.be.false;
      assert(redirect.calledWith(paths.user.logIn));
      expect(invalid.session.last_url).to.eq('/foo?user=random');
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

});
