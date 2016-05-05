var should = require('chai').should();
var proxyquire = require('proxyquire');
var assert = require('assert');
var sinon = require('sinon');

var mockSequelizer = function(){};

mockSequelizer.prototype.query = function(){};

var successfulQueryPromise = function(mockCount) {
    return { spread: function(next){
     var result = {};
     var metadata = {"rowCount":mockCount};
      next(result, metadata);
    }}
};

var database = proxyquire(__dirname + '/../../app/utils/database.js', {
                'sequelize': mockSequelizer }
                );

describe('database util', function () {

  afterEach(function(){
    mockSequelizer.prototype.query.restore();
  });

  it('should inform if no session found', function () {

    sinon.stub(mockSequelizer.prototype,"query").returns(successfulQueryPromise(0));
    var next = sinon.spy();

    database.deleteSession('nonexistanttest@test.com', next);
    assert(next.calledWith(0));
  });

  it('should delete session if session found for the given email', function () {

   sinon.stub(mockSequelizer.prototype,"query").returns(successfulQueryPromise(1));

    var next = sinon.spy();
    database.deleteSession('existanttest@test.com', next);
    assert(next.calledWith(1));
  });

});
