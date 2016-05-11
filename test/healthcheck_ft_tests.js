var request = require('supertest');
var sinon = require('sinon');
var app = require(__dirname + '/../server.js').getApp;

describe('The /healthcheck endpoint returned json', function () {

  it('should return 503 and be unhealthy', function (done) {
      var expectedResponse = {'ping': {'healthy': true}, 'database': {'healthy': false}};
      request(app)
          .get('/healthcheck')
          .set('Accept', 'application/json')
          .expect(503)
          .expect(function(res) {
            response = JSON.parse(res.text);
            expectedResponse.ping.healthy.should.equal(response.ping.healthy);
            expectedResponse.database.healthy.should.equal(response.database.healthy);
          }).end(done);
  });
});
