var request = require('supertest');
var app = require(__dirname + '/../server.js').getApp;

describe('The /healthcheck endpoint returned json', function () {

  it('should return 200 and be healthy', function (done) {
      var expectedResponse = {'ping': {'healthy': true}};
      request(app)
          .get('/healthcheck')
          .set('Accept', 'application/json')
          .expect(200)
          .expect(function(res) {
            response = JSON.parse(res.text);
            expectedResponse.ping.healthy.should.equal(response.ping.healthy);
          }).end(done);
  });
});