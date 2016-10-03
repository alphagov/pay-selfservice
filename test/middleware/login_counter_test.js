var should = require('chai').should();
var assert = require('assert');
var sinon  = require('sinon');
var _      = require('lodash');
var expect = require('chai').expect;
var nock   = require('nock');
var proxyquire = require('proxyquire');

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

  var login = (userMock)=> {
    return proxyquire(__dirname + '/../../app/middleware/login_counter.js',
    {'../models/user.js': userMock});
  };

  it('should call increment login count',function(){
    var user = {
      find: ()=> {
        return  {
          then: (success,fail)=> {
            success({
              login_counter: 0,
              incrementLoginCount: () => {
                assert("increment is called","increment is called")
                return { then: (suc,fail)=> suc()}
              }
            })
          }
        }
      }
    };

    var loginMiddleware = login(user);
    loginMiddleware.enforce({body: {email: "foo"}},{
    },()=> assert("next is called","next is called"))
  });

  it('should call disable user and render noacess when over limit',function(){

    var user = {
      find: ()=> { 
        return  { 
          then: (success,fail)=> {
            success({
              login_counter: 100,
              incrementLoginCount: () => {
                assert("increment is called",false)
                return { then: (suc,fail)=> suc()}
              },
              toggleDisabled: (boolean)=> {
                assert(boolean, true);
                return { then: (suc)=> suc() }
              }
            })
          }
        }
      }
    };

    var loginMiddleware = login(user);
    loginMiddleware.enforce({body: {email: "foo"}},{
      render: (path) => assert("login/noaccess",path)
    },()=> assert("next is called",false))
  });

  it('should retrieve safely email field',function(){
    var user = {
      find: ()=> {
        return  {
          then: (success,fail)=> {
            success({
              login_counter: 0,
              incrementLoginCount: () => {
                assert("increment is called","increment is called");
                return { then: (suc,fail)=> suc()}
              }
            })
          }
        }
      }
    };
    var loginMiddleware = login(user);
    loginMiddleware.enforce({body:{}},{
    },()=> assert("next is called","next is called"))
  });
});
