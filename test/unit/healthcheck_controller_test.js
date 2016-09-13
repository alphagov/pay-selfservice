var proxyquire = require('proxyquire');
var should     = require('chai').should();
var chai       = require('chai');
var assert     = chai.assert;
var sinon      = require('sinon');


describe('health check controller', function () {
  var spyingInputResponse, inputRes, mockSequelizerConfig;

  beforeEach(function() {
   inputRes = {
        status: function(code) {},
        setHeader: function(key, value){},
        json: function(data){}
   };
   spyingInputResponse = sinon.spy(inputRes, 'status');

   mockSequelizerConfig = function() {

    mockSequelizer = {
      authenticate: function(){},
      sync: function() {}
    };

    return {
      sequelize: mockSequelizer
    }
   }();
  });

  var healthCheckController = function (mockResponse, mockSequelizerConfig) {
      return proxyquire(__dirname + '/../../app/controllers/healthcheck_controller.js', {
        '../utils/response.js': mockResponse,
        '../utils/sequelize_config.js': mockSequelizerConfig
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
      healthCheckResponse: function (accept, res, data) {
        assert(data.database.healthy === false);
        assert(data.ping.healthy === true);
        assert(accept === 'application/json');
      }
    };

    var failedAuthenticationPromise =  { then: function(success,fail){
      fail();
    }};

    sinon.stub(mockSequelizerConfig.sequelize, "authenticate").returns(failedAuthenticationPromise);

    var controller = healthCheckController(mockResponseHandler, mockSequelizerConfig);

    controller.healthcheck(req, inputRes);

    assert(spyingInputResponse.calledWithExactly(503));
  });

  it('should set the correct response code when database is healthy after migrations complete', function(){
    var calls = 0;
    
    var mockResponseHandler = {
      healthCheckResponse: function (accept, res, data) {
        // false on first call, true on subsequent
        assert(data.database.healthy === (calls++ !== 0));
        assert(data.ping.healthy === true);
        assert(accept === 'application/json');
      }
    };

    var successfulAuthenticationPromise =  { then: function(success,fail){
      success();
    }};
    
    var syncCalled = false;
    
    var successfulSyncPromise =  {
      then: function(success){
        syncCalled = true;
        success();
        return {
          catch: function() {}
        };
      }
    };

    sinon.stub(mockSequelizerConfig.sequelize, "authenticate").returns(successfulAuthenticationPromise);
    sinon.stub(mockSequelizerConfig.sequelize, "sync").returns(successfulSyncPromise);

    var controller = healthCheckController(mockResponseHandler, mockSequelizerConfig);
    controller.healthcheck(req, inputRes);
    controller.healthcheck(req, inputRes);

    // 1x 503 first, then 200
    assert(spyingInputResponse.callCount === 1);
    assert(syncCalled);
  });
});


