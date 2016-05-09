var proxyquire = require('proxyquire');
var should     = require('chai').should();
var chai       = require('chai');
var assert     = chai.assert;
var sinon      = require('sinon');


describe('health check controller', function () {
  var spyingInputResponse, inputRes, mockSequelizer;

  beforeEach(function() {
   inputRes = {
        status: function(code) {},
        setHeader: function(key, value){},
        json: function(data){}
   };
   spyingInputResponse = sinon.spy(inputRes, 'status');

   mockSequelizer = function(){};
   mockSequelizer.prototype.authenticate = function(){};
  });

  var healthCheckController = function (mockResponse, mockSequlizer) {
      return proxyquire(__dirname + '/../../app/controllers/healthcheck_controller.js', {
        '../utils/response.js': mockResponse,
        'sequelize': mockSequlizer
      })
  };

  var req = {
    headers: {
      accept: "application/json"
    }
  };

  it('should set the correct response code when database is unhealthy', function(){

    var expectedData = {
      'ping': {'healthy': true},
      'database': {'healthy': false}
    };

    var mockResponseHandler = {
      response: function (accept, res, template, data) {
        assert(data.database.healthy === false);
        assert(data.ping.healthy === true);
        assert(accept === 'application/json');
        assert(template === null);
      }
    };

    var failedAuthenticationPromise =  { then: function(success,fail){
      fail();
    }};

    sinon.stub(mockSequelizer.prototype, "authenticate").returns(failedAuthenticationPromise);

    var controller = healthCheckController(mockResponseHandler, mockSequelizer);

    controller.healthcheck(req, inputRes);

    assert(spyingInputResponse.calledWithExactly(503));
  });

  it('should set the correct response code when database is healthy', function(){

    var expectedData = {
      'ping': {'healthy': true},
      'database': {'healthy': true}
    };

    var mockResponseHandler = {
      response: function (accept, res, template, data) {
        assert(data.database.healthy === true);
        assert(data.ping.healthy === true);
        assert(accept === 'application/json');
        assert(template === null);
      }
    };

    var successfulAuthenticationPromise =  { then: function(success,fail){
      success();
    }};

    sinon.stub(mockSequelizer.prototype, "authenticate").returns(successfulAuthenticationPromise);

    var controller = healthCheckController(mockResponseHandler, mockSequelizer);

    controller.healthcheck(req, inputRes);

    assert(spyingInputResponse.callCount === 0);
  });
});


