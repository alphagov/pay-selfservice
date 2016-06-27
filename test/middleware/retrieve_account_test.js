var should = require('chai').should();
var assert = require('assert');
var sinon  = require('sinon');
var _      = require('lodash');
var expect = require('chai').expect;
var nock   = require('nock');
var proxyQuire = require('proxyQuire');
var paths  = require('../../app/paths.js');

var authServiceMock = function(){
  return {
    get_account_id: function(){ return 1;}
  };
}();


var retrieveAccount = proxyQuire(__dirname + '/../../app/middleware/retrieve_account.js',
{'../services/auth_service.js': authServiceMock});

describe('retrieve param test', function () {

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




  it('should call the error view if the connector fails', function (done) {
    retrieveAccount( { params: {}, body: {}, headers: {} }, response, next);
    setTimeout(function(){
      expect(next.notCalled).to.be.true;
      assert(render.calledWith( "error", { message: 'There is a problem with the payments platform' }));
      done();
    },40);
  });

  it("should set the account and emaila nd call next on success", function(done) {
      nock(process.env.CONNECTOR_URL)
        .get("/v1/frontend/accounts/1")
        .reply(200,{ foo: "bar"});
      var req =  { params: {}, body: {}, headers: {}, session: {emailNotification : "hello"}};
      retrieveAccount(req, response, next);


      var testPromise = new Promise((resolve, reject) => {
          setTimeout(() => { resolve(); }, 100);
      });

      testPromise.then((result) => {
        try {
          expect(status.calledWith(200));
          expect(next.called).to.be.true;
          expect(req.account).to.deep.equal({ foo: 'bar', customEmailText: "hello" });
          done();
        }
        catch(err) { done(err); }
      }, done);
  });





})
