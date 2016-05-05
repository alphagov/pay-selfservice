var request = require('supertest');
var sinon = require('sinon');
var app = require(__dirname + '/../server.js').getApp;

describe('The /healthcheck endpoint returned json', function () {

  it('should return 200 and be healthy', function (done) {
      var expectedResponse = {'ping': {'healthy': true}, 'database': {'healthy': false}};
      request(app)
          .get('/healthcheck')
          .set('Accept', 'application/json')
          .expect(200)
          .expect(function(res) {
            response = JSON.parse(res.text);
            expectedResponse.ping.healthy.should.equal(response.ping.healthy);
            expectedResponse.database.healthy.should.equal(response.database.healthy);
          }).end(done);
  });
  
  it('should call success function when DB connectivity is successful', function(){
    var successfulFunction = sinon.spy();
    var successfulAuthenticationPromise =  { then: function(success,fail){ success(); }};

    var mockSequelizer = function(){};
    mockSequelizer.prototype.authenticate = function(){};

    sinon.stub(mockSequelizer.prototype, "authenticate").returns(successfulAuthenticationPromise);

    dependentResourceChecker(sleeper, mockSequelizer).checkDependentResources(successfulFunction, 1);

    sinon.assert.calledOnce(successfulFunction);
  });
});