var proxyquire = require('proxyquire');
var should = require('chai').should();
var chai = require('chai');
var assert = chai.assert;
var sinon = require('sinon');

var sleeper = {
    usleep: function(duration) {}
};


var dependentResourceChecker = function (mockSleeper, mockSequelizer) {
  return proxyquire(__dirname + '/../../app/utils/dependent_resource_checker.js', {
    'sleep': mockSleeper,
    '../utils/sequelize_config.js': mockSequelizer
  })
};

describe('session', function () {

  var mockSequelizerConfig;
  beforeEach(function() {
    mockSequelizerConfig = function() {

      mockSequelizer = {
        authenticate: function(){}
      };

      return {
        sequelize: mockSequelizer
      }
    }();
  });

  it('should call success function when DB connectivity is successful', function(){
    var sucessfulFunction = sinon.spy();
    var successfulAuthenticationPromise =  { then: function(success,fail){ success(); }};

    sinon.stub(mockSequelizerConfig.sequelize, "authenticate").returns(successfulAuthenticationPromise);

    dependentResourceChecker(sleeper, mockSequelizerConfig).checkDependentResources(sucessfulFunction, 1);

    sinon.assert.calledOnce(sucessfulFunction);
  });

  it('should sleep on incremental intervals and check connectivity again when DB connectivity is not successful', function(){
    var sucessfulFunction = sinon.spy();

    var count = 0;
    var secondTimeSuccessfulPromise =  { then: function(success,fail){
      if (count > 1) return success();
      count++;
      fail();
    }};

    var usleepSpy = sinon.spy(sleeper, 'usleep');
    sinon.stub(mockSequelizerConfig.sequelize, "authenticate").returns(secondTimeSuccessfulPromise);

    dependentResourceChecker(sleeper, mockSequelizerConfig).checkDependentResources(sucessfulFunction, 0.1);

    sinon.assert.calledOnce(sucessfulFunction);
    assert(usleepSpy.calledWithExactly(100000));
    assert(usleepSpy.calledWithExactly(200000));
    assert(usleepSpy.callCount == 2);
  });

  it('should log that Database is not available and we are retrying, when database connectivity is not successful', function() {
    var sucessfulFunction = sinon.spy();

    var count = 0;
    var secondTimeSuccessfulPromise =  { then: function(success,fail){
      if (count > 1) return success();
      count++;
      fail("Error");
    }};

    sinon.stub(mockSequelizerConfig.sequelize, "authenticate").returns(secondTimeSuccessfulPromise);

    var consoleSpy = sinon.spy(console, 'log');

    dependentResourceChecker(sleeper, mockSequelizerConfig).checkDependentResources(sucessfulFunction, 0.1);

    assert(consoleSpy.getCall(0).args[0] === "Checking for Database connectivity");
    assert(consoleSpy.getCall(1).args[0] === "Unable to connect to the database: Error");
    assert(consoleSpy.getCall(2).args[0] === "DB not available. Sleeping for 0.1 seconds -> attempt 1");
    assert(consoleSpy.getCall(3).args[0] === "Checking for Database connectivity");
    assert(consoleSpy.getCall(4).args[0] === "Unable to connect to the database: Error");
    assert(consoleSpy.getCall(5).args[0] === "DB not available. Sleeping for 0.2 seconds -> attempt 2");
    assert(consoleSpy.getCall(6).args[0] === "Checking for Database connectivity");
    assert(consoleSpy.getCall(7).args[0] === "Connection has been established successfully.");

  });

});
