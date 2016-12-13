var should = require('chai').should();
var assert = require('assert');
var sinon  = require('sinon');
var _      = require('lodash');
var expect = require('chai').expect;
var nock   = require('nock');
var proxyquire = require('proxyquire');
var q                     = require('q');

describe('login counter test', function () {

  var response = {
    status: function(){},
    render: function(){}
  },
  status = undefined,
  render = undefined,
  next   = undefined,
  validRequest =  {
    headers: {
      accept: ""
    }
  };


  beforeEach(function(){
    status = sinon.stub(response,"status");
    render = sinon.stub(response,"render");
    next   = sinon.spy();
    nock.cleanAll();
  });

  afterEach(function(){
    status.restore();
    render.restore();
  });

  var login = (userServiceMock)=> {
    return proxyquire(__dirname + '/../../../app/middleware/login_counter.js',
    {'../services/user_user_service.js': userServiceMock});
  };

  it('should call increment login count',function(done){
    var user = {
      login_counter: 0,
      incrementLoginCount: () => {
        var defer = q.defer();
        defer.resolve();
        return defer.promise;
      }
    };
    var incrementLoginCountSpy = sinon.spy(user, 'incrementLoginCount');
    var mockedUserService = {
      findByUsername: ()=> {
        var defer = q.defer();
        defer.resolve(user);
        return defer.promise;
      }
    };
    var loginMiddleware = login(mockedUserService);

    loginMiddleware.enforce({body: {email: "foo"}, headers:{}},{
    },() => {
      assert(incrementLoginCountSpy.calledOnce);
      done();
    });
  });

  it('should call disable user and render noacess when over limit',function(done){
    var user = {
      login_counter: 2,
      incrementLoginCount: () => {
        var defer = q.defer();
        defer.resolve();
        return defer.promise;
      },
      toggleDisabled: () => {
        var defer = q.defer();
        defer.resolve();
        return defer.promise;
      }
    };

    var incrementLoginCountSpy = sinon.spy(user, 'incrementLoginCount');
    var toggleDisabledSpy = sinon.spy(user, 'toggleDisabled');

    var mockedUserService = {
      findByUsername: () => {
        var defer = q.defer();
        defer.resolve(user);
        return defer.promise;
      }
    };

    var loginMiddleware = login(mockedUserService);
    loginMiddleware.enforce({body: {email: "foo"}, headers:{}},{}).then(() => {
      assert(incrementLoginCountSpy.calledOnce);
      assert(toggleDisabledSpy.calledWith(true));
      done();
    });
  });
});
